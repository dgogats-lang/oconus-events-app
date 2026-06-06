# OCONUS Events App — Travel Ops PWA

Internal iPhone PWA for managing attendee travel at international work events.

## Stack

- **Framework:** Next.js 15 (App Router)
- **Database:** Neon Postgres via Prisma ORM
- **Auth:** Auth.js v5 + Resend (magic link email)
- **Hosting:** Vercel (auto-deploy from GitHub)
- **Styling:** Tailwind CSS

## First-time setup

### 1. Install dependencies
```bash
npm install
```

### 2. Set up environment variables
```bash
cp .env.example .env.local
```
Fill in:
- `DATABASE_URL` — your Neon connection string (from neon.tech dashboard)
- `AUTH_SECRET` — run `openssl rand -base64 32` to generate
- `AUTH_RESEND_KEY` — from resend.com/api-keys
- `EMAIL_FROM` — a verified sender in your Resend account

### 3. Push the schema to the database
```bash
npx prisma db push
```

### 4. Run locally
```bash
npm run dev
```
Open http://localhost:3000 — you'll be redirected to the login page.

## Deploy to Vercel

1. Push to GitHub
2. Import the repo in Vercel
3. Add the environment variables from `.env.local` in Vercel's project settings
4. Deploy — Vercel auto-detects Next.js

## Add a user

After deploying, add yourself via Prisma Studio or a one-time script:
```bash
npx prisma studio
```
Create a User record with your email and `role: ADMIN`.

## Data import

Before each event, run the import script to load Quickbase data:
```bash
node scripts/import.js path/to/export.csv
```
*(Script to be built — see `_decisions.md` DEC-002)*

## Project structure

```
app/                  ← Next.js source
  app/
    (app)/            ← Authenticated app routes (tab bar layout)
      today/          ← Dashboard screen
      attendees/      ← Attendee list + profiles
      movements/      ← Movements + check-in
      more/           ← Hotels, Arrivals links
    login/            ← Auth screens
    api/auth/         ← Auth.js handler
  components/
    TabBar.tsx        ← Bottom navigation
  lib/
    auth.ts           ← Auth.js config
    db.ts             ← Prisma singleton
  prisma/
    schema.prisma     ← Database schema
  public/
    manifest.json     ← PWA manifest
    icons/            ← App icons (192px, 512px — add before launch)
```

## PWA icons

Before launching, add PNG icons to `public/icons/`:
- `icon-192.png` — 192×192px
- `icon-512.png` — 512×512px

Use the brand navy `#0C2340` as the background.
