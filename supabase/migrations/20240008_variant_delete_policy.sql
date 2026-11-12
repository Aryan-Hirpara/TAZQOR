-- Allow deleting unreferenced product pack sizes / variants within the business.
-- Financial/inventory references (batches, order_items, invoice_items) are
-- protected by ON DELETE RESTRICT foreign keys.
DROP POLICY IF EXISTS "product_variants_delete" ON product_variants;
CREATE POLICY "product_variants_delete"
  ON product_variants FOR DELETE
  USING (business_id = current_business_id());

