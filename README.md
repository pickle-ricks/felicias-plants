# Felicia's Plants (Next.js)

This project is now a Next.js app located in `web/`, deployed on Netlify.

## Development

1. Navigate to the app directory:
   - `cd web`
2. Install dependencies:
   - `npm install`
3. Run the dev server:
   - `npm run dev`
4. Open `http://localhost:3000`

## Data

- The plant dataset is served from `web/public/Plant_Care_Guide.csv`.
- The app parses the CSV client-side with `papaparse` and displays images from `web/public/Felicias-Plants/`.

## Environment variables (optional Supabase)

Set these in your environment (or Netlify Site settings) if you want watering schedules stored in Supabase:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

If not provided, the app will still work but watering actions will be disabled.

## Deploy (Netlify)

Deployment is configured via the root `netlify.toml` to build the Next.js app in `web/` using the official Next.js Netlify plugin.

## Repo layout

- `web/` — Next.js application
  - `src/app/` — routes and UI
  - `public/` — images and `Plant_Care_Guide.csv`
  - `src/lib/supabaseClient.ts` — optional Supabase client

