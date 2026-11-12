-- ============================================================
-- TAZQOR Business Manager — Permanent Order & Invoice Deletion
-- Migration: 20240011_allow_order_invoice_delete.sql
-- ============================================================
-- Adds atomic RPCs `delete_invoice_permanently` and
-- `delete_order_permanently` so finalized/cancelled invoices and
-- any customer order can be cleanly deleted while restoring all
-- deducted inventory stock and recalculating customer balances.
-- ============================================================

-- 1. Allow trigger-protected invoice & item deletion ONLY inside the
--    controlled delete_invoice_permanently transaction (app.allow_invoice_delete = 'on').
CREATE OR REPLACE FUNCTION public.trg_prevent_finalized_invoice_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF current_setting('app.allow_invoice_delete', true) = 'on' THEN
    RETURN OLD;
  END IF;

  IF OLD.status = 'finalized' OR OLD.status = 'credited' THEN
    RAISE EXCEPTION 'Finalized invoice % cannot be deleted. Use cancellation or credit notes instead.', OLD.invoice_number;
  END IF;
  RETURN OLD;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_enforce_invoice_items_immutability()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_status invoice_status;
BEGIN
  IF current_setting('app.allow_invoice_delete', true) = 'on' THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  SELECT status INTO v_status FROM public.invoices WHERE id = COALESCE(NEW.invoice_id, OLD.invoice_id);
  IF v_status = 'finalized' OR v_status = 'cancelled' OR v_status = 'credited' THEN
    RAISE EXCEPTION 'Items for finalized invoice cannot be modified or deleted.';
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- 2. Allow deleting any business order / invoice via authenticated RLS as well
DROP POLICY IF EXISTS "orders_delete_business" ON public.orders;
CREATE POLICY "orders_delete_business"
  ON public.orders FOR DELETE
  USING (business_id = public.current_business_id());

DROP POLICY IF EXISTS "invoices_delete_business" ON public.invoices;
CREATE POLICY "invoices_delete_business"
  ON public.invoices FOR DELETE
  USING (business_id = public.current_business_id());

-- 3. Atomic permanent invoice deletion + stock & payment recovery
CREATE OR REPLACE FUNCTION public.delete_invoice_permanently(
  p_business_id UUID,
  p_invoice_id UUID
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_invoice public.invoices%ROWTYPE;
  v_alloc_rec RECORD;
  v_mov_deleted INTEGER := 0;
  v_alloc_deleted INTEGER := 0;
BEGIN
  SELECT * INTO v_invoice
  FROM public.invoices
  WHERE id = p_invoice_id AND business_id = p_business_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invoice % not found', p_invoice_id;
  END IF;

  -- Reverse/remove payment allocations and adjust or remove linked payments
  FOR v_alloc_rec IN (
    SELECT payment_id, SUM(amount_allocated) AS total_alloc
    FROM public.payment_allocations
    WHERE invoice_id = p_invoice_id AND business_id = p_business_id
    GROUP BY payment_id
  ) LOOP
    DELETE FROM public.payment_allocations
    WHERE payment_id = v_alloc_rec.payment_id
      AND invoice_id = p_invoice_id
      AND business_id = p_business_id;

    v_alloc_deleted := v_alloc_deleted + 1;

    -- Subtract removed allocation from parent payment; delete payment row if nothing left
    DELETE FROM public.payments
    WHERE id = v_alloc_rec.payment_id
      AND business_id = p_business_id
      AND amount <= v_alloc_rec.total_alloc
      AND NOT EXISTS (
        SELECT 1 FROM public.payment_allocations pa
        WHERE pa.payment_id = v_alloc_rec.payment_id
      );

    UPDATE public.payments
    SET amount = GREATEST(0.01, amount - v_alloc_rec.total_alloc),
        updated_at = NOW()
    WHERE id = v_alloc_rec.payment_id
      AND business_id = p_business_id;
  END LOOP;

  -- Remove any credit notes tied to this invoice
  DELETE FROM public.credit_notes
  WHERE invoice_id = p_invoice_id AND business_id = p_business_id;

  -- Remove all stock movements tied to this invoice (sale_out & sales_return_in)
  -- Removing sale_out movements automatically recovers stock in v_stock_on_hand & v_stock_summary.
  DELETE FROM public.stock_movements
  WHERE reference_id = p_invoice_id AND business_id = p_business_id;
  GET DIAGNOSTICS v_mov_deleted = ROW_COUNT;

  -- Enable transaction-local deletion bypass for invoice + cascaded items & batches
  PERFORM set_config('app.allow_invoice_delete', 'on', true);

  DELETE FROM public.invoices
  WHERE id = p_invoice_id AND business_id = p_business_id;

  RETURN jsonb_build_object(
    'success', true,
    'invoice_id', p_invoice_id,
    'invoice_number', v_invoice.invoice_number,
    'order_id', v_invoice.order_id,
    'stock_movements_removed', v_mov_deleted,
    'allocations_removed', v_alloc_deleted
  );
END;
$$;

-- 4. Atomic permanent order deletion (+ linked invoices & stock recovery)
CREATE OR REPLACE FUNCTION public.delete_order_permanently(
  p_business_id UUID,
  p_order_id UUID,
  p_delete_linked_invoices BOOLEAN DEFAULT TRUE
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order public.orders%ROWTYPE;
  v_inv RECORD;
  v_deleted_invoices UUID[] := ARRAY[]::UUID[];
  v_mov_deleted INTEGER := 0;
BEGIN
  SELECT * INTO v_order
  FROM public.orders
  WHERE id = p_order_id AND business_id = p_business_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order % not found', p_order_id;
  END IF;

  IF p_delete_linked_invoices THEN
    FOR v_inv IN (
      SELECT id FROM public.invoices
      WHERE order_id = p_order_id AND business_id = p_business_id
    ) LOOP
      PERFORM public.delete_invoice_permanently(p_business_id, v_inv.id);
      v_deleted_invoices := array_append(v_deleted_invoices, v_inv.id);
    END LOOP;
  ELSE
    UPDATE public.invoices
    SET order_id = NULL, updated_at = NOW()
    WHERE order_id = p_order_id AND business_id = p_business_id;
  END IF;

  DELETE FROM public.stock_movements
  WHERE reference_id = p_order_id AND business_id = p_business_id;
  GET DIAGNOSTICS v_mov_deleted = ROW_COUNT;

  DELETE FROM public.orders
  WHERE id = p_order_id AND business_id = p_business_id;

  RETURN jsonb_build_object(
    'success', true,
    'order_id', p_order_id,
    'order_number', v_order.order_number,
    'deleted_invoice_ids', to_jsonb(v_deleted_invoices),
    'stock_movements_removed', v_mov_deleted
  );
END;
$$;

REVOKE ALL ON FUNCTION public.delete_invoice_permanently(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_invoice_permanently(UUID, UUID) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.delete_order_permanently(UUID, UUID, BOOLEAN) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_order_permanently(UUID, UUID, BOOLEAN) TO authenticated, service_role;

