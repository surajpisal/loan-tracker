import { get } from '@vercel/blob';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Prevent browser & CDN from caching stale data
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

  try {
    const result = await get('loans-data.json', { 
      access: 'private',
      useCache: false 
    });

    if (!result || !result.stream) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Read the private stream and send JSON response
    const chunks = [];
    for await (const chunk of result.stream) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);
    const data = JSON.parse(buffer.toString('utf-8'));

    return res.status(200).json(data);
  } catch (error) {
    console.error('Blob read error:', error);
    return res.status(404).json({ error: error.message });
  }
}
