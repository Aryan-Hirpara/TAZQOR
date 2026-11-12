-- ============================================================================
-- TAZQOR — Reset All Business & Demo Data (Keep Schema & Workspace Config)
-- ============================================================================
-- How to run:
--   1. Open Supabase Dashboard -> SQL Editor -> New query
--   2. Paste the contents of this file and click "Run"
--
-- What this removes:
--   - All customers, addresses, notes, visits, and follow-ups
--   - All products, variants, categories, suppliers, batches, and stock movements
--   - All orders, invoices, invoice counters, payments, credit notes, expenses, and audit logs
--   - Any custom (non-default) expense categories
--
-- What this preserves (required so manual entry in the app keeps working):
--   - All tables, columns, indexes, views, functions, triggers, and RLS policies
--   - Anchor workspace business row (00000000-0000-0000-0000-000000000001)
--   - Business settings row, GST tax rates, and default expense categories
-- ============================================================================

BEGIN;

TRUNCATE TABLE
  public.audit_logs,
  public.payment_allocations,
  public.credit_notes,
  public.payments,
  public.invoice_item_batches,
  public.invoice_items,
  public.invoice_number_counters,
  public.invoices,
  public.order_items,
  public.orders,
  public.stock_movements,
  public.batches,
  public.product_variants,
  public.products,
  public.categories,
  public.suppliers,
  public.follow_ups,
  public.customer_visits,
  public.customer_notes,
  public.customer_addresses,
  public.customers,
  public.expenses
RESTART IDENTITY CASCADE;

-- Remove custom expense categories while keeping system defaults
DELETE FROM public.expense_categories
WHERE is_default = FALSE;

-- Mark workspace business as live (non-demo)
UPDATE public.businesses
SET name = 'TAZQOR',
    is_demo = FALSE
WHERE id = '00000000-0000-0000-0000-000000000001';

COMMIT;

-- Verification: all counts below should be 0
SELECT 'customers' AS table_name, COUNT(*) AS remaining_rows FROM public.customers
UNION ALL SELECT 'categories', COUNT(*) FROM public.categories
UNION ALL SELECT 'products', COUNT(*) FROM public.products
UNION ALL SELECT 'product_variants', COUNT(*) FROM public.product_variants
UNION ALL SELECT 'batches', COUNT(*) FROM public.batches
UNION ALL SELECT 'stock_movements', COUNT(*) FROM public.stock_movements
UNION ALL SELECT 'orders', COUNT(*) FROM public.orders
UNION ALL SELECT 'invoices', COUNT(*) FROM public.invoices
UNION ALL SELECT 'payments', COUNT(*) FROM public.payments
UNION ALL SELECT 'customer_visits', COUNT(*) FROM public.customer_visits
UNION ALL SELECT 'expenses', COUNT(*) FROM public.expenses
UNION ALL SELECT 'audit_logs', COUNT(*) FROM public.audit_logs;

