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
    description: "Lemon power concentrated dishwashing gel for utensils, grease cut and hotel kitchen cleaning.",
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
        current_stock: 35,
      },
      {
        id: "v-dsh-500m",
        product_id: "p2-dish-wash",
        name: "500 mL Squeeze Bottle",
        sku: "TC-DSH-01-500M",
        pack_size: "500 mL",
        cost_price: 40.00,
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
    description: "Moisturizing liquid hand wash with aloe vera and germ protection.",
    sku: "TC-HND-01",
    hsn: "3401",
    status: "active",
    variants: [
      {
        id: "v-hnd-5l",
        product_id: "p3-hand-wash",
        name: "5 Litre Refill Can",
        sku: "TC-HND-01-5L",
        pack_size: "5 L",
        cost_price: 260.00,
        selling_price: 440.00,
        tax_rate: 18,
        reorder_level: 12,
        current_stock: 28,
      },
      {
        id: "v-hnd-500m",
        product_id: "p3-hand-wash",
        name: "500 mL Pump Dispenser",
        sku: "TC-HND-01-500M",
        pack_size: "500 mL",
        cost_price: 48.00,
        selling_price: 85.00,
        tax_rate: 18,
        reorder_level: 30,
        current_stock: 140,
      },
    ],
  },
  {
    id: "p4-toilet-cleaner",
    business_id: "00000000-0000-0000-0000-000000000001",
    name: "TAZQOR Ultra Toilet Cleaner",
    category_id: "cat-toilet",
    category_name: "Toilet Cleaner",
    description: "Thick blue formula that removes tough stains and 99.9% germs.",
    sku: "TC-TLT-01",
    hsn: "3402",
    status: "active",
    variants: [
      {
        id: "v-tlt-5l",
        product_id: "p4-toilet-cleaner",
        name: "5 Litre Can",
        sku: "TC-TLT-01-5L",
        pack_size: "5 L",
        cost_price: 270.00,
        selling_price: 430.00,
        tax_rate: 18,
        reorder_level: 10,
        current_stock: 22,
      },
      {
        id: "v-tlt-1l",
        product_id: "p4-toilet-cleaner",
        name: "1 Litre Angled Bottle",
        sku: "TC-TLT-01-1L",
        pack_size: "1 L",
        cost_price: 68.00,
        selling_price: 115.00,
        tax_rate: 18,
        reorder_level: 25,
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
    description: "Streak-free formula for showroom windows, mirrors and glass partitions.",
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

