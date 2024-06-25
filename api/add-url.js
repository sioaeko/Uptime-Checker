const axios = require('axios');
const https = require('https');

module.exports = async (req, res) => {
  if (req.method === 'POST') {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    try {
      const result = await checkUrl(url);
      res.status(200).json(result);
    } catch (error) {
      console.error('Error checking URL:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
};

async function checkUrl(url) {
  try {
    const start = Date.now();
    const response = await axios.get(url, { 
      httpsAgent: new https.Agent({ rejectUnauthorized: false }),
      timeout: 5000
    });
    const responseTime = Date.now() - start;

    let sslInfo = { valid: false, expiresAt: null };
    
    if (url.startsWith('https://')) {
      try {
        const urlObj = new URL(url);
        sslInfo = await new Promise((resolve) => {
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
          req.on('error', (e) => {
            console.error('Error checking SSL:', e);
            resolve({ valid: false, expiresAt: null });
          });
          req.end();
        });
      } catch (error) {
        console.error('Error checking SSL:', error);
      }
    }

    return {
      status: 'up',
      responseTime,
      ssl: sslInfo,
      lastChecked: new Date(),
      downHistory: []
    };
  } catch (error) {
    return { status: 'down', error: error.message, lastChecked: new Date(), downHistory: [new Date()] };
  }
}
