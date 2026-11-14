-- Migration 20240017: Web Push Notification Subscriptions table
-- Stores browser push subscription objects per device per business

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id   UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  endpoint      TEXT NOT NULL,
  p256dh        TEXT NOT NULL,
  auth          TEXT NOT NULL,
  device_label  TEXT,                       -- e.g. "iPhone", "Chrome Desktop"
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_used_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (business_id, endpoint)
);

CREATE INDEX IF NOT EXISTS idx_push_subs_business
  ON public.push_subscriptions(business_id);

-- RLS
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "push_subscriptions_select"
  ON public.push_subscriptions FOR SELECT
  USING (business_id = public.current_business_id());

CREATE POLICY "push_subscriptions_insert"
  ON public.push_subscriptions FOR INSERT
  WITH CHECK (business_id = public.current_business_id());

CREATE POLICY "push_subscriptions_delete"
  ON public.push_subscriptions FOR DELETE
  USING (business_id = public.current_business_id());

CREATE POLICY "push_subscriptions_update"
  ON public.push_subscriptions FOR UPDATE
  USING (business_id = public.current_business_id())
  WITH CHECK (business_id = public.current_business_id());

