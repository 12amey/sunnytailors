const fieldNames = [
  'pants_length', 'top_length', 'waist', 'hip',
  'sleeve_length', 'sleeve_width', 'front_neck', 'back_neck',
];
const scansByIp = new Map();

const responseSchema = {
  type: 'OBJECT',
  properties: {
    name: { type: 'OBJECT', properties: { value: { type: 'STRING' }, confidence: { type: 'NUMBER' } }, required: ['value', 'confidence'] },
    phone: { type: 'OBJECT', properties: { value: { type: 'STRING' }, confidence: { type: 'NUMBER' } }, required: ['value', 'confidence'] },
    notes: { type: 'OBJECT', properties: { value: { type: 'STRING' }, confidence: { type: 'NUMBER' } }, required: ['value', 'confidence'] },
    garment_type: { type: 'OBJECT', properties: { value: { type: 'STRING' }, confidence: { type: 'NUMBER' } }, required: ['value', 'confidence'] },
    measurement_notes: { type: 'OBJECT', properties: { value: { type: 'STRING' }, confidence: { type: 'NUMBER' } }, required: ['value', 'confidence'] },
    measurements: {
      type: 'OBJECT',
      properties: Object.fromEntries(fieldNames.map((field) => [field, {
        type: 'OBJECT', properties: { value: { type: 'STRING' }, confidence: { type: 'NUMBER' } }, required: ['value', 'confidence'],
      }])),
      required: fieldNames,
    },
  },
  required: ['name', 'phone', 'notes', 'garment_type', 'measurement_notes', 'measurements'],
};

function jsonResponse(statusCode, payload) {
  return new Response(JSON.stringify(payload), {
    status: statusCode,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });
}

export default async (request) => {
  if (request.method !== 'POST') return jsonResponse(405, { error: 'Use POST to scan an image.' });
  if (!process.env.GEMINI_API_KEY) return jsonResponse(503, { error: 'Add GEMINI_API_KEY to Netlify environment variables to enable image scanning.' });

  const ip = request.headers.get('x-nf-client-connection-ip') || 'unknown';
  const now = Date.now();
  const recentScans = (scansByIp.get(ip) || []).filter((time) => now - time < 60_000);
  if (recentScans.length >= 6) return jsonResponse(429, { error: 'Too many scans in a short time. Wait one minute and try again.' });
  recentScans.push(now);
  scansByIp.set(ip, recentScans);

  const declaredSize = Number(request.headers.get('content-length') || 0);
  if (declaredSize > 14 * 1024 * 1024) return jsonResponse(413, { error: 'Choose an image smaller than 10 MB.' });

  let input;
  try { input = await request.json(); }
  catch { return jsonResponse(400, { error: 'The image request was not valid.' }); }

  if (typeof input.image !== 'string' || input.image.length > 13_000_000) return jsonResponse(413, { error: 'Choose an image smaller than 10 MB.' });
  const mimeType = String(input.mimeType || '');
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(mimeType)) return jsonResponse(415, { error: 'Use a JPG, PNG, or WebP image.' });

  const languageInstruction = input.language === 'mr'
    ? 'Write extracted Marathi text in Marathi script. Preserve the exact script and wording from the note.'
    : 'Preserve whatever script the note uses. Do not translate values into another language.';
  const prompt = `Read this tailor customer measurement note. It may be handwritten Marathi and the page may be rotated. ${languageInstruction}
Return one JSON object matching the supplied schema. Copy the customer name and phone exactly if legible. Map only clearly matching measurements to these fixed keys: pants_length, top_length, waist, hip, sleeve_length, sleeve_width, front_neck, back_neck. Keep values as written, including Marathi digits and any units. Do not convert units. Do not guess or infer. If a field is missing, unclear, or not visible, return an empty value and confidence 0. Confidence is a number from 0 to 1 for how clearly the text is readable. Use notes for other clear customer-specific instructions, garment_type for an explicitly written garment, and measurement_notes for units or general measurement context. Do not treat printed page labels as customer values.`;

  const model = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
  let upstream;
  try {
    upstream = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY },
      body: JSON.stringify({
        contents: [{ parts: [{ inline_data: { mime_type: mimeType, data: input.image } }, { text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json', responseSchema, temperature: 0.1 },
      }),
    });
  } catch {
    return jsonResponse(502, { error: 'Could not reach Google Gemini. Try again in a moment.' });
  }

  if (!upstream.ok) {
    const details = await upstream.json().catch(() => ({}));
    console.error('Gemini image scan failed:', upstream.status, details?.error?.status || 'upstream error');
    return jsonResponse(502, { error: 'Gemini could not read this image. Check the API key, model, and quota.' });
  }

  const result = await upstream.json();
  const text = result?.candidates?.[0]?.content?.parts?.find((part) => part.text)?.text;
  if (!text) return jsonResponse(502, { error: 'Gemini returned no readable fields. Try a clearer photo.' });

  try {
    const parsed = JSON.parse(text);
    return jsonResponse(200, { result: parsed });
  } catch {
    return jsonResponse(502, { error: 'Gemini returned an unreadable result. Try the scan again.' });
  }
};
