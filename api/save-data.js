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

    const bodyString = typeof payload === 'object' ? JSON.stringify(payload, null, 2) : payload;

    // Direct HTTP PUT to Vercel's Blob store endpoint — bypasses npm SDK checks
    const response = await fetch('https://blob.vercel-storage.com/loans-data.json', {
      method: 'PUT',
      headers: {
        'authorization': `Bearer ${token}`,
        'x-api-version': '7',
        'x-content-type': 'application/json',
        'content-type': 'application/json'
      },
      body: bodyString
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ error: errText });
    }

    const data = await response.json();
    return res.status(200).json({ success: true, url: data.url });
  } catch (error) {
    console.error('Save error:', error);
    return res.status(500).json({ error: error.message });
  }
}
