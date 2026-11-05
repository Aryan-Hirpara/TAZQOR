"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Trash2, ShoppingCart, AlertTriangle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { TopHeader } from "@/components/layout/TopHeader";
import { formatINR } from "@/lib/formatting/currency";

interface OrderLine {
  product_name: string;
  pack_size: string;
  quantity: number;
  unit_price: number;
  stock_available: number;
}

export default function NewOrderPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const [customer, setCustomer] = useState("c1-shreeji");
  const [notes, setNotes] = useState("");

  const [lines, setLines] = useState<OrderLine[]>([
    {
      product_name: "TAZQOR Citrus Floor Cleaner",
      pack_size: "5 L Can",
      quantity: 10,
      unit_price: 450,
      stock_available: 45,
    },
    {
      product_name: "TAZQOR Sparkle Dish Wash Gel",
      pack_size: "5 L Can",
      quantity: 2,
      unit_price: 520,
      stock_available: 35,
    },
  ]);

  const addLine = () => {
    setLines([
      ...lines,
      {
        product_name: "TAZQOR Anti-Bacterial Hand Wash",
        pack_size: "500 mL Dispenser",
        quantity: 12,
        unit_price: 85,
        stock_available: 140,
      },
    ]);
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
      await new Promise((r) => setTimeout(r, 600));
      toast.success("Order ORD-1043 created successfully (Stock not yet deducted)!");
      router.push("/orders");
    } catch {
      toast.error("Failed to save order");
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
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E5E4EE] shadow-sm space-y-4">
            <h2 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3">
              Customer Account
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Select Customer Shop *
                </label>
                <select
                  aria-label="Select Customer Shop"
                  value={customer}
                  onChange={(e) => setCustomer(e.target.value)}
                  className="w-full h-11 px-3 text-xs bg-[#F9F8FD] rounded-xl border border-[#E5E4EE]"
                >
                  <option value="c1-shreeji">Shreeji Supermarket (Haresh Patel)</option>
                  <option value="c2-pride-hotel">Hotel Pride Plaza (Housekeeping)</option>
                  <option value="c3-apex-cowork">Apex Co-Working Space (Neha Shah)</option>
                  <option value="c4-radhe-pg">Radhe Krishna PG (Mahesh Bhai)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Order Delivery Instructions
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Deliver before 2:00 PM on Tuesday"
                  className="w-full h-11 px-4 text-xs bg-[#F9F8FD] rounded-xl border border-[#E5E4EE]"
                />
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E5E4EE] shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h2 className="text-base font-bold text-gray-900">Order Items</h2>
                <p className="text-xs text-gray-500">Live stock check shown for each variant</p>
              </div>
              <button
                type="button"
                onClick={addLine}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-gray-100 text-gray-800 text-xs font-bold hover:bg-[#0A0A0A] hover:text-white transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Product</span>
              </button>
            </div>

            <div className="space-y-3">
              {lines.map((line, idx) => {
                const isOverStock = line.quantity > line.stock_available;

                return (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-[#F9F8FD] border border-[#E5E4EE] grid grid-cols-1 sm:grid-cols-12 gap-3 items-end"
                  >
                    <div className="sm:col-span-5">
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">
                        Product & Pack Size
                      </label>
                      <input
                        type="text"
                        value={`${line.product_name} (${line.pack_size})`}
                        readOnly
                        className="w-full h-9 px-3 text-xs bg-white rounded-lg border border-gray-200 font-medium"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">
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
                        className="w-full h-9 px-2.5 text-xs bg-white rounded-lg border border-gray-200"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">
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
                        className="w-full h-9 px-2.5 text-xs bg-white rounded-lg border border-gray-200"
                      />
                    </div>

                    <div className="sm:col-span-2 text-right">
                      <span className="block text-[11px] font-bold text-gray-500 mb-1">
                        Line Total
                      </span>
                      <span className="font-bold text-sm text-gray-900">
                        {formatINR(line.quantity * line.unit_price)}
                      </span>
                    </div>

                    <div className="sm:col-span-1 flex items-center justify-end">
                      <button
                        type="button"
                        onClick={() => removeLine(idx)}
                        className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Stock availability indicator */}
                    <div className="sm:col-span-12 text-xs flex items-center gap-1.5 pt-1">
                      {isOverStock ? (
                        <span className="text-amber-700 font-semibold flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Stock warning: Order qty ({line.quantity}) exceeds on-hand ({line.stock_available}). Need to produce or replenish before final delivery.</span>
                        </span>
                      ) : (
                        <span className="text-emerald-700 font-medium flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{line.stock_available} units available in FEFO batches</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Total and Submit */}
            <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <span className="text-xs text-gray-500">Estimated Order Total:</span>
                <div className="text-2xl font-black text-[#0A0A0A]">{formatINR(orderSubtotal)}</div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full sm:w-auto px-8 h-12 rounded-full bg-[#0A0A0A] text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 hover:bg-black/90 active:scale-95 transition-all shadow-md disabled:opacity-50"
              >
                <ShoppingCart className="w-4 h-4 text-[#D4F732]" />
                <span>{submitting ? "Booking Order..." : "Confirm & Book Order"}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

