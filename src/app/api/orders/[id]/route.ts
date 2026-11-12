import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedRouteDb } from "@/lib/supabase/route-db";
import { deleteOrderAndRecoverStock } from "@/lib/supabase/document-cleanup";

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

