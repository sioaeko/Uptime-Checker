import { kv } from '@vercel/kv';
import axios from 'axios';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { url, interval } = req.body;
    try {
      const response = await axios.get(url);
      const monitor = {
        url,
        interval,
        status: 'up',
        responseTime: response.duration,
        lastChecked: new Date().toISOString(),
        ssl: {
          valid: true,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // Dummy expiration date
        },
      };
      await kv.set(`monitor:${url}`, JSON.stringify(monitor));
      res.status(200).json(monitor);
    } catch (error) {
      res.status(500).json({ error: 'Failed to add URL' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
