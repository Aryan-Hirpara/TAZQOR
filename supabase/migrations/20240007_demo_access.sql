-- ============================================================
-- TAZQOR — Seamless Dev & Demo Access Policy Update
-- Enables current_business_id() to fall back to the demo business
-- when auth.uid() is null (e.g., local dev or demo mode).
-- ============================================================

CREATE OR REPLACE FUNCTION current_business_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT business_id FROM profiles WHERE id = auth.uid() LIMIT 1),
    '00000000-0000-0000-0000-000000000001'::uuid
  );
$$;

