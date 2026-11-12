-- ============================================================
-- TAZQOR Business Manager — Combo Pack Component Recipes
-- Migration: 20240010_combo_pack_items.sql
-- ============================================================

CREATE TABLE IF NOT EXISTS public.combo_pack_items (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id          UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  combo_product_id     UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  combo_variant_id     UUID NOT NULL REFERENCES public.product_variants(id) ON DELETE CASCADE,
  component_variant_id UUID NOT NULL REFERENCES public.product_variants(id) ON DELETE RESTRICT,
  quantity             NUMERIC(14, 3) NOT NULL CHECK (quantity > 0),
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT combo_pack_items_unique UNIQUE (combo_variant_id, component_variant_id)
);

CREATE INDEX IF NOT EXISTS idx_combo_pack_items_combo
  ON public.combo_pack_items (business_id, combo_variant_id);

CREATE INDEX IF NOT EXISTS idx_combo_pack_items_component
  ON public.combo_pack_items (component_variant_id);

ALTER TABLE public.combo_pack_items ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'combo_pack_items' AND policyname = 'combo_pack_items_select'
  ) THEN
    CREATE POLICY "combo_pack_items_select"
      ON public.combo_pack_items FOR SELECT
      USING (business_id = public.current_business_id());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'combo_pack_items' AND policyname = 'combo_pack_items_insert'
  ) THEN
    CREATE POLICY "combo_pack_items_insert"
      ON public.combo_pack_items FOR INSERT
      WITH CHECK (business_id = public.current_business_id());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'combo_pack_items' AND policyname = 'combo_pack_items_update'
  ) THEN
    CREATE POLICY "combo_pack_items_update"
      ON public.combo_pack_items FOR UPDATE
      USING (business_id = public.current_business_id())
      WITH CHECK (business_id = public.current_business_id());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'combo_pack_items' AND policyname = 'combo_pack_items_delete'
  ) THEN
    CREATE POLICY "combo_pack_items_delete"
      ON public.combo_pack_items FOR DELETE
      USING (business_id = public.current_business_id());
  END IF;
END $$;

CREATE OR REPLACE TRIGGER trg_combo_pack_items_updated_at
  BEFORE UPDATE ON public.combo_pack_items
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

