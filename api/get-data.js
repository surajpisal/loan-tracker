import { get } from '@vercel/blob';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    return res.status(500).json({ error: 'Missing BLOB_READ_WRITE_TOKEN' });
  }

  try {
    // With @vercel/blob latest, get() works natively on private stores
    const blobResult = await get('loans-data.json', {
      access: 'private',
      token: token
    });

    if (!blobResult || !blobResult.stream) {
      return res.status(404).json({ error: 'No data file found in Blob store yet' });
    }

    const chunks = [];
    for await (const chunk of blobResult.stream) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);
    const data = JSON.parse(buffer.toString('utf-8'));

    return res.status(200).json(data);
  } catch (error) {
    console.error('Blob fetch error:', error);
    return res.status(404).json({ error: error.message });
  }
}
