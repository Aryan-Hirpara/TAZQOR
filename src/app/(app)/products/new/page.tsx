"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Trash2, Save, Layers } from "lucide-react";
import { toast } from "sonner";
import { TopHeader } from "@/components/layout/TopHeader";
import { StyledSelect } from "@/components/ui/StyledSelect";
import { createProduct } from "@/lib/services/products";
import { createClient } from "@/lib/supabase/client";

const BUSINESS_ID = "00000000-0000-0000-0000-000000000001";

interface VariantRow {
  pack_size: string;
  name: string;
  sku: string;
  cost_price: number | "";
  selling_price: number | "";
  tax_rate: number;
  reorder_level: number | "";
}

interface CategoryOption {
  id: string;
  name: string;
}

export default function NewProductPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [loadingCats, setLoadingCats] = useState(true);

  const [form, setForm] = useState({
    name: "",
    category_id: "",
    sku: "",
    hsn: "",
    description: "",
  });

  const [variants, setVariants] = useState<VariantRow[]>([
    {
      pack_size: "",
      name: "",
      sku: "",
      cost_price: "",
      selling_price: "",
      tax_rate: 18,
      reorder_level: "",
    },
  ]);

  useEffect(() => {
    async function loadCategories() {
      setLoadingCats(true);
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("categories")
          .select("id, name")
          .eq("business_id", BUSINESS_ID)
          .order("sort_order", { ascending: true })
          .order("name", { ascending: true });

        if (!error && data) {
          setCategories(data);
          if (data.length > 0) {
            setForm((prev) => ({
              ...prev,
              category_id: prev.category_id || data[0].id,
            }));
          }
        }
      } catch (err) {
        console.warn("Could not load categories", err);
      } finally {
        setLoadingCats(false);
      }
    }
    loadCategories();
  }, []);

  const addVariantRow = () => {
    setVariants([
      ...variants,
      {
        pack_size: "",
        name: "",
        sku: "",
        cost_price: "",
        selling_price: "",
        tax_rate: 18,
        reorder_level: "",
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
    if (!form.name.trim() || !form.sku.trim()) {
      toast.error("Please fill in product name and base SKU");
      return;
    }
    if (
      variants.some(
        (v) =>
          !v.pack_size.trim() ||
          v.selling_price === "" ||
          Number(v.selling_price) < 0
      )
    ) {
      toast.error("Each pack size requires a label and a valid selling price");
      return;
    }

    setSubmitting(true);
    try {
      await createProduct({
        name: form.name.trim(),
        sku: form.sku.trim(),
        hsn: form.hsn.trim() || undefined,
        description: form.description.trim() || undefined,
        category_id: form.category_id || undefined,
        variants: variants.map((v) => ({
          pack_size: v.pack_size.trim(),
          name: (v.name || v.pack_size).trim(),
          sku: v.sku.trim(),
          cost_price: Number(v.cost_price) || 0,
          selling_price: Number(v.selling_price) || 0,
          tax_rate: Number(v.tax_rate) || 0,
          reorder_level: Number(v.reorder_level) || 0,
        })),
      });
      toast.success(
        `Product "${form.name.trim()}" with ${variants.length} pack variant(s) created!`
      );
      router.push("/products");
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Failed to create product"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen">
      <TopHeader
        title="Add New Product"
        subtitle="Define product specifications and pack size variants"
      />

      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-4xl mx-auto">
        <div>
          <Link
            href="/products"
            className="inline-flex items-center gap-1.5 min-h-[44px] text-xs font-semibold text-neutral-600 hover:text-black transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Cancel and back to products</span>
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* General Information */}
          <div className="bg-white/55 backdrop-blur-xl rounded-[28px] p-6 sm:p-8 border border-white/65 shadow-none space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-white/40">
              <Layers className="w-5 h-5 text-neutral-700" />
              <h2 className="text-base font-normal text-neutral-900">
                Product Line Details
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="min-w-0">
                <label className="block text-xs font-normal text-neutral-700 mb-1.5">
                  Product Name *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Enter product name"
                  required
                  className="w-full h-11 px-4 text-xs bg-white/60 backdrop-blur-md rounded-full border border-neutral-200/80 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#D4F732]"
                />
              </div>

              <div className="min-w-0">
                <div className="flex items-center justify-between mb-1.5 gap-2">
                  <label className="block text-xs font-normal text-neutral-700">
                    Category
                  </label>
                  <Link
                    href="/categories"
                    className="text-[11px] font-medium text-neutral-600 hover:text-black underline shrink-0"
                  >
                    Manage categories
                  </Link>
                </div>
                <StyledSelect
                  aria-label="Product Category"
                  value={form.category_id}
                  onChange={(e) =>
                    setForm({ ...form, category_id: e.target.value })
                  }
                  disabled={loadingCats}
                  className="w-full h-11 pl-4 text-xs bg-white/60 backdrop-blur-md rounded-full border border-neutral-200/80 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#D4F732]"
                >
                  {categories.length === 0 ? (
                    <option value="">
                      {loadingCats ? "Loading categories..." : "Uncategorised"}
                    </option>
                  ) : (
                    <>
                      <option value="">Uncategorised</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </>
                  )}
                </StyledSelect>
              </div>

              <div className="min-w-0">
                <label className="block text-xs font-normal text-neutral-700 mb-1.5">
                  Base SKU Code *
                </label>
                <input
                  type="text"
                  value={form.sku}
                  onChange={(e) => setForm({ ...form, sku: e.target.value })}
                  placeholder="e.g. SKU-001"
                  required
                  className="w-full h-11 px-4 text-xs font-mono bg-white/60 backdrop-blur-md rounded-full border border-neutral-200/80 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#D4F732]"
                />
              </div>

              <div className="min-w-0">
                <label className="block text-xs font-normal text-neutral-700 mb-1.5">
                  HSN / SAC Code
                </label>
                <input
                  type="text"
                  value={form.hsn}
                  onChange={(e) => setForm({ ...form, hsn: e.target.value })}
                  placeholder="Optional HSN / SAC"
                  className="w-full h-11 px-4 text-xs font-mono bg-white/60 backdrop-blur-md rounded-full border border-neutral-200/80 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#D4F732]"
                />
              </div>

              <div className="sm:col-span-2 min-w-0">
                <label className="block text-xs font-normal text-neutral-700 mb-1.5">
                  Product Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  rows={2}
                  placeholder="Application areas, formulation notes, packaging..."
                  className="w-full p-3.5 text-xs bg-white/60 backdrop-blur-md rounded-2xl border border-neutral-200/80 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#D4F732]"
                />
              </div>
            </div>
          </div>

          {/* Variants and Pack Sizes */}
          <div className="bg-white/55 backdrop-blur-xl rounded-[28px] p-6 sm:p-8 border border-white/65 shadow-none space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/40">
              <div className="min-w-0">
                <h2 className="text-base font-normal text-neutral-900">
                  Pack Sizes & Pricing Variants
                </h2>
                <p className="text-xs text-neutral-500 font-light">
                  Each pack size operates with its own pricing and batch tracking
                </p>
              </div>
              <button
                type="button"
                onClick={addVariantRow}
                className="flex items-center gap-1.5 px-4 h-10 rounded-full bg-white/70 text-neutral-800 text-xs font-normal border border-white/80 hover:bg-white transition-all cursor-pointer shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Pack Size</span>
              </button>
            </div>

            <div className="space-y-3">
              {variants.map((v, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-white/60 border border-white/70 grid grid-cols-2 sm:grid-cols-6 gap-3 items-end"
                >
                  <div className="min-w-0">
                    <label className="block text-[11px] font-normal text-neutral-700 mb-1">
                      Pack Size *
                    </label>
                    <input
                      type="text"
                      required
                      value={v.pack_size}
                      onChange={(e) => {
                        const copy = [...variants];
                        copy[idx].pack_size = e.target.value;
                        if (!copy[idx].name) copy[idx].name = e.target.value;
                        setVariants(copy);
                      }}
                      placeholder="e.g. 5 L"
                      className="w-full h-10 px-3 text-xs bg-white/80 rounded-xl border border-neutral-200/70"
                    />
                  </div>

                  <div className="min-w-0">
                    <label className="block text-[11px] font-normal text-neutral-700 mb-1">
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
                      placeholder="e.g. -5L"
                      className="w-full h-10 px-3 text-xs font-mono bg-white/80 rounded-xl border border-neutral-200/70"
                    />
                  </div>

                  <div className="min-w-0">
                    <label className="block text-[11px] font-normal text-neutral-700 mb-1">
                      Cost (₹)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={v.cost_price}
                      onChange={(e) => {
                        const copy = [...variants];
                        copy[idx].cost_price =
                          e.target.value === "" ? "" : Number(e.target.value);
                        setVariants(copy);
                      }}
                      placeholder="0.00"
                      className="w-full h-10 px-3 text-xs bg-white/80 rounded-xl border border-neutral-200/70"
                    />
                  </div>

                  <div className="min-w-0">
                    <label className="block text-[11px] font-normal text-neutral-700 mb-1">
                      Selling (₹) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={v.selling_price}
                      onChange={(e) => {
                        const copy = [...variants];
                        copy[idx].selling_price =
                          e.target.value === "" ? "" : Number(e.target.value);
                        setVariants(copy);
                      }}
                      placeholder="0.00"
                      className="w-full h-10 px-3 text-xs bg-white/80 rounded-xl border border-neutral-200/70"
                    />
                  </div>

                  <div className="min-w-0">
                    <label className="block text-[11px] font-normal text-neutral-700 mb-1">
                      Reorder Level
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={v.reorder_level}
                      onChange={(e) => {
                        const copy = [...variants];
                        copy[idx].reorder_level =
                          e.target.value === "" ? "" : Number(e.target.value);
                        setVariants(copy);
                      }}
                      placeholder="0"
                      className="w-full h-10 px-3 text-xs bg-white/80 rounded-xl border border-neutral-200/70"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => removeVariantRow(idx)}
                      className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Remove pack size"
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
              className="px-8 h-11 rounded-full bg-black text-white text-xs sm:text-sm font-normal flex items-center justify-center gap-2 hover:bg-neutral-800 active:scale-95 transition-all shadow-sm disabled:opacity-50 cursor-pointer"
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
