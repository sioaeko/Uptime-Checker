import { kv } from '@vercel/kv';
import axios from 'axios';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { url, interval } = req.body;
    try {
      const startTime = Date.now();
      const response = await axios.get(url);
      const responseTime = Date.now() - startTime;
      const monitor = {
        url,
        interval,
        status: 'up',
        responseTime,
        lastChecked: new Date().toISOString(),
        ssl: {
          valid: true,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // Dummy expiration date
        },
      };
      await kv.set(`monitor:${url}`, JSON.stringify(monitor));
      res.status(200).json(monitor);
    } catch (error) {
      console.error('Error adding URL:', error);
      const monitor = {
        url,
        interval,
        status: 'down',
        responseTime: 0,
        lastChecked: new Date().toISOString(),
        ssl: {
          valid: false,
          expiresAt: null,
        },
      };
      await kv.set(`monitor:${url}`, JSON.stringify(monitor));
      res.status(200).json(monitor);
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
}
