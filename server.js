const express = require('express');
const path = require('path');
const axios = require('axios');
const https = require('https');
const schedule = require('node-schedule');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// 사이트 상태를 저장할 객체
const siteStatus = {};

// URL 체크 함수
async function checkUrl(url) {
    try {
        const start = Date.now();
        const response = await axios.get(url, { 
            httpsAgent: new https.Agent({ rejectUnauthorized: false }),
            timeout: 5000
        });
        const responseTime = Date.now() - start;

        // SSL 인증서 정보 확인
        const urlObj = new URL(url);
        const sslInfo = await new Promise((resolve) => {
            const req = https.request({
                host: urlObj.hostname,
                port: 443,
                method: 'GET'
            }, (res) => {
                const cert = res.socket.getPeerCertificate();
                resolve({
                    valid: res.socket.authorized,
                    expiresAt: cert.valid_to
                });
            });
            req.end();
        });

        return {
            status: 'up',
            responseTime,
            ssl: sslInfo
        };
    } catch (error) {
        return { status: 'down', error: error.message };
    }
}

// URL 추가 및 체크 라우트
app.post('/add-url', async (req, res) => {
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
    schedule.scheduleJob(`*/5 * * * *`, async () => {
        const newResult = await checkUrl(url);
        if (newResult.status === 'down' && siteStatus[url].status === 'up') {
            siteStatus[url].downHistory.push(new Date());
        }
        siteStatus[url] = { ...siteStatus[url], ...newResult, lastChecked: new Date() };
    });

    res.json(siteStatus[url]);
});

// 현재 상태 확인 라우트
app.get('/check-status/:url', (req, res) => {
    const url = decodeURIComponent(req.params.url);
    if (siteStatus[url]) {
        res.json(siteStatus[url]);
    } else {
        res.status(404).json({ error: 'URL not found' });
    }
});

// URL 삭제 라우트
app.delete('/remove-url/:url', (req, res) => {
    const url = decodeURIComponent(req.params.url);
    if (siteStatus[url]) {
        delete siteStatus[url];
        res.json({ success: true, message: 'URL removed successfully' });
    } else {
        res.status(404).json({ success: false, message: 'URL not found' });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});