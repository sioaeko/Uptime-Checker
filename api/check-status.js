import { kv } from '@vercel/kv';
const axios = require('axios');
const https = require('https');

async function checkUrl(url) {
  console.log(`Checking URL: ${url}`);
  try {
    const start = Date.now();
    const response = await axios.get(url, { 
      timeout: 5000,
      validateStatus: false,
      httpsAgent: new https.Agent({ rejectUnauthorized: false })
    });
    const responseTime = Date.now() - start;

    let sslInfo = { valid: false, expiresAt: null };
    if (url.startsWith('https://')) {
      try {
        console.log('Checking SSL...');
        const urlObj = new URL(url);
        const sslResponse = await axios.get(`https://${urlObj.hostname}`, {
          httpsAgent: new https.Agent({ rejectUnauthorized: false })
        });
        
        const cert = sslResponse.request.res.socket.getPeerCertificate();
        if (cert && cert.valid_to) {
          const expirationDate = new Date(cert.valid_to);
          sslInfo = {
            valid: expirationDate > new Date(),
            expiresAt: expirationDate.toISOString()
          };
        }
      } catch (error) {
        console.error('Error checking SSL:', error.message);
      }
    }

    return {
      status: response.status < 400 ? 'up' : 'down',
      responseTime,
      ssl: sslInfo,
      lastChecked: new Date().toISOString(),
      downHistory: []
    };
  } catch (error) {
    return { 
      status: 'down', 
      error: error.message, 
      lastChecked: new Date().toISOString(), 
      downHistory: [new Date().toISOString()],
      ssl: { valid: false, expiresAt: null }
    };
  }
}

export default async (req, res) => {
  if (req.method === 'GET') {
    const { url } = req.query;
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    try {
      const result = await checkUrl(url);
      await kv.set(`status:${url}`, JSON.stringify(result));
      await kv.sadd('monitored_urls', url);
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
};
