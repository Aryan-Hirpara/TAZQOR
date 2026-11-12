import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedRouteDb } from "@/lib/supabase/route-db";

interface OrderLineInput {
  product_variant_id: string;
  quantity: number;
  unit_price: number;
}

export async function POST(request: NextRequest) {
  let createdOrderId: string | null = null;
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

    const customerId =
      typeof body?.customer_id === "string" ? body.customer_id.trim() : "";
    const status = body?.status === "draft" ? "draft" : "confirmed";
    const notes =
      typeof body?.notes === "string" && body.notes.trim()
        ? body.notes.trim()
        : null;
    const rawItems: OrderLineInput[] = Array.isArray(body?.items)
      ? body.items
      : [];

    if (!customerId) {
      return NextResponse.json(
        { success: false, error: "Customer is required." },
        { status: 400 }
      );
    }

    if (
      rawItems.length === 0 ||
      rawItems.some(
        (item) =>
          !item?.product_variant_id ||
          !(Number(item.quantity) > 0) ||
          Number(item.unit_price) < 0
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Order requires at least one item with positive quantity.",
        },
        { status: 400 }
      );
    }

    const { data: orderNumberData, error: seqErr } = await auth.db.rpc(
      "next_order_number",
      { p_business_id: businessId }
    );

    if (seqErr || !orderNumberData) {
      return NextResponse.json(
        {
          success: false,
          error:
            seqErr?.message || "Could not allocate sequential order number.",
        },
        { status: 500 }
      );
    }

    const orderNumber = String(orderNumberData);

    const { data: insertedOrder, error: orderErr } = await auth.db
      .from("orders")
      .insert({
        business_id: businessId,
        customer_id: customerId,
        order_number: orderNumber,
        status,
        notes,
      })
      .select("*")
      .single();

    if (orderErr || !insertedOrder) {
      return NextResponse.json(
        {
          success: false,
          error: orderErr?.message || "Failed to create order.",
        },
        { status: 400 }
      );
    }

    createdOrderId = insertedOrder.id;

    const itemRows = rawItems.map((item) => ({
      business_id: businessId,
      order_id: insertedOrder.id,
      product_variant_id: String(item.product_variant_id),
      quantity: Number(item.quantity),
      unit_price: Number(item.unit_price) || 0,
    }));

    const { error: itemsErr } = await auth.db
      .from("order_items")
      .insert(itemRows);

    if (itemsErr) {
      await auth.db.from("orders").delete().eq("id", insertedOrder.id);
      createdOrderId = null;
      return NextResponse.json(
        {
          success: false,
          error: itemsErr.message || "Failed to save order line items.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        order: insertedOrder,
      },
      { status: 201 }
    );
  } catch (err: any) {
    if (createdOrderId && dbClient?.ok) {
      await dbClient.db.from("orders").delete().eq("id", createdOrderId);
    }
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to create order" },
      { status: 500 }
    );
  }
}

