# Sunny Tailor

Responsive customer and measurement book with English/Marathi interface, Supabase persistence, and optional Marathi handwriting extraction with Gemini.

## Supabase setup

1. Open the Supabase project SQL Editor.
2. Run [`supabase/schema.sql`](supabase/schema.sql) once.
3. Add these build variables in Netlify under **Project configuration → Environment variables**:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

The publishable key is intentionally used in the browser. The SQL file grants the unauthenticated `anon` role full access because this app was requested without a login or PIN. **Anyone who finds the public site and project key can read, add, edit, or delete every customer record.** Do not use this configuration for private customer data. To protect records later, replace these public policies with authenticated access or a server-side gate.

## Gemini image scanning

Set `GEMINI_API_KEY` as a private Netlify environment variable. Do not prefix it with `NEXT_PUBLIC_`, add it to a client file, or commit it. Optionally set `GEMINI_MODEL`; the default is `gemini-3.8-flash`.

When a user clicks **Scan Marathi note**, the selected image is sent through a Netlify Function to Google Gemini and returned as an editable draft. The app does not store the uploaded image, and it does not save the extracted record until the user confirms the form. Review values carefully; handwriting recognition can make mistakes. Since the scan function is public, set API quotas in Google AI Studio and monitor usage.

## Local development

```sh
npm install
cp .env.example .env.local
npm run dev
```

Fill the Supabase values in `.env.local`. To run Netlify Functions locally, install the Netlify CLI and use `netlify dev` after setting `GEMINI_API_KEY` in the local environment.

Netlify builds the site with `npm run build` and publishes `dist/`. The app uses the supplied `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` variable names through the Vite build configuration.
