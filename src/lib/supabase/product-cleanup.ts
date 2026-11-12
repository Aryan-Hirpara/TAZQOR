import { getAuthenticatedRouteDb } from "@/lib/supabase/route-db";

type DbClient = Extract<
  Awaited<ReturnType<typeof getAuthenticatedRouteDb>>,
  { ok: true }
>["db"];

/**
 * Checks whether any given variant IDs are referenced by orders, invoices, or batch allocations.
 */
export async function variantsHaveOrderOrInvoiceRefs(
  db: DbClient,
  businessId: string,
  variantIds: string[]
): Promise<boolean> {
  if (variantIds.length === 0) return false;

  const [{ count: orderCount }, { count: invoiceCount }, { data: batchRows }] =
    await Promise.all([
      db
        .from("order_items")
        .select("id", { count: "exact", head: true })
        .eq("business_id", businessId)
        .in("product_variant_id", variantIds),
      db
        .from("invoice_items")
        .select("id", { count: "exact", head: true })
        .eq("business_id", businessId)
        .in("product_variant_id", variantIds),
      db
        .from("batches")
        .select("id")
        .eq("business_id", businessId)
        .in("product_variant_id", variantIds),
    ]);

  if ((orderCount ?? 0) > 0 || (invoiceCount ?? 0) > 0) {
    return true;
  }

  const batchIds = (batchRows || []).map((b: any) => b.id).filter(Boolean);
  if (batchIds.length > 0) {
    const { count: allocCount } = await db
      .from("invoice_item_batches")
      .select("id", { count: "exact", head: true })
      .in("batch_id", batchIds);
    if ((allocCount ?? 0) > 0) {
      return true;
    }
  }

  return false;
}

/**
 * Deletes unreferenced variants cleanly in child-to-parent order:
 * stock_movements -> batches -> product_variants.
 */
export async function purgeVariantsBottomUp(
  db: DbClient,
  businessId: string,
  variantIds: string[]
): Promise<{ error?: string }> {
  if (variantIds.length === 0) return {};

  const { error: movErr } = await db
    .from("stock_movements")
    .delete()
    .eq("business_id", businessId)
    .in("product_variant_id", variantIds);
  if (movErr) return { error: movErr.message };

  const { error: batchErr } = await db
    .from("batches")
    .delete()
    .eq("business_id", businessId)
    .in("product_variant_id", variantIds);
  if (batchErr) return { error: batchErr.message };

  const { error: varErr } = await db
    .from("product_variants")
    .delete()
    .eq("business_id", businessId)
    .in("id", variantIds);
  if (varErr) return { error: varErr.message };

  return {};
}

