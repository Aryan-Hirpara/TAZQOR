// src/app/api/notifications/test/route.ts
// Sends an immediate test push notification to all subscribed devices of the current business

import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedRouteDb } from "@/lib/supabase/route-db";
import { sendPushToAllDevices } from "@/lib/notifications/push";

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthenticatedRouteDb();
    if (!auth.ok) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const businessId = auth.session.businessId;

    const result = await sendPushToAllDevices(auth.db, businessId, {
      title: "🔔 TAZQOR Live Alert Connected!",
      body: "Mobile & screen notifications are working in real-time. You will receive alerts for orders, bills, stock, and emails.",
      url: "/dashboard",
      tag: "test-alert",
      requireInteraction: true,
    });

    if (result.sent === 0) {
      return NextResponse.json({
        success: false,
        error: "No active device subscriptions found. Please enable push notifications on your phone or browser first.",
        sent: 0,
      });
    }

    return NextResponse.json({
      success: true,
      message: `Test notification sent to ${result.sent} device(s)!`,
      sent: result.sent,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to send test push notification" },
      { status: 500 }
    );
  }
}

