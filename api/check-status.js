import { kv } from '@vercel/kv';
import axios from 'axios';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { url } = req.query;
    try {
      const response = await axios.get(url);
      const updatedMonitor = {
        status: 'up',
        responseTime: response.duration,
        lastChecked: new Date().toISOString(),
        ssl: {
          valid: true,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // Dummy expiration date
        },
      };
      await kv.set(`monitor:${url}`, JSON.stringify(updatedMonitor));
      res.status(200).json(updatedMonitor);
    } catch (error) {
      const updatedMonitor = {
        status: 'down',
        responseTime: 0,
        lastChecked: new Date().toISOString(),
        ssl: {
          valid: false,
          expiresAt: null,
        },
      };
      await kv.set(`monitor:${url}`, JSON.stringify(updatedMonitor));
      res.status(200).json(updatedMonitor);
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
