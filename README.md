# Krafzee

Krafzee is a modern online handmade marketplace.

- Handmade & Artisan Market: USA hand-crafted products created in the USA.

## Tech Stack

- React
- Vite
- React Router
- Supabase Auth and database
- JavaScript

## Local Setup

Install dependencies:

```bash
npm install
```

Create a local `.env` file from the example:

```bash
cp .env.example .env
```

Set these values in `.env`:

```bash
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Run the development server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Run lint:

```bash
npm run lint
```

## Supabase Tables

Expected core tables:

- `profiles`
- `booths`
- `listings`
- `projects`

The app expects Supabase Auth users to have a matching `profiles` row. Booth management uses `auth.users.id` as `booths.owner_id`.

## Supabase Migrations

Run SQL files from `supabase/migrations` in Supabase SQL Editor when a feature needs database or storage changes.

Current migrations:

- `001_booth_thumbnail_storage.sql`
- `002_listing_items_storage.sql`

Run them in order.

## Vercel Routing

`vercel.json` rewrites app routes to `index.html` so pages like `/seller-dashboard` work after refresh.

## GitHub Notes

Do not commit `.env`. Use `.env.example` to document required environment variables.

Recommended repository root is this folder:

```bash
C:\python\Krafzee\krafzee
```


## Listing checklist, galleries, and drafts

Apply `supabase/migrations/007_listing_galleries_drafts.sql` before deploying this frontend. It adds `listings.image_urls` and an owner-only `listing_drafts` table. Existing listings keep their single-photo fallback. Drafts do not enter public listing queries; their photos use the existing public listing-image bucket, so image URLs are accessible to anyone who has the URL.

Sellers complete five validated steps, save partial drafts, resume them under Listed Items, and publish once ready. Photos support up to ten JPG/PNG/WebP files, each up to 10 MB. Reordering the first photo sets the cover. Product pages and browse/booth cards support galleries, and product pages link to adjacent visible items in the same market, ordered by title and ID.

Run `node --test src/data/listingProgress.test.js`, `npm run lint`, and `npm run build`. Browser verification should cover draft save/reload/resume, photo ordering and removal, publication failure/retry, keyboard and touch gallery navigation, and narrow screens. Database RLS must also be verified against a migrated test project with two different sellers before release.
