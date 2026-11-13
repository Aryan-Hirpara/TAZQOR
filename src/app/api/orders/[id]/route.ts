import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedRouteDb } from "@/lib/supabase/route-db";
import { deleteOrderAndRecoverStock } from "@/lib/supabase/document-cleanup";
import {
  expandComboStockDeductions,
  parseComboRecipe,
} from "@/lib/products/combo-pack";

// ============================================================
// DELETE — permanently delete order + recover stock
// ============================================================
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthenticatedRouteDb();
    if (!auth.ok) {
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: auth.status }
      );
    }

    const { id: orderId } = await context.params;
    const url = new URL(request.url);
    const deleteLinkedInvoices = url.searchParams.get("delete_linked_invoices") !== "false";

    const res = await deleteOrderAndRecoverStock(
      auth.db,
      auth.session.businessId,
      orderId,
      deleteLinkedInvoices
    );

    if (!res.ok) {
      return NextResponse.json(
        { success: false, error: res.error || "Failed to delete order" },
        { status: res.status }
      );
    }

    return NextResponse.json({
      success: true,
      deletedInvoices: res.deletedInvoices || 0,
      stockMovementsRemoved: res.stockMovementsRemoved || 0,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to delete order" },
      { status: 500 }
    );
  }
}

// ============================================================
// PATCH — update order status (handles delivery + cancellation)
// - delivered:  FEFO stock deduction + auto-create draft invoice
// - cancelled:  revert stock movements + cancel draft invoice
// - other:      simple status update
// ============================================================
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthenticatedRouteDb();
    if (!auth.ok) {
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: auth.status }
      );
    }

    const { id: orderId } = await context.params;
    const businessId = auth.session.businessId;
    const body = await request.json().catch(() => ({}));
    const newStatus: string = typeof body?.status === "string" ? body.status.trim() : "";

    const VALID_STATUSES = ["draft", "confirmed", "processing", "dispatched", "delivered", "cancelled"];
    if (!newStatus || !VALID_STATUSES.includes(newStatus)) {
      return NextResponse.json(
        { success: false, error: `Invalid status: "${newStatus}".` },
        { status: 400 }
      );
    }

    // Fetch order with its items
    const { data: order, error: ordErr } = await auth.db
      .from("orders")
      .select("id, order_number, status, delivery_stock_deducted, customer_id, order_items(id, product_variant_id, quantity, unit_price, discount_percent)")
      .eq("id", orderId)
      .eq("business_id", businessId)
      .maybeSingle();

    if (ordErr) {
      return NextResponse.json({ success: false, error: ordErr.message }, { status: 400 });
    }
    if (!order) {
      return NextResponse.json({ success: false, error: "Order not found." }, { status: 404 });
    }

    const previousStatus: string = order.status;

    // No-op guard
    if (previousStatus === newStatus) {
      return NextResponse.json({ success: true, status: newStatus, order_id: orderId });
    }

    // ── DELIVERED: deduct stock + create draft invoice ──────────────────
    if (newStatus === "delivered" && !order.delivery_stock_deducted) {
      const orderItems: Array<{ id: string; product_variant_id: string; quantity: number; unit_price: number; discount_percent: number }> =
        (order.order_items || []).filter((it: any) => it.product_variant_id);

      if (orderItems.length > 0) {
        const variantIds = Array.from(new Set(orderItems.map((it) => it.product_variant_id)));

        // Resolve combo recipes
        const [{ data: variantsMeta }, comboTableRes] = await Promise.all([
          auth.db
            .from("product_variants")
            .select("id, product_id, products(id, name, image_url)")
            .in("id", variantIds),
          auth.db
            .from("combo_pack_items" as any)
            .select("combo_variant_id, component_variant_id, quantity")
            .eq("business_id", businessId)
            .in("combo_variant_id", variantIds),
        ]);

        const recipeByVariantId = new Map<string, Array<{ variant_id: string; quantity: number }>>();
        if (!comboTableRes.error && Array.isArray(comboTableRes.data)) {
          for (const row of comboTableRes.data as any[]) {
            if (!row?.combo_variant_id || !row?.component_variant_id) continue;
            const list = recipeByVariantId.get(row.combo_variant_id) || [];
            list.push({ variant_id: row.component_variant_id, quantity: Number(row.quantity) || 1 });
            recipeByVariantId.set(row.combo_variant_id, list);
          }
        }
        for (const vm of (variantsMeta || []) as any[]) {
          if (recipeByVariantId.has(vm.id)) continue;
          const parsed = parseComboRecipe(vm.products?.image_url);
          if (parsed && parsed.length > 0) recipeByVariantId.set(vm.id, parsed);
        }

        // Build deductions (handle combo expansions)
        const deductions = expandComboStockDeductions(
          orderItems.map((it) => ({
            itemId: it.id,
            variantId: it.product_variant_id,
            quantity: Number(it.quantity),
          })),
          recipeByVariantId
        );

        const targetVariantIds = Array.from(new Set(deductions.map((d) => d.targetVariantId)));

        // Fetch stock on hand + batches
        const [{ data: sohRows, error: sohErr }, { data: batchRows, error: batchErr }] = await Promise.all([
          auth.db
            .from("v_stock_on_hand")
            .select("batch_id, product_variant_id, quantity_on_hand")
            .eq("business_id", businessId)
            .in("product_variant_id", targetVariantIds),
          auth.db
            .from("batches")
            .select("id, product_variant_id, cost_per_unit, expiry_date, created_at")
            .eq("business_id", businessId)
            .in("product_variant_id", targetVariantIds)
            .order("expiry_date", { ascending: true, nullsFirst: false })
            .order("created_at", { ascending: true }),
        ]);

        if (sohErr || batchErr) {
          return NextResponse.json(
            { success: false, error: sohErr?.message || batchErr?.message || "Could not read inventory." },
            { status: 400 }
          );
        }

        const sohByBatch = new Map<string, number>();
        const totalAvailByVariant = new Map<string, number>();
        for (const s of (sohRows || []) as any[]) {
          const qty = Number(s.quantity_on_hand) || 0;
          if (s.batch_id) sohByBatch.set(s.batch_id, qty);
          totalAvailByVariant.set(s.product_variant_id, (totalAvailByVariant.get(s.product_variant_id) || 0) + qty);
        }

        // Availability check
        const totalNeededByVariant = new Map<string, number>();
        for (const req of deductions) {
          totalNeededByVariant.set(req.targetVariantId, (totalNeededByVariant.get(req.targetVariantId) || 0) + req.quantity);
        }
        for (const [vid, needed] of totalNeededByVariant.entries()) {
          const avail = totalAvailByVariant.get(vid) || 0;
          if (avail + 1e-6 < needed) {
            return NextResponse.json(
              { success: false, error: `Insufficient stock for variant "${vid}". Available: ${avail}, Required: ${needed}.` },
              { status: 400 }
            );
          }
        }

        // Build batch pool
        const batchesByVariant = new Map<string, Array<{ batch_id: string; product_variant_id: string; cost_per_unit: number; expiry_date: string | null; created_at: string; remaining: number }>>();
        for (const b of (batchRows || []) as any[]) {
          const avail = sohByBatch.get(b.id) || 0;
          if (avail <= 0) continue;
          const arr = batchesByVariant.get(b.product_variant_id) || [];
          arr.push({
            batch_id: b.id,
            product_variant_id: b.product_variant_id,
            cost_per_unit: Number(b.cost_per_unit) || 0,
            expiry_date: b.expiry_date,
            created_at: b.created_at,
            remaining: avail,
          });
          batchesByVariant.set(b.product_variant_id, arr);
        }

        // FEFO allocation
        const movementRows: Array<Record<string, unknown>> = [];
        let seqIdx = 0;
        for (const req of deductions) {
          let rem = req.quantity;
          const pool = batchesByVariant.get(req.targetVariantId) || [];
          for (const batch of pool) {
            if (rem <= 0) break;
            const take = Number(Math.min(batch.remaining, rem).toFixed(3));
            if (take <= 0) continue;
            batch.remaining = Number((batch.remaining - take).toFixed(3));
            rem = Number((rem - take).toFixed(3));
            seqIdx += 1;
            movementRows.push({
              business_id: businessId,
              product_variant_id: req.targetVariantId,
              batch_id: batch.batch_id,
              movement_type: "sale_out",
              quantity: take,
              reason: req.isComboComponent
                ? "Order delivery — combo component"
                : "Order delivery stock deduction",
              reference_type: "order_delivery",
              reference_id: orderId,
              reference_line_id: req.invoiceItemId, // order_item id
            });
          }
          if (rem > 1e-6) {
            return NextResponse.json(
              { success: false, error: `Could not fully allocate stock batches for variant "${req.targetVariantId}".` },
              { status: 400 }
            );
          }
        }

        // Insert stock movements
        if (movementRows.length > 0) {
          const { error: movErr } = await auth.db.from("stock_movements").insert(movementRows);
          if (movErr) {
            return NextResponse.json({ success: false, error: movErr.message }, { status: 400 });
          }
        }

        // Mark delivery_stock_deducted = true + set status
        const { error: updOrdErr } = await auth.db
          .from("orders")
          .update({ status: "delivered", delivery_stock_deducted: true, updated_at: new Date().toISOString() })
          .eq("id", orderId)
          .eq("business_id", businessId);

        if (updOrdErr) {
          // Rollback movements
          await auth.db.from("stock_movements").delete()
            .eq("reference_id", orderId)
            .eq("reference_type", "order_delivery")
            .eq("business_id", businessId);
          return NextResponse.json({ success: false, error: updOrdErr.message }, { status: 400 });
        }

        // Auto-create draft invoice for the delivered order (if none exists)
        const { data: existingInv } = await auth.db
          .from("invoices")
          .select("id")
          .eq("order_id", orderId)
          .eq("business_id", businessId)
          .neq("status", "cancelled")
          .maybeSingle();

        let linkedInvoice: { id: string; invoice_number: string; status: string } | null = null;

        if (!existingInv) {
          // Fetch business settings to determine mode
          const { data: bizSettings } = await auth.db
            .from("business_settings")
            .select("gst_enabled, gst_confirmed, gstin, state")
            .eq("business_id", businessId)
            .maybeSingle();

          const isGstReady = Boolean(
            bizSettings?.gst_enabled &&
            bizSettings?.gst_confirmed &&
            bizSettings?.gstin &&
            String(bizSettings.gstin).trim().length === 15
          );
          const invoiceMode = isGstReady ? "gst" : "non_gst";

          // Calculate totals from order items
          const lineSubtotals = orderItems.map((it) => {
            const lineBase = Number(it.quantity) * Number(it.unit_price);
            const afterDiscount = lineBase * (1 - (Number(it.discount_percent) || 0) / 100);
            return {
              line_subtotal: Number(afterDiscount.toFixed(2)),
              line_total: Number(afterDiscount.toFixed(2)),
            };
          });
          const subtotal = lineSubtotals.reduce((s, l) => s + l.line_subtotal, 0);
          const grandTotal = subtotal;
          const today = new Date().toISOString().split("T")[0];

          // Get customer's state for place of supply
          const { data: custData } = await auth.db
            .from("customers")
            .select("state")
            .eq("id", order.customer_id)
            .maybeSingle();

          const { data: invRow, error: invErr } = await auth.db
            .from("invoices")
            .insert({
              business_id: businessId,
              customer_id: order.customer_id,
              order_id: orderId,
              mode: invoiceMode,
              place_of_supply: custData?.state || bizSettings?.state || null,
              invoice_date: today,
              due_date: null,
              subtotal: Number(subtotal.toFixed(2)),
              discount_total: 0,
              tax_total: 0,
              round_off: 0,
              grand_total: Number(grandTotal.toFixed(2)),
              status: "draft",
              notes: null,
            })
            .select("id, invoice_number, status")
            .single();

          if (!invErr && invRow) {
            // Insert invoice items
            const invoiceItemRows = orderItems.map((it, idx) => ({
              business_id: businessId,
              invoice_id: invRow.id,
              product_variant_id: it.product_variant_id,
              description: null, // will be shown as variant lookup
              quantity: Number(it.quantity),
              unit_price: Number(it.unit_price),
              discount_percent: Number(it.discount_percent) || 0,
              tax_rate: 0,
              cgst_rate: 0,
              sgst_rate: 0,
              igst_rate: 0,
              line_subtotal: lineSubtotals[idx].line_subtotal,
              line_tax: 0,
              line_total: lineSubtotals[idx].line_total,
            }));
            await auth.db.from("invoice_items").insert(invoiceItemRows);
            linkedInvoice = invRow;
          }
        } else {
          linkedInvoice = { id: existingInv.id, invoice_number: "", status: "draft" };
        }

        return NextResponse.json({
          success: true,
          status: "delivered",
          order_id: orderId,
          stock_deducted: true,
          movements_created: movementRows.length,
          linked_invoice: linkedInvoice,
        });
      }

      // No order items — just update status
      await auth.db.from("orders").update({ status: "delivered", updated_at: new Date().toISOString() }).eq("id", orderId).eq("business_id", businessId);
      return NextResponse.json({ success: true, status: "delivered", order_id: orderId, stock_deducted: false });
    }

    // ── CANCELLED: revert delivery stock movements + cancel linked draft invoice ─
    if (newStatus === "cancelled") {
      // Reverse any delivery stock movements
      if (order.delivery_stock_deducted) {
        await auth.db
          .from("stock_movements")
          .delete()
          .eq("reference_id", orderId)
          .eq("reference_type", "order_delivery")
          .eq("business_id", businessId);
      }

      // Cancel linked draft invoices (don't touch finalized ones)
      await auth.db
        .from("invoices")
        .update({ status: "cancelled", updated_at: new Date().toISOString() })
        .eq("order_id", orderId)
        .eq("business_id", businessId)
        .eq("status", "draft");

      const { error: updErr } = await auth.db
        .from("orders")
        .update({ status: "cancelled", delivery_stock_deducted: false, updated_at: new Date().toISOString() })
        .eq("id", orderId)
        .eq("business_id", businessId);

      if (updErr) {
        return NextResponse.json({ success: false, error: updErr.message }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        status: "cancelled",
        order_id: orderId,
        stock_reverted: order.delivery_stock_deducted,
      });
    }

    // ── ALL OTHER STATUS CHANGES: simple update ──────────────────────────
    const { error: updErr } = await auth.db
      .from("orders")
      .update({ status: newStatus as any, updated_at: new Date().toISOString() })
      .eq("id", orderId)
      .eq("business_id", businessId);

    if (updErr) {
      return NextResponse.json({ success: false, error: updErr.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, status: newStatus, order_id: orderId });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to update order" },
      { status: 500 }
    );
  }
}
