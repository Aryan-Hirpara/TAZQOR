"use client";

import { useEffect, useId, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Boxes,
  Calculator,
  Layers,
  Lock,
  Package,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { TopHeader } from "@/components/layout/TopHeader";
import { StyledSelect } from "@/components/ui/StyledSelect";
import {
  calculateComboPackSummary,
  COMBO_PACK_CATEGORY_DESCRIPTION,
  COMBO_PACK_CATEGORY_NAME,
  isComboPackCategoryName,
} from "@/lib/products/combo-pack";
import { createProduct, getProducts } from "@/lib/services/products";
import { createClient } from "@/lib/supabase/client";
import {
  buildBaseProductSku,
  buildVariantSkusForProduct,
} from "@/lib/identifiers/codes";

const BUSINESS_ID = "00000000-0000-0000-0000-000000000001";
const MIN_COMBO_ITEMS = 2;
const MAX_COMBO_ITEMS = 10;
const QUICK_COMBO_COUNTS = [2, 3, 4, 5, 6] as const;

type EntryMode = "single" | "combo";

interface VariantRow {
  pack_size: string;
  name: string;
  sku: string;
  skuManual?: boolean;
  cost_price: number | "";
  selling_price: number | "";
  tax_rate: number;
  opening_stock: number | "";
}

interface CategoryOption {
  id: string;
  name: string;
  sort_order?: number | null;
}

interface CatalogVariantOption {
  id: string;
  productId: string;
  productName: string;
  categoryName: string;
  packSize: string;
  sku: string;
  costPrice: number;
  sellingPrice: number;
  taxRate: number;
  currentStock: number;
}

interface ComboSlotSelection {
  variantId: string;
  quantity: number;
}

export default function NewProductPage() {
  const router = useRouter();
  const baseId = useId();
  const [entryMode, setEntryMode] = useState<EntryMode>("single");
  const [submitting, setSubmitting] = useState(false);

  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [catalogVariants, setCatalogVariants] = useState<CatalogVariantOption[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);

  const [form, setForm] = useState({
    name: "",
    category_id: "",
    sku: "",
    hsn: "",
    description: "",
  });
  const [baseSkuManual, setBaseSkuManual] = useState(false);

  const [variants, setVariants] = useState<VariantRow[]>([
    {
      pack_size: "",
      name: "",
      sku: "",
      skuManual: false,
      cost_price: "",
      selling_price: "",
      tax_rate: 18,
      opening_stock: "",
    },
  ]);

  const [comboCount, setComboCount] = useState<number>(2);
  const [comboSlots, setComboSlots] = useState<ComboSlotSelection[]>([
    { variantId: "", quantity: 1 },
    { variantId: "", quantity: 1 },
  ]);
  const [comboSellingPrice, setComboSellingPrice] = useState<number | "">("");
  const [comboTaxRate, setComboTaxRate] = useState<number>(18);

  useEffect(() => {
    async function loadInitialData() {
      setLoadingInitial(true);
      try {
        const supabase = createClient();
        const [{ data: catData, error: catError }, products] = await Promise.all([
          supabase
            .from("categories")
            .select("id, name, sort_order")
            .eq("business_id", BUSINESS_ID)
            .order("sort_order", { ascending: true })
            .order("name", { ascending: true }),
          getProducts().catch(() => []),
        ]);

        let catList = (!catError && catData ? catData : []) as CategoryOption[];

        if (!catList.some((c) => isComboPackCategoryName(c.name))) {
          const nextSort =
            catList.reduce((max, c) => Math.max(max, c.sort_order ?? 0), 0) + 1;
          const { data: insertedCombo } = await supabase
            .from("categories")
            .insert({
              business_id: BUSINESS_ID,
              name: COMBO_PACK_CATEGORY_NAME,
              description: COMBO_PACK_CATEGORY_DESCRIPTION,
              sort_order: nextSort,
            })
            .select("id, name, sort_order")
            .maybeSingle();

          if (insertedCombo) {
            catList = [...catList, insertedCombo];
          }
        }

        setCategories(catList);

        const defaultSingleCat =
          catList.find((c) => !isComboPackCategoryName(c.name)) || catList[0];
        if (defaultSingleCat) {
          setForm((prev) => ({
            ...prev,
            category_id: prev.category_id || defaultSingleCat.id,
          }));
        }

        const flattened: CatalogVariantOption[] = [];
        for (const product of products) {
          if (isComboPackCategoryName(product.category_name)) continue;
          for (const variant of product.variants || []) {
            flattened.push({
              id: variant.id,
              productId: product.id,
              productName: product.name,
              categoryName: product.category_name || "Uncategorised",
              packSize: variant.pack_size || variant.name || variant.sku,
              sku: variant.sku,
              costPrice: Number(variant.cost_price) || 0,
              sellingPrice: Number(variant.selling_price) || 0,
              taxRate: Number(variant.tax_rate) || 0,
              currentStock: Number(variant.current_stock) || 0,
            });
          }
        }
        setCatalogVariants(flattened);
      } catch (err) {
        console.warn("Could not load product creation metadata", err);
      } finally {
        setLoadingInitial(false);
      }
    }

    loadInitialData();
  }, []);

  const comboCategory = useMemo(
    () => categories.find((c) => isComboPackCategoryName(c.name)) || null,
    [categories]
  );

  const firstSingleCategory = useMemo(
    () => categories.find((c) => !isComboPackCategoryName(c.name)) || null,
    [categories]
  );

  const variantLookup = useMemo(() => {
    const map = new Map<string, CatalogVariantOption>();
    for (const v of catalogVariants) {
      map.set(v.id, v);
    }
    return map;
  }, [catalogVariants]);

  const existingCatalogSkus = useMemo(
    () =>
      new Set(
        catalogVariants
          .map((v) => v.sku?.trim().toUpperCase())
          .filter(Boolean)
      ),
    [catalogVariants]
  );

  // Auto-generate standardized permanent Base SKU (`TQR-[PROD]`) unless manually edited
  useEffect(() => {
    if (baseSkuManual) return;
    const nextBase = form.name.trim()
      ? buildBaseProductSku(form.name, { isCombo: entryMode === "combo" })
      : "";
    setForm((prev) => (prev.sku === nextBase ? prev : { ...prev, sku: nextBase }));
  }, [form.name, entryMode, baseSkuManual]);

  // Auto-generate standardized permanent Variant SKUs (`TQR-[PROD]-[SIZE]` or `TQR-[PROD]-[SCENT]-[SIZE]`)
  const variantSignature = variants
    .map((v) => `${v.pack_size}::${v.name}::${Boolean(v.skuManual)}`)
    .join("|");

  useEffect(() => {
    if (entryMode !== "single") return;
    const suggested = buildVariantSkusForProduct({
      productName: form.name.trim() || "Product",
      isCombo: false,
      variants: variants.map((v) => ({
        pack_size: v.pack_size || "STD",
        name: v.name,
      })),
      existingCatalogSkus,
    });

    setVariants((prev) => {
      let changed = false;
      const next = prev.map((v, idx) => {
        if (v.skuManual) return v;
        const target =
          form.name.trim() && v.pack_size.trim() ? suggested[idx] : "";
        if (v.sku === target) return v;
        changed = true;
        return { ...v, sku: target };
      });
      return changed ? next : prev;
    });
  }, [entryMode, form.name, variantSignature, existingCatalogSkus]);

  const handleModeChange = (nextMode: EntryMode) => {
    setEntryMode(nextMode);
    if (nextMode === "combo") {
      if (comboCategory) {
        setForm((prev) => ({ ...prev, category_id: comboCategory.id }));
      }
    } else if (comboCategory && form.category_id === comboCategory.id) {
      setForm((prev) => ({
        ...prev,
        category_id: firstSingleCategory?.id || "",
      }));
    }
  };

  const handleCategoryDropdownChange = (selectedId: string) => {
    const selectedCategory = categories.find((c) => c.id === selectedId);
    if (selectedCategory && isComboPackCategoryName(selectedCategory.name)) {
      setForm((prev) => ({ ...prev, category_id: selectedId }));
      setEntryMode("combo");
      return;
    }
    setForm((prev) => ({ ...prev, category_id: selectedId }));
  };

  const handleComboCountChange = (rawCount: number) => {
    const clamped = Math.max(MIN_COMBO_ITEMS, Math.min(MAX_COMBO_ITEMS, rawCount));
    setComboCount(clamped);
    setComboSlots((prev) =>
      Array.from({ length: clamped }, (_, idx) => prev[idx] ?? { variantId: "", quantity: 1 })
    );
  };

  const updateComboSlot = (idx: number, patch: Partial<ComboSlotSelection>) => {
    setComboSlots((prev) =>
      prev.map((slot, i) => (i === idx ? { ...slot, ...patch } : slot))
    );
  };

  const resolvedComboInputs = useMemo(() => {
    return comboSlots
      .map((slot) => {
        const option = slot.variantId ? variantLookup.get(slot.variantId) : undefined;
        if (!option) return null;
        return {
          variantId: option.id,
          productName: option.productName,
          packSize: option.packSize,
          costPrice: option.costPrice,
          currentStock: option.currentStock,
          quantity: Math.max(1, Math.floor(slot.quantity || 1)),
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);
  }, [comboSlots, variantLookup]);

  const comboSummary = useMemo(
    () => calculateComboPackSummary(resolvedComboInputs),
    [resolvedComboInputs]
  );

  const allComboSlotsFilled =
    comboSlots.length === comboCount &&
    comboSlots.every((slot) => Boolean(slot.variantId) && slot.quantity >= 1);

  const comboMargin = useMemo(() => {
    const sell = Number(comboSellingPrice);
    if (comboSellingPrice === "" || Number.isNaN(sell) || sell <= 0) return null;
    const profit = sell - comboSummary.totalCostPrice;
    const pct = Math.round((profit / sell) * 100);
    return { profit, pct };
  }, [comboSellingPrice, comboSummary.totalCostPrice]);

  const addVariantRow = () => {
    setVariants([
      ...variants,
      {
        pack_size: "",
        name: "",
        sku: "",
        skuManual: false,
        cost_price: "",
        selling_price: "",
        tax_rate: 18,
        opening_stock: "",
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
      toast.error(
        entryMode === "combo"
          ? "Please fill in combo pack name and base SKU"
          : "Please fill in product name and base SKU"
      );
      return;
    }

    if (entryMode === "combo") {
      if (!allComboSlotsFilled || !comboSummary.packSizeLabel) {
        toast.error(`Please select all ${comboCount} products included in this combo pack`);
        return;
      }
      if (comboSellingPrice === "" || Number(comboSellingPrice) < 0) {
        toast.error("Please enter a valid selling price for this combo pack");
        return;
      }

      const descriptionLines = [`Includes: ${comboSummary.componentsSummary}`];
      if (form.description.trim()) {
        descriptionLines.push(form.description.trim());
      }

      setSubmitting(true);
      try {
        const comboSku = buildVariantSkusForProduct({
          productName: form.name.trim(),
          isCombo: true,
          variants: [
            {
              pack_size: comboSummary.packSizeLabel,
              name: comboSummary.packSizeLabel,
            },
          ],
          existingCatalogSkus,
        })[0];

        await createProduct({
          name: form.name.trim(),
          sku: form.sku.trim().toUpperCase(),
          hsn: form.hsn.trim() || undefined,
          description: descriptionLines.join("\n"),
          category_id: comboCategory?.id || form.category_id || undefined,
          combo_items: resolvedComboInputs.map((item) => ({
            variant_id: item.variantId,
            quantity: item.quantity,
          })),
          variants: [
            {
              pack_size: comboSummary.packSizeLabel,
              name: comboSummary.packSizeLabel,
              sku: comboSku,
              cost_price: comboSummary.totalCostPrice,
              selling_price: Number(comboSellingPrice) || 0,
              tax_rate: Number(comboTaxRate) || 0,
            },
          ],
        });
        toast.success(`Combo pack "${form.name.trim()}" created!`);
        router.push("/products");
      } catch (err: unknown) {
        const msg =
          err instanceof Error
            ? err.message
            : typeof (err as { message?: unknown })?.message === "string"
            ? String((err as { message: string }).message)
            : "Failed to create combo pack";
        toast.error(msg);
      } finally {
        setSubmitting(false);
      }
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
          opening_stock: Math.max(0, Number(v.opening_stock) || 0),
        })),
      });
      toast.success(
        `Product "${form.name.trim()}" with ${variants.length} pack variant(s) created!`
      );
      router.push("/products");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to create product");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen">
      <TopHeader
        title={entryMode === "combo" ? "Add Combo Pack" : "Add New Product"}
        subtitle={
          entryMode === "combo"
            ? "Bundle existing products with auto-calculated pack size and cost price"
            : "Define product specifications and pack size variants"
        }
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

        {/* Product Mode Switcher right below Cancel and back to products */}
        <fieldset className="bg-white/55 backdrop-blur-xl rounded-[28px] p-2 border border-white/65">
          <legend className="sr-only">Product Type</legend>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <label
              htmlFor={`${baseId}-mode-single`}
              className={`flex items-center gap-3 px-4 py-3 rounded-[22px] cursor-pointer transition-colors ${
                entryMode === "single"
                  ? "bg-black text-white shadow-sm"
                  : "bg-white/85 text-neutral-800 border border-black/10 hover:bg-white"
              }`}
            >
              <input
                id={`${baseId}-mode-single`}
                type="radio"
                name="product-entry-mode"
                value="single"
                checked={entryMode === "single"}
                onChange={() => handleModeChange("single")}
                className="sr-only"
              />
              <Package
                className={`w-4 h-4 shrink-0 ${
                  entryMode === "single" ? "text-[#D4F732]" : "text-neutral-600"
                }`}
              />
              <div className="min-w-0">
                <p className="text-xs font-semibold leading-tight">Single Product</p>
                <p
                  className={`text-[11px] leading-tight mt-0.5 ${
                    entryMode === "single" ? "text-neutral-300" : "text-neutral-500"
                  }`}
                >
                  Individual item with pack sizes
                </p>
              </div>
            </label>

            <label
              htmlFor={`${baseId}-mode-combo`}
              className={`flex items-center gap-3 px-4 py-3 rounded-[22px] cursor-pointer transition-colors ${
                entryMode === "combo"
                  ? "bg-black text-white shadow-sm"
                  : "bg-white/85 text-neutral-800 border border-black/10 hover:bg-white"
              }`}
            >
              <input
                id={`${baseId}-mode-combo`}
                type="radio"
                name="product-entry-mode"
                value="combo"
                checked={entryMode === "combo"}
                onChange={() => handleModeChange("combo")}
                className="sr-only"
              />
              <Boxes
                className={`w-4 h-4 shrink-0 ${
                  entryMode === "combo" ? "text-[#D4F732]" : "text-neutral-600"
                }`}
              />
              <div className="min-w-0">
                <p className="text-xs font-semibold leading-tight">Combo Pack</p>
                <p
                  className={`text-[11px] leading-tight mt-0.5 ${
                    entryMode === "combo" ? "text-neutral-300" : "text-neutral-500"
                  }`}
                >
                  Bundle catalog products (auto size & cost)
                </p>
              </div>
            </label>
          </div>
        </fieldset>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* General Information */}
          <div className="bg-white/55 backdrop-blur-xl rounded-[28px] p-6 sm:p-8 border border-white/65 shadow-none space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-white/40">
              {entryMode === "combo" ? (
                <Boxes className="w-5 h-5 text-neutral-700" />
              ) : (
                <Layers className="w-5 h-5 text-neutral-700" />
              )}
              <h2 className="text-base font-normal text-neutral-900">
                {entryMode === "combo" ? "Combo Pack Details" : "Product Line Details"}
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="min-w-0">
                <label
                  htmlFor={`${baseId}-name`}
                  className="block text-xs font-normal text-neutral-700 mb-1.5"
                >
                  {entryMode === "combo" ? "Combo Pack Name *" : "Product Name *"}
                </label>
                <input
                  id={`${baseId}-name`}
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder={
                    entryMode === "combo"
                      ? "e.g. Complete Home Care Combo"
                      : "Enter product name"
                  }
                  required
                  className="w-full h-11 px-4 text-base sm:text-xs bg-white/85 rounded-full border border-black/10 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#D4F732]"
                />
              </div>

              <div className="min-w-0">
                <div className="flex items-center justify-between mb-1.5 gap-2">
                  <label
                    htmlFor={`${baseId}-category`}
                    className="block text-xs font-normal text-neutral-700"
                  >
                    Category
                  </label>
                  <Link
                    href="/categories"
                    className="text-[11px] font-medium text-neutral-600 hover:text-black underline shrink-0"
                  >
                    Manage categories
                  </Link>
                </div>

                {entryMode === "combo" ? (
                  <div className="w-full h-11 px-4 bg-white/85 rounded-full border border-black/10 flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-neutral-900 truncate">
                      {comboCategory?.name || COMBO_PACK_CATEGORY_NAME}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-black text-white text-[10px] font-medium shrink-0">
                      <Lock className="w-2.5 h-2.5 text-[#D4F732]" /> Permanent
                    </span>
                  </div>
                ) : (
                  <StyledSelect
                    id={`${baseId}-category`}
                    aria-label="Product Category"
                    value={form.category_id}
                    onChange={(e) => handleCategoryDropdownChange(e.target.value)}
                    disabled={loadingInitial}
                    className="w-full h-11 pl-4 text-base sm:text-xs bg-white/85 rounded-full border border-black/10 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#D4F732]"
                  >
                    {categories.length === 0 ? (
                      <option value="">
                        {loadingInitial ? "Loading categories..." : "Uncategorised"}
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
                )}
              </div>

              <div className="min-w-0">
                <label
                  htmlFor={`${baseId}-sku`}
                  className="block text-xs font-normal text-neutral-700 mb-1.5"
                >
                  Base SKU Code *
                </label>
                <input
                  id={`${baseId}-sku`}
                  type="text"
                  value={form.sku}
                  onChange={(e) => {
                    const val = e.target.value.toUpperCase();
                    setBaseSkuManual(val.trim().length > 0);
                    setForm({ ...form, sku: val });
                  }}
                  placeholder={entryMode === "combo" ? "e.g. TQR-CMB" : "e.g. TQR-DW"}
                  required
                  className="w-full h-11 px-4 text-base sm:text-xs font-mono bg-white/85 rounded-full border border-black/10 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#D4F732]"
                />
              </div>

              <div className="min-w-0">
                <label
                  htmlFor={`${baseId}-hsn`}
                  className="block text-xs font-normal text-neutral-700 mb-1.5"
                >
                  HSN / SAC Code
                </label>
                <input
                  id={`${baseId}-hsn`}
                  type="text"
                  value={form.hsn}
                  onChange={(e) => setForm({ ...form, hsn: e.target.value })}
                  placeholder="Optional HSN / SAC"
                  className="w-full h-11 px-4 text-base sm:text-xs font-mono bg-white/85 rounded-full border border-black/10 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#D4F732]"
                />
              </div>

              <div className="sm:col-span-2 min-w-0">
                <label
                  htmlFor={`${baseId}-desc`}
                  className="block text-xs font-normal text-neutral-700 mb-1.5"
                >
                  {entryMode === "combo" ? "Combo Notes (Optional)" : "Product Description"}
                </label>
                <textarea
                  id={`${baseId}-desc`}
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  rows={2}
                  placeholder={
                    entryMode === "combo"
                      ? "Included product list is automatically saved; add extra offer or packaging notes here..."
                      : "Application areas, formulation notes, packaging..."
                  }
                  className="w-full p-3.5 text-base sm:text-xs bg-white/85 rounded-2xl border border-black/10 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#D4F732]"
                />
              </div>
            </div>
          </div>

          {entryMode === "combo" ? (
            <>
              {/* Combo Product Picker */}
              <div className="bg-white/55 backdrop-blur-xl rounded-[28px] p-6 sm:p-8 border border-white/65 shadow-none space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-white/40">
                  <div className="min-w-0">
                    <h2 className="text-base font-normal text-neutral-900">
                      Products Included in Combo
                    </h2>
                    <p className="text-xs text-neutral-500 font-light">
                      Choose how many items are in this combo, then pick them from your catalog
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                    {QUICK_COMBO_COUNTS.map((count) => (
                      <button
                        key={count}
                        type="button"
                        onClick={() => handleComboCountChange(count)}
                        aria-pressed={comboCount === count}
                        className={`min-w-[36px] h-9 px-3 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                          comboCount === count
                            ? "bg-black text-white"
                            : "bg-white/85 text-neutral-800 border border-black/10 hover:bg-white"
                        }`}
                      >
                        {count}
                      </button>
                    ))}
                    <div className="w-24">
                      <StyledSelect
                        aria-label="Number of products in combo"
                        value={String(comboCount)}
                        onChange={(e) => handleComboCountChange(Number(e.target.value))}
                        className="w-full h-9 pl-3 text-xs bg-white/85 rounded-full border border-black/10 text-neutral-900"
                      >
                        {Array.from(
                          { length: MAX_COMBO_ITEMS - MIN_COMBO_ITEMS + 1 },
                          (_, i) => MIN_COMBO_ITEMS + i
                        ).map((n) => (
                          <option key={n} value={n}>
                            {n} items
                          </option>
                        ))}
                      </StyledSelect>
                    </div>
                  </div>
                </div>

                {!loadingInitial && catalogVariants.length === 0 ? (
                  <div className="p-5 rounded-2xl bg-white/80 border border-black/10 text-center space-y-2.5">
                    <p className="text-xs text-neutral-700 font-medium">
                      No single products found in your catalog yet.
                    </p>
                    <p className="text-[11px] text-neutral-500">
                      Add individual products first, then return here to bundle them into a Combo Pack.
                    </p>
                    <button
                      type="button"
                      onClick={() => handleModeChange("single")}
                      className="inline-flex items-center gap-1.5 px-4 h-9 rounded-full bg-black text-white text-xs font-medium cursor-pointer hover:bg-neutral-800"
                    >
                      <Package className="w-3.5 h-3.5 text-[#D4F732]" />
                      Switch to Single Product
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {comboSlots.map((slot, idx) => {
                      const selected = slot.variantId
                        ? variantLookup.get(slot.variantId)
                        : undefined;
                      const slotSelectId = `${baseId}-combo-slot-${idx}`;
                      const slotQtyId = `${baseId}-combo-qty-${idx}`;

                      return (
                        <div
                          key={idx}
                          className="p-4 rounded-2xl bg-white/75 border border-black/10 space-y-2"
                        >
                          <div className="grid grid-cols-1 sm:grid-cols-[1fr_100px] gap-3 items-end">
                            <div className="min-w-0">
                              <label
                                htmlFor={slotSelectId}
                                className="block text-[11px] font-medium text-neutral-700 mb-1"
                              >
                                Product {idx + 1} *
                              </label>
                              <StyledSelect
                                id={slotSelectId}
                                aria-label={`Product ${idx + 1}`}
                                value={slot.variantId}
                                onChange={(e) =>
                                  updateComboSlot(idx, { variantId: e.target.value })
                                }
                                required
                                className="w-full h-10 pl-3.5 text-base sm:text-xs bg-white rounded-xl border border-black/10 text-neutral-900"
                              >
                                <option value="">Select product & pack size...</option>
                                {catalogVariants.map((opt) => (
                                  <option key={opt.id} value={opt.id}>
                                    {opt.productName} — {opt.packSize} ({opt.sku} · Cost ₹
                                    {opt.costPrice.toFixed(2)} · Stock {opt.currentStock})
                                  </option>
                                ))}
                              </StyledSelect>
                            </div>

                            <div className="min-w-0">
                              <label
                                htmlFor={slotQtyId}
                                className="block text-[11px] font-medium text-neutral-700 mb-1"
                              >
                                Qty
                              </label>
                              <input
                                id={slotQtyId}
                                type="number"
                                min={1}
                                step={1}
                                required
                                value={slot.quantity}
                                onChange={(e) =>
                                  updateComboSlot(idx, {
                                    quantity: Math.max(1, Math.floor(Number(e.target.value) || 1)),
                                  })
                                }
                                className="w-full h-10 px-3 text-base sm:text-xs bg-white rounded-xl border border-black/10 text-neutral-900"
                              />
                            </div>
                          </div>

                          {selected && (
                            <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-neutral-600">
                              <span className="px-2 py-0.5 rounded-full bg-black/[0.05] text-neutral-800 font-medium">
                                Pack: {selected.packSize}
                              </span>
                              <span className="px-2 py-0.5 rounded-full bg-black/[0.05] text-neutral-800 font-medium">
                                Line Cost: ₹{(selected.costPrice * slot.quantity).toFixed(2)}
                              </span>
                              <span>
                                Available Stock: {selected.currentStock} units
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Auto-Calculated Size & Cost + Manual Selling Price */}
              <div className="bg-white/55 backdrop-blur-xl rounded-[28px] p-6 sm:p-8 border border-white/65 shadow-none space-y-5">
                <div className="flex items-center gap-2 pb-3 border-b border-white/40">
                  <Calculator className="w-5 h-5 text-neutral-700" />
                  <div className="min-w-0">
                    <h2 className="text-base font-normal text-neutral-900">
                      Auto-Calculated Pack Size & Pricing
                    </h2>
                    <p className="text-xs text-neutral-500 font-light">
                      Pack size and cost price are calculated automatically; enter only your selling price
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-2xl bg-white/80 border border-black/10 min-w-0">
                    <p className="text-[11px] font-medium text-neutral-600 mb-1">
                      Calculated Pack Size (Auto)
                    </p>
                    <p
                      data-testid="combo-pack-size-preview"
                      className="text-base font-semibold text-neutral-900"
                    >
                      {comboSummary.packSizeLabel || "Select products above"}
                    </p>
                    {comboSummary.componentsSummary && (
                      <p className="text-[11px] text-neutral-500 mt-1 break-words">
                        {comboSummary.componentsSummary}
                      </p>
                    )}
                  </div>

                  <div className="p-4 rounded-2xl bg-white/80 border border-black/10 min-w-0">
                    <p className="text-[11px] font-medium text-neutral-600 mb-1">
                      Calculated Cost Price (Auto)
                    </p>
                    <p
                      data-testid="combo-cost-price-preview"
                      className="text-base font-semibold text-neutral-900 tabular-nums"
                    >
                      ₹{comboSummary.totalCostPrice.toFixed(2)}
                    </p>
                    <p className="text-[11px] text-neutral-500 mt-1">
                      Sum of selected product cost prices × quantities
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-white/80 border border-black/10 min-w-0">
                    <p className="text-[11px] font-medium text-neutral-600 mb-1">
                      Possible Combo Packs (Auto)
                    </p>
                    <p
                      data-testid="combo-max-buildable-preview"
                      className="text-base font-semibold text-neutral-900 tabular-nums"
                    >
                      {comboSummary.maxBuildableCombos !== null
                        ? `${comboSummary.maxBuildableCombos} units`
                        : "Select products above"}
                    </p>
                    <p className="text-[11px] text-neutral-500 mt-1">
                      Derived from included items; billing deducts components from inventory
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
                  <div className="min-w-0">
                    <label
                      htmlFor={`${baseId}-combo-selling`}
                      className="block text-xs font-normal text-neutral-700 mb-1.5"
                    >
                      Combo Selling Price (₹) *
                    </label>
                    <input
                      id={`${baseId}-combo-selling`}
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={comboSellingPrice}
                      onChange={(e) =>
                        setComboSellingPrice(
                          e.target.value === "" ? "" : Number(e.target.value)
                        )
                      }
                      placeholder="Enter selling price"
                      className="w-full h-11 px-4 text-base sm:text-xs bg-white/85 rounded-full border border-black/10 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#D4F732]"
                    />
                    {comboMargin && (
                      <p
                        className={`text-[11px] mt-1.5 font-medium ${
                          comboMargin.profit >= 0 ? "text-emerald-700" : "text-rose-600"
                        }`}
                      >
                        Margin: {comboMargin.pct >= 0 ? `+${comboMargin.pct}` : comboMargin.pct}% (₹
                        {comboMargin.profit.toFixed(2)})
                      </p>
                    )}
                  </div>

                  <div className="min-w-0">
                    <label
                      htmlFor={`${baseId}-combo-tax`}
                      className="block text-xs font-normal text-neutral-700 mb-1.5"
                    >
                      GST Tax Rate
                    </label>
                    <StyledSelect
                      id={`${baseId}-combo-tax`}
                      aria-label="Combo Tax Rate"
                      value={String(comboTaxRate)}
                      onChange={(e) => setComboTaxRate(Number(e.target.value))}
                      className="w-full h-11 pl-4 text-base sm:text-xs bg-white/85 rounded-full border border-black/10 text-neutral-900"
                    >
                      <option value="0">0% GST</option>
                      <option value="5">5% GST</option>
                      <option value="12">12% GST</option>
                      <option value="18">18% GST</option>
                      <option value="28">28% GST</option>
                    </StyledSelect>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* Single Product Variants */
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
                  className="flex items-center gap-1.5 px-4 h-10 rounded-full bg-white/85 text-neutral-800 text-xs font-normal border border-black/10 hover:bg-white transition-all cursor-pointer shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Pack Size</span>
                </button>
              </div>

              <div className="space-y-3">
                {variants.map((v, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-white/75 border border-black/10 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 items-end"
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
                          const prevPack = copy[idx].pack_size;
                          const nextPack = e.target.value;
                          copy[idx].pack_size = nextPack;
                          if (!copy[idx].name || copy[idx].name === prevPack) {
                            copy[idx].name = nextPack;
                          }
                          setVariants(copy);
                        }}
                        placeholder="e.g. 250 ml"
                        className="w-full h-10 px-3 text-base sm:text-xs bg-white rounded-xl border border-black/10"
                      />
                    </div>

                    <div className="min-w-0">
                      <label className="block text-[11px] font-normal text-neutral-700 mb-1">
                        Variant SKU
                      </label>
                      <input
                        type="text"
                        value={v.sku}
                        onChange={(e) => {
                          const copy = [...variants];
                          const val = e.target.value.toUpperCase();
                          copy[idx].skuManual = val.trim().length > 0;
                          copy[idx].sku = val;
                          setVariants(copy);
                        }}
                        placeholder="e.g. TQR-DW-250M"
                        className="w-full h-10 px-3 text-base sm:text-xs font-mono bg-white rounded-xl border border-black/10"
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
                        className="w-full h-10 px-3 text-base sm:text-xs bg-white rounded-xl border border-black/10"
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
                        className="w-full h-10 px-3 text-base sm:text-xs bg-white rounded-xl border border-black/10"
                      />
                    </div>

                    <div className="min-w-0">
                      <label className="block text-[11px] font-normal text-neutral-700 mb-1">
                        Opening Stock
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={v.opening_stock}
                        onChange={(e) => {
                          const copy = [...variants];
                          copy[idx].opening_stock =
                            e.target.value === "" ? "" : Number(e.target.value);
                          setVariants(copy);
                        }}
                        placeholder="0"
                        className="w-full h-10 px-3 text-base sm:text-xs bg-white rounded-xl border border-black/10"
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
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="px-8 h-11 rounded-full bg-black text-white text-xs sm:text-sm font-normal flex items-center justify-center gap-2 hover:bg-neutral-800 active:scale-95 transition-all shadow-sm disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-4 h-4 text-[#D4F732]" />
              <span>
                {submitting
                  ? "Saving..."
                  : entryMode === "combo"
                  ? "Save Combo Pack"
                  : "Save Product & Variants"}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
