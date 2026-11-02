# TAZQOR Business Manager — Setup Guide

## 1. Prerequisites
- Node.js >= 20.x or 22.x
- `pnpm` (v9 recommended)
- A Supabase project (Free or Pro tier at [supabase.com](https://supabase.com))

## 2. Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Fill in the following values from your Supabase Project Settings -> API:
```env
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci... # (Optional for server actions, never exposed to browser)
```

## 3. Database Migration
Run the SQL migrations in order in your Supabase SQL Editor:
1. `supabase/migrations/20240001_initial_schema.sql` — Schema and tables
2. `supabase/migrations/20240002_indexes.sql` — Query performance indexes
3. `supabase/migrations/20240003_rls.sql` — Strict Row Level Security policies
4. `supabase/migrations/20240004_views.sql` — Stock on hand, customer balances, overdue views
5. `supabase/migrations/20240005_functions.sql` — Transactional RPC functions (FEFO, invoicing, payments)
6. `supabase/migrations/20240006_triggers.sql` — Immutability, audit logs, timestamps

Optional: To load sample cleaning-products demo data for testing:
Run `supabase/seed.sql`.

## 4. First Admin User Creation & Disabling Public Sign-ups
1. In Supabase Dashboard, go to **Authentication -> Users** -> **Add user** -> **Create user**.
2. Enter the business owner email and password.
3. In SQL editor, link the profile to a business:
```sql
INSERT INTO businesses (name) VALUES ('TAZQOR Operations') RETURNING id;
-- Use the returned id:
INSERT INTO profiles (id, business_id, full_name, role)
VALUES ('<USER-UUID-FROM-AUTH>', '<BUSINESS-UUID>', 'Owner Name', 'admin');
```
4. **Disable public sign-ups:**
   Go to **Authentication -> Providers -> Email** and uncheck **"Enable signups"**.

## 5. Running Locally
```bash
pnpm install
pnpm dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser or phone on the same Wi-Fi.
