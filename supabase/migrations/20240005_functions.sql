-- ============================================================
-- TAZQOR Business Manager — Database Functions (RPC)
-- Migration: 20240005_functions.sql
-- ============================================================
-- Implements single-transaction operations:
--   1. next_invoice_number (concurrency-safe row-locked counter)
--   2. finalize_invoice (idempotent, FEFO stock issue, snapshot)
--   3. cancel_invoice (reverses stock, recalculates)
--   4. record_payment (atomic payment + allocations, over-allocation check)
--   5. allocate_payment (allocate advance to invoice)
--   6. receive_stock (purchase_in movement)
--   7. adjust_stock (damage, expiry, adjustment)
--   8. convert_order_to_invoice (snapshot order lines into draft invoice)
-- ============================================================

-- ------------------------------------------------------------
-- 1. next_invoice_number
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION next_invoice_number(
  p_business_id UUID,
  p_mode invoice_mode
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_settings business_settings%ROWTYPE;
  v_fy_start_month INTEGER := 4;
  v_cur_month INTEGER;
  v_cur_year INTEGER;
  v_fy_start_year INTEGER;
  v_fy_end_year INTEGER;
  v_fy_text TEXT;
  v_prefix TEXT;
  v_next_seq INTEGER;
BEGIN
  -- Fetch business settings
  SELECT * INTO v_settings FROM business_settings WHERE business_id = p_business_id;
  IF v_settings.financial_year_start_month IS NOT NULL THEN
    v_fy_start_month := v_settings.financial_year_start_month;
  END IF;

  v_cur_month := EXTRACT(MONTH FROM CURRENT_DATE)::INTEGER;
  v_cur_year := EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER;

  IF v_cur_month >= v_fy_start_month THEN
    v_fy_start_year := v_cur_year;
  ELSE
    v_fy_start_year := v_cur_year - 1;
  END IF;
  v_fy_end_year := v_fy_start_year + 1;
  v_fy_text := v_fy_start_year::TEXT || '-' || LPAD((v_fy_end_year % 100)::TEXT, 2, '0');

  IF p_mode = 'gst' THEN
    v_prefix := COALESCE(v_settings.invoice_prefix, 'INV');
  ELSE
    v_prefix := COALESCE(v_settings.bill_prefix, 'BILL');
  END IF;

  -- Atomic row-locked sequence increment
  INSERT INTO invoice_number_counters (business_id, mode, financial_year, prefix, sequence)
  VALUES (p_business_id, p_mode, v_fy_text, v_prefix, 1)
  ON CONFLICT (business_id, mode, financial_year)
  DO UPDATE SET
    sequence = invoice_number_counters.sequence + 1,
    updated_at = NOW()
  RETURNING sequence INTO v_next_seq;

  RETURN v_prefix || '/' || v_fy_text || '/' || LPAD(v_next_seq::TEXT, 4, '0');
END;
$$;

-- ------------------------------------------------------------
-- 2. finalize_invoice
-- Single transaction: locks invoice, validates, FEFO stock allocation,
-- generates gap-free sequential invoice number, snapshots data, marks finalized.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION finalize_invoice(
  p_invoice_id UUID,
  p_idempotency_key TEXT DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_invoice invoices%ROWTYPE;
  v_business businesses%ROWTYPE;
  v_customer customers%ROWTYPE;
  v_item RECORD;
  v_batch RECORD;
  v_needed_qty NUMERIC(14,3);
  v_alloc_qty NUMERIC(14,3);
  v_batch_avail NUMERIC(14,3);
  v_inv_number TEXT;
  v_item_batch_id UUID;
  v_total_stock NUMERIC(14,3);
BEGIN
  -- Lock the invoice row
  SELECT * INTO v_invoice FROM invoices WHERE id = p_invoice_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invoice % not found', p_invoice_id;
  END IF;

  -- Idempotency check: if already finalized, return current status safely
  IF v_invoice.status = 'finalized' THEN
    RETURN jsonb_build_object(
      'status', 'already_finalized',
      'invoice_id', v_invoice.id,
      'invoice_number', v_invoice.invoice_number
    );
  END IF;

  IF v_invoice.status != 'draft' THEN
    RAISE EXCEPTION 'Only draft invoices can be finalized (current status: %)', v_invoice.status;
  END IF;

  -- Load business & customer for immutable snapshotting
  SELECT * INTO v_business FROM businesses WHERE id = v_invoice.business_id;
  SELECT * INTO v_customer FROM customers WHERE id = v_invoice.customer_id;

  -- If GST invoice, verify business has confirmed GST eligibility
  IF v_invoice.mode = 'gst' THEN
    IF NOT EXISTS (
      SELECT 1 FROM business_settings 
      WHERE business_id = v_invoice.business_id 
        AND gst_enabled = true 
        AND gst_confirmed = true 
        AND gstin IS NOT NULL 
        AND length(trim(gstin)) = 15
    ) THEN
      RAISE EXCEPTION 'GST mode is disabled: Business must confirm GST eligibility and configure valid GSTIN';
    END IF;
  END IF;

  -- FEFO Batch Allocation and Stock Movement for each invoice line item
  FOR v_item IN (
    SELECT ii.* 
    FROM invoice_items ii 
    WHERE ii.invoice_id = p_invoice_id
  ) LOOP
    v_needed_qty := v_item.quantity;

    -- Verify overall stock on hand for this variant
    SELECT COALESCE(SUM(quantity_on_hand), 0) INTO v_total_stock
    FROM v_stock_on_hand
    WHERE business_id = v_invoice.business_id 
      AND product_variant_id = v_item.product_variant_id;

    IF v_total_stock < v_needed_qty THEN
      RAISE EXCEPTION 'Insufficient stock for variant %. Available: %, Required: %', 
        v_item.product_variant_id, v_total_stock, v_needed_qty;
    END IF;

    -- Iterate batches in FEFO order (Earliest expiry first, NULLS last, then earliest created)
    FOR v_batch IN (
      SELECT 
        b.id AS batch_id, 
        b.cost_per_unit,
        COALESCE(s.quantity_on_hand, 0) AS available_qty
      FROM batches b
      JOIN v_stock_on_hand s ON s.batch_id = b.id
      WHERE b.product_variant_id = v_item.product_variant_id
        AND b.business_id = v_invoice.business_id
        AND s.quantity_on_hand > 0
      ORDER BY b.expiry_date ASC NULLS LAST, b.created_at ASC
    ) LOOP
      EXIT WHEN v_needed_qty <= 0;

      v_alloc_qty := LEAST(v_batch.available_qty, v_needed_qty);

      -- Record allocation in invoice_item_batches
      INSERT INTO invoice_item_batches (
        invoice_item_id,
        batch_id,
        quantity_allocated,
        cost_per_unit
      ) VALUES (
        v_item.id,
        v_batch.batch_id,
        v_alloc_qty,
        v_batch.cost_per_unit
      ) RETURNING id INTO v_item_batch_id;

      -- Post stock_movement (sale_out)
      INSERT INTO stock_movements (
        business_id,
        product_variant_id,
        batch_id,
        movement_type,
        quantity,
        reason,
        reference_type,
        reference_id,
        reference_line_id
      ) VALUES (
        v_invoice.business_id,
        v_item.product_variant_id,
        v_batch.batch_id,
        'sale_out',
        v_alloc_qty,
        'Invoice finalization',
        'invoice',
        v_invoice.id,
        v_item.id
      );

      v_needed_qty := v_needed_qty - v_alloc_qty;
    END LOOP;

    IF v_needed_qty > 0 THEN
      RAISE EXCEPTION 'Failed to fully allocate stock for variant % (short by %)', 
        v_item.product_variant_id, v_needed_qty;
    END IF;
  END LOOP;

  -- Generate sequential invoice number
  v_inv_number := next_invoice_number(v_invoice.business_id, v_invoice.mode);

  -- Update invoice to finalized
  UPDATE invoices
  SET
    status = 'finalized',
    invoice_number = v_inv_number,
    idempotency_key = COALESCE(p_idempotency_key, v_invoice.idempotency_key, gen_random_uuid()::TEXT),
    snapshot_business = to_jsonb(v_business),
    snapshot_customer = to_jsonb(v_customer),
    finalized_at = NOW(),
    updated_at = NOW()
  WHERE id = p_invoice_id;

  RETURN jsonb_build_object(
    'status', 'finalized',
    'invoice_id', p_invoice_id,
    'invoice_number', v_inv_number
  );
END;
$$;

-- ------------------------------------------------------------
-- 3. cancel_invoice
-- Reverses stock movements via sales_return_in and marks invoice cancelled.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION cancel_invoice(
  p_invoice_id UUID,
  p_reason TEXT DEFAULT 'Cancelled by user'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_invoice invoices%ROWTYPE;
  v_alloc RECORD;
BEGIN
  SELECT * INTO v_invoice FROM invoices WHERE id = p_invoice_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invoice % not found', p_invoice_id;
  END IF;

  IF v_invoice.status != 'finalized' THEN
    RAISE EXCEPTION 'Only finalized invoices can be cancelled (current status: %)', v_invoice.status;
  END IF;

  -- Check if payments have been allocated to this invoice
  IF EXISTS (SELECT 1 FROM payment_allocations WHERE invoice_id = p_invoice_id) THEN
    RAISE EXCEPTION 'Cannot cancel invoice with active payment allocations. Reallocate or refund payments first.';
  END IF;

  -- Create reversing stock movements for every allocated batch
  FOR v_alloc IN (
    SELECT 
      iib.batch_id, 
      iib.quantity_allocated, 
      ii.product_variant_id,
      ii.id AS item_id
    FROM invoice_item_batches iib
    JOIN invoice_items ii ON ii.id = iib.invoice_item_id
    WHERE ii.invoice_id = p_invoice_id
  ) LOOP
    INSERT INTO stock_movements (
      business_id,
      product_variant_id,
      batch_id,
      movement_type,
      quantity,
      reason,
      reference_type,
      reference_id,
      reference_line_id
    ) VALUES (
      v_invoice.business_id,
      v_alloc.product_variant_id,
      v_alloc.batch_id,
      'sales_return_in',
      v_alloc.quantity_allocated,
      'Invoice cancellation: ' || p_reason,
      'invoice_cancel',
      p_invoice_id,
      v_alloc.item_id
    );
  END LOOP;

  UPDATE invoices
  SET
    status = 'cancelled',
    cancelled_at = NOW(),
    updated_at = NOW()
  WHERE id = p_invoice_id;

  RETURN jsonb_build_object(
    'status', 'cancelled',
    'invoice_id', p_invoice_id,
    'invoice_number', v_invoice.invoice_number
  );
END;
$$;

-- ------------------------------------------------------------
-- 4. record_payment
-- Atomic creation of a payment and its allocations.
-- Validates: allocations sum <= payment amount;
--            each allocation <= invoice outstanding.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION record_payment(
  p_business_id UUID,
  p_customer_id UUID,
  p_amount NUMERIC(14,2),
  p_payment_date DATE,
  p_method payment_method,
  p_reference TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_idempotency_key TEXT DEFAULT NULL,
  p_allocations JSONB DEFAULT '[]'::JSONB
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_payment_id UUID;
  v_alloc RECORD;
  v_total_allocated NUMERIC(14,2) := 0;
  v_invoice_outstanding NUMERIC(14,2);
  v_alloc_amount NUMERIC(14,2);
  v_invoice_id UUID;
BEGIN
  -- Idempotency check
  IF p_idempotency_key IS NOT NULL THEN
    SELECT id INTO v_payment_id FROM payments WHERE idempotency_key = p_idempotency_key;
    IF FOUND THEN
      RETURN jsonb_build_object(
        'status', 'already_recorded',
        'payment_id', v_payment_id
      );
    END IF;
  END IF;

  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Payment amount must be greater than zero';
  END IF;

  -- Create payment record
  INSERT INTO payments (
    business_id,
    customer_id,
    amount,
    payment_date,
    method,
    reference,
    notes,
    idempotency_key
  ) VALUES (
    p_business_id,
    p_customer_id,
    p_amount,
    p_payment_date,
    p_method,
    p_reference,
    p_notes,
    p_idempotency_key
  ) RETURNING id INTO v_payment_id;

  -- Process allocations if provided
  FOR v_alloc IN SELECT * FROM jsonb_to_recordset(p_allocations) AS x(invoice_id UUID, amount NUMERIC(14,2))
  LOOP
    v_invoice_id := v_alloc.invoice_id;
    v_alloc_amount := v_alloc.amount;

    IF v_alloc_amount <= 0 THEN
      CONTINUE;
    END IF;

    -- Verify invoice belongs to this business and customer
    SELECT outstanding INTO v_invoice_outstanding
    FROM v_invoice_outstanding
    WHERE invoice_id = v_invoice_id 
      AND business_id = p_business_id
      AND customer_id = p_customer_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Invoice % not found or not eligible for allocation', v_invoice_id;
    END IF;

    IF v_alloc_amount > v_invoice_outstanding THEN
      RAISE EXCEPTION 'Allocation amount % exceeds invoice outstanding balance %', 
        v_alloc_amount, v_invoice_outstanding;
    END IF;

    INSERT INTO payment_allocations (
      payment_id,
      invoice_id,
      business_id,
      amount_allocated
    ) VALUES (
      v_payment_id,
      v_invoice_id,
      p_business_id,
      v_alloc_amount
    );

    v_total_allocated := v_total_allocated + v_alloc_amount;
  END LOOP;

  IF v_total_allocated > p_amount THEN
    RAISE EXCEPTION 'Sum of allocations (%) exceeds payment amount (%)', 
      v_total_allocated, p_amount;
  END IF;

  RETURN jsonb_build_object(
    'status', 'recorded',
    'payment_id', v_payment_id,
    'amount', p_amount,
    'allocated', v_total_allocated,
    'advance', (p_amount - v_total_allocated)
  );
END;
$$;

-- ------------------------------------------------------------
-- 5. receive_stock
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION receive_stock(
  p_business_id UUID,
  p_product_variant_id UUID,
  p_batch_id UUID,
  p_quantity NUMERIC(14,3),
  p_reason TEXT DEFAULT 'Supplier receipt',
  p_reference_type TEXT DEFAULT 'purchase',
  p_reference_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_mov_id UUID;
BEGIN
  IF p_quantity <= 0 THEN
    RAISE EXCEPTION 'Quantity received must be positive';
  END IF;

  INSERT INTO stock_movements (
    business_id,
    product_variant_id,
    batch_id,
    movement_type,
    quantity,
    reason,
    reference_type,
    reference_id
  ) VALUES (
    p_business_id,
    p_product_variant_id,
    p_batch_id,
    'purchase_in',
    p_quantity,
    p_reason,
    p_reference_type,
    p_reference_id
  ) RETURNING id INTO v_mov_id;

  RETURN v_mov_id;
END;
$$;

-- ------------------------------------------------------------
-- 6. adjust_stock
-- Damage, expiry, or manual inventory adjustment
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION adjust_stock(
  p_business_id UUID,
  p_product_variant_id UUID,
  p_batch_id UUID,
  p_movement_type movement_type,
  p_quantity NUMERIC(14,3),
  p_reason TEXT DEFAULT NULL,
  p_actor_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_mov_id UUID;
  v_batch_avail NUMERIC(14,3);
BEGIN
  IF p_quantity <= 0 THEN
    RAISE EXCEPTION 'Adjustment quantity must be greater than zero';
  END IF;

  -- For reduction movements, ensure sufficient batch quantity
  IF p_movement_type IN ('damage_out', 'expiry_out', 'adjustment_out') THEN
    SELECT COALESCE(quantity_on_hand, 0) INTO v_batch_avail
    FROM v_stock_on_hand
    WHERE business_id = p_business_id
      AND product_variant_id = p_product_variant_id
      AND (p_batch_id IS NULL OR batch_id = p_batch_id);

    IF v_batch_avail < p_quantity THEN
      RAISE EXCEPTION 'Cannot adjust out % units. Available on hand: %', p_quantity, v_batch_avail;
    END IF;
  END IF;

  INSERT INTO stock_movements (
    business_id,
    product_variant_id,
    batch_id,
    movement_type,
    quantity,
    reason,
    actor_id
  ) VALUES (
    p_business_id,
    p_product_variant_id,
    p_batch_id,
    p_movement_type,
    p_quantity,
    p_reason,
    p_actor_id
  ) RETURNING id INTO v_mov_id;

  RETURN v_mov_id;
END;
$$;
