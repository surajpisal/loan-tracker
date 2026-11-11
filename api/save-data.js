import { put } from '@vercel/blob';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    return res.status(500).json({ error: 'Missing BLOB_READ_WRITE_TOKEN' });
  }

  try {
    let payload = req.body;
    if (typeof payload === 'string') {
      try {
        payload = JSON.parse(payload);
      } catch (e) {}
    }

    const jsonString = typeof payload === 'object' ? JSON.stringify(payload, null, 2) : payload;

    const blob = await put('loans-data.json', jsonString, {
      access: 'public',
      addRandomSuffix: false,
      token: token,
      contentType: 'application/json'
    });

    return res.status(200).json({ success: true, url: blob.url });
  } catch (error) {
    console.error('Blob save error:', error);
    return res.status(500).json({ error: error.message });
  }
}
