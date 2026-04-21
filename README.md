# Luxe Fitness

Responsive `Next.js + Supabase` MVP for Luxe Fitness in Perungudi, Chennai.

## Included surfaces

- Public marketing site
- Shared kiosk member check-in by unique ID
- Mobile static-QR check-in flow with phone OTP entry point
- Trainer workspace
- Admin dashboard for attendance, payments, dues, profits, and alerts

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Copy environment variables:

```bash
copy .env.example .env.local
```

3. Add your Supabase values in `.env.local`.

4. Run the app:

```bash
npm run dev
```

## Supabase notes

- Run [supabase/schema.sql](/C:/Users/viswa/OneDrive/Documents/Luxe%20Fitness/supabase/schema.sql) in your Supabase SQL editor.
- Without Supabase credentials, the app falls back to demo data so the UI and flows can still be reviewed.
- Phone OTP is wired for the QR flow and activates when Supabase is configured.

## Key routes

- `/` public site
- `/kiosk` member ID check-in
- `/check-in` static QR/mobile check-in
- `/trainer` trainer login and attendance workspace
- `/admin` admin operations dashboard
