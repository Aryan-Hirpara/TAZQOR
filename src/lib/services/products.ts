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

export const DEMO_PRODUCTS: Product[] = [
  {
    id: "p1-phenyl",
    business_id: "00000000-0000-0000-0000-000000000001",
    name: "TAZQOR Phenyl",
    category_id: "cat-floor",
    category_name: "Floor Cleaner",
    description: "High-grade pine disinfectant white phenyl for commercial & household sanitation.",
    sku: "TC-PHN-01",
    hsn: "3402",
    status: "active",
    variants: [
      {
        id: "v-phn-1l",
        product_id: "p1-phenyl",
        name: "1 Litre Bottle",
        sku: "TC-PHN-01-1L",
        pack_size: "1 L",
        cost_price: 45.00,
        selling_price: 90.00,
        tax_rate: 18,
        reorder_level: 20,
        current_stock: 50,
      },
    ],
  },
  {
    id: "p2-toilet-cleaner",
    business_id: "00000000-0000-0000-0000-000000000001",
    name: "TAZQOR Toilet Cleaner",
    category_id: "cat-toilet",
    category_name: "Toilet Cleaner",
    description: "Thick disinfectant formula for limescale removal and deep bowl sanitation.",
    sku: "TC-TLT-01",
    hsn: "3402",
    status: "active",
    variants: [
      {
        id: "v-tlt-500m",
        product_id: "p2-toilet-cleaner",
        name: "500 mL Bottle",
        sku: "TC-TLT-01-500M",
        pack_size: "500 mL",
        cost_price: 40.00,
        selling_price: 80.00,
        tax_rate: 18,
        reorder_level: 20,
        current_stock: 40,
      },
    ],
  },
  {
    id: "p3-hand-wash",
    business_id: "00000000-0000-0000-0000-000000000001",
    name: "TAZQOR Hand Wash",
    category_id: "cat-hand",
    category_name: "Hand Wash",
    description: "Gentle anti-bacterial liquid hand wash with moisturizing glycerin.",
    sku: "TC-HND-01",
    hsn: "3401",
    status: "active",
    variants: [
      {
        id: "v-hnd-250m",
        product_id: "p3-hand-wash",
        name: "250 mL Pump Dispenser",
        sku: "TC-HND-01-250M",
        pack_size: "250 mL",
        cost_price: 35.00,
        selling_price: 75.00,
        tax_rate: 18,
        reorder_level: 25,
        current_stock: 60,
      },
    ],
  },
  {
    id: "p4-dish-wash",
    business_id: "00000000-0000-0000-0000-000000000001",
    name: "TAZQOR Dish Wash",
    category_id: "cat-dish",
    category_name: "Dish Wash",
    description: "Active degreaser lemon gel for commercial dishwashing and utensils.",
    sku: "TC-DSH-01",
    hsn: "3402",
    status: "active",
    variants: [
      {
        id: "v-dsh-250m",
        product_id: "p4-dish-wash",
        name: "250 mL Bottle",
        sku: "TC-DSH-01-250M",
        pack_size: "250 mL",
        cost_price: 30.00,
        selling_price: 65.00,
        tax_rate: 18,
        reorder_level: 25,
        current_stock: 45,
      },
    ],
  },
];

export async function getProducts(query?: { search?: string; categoryId?: string }): Promise<Product[]> {
  try {
    const supabase = createClient();
    const { data: dbProducts, error } = await supabase
      .from("products")
      .select("*, product_variants(*)")
      .order("created_at", { ascending: false });

    if (!error && dbProducts && dbProducts.length > 0) {
      let list: Product[] = dbProducts.map((p: any) => ({
        id: p.id,
        business_id: p.business_id,
        name: p.name,
        category_id: p.category_id || "cat-floor",
        category_name: "Cleaning Product",
        description: p.description || "",
        sku: p.sku || "",
        hsn: p.hsn || "3402",
        status: p.status === "inactive" ? "inactive" : "active",
        variants: (p.product_variants || []).map((v: any) => ({
          id: v.id,
          product_id: v.product_id,
          name: v.name || v.pack_size || "Standard",
          sku: v.sku || "",
          pack_size: v.pack_size || "1 L",
          cost_price: Number(v.cost_price) || 60,
          selling_price: Number(v.selling_price) || 100,
          tax_rate: 18,
          reorder_level: v.reorder_level || 10,
          current_stock: 50,
        })),
      }));

      if (query?.search) {
        const q = query.search.toLowerCase();
        list = list.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            p.sku.toLowerCase().includes(q) ||
            p.variants.some((v) => v.name.toLowerCase().includes(q) || v.sku.toLowerCase().includes(q))
        );
      }
      return list;
    }
  } catch (err) {
    console.warn("Supabase products fetch fallback:", err);
  }

  let list: Product[] = [];

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
      hsn: data.hsn || "3402",
      description: data.description || null,
      status: "active",
    })
    .select()
    .single();

  if (error) {
    console.error("Supabase createProduct error:", error);
    throw error;
  }

  if (data.variants && data.variants.length > 0) {
    const variantRows = data.variants.map((v) => ({
      product_id: prod.id,
      name: v.name || v.pack_size,
      sku: `${prod.sku}${v.sku}`,
      pack_size: v.pack_size,
      selling_price: v.selling_price,
      cost_price: v.cost_price,
      reorder_level: v.reorder_level || 10,
    }));
    await supabase.from("product_variants").insert(variantRows);
  }

  return prod;
}
