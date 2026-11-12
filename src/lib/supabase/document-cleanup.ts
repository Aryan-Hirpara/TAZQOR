import { getAuthenticatedRouteDb } from "@/lib/supabase/route-db";

type DbClient = Extract<
  Awaited<ReturnType<typeof getAuthenticatedRouteDb>>,
  { ok: true }
>["db"];

export interface DeleteResult {
  ok: boolean;
  status: number;
  error?: string;
  deletedInvoices?: number;
  stockMovementsRemoved?: number;
}

const MIGRATION_HINT =
  "Deleting finalized or cancelled invoices is blocked by database protection triggers until migration 20240011_allow_order_invoice_delete.sql is applied in your Supabase SQL Editor.";

function isMissingRpcError(error: { code?: string | null; message?: string | null }): boolean {
  const msg = (error.message || "").toLowerCase();
  return (
    error.code === "PGRST202" ||
    error.code === "42883" ||
    msg.includes("could not find the function") ||
    msg.includes("does not exist")
  );
}

/**
 * Deletes an invoice permanently and removes any stock_movements / payment_allocations
 * tied to it so stock quantities and customer balances recover automatically.
 */
export async function deleteInvoiceAndRecoverStock(
  db: DbClient,
  businessId: string,
  invoiceId: string
): Promise<DeleteResult> {
  // 1. Prefer the atomic Postgres RPC when migration 20240011 is installed
  const rpcRes = await db.rpc("delete_invoice_permanently" as any, {
    p_business_id: businessId,
    p_invoice_id: invoiceId,
  });

  if (!rpcRes.error) {
    const payload = (rpcRes.data || {}) as Record<string, any>;
    return {
      ok: true,
      status: 200,
      stockMovementsRemoved: Number(payload.stock_movements_removed) || 0,
    };
  }

  if (!isMissingRpcError(rpcRes.error)) {
    const notFound = rpcRes.error.message?.toLowerCase().includes("not found");
    return {
      ok: false,
      status: notFound ? 404 : 400,
      error: rpcRes.error.message,
    };
  }

  // 2. Fallback when RPC is not installed yet: check invoice first before touching any stock
  const { data: invoice, error: invErr } = await db
    .from("invoices")
    .select("id, status, invoice_number")
    .eq("id", invoiceId)
    .eq("business_id", businessId)
    .maybeSingle();

  if (invErr) {
    return { ok: false, status: 400, error: invErr.message };
  }
  if (!invoice) {
    return { ok: false, status: 404, error: "Invoice not found." };
  }

  if (invoice.status !== "draft") {
    return { ok: false, status: 409, error: MIGRATION_HINT };
  }

  const { error: itemErr } = await db
    .from("invoice_items")
    .delete()
    .eq("invoice_id", invoiceId)
    .eq("business_id", businessId);

  if (itemErr) {
    return { ok: false, status: 400, error: itemErr.message };
  }

  const { data: delRows, error: delErr } = await db
    .from("invoices")
    .delete()
    .eq("id", invoiceId)
    .eq("business_id", businessId)
    .select("id");

  if (delErr) {
    return { ok: false, status: 400, error: delErr.message };
  }
  if (!delRows || delRows.length === 0) {
    return {
      ok: false,
      status: 403,
      error:
        "Draft invoice deletion blocked by RLS policy. Configure SUPABASE_SERVICE_ROLE_KEY or apply migration 20240011_allow_order_invoice_delete.sql.",
    };
  }

  return { ok: true, status: 200, stockMovementsRemoved: 0 };
}

/**
 * Deletes any customer order (draft, confirmed, processing, dispatched, delivered, cancelled),
 * optionally deleting linked invoices and recovering all associated stock.
 */
export async function deleteOrderAndRecoverStock(
  db: DbClient,
  businessId: string,
  orderId: string,
  deleteLinkedInvoices = true
): Promise<DeleteResult> {
  // 1. Prefer atomic Postgres RPC when migration 20240011 is installed
  const rpcRes = await db.rpc("delete_order_permanently" as any, {
    p_business_id: businessId,
    p_order_id: orderId,
    p_delete_linked_invoices: deleteLinkedInvoices,
  });

  if (!rpcRes.error) {
    const payload = (rpcRes.data || {}) as Record<string, any>;
    const deletedIds = Array.isArray(payload.deleted_invoice_ids)
      ? payload.deleted_invoice_ids
      : [];
    return {
      ok: true,
      status: 200,
      deletedInvoices: deletedIds.length,
      stockMovementsRemoved: Number(payload.stock_movements_removed) || 0,
    };
  }

  if (!isMissingRpcError(rpcRes.error)) {
    const notFound = rpcRes.error.message?.toLowerCase().includes("not found");
    return {
      ok: false,
      status: notFound ? 404 : 400,
      error: rpcRes.error.message,
    };
  }

  // 2. Fallback when RPC is not yet installed: works immediately for any order without finalized/cancelled linked bills
  const { data: order, error: ordErr } = await db
    .from("orders")
    .select("id, order_number, status")
    .eq("id", orderId)
    .eq("business_id", businessId)
    .maybeSingle();

  if (ordErr) {
    return { ok: false, status: 400, error: ordErr.message };
  }
  if (!order) {
    return { ok: false, status: 404, error: "Order not found." };
  }

  const { data: linkedInvoices, error: linkErr } = await db
    .from("invoices")
    .select("id, status")
    .eq("order_id", orderId)
    .eq("business_id", businessId);

  if (linkErr) {
    return { ok: false, status: 400, error: linkErr.message };
  }

  let deletedInvCount = 0;
  if (deleteLinkedInvoices && linkedInvoices && linkedInvoices.length > 0) {
    for (const inv of linkedInvoices) {
      const invDel = await deleteInvoiceAndRecoverStock(db, businessId, inv.id);
      if (!invDel.ok) {
        return invDel;
      }
      deletedInvCount += 1;
    }
  }

  // Clean up any direct stock_movements recorded under this order id
  const { data: removedMovs } = await db
    .from("stock_movements")
    .delete()
    .eq("reference_id", orderId)
    .eq("business_id", businessId)
    .select("id");

  await db
    .from("order_items")
    .delete()
    .eq("order_id", orderId)
    .eq("business_id", businessId);

  const { data: delOrderRows, error: delOrdErr } = await db
    .from("orders")
    .delete()
    .eq("id", orderId)
    .eq("business_id", businessId)
    .select("id");

  if (delOrdErr) {
    return { ok: false, status: 400, error: delOrdErr.message };
  }
  if (!delOrderRows || delOrderRows.length === 0) {
    return {
      ok: false,
      status: 403,
      error:
        "Deleting non-draft orders requires SUPABASE_SERVICE_ROLE_KEY or migration 20240011_allow_order_invoice_delete.sql.",
    };
  }

  return {
    ok: true,
    status: 200,
    deletedInvoices: deletedInvCount,
    stockMovementsRemoved: (removedMovs || []).length,
  };
}

