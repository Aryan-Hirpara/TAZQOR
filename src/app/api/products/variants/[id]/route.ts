import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedRouteDb } from "@/lib/supabase/route-db";
import {
  purgeVariantsBottomUp,
  variantsHaveOrderOrInvoiceRefs,
} from "@/lib/supabase/product-cleanup";

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthenticatedRouteDb();
    if (!auth.ok) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const { id } = await context.params;
    const businessId = auth.session.businessId;

    const firstAttempt = await auth.db
      .from("product_variants")
      .delete()
      .eq("id", id)
      .eq("business_id", businessId)
      .select("id");

    if (!firstAttempt.error) {
      if (!firstAttempt.data || firstAttempt.data.length === 0) {
        return NextResponse.json(
          {
            success: false,
            error: auth.isAdmin
              ? "Pack size variant was not found."
              : "Pack size deletion blocked by database RLS policy. Configure SUPABASE_SERVICE_ROLE_KEY or apply migration 20240008_variant_delete_policy.sql in Supabase SQL Editor.",
          },
          { status: auth.isAdmin ? 404 : 403 }
        );
      }
      return NextResponse.json({ success: true });
    }

    const isForeignKeyError =
      firstAttempt.error.code === "23503" ||
      firstAttempt.error.message?.toLowerCase().includes("foreign key");

    if (!isForeignKeyError) {
      return NextResponse.json({ success: false, error: firstAttempt.error.message }, { status: 400 });
    }

    const hasRefs = await variantsHaveOrderOrInvoiceRefs(auth.db, businessId, [id]);
    if (hasRefs) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Cannot delete pack size because it is used in existing orders or invoices. Archive the product instead.",
        },
        { status: 409 }
      );
    }

    if (!auth.isAdmin) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Pack size has stock batch records and requires SUPABASE_SERVICE_ROLE_KEY to clean up automatically.",
        },
        { status: 409 }
      );
    }

    const purgeRes = await purgeVariantsBottomUp(auth.db, businessId, [id]);
    if (purgeRes.error) {
      return NextResponse.json({ success: false, error: purgeRes.error }, { status: 409 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to remove pack size" },
      { status: 500 }
    );
  }
}
