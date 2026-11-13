-- ============================================================
-- TAZQOR — Allow inserting/deleting invoice_item_batches via RLS
-- Migration: 20240014_invoice_item_batches_rls.sql
-- ============================================================
-- Ensures combo pack finalization and draft item deletions succeed
-- under authenticated user RLS policies when SUPABASE_SERVICE_ROLE_KEY
-- is not configured in production environments like Vercel.
-- ============================================================

-- 1. invoice_item_batches INSERT policy
DROP POLICY IF EXISTS "invoice_item_batches_insert" ON public.invoice_item_batches;
CREATE POLICY "invoice_item_batches_insert"
  ON public.invoice_item_batches FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.invoice_items ii
      WHERE ii.id = invoice_item_batches.invoice_item_id
        AND ii.business_id = public.current_business_id()
    )
  );

-- 2. invoice_item_batches DELETE policy
DROP POLICY IF EXISTS "invoice_item_batches_delete" ON public.invoice_item_batches;
CREATE POLICY "invoice_item_batches_delete"
  ON public.invoice_item_batches FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.invoice_items ii
      WHERE ii.id = invoice_item_batches.invoice_item_id
        AND ii.business_id = public.current_business_id()
    )
  );

-- 3. invoice_item_batches UPDATE policy
DROP POLICY IF EXISTS "invoice_item_batches_update" ON public.invoice_item_batches;
CREATE POLICY "invoice_item_batches_update"
  ON public.invoice_item_batches FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.invoice_items ii
      WHERE ii.id = invoice_item_batches.invoice_item_id
        AND ii.business_id = public.current_business_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.invoice_items ii
      WHERE ii.id = invoice_item_batches.invoice_item_id
        AND ii.business_id = public.current_business_id()
    )
  );

-- 4. stock_movements DELETE policy (for rollback on finalization errors)
DROP POLICY IF EXISTS "stock_movements_delete" ON public.stock_movements;
CREATE POLICY "stock_movements_delete"
  ON public.stock_movements FOR DELETE
  USING (business_id = public.current_business_id());

-- 5. Add invoice_terms column to business_settings so custom terms persist
--    across all devices and environments (localhost, Vercel, mobile)
ALTER TABLE public.business_settings
  ADD COLUMN IF NOT EXISTS invoice_terms JSONB DEFAULT NULL;
