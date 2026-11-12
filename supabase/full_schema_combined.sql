-- ============================================================
-- TAZQOR Business Manager — Initial Schema
-- Migration: 20240001_initial_schema.sql
-- ============================================================
-- All tables use:
--   • UUID primary keys with gen_random_uuid()
--   • created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
--   • updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW() (where mutable)
--   • Foreign keys with explicit ON DELETE behaviour
--   • CHECK constraints on amounts (>= 0) and status enums
-- ============================================================

-- Enable pgcrypto for gen_random_uuid() (available by default in Supabase)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- ENUM TYPES
-- ============================================================

CREATE TYPE customer_type AS ENUM (
  'grocery', 'hotel', 'mall', 'office', 'pg', 'school', 'other'
);

CREATE TYPE movement_type AS ENUM (
  'purchase_in',
  'sale_out',
  'sales_return_in',
  'purchase_return_out',
  'damage_out',
  'expiry_out',
  'adjustment_in',
  'adjustment_out',
  'opening_stock'
);

CREATE TYPE order_status AS ENUM (
  'draft', 'confirmed', 'processing', 'dispatched', 'delivered', 'cancelled'
);

CREATE TYPE invoice_mode AS ENUM ('gst', 'non_gst');

CREATE TYPE invoice_status AS ENUM (
  'draft', 'finalized', 'cancelled', 'credited'
);

CREATE TYPE payment_method AS ENUM (
  'cash', 'upi', 'bank_transfer', 'cheque', 'other'
);

CREATE TYPE follow_up_status AS ENUM ('pending', 'completed', 'missed');

-- ============================================================
-- 1. businesses
-- ============================================================
CREATE TABLE businesses (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  is_demo     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 2. profiles  (links to auth.users)
-- ============================================================
CREATE TABLE profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  full_name   TEXT,
  avatar_url  TEXT,
  phone       TEXT,
  role        TEXT NOT NULL DEFAULT 'admin'
                CHECK (role IN ('admin', 'staff', 'viewer')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX profiles_business_id_idx ON profiles(business_id);

-- ============================================================
-- 3. business_settings
-- ============================================================
CREATE TABLE business_settings (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id                 UUID NOT NULL UNIQUE REFERENCES businesses(id) ON DELETE CASCADE,
  legal_name                  TEXT,
  gstin                       TEXT,
  address_line1               TEXT,
  address_line2               TEXT,
  city                        TEXT,
  state                       TEXT,
  state_code                  TEXT,
  pin                         TEXT,
  phone                       TEXT,
  email                       TEXT,
  website                     TEXT,
  logo_url                    TEXT,
  gst_enabled                 BOOLEAN NOT NULL DEFAULT FALSE,
  gst_confirmed               BOOLEAN NOT NULL DEFAULT FALSE,
  financial_year_start_month  INTEGER NOT NULL DEFAULT 4
                                CHECK (financial_year_start_month BETWEEN 1 AND 12),
  invoice_prefix              TEXT NOT NULL DEFAULT 'INV',
  bill_prefix                 TEXT NOT NULL DEFAULT 'BILL',
  timezone                    TEXT NOT NULL DEFAULT 'Asia/Kolkata',
  country_code                TEXT NOT NULL DEFAULT '+91',
  round_off_enabled           BOOLEAN NOT NULL DEFAULT TRUE,
  tax_inclusive               BOOLEAN NOT NULL DEFAULT FALSE,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 4. customers
-- ============================================================
CREATE TABLE customers (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id      UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  shop_name        TEXT,
  contact_person   TEXT,
  phone            TEXT,
  whatsapp         TEXT,
  email            TEXT,
  type             customer_type,
  billing_address  TEXT,
  delivery_address TEXT,
  city             TEXT,
  district         TEXT,
  state            TEXT,
  pin              TEXT,
  lat              NUMERIC(10, 7),
  lng              NUMERIC(10, 7),
  notes            TEXT,
  status           TEXT NOT NULL DEFAULT 'active'
                     CHECK (status IN ('active', 'inactive', 'archived')),
  customer_code    TEXT,
  is_demo          BOOLEAN NOT NULL DEFAULT FALSE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 5. customer_addresses
-- ============================================================
CREATE TABLE customer_addresses (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id   UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  business_id   UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  label         TEXT,                      -- e.g. "Home", "Warehouse"
  address_line1 TEXT,
  address_line2 TEXT,
  city          TEXT,
  state         TEXT,
  pin           TEXT,
  lat           NUMERIC(10, 7),
  lng           NUMERIC(10, 7),
  is_default    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX customer_addresses_customer_id_idx ON customer_addresses(customer_id);

-- ============================================================
-- 6. customer_notes
-- ============================================================
CREATE TABLE customer_notes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  note        TEXT NOT NULL,
  created_by  UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX customer_notes_customer_id_idx ON customer_notes(customer_id);

-- ============================================================
-- 7. categories
-- ============================================================
CREATE TABLE categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  description TEXT,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 8. products
-- ============================================================
CREATE TABLE products (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  description TEXT,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  sku         TEXT,
  hsn         TEXT,                         -- HSN/SAC code (optional)
  image_url   TEXT,
  status      TEXT NOT NULL DEFAULT 'active'
                CHECK (status IN ('active', 'inactive', 'archived')),
  is_demo     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 9. tax_rates
-- ============================================================
CREATE TABLE tax_rates (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id    UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name           TEXT NOT NULL,             -- e.g. "GST 18%"
  rate           NUMERIC(5, 2) NOT NULL
                   CHECK (rate >= 0),
  effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 10. product_variants
-- ============================================================
CREATE TABLE product_variants (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id     UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  business_id    UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name           TEXT NOT NULL,             -- e.g. "500 mL", "1 L"
  sku            TEXT UNIQUE,
  pack_size      TEXT,
  cost_price     NUMERIC(14, 2)
                   CHECK (cost_price IS NULL OR cost_price >= 0),
  selling_price  NUMERIC(14, 2)
                   CHECK (selling_price IS NULL OR selling_price >= 0),
  tax_rate_id    UUID REFERENCES tax_rates(id) ON DELETE SET NULL,
  reorder_level  NUMERIC(14, 3) NOT NULL DEFAULT 0
                   CHECK (reorder_level >= 0),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 11. suppliers
-- ============================================================
CREATE TABLE suppliers (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  phone       TEXT,
  email       TEXT,
  address     TEXT,
  gstin       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 12. batches
-- ============================================================
CREATE TABLE batches (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id        UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  product_variant_id UUID NOT NULL REFERENCES product_variants(id) ON DELETE RESTRICT,
  batch_number       TEXT NOT NULL,
  manufacturing_date DATE,
  expiry_date        DATE,
  quantity_received  NUMERIC(14, 3) NOT NULL CHECK (quantity_received >= 0),
  cost_per_unit      NUMERIC(14, 2)          CHECK (cost_per_unit IS NULL OR cost_per_unit >= 0),
  supplier_id        UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  reference          TEXT,                  -- purchase order/reference number
  notes              TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 13. stock_movements  (ledger — append-only)
-- ============================================================
CREATE TABLE stock_movements (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id        UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  product_variant_id UUID NOT NULL REFERENCES product_variants(id) ON DELETE RESTRICT,
  batch_id           UUID REFERENCES batches(id) ON DELETE RESTRICT,
  movement_type      movement_type NOT NULL,
  quantity           NUMERIC(14, 3) NOT NULL CHECK (quantity > 0),
  reason             TEXT,
  reference_type     TEXT,                  -- 'invoice', 'order', 'adjustment', etc.
  reference_id       UUID,                  -- FK to parent document (not enforced; polymorphic)
  reference_line_id  UUID,                  -- FK to line item (idempotency target)
  notes              TEXT,
  actor_id           UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Idempotency: one movement per (line, type) prevents double-issue
  CONSTRAINT stock_movements_idempotency
    UNIQUE (reference_type, reference_line_id, movement_type)
);

-- ============================================================
-- 14. orders
-- ============================================================
CREATE TABLE orders (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id  UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  customer_id  UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  order_number TEXT UNIQUE,
  status       order_status NOT NULL DEFAULT 'draft',
  notes        TEXT,
  is_demo      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 15. order_items
-- ============================================================
CREATE TABLE order_items (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id           UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  business_id        UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  product_variant_id UUID NOT NULL REFERENCES product_variants(id) ON DELETE RESTRICT,
  quantity           NUMERIC(14, 3) NOT NULL CHECK (quantity > 0),
  unit_price         NUMERIC(14, 2) NOT NULL CHECK (unit_price >= 0),
  discount_percent   NUMERIC(5, 2) NOT NULL DEFAULT 0
                       CHECK (discount_percent >= 0 AND discount_percent <= 100),
  tax_rate_id        UUID REFERENCES tax_rates(id) ON DELETE SET NULL,
  invoiced_quantity  NUMERIC(14, 3) NOT NULL DEFAULT 0 CHECK (invoiced_quantity >= 0),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 16. invoice_number_counters
-- ============================================================
CREATE TABLE invoice_number_counters (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id    UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  mode           invoice_mode NOT NULL,
  financial_year TEXT NOT NULL,             -- e.g. '2025-26'
  prefix         TEXT NOT NULL,
  sequence       INTEGER NOT NULL DEFAULT 0 CHECK (sequence >= 0),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT invoice_number_counters_unique
    UNIQUE (business_id, mode, financial_year)
);

-- ============================================================
-- 17. invoices
-- ============================================================
CREATE TABLE invoices (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id         UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  customer_id         UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  order_id            UUID REFERENCES orders(id) ON DELETE SET NULL,
  invoice_number      TEXT,
  mode                invoice_mode NOT NULL,
  status              invoice_status NOT NULL DEFAULT 'draft',
  place_of_supply     TEXT,                 -- state name / code for GST
  invoice_date        DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date            DATE,
  subtotal            NUMERIC(14, 2) NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
  discount_total      NUMERIC(14, 2) NOT NULL DEFAULT 0 CHECK (discount_total >= 0),
  tax_total           NUMERIC(14, 2) NOT NULL DEFAULT 0 CHECK (tax_total >= 0),
  round_off           NUMERIC(14, 2) NOT NULL DEFAULT 0,
  grand_total         NUMERIC(14, 2) NOT NULL DEFAULT 0 CHECK (grand_total >= 0),
  notes               TEXT,
  terms               TEXT,
  idempotency_key     TEXT UNIQUE,
  snapshot_business   JSONB,               -- business details at finalization
  snapshot_customer   JSONB,               -- customer details at finalization
  finalized_at        TIMESTAMPTZ,
  cancelled_at        TIMESTAMPTZ,
  is_demo             BOOLEAN NOT NULL DEFAULT FALSE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 18. invoice_items
-- ============================================================
CREATE TABLE invoice_items (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id         UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  business_id        UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  product_variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
  description        TEXT,                  -- snapshot of product name
  sku_snapshot       TEXT,
  hsn_snapshot       TEXT,
  quantity           NUMERIC(14, 3) NOT NULL CHECK (quantity > 0),
  unit_price         NUMERIC(14, 2) NOT NULL CHECK (unit_price >= 0),
  discount_percent   NUMERIC(5, 2) NOT NULL DEFAULT 0
                       CHECK (discount_percent >= 0 AND discount_percent <= 100),
  tax_rate           NUMERIC(5, 2) NOT NULL DEFAULT 0  CHECK (tax_rate >= 0),
  cgst_rate          NUMERIC(5, 2) NOT NULL DEFAULT 0  CHECK (cgst_rate >= 0),
  sgst_rate          NUMERIC(5, 2) NOT NULL DEFAULT 0  CHECK (sgst_rate >= 0),
  igst_rate          NUMERIC(5, 2) NOT NULL DEFAULT 0  CHECK (igst_rate >= 0),
  line_subtotal      NUMERIC(14, 2) NOT NULL DEFAULT 0 CHECK (line_subtotal >= 0),
  line_tax           NUMERIC(14, 2) NOT NULL DEFAULT 0 CHECK (line_tax >= 0),
  line_total         NUMERIC(14, 2) NOT NULL DEFAULT 0 CHECK (line_total >= 0),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 19. invoice_item_batches  (FEFO allocation records)
-- ============================================================
CREATE TABLE invoice_item_batches (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_item_id     UUID NOT NULL REFERENCES invoice_items(id) ON DELETE CASCADE,
  batch_id            UUID NOT NULL REFERENCES batches(id) ON DELETE RESTRICT,
  quantity_allocated  NUMERIC(14, 3) NOT NULL CHECK (quantity_allocated > 0),
  cost_per_unit       NUMERIC(14, 2)          CHECK (cost_per_unit IS NULL OR cost_per_unit >= 0),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 20. payments
-- ============================================================
CREATE TABLE payments (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id      UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  customer_id      UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  amount           NUMERIC(14, 2) NOT NULL CHECK (amount > 0),
  payment_date     DATE NOT NULL DEFAULT CURRENT_DATE,
  method           payment_method NOT NULL DEFAULT 'cash',
  reference        TEXT,
  notes            TEXT,
  idempotency_key  TEXT UNIQUE,
  receipt_url      TEXT,
  is_demo          BOOLEAN NOT NULL DEFAULT FALSE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 21. payment_allocations
-- ============================================================
CREATE TABLE payment_allocations (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id       UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  invoice_id       UUID NOT NULL REFERENCES invoices(id) ON DELETE RESTRICT,
  business_id      UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  amount_allocated NUMERIC(14, 2) NOT NULL CHECK (amount_allocated > 0),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT payment_allocations_unique UNIQUE (payment_id, invoice_id)
);

-- ============================================================
-- 22. credit_notes
-- ============================================================
CREATE TABLE credit_notes (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id        UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  customer_id        UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  invoice_id         UUID REFERENCES invoices(id) ON DELETE RESTRICT,
  credit_note_number TEXT,
  status             TEXT NOT NULL DEFAULT 'active'
                       CHECK (status IN ('active', 'applied', 'cancelled')),
  reason             TEXT,
  subtotal           NUMERIC(14, 2) NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
  tax_total          NUMERIC(14, 2) NOT NULL DEFAULT 0 CHECK (tax_total >= 0),
  grand_total        NUMERIC(14, 2) NOT NULL DEFAULT 0 CHECK (grand_total >= 0),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 23. customer_visits
-- ============================================================
CREATE TABLE customer_visits (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  visit_date  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  outcome     TEXT,
  notes       TEXT,
  gps_lat     NUMERIC(10, 7),
  gps_lng     NUMERIC(10, 7),
  created_by  UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 24. follow_ups
-- ============================================================
CREATE TABLE follow_ups (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id   UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  customer_id   UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  visit_id      UUID REFERENCES customer_visits(id) ON DELETE SET NULL,
  scheduled_for TIMESTAMPTZ NOT NULL,
  notes         TEXT,
  status        follow_up_status NOT NULL DEFAULT 'pending',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 25. expense_categories
-- ============================================================
CREATE TABLE expense_categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE, -- NULL = system default
  name        TEXT NOT NULL,
  is_default  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 26. expenses
-- ============================================================
CREATE TABLE expenses (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id    UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  category_id    UUID REFERENCES expense_categories(id) ON DELETE SET NULL,
  amount         NUMERIC(14, 2) NOT NULL CHECK (amount > 0),
  expense_date   DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method TEXT,
  vendor         TEXT,
  description    TEXT,
  receipt_url    TEXT,
  is_demo        BOOLEAN NOT NULL DEFAULT FALSE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 27. audit_logs  (append-only; no UPDATE/DELETE)
-- ============================================================
CREATE TABLE audit_logs (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID,                         -- may be NULL for auth events
  table_name TEXT NOT NULL,
  row_id     UUID,
  operation  TEXT NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
  old_values JSONB,
  new_values JSONB,
  actor_id   UUID,                          -- references profiles(id); not FK to allow deleted users
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
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
-- ============================================================
-- TAZQOR Business Manager — Row-Level Security (RLS)
-- Migration: 20240003_rls.sql
-- ============================================================
-- Pattern:
--   • Every business-owned table: business_id = current_business_id()
--   • profiles: user can only see/edit their own row
--   • audit_logs: INSERT-only (no UPDATE/DELETE policies)
--   • expense_categories: business-owned rows OR system defaults (business_id IS NULL)
-- ============================================================

-- ============================================================
-- Helper function: returns the authenticated user's business_id
-- SECURITY DEFINER so it can read profiles without RLS recursion
-- ============================================================
CREATE OR REPLACE FUNCTION current_business_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT business_id FROM profiles WHERE id = auth.uid() LIMIT 1;
$$;

-- ============================================================
-- Helper: returns true if the calling user is authenticated
-- ============================================================
CREATE OR REPLACE FUNCTION is_authenticated()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.uid() IS NOT NULL;
$$;

-- ============================================================
-- businesses
-- ============================================================
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "businesses_select"
  ON businesses FOR SELECT
  USING (id = current_business_id());

-- Only allow updating the business the user belongs to
CREATE POLICY "businesses_update"
  ON businesses FOR UPDATE
  USING (id = current_business_id())
  WITH CHECK (id = current_business_id());

-- INSERT is handled by server-side signup flow (service role) — no user policy

-- ============================================================
-- profiles
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users may only read their own profile
CREATE POLICY "profiles_select_own"
  ON profiles FOR SELECT
  USING (id = auth.uid());

-- Users may only update their own profile
CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- INSERT handled by server-side signup flow (service role)

-- ============================================================
-- business_settings
-- ============================================================
ALTER TABLE business_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "business_settings_select"
  ON business_settings FOR SELECT
  USING (business_id = current_business_id());

CREATE POLICY "business_settings_insert"
  ON business_settings FOR INSERT
  WITH CHECK (business_id = current_business_id());

CREATE POLICY "business_settings_update"
  ON business_settings FOR UPDATE
  USING (business_id = current_business_id())
  WITH CHECK (business_id = current_business_id());

-- ============================================================
-- customers
-- ============================================================
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "customers_select"
  ON customers FOR SELECT
  USING (business_id = current_business_id());

CREATE POLICY "customers_insert"
  ON customers FOR INSERT
  WITH CHECK (business_id = current_business_id());

CREATE POLICY "customers_update"
  ON customers FOR UPDATE
  USING (business_id = current_business_id())
  WITH CHECK (business_id = current_business_id());

-- Soft-delete only (set status='archived'); hard delete not allowed
-- No DELETE policy for customers — they are archived, not deleted

-- ============================================================
-- customer_addresses
-- ============================================================
ALTER TABLE customer_addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "customer_addresses_select"
  ON customer_addresses FOR SELECT
  USING (business_id = current_business_id());

CREATE POLICY "customer_addresses_insert"
  ON customer_addresses FOR INSERT
  WITH CHECK (business_id = current_business_id());

CREATE POLICY "customer_addresses_update"
  ON customer_addresses FOR UPDATE
  USING (business_id = current_business_id())
  WITH CHECK (business_id = current_business_id());

CREATE POLICY "customer_addresses_delete"
  ON customer_addresses FOR DELETE
  USING (business_id = current_business_id());

-- ============================================================
-- customer_notes
-- ============================================================
ALTER TABLE customer_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "customer_notes_select"
  ON customer_notes FOR SELECT
  USING (business_id = current_business_id());

CREATE POLICY "customer_notes_insert"
  ON customer_notes FOR INSERT
  WITH CHECK (business_id = current_business_id());

CREATE POLICY "customer_notes_update"
  ON customer_notes FOR UPDATE
  USING (business_id = current_business_id())
  WITH CHECK (business_id = current_business_id());

CREATE POLICY "customer_notes_delete"
  ON customer_notes FOR DELETE
  USING (business_id = current_business_id());

-- ============================================================
-- categories
-- ============================================================
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "categories_select"
  ON categories FOR SELECT
  USING (business_id = current_business_id());

CREATE POLICY "categories_insert"
  ON categories FOR INSERT
  WITH CHECK (business_id = current_business_id());

CREATE POLICY "categories_update"
  ON categories FOR UPDATE
  USING (business_id = current_business_id())
  WITH CHECK (business_id = current_business_id());

CREATE POLICY "categories_delete"
  ON categories FOR DELETE
  USING (business_id = current_business_id());

-- ============================================================
-- products
-- ============================================================
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "products_select"
  ON products FOR SELECT
  USING (business_id = current_business_id());

CREATE POLICY "products_insert"
  ON products FOR INSERT
  WITH CHECK (business_id = current_business_id());

CREATE POLICY "products_update"
  ON products FOR UPDATE
  USING (business_id = current_business_id())
  WITH CHECK (business_id = current_business_id());

-- No hard DELETE (archive instead); only allow deletion of products without
-- any financial references (enforced by FK RESTRICT on variants)

-- ============================================================
-- product_variants
-- ============================================================
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "product_variants_select"
  ON product_variants FOR SELECT
  USING (business_id = current_business_id());

CREATE POLICY "product_variants_insert"
  ON product_variants FOR INSERT
  WITH CHECK (business_id = current_business_id());

CREATE POLICY "product_variants_update"
  ON product_variants FOR UPDATE
  USING (business_id = current_business_id())
  WITH CHECK (business_id = current_business_id());

-- ============================================================
-- tax_rates
-- ============================================================
ALTER TABLE tax_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tax_rates_select"
  ON tax_rates FOR SELECT
  USING (business_id = current_business_id());

CREATE POLICY "tax_rates_insert"
  ON tax_rates FOR INSERT
  WITH CHECK (business_id = current_business_id());

CREATE POLICY "tax_rates_update"
  ON tax_rates FOR UPDATE
  USING (business_id = current_business_id())
  WITH CHECK (business_id = current_business_id());

CREATE POLICY "tax_rates_delete"
  ON tax_rates FOR DELETE
  USING (business_id = current_business_id());

-- ============================================================
-- suppliers
-- ============================================================
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "suppliers_select"
  ON suppliers FOR SELECT
  USING (business_id = current_business_id());

CREATE POLICY "suppliers_insert"
  ON suppliers FOR INSERT
  WITH CHECK (business_id = current_business_id());

CREATE POLICY "suppliers_update"
  ON suppliers FOR UPDATE
  USING (business_id = current_business_id())
  WITH CHECK (business_id = current_business_id());

CREATE POLICY "suppliers_delete"
  ON suppliers FOR DELETE
  USING (business_id = current_business_id());

-- ============================================================
-- batches
-- ============================================================
ALTER TABLE batches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "batches_select"
  ON batches FOR SELECT
  USING (business_id = current_business_id());

CREATE POLICY "batches_insert"
  ON batches FOR INSERT
  WITH CHECK (business_id = current_business_id());

CREATE POLICY "batches_update"
  ON batches FOR UPDATE
  USING (business_id = current_business_id())
  WITH CHECK (business_id = current_business_id());

-- ============================================================
-- stock_movements  (append-only ledger)
-- ============================================================
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "stock_movements_select"
  ON stock_movements FOR SELECT
  USING (business_id = current_business_id());

CREATE POLICY "stock_movements_insert"
  ON stock_movements FOR INSERT
  WITH CHECK (business_id = current_business_id());

-- No UPDATE or DELETE — stock ledger is immutable

-- ============================================================
-- orders
-- ============================================================
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "orders_select"
  ON orders FOR SELECT
  USING (business_id = current_business_id());

CREATE POLICY "orders_insert"
  ON orders FOR INSERT
  WITH CHECK (business_id = current_business_id());

CREATE POLICY "orders_update"
  ON orders FOR UPDATE
  USING (business_id = current_business_id())
  WITH CHECK (business_id = current_business_id());

-- Allow deletion of draft orders only
CREATE POLICY "orders_delete_draft"
  ON orders FOR DELETE
  USING (business_id = current_business_id() AND status = 'draft');

-- ============================================================
-- order_items
-- ============================================================
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "order_items_select"
  ON order_items FOR SELECT
  USING (business_id = current_business_id());

CREATE POLICY "order_items_insert"
  ON order_items FOR INSERT
  WITH CHECK (business_id = current_business_id());

CREATE POLICY "order_items_update"
  ON order_items FOR UPDATE
  USING (business_id = current_business_id())
  WITH CHECK (business_id = current_business_id());

CREATE POLICY "order_items_delete"
  ON order_items FOR DELETE
  USING (business_id = current_business_id());

-- ============================================================
-- invoice_number_counters
-- ============================================================
ALTER TABLE invoice_number_counters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "invoice_number_counters_select"
  ON invoice_number_counters FOR SELECT
  USING (business_id = current_business_id());

-- INSERT/UPDATE handled exclusively by the next_invoice_number() SECURITY DEFINER function

-- ============================================================
-- invoices
-- ============================================================
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "invoices_select"
  ON invoices FOR SELECT
  USING (business_id = current_business_id());

CREATE POLICY "invoices_insert"
  ON invoices FOR INSERT
  WITH CHECK (business_id = current_business_id());

CREATE POLICY "invoices_update"
  ON invoices FOR UPDATE
  USING (business_id = current_business_id())
  WITH CHECK (business_id = current_business_id());

-- Allow deletion of draft invoices only
CREATE POLICY "invoices_delete_draft"
  ON invoices FOR DELETE
  USING (business_id = current_business_id() AND status = 'draft');

-- ============================================================
-- invoice_items
-- ============================================================
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "invoice_items_select"
  ON invoice_items FOR SELECT
  USING (business_id = current_business_id());

CREATE POLICY "invoice_items_insert"
  ON invoice_items FOR INSERT
  WITH CHECK (business_id = current_business_id());

CREATE POLICY "invoice_items_update"
  ON invoice_items FOR UPDATE
  USING (business_id = current_business_id())
  WITH CHECK (business_id = current_business_id());

CREATE POLICY "invoice_items_delete"
  ON invoice_items FOR DELETE
  USING (business_id = current_business_id());

-- ============================================================
-- invoice_item_batches
-- ============================================================
ALTER TABLE invoice_item_batches ENABLE ROW LEVEL SECURITY;

-- No direct business_id column; join via invoice_items
-- Use SECURITY DEFINER functions for all writes; reads allowed via join check
CREATE POLICY "invoice_item_batches_select"
  ON invoice_item_batches FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM invoice_items ii
      WHERE ii.id = invoice_item_batches.invoice_item_id
        AND ii.business_id = current_business_id()
    )
  );

-- INSERT handled by finalize_invoice() SECURITY DEFINER function only

-- ============================================================
-- payments
-- ============================================================
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payments_select"
  ON payments FOR SELECT
  USING (business_id = current_business_id());

CREATE POLICY "payments_insert"
  ON payments FOR INSERT
  WITH CHECK (business_id = current_business_id());

CREATE POLICY "payments_update"
  ON payments FOR UPDATE
  USING (business_id = current_business_id())
  WITH CHECK (business_id = current_business_id());

-- No DELETE policy — payments are not deleted (voided/corrected via adjustments)

-- ============================================================
-- payment_allocations
-- ============================================================
ALTER TABLE payment_allocations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payment_allocations_select"
  ON payment_allocations FOR SELECT
  USING (business_id = current_business_id());

CREATE POLICY "payment_allocations_insert"
  ON payment_allocations FOR INSERT
  WITH CHECK (business_id = current_business_id());

CREATE POLICY "payment_allocations_update"
  ON payment_allocations FOR UPDATE
  USING (business_id = current_business_id())
  WITH CHECK (business_id = current_business_id());

CREATE POLICY "payment_allocations_delete"
  ON payment_allocations FOR DELETE
  USING (business_id = current_business_id());

-- ============================================================
-- credit_notes
-- ============================================================
ALTER TABLE credit_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "credit_notes_select"
  ON credit_notes FOR SELECT
  USING (business_id = current_business_id());

CREATE POLICY "credit_notes_insert"
  ON credit_notes FOR INSERT
  WITH CHECK (business_id = current_business_id());

CREATE POLICY "credit_notes_update"
  ON credit_notes FOR UPDATE
  USING (business_id = current_business_id())
  WITH CHECK (business_id = current_business_id());

-- ============================================================
-- customer_visits
-- ============================================================
ALTER TABLE customer_visits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "customer_visits_select"
  ON customer_visits FOR SELECT
  USING (business_id = current_business_id());

CREATE POLICY "customer_visits_insert"
  ON customer_visits FOR INSERT
  WITH CHECK (business_id = current_business_id());

CREATE POLICY "customer_visits_update"
  ON customer_visits FOR UPDATE
  USING (business_id = current_business_id())
  WITH CHECK (business_id = current_business_id());

CREATE POLICY "customer_visits_delete"
  ON customer_visits FOR DELETE
  USING (business_id = current_business_id());

-- ============================================================
-- follow_ups
-- ============================================================
ALTER TABLE follow_ups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "follow_ups_select"
  ON follow_ups FOR SELECT
  USING (business_id = current_business_id());

CREATE POLICY "follow_ups_insert"
  ON follow_ups FOR INSERT
  WITH CHECK (business_id = current_business_id());

CREATE POLICY "follow_ups_update"
  ON follow_ups FOR UPDATE
  USING (business_id = current_business_id())
  WITH CHECK (business_id = current_business_id());

CREATE POLICY "follow_ups_delete"
  ON follow_ups FOR DELETE
  USING (business_id = current_business_id());

-- ============================================================
-- expense_categories
-- Rows where business_id IS NULL are system defaults visible to all.
-- Business-specific rows are scoped to that business.
-- ============================================================
ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "expense_categories_select"
  ON expense_categories FOR SELECT
  USING (
    business_id IS NULL                           -- system defaults
    OR business_id = current_business_id()        -- business-owned
  );

CREATE POLICY "expense_categories_insert"
  ON expense_categories FOR INSERT
  WITH CHECK (business_id = current_business_id());

CREATE POLICY "expense_categories_update"
  ON expense_categories FOR UPDATE
  USING (business_id = current_business_id())
  WITH CHECK (business_id = current_business_id());

CREATE POLICY "expense_categories_delete"
  ON expense_categories FOR DELETE
  USING (business_id = current_business_id() AND is_default = FALSE);

-- ============================================================
-- expenses
-- ============================================================
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "expenses_select"
  ON expenses FOR SELECT
  USING (business_id = current_business_id());

CREATE POLICY "expenses_insert"
  ON expenses FOR INSERT
  WITH CHECK (business_id = current_business_id());

CREATE POLICY "expenses_update"
  ON expenses FOR UPDATE
  USING (business_id = current_business_id())
  WITH CHECK (business_id = current_business_id());

CREATE POLICY "expenses_delete"
  ON expenses FOR DELETE
  USING (business_id = current_business_id());

-- ============================================================
-- audit_logs  (INSERT-only; no SELECT policy forces reads via service role)
-- ============================================================
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Only the server (SECURITY DEFINER trigger) inserts; users cannot read
-- audit logs directly through client (service role required for audit UI).
-- If you want users to read their own business audit logs, add:
-- CREATE POLICY "audit_logs_select"
--   ON audit_logs FOR SELECT
--   USING (business_id = current_business_id());

-- INSERT policy for the SECURITY DEFINER audit trigger function
CREATE POLICY "audit_logs_insert"
  ON audit_logs FOR INSERT
  WITH CHECK (true);  -- restricted by trigger SECURITY DEFINER context
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

-- ============================================================
-- TAZQOR Business Manager — Triggers & Integrity
-- Migration: 20240006_triggers.sql
-- ============================================================

-- ------------------------------------------------------------
-- 1. Helper function for updated_at
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Apply updated_at to all mutable tables
CREATE OR REPLACE TRIGGER trg_businesses_updated_at BEFORE UPDATE ON businesses FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE OR REPLACE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE OR REPLACE TRIGGER trg_business_settings_updated_at BEFORE UPDATE ON business_settings FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE OR REPLACE TRIGGER trg_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE OR REPLACE TRIGGER trg_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE OR REPLACE TRIGGER trg_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE OR REPLACE TRIGGER trg_product_variants_updated_at BEFORE UPDATE ON product_variants FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE OR REPLACE TRIGGER trg_suppliers_updated_at BEFORE UPDATE ON suppliers FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE OR REPLACE TRIGGER trg_batches_updated_at BEFORE UPDATE ON batches FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE OR REPLACE TRIGGER trg_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE OR REPLACE TRIGGER trg_invoices_updated_at BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE OR REPLACE TRIGGER trg_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE OR REPLACE TRIGGER trg_credit_notes_updated_at BEFORE UPDATE ON credit_notes FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE OR REPLACE TRIGGER trg_customer_visits_updated_at BEFORE UPDATE ON customer_visits FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE OR REPLACE TRIGGER trg_follow_ups_updated_at BEFORE UPDATE ON follow_ups FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE OR REPLACE TRIGGER trg_expenses_updated_at BEFORE UPDATE ON expenses FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- ------------------------------------------------------------
-- 2. Finalized Invoice Immutability Trigger
-- Enforces that once an invoice is 'finalized', core financial fields
-- and lines cannot be altered. Only status transitions to 'cancelled' or 'credited'
-- are permitted via designated functions.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION trg_enforce_invoice_immutability()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.status = 'finalized' THEN
    -- Allow updating only status (to cancelled or credited) and cancelled_at
    IF (NEW.status = 'cancelled' OR NEW.status = 'credited') AND 
       NEW.invoice_number = OLD.invoice_number AND
       NEW.grand_total = OLD.grand_total AND
       NEW.customer_id = OLD.customer_id AND
       NEW.business_id = OLD.business_id THEN
      RETURN NEW;
    END IF;

    RAISE EXCEPTION 'Finalized invoice % is immutable and cannot be updated.', OLD.invoice_number;
  END IF;

  IF OLD.status = 'cancelled' THEN
    RAISE EXCEPTION 'Cancelled invoice % cannot be modified.', OLD.invoice_number;
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_invoice_immutability
BEFORE UPDATE ON invoices
FOR EACH ROW
EXECUTE FUNCTION trg_enforce_invoice_immutability();

-- Prevent deletion of finalized invoices
CREATE OR REPLACE FUNCTION trg_prevent_finalized_invoice_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.status = 'finalized' OR OLD.status = 'credited' THEN
    RAISE EXCEPTION 'Finalized invoice % cannot be deleted. Use cancellation or credit notes instead.', OLD.invoice_number;
  END IF;
  RETURN OLD;
END;
$$;

CREATE OR REPLACE TRIGGER trg_prevent_invoice_delete
BEFORE DELETE ON invoices
FOR EACH ROW
EXECUTE FUNCTION trg_prevent_finalized_invoice_delete();

-- ------------------------------------------------------------
-- 3. Prevent modification or deletion of invoice items for finalized invoices
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION trg_enforce_invoice_items_immutability()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_status invoice_status;
BEGIN
  SELECT status INTO v_status FROM invoices WHERE id = COALESCE(NEW.invoice_id, OLD.invoice_id);
  IF v_status = 'finalized' OR v_status = 'cancelled' OR v_status = 'credited' THEN
    RAISE EXCEPTION 'Items for finalized invoice cannot be modified or deleted.';
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE OR REPLACE TRIGGER trg_invoice_items_immutability
BEFORE UPDATE OR DELETE ON invoice_items
FOR EACH ROW
EXECUTE FUNCTION trg_enforce_invoice_items_immutability();

-- ------------------------------------------------------------
-- 4. Audit Trail Logging Trigger
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION trg_write_audit_log()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_actor_id UUID;
  v_business_id UUID;
  v_row_id UUID;
BEGIN
  v_actor_id := auth.uid();
  v_business_id := COALESCE(
    CASE WHEN TG_OP != 'DELETE' THEN (to_jsonb(NEW)->>'business_id')::UUID ELSE NULL END,
    CASE WHEN TG_OP != 'INSERT' THEN (to_jsonb(OLD)->>'business_id')::UUID ELSE NULL END
  );
  v_row_id := COALESCE(
    CASE WHEN TG_OP != 'DELETE' THEN (to_jsonb(NEW)->>'id')::UUID ELSE NULL END,
    CASE WHEN TG_OP != 'INSERT' THEN (to_jsonb(OLD)->>'id')::UUID ELSE NULL END
  );

  INSERT INTO audit_logs (
    business_id,
    table_name,
    row_id,
    operation,
    old_values,
    new_values,
    actor_id,
    created_at
  ) VALUES (
    v_business_id,
    TG_TABLE_NAME,
    v_row_id,
    TG_OP,
    CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END,
    v_actor_id,
    NOW()
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Apply audit triggers to core tables
CREATE OR REPLACE TRIGGER trg_audit_customers AFTER INSERT OR UPDATE OR DELETE ON customers FOR EACH ROW EXECUTE FUNCTION trg_write_audit_log();
CREATE OR REPLACE TRIGGER trg_audit_products AFTER INSERT OR UPDATE OR DELETE ON products FOR EACH ROW EXECUTE FUNCTION trg_write_audit_log();
CREATE OR REPLACE TRIGGER trg_audit_product_variants AFTER INSERT OR UPDATE OR DELETE ON product_variants FOR EACH ROW EXECUTE FUNCTION trg_write_audit_log();
CREATE OR REPLACE TRIGGER trg_audit_invoices AFTER INSERT OR UPDATE OR DELETE ON invoices FOR EACH ROW EXECUTE FUNCTION trg_write_audit_log();
CREATE OR REPLACE TRIGGER trg_audit_payments AFTER INSERT OR UPDATE OR DELETE ON payments FOR EACH ROW EXECUTE FUNCTION trg_write_audit_log();
CREATE OR REPLACE TRIGGER trg_audit_stock_movements AFTER INSERT ON stock_movements FOR EACH ROW EXECUTE FUNCTION trg_write_audit_log();
CREATE OR REPLACE TRIGGER trg_audit_settings AFTER INSERT OR UPDATE ON business_settings FOR EACH ROW EXECUTE FUNCTION trg_write_audit_log();

