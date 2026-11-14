// src/app/api/cron/low-stock/route.ts
// Vercel Cron: runs at 8 AM IST — alerts when variants are at or below reorder level

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { sendPushToAllDevices } from "@/lib/notifications/push";

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
    // v_stock_summary has total_quantity_on_hand, reorder_level, stock_status
    const { data: lowStockItems } = await db
      .from("v_stock_summary")
      .select("product_variant_id, total_quantity_on_hand, reorder_level, stock_status, product_variants(name, sku, products(name))")
      .eq("business_id", BUSINESS_ID)
      .in("stock_status", ["low_stock", "out_of_stock"])
      .order("total_quantity_on_hand", { ascending: true });

    if (!lowStockItems || lowStockItems.length === 0) {
      return NextResponse.json({ success: true, sent: 0, reason: "All stock levels OK" });
    }

    const outOfStock = lowStockItems.filter((i: any) => i.stock_status === "out_of_stock");
    const lowStock = lowStockItems.filter((i: any) => i.stock_status === "low_stock");

    let title = "";
    let body = "";

    if (outOfStock.length > 0) {
      const first = outOfStock[0];
      const pv = first.product_variants as any;
      const prodName = pv?.products?.name || "Product";
      const packSize = pv?.name || "";
      title = `🔴 OUT OF STOCK: ${prodName}${packSize ? ` ${packSize}` : ""}`;
      body = outOfStock.length === 1
        ? `0 units remaining — reorder immediately`
        : `${outOfStock.length} variants are out of stock`;
      if (lowStock.length > 0) body += ` • ${lowStock.length} more running low`;
    } else {
      const first = lowStock[0];
      const pv = first.product_variants as any;
      const prodName = pv?.products?.name || "Product";
      const packSize = pv?.name || "";
      title = `⚠️ Low Stock Alert`;
      body = lowStock.length === 1
        ? `${prodName}${packSize ? ` ${packSize}` : ""} — only ${Number(first.total_quantity_on_hand)} units left`
        : `${lowStock.length} variants running low: ${lowStock.slice(0, 2).map((i: any) => {
            const p = i.product_variants as any;
            return `${p?.products?.name || ""}${p?.name ? ` ${p.name}` : ""} (${Number(i.total_quantity_on_hand)})`;
          }).join(", ")}${lowStock.length > 2 ? ` +${lowStock.length - 2} more` : ""}`;
    }

    const result = await sendPushToAllDevices(db, BUSINESS_ID, {
      title,
      body,
      url: "/inventory",
      tag: "low-stock",
      requireInteraction: outOfStock.length > 0,
    });

    return NextResponse.json({ success: true, ...result, lowStockCount: lowStockItems.length });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message }, { status: 500 });
  }
}

