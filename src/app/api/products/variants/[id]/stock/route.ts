import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedRouteDb } from "@/lib/supabase/route-db";
import { extractBatchPrefix } from "@/lib/identifiers/codes";

function getIstTodayIso(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthenticatedRouteDb();
    if (!auth.ok) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const { id: variantId } = await context.params;
    const body = await request.json();
    const targetStockRaw = Number(body?.target_stock);

    if (!Number.isFinite(targetStockRaw) || targetStockRaw < 0) {
      return NextResponse.json(
        { success: false, error: "Stock quantity must be zero or greater." },
        { status: 400 }
      );
    }

    const { data: variant, error: varErr } = await auth.db
      .from("product_variants")
      .select("id, sku, pack_size, cost_price, business_id, products(name)")
      .eq("id", variantId)
      .eq("business_id", auth.session.businessId)
      .maybeSingle();

    if (varErr) {
      return NextResponse.json({ success: false, error: varErr.message }, { status: 400 });
    }
    if (!variant) {
      return NextResponse.json(
        { success: false, error: "Pack size variant not found." },
        { status: 404 }
      );
    }

    const [{ data: stockRows, error: sohErr }, { data: existingBatches }] = await Promise.all([
      auth.db
        .from("v_stock_on_hand")
        .select("batch_id, quantity_on_hand")
        .eq("business_id", auth.session.businessId)
        .eq("product_variant_id", variantId),
      auth.db
        .from("batches")
        .select("id")
        .eq("business_id", auth.session.businessId)
        .eq("product_variant_id", variantId)
        .limit(1),
    ]);

    if (sohErr) {
      return NextResponse.json({ success: false, error: sohErr.message }, { status: 400 });
    }

    const currentTotal = (stockRows || []).reduce(
      (sum, row: any) => sum + (Number(row.quantity_on_hand) || 0),
      0
    );
    const delta = Math.round((targetStockRaw - currentTotal) * 1000) / 1000;

    if (Math.abs(delta) < 0.001) {
      return NextResponse.json({
        success: true,
        previous_stock: currentTotal,
        current_stock: currentTotal,
        changed: false,
      });
    }

    if (delta > 0) {
      const mfgDateStr = getIstTodayIso();
      const expiry = new Date(Date.now() + 730 * 86400000);
      const expiryDateStr = expiry.toISOString().split("T")[0];
      const prodRel = Array.isArray((variant as any).products)
        ? (variant as any).products[0]
        : (variant as any).products;
      const batchPrefix = extractBatchPrefix({
        variantSku: body?.sku || variant.sku,
        productName: prodRel?.name,
        packSize: variant.pack_size,
      });

      const { data: allocatedBatch, error: seqErr } = await auth.db.rpc(
        "next_batch_number",
        {
          p_business_id: auth.session.businessId,
          p_variant_id: variantId,
          p_prefix: batchPrefix,
          p_batch_date: mfgDateStr,
        }
      );

      if (seqErr || !allocatedBatch) {
        return NextResponse.json(
          {
            success: false,
            error: seqErr?.message || "Failed to allocate sequential batch number.",
          },
          { status: 500 }
        );
      }

      const batchNumber = String(allocatedBatch);
      const isOpening = currentTotal === 0 && (!existingBatches || existingBatches.length === 0);
      const unitCost =
        body?.cost_price !== undefined
          ? Number(body.cost_price) || 0
          : Number(variant.cost_price) || 0;

      const { data: createdBatch, error: batchErr } = await auth.db
        .from("batches")
        .insert({
          business_id: auth.session.businessId,
          product_variant_id: variantId,
          batch_number: batchNumber,
          manufacturing_date: mfgDateStr,
          expiry_date: expiryDateStr,
          quantity_received: delta,
          cost_per_unit: unitCost,
          notes: isOpening
            ? "Opening stock recorded from Products catalog"
            : "Stock increase recorded from Products catalog",
        })
        .select("id")
        .single();

      if (batchErr || !createdBatch) {
        return NextResponse.json(
          { success: false, error: batchErr?.message || "Failed to create stock batch." },
          { status: 400 }
        );
      }

      const { error: movErr } = await auth.db.from("stock_movements").insert({
        business_id: auth.session.businessId,
        product_variant_id: variantId,
        batch_id: createdBatch.id,
        movement_type: isOpening ? "opening_stock" : "adjustment_in",
        quantity: delta,
        reason: isOpening
          ? "Opening stock balance"
          : "Manual stock increase from Products catalog",
      });

      if (movErr) {
        return NextResponse.json({ success: false, error: movErr.message }, { status: 400 });
      }
    } else {
      let remainingToDeduct = Math.abs(delta);
      const positiveRows = (stockRows || []).filter(
        (r: any) => (Number(r.quantity_on_hand) || 0) > 0
      );

      for (const row of positiveRows) {
        if (remainingToDeduct <= 0) break;
        const avail = Number(row.quantity_on_hand) || 0;
        const take = Math.min(remainingToDeduct, avail);
        const { error: outErr } = await auth.db.from("stock_movements").insert({
          business_id: auth.session.businessId,
          product_variant_id: variantId,
          batch_id: row.batch_id || null,
          movement_type: "adjustment_out",
          quantity: take,
          reason: "Manual stock adjustment from Products catalog",
        });

        if (outErr) {
          return NextResponse.json({ success: false, error: outErr.message }, { status: 400 });
        }
        remainingToDeduct = Math.round((remainingToDeduct - take) * 1000) / 1000;
      }
    }

    return NextResponse.json({
      success: true,
      previous_stock: currentTotal,
      current_stock: targetStockRaw,
      changed: true,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to update stock balance" },
      { status: 500 }
    );
  }
}

