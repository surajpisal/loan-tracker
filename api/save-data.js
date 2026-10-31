import { put } from '@vercel/blob';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const data = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    
    // Upload or overwrite loans-data.json
    const blob = await put('loans-data.json', JSON.stringify(data, null, 2), {
      access: 'public',
      addRandomSuffix: false
    });

    return res.status(200).json({ success: true, url: blob.url });
  } catch (error) {
    console.error('Blob upload error:', error);
    return res.status(500).json({ error: error.message });
  }
}
