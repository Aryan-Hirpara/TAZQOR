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
