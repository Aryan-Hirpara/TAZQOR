-- Migration 20240016: Clean database, normalize expenses, add monthly target and order delivery stock flag

-- 1. Add monthly_target column to business_settings to eliminate localStorage dependency
ALTER TABLE public.business_settings
  ADD COLUMN IF NOT EXISTS monthly_target NUMERIC DEFAULT 0;

-- 2. Add delivery_stock_deducted boolean to orders
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS delivery_stock_deducted BOOLEAN DEFAULT false;

-- 3. Clean up the description column in expenses:
-- Remove the bracketed string '[Expense: ... | Paid by: ...]' since expense_name and paid_by are dedicated columns
UPDATE public.expenses
SET description = NULL
WHERE description LIKE '[Expense:%|%Paid by:%]';

-- 4. Drop unused legacy starter tables (customer data lives directly on customers table)
DROP TABLE IF EXISTS public.customer_addresses CASCADE;
DROP TABLE IF EXISTS public.customer_notes CASCADE;

