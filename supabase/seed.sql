-- ============================================================
-- TAZQOR Business Manager — Seed Data (Development / Demo only)
-- All demo records are marked with is_demo = true
-- ============================================================

DO $$
DECLARE
  v_biz_id UUID := '00000000-0000-0000-0000-000000000001';
  v_cat_handwash UUID := gen_random_uuid();
  v_cat_dishwash UUID := gen_random_uuid();
  v_cat_floor UUID := gen_random_uuid();
  v_cat_toilet UUID := gen_random_uuid();
  v_cat_glass UUID := gen_random_uuid();

  v_tax_18 UUID := gen_random_uuid();

  v_prod_floor UUID := gen_random_uuid();
  v_prod_dish UUID := gen_random_uuid();
  v_prod_hand UUID := gen_random_uuid();

  v_var_floor_5l UUID := gen_random_uuid();
  v_var_floor_1l UUID := gen_random_uuid();
  v_var_dish_5l UUID := gen_random_uuid();
  v_var_hand_500ml UUID := gen_random_uuid();

  v_batch_floor_1 UUID := gen_random_uuid();
  v_batch_dish_1 UUID := gen_random_uuid();

  v_cust_1 UUID := gen_random_uuid();
  v_cust_2 UUID := gen_random_uuid();
  v_cust_3 UUID := gen_random_uuid();
BEGIN
  -- 1. Demo Business
  INSERT INTO businesses (id, name, is_demo)
  VALUES (v_biz_id, 'TAZQOR Clean Solutions (Demo)', true)
  ON CONFLICT (id) DO NOTHING;

  -- 2. Business Settings
  INSERT INTO business_settings (
    business_id, legal_name, gstin, address_line1, city, state, state_code, pin,
    phone, gst_enabled, gst_confirmed, invoice_prefix, bill_prefix, round_off_enabled
  ) VALUES (
    v_biz_id, 'TAZQOR Clean Solutions LLP', '24AAACT1234F1Z5', 'Plot 42, Industrial Area',
    'Ahmedabad', 'Gujarat', '24', '380015', '+91 98765 43210', true, true, 'INV', 'BILL', true
  ) ON CONFLICT (business_id) DO NOTHING;

  -- 3. Tax Rates
  INSERT INTO tax_rates (id, business_id, name, rate)
  VALUES (v_tax_18, v_biz_id, 'GST 18%', 18.00)
  ON CONFLICT DO NOTHING;

  -- 4. Default Expense Categories
  INSERT INTO expense_categories (business_id, name, is_default) VALUES
    (v_biz_id, 'Raw Materials', true),
    (v_biz_id, 'Packaging', true),
    (v_biz_id, 'Transport & Fuel', true),
    (v_biz_id, 'Marketing & Samples', true),
    (v_biz_id, 'Utilities', true),
    (v_biz_id, 'Rent & Maintenance', true),
    (v_biz_id, 'Miscellaneous', true);

  -- 5. Categories
  INSERT INTO categories (id, business_id, name, sort_order) VALUES
    (v_cat_floor, v_biz_id, 'Floor Cleaner', 1),
    (v_cat_dishwash, v_biz_id, 'Dish Wash', 2),
    (v_cat_handwash, v_biz_id, 'Hand Wash', 3),
    (v_cat_toilet, v_biz_id, 'Toilet Cleaner', 4),
    (v_cat_glass, v_biz_id, 'Glass Cleaner', 5);

  -- 6. Products & Variants
  -- Floor Cleaner
  INSERT INTO products (id, business_id, name, category_id, sku, hsn, is_demo)
  VALUES (v_prod_floor, v_biz_id, 'TAZQOR Citrus Floor Cleaner', v_cat_floor, 'TC-FLR-01', '3402', true);

  INSERT INTO product_variants (id, product_id, business_id, name, sku, pack_size, cost_price, selling_price, tax_rate_id, reorder_level)
  VALUES 
    (v_var_floor_5l, v_prod_floor, v_biz_id, '5 Litre Can', 'TC-FLR-01-5L', '5 L', 280.00, 450.00, v_tax_18, 10),
    (v_var_floor_1l, v_prod_floor, v_biz_id, '1 Litre Bottle', 'TC-FLR-01-1L', '1 L', 65.00, 110.00, v_tax_18, 25);

  -- Dish Wash
  INSERT INTO products (id, business_id, name, category_id, sku, hsn, is_demo)
  VALUES (v_prod_dish, v_biz_id, 'TAZQOR Sparkle Dish Wash Gel', v_cat_dishwash, 'TC-DSH-01', '3402', true);

  INSERT INTO product_variants (id, product_id, business_id, name, sku, pack_size, cost_price, selling_price, tax_rate_id, reorder_level)
  VALUES 
    (v_var_dish_5l, v_prod_dish, v_biz_id, '5 Litre Can', 'TC-DSH-01-5L', '5 L', 310.00, 520.00, v_tax_18, 8);

  -- Hand Wash
  INSERT INTO products (id, business_id, name, category_id, sku, hsn, is_demo)
  VALUES (v_prod_hand, v_biz_id, 'TAZQOR Anti-Bacterial Hand Wash', v_cat_handwash, 'TC-HND-01', '3401', true);

  INSERT INTO product_variants (id, product_id, business_id, name, sku, pack_size, cost_price, selling_price, tax_rate_id, reorder_level)
  VALUES 
    (v_var_hand_500ml, v_prod_hand, v_biz_id, '500 mL Dispenser', 'TC-HND-01-500M', '500 mL', 45.00, 85.00, v_tax_18, 30);

  -- 7. Batches & Initial Stock
  INSERT INTO batches (id, business_id, product_variant_id, batch_number, manufacturing_date, expiry_date, quantity_received, cost_per_unit)
  VALUES 
    (v_batch_floor_1, v_biz_id, v_var_floor_5l, 'B-FLR-2026-01', '2026-01-15', '2028-01-14', 100, 280.00),
    (v_batch_dish_1, v_biz_id, v_var_dish_5l, 'B-DSH-2026-01', '2026-02-01', '2028-01-31', 80, 310.00);

  INSERT INTO stock_movements (business_id, product_variant_id, batch_id, movement_type, quantity, reason)
  VALUES
    (v_biz_id, v_var_floor_5l, v_batch_floor_1, 'opening_stock', 100, 'Initial opening stock'),
    (v_biz_id, v_var_dish_5l, v_batch_dish_1, 'opening_stock', 80, 'Initial opening stock');

  -- 8. Customers
  INSERT INTO customers (id, business_id, name, shop_name, contact_person, phone, whatsapp, type, city, state, pin, status, customer_code, is_demo, lat, lng)
  VALUES
    (v_cust_1, v_biz_id, 'Shreeji Supermarket', 'Shreeji Provision Store', 'Haresh Patel', '+91 98250 11223', '+91 98250 11223', 'grocery', 'Ahmedabad', 'Gujarat', '380015', 'active', 'CUST-001', true, 23.0225, 72.5714),
    (v_cust_2, v_biz_id, 'Hotel Pride Plaza', 'Pride Hospitality Group', 'Rohit Verma', '+91 99090 44556', '+91 99090 44556', 'hotel', 'Ahmedabad', 'Gujarat', '380054', 'active', 'CUST-002', true, 23.0338, 72.5073),
    (v_cust_3, v_biz_id, 'Apex Co-Working Space', 'Apex Tech Park Office', 'Neha Shah', '+91 97120 77889', '+91 97120 77889', 'office', 'Gandhinagar', 'Gujarat', '382010', 'active', 'CUST-003', true, 23.2156, 72.6369);

END $$;

