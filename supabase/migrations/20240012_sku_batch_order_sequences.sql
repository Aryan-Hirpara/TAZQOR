-- ============================================================
-- TAZQOR Business Manager — Standardized SKU, Batch & Order Sequences
-- Migration: 20240012_sku_batch_order_sequences.sql
-- ============================================================
-- 1. Enforces immutability on product_variants.sku once created
--    (allowing only internal `~ARC-` release suffixes on product archive).
-- 2. Adds UNIQUE constraint on batches.batch_number.
-- 3. Adds monthly atomic counter tables & SECURITY DEFINER RPCs:
--      - next_order_number(business_id, reference_ts) -> ORD-YYMM-XXXX
--      - next_batch_number(business_id, variant_id, prefix, batch_date) -> STK-PREFIX-YYMM-XX
--      - preview_next_batch_number(business_id, variant_id, prefix, batch_date) -> preview without increment
-- ============================================================

-- ------------------------------------------------------------
-- 1. Enforce Variant SKU Permanence (except `~ARC-` archive suffix)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION trg_enforce_variant_sku_permanence()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.sku IS DISTINCT FROM OLD.sku THEN
    IF OLD.sku IS NOT NULL AND NEW.sku LIKE (OLD.sku || '~ARC-%') THEN
      RETURN NEW;
    END IF;
    RAISE EXCEPTION 'Product variant SKU "%" is permanent and cannot be modified.', OLD.sku;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_variant_sku_permanence ON product_variants;
CREATE TRIGGER trg_variant_sku_permanence
BEFORE UPDATE ON product_variants
FOR EACH ROW
EXECUTE FUNCTION trg_enforce_variant_sku_permanence();

-- ------------------------------------------------------------
-- 2. Enforce UNIQUE constraint on batches.batch_number
-- ------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'batches_batch_number_unique'
      AND conrelid = 'batches'::regclass
  ) THEN
    ALTER TABLE batches
      ADD CONSTRAINT batches_batch_number_unique UNIQUE (batch_number);
  END IF;
END $$;

-- ------------------------------------------------------------
-- 3. Counter tables (Monthly reset in IST 'Asia/Kolkata')
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS order_number_counters (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  year_month  TEXT NOT NULL,
  sequence    INTEGER NOT NULL DEFAULT 0,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (business_id, year_month)
);

CREATE TABLE IF NOT EXISTS batch_number_counters (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id        UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  product_variant_id UUID NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
  year_month         TEXT NOT NULL,
  sequence           INTEGER NOT NULL DEFAULT 0,
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (business_id, product_variant_id, year_month)
);

ALTER TABLE order_number_counters ENABLE ROW LEVEL SECURITY;
ALTER TABLE batch_number_counters ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "order_number_counters_select" ON order_number_counters;
CREATE POLICY "order_number_counters_select"
  ON order_number_counters FOR SELECT
  USING (business_id = current_business_id());

DROP POLICY IF EXISTS "batch_number_counters_select" ON batch_number_counters;
CREATE POLICY "batch_number_counters_select"
  ON batch_number_counters FOR SELECT
  USING (business_id = current_business_id());

-- Seed counters safely from any existing rows already matching the new formats
INSERT INTO order_number_counters (business_id, year_month, sequence)
SELECT
  business_id,
  SUBSTRING(order_number FROM '^ORD-(\d{4})-\d+$') AS year_month,
  MAX(SUBSTRING(order_number FROM '^ORD-\d{4}-(\d+)$')::INTEGER) AS sequence
FROM orders
WHERE order_number ~ '^ORD-\d{4}-\d+$'
GROUP BY business_id, SUBSTRING(order_number FROM '^ORD-(\d{4})-\d+$')
ON CONFLICT (business_id, year_month) DO UPDATE
SET sequence = GREATEST(order_number_counters.sequence, EXCLUDED.sequence);

INSERT INTO batch_number_counters (business_id, product_variant_id, year_month, sequence)
SELECT
  business_id,
  product_variant_id,
  SUBSTRING(batch_number FROM '-(\d{4})-\d{2,}$') AS year_month,
  MAX(SUBSTRING(batch_number FROM '-(\d{2,})$')::INTEGER) AS sequence
FROM batches
WHERE batch_number ~ '^STK-.+-(\d{4})-(\d{2,})$'
GROUP BY business_id, product_variant_id, SUBSTRING(batch_number FROM '-(\d{4})-\d{2,}$')
ON CONFLICT (business_id, product_variant_id, year_month) DO UPDATE
SET sequence = GREATEST(batch_number_counters.sequence, EXCLUDED.sequence);

-- ------------------------------------------------------------
-- 4. Atomic Order Number Generator: ORD-[YYMM]-[XXXX]
--    Resets to 0001 at 00:00 IST on the 1st day of every month.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION next_order_number(
  p_business_id UUID,
  p_reference_ts TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_local_date DATE;
  v_yymm       TEXT;
  v_seq        INTEGER;
  v_candidate  TEXT;
BEGIN
  v_local_date := (COALESCE(p_reference_ts, NOW()) AT TIME ZONE 'Asia/Kolkata')::DATE;
  v_yymm := TO_CHAR(v_local_date, 'YYMM');

  LOOP
    INSERT INTO order_number_counters (business_id, year_month, sequence)
    VALUES (p_business_id, v_yymm, 1)
    ON CONFLICT (business_id, year_month)
    DO UPDATE SET
      sequence = order_number_counters.sequence + 1,
      updated_at = NOW()
    RETURNING sequence INTO v_seq;

    v_candidate := 'ORD-' || v_yymm || '-' || LPAD(v_seq::TEXT, 4, '0');

    EXIT WHEN NOT EXISTS (
      SELECT 1 FROM orders WHERE order_number = v_candidate
    );
  END LOOP;

  RETURN v_candidate;
END;
$$;

-- ------------------------------------------------------------
-- 5. Atomic Batch Number Generator: STK-[PREFIX]-[YYMM]-[XX]
--    Resets to 01 every new month per (business_id, product_variant_id).
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION next_batch_number(
  p_business_id UUID,
  p_variant_id  UUID,
  p_prefix      TEXT,
  p_batch_date  DATE DEFAULT NULL
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ref_date     DATE;
  v_yymm         TEXT;
  v_clean_prefix TEXT;
  v_seq          INTEGER;
  v_candidate    TEXT;
BEGIN
  v_ref_date := COALESCE(p_batch_date, (NOW() AT TIME ZONE 'Asia/Kolkata')::DATE);
  v_yymm := TO_CHAR(v_ref_date, 'YYMM');
  v_clean_prefix := NULLIF(
    TRIM(BOTH '-' FROM REGEXP_REPLACE(UPPER(TRIM(COALESCE(p_prefix, ''))), '[^A-Z0-9-]+', '-', 'g')),
    ''
  );
  IF v_clean_prefix IS NULL THEN
    v_clean_prefix := 'ITEM';
  END IF;

  LOOP
    INSERT INTO batch_number_counters (business_id, product_variant_id, year_month, sequence)
    VALUES (p_business_id, p_variant_id, v_yymm, 1)
    ON CONFLICT (business_id, product_variant_id, year_month)
    DO UPDATE SET
      sequence = batch_number_counters.sequence + 1,
      updated_at = NOW()
    RETURNING sequence INTO v_seq;

    v_candidate := 'STK-' || v_clean_prefix || '-' || v_yymm || '-' || LPAD(v_seq::TEXT, 2, '0');

    EXIT WHEN NOT EXISTS (
      SELECT 1 FROM batches WHERE batch_number = v_candidate
    );
  END LOOP;

  RETURN v_candidate;
END;
$$;

-- ------------------------------------------------------------
-- 6. Read-only Preview of Next Batch Number (does NOT increment counter)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION preview_next_batch_number(
  p_business_id UUID,
  p_variant_id  UUID,
  p_prefix      TEXT,
  p_batch_date  DATE DEFAULT NULL
)
RETURNS TEXT
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ref_date     DATE;
  v_yymm         TEXT;
  v_clean_prefix TEXT;
  v_seq          INTEGER;
  v_candidate    TEXT;
BEGIN
  v_ref_date := COALESCE(p_batch_date, (NOW() AT TIME ZONE 'Asia/Kolkata')::DATE);
  v_yymm := TO_CHAR(v_ref_date, 'YYMM');
  v_clean_prefix := NULLIF(
    TRIM(BOTH '-' FROM REGEXP_REPLACE(UPPER(TRIM(COALESCE(p_prefix, ''))), '[^A-Z0-9-]+', '-', 'g')),
    ''
  );
  IF v_clean_prefix IS NULL THEN
    v_clean_prefix := 'ITEM';
  END IF;

  SELECT COALESCE(sequence, 0) + 1
  INTO v_seq
  FROM batch_number_counters
  WHERE business_id = p_business_id
    AND product_variant_id = p_variant_id
    AND year_month = v_yymm;

  IF v_seq IS NULL THEN
    v_seq := 1;
  END IF;

  LOOP
    v_candidate := 'STK-' || v_clean_prefix || '-' || v_yymm || '-' || LPAD(v_seq::TEXT, 2, '0');
    EXIT WHEN NOT EXISTS (
      SELECT 1 FROM batches WHERE batch_number = v_candidate
    );
    v_seq := v_seq + 1;
  END LOOP;

  RETURN v_candidate;
END;
$$;

GRANT EXECUTE ON FUNCTION next_order_number(UUID, TIMESTAMPTZ) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION next_batch_number(UUID, UUID, TEXT, DATE) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION preview_next_batch_number(UUID, UUID, TEXT, DATE) TO authenticated, service_role;

