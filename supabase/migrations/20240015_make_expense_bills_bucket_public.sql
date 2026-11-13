-- ============================================================
-- TAZQOR — Make expense-bills bucket public & backfill paid_by
-- Migration: 20240015_make_expense_bills_bucket_public.sql
-- ============================================================

-- 1. Make expense-bills bucket public so anon and authenticated sessions
-- can view uploaded bill images and PDFs across localhost and Vercel
UPDATE storage.buckets
SET public = true
WHERE id = 'expense-bills';

-- 2. Storage select policy for public / anon access
DROP POLICY IF EXISTS "expense_bills_public_select" ON storage.objects;
CREATE POLICY "expense_bills_public_select"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'expense-bills');

-- 3. Backfill paid_by and expense_name from legacy description tags
UPDATE public.expenses
SET paid_by = (regexp_match(description, 'Paid by:\s*(Aryan|Yug)'))[1]
WHERE description ~* 'Paid by:\s*(Aryan|Yug)'
  AND (paid_by = 'Other' OR paid_by IS NULL);

UPDATE public.expenses
SET expense_name = (regexp_match(description, 'Expense:\s*([^|]+)'))[1]
WHERE description ~* 'Expense:\s*([^|]+)'
  AND (expense_name IS NULL OR expense_name = '');

