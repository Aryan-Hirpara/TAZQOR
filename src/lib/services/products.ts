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
    id: "p1-floor-cleaner",
    business_id: "00000000-0000-0000-0000-000000000001",
    name: "TAZQOR Citrus Floor Cleaner",
    category_id: "cat-floor",
    category_name: "Floor Cleaner",
    description: "Heavy-duty commercial floor disinfectant with citrus fragrance. Safe for marble, tiles and epoxy.",
    sku: "TC-FLR-01",
    hsn: "3402",
    status: "active",
    variants: [
      {
        id: "v-flr-5l",
        product_id: "p1-floor-cleaner",
        name: "5 Litre Commercial Can",
        sku: "TC-FLR-01-5L",
        pack_size: "5 L",
        cost_price: 280.00,
        selling_price: 450.00,
        tax_rate: 18,
        reorder_level: 10,
        current_stock: 45,
      },
      {
        id: "v-flr-1l",
        product_id: "p1-floor-cleaner",
        name: "1 Litre Retail Bottle",
        sku: "TC-FLR-01-1L",
        pack_size: "1 L",
        cost_price: 65.00,
        selling_price: 110.00,
        tax_rate: 18,
        reorder_level: 25,
        current_stock: 120,
      },
    ],
  },
  {
    id: "p2-dish-wash",
    business_id: "00000000-0000-0000-0000-000000000001",
    name: "TAZQOR Sparkle Dish Wash Gel",
    category_id: "cat-dish",
    category_name: "Dish Wash",
    description: "Concentrated degreaser formula with active lemon extracts for commercial kitchens and utensils.",
    sku: "TC-DSH-01",
    hsn: "3402",
    status: "active",
    variants: [
      {
        id: "v-dsh-5l",
        product_id: "p2-dish-wash",
        name: "5 Litre Kitchen Can",
        sku: "TC-DSH-01-5L",
        pack_size: "5 L",
        cost_price: 310.00,
        selling_price: 520.00,
        tax_rate: 18,
        reorder_level: 8,
        current_stock: 32,
      },
      {
        id: "v-dsh-500m",
        product_id: "p2-dish-wash",
        name: "500 mL Squeeze Bottle",
        sku: "TC-DSH-01-500M",
        pack_size: "500 mL",
        cost_price: 42.00,
        selling_price: 75.00,
        tax_rate: 18,
        reorder_level: 30,
        current_stock: 85,
      },
    ],
  },
  {
    id: "p3-hand-wash",
    business_id: "00000000-0000-0000-0000-000000000001",
    name: "TAZQOR Anti-Bacterial Hand Wash",
    category_id: "cat-hand",
    category_name: "Hand Wash",
    description: "Moisturizing formula with tea tree oil. Tested 99.9% germ protection for hospitality & clinic washrooms.",
    sku: "TC-HND-01",
    hsn: "3402",
    status: "active",
    variants: [
      {
        id: "v-hnd-5l",
        product_id: "p3-hand-wash",
        name: "5 Litre Dispenser Refill Can",
        sku: "TC-HND-01-5L",
        pack_size: "5 L",
        cost_price: 290.00,
        selling_price: 480.00,
        tax_rate: 18,
        reorder_level: 6,
        current_stock: 28,
      },
      {
        id: "v-hnd-500m",
        product_id: "p3-hand-wash",
        name: "500 mL Pump Dispenser",
        sku: "TC-HND-01-500M",
        pack_size: "500 mL",
        cost_price: 48.00,
        selling_price: 90.00,
        tax_rate: 18,
        reorder_level: 25,
        current_stock: 64,
      },
    ],
  },
  {
    id: "p4-toilet-cleaner",
    business_id: "00000000-0000-0000-0000-000000000001",
    name: "TAZQOR Power Toilet Cleaner",
    category_id: "cat-toilet",
    category_name: "Toilet Cleaner",
    description: "Thick blue disinfectant acidic formula for heavy limescale, yellow stains and rim sanitation.",
    sku: "TC-TLT-01",
    hsn: "3402",
    status: "active",
    variants: [
      {
        id: "v-tlt-5l",
        product_id: "p4-toilet-cleaner",
        name: "5 Litre Bulk Can",
        sku: "TC-TLT-01-5L",
        pack_size: "5 L",
        cost_price: 260.00,
        selling_price: 420.00,
        tax_rate: 18,
        reorder_level: 10,
        current_stock: 40,
      },
      {
        id: "v-tlt-1l",
        product_id: "p4-toilet-cleaner",
        name: "1 Litre Angled Neck Bottle",
        sku: "TC-TLT-01-1L",
        pack_size: "1 L",
        cost_price: 58.00,
        selling_price: 105.00,
        tax_rate: 18,
        reorder_level: 20,
        current_stock: 90,
      },
    ],
  },
  {
    id: "p5-glass-cleaner",
    business_id: "00000000-0000-0000-0000-000000000001",
    name: "TAZQOR Streak-Free Glass Cleaner",
    category_id: "cat-glass",
    category_name: "Glass Cleaner",
    description: "Ammonia-free fast evaporating formula for windows, mirrors, vehicle windscreens and display counters.",
    sku: "TC-GLS-01",
    hsn: "3402",
    status: "active",
    variants: [
      {
        id: "v-gls-5l",
        product_id: "p5-glass-cleaner",
        name: "5 Litre Refill Can",
        sku: "TC-GLS-01-5L",
        pack_size: "5 L",
        cost_price: 240.00,
        selling_price: 390.00,
        tax_rate: 18,
        reorder_level: 8,
        current_stock: 18,
      },
      {
        id: "v-gls-500m",
        product_id: "p5-glass-cleaner",
        name: "500 mL Trigger Spray",
        sku: "TC-GLS-01-500M",
        pack_size: "500 mL",
        cost_price: 52.00,
        selling_price: 95.00,
        tax_rate: 18,
        reorder_level: 20,
        current_stock: 65,
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

  let list = [...DEMO_PRODUCTS];

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
