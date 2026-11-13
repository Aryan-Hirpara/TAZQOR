import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedRouteDb } from "@/lib/supabase/route-db";
import {
  ComboRecipeItem,
  expandComboStockDeductions,
  parseComboRecipe,
} from "@/lib/products/combo-pack";
import {
  getTodayIsoDate,
  ParsedInvoicePayment,
  parseInvoicePaymentInput,
  settleInvoiceWithPayment,
} from "@/lib/invoices/payment-settlement";

interface BatchStockRow {
  batch_id: string;
  product_variant_id: string;
  cost_per_unit: number;
  expiry_date: string | null;
  created_at: string;
  remaining: number;
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const createdBatchAllocIds: string[] = [];
  const createdMovementIds: string[] = [];

  try {
    const auth = await getAuthenticatedRouteDb();
    if (!auth.ok) {
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: auth.status }
      );
    }

    const { id: invoiceId } = await context.params;
    const body = await request.json().catch(() => ({}));
    const idempotencyKey =
      typeof body?.idempotency_key === "string" && body.idempotency_key.trim()
        ? body.idempotency_key.trim()
        : null;

    const businessId = auth.session.businessId;

    const { data: invoice, error: invErr } = await auth.db
      .from("invoices")
      .select("*")
      .eq("id", invoiceId)
      .eq("business_id", businessId)
      .maybeSingle();

    if (invErr) {
      return NextResponse.json(
        { success: false, error: invErr.message },
        { status: 400 }
      );
    }
    if (!invoice) {
      return NextResponse.json(
        { success: false, error: "Invoice not found." },
        { status: 404 }
      );
    }

    if (invoice.status === "finalized") {
      return NextResponse.json({
        success: true,
        status: "already_finalized",
        invoice_id: invoice.id,
        invoice_number: invoice.invoice_number,
      });
    }

    if (invoice.status !== "draft") {
      return NextResponse.json(
        {
          success: false,
          error: `Only draft invoices can be finalized (current status: ${invoice.status}).`,
        },
        { status: 400 }
      );
    }

    // ── STOCK-ALREADY-DEDUCTED PATH ─────────────────────────────────────────
    // If this invoice was auto-created from an order delivery, stock was already
    // deducted via stock_movements with reference_type = "order_delivery".
    // In that case skip all FEFO allocation and finalize directly via RPC.
    if (invoice.order_id) {
      const { data: orderRow } = await auth.db
        .from("orders")
        .select("delivery_stock_deducted")
        .eq("id", invoice.order_id)
        .eq("business_id", businessId)
        .maybeSingle();

      if (orderRow?.delivery_stock_deducted) {
        // Confirm there are actual movements recorded for this order
        const { count: movCount } = await auth.db
          .from("stock_movements")
          .select("id", { count: "exact", head: true })
          .eq("reference_id", invoice.order_id)
          .eq("reference_type", "order_delivery")
          .eq("business_id", businessId);

        if ((movCount || 0) > 0) {
          // Stock already deducted — skip FEFO and go straight to finalize RPC
          const parsedPaymentEarly = parseInvoicePaymentInput(body?.payment, {
            defaultDate:
              typeof invoice.invoice_date === "string" && invoice.invoice_date
                ? invoice.invoice_date
                : getTodayIsoDate(),
            maxAmount: Number(invoice.grand_total) || 0,
            requirePositiveWhenPresent: false,
          });
          if (parsedPaymentEarly.error) {
            return NextResponse.json(
              { success: false, error: parsedPaymentEarly.error },
              { status: 400 }
            );
          }

          const applyOptionalPaymentEarly = async (
            finalizedPayload: Record<string, unknown>,
            payment: ParsedInvoicePayment | null
          ) => {
            if (!payment) {
              return NextResponse.json({ success: true, ...finalizedPayload });
            }
            const settlement = await settleInvoiceWithPayment({
              db: auth.db,
              businessId,
              invoiceId,
              customerId: invoice.customer_id,
              payment,
            });
            if (!settlement.ok) {
              return NextResponse.json(
                {
                  success: false,
                  ...finalizedPayload,
                  payment_recorded: false,
                  error: `Invoice finalized, but recording payment failed: ${settlement.error}`,
                },
                { status: 400 }
              );
            }
            return NextResponse.json({
              success: true,
              ...finalizedPayload,
              payment_recorded: true,
              payment_id: settlement.paymentId,
              paid_amount: settlement.amount,
            });
          };

          // Use the finalize_invoice RPC — it will assign invoice number + set status
          const { data: rpcRes, error: rpcErr } = await auth.db.rpc("finalize_invoice", {
            p_invoice_id: invoiceId,
            p_idempotency_key: idempotencyKey || undefined,
          });
          if (rpcErr) {
            return NextResponse.json(
              { success: false, error: rpcErr.message },
              { status: 400 }
            );
          }
          return applyOptionalPaymentEarly(
            typeof rpcRes === "object" && rpcRes ? (rpcRes as Record<string, unknown>) : {},
            parsedPaymentEarly.payment
          );
        }
      }
    }
    // ─────────────────────────────────────────────────────────────────────────

    const parsedPayment = parseInvoicePaymentInput(body?.payment, {
      defaultDate:
        typeof invoice.invoice_date === "string" && invoice.invoice_date
          ? invoice.invoice_date
          : getTodayIsoDate(),
      maxAmount: Number(invoice.grand_total) || 0,
      requirePositiveWhenPresent: false,
    });
    if (parsedPayment.error) {
      return NextResponse.json(
        { success: false, error: parsedPayment.error },
        { status: 400 }
      );
    }

    const applyOptionalPayment = async (
      finalizedPayload: Record<string, unknown>,
      payment: ParsedInvoicePayment | null
    ) => {
      if (!payment) {
        return NextResponse.json({ success: true, ...finalizedPayload });
      }
      const settlement = await settleInvoiceWithPayment({
        db: auth.db,
        businessId,
        invoiceId,
        customerId: invoice.customer_id,
        payment,
      });
      if (!settlement.ok) {
        return NextResponse.json(
          {
            success: false,
            ...finalizedPayload,
            payment_recorded: false,
            error: `Invoice was finalized, but recording payment failed: ${settlement.error}`,
          },
          { status: 400 }
        );
      }
      return NextResponse.json({
        success: true,
        ...finalizedPayload,
        payment_recorded: true,
        payment_id: settlement.paymentId,
        paid_amount: settlement.amount,
      });
    };

    const { data: items, error: itemsErr } = await auth.db
      .from("invoice_items")
      .select("id, product_variant_id, quantity, description")
      .eq("invoice_id", invoiceId);

    if (itemsErr) {
      return NextResponse.json(
        { success: false, error: itemsErr.message },
        { status: 400 }
      );
    }

    const lineItems = (items || []).filter((it: any) => Boolean(it.product_variant_id));
    const variantIds = Array.from(
      new Set(lineItems.map((it: any) => it.product_variant_id as string))
    );

    const [{ data: variantsMeta }, comboTableRes] = await Promise.all([
      variantIds.length > 0
        ? auth.db
            .from("product_variants")
            .select("id, product_id, products(id, name, image_url)")
            .in("id", variantIds)
        : Promise.resolve({ data: [] as any[] }),
      variantIds.length > 0
        ? auth.db
            .from("combo_pack_items" as any)
            .select("combo_variant_id, component_variant_id, quantity")
            .eq("business_id", businessId)
            .in("combo_variant_id", variantIds)
        : Promise.resolve({ data: [] as any[], error: null }),
    ]);

    const recipeByVariantId = new Map<string, ComboRecipeItem[]>();
    if (!comboTableRes.error && Array.isArray(comboTableRes.data)) {
      for (const row of comboTableRes.data as any[]) {
        if (!row?.combo_variant_id || !row?.component_variant_id) continue;
        const list = recipeByVariantId.get(row.combo_variant_id) || [];
        list.push({
          variant_id: row.component_variant_id,
          quantity: Number(row.quantity) || 1,
        });
        recipeByVariantId.set(row.combo_variant_id, list);
      }
    }

    for (const vm of (variantsMeta || []) as any[]) {
      if (recipeByVariantId.has(vm.id)) continue;
      const parsed = parseComboRecipe(vm.products?.image_url);
      if (parsed && parsed.length > 0) {
        recipeByVariantId.set(vm.id, parsed);
      }
    }

    // If no combo packs exist on this invoice, delegate directly to the atomic Postgres RPC.
    const hasAnyCombo = lineItems.some((it: any) =>
      recipeByVariantId.has(it.product_variant_id)
    );
    if (!hasAnyCombo) {
      const { data: rpcRes, error: rpcErr } = await auth.db.rpc("finalize_invoice", {
        p_invoice_id: invoiceId,
        p_idempotency_key: idempotencyKey || undefined,
      });
      if (rpcErr) {
        return NextResponse.json(
          { success: false, error: rpcErr.message },
          { status: 400 }
        );
      }
      return applyOptionalPayment(
        typeof rpcRes === "object" && rpcRes ? (rpcRes as Record<string, unknown>) : {},
        parsedPayment.payment
      );
    }

    // Combo pack path: check GST settings if mode === 'gst'
    if (invoice.mode === "gst") {
      const { data: settings } = await auth.db
        .from("business_settings")
        .select("gst_enabled, gst_confirmed, gstin")
        .eq("business_id", businessId)
        .maybeSingle();

      if (
        !settings?.gst_enabled ||
        !settings?.gst_confirmed ||
        !settings?.gstin ||
        settings.gstin.trim().length !== 15
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "GST mode is disabled: Business must confirm GST eligibility and configure a valid 15-character GSTIN.",
          },
          { status: 400 }
        );
      }
    }

    const deductions = expandComboStockDeductions(
      lineItems.map((it: any) => ({
        itemId: it.id,
        variantId: it.product_variant_id,
        quantity: Number(it.quantity) || 0,
      })),
      recipeByVariantId
    );

    const targetVariantIds = Array.from(
      new Set(deductions.map((d) => d.targetVariantId))
    );

    if (targetVariantIds.length > 0) {
      const [{ data: sohRows, error: sohErr }, { data: batchRows, error: batchErr }, { data: targetMeta }] =
        await Promise.all([
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
          auth.db
            .from("product_variants")
            .select("id, pack_size, name, products(name)")
            .in("id", targetVariantIds),
        ]);

      if (sohErr || batchErr) {
        return NextResponse.json(
          {
            success: false,
            error: sohErr?.message || batchErr?.message || "Could not verify inventory batches.",
          },
          { status: 400 }
        );
      }

      const nameMap = new Map<string, string>();
      for (const tm of (targetMeta || []) as any[]) {
        const prodName = tm.products?.name || "Item";
        const sizeLabel = tm.pack_size || tm.name || "";
        nameMap.set(tm.id, sizeLabel ? `${prodName} (${sizeLabel})` : prodName);
      }

      const sohByBatch = new Map<string, number>();
      const totalAvailByVariant = new Map<string, number>();
      for (const s of (sohRows || []) as any[]) {
        const qty = Number(s.quantity_on_hand) || 0;
        if (s.batch_id) {
          sohByBatch.set(s.batch_id, qty);
        }
        totalAvailByVariant.set(
          s.product_variant_id,
          (totalAvailByVariant.get(s.product_variant_id) || 0) + qty
        );
      }

      const totalNeededByVariant = new Map<string, number>();
      for (const req of deductions) {
        totalNeededByVariant.set(
          req.targetVariantId,
          (totalNeededByVariant.get(req.targetVariantId) || 0) + req.quantity
        );
      }

      for (const [vid, needed] of totalNeededByVariant.entries()) {
        const avail = totalAvailByVariant.get(vid) || 0;
        if (avail + 1e-6 < needed) {
          const itemName = nameMap.get(vid) || vid;
          return NextResponse.json(
            {
              success: false,
              error: `Insufficient stock for included item "${itemName}". Available: ${avail}, Required: ${needed}.`,
            },
            { status: 400 }
          );
        }
      }

      const batchesByVariant = new Map<string, BatchStockRow[]>();
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

      const batchAllocRows: Array<{
        invoice_item_id: string;
        batch_id: string;
        quantity_allocated: number;
        cost_per_unit: number;
      }> = [];

      const movementRows: Array<{
        business_id: string;
        product_variant_id: string;
        batch_id: string;
        movement_type: "sale_out";
        quantity: number;
        reason: string;
        reference_type: string;
        reference_id: string;
        reference_line_id: string;
      }> = [];

      let seqIdx = 0;
      for (const req of deductions) {
        let remainingToAllocate = req.quantity;
        const pool = batchesByVariant.get(req.targetVariantId) || [];

        for (const batch of pool) {
          if (remainingToAllocate <= 0) break;
          if (batch.remaining <= 0) continue;

          const take = Number(Math.min(batch.remaining, remainingToAllocate).toFixed(3));
          if (take <= 0) continue;

          batch.remaining = Number((batch.remaining - take).toFixed(3));
          remainingToAllocate = Number((remainingToAllocate - take).toFixed(3));
          seqIdx += 1;

          batchAllocRows.push({
            invoice_item_id: req.invoiceItemId,
            batch_id: batch.batch_id,
            quantity_allocated: take,
            cost_per_unit: batch.cost_per_unit,
          });

          movementRows.push({
            business_id: businessId,
            product_variant_id: req.targetVariantId,
            batch_id: batch.batch_id,
            movement_type: "sale_out",
            quantity: take,
            reason: req.isComboComponent
              ? "Combo pack sale component deduction"
              : "Invoice finalization",
            reference_type: req.isComboComponent
              ? `invoice_combo:${req.targetVariantId}:${seqIdx}`
              : `invoice:${seqIdx}`,
            reference_id: invoiceId,
            reference_line_id: req.invoiceItemId,
          });
        }

        if (remainingToAllocate > 1e-6) {
          const itemName = nameMap.get(req.targetVariantId) || req.targetVariantId;
          return NextResponse.json(
            {
              success: false,
              error: `Failed to allocate FEFO stock batches for "${itemName}" (short by ${remainingToAllocate}).`,
            },
            { status: 400 }
          );
        }
      }

      if (batchAllocRows.length > 0) {
        const { data: insertedAllocs, error: allocInsertErr } = await auth.db
          .from("invoice_item_batches")
          .insert(batchAllocRows)
          .select("id");

        if (allocInsertErr) {
          return NextResponse.json(
            { success: false, error: allocInsertErr.message },
            { status: 400 }
          );
        }
        for (const r of insertedAllocs || []) {
          createdBatchAllocIds.push(r.id);
        }
      }

      if (movementRows.length > 0) {
        const { data: insertedMoves, error: moveInsertErr } = await auth.db
          .from("stock_movements")
          .insert(movementRows)
          .select("id");

        if (moveInsertErr) {
          if (createdBatchAllocIds.length > 0) {
            await auth.db
              .from("invoice_item_batches")
              .delete()
              .in("id", createdBatchAllocIds);
          }
          return NextResponse.json(
            { success: false, error: moveInsertErr.message },
            { status: 400 }
          );
        }
        for (const m of insertedMoves || []) {
          createdMovementIds.push(m.id);
        }
      }
    }

    const [{ data: invNumber, error: numErr }, { data: businessRow }, { data: customerRow }] =
      await Promise.all([
        auth.db.rpc("next_invoice_number", {
          p_business_id: businessId,
          p_mode: invoice.mode,
        }),
        auth.db.from("businesses").select("*").eq("id", businessId).maybeSingle(),
        auth.db.from("customers").select("*").eq("id", invoice.customer_id).maybeSingle(),
      ]);

    if (numErr || !invNumber) {
      if (createdMovementIds.length > 0) {
        await auth.db.from("stock_movements").delete().in("id", createdMovementIds);
      }
      if (createdBatchAllocIds.length > 0) {
        await auth.db.from("invoice_item_batches").delete().in("id", createdBatchAllocIds);
      }
      return NextResponse.json(
        { success: false, error: numErr?.message || "Failed to generate invoice number." },
        { status: 400 }
      );
    }

    const { error: updErr } = await auth.db
      .from("invoices")
      .update({
        status: "finalized",
        invoice_number: invNumber,
        idempotency_key: idempotencyKey || invoice.idempotency_key || crypto.randomUUID(),
        snapshot_business: businessRow || null,
        snapshot_customer: customerRow || null,
        finalized_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", invoiceId)
      .eq("business_id", businessId)
      .eq("status", "draft");

    if (updErr) {
      if (createdMovementIds.length > 0) {
        await auth.db.from("stock_movements").delete().in("id", createdMovementIds);
      }
      if (createdBatchAllocIds.length > 0) {
        await auth.db.from("invoice_item_batches").delete().in("id", createdBatchAllocIds);
      }
      return NextResponse.json(
        { success: false, error: updErr.message },
        { status: 400 }
      );
    }

    return applyOptionalPayment(
      {
        status: "finalized",
        invoice_id: invoiceId,
        invoice_number: invNumber,
      },
      parsedPayment.payment
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to finalize invoice" },
      { status: 500 }
    );
  }
}

