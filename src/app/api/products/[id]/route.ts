import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedRouteDb } from "@/lib/supabase/route-db";
import {
  purgeVariantsBottomUp,
  variantsHaveOrderOrInvoiceRefs,
} from "@/lib/supabase/product-cleanup";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthenticatedRouteDb();
    if (!auth.ok) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const { id } = await context.params;
    const body = await request.json();
    const { name, sku, hsn, description, category_id } = body || {};

    if (!name?.trim() || !sku?.trim()) {
      return NextResponse.json(
        { success: false, error: "Product name and base SKU are required." },
        { status: 400 }
      );
    }

    const { data, error } = await auth.db
      .from("products")
      .update({
        name: name.trim(),
        sku: sku.trim(),
        hsn: hsn?.trim() || null,
        description: description?.trim() || null,
        category_id: category_id || null,
      })
      .eq("id", id)
      .eq("business_id", auth.session.businessId)
      .select("id");

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
    if (!data || data.length === 0) {
      return NextResponse.json(
        { success: false, error: "Product not found or could not be updated." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to update product" },
      { status: 500 }
    );
  }
}

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

    if (auth.isAdmin) {
      const { data: variants } = await auth.db
        .from("product_variants")
        .select("id")
        .eq("business_id", businessId)
        .eq("product_id", id);

      const variantIds = (variants || []).map((v: any) => v.id).filter(Boolean);
      const hasRefs = await variantsHaveOrderOrInvoiceRefs(
        auth.db,
        businessId,
        variantIds
      );

      if (!hasRefs) {
        const purgeRes = await purgeVariantsBottomUp(auth.db, businessId, variantIds);
        if (purgeRes.error) {
          return NextResponse.json(
            { success: false, error: purgeRes.error },
            { status: 400 }
          );
        }

        const { data: deletedProd, error: delProdErr } = await auth.db
          .from("products")
          .delete()
          .eq("id", id)
          .eq("business_id", businessId)
          .select("id");

        if (delProdErr) {
          return NextResponse.json(
            { success: false, error: delProdErr.message },
            { status: 400 }
          );
        }
        if (!deletedProd || deletedProd.length === 0) {
          return NextResponse.json(
            { success: false, error: "Product not found." },
            { status: 404 }
          );
        }

        return NextResponse.json({ success: true, mode: "deleted" });
      }
    }

    const { data, error } = await auth.db
      .from("products")
      .update({ status: "archived" })
      .eq("id", id)
      .eq("business_id", businessId)
      .select("id");

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
    if (!data || data.length === 0) {
      return NextResponse.json(
        { success: false, error: "Product not found or could not be archived." },
        { status: 404 }
      );
    }

    // Release unique SKU constraint on archived variants so base SKUs can be reused cleanly
    const { data: archivedVars } = await auth.db
      .from("product_variants")
      .select("id, sku")
      .eq("business_id", businessId)
      .eq("product_id", id);

    const stamp = Date.now().toString().slice(-6);
    for (const v of archivedVars || []) {
      if (v.sku && !v.sku.includes("~ARC-")) {
        await auth.db
          .from("product_variants")
          .update({ sku: `${v.sku}~ARC-${stamp}` })
          .eq("id", v.id);
      }
    }

    return NextResponse.json({ success: true, mode: "archived" });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to archive product" },
      { status: 500 }
    );
  }
}

