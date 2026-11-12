"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Trash2, ShoppingCart, AlertTriangle, CheckCircle2, Save } from "lucide-react";
import { toast } from "sonner";
import { TopHeader } from "@/components/layout/TopHeader";
import { formatINR } from "@/lib/formatting/currency";
import { getCustomers, Customer } from "@/lib/services/customers";
import { getProducts } from "@/lib/services/products";
import { createClient } from "@/lib/supabase/client";
import { StyledSelect } from "@/components/ui/StyledSelect";

interface VariantOption {
  variant_id: string;
  prod_name: string;
  pack: string;
  price: number;
  stock: number;
}

interface OrderLine {
  variant_id: string;
  product_name: string;
  pack_size: string;
  quantity: number;
  unit_price: number;
  stock_available: number;
}

export default function NewOrderPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [customerList, setCustomerList] = useState<Customer[]>([]);
  const [productList, setProductList] = useState<VariantOption[]>([]);

  const [customer, setCustomer] = useState("");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<OrderLine[]>([]);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [custs, prods] = await Promise.all([getCustomers(), getProducts()]);
        setCustomerList(custs);
        if (custs.length > 0) {
          setCustomer(custs[0].id);
        }

        const flattened: VariantOption[] = [];
        for (const p of prods) {
          if (p.status !== "active") continue;
          for (const v of p.variants) {
            flattened.push({
              variant_id: v.id,
              prod_name: p.name,
              pack: v.pack_size || v.name || "Standard",
              price: Number(v.selling_price) || 0,
              stock: Number(v.current_stock) || 0,
            });
          }
        }
        setProductList(flattened);

        if (flattened.length > 0) {
          setLines([
            {
              variant_id: flattened[0].variant_id,
              product_name: flattened[0].prod_name,
              pack_size: flattened[0].pack,
              quantity: 1,
              unit_price: flattened[0].price,
              stock_available: flattened[0].stock,
            },
          ]);
        }
      } catch (e) {
        console.warn("Could not load data for order form", e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const addLine = () => {
    if (productList.length === 0) {
      toast.error("Add a product first before adding order items");
      return;
    }
    const picked = productList[lines.length % productList.length];
    setLines([
      ...lines,
      {
        variant_id: picked.variant_id,
        product_name: picked.prod_name,
        pack_size: picked.pack,
        quantity: 1,
        unit_price: picked.price,
        stock_available: picked.stock,
      },
    ]);
  };

  const handleProductChange = (idx: number, variantId: string) => {
    const match = productList.find((p) => p.variant_id === variantId);
    if (!match) return;
    const copy = [...lines];
    copy[idx] = {
      ...copy[idx],
      variant_id: match.variant_id,
      product_name: match.prod_name,
      pack_size: match.pack,
      unit_price: match.price,
      stock_available: match.stock,
    };
    setLines(copy);
  };

  const removeLine = (idx: number) => {
    if (lines.length <= 1) {
      toast.error("Order must contain at least one item");
      return;
    }
    setLines(lines.filter((_, i) => i !== idx));
  };

  const orderSubtotal = lines.reduce((acc, l) => acc + l.quantity * l.unit_price, 0);

  const saveOrder = async (targetStatus: "draft" | "confirmed") => {
    if (!customer) {
      toast.error("Please select a customer");
      return;
    }
    if (lines.length === 0 || lines.some((l) => !l.variant_id || l.quantity <= 0)) {
      toast.error("Please add at least one valid product line with quantity > 0");
      return;
    }

    setSubmitting(true);
    try {
      const supabase = createClient();
      const generatedOrderNumber = "ORD-" + Math.floor(100000 + Math.random() * 900000);

      const { data: insertedOrder, error: orderErr } = await supabase
        .from("orders")
        .insert({
          business_id: "00000000-0000-0000-0000-000000000001",
          customer_id: customer,
          order_number: generatedOrderNumber,
          status: targetStatus,
          notes: notes || null,
        })
        .select()
        .single();

      if (orderErr || !insertedOrder) {
        throw new Error(orderErr?.message || "Failed to create order");
      }

      const itemsToInsert = lines.map((l) => ({
        business_id: "00000000-0000-0000-0000-000000000001",
        order_id: insertedOrder.id,
        product_variant_id: l.variant_id,
        quantity: l.quantity,
        unit_price: l.unit_price,
      }));

      const { error: itemsErr } = await supabase.from("order_items").insert(itemsToInsert);
      if (itemsErr) {
        throw new Error(itemsErr.message || "Order created but items failed to save");
      }

      toast.success(
        targetStatus === "draft"
          ? `Order ${generatedOrderNumber} saved as draft.`
          : `Order ${generatedOrderNumber} confirmed and saved!`
      );
      router.push("/orders");
    } catch (err: any) {
      toast.error(err?.message || "Failed to save order");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen pb-12">
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

        {loading ? (
          <div className="bg-white/55 backdrop-blur-xl rounded-[28px] p-10 text-center border border-white/65 text-xs text-neutral-500">
            Loading customers and catalog...
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void saveOrder("confirmed");
            }}
            className="space-y-6"
          >
            {/* Customer Selection */}
            <div className="bg-white/55 backdrop-blur-xl rounded-[28px] p-6 sm:p-8 border border-white/65 space-y-4">
              <h2 className="text-base font-normal text-neutral-900 border-b border-white/40 pb-3">
                Customer Account
              </h2>

              {customerList.length === 0 ? (
                <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-200 text-xs text-amber-900 flex flex-wrap items-center justify-between gap-3">
                  <span>No active customers found. Add a customer before creating an order.</span>
                  <Link
                    href="/customers/new"
                    className="px-4 py-2 rounded-full bg-black text-white text-xs font-medium"
                  >
                    + Add Customer
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="min-w-0">
                    <label className="block text-xs font-light text-neutral-600 mb-1.5">
                      Select Customer Shop *
                    </label>
                    <StyledSelect
                      aria-label="Select Customer Shop"
                      value={customer}
                      onChange={(e) => setCustomer(e.target.value)}
                      className="h-10 py-0 text-xs bg-white/80 border-white/80"
                    >
                      {customerList.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.shop_name} ({c.name})
                        </option>
                      ))}
                    </StyledSelect>
                  </div>

                  <div className="min-w-0">
                    <label className="block text-xs font-light text-neutral-600 mb-1.5">
                      Order Delivery Instructions
                    </label>
                    <input
                      type="text"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="e.g. Deliver before 2:00 PM on Tuesday"
                      className="w-full h-10 px-4 text-xs bg-white/80 backdrop-blur-md rounded-full border border-white/80 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#D7FF00]"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Line Items */}
            <div className="bg-white/55 backdrop-blur-xl rounded-[28px] p-6 sm:p-8 border border-white/65 space-y-4">
              <div className="flex items-center justify-between border-b border-white/40 pb-3 gap-2">
                <div>
                  <h2 className="text-base font-normal text-neutral-900">Order Items</h2>
                  <p className="text-xs font-light text-neutral-500">
                    Live stock check shown for each pack size
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addLine}
                  disabled={productList.length === 0}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white/75 text-neutral-800 text-xs font-medium border border-white/80 hover:bg-black hover:text-white transition-all cursor-pointer disabled:opacity-40 shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Product</span>
                </button>
              </div>

              {productList.length === 0 ? (
                <div className="p-6 rounded-2xl bg-white/50 border border-white/70 text-center space-y-3">
                  <p className="text-xs text-neutral-600">
                    No active products or pack sizes available in catalog.
                  </p>
                  <Link
                    href="/products/new"
                    className="inline-flex items-center px-4 py-2 rounded-full bg-black text-white text-xs font-medium"
                  >
                    + Add Product
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {lines.map((line, idx) => {
                    const isOverStock = line.quantity > line.stock_available;

                    return (
                      <div
                        key={idx}
                        className="p-4 rounded-2xl bg-white/60 border border-white/80 grid grid-cols-1 sm:grid-cols-12 gap-3 items-end"
                      >
                        <div className="sm:col-span-5 min-w-0">
                          <label className="block text-[11px] font-light text-neutral-600 mb-1">
                            Select Product & Variant *
                          </label>
                          <StyledSelect
                            aria-label="Select Product & Variant"
                            value={line.variant_id}
                            onChange={(e) => handleProductChange(idx, e.target.value)}
                            className="h-10 py-0 text-xs bg-white/90 border-black/10"
                          >
                            {productList.map((p) => (
                              <option key={p.variant_id} value={p.variant_id}>
                                {p.prod_name} — {p.pack} ({formatINR(p.price)})
                              </option>
                            ))}
                          </StyledSelect>
                        </div>

                        <div className="sm:col-span-2 min-w-0">
                          <label className="block text-[11px] font-light text-neutral-600 mb-1">
                            Qty (Units)
                          </label>
                          <input
                            type="number"
                            min="1"
                            step="any"
                            value={line.quantity}
                            onChange={(e) => {
                              const copy = [...lines];
                              copy[idx].quantity = Number(e.target.value);
                              setLines(copy);
                            }}
                            className="w-full h-10 px-3 text-xs bg-white/90 rounded-full border border-black/10 text-neutral-900 text-center font-normal"
                          />
                        </div>

                        <div className="sm:col-span-2 min-w-0">
                          <label className="block text-[11px] font-light text-neutral-600 mb-1">
                            Price (₹)
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={line.unit_price}
                            onChange={(e) => {
                              const copy = [...lines];
                              copy[idx].unit_price = Number(e.target.value);
                              setLines(copy);
                            }}
                            className="w-full h-10 px-3 text-xs bg-white/90 rounded-full border border-black/10 text-neutral-900 text-right font-normal"
                          />
                        </div>

                        <div className="sm:col-span-2 text-right min-w-0">
                          <span className="block text-[11px] font-light text-neutral-500 mb-1">
                            Line Total
                          </span>
                          <span className="font-semibold text-sm text-neutral-900 block truncate">
                            {formatINR(line.quantity * line.unit_price)}
                          </span>
                        </div>

                        <div className="sm:col-span-1 flex items-center justify-end">
                          <button
                            type="button"
                            onClick={() => removeLine(idx)}
                            aria-label="Remove item line"
                            className="p-2 text-neutral-400 hover:text-rose-600 hover:bg-white/80 rounded-full transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Stock availability indicator */}
                        <div className="sm:col-span-12 text-xs flex items-center gap-1.5 pt-1">
                          {isOverStock ? (
                            <span className="text-amber-800 text-[11px] font-light flex items-center gap-1">
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                              <span>
                                Stock warning: Order qty ({line.quantity}) exceeds on-hand ({line.stock_available}).
                              </span>
                            </span>
                          ) : (
                            <span className="text-neutral-600 text-[11px] font-light flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span>{line.stock_available} units available in FEFO batches</span>
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Total and Submit */}
              <div className="pt-4 border-t border-white/40 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-light text-neutral-500">Estimated Order Total:</span>
                  <div className="text-2xl sm:text-3xl font-semibold text-neutral-900 tracking-tight">
                    {formatINR(orderSubtotal)}
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-2.5">
                  <button
                    type="button"
                    disabled={submitting || customerList.length === 0 || lines.length === 0}
                    onClick={() => void saveOrder("draft")}
                    className="px-6 h-11 rounded-full bg-white/80 text-neutral-800 border border-black/10 text-xs font-medium flex items-center justify-center gap-2 hover:bg-white transition-all disabled:opacity-50 cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save as Draft</span>
                  </button>

                  <button
                    type="submit"
                    disabled={submitting || customerList.length === 0 || lines.length === 0}
                    className="px-8 h-11 rounded-full bg-black text-white text-xs sm:text-sm font-normal flex items-center justify-center gap-2 hover:bg-neutral-800 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    <ShoppingCart className="w-4 h-4 text-[#D7FF00]" />
                    <span>{submitting ? "Booking Order..." : "Confirm & Book Order"}</span>
                  </button>
                </div>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
