import { createClient } from "@/lib/supabase/client";

export interface ProductVariant {
  id: string;
  product_id: string;
  name: string;
  sku: string;
  pack_size: string;
  cost_price: number;
  selling_price: number;
  tax_rate: number;
  reorder_level: number;
  current_stock: number;
  stock_status?: string;
}

export interface Product {
  id: string;
  business_id: string;
  name: string;
  category_id: string;
  category_name: string;
  description: string;
  sku: string;
  hsn: string;
  status: 'active' | 'inactive';
  variants: ProductVariant[];
}

export async function getProducts(query?: { search?: string; categoryId?: string }): Promise<Product[]> {
  try {
    const supabase = createClient();

    const [{ data: dbProducts, error }, { data: stockData }] = await Promise.all([
      supabase
        .from("products")
        .select("*, categories(name), product_variants(*, tax_rates(rate))")
        .neq("status", "archived")
        .order("created_at", { ascending: false }),
      supabase
        .from("v_stock_summary")
        .select("product_variant_id, total_quantity_on_hand, stock_status"),
    ]);

    if (!error && dbProducts && dbProducts.length > 0) {
      const stockMap = new Map<string, any>();
      for (const s of (stockData || [])) {
        stockMap.set(s.product_variant_id, s);
      }

      let list: Product[] = dbProducts.map((p: any) => ({
        id: p.id,
        business_id: p.business_id,
        name: p.name,
        category_id: p.category_id || "",
        category_name: (p.categories as any)?.name || "Uncategorised",
        description: p.description || "",
        sku: p.sku || "",
        hsn: p.hsn || "",
        status: p.status === "inactive" ? "inactive" : "active",
        variants: (p.product_variants || []).map((v: any) => {
          const stock = stockMap.get(v.id);
          return {
            id: v.id,
            product_id: v.product_id,
            name: v.name || v.pack_size || "Standard",
            sku: v.sku || "",
            pack_size: v.pack_size || "",
            cost_price: Number(v.cost_price) || 0,
            selling_price: Number(v.selling_price) || 0,
            tax_rate: v.tax_rates?.rate !== undefined ? Number(v.tax_rates.rate) : 18,
            reorder_level: Number(v.reorder_level) || 0,
            current_stock: stock ? Number(stock.total_quantity_on_hand) : 0,
            stock_status: stock?.stock_status || "out_of_stock",
          };
        }),
      }));

      if (query?.search) {
        const q = query.search.toLowerCase();
        list = list.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            p.sku.toLowerCase().includes(q) ||
            p.category_name.toLowerCase().includes(q) ||
            p.variants.some((v) => v.name.toLowerCase().includes(q) || v.sku.toLowerCase().includes(q))
        );
      }

      if (query?.categoryId && query.categoryId !== "all") {
        list = list.filter((p) => p.category_id === query.categoryId);
      }

      return list;
    }
  } catch (err) {
    console.warn("Supabase products fetch fallback:", err);
  }

  return [];
}

export async function createProduct(data: {
  name: string;
  sku?: string;
  hsn?: string;
  description?: string;
  category_id?: string;
  variants?: Array<{
    pack_size: string;
    name: string;
    sku: string;
    cost_price: number;
    selling_price: number;
    tax_rate?: number;
    reorder_level?: number;
  }>;
}) {
  const supabase = createClient();
  const { data: prod, error } = await supabase
    .from("products")
    .insert({
      business_id: "00000000-0000-0000-0000-000000000001",
      name: data.name,
      sku: data.sku || `TC-${Date.now().toString().slice(-4)}`,
      hsn: data.hsn || null,
      description: data.description || null,
      category_id: data.category_id || null,
      status: "active",
    })
    .select()
    .single();

  if (error) {
    console.error("Supabase createProduct error:", error);
    throw error;
  }

  if (data.variants && data.variants.length > 0) {
    const { data: taxRates } = await supabase
      .from("tax_rates")
      .select("id, rate")
      .eq("business_id", "00000000-0000-0000-0000-000000000001");
    const rateMap = new Map<number, string>();
    for (const tr of taxRates || []) {
      rateMap.set(Number(tr.rate), tr.id);
    }

    const variantRows = data.variants.map((v) => ({
      product_id: prod.id,
      business_id: "00000000-0000-0000-0000-000000000001",
      name: v.name || v.pack_size,
      sku: `${prod.sku}${v.sku}`,
      pack_size: v.pack_size,
      selling_price: v.selling_price,
      cost_price: v.cost_price,
      tax_rate_id: rateMap.get(Number(v.tax_rate ?? 18)) ?? null,
      reorder_level: v.reorder_level ?? 0,
    }));
    const { error: varErr } = await supabase.from("product_variants").insert(variantRows);
    if (varErr) {
      console.error("Supabase product_variants insert error:", varErr);
      throw varErr;
    }
  }

  return prod;
}

export async function deleteProduct(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("products")
      .update({ status: "archived" as any })
      .eq("id", id)
      .select("id");

    if (error) {
      console.error("Supabase deleteProduct error:", error);
      return { success: false, error: error.message };
    }
    if (!data || data.length === 0) {
      return { success: false, error: "Product not found or could not be archived." };
    }
    return { success: true };
  } catch (err: any) {
    console.error("deleteProduct exception:", err);
    return { success: false, error: err?.message || "Unknown error" };
  }
}

export async function deleteProductVariant(variantId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("product_variants")
      .delete()
      .eq("id", variantId)
      .select("id");

    if (error) {
      // FK constraint violation codes: 23503 in PostgreSQL
      if (error.code === "23503" || error.message?.toLowerCase().includes("foreign key")) {
        return { success: false, error: "Cannot delete pack size with existing stock batches, orders, or invoices" };
      }
      console.error("Supabase deleteProductVariant error:", error);
      return { success: false, error: error.message };
    }
    if (!data || data.length === 0) {
      return {
        success: false,
        error: "Pack size deletion blocked by database RLS policy. Apply migration 20240008_variant_delete_policy.sql in Supabase SQL Editor.",
      };
    }
    return { success: true };
  } catch (err: any) {
    if (err?.code === "23503" || err?.message?.toLowerCase().includes("foreign key")) {
      return { success: false, error: "Cannot delete variant with existing stock batches or orders" };
    }
    console.error("deleteProductVariant exception:", err);
    return { success: false, error: err?.message || "Unknown error" };
  }
}
