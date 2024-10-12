import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const keys = await kv.keys('monitor:*');
      const monitors = await Promise.all(keys.map(key => kv.get(key)));
      res.status(200).json(monitors.map(JSON.parse));
    } catch (error) {
      console.error('Error getting monitors:', error);
      res.status(500).json({ error: 'Failed to get monitors' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
