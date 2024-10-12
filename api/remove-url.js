module.exports = async (req, res) => {
  if (req.method === 'DELETE') {
    const { url } = req.query;
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    try {
      // 이 부분에서는 실제로 데이터베이스에서 URL을 제거해야 합니다.
      // 여기서는 간단한 예시로 대체합니다.
      res.status(200).json({ success: true, message: 'URL removed successfully' });
    } catch (error) {
      console.error('Error removing URL:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    res.setHeader('Allow', ['DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
};
