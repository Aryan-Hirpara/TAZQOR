import { createClient } from "@/lib/supabase/client";
import {
  ComboRecipeItem,
  computeComboAvailableStock,
  encodeComboRecipe,
  parseComboRecipe,
} from "@/lib/products/combo-pack";

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
  is_combo?: boolean;
  combo_items?: ComboRecipeItem[];
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
  is_combo?: boolean;
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
      const rawStockByVariantId = new Map<string, number>();
      for (const s of (stockData || [])) {
        stockMap.set(s.product_variant_id, s);
        rawStockByVariantId.set(
          s.product_variant_id,
          Number(s.total_quantity_on_hand) || 0
        );
      }

      let list: Product[] = dbProducts.map((p: any) => {
        const productLevelRecipe = parseComboRecipe(p.image_url);
        const variants: ProductVariant[] = (p.product_variants || []).map((v: any) => {
          const isCombo = Boolean(productLevelRecipe && productLevelRecipe.length > 0);
          const stock = stockMap.get(v.id);
          const currentStock = isCombo
            ? computeComboAvailableStock(productLevelRecipe!, (id) => rawStockByVariantId.get(id) ?? 0)
            : stock
            ? Number(stock.total_quantity_on_hand)
            : 0;

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
            current_stock: currentStock,
            stock_status: isCombo
              ? currentStock <= 0
                ? "out_of_stock"
                : "in_stock"
              : stock?.stock_status || "out_of_stock",
            is_combo: isCombo,
            combo_items: isCombo ? productLevelRecipe! : undefined,
          };
        });

        return {
          id: p.id,
          business_id: p.business_id,
          name: p.name,
          category_id: p.category_id || "",
          category_name: (p.categories as any)?.name || "Uncategorised",
          description: p.description || "",
          sku: p.sku || "",
          hsn: p.hsn || "",
          status: p.status === "inactive" ? "inactive" : "active",
          is_combo: Boolean(productLevelRecipe && productLevelRecipe.length > 0) || variants.some((v) => v.is_combo),
          variants,
        };
      });

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

async function resolveTaxRateId(
  supabase: ReturnType<typeof createClient>,
  rate: number
): Promise<string | null> {
  const { data: taxRates } = await supabase
    .from("tax_rates")
    .select("id, rate")
    .eq("business_id", "00000000-0000-0000-0000-000000000001");
  for (const tr of taxRates || []) {
    if (Number(tr.rate) === Number(rate)) {
      return tr.id;
    }
  }
  return null;
}

export async function setVariantStock(
  variantId: string,
  targetStock: number,
  options?: { cost_price?: number; sku?: string }
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`/api/products/variants/${variantId}/stock`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        target_stock: targetStock,
        cost_price: options?.cost_price,
        sku: options?.sku,
      }),
    });
    const payload = await res.json().catch(() => null);
    if (!res.ok || !payload?.success) {
      return {
        success: false,
        error: payload?.error || `Failed to update stock (${res.status})`,
      };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to update stock balance" };
  }
}

export async function createProduct(data: {
  name: string;
  sku?: string;
  hsn?: string;
  description?: string;
  category_id?: string;
  combo_items?: ComboRecipeItem[];
  variants?: Array<{
    pack_size: string;
    name: string;
    sku: string;
    cost_price: number;
    selling_price: number;
    tax_rate?: number;
    reorder_level?: number;
    opening_stock?: number;
  }>;
}) {
  const res = await fetch("/api/products", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const payload = await res.json().catch(() => null);
  if (!res.ok || !payload?.success) {
    throw new Error(payload?.error || `Failed to create product (${res.status})`);
  }
  return payload.product;
}

export async function updateProduct(
  id: string,
  data: {
    name: string;
    sku: string;
    hsn?: string;
    description?: string;
    category_id?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`/api/products/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const payload = await res.json().catch(() => null);
    if (!res.ok || !payload?.success) {
      return { success: false, error: payload?.error || `Failed to update product (${res.status})` };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to update product" };
  }
}

export async function updateProductVariant(
  variantId: string,
  data: {
    pack_size: string;
    name: string;
    sku: string;
    cost_price: number;
    selling_price: number;
    tax_rate: number;
    reorder_level?: number;
    stock_quantity?: number;
    current_stock?: number;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient();
    const taxRateId = await resolveTaxRateId(supabase, data.tax_rate);
    const { data: updated, error } = await supabase
      .from("product_variants")
      .update({
        pack_size: data.pack_size.trim(),
        name: (data.name || data.pack_size).trim(),
        cost_price: data.cost_price,
        selling_price: data.selling_price,
        tax_rate_id: taxRateId,
        reorder_level: data.reorder_level ?? 0,
      })
      .eq("id", variantId)
      .select("id");

    if (error) {
      if (error.code === "23505" || error.message?.toLowerCase().includes("unique")) {
        return { success: false, error: `SKU "${data.sku.trim()}" already exists on another variant.` };
      }
      return { success: false, error: error.message };
    }
    if (!updated || updated.length === 0) {
      return { success: false, error: "Pack size variant not found or could not be updated." };
    }

    if (
      typeof data.stock_quantity === "number" &&
      Number.isFinite(data.stock_quantity) &&
      data.stock_quantity >= 0 &&
      data.stock_quantity !== data.current_stock
    ) {
      const stockRes = await setVariantStock(variantId, data.stock_quantity, {
        cost_price: data.cost_price,
        sku: data.sku,
      });
      if (!stockRes.success) {
        return {
          success: false,
          error: stockRes.error || "Pack details saved, but stock update failed.",
        };
      }
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to update pack size" };
  }
}

export async function addProductVariant(
  productId: string,
  data: {
    pack_size: string;
    name: string;
    sku: string;
    cost_price: number;
    selling_price: number;
    tax_rate: number;
    reorder_level?: number;
    opening_stock?: number;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient();
    const taxRateId = await resolveTaxRateId(supabase, data.tax_rate);
    const { data: created, error } = await supabase
      .from("product_variants")
      .insert({
        product_id: productId,
        business_id: "00000000-0000-0000-0000-000000000001",
        pack_size: data.pack_size.trim(),
        name: (data.name || data.pack_size).trim(),
        sku: data.sku.trim().toUpperCase(),
        cost_price: data.cost_price,
        selling_price: data.selling_price,
        tax_rate_id: taxRateId,
        reorder_level: data.reorder_level ?? 0,
      })
      .select("id")
      .single();

    if (error) {
      if (error.code === "23505" || error.message?.toLowerCase().includes("unique")) {
        return { success: false, error: `SKU "${data.sku.trim()}" already exists on another variant.` };
      }
      return { success: false, error: error.message };
    }

    if (created && (data.opening_stock ?? 0) > 0) {
      const stockRes = await setVariantStock(created.id, data.opening_stock!, {
        cost_price: data.cost_price,
        sku: data.sku,
      });
      if (!stockRes.success) {
        return {
          success: false,
          error: stockRes.error || "Pack size created, but opening stock could not be recorded.",
        };
      }
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to add pack size" };
  }
}

export async function deleteProduct(id: string): Promise<{ success: boolean; mode?: "deleted" | "archived"; error?: string }> {
  try {
    const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
    const payload = await res.json().catch(() => null);
    if (!res.ok || !payload?.success) {
      return {
        success: false,
        error: payload?.error || `Failed to delete product (${res.status})`,
      };
    }
    return { success: true, mode: payload?.mode };
  } catch (err: any) {
    console.error("deleteProduct exception:", err);
    return { success: false, error: err?.message || "Unknown error" };
  }
}

export async function deleteProductVariant(variantId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`/api/products/variants/${variantId}`, { method: "DELETE" });
    const payload = await res.json().catch(() => null);
    if (!res.ok || !payload?.success) {
      return {
        success: false,
        error: payload?.error || `Failed to remove pack size (${res.status})`,
      };
    }
    return { success: true };
  } catch (err: any) {
    console.error("deleteProductVariant exception:", err);
    return { success: false, error: err?.message || "Unknown error" };
  }
}
