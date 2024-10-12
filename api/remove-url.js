import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  if (req.method === 'DELETE') {
    const { url } = req.query;
    try {
      await kv.del(`monitor:${url}`);
      res.status(200).json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to remove URL' });
    }
  } else {
    res.setHeader('Allow', ['DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
