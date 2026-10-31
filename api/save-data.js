import { put } from '@vercel/blob';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    return res.status(500).json({ error: 'Missing BLOB_READ_WRITE_TOKEN environment variable' });
  }

  try {
    const data = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

    const blob = await put('loans-data.json', JSON.stringify(data, null, 2), {
      access: 'private',
      addRandomSuffix: false,
      allowOverwrite: true, // Required to permit overwriting an existing file
      token: token
    });

    return res.status(200).json({ success: true, url: blob.url });
  } catch (error) {
    console.error('Blob save error:', error);
    return res.status(500).json({ error: error.message });
  }
}
