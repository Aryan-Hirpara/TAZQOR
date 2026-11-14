// src/app/api/cron/daily-summary/route.ts
// Vercel Cron: runs daily at 9:30 PM IST (16:00 UTC) — sends today's sales + profit summary

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { sendPushToAllDevices } from "@/lib/notifications/push";
import { formatINR } from "@/lib/formatting/currency";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BUSINESS_ID = "00000000-0000-0000-0000-000000000001";

export async function GET(request: Request) {
  // Vercel cron secret guard (enforced when CRON_SECRET is configured)
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = createAdminClient();
  if (!db) return NextResponse.json({ error: "No admin client" }, { status: 500 });

  try {
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    // Today's finalized invoices
    const { data: todayInvoices } = await db
      .from("invoices")
      .select("grand_total, invoice_number")
      .eq("business_id", BUSINESS_ID)
      .eq("status", "finalized")
      .gte("finalized_at", `${todayStr}T00:00:00`)
      .lt("finalized_at", `${todayStr}T23:59:59`);

    const todaySales = (todayInvoices || []).reduce((s: number, i: any) => s + Number(i.grand_total), 0);
    const todayBillCount = (todayInvoices || []).length;

    // Today's total expenses
    const { data: todayExpenses } = await db
      .from("expenses")
      .select("amount")
      .eq("business_id", BUSINESS_ID)
      .eq("expense_date", todayStr);

    const todayExpenseTotal = (todayExpenses || []).reduce((s: number, e: any) => s + Number(e.amount), 0);

    // Pending (undelivered) orders count
    const { count: pendingOrders } = await db
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("business_id", BUSINESS_ID)
      .in("status", ["confirmed", "processing", "dispatched"]);

    // Outstanding invoices
    const { data: outstandingData } = await db
      .from("v_invoice_outstanding")
      .select("outstanding")
      .gt("outstanding", 0);

    const totalOutstanding = (outstandingData || []).reduce((s: number, r: any) => s + Number(r.outstanding), 0);

    // Build meaningful summary
    const profit = todaySales - todayExpenseTotal;
    const hasActivity = todaySales > 0 || todayBillCount > 0;

    let body = "";
    if (hasActivity) {
      body = `Sales: ${formatINR(todaySales)} (${todayBillCount} bill${todayBillCount !== 1 ? "s" : ""})`;
      if (profit > 0) body += ` • Profit: ${formatINR(profit)}`;
      if (totalOutstanding > 0) body += ` • Outstanding: ${formatINR(totalOutstanding)}`;
      if (pendingOrders && pendingOrders > 0) body += ` • ${pendingOrders} order${pendingOrders !== 1 ? "s" : ""} pending`;
    } else {
      body = "No sales today.";
      if (totalOutstanding > 0) body += ` Outstanding: ${formatINR(totalOutstanding)}`;
      if (pendingOrders && pendingOrders > 0) body += ` • ${pendingOrders} order${pendingOrders !== 1 ? "s" : ""} pending`;
    }

    const result = await sendPushToAllDevices(db, BUSINESS_ID, {
      title: `📊 ${today.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })} Summary`,
      body,
      url: "/dashboard",
      tag: "daily-summary",
    });

    return NextResponse.json({ success: true, ...result, todaySales, todayBillCount, profit });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message }, { status: 500 });
  }
}

