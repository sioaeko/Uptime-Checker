import { kv } from '@vercel/kv';
import axios from 'axios';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { url } = req.query;
    try {
      const monitorData = await kv.get(`monitor:${url}`);
      if (!monitorData) {
        return res.status(404).json({ error: 'Monitor not found' });
      }
      const monitor = JSON.parse(monitorData);

      const startTime = Date.now();
      await axios.get(url);
      const responseTime = Date.now() - startTime;

      const updatedMonitor = {
        ...monitor,
        status: 'up',
        responseTime,
        lastChecked: new Date().toISOString(),
      };
      await kv.set(`monitor:${url}`, JSON.stringify(updatedMonitor));
      res.status(200).json(updatedMonitor);
    } catch (error) {
      const monitorData = await kv.get(`monitor:${url}`);
      if (!monitorData) {
        return res.status(404).json({ error: 'Monitor not found' });
      }
      const monitor = JSON.parse(monitorData);

      const updatedMonitor = {
        ...monitor,
        status: 'down',
        responseTime: 0,
        lastChecked: new Date().toISOString(),
      };
      await kv.set(`monitor:${url}`, JSON.stringify(updatedMonitor));
      res.status(200).json(updatedMonitor);
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
