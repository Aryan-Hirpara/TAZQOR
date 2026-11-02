-- ============================================================
-- TAZQOR Business Manager — Indexes
-- Migration: 20240002_indexes.sql
-- ============================================================
-- Covers all query patterns identified in the spec:
--   • Customer search (name, phone, city, status)
--   • Product/variant lookup (sku, name, status)
--   • Stock movement history
--   • Invoice/order list and filters
--   • Payment history
--   • Batch FEFO ordering (expiry_date ASC)
--   • Audit trail queries
-- ============================================================

-- ------------------------------------------------------------
-- customers
-- ------------------------------------------------------------
CREATE INDEX idx_customers_business_name
  ON customers(business_id, name);

CREATE INDEX idx_customers_business_phone
  ON customers(business_id, phone);

CREATE INDEX idx_customers_business_city
  ON customers(business_id, city);

CREATE INDEX idx_customers_business_status
  ON customers(business_id, status);

-- Useful for customer code lookups
CREATE INDEX idx_customers_business_code
  ON customers(business_id, customer_code)
  WHERE customer_code IS NOT NULL;

-- Partial index for active customers (most common filter)
CREATE INDEX idx_customers_active
  ON customers(business_id)
  WHERE status = 'active';

-- ------------------------------------------------------------
-- products
-- ------------------------------------------------------------
CREATE INDEX idx_products_business_name
  ON products(business_id, name);

CREATE INDEX idx_products_business_sku
  ON products(business_id, sku)
  WHERE sku IS NOT NULL;

CREATE INDEX idx_products_business_status
  ON products(business_id, status);

CREATE INDEX idx_products_business_category
  ON products(business_id, category_id);

-- ------------------------------------------------------------
-- product_variants
-- ------------------------------------------------------------
CREATE INDEX idx_product_variants_product
  ON product_variants(product_id);

CREATE INDEX idx_product_variants_business_sku
  ON product_variants(business_id, sku)
  WHERE sku IS NOT NULL;

CREATE INDEX idx_product_variants_business
  ON product_variants(business_id);

-- ------------------------------------------------------------
-- batches
-- FEFO ordering: earliest expiry_date first, then created_at
-- ------------------------------------------------------------
CREATE INDEX idx_batches_fefo
  ON batches(business_id, product_variant_id, expiry_date ASC NULLS LAST, created_at ASC);

-- ------------------------------------------------------------
-- stock_movements
-- Heavy read queries: per-variant history, per-reference lookup
-- ------------------------------------------------------------
CREATE INDEX idx_stock_movements_variant_time
  ON stock_movements(business_id, product_variant_id, created_at DESC);

CREATE INDEX idx_stock_movements_reference
  ON stock_movements(business_id, reference_type, reference_id)
  WHERE reference_type IS NOT NULL;

CREATE INDEX idx_stock_movements_batch
  ON stock_movements(business_id, batch_id)
  WHERE batch_id IS NOT NULL;

CREATE INDEX idx_stock_movements_type
  ON stock_movements(business_id, movement_type);

-- ------------------------------------------------------------
-- orders
-- ------------------------------------------------------------
CREATE INDEX idx_orders_business_status
  ON orders(business_id, status);

CREATE INDEX idx_orders_business_customer
  ON orders(business_id, customer_id);

CREATE INDEX idx_orders_business_number
  ON orders(business_id, order_number)
  WHERE order_number IS NOT NULL;

CREATE INDEX idx_orders_business_created
  ON orders(business_id, created_at DESC);

-- ------------------------------------------------------------
-- order_items
-- ------------------------------------------------------------
CREATE INDEX idx_order_items_order
  ON order_items(order_id);

CREATE INDEX idx_order_items_variant
  ON order_items(business_id, product_variant_id);

-- ------------------------------------------------------------
-- invoices
-- ------------------------------------------------------------
CREATE INDEX idx_invoices_business_status
  ON invoices(business_id, status);

CREATE INDEX idx_invoices_business_customer
  ON invoices(business_id, customer_id);

CREATE INDEX idx_invoices_business_date
  ON invoices(business_id, invoice_date DESC);

CREATE INDEX idx_invoices_business_number
  ON invoices(business_id, invoice_number)
  WHERE invoice_number IS NOT NULL;

-- Overdue lookups
CREATE INDEX idx_invoices_due_date
  ON invoices(business_id, due_date)
  WHERE status = 'finalized';

-- ------------------------------------------------------------
-- invoice_items
-- ------------------------------------------------------------
CREATE INDEX idx_invoice_items_invoice
  ON invoice_items(invoice_id);

CREATE INDEX idx_invoice_items_variant
  ON invoice_items(business_id, product_variant_id)
  WHERE product_variant_id IS NOT NULL;

-- ------------------------------------------------------------
-- invoice_item_batches
-- ------------------------------------------------------------
CREATE INDEX idx_invoice_item_batches_item
  ON invoice_item_batches(invoice_item_id);

CREATE INDEX idx_invoice_item_batches_batch
  ON invoice_item_batches(batch_id);

-- ------------------------------------------------------------
-- payments
-- ------------------------------------------------------------
CREATE INDEX idx_payments_business_customer
  ON payments(business_id, customer_id);

CREATE INDEX idx_payments_business_date
  ON payments(business_id, payment_date DESC);

-- ------------------------------------------------------------
-- payment_allocations
-- ------------------------------------------------------------
CREATE INDEX idx_payment_allocations_payment
  ON payment_allocations(payment_id);

CREATE INDEX idx_payment_allocations_invoice
  ON payment_allocations(invoice_id);

-- ------------------------------------------------------------
-- credit_notes
-- ------------------------------------------------------------
CREATE INDEX idx_credit_notes_business_customer
  ON credit_notes(business_id, customer_id);

CREATE INDEX idx_credit_notes_invoice
  ON credit_notes(invoice_id)
  WHERE invoice_id IS NOT NULL;

-- ------------------------------------------------------------
-- customer_visits
-- ------------------------------------------------------------
CREATE INDEX idx_customer_visits_business_customer
  ON customer_visits(business_id, customer_id);

CREATE INDEX idx_customer_visits_business_date
  ON customer_visits(business_id, visit_date DESC);

-- ------------------------------------------------------------
-- follow_ups
-- ------------------------------------------------------------
CREATE INDEX idx_follow_ups_business_status
  ON follow_ups(business_id, status);

CREATE INDEX idx_follow_ups_scheduled
  ON follow_ups(business_id, scheduled_for)
  WHERE status = 'pending';

-- ------------------------------------------------------------
-- expenses
-- ------------------------------------------------------------
CREATE INDEX idx_expenses_business_date
  ON expenses(business_id, expense_date DESC);

CREATE INDEX idx_expenses_business_category
  ON expenses(business_id, category_id);

-- ------------------------------------------------------------
-- audit_logs
-- ------------------------------------------------------------
CREATE INDEX idx_audit_logs_business_table_time
  ON audit_logs(business_id, table_name, created_at DESC);

CREATE INDEX idx_audit_logs_row
  ON audit_logs(table_name, row_id);
