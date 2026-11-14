// src/app/api/notifications/subscribe/route.ts
// Saves or updates a Web Push subscription for the current business device

import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedRouteDb } from "@/lib/supabase/route-db";

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthenticatedRouteDb();
    if (!auth.ok) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const body = await request.json().catch(() => null);
    const sub = body?.subscription;
    const deviceLabel = typeof body?.device_label === "string" ? body.device_label.trim() : null;

    if (!sub?.endpoint || !sub?.keys?.p256dh || !sub?.keys?.auth) {
      return NextResponse.json({ success: false, error: "Invalid push subscription object." }, { status: 400 });
    }

    const { error } = await auth.db
      .from("push_subscriptions")
      .upsert(
        {
          business_id: auth.session.businessId,
          endpoint: sub.endpoint,
          p256dh: sub.keys.p256dh,
          auth: sub.keys.auth,
          device_label: deviceLabel,
          last_used_at: new Date().toISOString(),
        },
        { onConflict: "business_id,endpoint" }
      );

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || "Failed to save subscription" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await getAuthenticatedRouteDb();
    if (!auth.ok) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const body = await request.json().catch(() => null);
    const endpoint = body?.endpoint;

    if (!endpoint) {
      // Delete all subscriptions for this business (logout / disable all)
      await auth.db.from("push_subscriptions").delete().eq("business_id", auth.session.businessId);
    } else {
      await auth.db
        .from("push_subscriptions")
        .delete()
        .eq("business_id", auth.session.businessId)
        .eq("endpoint", endpoint);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || "Failed to remove subscription" }, { status: 500 });
  }
}

