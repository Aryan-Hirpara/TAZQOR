# TAZQOR Business Manager — Deployment Guide

## 1. Vercel Deployment

1. Push your repository to GitHub / GitLab / Bitbucket.
2. Go to [vercel.com](https://vercel.com) and import the repository.
3. In Project Settings -> Environment Variables, add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (Keep server-only, never expose as NEXT_PUBLIC)
4. Set Framework Preset: **Next.js**.
5. Build command: `pnpm build`.
6. Deploy!

## 2. Supabase Storage Buckets
Create the following private storage buckets in your Supabase dashboard:
- `receipts` (Private: for expense receipts)
- `documents` (Private: for invoices, credit notes)
- `branding` (Public or signed URLs: for business logo)

Storage policies are path-scoped by business: `{business_id}/...`

## 3. PWA Installation
- **Android:** Open Chrome, navigate to your deployed domain, tap the three dots or the prompt "Install TAZQOR Business Manager" to add to Home Screen.
- **iPhone / iOS:** Open Safari, navigate to your domain, tap Share icon -> "Add to Home Screen".
