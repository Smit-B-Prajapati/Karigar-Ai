// Vercel Serverless Function: AI Background Removal & Studio Enhancement
// Endpoint: POST /api/image/enhance

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const imagePayload = body.image || body.photo || '';
    const preset = body.preset || 'Studio Clean White';

    if (!imagePayload) {
      return res.status(400).json({ success: false, message: 'No image payload provided' });
    }

    let b64 = imagePayload;
    if (b64.includes('base64,')) {
      b64 = b64.split('base64,')[1];
    }

    // Call Remove.bg API with the configured API key
    const removeBgApiKey = process.env.REMOVE_BG_API_KEY || 'yVu6GqVqwJZqaoTrR56zkgg9';

    const response = await fetch('https://api.remove.bg/v1.0/removebg', {
      method: 'POST',
      headers: {
        'X-Api-Key': removeBgApiKey.trim(),
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        image_file_b64: b64,
        size: 'preview',
        type: 'auto',
        crop: true,
        crop_margin: '25px',
        format: 'png',
      }),
    });

    let transparentDataUrl = null;
    const contentType = response.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      const resultData = await response.json().catch(() => null);
      if (resultData && resultData.data && resultData.data.result_b64) {
        transparentDataUrl = `data:image/png;base64,${resultData.data.result_b64}`;
      }
    } else if (response.ok) {
      const buffer = await response.arrayBuffer().catch(() => null);
      if (buffer && buffer.byteLength > 0) {
        const b64Out = Buffer.from(buffer).toString('base64');
        transparentDataUrl = `data:image/png;base64,${b64Out}`;
      }
    }

    if (transparentDataUrl) {
      return res.status(200).json({
        success: true,
        isConfigured: true,
        transparentImageUrl: transparentDataUrl,
        enhancedImageUrl: transparentDataUrl,
        enhancedBase64: transparentDataUrl,
        originalImageUrl: imagePayload,
        engine: 'removebg-ai-segmentation',
        message: 'Background successfully removed with AI Segmentation',
        enhancementDetails: {
          background: `Studio Backdrop (${preset})`,
          lighting: 'AI High-Key Studio Lighting',
          backgroundRemoved: true,
        }
      });
    }

    // If Remove.bg returned an error or rate limit, return informative response
    const errTitle = resultData?.errors?.[0]?.title || 'AI segmentation could not separate background';
    return res.status(200).json({
      success: false,
      isConfigured: true,
      message: errTitle,
      originalImageUrl: imagePayload,
      fallback: 'client_studio_compositor'
    });
  } catch (error) {
    console.error('Enhance serverless function error:', error);
    return res.status(200).json({
      success: false,
      message: error.message || 'Image enhancement temporary server notice',
      fallback: 'client_studio_compositor'
    });
  }
}
