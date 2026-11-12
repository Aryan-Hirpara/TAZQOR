-- Allow deleting unreferenced product pack sizes / variants within the business.
-- Financial/inventory references (batches, order_items, invoice_items) are
-- protected by ON DELETE RESTRICT foreign keys.
CREATE POLICY "product_variants_delete"
  ON product_variants FOR DELETE
  USING (business_id = current_business_id());

