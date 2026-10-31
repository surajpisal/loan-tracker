import { list } from '@vercel/blob';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Prevent browser/CDN caching of old loan values
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    return res.status(500).json({ error: 'Missing BLOB_READ_WRITE_TOKEN' });
  }

  try {
    // 1. Find the file in your private blob store
    const { blobs } = await list({ 
      prefix: 'loans-data.json',
      token: token 
    });

    if (!blobs || blobs.length === 0) {
      return res.status(404).json({ error: 'No data file found in Blob store yet' });
    }

    const fileUrl = blobs[0].url;

    // 2. Fetch the private file using Bearer authorization token
    const fileResponse = await fetch(`${fileUrl}?t=${Date.now()}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!fileResponse.ok) {
      return res.status(fileResponse.status).json({ 
        error: `Blob storage returned status ${fileResponse.status}` 
      });
    }

    const data = await fileResponse.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error('Blob fetch error:', error);
    return res.status(500).json({ error: error.message });
  }
}
