const express = require('express');
const path = require('path');
const axios = require('axios');
const https = require('https');
const schedule = require('node-schedule');
const WebSocket = require('ws');

const app = express();
const port = process.env.PORT || 3000;

// WebSocket 서버 설정
const server = app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
const wss = new WebSocket.Server({ server });

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

const siteStatus = {};

// 모든 클라이언트에게 상태 업데이트 브로드캐스트
function broadcastStatusUpdate(url, status, responseTime) {
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ url, status, responseTime }));
        }
    });
}

// URL 체크 함수
async function checkUrl(url) {
    try {
        const start = Date.now();
        const response = await axios.get(url, { 
            httpsAgent: new https.Agent({ rejectUnauthorized: false }),
            timeout: 5000
        });
        const responseTime = Date.now() - start;

        const status = response.status < 400 ? 'up' : 'down';

        return {
            status,
            responseTime
        };
    } catch (error) {
        return { status: 'down', error: error.message, responseTime: 0 };
    }
}

// URL 추가 및 체크 라우트
app.post('/api/add-url', async (req, res) => {
    const { url } = req.body;
    if (!url) {
        return res.status(400).json({ error: 'URL is required' });
    }

    const result = await checkUrl(url);
    siteStatus[url] = {
        ...result,
        lastChecked: new Date(),
        downHistory: []
    };

    // 주기적 체크 스케줄 설정
    schedule.scheduleJob(`*/1 * * * * *`, async () => {
        const newResult = await checkUrl(url);
        if (newResult.status !== siteStatus[url].status) {
            broadcastStatusUpdate(url, newResult.status, newResult.responseTime);
        }
        siteStatus[url] = { ...siteStatus[url], ...newResult, lastChecked: new Date() };
    });

    res.json(siteStatus[url]);
});

// 현재 상태 확인 라우트
app.get('/api/check-status', (req, res) => {
    const { url } = req.query;
    if (siteStatus[url]) {
        res.json(siteStatus[url]);
    } else {
        res.status(404).json({ error: 'URL not found' });
    }
});
