import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedRouteDb } from "@/lib/supabase/route-db";
import { deleteInvoiceAndRecoverStock } from "@/lib/supabase/document-cleanup";

export async function DELETE(
  _request: NextRequest,
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
    const res = await deleteInvoiceAndRecoverStock(
      auth.db,
      auth.session.businessId,
      invoiceId
    );

    if (!res.ok) {
      return NextResponse.json(
        { success: false, error: res.error || "Failed to delete invoice" },
        { status: res.status }
      );
    }

    return NextResponse.json({
      success: true,
      stockMovementsRemoved: res.stockMovementsRemoved || 0,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to delete invoice" },
      { status: 500 }
    );
  }
}

