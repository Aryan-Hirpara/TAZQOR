// src/app/api/cron/pending-orders/route.ts
// Vercel Cron: runs every 4 hours — alerts on orders confirmed >12h ago but not delivered

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { sendPushToAllDevices } from "@/lib/notifications/push";
import { formatINR } from "@/lib/formatting/currency";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BUSINESS_ID = "00000000-0000-0000-0000-000000000001";
const STALE_HOURS = 12; // alert if order is confirmed but not delivered for 12+ hours

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = createAdminClient();
  if (!db) return NextResponse.json({ error: "No admin client" }, { status: 500 });

  try {
    const cutoff = new Date(Date.now() - STALE_HOURS * 60 * 60 * 1000).toISOString();

    const { data: staleOrders } = await db
      .from("orders")
      .select("id, order_number, created_at, status, customers(name, shop_name), order_items(quantity, unit_price)")
      .eq("business_id", BUSINESS_ID)
      .in("status", ["confirmed", "processing", "dispatched"])
      .lt("updated_at", cutoff)
      .order("created_at", { ascending: true })
      .limit(5);

    if (!staleOrders || staleOrders.length === 0) {
      return NextResponse.json({ success: true, sent: 0, reason: "No stale orders" });
    }

    // Build one meaningful notification per stale order batch
    const count = staleOrders.length;
    const first = staleOrders[0];
    const custName = (first.customers as any)?.shop_name || (first.customers as any)?.name || "Customer";
    const orderTotal = ((first.order_items as any[]) || []).reduce(
      (s: number, it: any) => s + Number(it.quantity) * Number(it.unit_price),
      0
    );

    let title = "";
    let body = "";
    if (count === 1) {
      const hours = Math.round((Date.now() - new Date(first.created_at).getTime()) / 3600000);
      title = `⏰ Order ${first.order_number} — ${first.status}`;
      body = `${custName} • ${formatINR(orderTotal)} • ${hours}h ago — still not delivered`;
    } else {
      title = `⏰ ${count} Orders Still Pending`;
      const names = staleOrders.slice(0, 3).map((o: any) => {
        const c = (o.customers as any);
        return c?.shop_name || c?.name || o.order_number;
      }).join(", ");
      body = `${names}${count > 3 ? ` +${count - 3} more` : ""} — awaiting delivery`;
    }

    const result = await sendPushToAllDevices(db, BUSINESS_ID, {
      title,
      body,
      url: "/orders",
      tag: "pending-orders",
      requireInteraction: true,
    });

    return NextResponse.json({ success: true, ...result, count });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message }, { status: 500 });
  }
}

