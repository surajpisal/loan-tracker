import { list } from '@vercel/blob';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { blobs } = await list({ prefix: 'loans-data.json' });
    
    if (!blobs || blobs.length === 0) {
      return res.status(404).json({ error: 'No data file found in Blob store' });
    }

    // Always fetch fresh data avoiding CDN caching
    const cacheBuster = `${blobs[0].url}?t=${Date.now()}`;
    const response = await fetch(cacheBuster);
    
    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to download blob content' });
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error('Blob fetch error:', error);
    return res.status(500).json({ error: error.message });
  }
}
