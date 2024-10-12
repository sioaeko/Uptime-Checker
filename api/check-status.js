const axios = require('axios');
const https = require('https');

async function checkUrl(url) {
  // 위와 동일한 checkUrl 함수 사용
}

module.exports = async (req, res) => {
  if (req.method === 'GET') {
    const { url } = req.query;
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    try {
      const result = await checkUrl(url);
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
};
