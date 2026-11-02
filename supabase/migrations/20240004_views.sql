-- ============================================================
-- TAZQOR Business Manager — Views
-- Migration: 20240004_views.sql
-- ============================================================
-- All views use SECURITY INVOKER (default) so RLS on base tables
-- is still enforced when queried by the authenticated user.
-- ============================================================

-- ============================================================
-- v_stock_on_hand
-- Current quantity on hand per (business, variant, batch).
-- movement_types that ADD stock: purchase_in, sales_return_in,
--   adjustment_in, opening_stock
-- movement_types that REMOVE stock: sale_out, purchase_return_out,
--   damage_out, expiry_out, adjustment_out
-- ============================================================
CREATE OR REPLACE VIEW v_stock_on_hand
WITH (security_invoker = true)
AS
SELECT
  sm.business_id,
  sm.product_variant_id,
  sm.batch_id,
  SUM(
    CASE
      WHEN sm.movement_type IN (
        'purchase_in', 'sales_return_in', 'adjustment_in', 'opening_stock'
      ) THEN sm.quantity
      ELSE -sm.quantity
    END
  )::NUMERIC(14, 3) AS quantity_on_hand
FROM stock_movements sm
GROUP BY
  sm.business_id,
  sm.product_variant_id,
  sm.batch_id;

-- ============================================================
-- v_stock_summary
-- Aggregated stock per variant (across all batches).
-- Useful for product list low-stock alerts.
-- ============================================================
CREATE OR REPLACE VIEW v_stock_summary
WITH (security_invoker = true)
AS
SELECT
  soh.business_id,
  soh.product_variant_id,
  SUM(soh.quantity_on_hand)::NUMERIC(14, 3) AS total_quantity_on_hand,
  pv.reorder_level,
  CASE
    WHEN SUM(soh.quantity_on_hand) <= 0 THEN 'out_of_stock'
    WHEN SUM(soh.quantity_on_hand) <= pv.reorder_level THEN 'low_stock'
    ELSE 'in_stock'
  END AS stock_status
FROM v_stock_on_hand soh
JOIN product_variants pv
  ON pv.id = soh.product_variant_id
GROUP BY
  soh.business_id,
  soh.product_variant_id,
  pv.reorder_level;

-- ============================================================
-- v_invoice_outstanding
-- Outstanding balance per finalized invoice.
-- outstanding = grand_total - SUM(amount_allocated)
-- is_overdue  = due_date has passed and outstanding > 0
-- ============================================================
CREATE OR REPLACE VIEW v_invoice_outstanding
WITH (security_invoker = true)
AS
SELECT
  i.id                                                           AS invoice_id,
  i.business_id,
  i.customer_id,
  i.invoice_number,
  i.invoice_date,
  i.due_date,
  i.grand_total,
  COALESCE(pa_totals.amount_paid, 0)::NUMERIC(14, 2)            AS amount_paid,
  (i.grand_total - COALESCE(pa_totals.amount_paid, 0))::NUMERIC(14, 2) AS outstanding,
  CASE
    WHEN i.due_date IS NOT NULL
      AND i.due_date < CURRENT_DATE
      AND (i.grand_total - COALESCE(pa_totals.amount_paid, 0)) > 0
    THEN TRUE
    ELSE FALSE
  END                                                            AS is_overdue
FROM invoices i
LEFT JOIN (
  SELECT invoice_id, SUM(amount_allocated) AS amount_paid
  FROM payment_allocations
  GROUP BY invoice_id
) pa_totals ON pa_totals.invoice_id = i.id
WHERE i.status = 'finalized';

-- ============================================================
-- v_customer_balances
-- Per-customer financial summary. Accurate computation that
-- avoids double-counting via separate sub-aggregations.
--
-- outstanding = total_invoiced - total_allocated (what customer owes)
-- advance     = total_payments - total_allocated (unallocated cash)
-- ============================================================
CREATE OR REPLACE VIEW v_customer_balances
WITH (security_invoker = true)
AS
SELECT
  c.id                                                            AS customer_id,
  c.business_id,
  c.name,
  c.status,
  COALESCE(inv.total_invoiced,  0)::NUMERIC(14, 2)               AS total_invoiced,
  COALESCE(alloc.total_allocated, 0)::NUMERIC(14, 2)             AS total_allocated,
  COALESCE(pay.total_payments,  0)::NUMERIC(14, 2)               AS total_payments,
  -- Outstanding = what is still owed on finalized invoices
  (COALESCE(inv.total_invoiced, 0) - COALESCE(alloc.total_allocated, 0))::NUMERIC(14, 2)
                                                                  AS outstanding,
  -- Advance = payments received but not yet allocated to any invoice
  (COALESCE(pay.total_payments, 0) - COALESCE(alloc.total_allocated, 0))::NUMERIC(14, 2)
                                                                  AS advance
FROM customers c

-- Sub-aggregate 1: sum of finalized invoice grand totals per customer
LEFT JOIN (
  SELECT customer_id, SUM(grand_total) AS total_invoiced
  FROM invoices
  WHERE status = 'finalized'
  GROUP BY customer_id
) inv ON inv.customer_id = c.id

-- Sub-aggregate 2: sum of allocations (joined via invoice to get customer_id)
LEFT JOIN (
  SELECT i.customer_id, SUM(pa.amount_allocated) AS total_allocated
  FROM payment_allocations pa
  JOIN invoices i ON i.id = pa.invoice_id
  GROUP BY i.customer_id
) alloc ON alloc.customer_id = c.id

-- Sub-aggregate 3: sum of payments per customer
LEFT JOIN (
  SELECT customer_id, SUM(amount) AS total_payments
  FROM payments
  GROUP BY customer_id
) pay ON pay.customer_id = c.id;

-- ============================================================
-- v_overdue_invoices
-- Shortcut view: finalized invoices past their due date
-- with outstanding balance > 0.
-- ============================================================
CREATE OR REPLACE VIEW v_overdue_invoices
WITH (security_invoker = true)
AS
SELECT *
FROM v_invoice_outstanding
WHERE is_overdue = TRUE;

-- ============================================================
-- v_batch_stock
-- Per-batch stock with batch metadata for FEFO queries.
-- ============================================================
CREATE OR REPLACE VIEW v_batch_stock
WITH (security_invoker = true)
AS
SELECT
  soh.business_id,
  soh.product_variant_id,
  soh.batch_id,
  soh.quantity_on_hand,
  b.batch_number,
  b.expiry_date,
  b.manufacturing_date,
  b.cost_per_unit,
  b.supplier_id,
  b.created_at                    AS batch_received_at
FROM v_stock_on_hand soh
JOIN batches b ON b.id = soh.batch_id
WHERE soh.quantity_on_hand > 0;
