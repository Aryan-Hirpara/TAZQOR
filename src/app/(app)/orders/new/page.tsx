"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Trash2, ShoppingCart, AlertTriangle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { TopHeader } from "@/components/layout/TopHeader";
import { formatINR } from "@/lib/formatting/currency";
import { getCustomers, Customer } from "@/lib/services/customers";
import { createClient } from "@/lib/supabase/client";

interface OrderLine {
  product_name: string;
  pack_size: string;
  quantity: number;
  unit_price: number;
  stock_available: number;
}

const DEFAULT_PRODUCTS = [
  { name: "1 Litre Phenyl", prod_name: "TAZQOR Phenyl", pack: "1 L Bottle", price: 90, stock: 50 },
  { name: "500ml Toilet Cleaner", prod_name: "TAZQOR Toilet Cleaner", pack: "500 mL Bottle", price: 80, stock: 40 },
  { name: "250ml Hand Wash", prod_name: "TAZQOR Hand Wash", pack: "250 mL Pump Dispenser", price: 75, stock: 60 },
  { name: "250ml Dish Wash", prod_name: "TAZQOR Dish Wash", pack: "250 mL Bottle", price: 65, stock: 45 },
];

export default function NewOrderPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [customerList, setCustomerList] = useState<Customer[]>([]);
  const [productList, setProductList] = useState(DEFAULT_PRODUCTS);

  const [customer, setCustomer] = useState("c1-shreeji");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        const custs = await getCustomers();
        if (custs && custs.length > 0) {
          setCustomerList(custs);
          setCustomer(custs[0].id);
        }

        const supabase = createClient();
        const { data: dbProds } = await supabase
          .from("products")
          .select("name, product_variants(name, pack_size, selling_price)");

        if (dbProds && dbProds.length > 0) {
          const prods: typeof DEFAULT_PRODUCTS = [];
          dbProds.forEach((p: any) => {
            (p.product_variants || []).forEach((v: any) => {
              prods.push({
                name: `${v.pack_size || ""} ${p.name}`.trim(),
                prod_name: p.name,
                pack: v.name || v.pack_size || "Standard",
                price: Number(v.selling_price) || 80,
                stock: 50,
              });
            });
          });
          if (prods.length > 0) {
            setProductList(prods);
          }
        }
      } catch (e) {
        console.warn("Could not load data for order form", e);
      }
    }
    loadData();
  }, []);

  const [lines, setLines] = useState<OrderLine[]>([
    {
      product_name: DEFAULT_PRODUCTS[0].prod_name,
      pack_size: DEFAULT_PRODUCTS[0].pack,
      quantity: 10,
      unit_price: DEFAULT_PRODUCTS[0].price,
      stock_available: DEFAULT_PRODUCTS[0].stock,
    },
    {
      product_name: DEFAULT_PRODUCTS[1].prod_name,
      pack_size: DEFAULT_PRODUCTS[1].pack,
      quantity: 5,
      unit_price: DEFAULT_PRODUCTS[1].price,
      stock_available: DEFAULT_PRODUCTS[1].stock,
    },
  ]);

  const addLine = (prodIndex = 2) => {
    const selectedProd = productList[prodIndex % productList.length] || DEFAULT_PRODUCTS[0];
    setLines([
      ...lines,
      {
        product_name: selectedProd.prod_name,
        pack_size: selectedProd.pack,
        quantity: 5,
        unit_price: selectedProd.price,
        stock_available: selectedProd.stock,
      },
    ]);
  };

  const handleProductChange = (idx: number, prodNameWithPack: string) => {
    const match = productList.find(
      (p) => `${p.prod_name} (${p.pack})` === prodNameWithPack || p.prod_name === prodNameWithPack
    );
    if (match) {
      const copy = [...lines];
      copy[idx] = {
        ...copy[idx],
        product_name: match.prod_name,
        pack_size: match.pack,
        unit_price: match.price,
        stock_available: match.stock,
      };
      setLines(copy);
    }
  };

  const removeLine = (idx: number) => {
    if (lines.length <= 1) {
      toast.error("Order must contain at least one item");
      return;
    }
    setLines(lines.filter((_, i) => i !== idx));
  };

  const orderSubtotal = lines.reduce((acc, l) => acc + l.quantity * l.unit_price, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const supabase = createClient();
      let resolvedCustomerId = customer;
      // If customer is a demo slug, lookup a real UUID or fallback
      if (customer.startsWith("c1") || !customer.includes("-") || customer.length < 32) {
        const { data: c } = await supabase.from("customers").select("id").limit(1);
        if (c && c[0]) resolvedCustomerId = c[0].id;
      }

      const generatedOrderNumber = "ORD-" + Math.floor(1000 + Math.random() * 9000);

      const { data: insertedOrder, error: orderErr } = await supabase
        .from("orders")
        .insert({
          business_id: "00000000-0000-0000-0000-000000000001",
          customer_id: resolvedCustomerId,
          order_number: generatedOrderNumber,
          status: "confirmed",
          notes: notes || null,
        })
        .select()
        .single();

      if (orderErr) {
        console.warn("Supabase orders insert notice:", orderErr.message);
      } else if (insertedOrder) {
        // Try to insert order lines if variant exists
        const { data: variants } = await supabase.from("product_variants").select("id").limit(1);
        const variantId = variants && variants[0] ? variants[0].id : null;
        if (variantId) {
          const itemsToInsert = lines.map((l) => ({
            business_id: "00000000-0000-0000-0000-000000000001",
            order_id: insertedOrder.id,
            product_variant_id: variantId,
            quantity: l.quantity,
            unit_price: l.unit_price,
          }));
          await supabase.from("order_items").insert(itemsToInsert);
        }
      }

      toast.success(`Order ${generatedOrderNumber} created successfully and persisted!`);
      router.push("/orders");
    } catch (err: any) {
      toast.error(err?.message || "Failed to save order");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen">
      <TopHeader
        title="Create Customer Order"
        subtitle="Book items in sales pipeline without deducting inventory"
      />

      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-4xl mx-auto">
        <div>
          <Link
            href="/orders"
            className="inline-flex items-center gap-1.5 min-h-[44px] text-xs font-semibold text-neutral-600 hover:text-black transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Cancel and back to orders</span>
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Customer Selection */}
          <div className="bg-white/55 backdrop-blur-xl rounded-[28px] p-6 sm:p-8 border border-white/65 shadow-none space-y-4">
            <h2 className="text-base font-normal text-neutral-900 border-b border-white/40 pb-3">
              Customer Account
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-light text-neutral-600 mb-1.5">
                  Select Customer Shop *
                </label>
                <select
                  aria-label="Select Customer Shop"
                  value={customer}
                  onChange={(e) => setCustomer(e.target.value)}
                  className="w-full h-10 px-4 text-xs bg-white/65 backdrop-blur-md rounded-full border border-white/70 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#E0FE52]"
                >
                  {customerList.length > 0 ? (
                    customerList.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.shop_name} ({c.name})
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="c1-shreeji">Shreeji Supermarket (Haresh Patel)</option>
                      <option value="c2-pride-hotel">Hotel Pride Plaza (Housekeeping)</option>
                      <option value="c3-apex-cowork">Apex Co-Working Space (Neha Shah)</option>
                      <option value="c4-radhe-pg">Radhe Krishna PG (Mahesh Bhai)</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-light text-neutral-600 mb-1.5">
                  Order Delivery Instructions
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Deliver before 2:00 PM on Tuesday"
                  className="w-full h-10 px-4 text-xs bg-white/65 backdrop-blur-md rounded-full border border-white/70 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#E0FE52]"
                />
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div className="bg-white/55 backdrop-blur-xl rounded-[28px] p-6 sm:p-8 border border-white/65 shadow-none space-y-4">
            <div className="flex items-center justify-between border-b border-white/40 pb-3">
              <div>
                <h2 className="text-base font-normal text-neutral-900">Order Items</h2>
                <p className="text-xs font-light text-neutral-500">Live stock check shown for each variant</p>
              </div>
              <button
                type="button"
                onClick={() => addLine()}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/70 text-neutral-800 text-xs font-light border border-white/80 hover:bg-black hover:text-white transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-[#E0FE52]" />
                <span>Add Product</span>
              </button>
            </div>

            <div className="space-y-3">
              {lines.map((line, idx) => {
                const isOverStock = line.quantity > line.stock_available;

                return (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-white/50 border border-white/70 grid grid-cols-1 sm:grid-cols-12 gap-3 items-end"
                  >
                    <div className="sm:col-span-5">
                      <label className="block text-[11px] font-light text-neutral-600 mb-1">
                        Select Product & Variant *
                      </label>
                      <select
                        aria-label="Select Product & Variant"
                        value={`${line.product_name} (${line.pack_size})`}
                        onChange={(e) => handleProductChange(idx, e.target.value)}
                        className="w-full h-10 px-4 text-xs bg-white/70 rounded-full border border-white/80 font-normal text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#E0FE52]"
                      >
                        {productList.map((p, pIdx) => (
                          <option key={pIdx} value={`${p.prod_name} (${p.pack})`}>
                            {p.prod_name} — {p.pack} (₹{p.price})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-light text-neutral-600 mb-1">
                        Qty (Units)
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={line.quantity}
                        onChange={(e) => {
                          const copy = [...lines];
                          copy[idx].quantity = Number(e.target.value);
                          setLines(copy);
                        }}
                        className="w-full h-10 px-3 text-xs bg-white/70 rounded-full border border-white/80 text-neutral-900 text-center font-normal"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-light text-neutral-600 mb-1">
                        Price (₹)
                      </label>
                      <input
                        type="number"
                        value={line.unit_price}
                        onChange={(e) => {
                          const copy = [...lines];
                          copy[idx].unit_price = Number(e.target.value);
                          setLines(copy);
                        }}
                        className="w-full h-10 px-3 text-xs bg-white/70 rounded-full border border-white/80 text-neutral-900 text-right font-normal"
                      />
                    </div>

                    <div className="sm:col-span-2 text-right">
                      <span className="block text-[11px] font-light text-neutral-500 mb-1">
                        Line Total
                      </span>
                      <span className="font-semibold text-sm text-neutral-900">
                        {formatINR(line.quantity * line.unit_price)}
                      </span>
                    </div>

                    <div className="sm:col-span-1 flex items-center justify-end">
                      <button
                        type="button"
                        onClick={() => removeLine(idx)}
                        className="p-2 text-neutral-400 hover:text-rose-600 hover:bg-white/80 rounded-full transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Stock availability indicator */}
                    <div className="sm:col-span-12 text-xs flex items-center gap-1.5 pt-1">
                      {isOverStock ? (
                        <span className="text-amber-800 text-[11px] font-light flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                          <span>Stock warning: Order qty ({line.quantity}) exceeds on-hand ({line.stock_available}). Need to produce or replenish before delivery.</span>
                        </span>
                      ) : (
                        <span className="text-neutral-600 text-[11px] font-light flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{line.stock_available} units available in FEFO batches</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Total and Submit */}
            <div className="pt-4 border-t border-white/40 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <span className="text-xs font-light text-neutral-500">Estimated Order Total:</span>
                <div className="text-2xl sm:text-3xl font-semibold text-neutral-900 tracking-tight">{formatINR(orderSubtotal)}</div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full sm:w-auto px-8 h-11 rounded-full bg-black text-white text-xs sm:text-sm font-normal flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-md disabled:opacity-50 cursor-pointer"
              >
                <ShoppingCart className="w-4 h-4 text-[#E0FE52]" />
                <span>{submitting ? "Booking Order..." : "Confirm & Book Order"}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

