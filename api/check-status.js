module.exports = async (req, res) => {
  if (req.method === 'GET') {
    const { url } = req.query;
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    try {
      // 이 부분에서는 실제로 데이터베이스에서 상태를 조회해야 합니다.
      // 여기서는 간단한 예시로 대체합니다.
      const result = await checkUrl(url);
      res.status(200).json(result);
    } catch (error) {
      console.error('Error checking status:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
};

// checkUrl 함수는 add-url.js와 동일합니다.
