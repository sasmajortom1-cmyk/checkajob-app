# CheckaJob – Amateur DIY Assessment Site

This is a minimal proof‑of‑concept implementation of the **CheckaJob** MVP described in the product specification. It allows amateur DIYers to submit a description of a job, choose their skill level and receive a risk assessment along with steps, tools, materials and safety notes. When running locally with an OpenAI API key, the assessment will be powered by GPT‑4; otherwise a simple internal knowledge base is used.

## Getting started locally

To run this project locally you’ll need [Node.js](https://nodejs.org) installed (version 18 or newer recommended). Because this repository is a skeleton generated in an offline environment, you must install dependencies yourself after cloning it.

```bash
# install dependencies (uses npm by default)
npm install

# create a `.env.local` file with your OpenAI API key (optional but recommended)
echo "OPENAI_API_KEY=sk-..." > .env.local

# run the development server
npm run dev

# then open http://localhost:3000 in your browser
```

If you don’t set an `OPENAI_API_KEY`, the API route will fall back to a built‑in knowledge base. This database contains only a handful of common jobs and is intended for demonstration purposes only.

## Architecture overview

* **Next.js 14 (App Router)** – provides the frontend and API routes.
* **Tailwind CSS** – used for styling.
* **OpenAI** – used to generate assessments when an API key is provided. The API call is abstracted behind a fallback that uses a small in‑memory knowledge base.
* **Prisma & Supabase** – not yet implemented in this skeleton. The product specification calls for persisting assessments; you can extend this project with Prisma models in `prisma/schema.prisma` and connect to a Supabase Postgres database.

## Extending this project

* **Image upload & vision** – add an API route at `/api/assess/vision` that accepts a multipart file or image URL and forwards it to the OpenAI vision API. You will need to store temporary images in object storage (e.g. Supabase Storage or S3) and include the URL in the request.
* **Saving and sharing assessments** – set up a Supabase database and add a Prisma schema (`prisma/schema.prisma`) matching the data model in the product specification. Use [NextAuth](https://next-auth.js.org) or [Clerk](https://clerk.com) for optional account creation and implement saving/loading endpoints.
* **Store lookup** – integrate a geocoding API (OpenStreetMap/Nominatim or Mapbox) to find nearby DIY stores based on the user’s postcode. Convert the tools/materials lists into a shopping list format and show store locations on a map.

## Deployment

This project is designed to run serverless on Vercel. After configuring your `OPENAI_API_KEY` as a Vercel environment variable, you can import this repository into Vercel and deploy directly. For image uploads and database connectivity you will also need to set up Supabase or another backend service and add the corresponding environment variables.