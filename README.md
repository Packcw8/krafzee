# Krafzee

Krafzee is an online flea market and yard sale marketplace with two shopping aisles:

- Handmade & Artisan Market: USA hand-crafted products created in the USA.
- Jumble Market: tools, car parts, furniture, electronics, collectibles, garden goods, salvage, and useful odds and ends.

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

## GitHub Notes

Do not commit `.env`. Use `.env.example` to document required environment variables.

Recommended repository root is this folder:

```bash
C:\python\Krafzee\krafzee
```
