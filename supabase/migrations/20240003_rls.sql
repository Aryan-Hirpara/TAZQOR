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
