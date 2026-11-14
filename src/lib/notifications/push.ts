// src/lib/notifications/push.ts
// Core push notification sender using web-push + VAPID

import * as webpush from "web-push";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:tazqor@gmail.com";

function initVapid() {
  if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
  }
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
  requireInteraction?: boolean;
}

export interface PushSubscriptionRecord {
  endpoint: string;
  p256dh: string;
  auth: string;
}

/**
 * Sends a push notification to a single subscription.
 * Returns true if sent, false if subscription is expired/invalid.
 */
export async function sendPushToSubscription(
  sub: PushSubscriptionRecord,
  payload: PushPayload
): Promise<boolean> {
  try {
    initVapid();
    await webpush.sendNotification(
      {
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh, auth: sub.auth },
      },
      JSON.stringify(payload),
      { TTL: 60 * 60 * 24 } // 24h time-to-live
    );
    return true;
  } catch (err: any) {
    // 410 Gone / 404 = subscription expired, should be removed
    if (err?.statusCode === 410 || err?.statusCode === 404) {
      return false;
    }
    console.error("Push send error:", err?.message || err);
    return false;
  }
}

/**
 * Sends push notification to all devices subscribed for a business.
 * Automatically removes expired subscriptions.
 */
export async function sendPushToAllDevices(
  db: any,
  businessId: string,
  payload: PushPayload
): Promise<{ sent: number; removed: number }> {
  const { data: subs } = await db
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("business_id", businessId);

  if (!subs || subs.length === 0) return { sent: 0, removed: 0 };

  let sent = 0;
  const expiredIds: string[] = [];

  await Promise.all(
    subs.map(async (sub: any) => {
      const ok = await sendPushToSubscription(
        { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
        payload
      );
      if (ok) {
        sent++;
      } else {
        expiredIds.push(sub.id);
      }
    })
  );

  // Remove stale subscriptions
  if (expiredIds.length > 0) {
    await db.from("push_subscriptions").delete().in("id", expiredIds);
  }

  return { sent, removed: expiredIds.length };
}

