// src/app/api/cron/due-bills/route.ts
// Vercel Cron: runs daily at 10 AM IST — alerts on overdue unpaid invoices

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { sendPushToAllDevices } from "@/lib/notifications/push";
import { formatINR } from "@/lib/formatting/currency";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BUSINESS_ID = "00000000-0000-0000-0000-000000000001";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = createAdminClient();
  if (!db) return NextResponse.json({ error: "No admin client" }, { status: 500 });

  try {
    const today = new Date().toISOString().split("T")[0];

    // Get overdue invoices with outstanding balances
    const { data: overdueInvs } = await db
      .from("invoices")
      .select("id, invoice_number, grand_total, due_date, customers(name, shop_name)")
      .eq("business_id", BUSINESS_ID)
      .eq("status", "finalized")
      .lt("due_date", today)
      .not("due_date", "is", null)
      .order("due_date", { ascending: true })
      .limit(10);

    if (!overdueInvs || overdueInvs.length === 0) {
      return NextResponse.json({ success: true, sent: 0, reason: "No overdue bills" });
    }

    // Cross-check with v_invoice_outstanding to confirm still unpaid
    const { data: outRows } = await db
      .from("v_invoice_outstanding")
      .select("invoice_id, outstanding")
      .in("invoice_id", overdueInvs.map((i: any) => i.id))
      .gt("outstanding", 0);

    const outMap = new Map((outRows || []).map((r: any) => [r.invoice_id, Number(r.outstanding)]));
    const unpaid = overdueInvs.filter((i: any) => (outMap.get(i.id) || 0) > 0);

    if (unpaid.length === 0) {
      return NextResponse.json({ success: true, sent: 0, reason: "All overdue invoices are settled" });
    }

    const totalOverdue = unpaid.reduce((s: number, i: any) => s + (outMap.get(i.id) || 0), 0);
    const first = unpaid[0];
    const custName = (first.customers as any)?.shop_name || (first.customers as any)?.name || "Customer";
    const daysOverdue = Math.floor((Date.now() - new Date(first.due_date).getTime()) / 86400000);

    let title = "";
    let body = "";

    if (unpaid.length === 1) {
      title = `💸 Overdue: ${first.invoice_number}`;
      body = `${custName} • ${formatINR(outMap.get(first.id) || 0)} • ${daysOverdue} day${daysOverdue !== 1 ? "s" : ""} overdue`;
    } else {
      title = `💸 ${unpaid.length} Bills Overdue — ${formatINR(totalOverdue)}`;
      body = `${custName} +${unpaid.length - 1} more • Total outstanding: ${formatINR(totalOverdue)}`;
    }

    const result = await sendPushToAllDevices(db, BUSINESS_ID, {
      title,
      body,
      url: "/invoices",
      tag: "due-bills",
      requireInteraction: true,
    });

    return NextResponse.json({ success: true, ...result, unpaidCount: unpaid.length, totalOverdue });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message }, { status: 500 });
  }
}

