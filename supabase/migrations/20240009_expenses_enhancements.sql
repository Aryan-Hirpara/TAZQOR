-- ============================================================
-- TAZQOR Business Manager — Expense Name, Paid By & Bill Bucket
-- Migration: 20240009_expenses_enhancements.sql
-- ============================================================

-- 1. Add structured expense_name and required paid_by columns
ALTER TABLE public.expenses
  ADD COLUMN IF NOT EXISTS expense_name TEXT,
  ADD COLUMN IF NOT EXISTS paid_by TEXT NOT NULL DEFAULT 'Other';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'expenses_paid_by_check'
  ) THEN
    ALTER TABLE public.expenses
      ADD CONSTRAINT expenses_paid_by_check
      CHECK (paid_by IN ('Aryan', 'Yug', 'Other'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_expenses_business_paid_by
  ON public.expenses (business_id, paid_by);

-- 2. Private storage bucket for expense bills (images + PDFs, 10 MB limit)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'expense-bills',
  'expense-bills',
  FALSE,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies for authenticated access scoped by business prefix
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'expense_bills_select'
  ) THEN
    CREATE POLICY "expense_bills_select"
      ON storage.objects FOR SELECT
      TO authenticated
      USING (bucket_id = 'expense-bills' AND (storage.foldername(name))[1] = public.current_business_id()::text);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'expense_bills_insert'
  ) THEN
    CREATE POLICY "expense_bills_insert"
      ON storage.objects FOR INSERT
      TO authenticated
      WITH CHECK (bucket_id = 'expense-bills' AND (storage.foldername(name))[1] = public.current_business_id()::text);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'expense_bills_update'
  ) THEN
    CREATE POLICY "expense_bills_update"
      ON storage.objects FOR UPDATE
      TO authenticated
      USING (bucket_id = 'expense-bills' AND (storage.foldername(name))[1] = public.current_business_id()::text)
      WITH CHECK (bucket_id = 'expense-bills' AND (storage.foldername(name))[1] = public.current_business_id()::text);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'expense_bills_delete'
  ) THEN
    CREATE POLICY "expense_bills_delete"
      ON storage.objects FOR DELETE
      TO authenticated
      USING (bucket_id = 'expense-bills' AND (storage.foldername(name))[1] = public.current_business_id()::text);
  END IF;
END $$;

