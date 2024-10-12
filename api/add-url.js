const axios = require('axios');
const https = require('https');

async function checkUrl(url) {
  console.log(`Checking URL: ${url}`);
  try {
    const start = Date.now();
    const response = await axios.get(url, { 
      timeout: 5000,
      validateStatus: false,
      httpsAgent: new https.Agent({  
        rejectUnauthorized: false
      })
    });
    const responseTime = Date.now() - start;

    console.log(`Response status: ${response.status}, time: ${responseTime}ms`);

    let sslInfo = { valid: false, expiresAt: null };
    
    if (url.startsWith('https://')) {
      try {
        console.log('Checking SSL...');
        const urlObj = new URL(url);
        const sslResponse = await axios.get(`https://${urlObj.hostname}`, {
          httpsAgent: new https.Agent({  
            rejectUnauthorized: false
          })
        });
        
        const cert = sslResponse.request.res.socket.getPeerCertificate();
        console.log('Certificate info:', cert);

        if (cert && cert.valid_to) {
          const expirationDate = new Date(cert.valid_to);
          sslInfo = {
            valid: expirationDate > new Date(),
            expiresAt: expirationDate.toISOString()
          };
          console.log('SSL info:', JSON.stringify(sslInfo));
        } else {
          console.log('Unable to get SSL certificate information');
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

module.exports = { checkUrl };
