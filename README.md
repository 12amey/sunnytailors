# Sunny Tailor

Responsive customer and measurement book with English/Marathi interface, Supabase persistence, and optional Marathi handwriting extraction with Gemini. Measurement fields include height, blouse back length, chest, waist, arm length, paired arm measurements, and front/back neck; notebook dates and customer-specific design sketches are stored with the record.

## Supabase setup

1. Open the Supabase project SQL Editor.
2. Run [`supabase/schema.sql`](supabase/schema.sql). If the app is already set up, run it again to add the batch-import, notebook date, and design sketch fields; the script is safe to rerun.
3. Add these build variables in Netlify under **Project configuration → Environment variables**:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

The publishable key is intentionally used in the browser. The SQL file grants the unauthenticated `anon` role full access because this app was requested without a login or PIN. **Anyone who finds the public site and project key can read, add, edit, or delete every customer record.** Do not use this configuration for private customer data. To protect records later, replace these public policies with authenticated access or a server-side gate.

## Gemini image scanning

Set `GEMINI_API_KEY` as a private Netlify environment variable. Do not prefix it with `NEXT_PUBLIC_`, add it to a client file, or commit it. Optionally set `GEMINI_MODEL`; the default is `gemini-3.8-flash`.

If a scan fails, the app displays Google's HTTP category and message. A `401` means the key is invalid, a `403` means API access/project restrictions, a `404` means the configured model is unavailable, and a `429` means the Gemini quota or rate limit was reached. The app falls back to `gemini-3.6-flash` when the selected model returns a temporary `503` overload. Google lists both models as supporting images and structured output; check the private Netlify `GEMINI_MODEL` override if an error names another model.

**Scan Marathi note** sends one customer's photo through a Netlify Function to Google Gemini and returns an editable draft. **Bulk import** accepts multiple notebook photos; each photo can contain multiple customer sections, and readable entries are saved directly without a confirmation step. The same page will not be imported twice. The app does not store uploaded images. Handwriting recognition can make mistakes, so check saved records after an import. Since both scan functions are public, set API quotas in Google AI Studio and monitor usage.

## Local development

```sh
npm install
cp .env.example .env.local
npm run dev
```

Fill the Supabase values in `.env.local`. To run Netlify Functions locally, install the Netlify CLI and use `netlify dev` after setting `GEMINI_API_KEY` in the local environment.

Netlify builds the site with `npm run build` and publishes `dist/`. The app uses the supplied `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` variable names through the Vite build configuration.
