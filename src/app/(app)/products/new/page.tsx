"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Trash2, Save, Layers, Tag } from "lucide-react";
import { toast } from "sonner";
import { TopHeader } from "@/components/layout/TopHeader";

interface VariantRow {
  pack_size: string;
  name: string;
  sku: string;
  cost_price: number;
  selling_price: number;
  tax_rate: number;
  reorder_level: number;
}

export default function NewProductPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    name: "",
    category_id: "cat-floor",
    sku: "",
    hsn: "3402",
    description: "",
  });

  const [variants, setVariants] = useState<VariantRow[]>([
    {
      pack_size: "5 L",
      name: "5 Litre Can",
      sku: "-5L",
      cost_price: 280,
      selling_price: 450,
      tax_rate: 18,
      reorder_level: 10,
    },
    {
      pack_size: "1 L",
      name: "1 Litre Bottle",
      sku: "-1L",
      cost_price: 65,
      selling_price: 110,
      tax_rate: 18,
      reorder_level: 25,
    },
  ]);

  const addVariantRow = () => {
    setVariants([
      ...variants,
      {
        pack_size: "500 mL",
        name: "500 mL Dispenser",
        sku: "-500M",
        cost_price: 45,
        selling_price: 85,
        tax_rate: 18,
        reorder_level: 20,
      },
    ]);
  };

  const removeVariantRow = (index: number) => {
    if (variants.length <= 1) {
      toast.error("A product must have at least one pack size variant");
      return;
    }
    setVariants(variants.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.sku) {
      toast.error("Please fill in product name and base SKU");
      return;
    }

    setSubmitting(true);
    try {
      await new Promise((r) => setTimeout(r, 600));
      toast.success(`Product "${form.name}" with ${variants.length} pack variants created!`);
      router.push("/products");
    } catch {
      toast.error("Failed to create product");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen">
      <TopHeader
        title="Add New Product"
        subtitle="Define cleaning product specifications and pack size variants"
      />

      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-4xl mx-auto">
        <div>
          <Link
            href="/products"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-black transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Cancel and back to products</span>
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* General Information */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E5E4EE] shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
              <Layers className="w-5 h-5 text-gray-700" />
              <h2 className="text-base font-bold text-gray-900">Product Line Details</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Product Name *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. TAZQOR Citrus Floor Cleaner"
                  required
                  className="w-full h-11 px-4 text-xs bg-[#F9F8FD] rounded-xl border border-[#E5E4EE] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#D4F732]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Category *
                </label>
                <select
                  value={form.category_id}
                  onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                  className="w-full h-11 px-3 text-xs bg-[#F9F8FD] rounded-xl border border-[#E5E4EE] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#D4F732]"
                >
                  <option value="cat-floor">Floor Cleaner</option>
                  <option value="cat-dish">Dish Wash</option>
                  <option value="cat-hand">Hand Wash</option>
                  <option value="cat-toilet">Toilet Cleaner</option>
                  <option value="cat-glass">Glass Cleaner</option>
                  <option value="cat-car">Car Wash</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Base SKU Code *
                </label>
                <input
                  type="text"
                  value={form.sku}
                  onChange={(e) => setForm({ ...form, sku: e.target.value })}
                  placeholder="e.g. TC-FLR-01"
                  required
                  className="w-full h-11 px-4 text-xs font-mono bg-[#F9F8FD] rounded-xl border border-[#E5E4EE] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#D4F732]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  HSN / SAC Code
                </label>
                <input
                  type="text"
                  value={form.hsn}
                  onChange={(e) => setForm({ ...form, hsn: e.target.value })}
                  placeholder="e.g. 3402"
                  className="w-full h-11 px-4 text-xs font-mono bg-[#F9F8FD] rounded-xl border border-[#E5E4EE] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#D4F732]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Product Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2}
                  placeholder="Application areas, concentration ratio, surface safety..."
                  className="w-full p-3 text-xs bg-[#F9F8FD] rounded-xl border border-[#E5E4EE] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#D4F732]"
                />
              </div>
            </div>
          </div>

          {/* Variants and Pack Sizes */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E5E4EE] shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h2 className="text-base font-bold text-gray-900">Pack Sizes & Pricing Variants</h2>
                <p className="text-xs text-gray-500">Each pack size operates with its own pricing, batch tracking and barcode</p>
              </div>
              <button
                type="button"
                onClick={addVariantRow}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-gray-100 text-gray-800 text-xs font-bold hover:bg-[#0A0A0A] hover:text-white transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Pack Size</span>
              </button>
            </div>

            <div className="space-y-3">
              {variants.map((v, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-[#F9F8FD] border border-[#E5E4EE] grid grid-cols-2 sm:grid-cols-6 gap-3 items-end"
                >
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">
                      Pack Size
                    </label>
                    <input
                      type="text"
                      value={v.pack_size}
                      onChange={(e) => {
                        const copy = [...variants];
                        copy[idx].pack_size = e.target.value;
                        setVariants(copy);
                      }}
                      placeholder="5 L"
                      className="w-full h-9 px-2.5 text-xs bg-white rounded-lg border border-gray-200"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">
                      SKU Suffix
                    </label>
                    <input
                      type="text"
                      value={v.sku}
                      onChange={(e) => {
                        const copy = [...variants];
                        copy[idx].sku = e.target.value;
                        setVariants(copy);
                      }}
                      placeholder="-5L"
                      className="w-full h-9 px-2.5 text-xs font-mono bg-white rounded-lg border border-gray-200"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">
                      Cost (₹)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={v.cost_price}
                      onChange={(e) => {
                        const copy = [...variants];
                        copy[idx].cost_price = Number(e.target.value);
                        setVariants(copy);
                      }}
                      className="w-full h-9 px-2.5 text-xs bg-white rounded-lg border border-gray-200"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">
                      Selling (₹)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={v.selling_price}
                      onChange={(e) => {
                        const copy = [...variants];
                        copy[idx].selling_price = Number(e.target.value);
                        setVariants(copy);
                      }}
                      className="w-full h-9 px-2.5 text-xs bg-white rounded-lg border border-gray-200"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">
                      Reorder Threshold
                    </label>
                    <input
                      type="number"
                      value={v.reorder_level}
                      onChange={(e) => {
                        const copy = [...variants];
                        copy[idx].reorder_level = Number(e.target.value);
                        setVariants(copy);
                      }}
                      className="w-full h-9 px-2.5 text-xs bg-white rounded-lg border border-gray-200"
                    />
                  </div>

                  <div className="flex items-center justify-end">
                    <button
                      type="button"
                      onClick={() => removeVariantRow(idx)}
                      className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Remove variant"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="px-8 h-12 rounded-full bg-[#0A0A0A] text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 hover:bg-black/90 active:scale-95 transition-all shadow-md disabled:opacity-50"
            >
              <Save className="w-4 h-4 text-[#D4F732]" />
              <span>{submitting ? "Saving..." : "Save Product & Variants"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

