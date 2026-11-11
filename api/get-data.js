import { list } from '@vercel/blob';

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
    // 1. Locate the file in the blob store using list()
    const { blobs } = await list({
      prefix: 'loans-data.json',
      token: token
    });

    if (!blobs || blobs.length === 0) {
      return res.status(404).json({ error: 'No data file found in Blob store yet' });
    }

    // 2. Fetch the content passing the token for authorization
    const downloadResponse = await fetch(`${blobs[0].url}?t=${Date.now()}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!downloadResponse.ok) {
      return res.status(downloadResponse.status).json({ 
        error: `Storage returned HTTP ${downloadResponse.status}` 
      });
    }

    const data = await downloadResponse.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error('Blob fetch error:', error);
    return res.status(500).json({ error: error.message });
  }
}
