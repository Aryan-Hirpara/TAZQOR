-- ============================================================
-- TAZQOR Business Manager — Safe Backfill of Unreferenced Legacy SKUs & Batches
-- Migration: 20240013_backfill_legacy_skus_batches.sql
-- ============================================================
-- Updates un-invoiced, un-ordered starter catalog items (TQR-001..005)
-- and their opening batches (STK-TQR-00x-...) to the standardized formats:
--   - Variant SKU: TQR-[PROD]-[SIZE]
--   - Batch #:     STK-[PROD]-[SIZE]-[YYMM]-[XX]
-- Strictly guards against modifying any variant referenced by invoices or orders,
-- and syncs batch_number_counters so subsequent receipts continue sequentially (-02, ...).
-- ============================================================

ALTER TABLE product_variants DISABLE TRIGGER trg_variant_sku_permanence;

DO $$
DECLARE
  v_rec RECORD;
BEGIN
  -- 1. Update base product SKUs safely if no conflict and unreferenced
  FOR v_rec IN
    SELECT * FROM (VALUES
      ('TQR-001', 'TQR-DW'),
      ('TQR-002', 'TQR-LS'),
      ('TQR-003', 'TQR-WP'),
      ('TQR-004', 'TQR-TC'),
      ('TQR-005', 'TQR-TWLD')
    ) AS m(old_sku, new_sku)
  LOOP
    IF NOT EXISTS (SELECT 1 FROM products WHERE sku = v_rec.new_sku) THEN
      UPDATE products p
      SET sku = v_rec.new_sku
      WHERE p.sku = v_rec.old_sku
        AND NOT EXISTS (
          SELECT 1 FROM product_variants pv
          JOIN invoice_items ii ON ii.product_variant_id = pv.id
          WHERE pv.product_id = p.id
        )
        AND NOT EXISTS (
          SELECT 1 FROM product_variants pv
          JOIN order_items oi ON oi.product_variant_id = pv.id
          WHERE pv.product_id = p.id
        );
    END IF;
  END LOOP;

  -- 2. Update variant SKUs (and fix truncated numeric names like '1'/'2') safely
  FOR v_rec IN
    SELECT * FROM (VALUES
      ('TQR-001-250ml', 'TQR-DW-250M', '250ml'),
      ('TQR-002-250ml', 'TQR-LS-250M', '250ml'),
      ('TQR-003-1L',    'TQR-WP-1L',   '1L'),
      ('TQR-004-500ml', 'TQR-TC-500M', '500ml'),
      ('TQR-005-COMBO', 'TQR-TWLD-CMB-2L', NULL)
    ) AS m(old_sku, new_sku, clean_name)
  LOOP
    IF NOT EXISTS (SELECT 1 FROM product_variants WHERE sku = v_rec.new_sku) THEN
      UPDATE product_variants pv
      SET
        sku = v_rec.new_sku,
        name = CASE
          WHEN v_rec.clean_name IS NOT NULL AND pv.name ~ '^\d+$' THEN v_rec.clean_name
          ELSE pv.name
        END
      WHERE pv.sku = v_rec.old_sku
        AND NOT EXISTS (SELECT 1 FROM invoice_items ii WHERE ii.product_variant_id = pv.id)
        AND NOT EXISTS (SELECT 1 FROM order_items oi WHERE oi.product_variant_id = pv.id);
    END IF;
  END LOOP;

  -- 3. Update un-invoiced opening batch numbers & sync batch_number_counters
  FOR v_rec IN
    SELECT * FROM (VALUES
      ('STK-TQR-001-250M-782795', 'STK-DW-250M-2611-01'),
      ('STK-TQR-002-250M-862312', 'STK-LS-250M-2611-01'),
      ('STK-TQR-003-1L-950852',   'STK-WP-1L-2611-01'),
      ('STK-TQR-004-500M-099172', 'STK-TC-500M-2611-01')
    ) AS m(old_batch, new_batch)
  LOOP
    IF NOT EXISTS (SELECT 1 FROM batches WHERE batch_number = v_rec.new_batch) THEN
      UPDATE batches b
      SET batch_number = v_rec.new_batch
      WHERE b.batch_number = v_rec.old_batch
        AND NOT EXISTS (
          SELECT 1 FROM invoice_items ii WHERE ii.product_variant_id = b.product_variant_id
        )
        AND NOT EXISTS (
          SELECT 1 FROM stock_movements sm
          WHERE sm.batch_id = b.id AND sm.movement_type <> 'opening_stock'
        );
    END IF;
  END LOOP;
END $$;

ALTER TABLE product_variants ENABLE TRIGGER trg_variant_sku_permanence;

-- Sync counters so the next receipt for each variant in 2611 increments cleanly to -02
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

