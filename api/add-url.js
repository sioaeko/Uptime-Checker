const axios = require('axios');

async function checkUrl(url) {
  try {
    const start = Date.now();
    const response = await axios.get(url, { 
      timeout: 5000,
      validateStatus: false // 모든 상태 코드를 허용합니다.
    });
    const responseTime = Date.now() - start;

    let sslInfo = { valid: false, expiresAt: null };
    
    if (url.startsWith('https://')) {
      try {
        const urlObj = new URL(url);
        const sslResponse = await axios.get(`https://ssl-checker.io/api/v1/check/${urlObj.hostname}`, {
          timeout: 10000
        });
        
        if (sslResponse.data && sslResponse.data.certInfo) {
          const expirationDate = new Date(sslResponse.data.certInfo.validTo);
          sslInfo = {
            valid: expirationDate > new Date(),
            expiresAt: expirationDate.toISOString()
          };
        }
      } catch (error) {
        console.error('Error checking SSL:', error);
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
