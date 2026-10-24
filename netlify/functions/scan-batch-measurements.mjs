const fieldNames = [
  'height', 'blouse_back_length', 'chest', 'arm_length', 'arm_measurements',
  'pants_length', 'top_length', 'waist', 'hip',
  'sleeve_length', 'sleeve_width', 'front_neck', 'back_neck',
];
const scansByIp = new Map();

const scanField = { type: 'OBJECT', properties: { value: { type: 'STRING' }, confidence: { type: 'NUMBER' } }, required: ['value', 'confidence'] };
const responseSchema = {
  type: 'OBJECT',
  properties: {
    customers: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          name: scanField,
          phone: scanField,
          notes: scanField,
          garment_type: scanField,
          measurement_notes: scanField,
          measurement_date: scanField,
          measurements: {
            type: 'OBJECT',
            properties: Object.fromEntries(fieldNames.map((field) => [field, scanField])),
            required: fieldNames,
          },
        },
        required: ['name', 'phone', 'notes', 'garment_type', 'measurement_notes', 'measurement_date', 'measurements'],
      },
    },
  },
  required: ['customers'],
};

function jsonResponse(statusCode, payload) {
  return new Response(JSON.stringify(payload), {
    status: statusCode,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });
}

function explainGeminiFailure(status, details) {
  const message = String(details?.error?.message || '').replace(/\s+/g, ' ').slice(0, 260);
  const suffix = message ? ` Google: ${message}` : '';
  if (status === 401) return 'Google rejected GEMINI_API_KEY. Create a valid Gemini API key and set it in Netlify environment variables as GEMINI_API_KEY, then redeploy.';
  if (status === 403) return `Google denied Gemini API access. Check that the key is enabled for Gemini and the Google project is not restricted.${suffix}`;
  if (status === 404) return `Gemini model not found. In Netlify set GEMINI_MODEL to gemini-3.8-flash, or remove the override.${suffix}`;
  if (status === 429) return `Google Gemini quota or rate limit reached. Check the project's quota in Google AI Studio and retry after it resets.${suffix}`;
  if (status === 400) return `Google rejected the scan request. Check the image and Gemini request configuration.${suffix}`;
  if (status >= 500) return `Google Gemini is temporarily unavailable (HTTP ${status}). Retry shortly.${suffix}`;
  return `Gemini request failed (HTTP ${status}). Check the key, model, and API access.${suffix}`;
}

export default async (request) => {
  if (request.method !== 'POST') return jsonResponse(405, { error: 'Use POST to scan notebook pages.' });
  if (!process.env.GEMINI_API_KEY) return jsonResponse(503, { error: 'Add GEMINI_API_KEY to Netlify environment variables to enable image scanning.' });

  const ip = request.headers.get('x-nf-client-connection-ip') || 'unknown';
  const now = Date.now();
  const recentScans = (scansByIp.get(ip) || []).filter((time) => now - time < 60_000);
  if (recentScans.length >= 12) return jsonResponse(429, { error: 'Too many pages were scanned in a short time. Wait one minute and try again.' });
  recentScans.push(now);
  scansByIp.set(ip, recentScans);

  let input;
  try { input = await request.json(); }
  catch { return jsonResponse(400, { error: 'The image request was not valid.' }); }

  if (typeof input.image !== 'string' || input.image.length > 5_600_000) return jsonResponse(413, { error: 'Choose an image smaller than 4 MB.' });
  const mimeType = String(input.mimeType || '');
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(mimeType)) return jsonResponse(415, { error: 'Use a JPG, PNG, or WebP image.' });

  const languageInstruction = input.language === 'mr'
    ? 'Write Marathi handwriting in Marathi script. Preserve the exact wording and numerals.'
    : 'Preserve the script used in the notebook. Do not translate any value.';
  const prompt = `Read this tailor's measurement notebook page. It can contain multiple separate customer entries and may be handwritten Marathi or rotated. ${languageInstruction}
Return one JSON object whose customers array has one object for each clearly separate customer entry that contains at least one clearly readable measurement. Do not merge measurements across customer sections. Copy each name and phone exactly when legible. A name can be empty when unreadable; never invent it. Extract a date as YYYY-MM-DD only when its year is clearly written; otherwise leave the date empty and preserve any readable day/month in measurement_notes. Map only clearly matching measurements to these fixed keys: height, blouse_back_length, chest, waist, arm_length, arm_measurements, pants_length, top_length, hip, sleeve_length, sleeve_width, front_neck, back_neck. Tailor-specific Marathi clues: उंची means height; पाठीची लांबी/ब्लाउज मागची लांबी means blouse_back_length; छाती or छातीचा घेर means chest; कंबर means waist; बाहीची लांबी means arm_length; paired बाही measurements or a written range such as ११-१० belongs in arm_measurements and should be preserved as one value; पुढचा गळा/गळा पुढे means front_neck. Follow this shop's known notebook order when labels are faint: a sequence like 14 1/2 - 10 1/2 - 36 - 29 - 10 means height, blouse_back_length, chest, waist, arm_length. A separate range like 11 1/2-10 1/2 is arm_measurements; 6 1/2 is front_neck. Do not misclassify the second value as back_neck unless a back-neck label is explicitly present. Keep values exactly as written, including Marathi digits and units. Do not convert units, guess, or infer. For each missing or unclear field return an empty value and confidence 0. Confidence is 0 to 1 for legibility. Use notes for other explicit customer instructions, garment_type for an explicitly written garment, and measurement_notes for units or context. Ignore printed page labels and unrelated marks. If no measurement entry is readable, return an empty customers array.`;

  const model = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
  const requestModel = (modelName) => fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelName)}:generateContent`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY },
    body: JSON.stringify({
      contents: [{ parts: [{ inline_data: { mime_type: mimeType, data: input.image } }, { text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json', responseSchema },
    }),
  });
  let upstream;
  try {
    upstream = await requestModel(model);
    if (upstream.status === 503 && model !== 'gemini-3.6-flash') {
      console.warn('Gemini selected model is under high demand; retrying batch scan with gemini-3.6-flash.');
      upstream = await requestModel('gemini-3.6-flash');
    }
  } catch {
    return jsonResponse(502, { error: 'Could not reach Google Gemini. Try again in a moment.' });
  }

  if (!upstream.ok) {
    const details = await upstream.json().catch(() => ({}));
    console.error('Gemini batch scan failed:', upstream.status, details?.error?.status || 'upstream error');
    return jsonResponse(upstream.status === 429 ? 429 : 502, { error: explainGeminiFailure(upstream.status, details) });
  }

  const result = await upstream.json();
  const text = result?.candidates?.[0]?.content?.parts?.find((part) => part.text)?.text;
  if (!text) return jsonResponse(502, { error: 'Gemini returned no readable entries. Try a clearer photo.' });
  try {
    const parsed = JSON.parse(text);
    return jsonResponse(200, { customers: Array.isArray(parsed.customers) ? parsed.customers : [] });
  } catch {
    return jsonResponse(502, { error: 'Gemini returned an unreadable result. Try scanning the page again.' });
  }
};
