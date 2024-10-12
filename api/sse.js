import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const { url } = req.query;
  if (!url) {
    res.status(400).end('URL is required');
    return;
  }

  const sendStatus = async () => {
    const status = await kv.get(`status:${url}`);
    if (status) {
      res.write(`data: ${status}\n\n`);
    }
  };

  // 초기 상태 전송
  await sendStatus();

  // 10초마다 상태 업데이트
  const intervalId = setInterval(sendStatus, 10000);

  // 연결이 닫히면 인터벌 정리
  req.on('close', () => {
    clearInterval(intervalId);
    res.end();
  });
}
