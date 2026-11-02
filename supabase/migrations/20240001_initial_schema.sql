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
