import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedRouteDb } from "@/lib/supabase/route-db";
import { extractBatchPrefix } from "@/lib/identifiers/codes";

function normalizeIsoDate(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(trimmed) ? trimmed : null;
}

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthenticatedRouteDb();
    if (!auth.ok) {
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: auth.status }
      );
    }

    const url = new URL(request.url);
    const variantId = url.searchParams.get("variant_id")?.trim() || "";
    const mfgDate = normalizeIsoDate(url.searchParams.get("mfg_date"));

    if (!variantId) {
      return NextResponse.json(
        { success: false, error: "variant_id is required" },
        { status: 400 }
      );
    }

    const { data: variant, error: vErr } = await auth.db
      .from("product_variants")
      .select("id, sku, pack_size, products(name)")
      .eq("id", variantId)
      .eq("business_id", auth.session.businessId)
      .maybeSingle();

    if (vErr || !variant) {
      return NextResponse.json(
        { success: false, error: "Product variant not found" },
        { status: 404 }
      );
    }

    const prodRel = Array.isArray((variant as any).products)
      ? (variant as any).products[0]
      : (variant as any).products;
    const prefix = extractBatchPrefix({
      variantSku: variant.sku,
      productName: prodRel?.name,
      packSize: variant.pack_size,
    });

    const { data: previewNum, error: rpcErr } = await auth.db.rpc(
      "preview_next_batch_number",
      {
        p_business_id: auth.session.businessId,
        p_variant_id: variant.id,
        p_prefix: prefix,
        p_batch_date: mfgDate,
      }
    );

    if (rpcErr || !previewNum) {
      return NextResponse.json(
        {
          success: false,
          error: rpcErr?.message || "Failed to preview next batch number",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      batchNumber: String(previewNum),
      prefix,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to preview batch" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  let createdBatchId: string | null = null;
  let dbClient: Awaited<ReturnType<typeof getAuthenticatedRouteDb>> | null = null;

  try {
    const auth = await getAuthenticatedRouteDb();
    dbClient = auth;
    if (!auth.ok) {
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: auth.status }
      );
    }

    const businessId = auth.session.businessId;
    const body = await request.json();

    const variantId =
      typeof body?.variant_id === "string" ? body.variant_id.trim() : "";
    const quantity = Number(body?.quantity);
    const mfgDate =
      normalizeIsoDate(body?.manufacturing_date) ||
      new Date().toISOString().split("T")[0];
    const expiryDate = normalizeIsoDate(body?.expiry_date) || null;
    const supplier =
      typeof body?.supplier === "string" ? body.supplier.trim() : "";
    const autoGenerate = body?.auto_generate !== false;
    const requestedBatchNum =
      typeof body?.batch_number === "string"
        ? body.batch_number.trim().toUpperCase()
        : "";

    if (!variantId || !(quantity > 0)) {
      return NextResponse.json(
        {
          success: false,
          error: "Valid product variant and positive quantity are required.",
        },
        { status: 400 }
      );
    }

    const { data: variant, error: vErr } = await auth.db
      .from("product_variants")
      .select("id, sku, pack_size, cost_price, products(name)")
      .eq("id", variantId)
      .eq("business_id", businessId)
      .maybeSingle();

    if (vErr || !variant) {
      return NextResponse.json(
        { success: false, error: "Product variant not found." },
        { status: 404 }
      );
    }

    const prodRel = Array.isArray((variant as any).products)
      ? (variant as any).products[0]
      : (variant as any).products;
    const prefix = extractBatchPrefix({
      variantSku: variant.sku,
      productName: prodRel?.name,
      packSize: variant.pack_size,
    });

    let batchNumber = requestedBatchNum;
    if (autoGenerate || !batchNumber) {
      const { data: allocatedNum, error: seqErr } = await auth.db.rpc(
        "next_batch_number",
        {
          p_business_id: businessId,
          p_variant_id: variant.id,
          p_prefix: prefix,
          p_batch_date: mfgDate,
        }
      );

      if (seqErr || !allocatedNum) {
        return NextResponse.json(
          {
            success: false,
            error:
              seqErr?.message || "Failed to allocate sequential batch number.",
          },
          { status: 500 }
        );
      }
      batchNumber = String(allocatedNum);
    }

    const costPerUnit =
      body?.cost_per_unit !== undefined && body?.cost_per_unit !== ""
        ? Number(body.cost_per_unit) || 0
        : Number(variant.cost_price) || 0;

    const { data: insertedBatch, error: insErr } = await auth.db
      .from("batches")
      .insert({
        business_id: businessId,
        product_variant_id: variant.id,
        batch_number: batchNumber,
        manufacturing_date: mfgDate,
        expiry_date: expiryDate,
        quantity_received: quantity,
        cost_per_unit: costPerUnit,
      })
      .select("*")
      .single();

    if (insErr || !insertedBatch) {
      if (insErr?.code === "23505" || insErr?.message?.toLowerCase().includes("unique")) {
        return NextResponse.json(
          {
            success: false,
            error: `Batch number "${batchNumber}" already exists.`,
          },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { success: false, error: insErr?.message || "Failed to create batch." },
        { status: 400 }
      );
    }

    createdBatchId = insertedBatch.id;

    const { error: movErr } = await auth.db.rpc("receive_stock", {
      p_business_id: businessId,
      p_product_variant_id: variant.id,
      p_batch_id: insertedBatch.id,
      p_quantity: quantity,
      p_reason: supplier ? `Supplier receipt: ${supplier}` : "Stock receipt",
      p_reference_type: "purchase",
      p_reference_id: null,
    });

    if (movErr) {
      await auth.db.from("batches").delete().eq("id", insertedBatch.id);
      createdBatchId = null;
      return NextResponse.json(
        {
          success: false,
          error: `Batch movement logging failed: ${movErr.message}`,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        batch: insertedBatch,
        batchNumber,
      },
      { status: 201 }
    );
  } catch (err: any) {
    if (createdBatchId && dbClient?.ok) {
      await dbClient.db.from("batches").delete().eq("id", createdBatchId);
    }
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to receive stock" },
      { status: 500 }
    );
  }
}

