import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedRouteDb } from "@/lib/supabase/route-db";

export async function POST(
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

    const { id: invoiceId } = await context.params;
    const body = await request.json().catch(() => ({}));
    const reason =
      typeof body?.reason === "string" && body.reason.trim()
        ? body.reason.trim()
        : "Cancelled by user";

    const businessId = auth.session.businessId;

    const { data: invoice, error: invErr } = await auth.db
      .from("invoices")
      .select("id, status, invoice_number")
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

    const { data: items, error: itemsErr } = await auth.db
      .from("invoice_items")
      .select(
        "id, product_variant_id, invoice_item_batches(id, batch_id, quantity_allocated, batches(product_variant_id))"
      )
      .eq("invoice_id", invoiceId);

    if (itemsErr) {
      return NextResponse.json(
        { success: false, error: itemsErr.message },
        { status: 400 }
      );
    }

    const flatAllocs: Array<{
      allocId: string;
      itemId: string;
      itemVariantId: string;
      batchId: string;
      batchVariantId: string;
      qty: number;
    }> = [];

    for (const item of (items || []) as any[]) {
      for (const alloc of item.invoice_item_batches || []) {
        flatAllocs.push({
          allocId: alloc.id,
          itemId: item.id,
          itemVariantId: item.product_variant_id,
          batchId: alloc.batch_id,
          batchVariantId: alloc.batches?.product_variant_id || item.product_variant_id,
          qty: Number(alloc.quantity_allocated) || 0,
        });
      }
    }

    const hasComboOrMultiBatchAllocs =
      flatAllocs.some((a) => a.batchVariantId !== a.itemVariantId) ||
      new Set(flatAllocs.map((a) => a.itemId)).size !== flatAllocs.length;

    if (!hasComboOrMultiBatchAllocs) {
      const { data: rpcRes, error: rpcErr } = await auth.db.rpc("cancel_invoice", {
        p_invoice_id: invoiceId,
        p_reason: reason,
      });
      if (rpcErr) {
        return NextResponse.json(
          { success: false, error: rpcErr.message },
          { status: 400 }
        );
      }
      return NextResponse.json({
        success: true,
        ...(typeof rpcRes === "object" && rpcRes ? rpcRes : {}),
      });
    }

    if (invoice.status !== "finalized") {
      return NextResponse.json(
        {
          success: false,
          error: `Only finalized invoices can be cancelled (current status: ${invoice.status}).`,
        },
        { status: 400 }
      );
    }

    const { count: allocPaymentCount } = await auth.db
      .from("payment_allocations")
      .select("id", { count: "exact", head: true })
      .eq("invoice_id", invoiceId);

    if ((allocPaymentCount ?? 0) > 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Cannot cancel invoice with active payment allocations. Reallocate or refund payments first.",
        },
        { status: 400 }
      );
    }

    const reverseMovements = flatAllocs
      .filter((a) => a.qty > 0)
      .map((a, idx) => ({
        business_id: businessId,
        product_variant_id: a.batchVariantId,
        batch_id: a.batchId,
        movement_type: "sales_return_in" as const,
        quantity: a.qty,
        reason: `Invoice cancellation: ${reason}`,
        reference_type: `invoice_cancel:${a.allocId}:${idx + 1}`,
        reference_id: invoiceId,
        reference_line_id: a.itemId,
      }));

    if (reverseMovements.length > 0) {
      const { error: movErr } = await auth.db
        .from("stock_movements")
        .insert(reverseMovements);
      if (movErr) {
        return NextResponse.json(
          { success: false, error: movErr.message },
          { status: 400 }
        );
      }
    }

    const { error: updErr } = await auth.db
      .from("invoices")
      .update({
        status: "cancelled",
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", invoiceId)
      .eq("business_id", businessId)
      .eq("status", "finalized");

    if (updErr) {
      return NextResponse.json(
        { success: false, error: updErr.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      status: "cancelled",
      invoice_id: invoiceId,
      invoice_number: invoice.invoice_number,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to cancel invoice" },
      { status: 500 }
    );
  }
}

