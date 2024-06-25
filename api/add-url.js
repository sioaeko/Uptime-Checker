const axios = require('axios');

async function checkUrl(url) {
  console.log(`Checking URL: ${url}`);
  try {
    const start = Date.now();
    const response = await axios.get(url, { 
      timeout: 5000,
      validateStatus: false
    });
    const responseTime = Date.now() - start;

    console.log(`Response status: ${response.status}, time: ${responseTime}ms`);

    let sslInfo = { valid: false, expiresAt: null };
    
if (url.startsWith('https://')) {
  try {
    console.log('Checking SSL...');
    const urlObj = new URL(url);
    const sslResponse = await axios.get(`https://api.sslmate.com/v1/certspotter/certs?domain=${urlObj.hostname}`, {
      timeout: 10000
    });
    
    console.log('SSL check response:', JSON.stringify(sslResponse.data));
    
    if (sslResponse.data && sslResponse.data.length > 0) {
      const latestCert = sslResponse.data[0];
      const expirationDate = new Date(latestCert.not_after * 1000);
      sslInfo = {
        valid: expirationDate > new Date(),
        expiresAt: expirationDate.toISOString()
      };
      console.log('SSL info:', JSON.stringify(sslInfo));
    } else {
      console.log('SSL check response does not contain expected data');
    }
  } catch (error) {
    console.error('Error checking SSL:', error.message);
  }
} else {
  console.log('URL is not HTTPS, skipping SSL check');
}
    const result = {
      status: response.status < 400 ? 'up' : 'down',
      responseTime,
      ssl: sslInfo,
      lastChecked: new Date().toISOString(),
      downHistory: []
    };

    console.log('Final result:', JSON.stringify(result));
    return result;
  } catch (error) {
    console.error('Error in checkUrl:', error.message);
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
