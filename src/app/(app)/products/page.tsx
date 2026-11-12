"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Search,
  Plus,
  Package,
  Tag,
  Trash2,
  Pencil,
} from "lucide-react";
import { toast } from "sonner";
import { TopHeader } from "@/components/layout/TopHeader";
import { formatINR } from "@/lib/formatting/currency";
import { StyledSelect } from "@/components/ui/StyledSelect";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import {
  EditProductModal,
  EditVariantModal,
  VariantModalState,
} from "@/components/ui/ProductEditModals";
import {
  getProducts,
  deleteProduct,
  deleteProductVariant,
  updateProduct,
  updateProductVariant,
  addProductVariant,
  Product,
  ProductVariant,
} from "@/lib/services/products";
import { createClient } from "@/lib/supabase/client";

const BUSINESS_ID = "00000000-0000-0000-0000-000000000001";

interface CategoryOption {
  id: string;
  name: string;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [loading, setLoading] = useState(true);

  const [archiveProductTarget, setArchiveProductTarget] = useState<Product | null>(null);
  const [deleteVariantTarget, setDeleteVariantTarget] = useState<{ productName: string; variant: ProductVariant } | null>(null);
  const [removing, setRemoving] = useState(false);
  const [removeError, setRemoveError] = useState<string | null>(null);

  const [editProductTarget, setEditProductTarget] = useState<Product | null>(null);
  const [variantModalState, setVariantModalState] = useState<VariantModalState | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const [prods, { data: catData }] = await Promise.all([
        getProducts({ search, categoryId: selectedCategory }),
        supabase
          .from("categories")
          .select("id, name")
          .eq("business_id", BUSINESS_ID)
          .order("sort_order", { ascending: true })
          .order("name", { ascending: true }),
      ]);
      setProducts(prods);
      if (catData) setCategories(catData);
    } finally {
      setLoading(false);
    }
  }, [search, selectedCategory]);

  useEffect(() => {
    load();
  }, [load]);

  const handleConfirmArchiveProduct = async () => {
    if (!archiveProductTarget) return;
    setRemoving(true);
    setRemoveError(null);
    const res = await deleteProduct(archiveProductTarget.id);
    if (!res.success) {
      setRemoveError(res.error || "Failed to delete product");
      setRemoving(false);
      return;
    }
    toast.success(
      res.mode === "deleted"
        ? `Product "${archiveProductTarget.name}" permanently deleted`
        : `Product "${archiveProductTarget.name}" archived`
    );
    setArchiveProductTarget(null);
    setRemoving(false);
    await load();
  };

  const handleConfirmDeleteVariant = async () => {
    if (!deleteVariantTarget) return;
    setRemoving(true);
    setRemoveError(null);
    const res = await deleteProductVariant(deleteVariantTarget.variant.id);
    if (!res.success) {
      setRemoveError(res.error || "Failed to remove pack size");
      setRemoving(false);
      return;
    }
    toast.success(`Pack size "${deleteVariantTarget.variant.pack_size || deleteVariantTarget.variant.name}" removed`);
    setDeleteVariantTarget(null);
    setRemoving(false);
    await load();
  };

  const handleSaveProductEdit = async (values: {
    name: string;
    sku: string;
    hsn: string;
    category_id: string;
    description: string;
  }) => {
    if (!editProductTarget) return;
    setSavingEdit(true);
    setEditError(null);
    const res = await updateProduct(editProductTarget.id, values);
    if (!res.success) {
      setEditError(res.error || "Failed to update product");
      setSavingEdit(false);
      return;
    }
    toast.success(`Product "${values.name.trim()}" updated`);
    setEditProductTarget(null);
    setSavingEdit(false);
    await load();
  };

  const handleSaveVariantModal = async (values: {
    pack_size: string;
    name: string;
    sku: string;
    cost_price: number;
    selling_price: number;
    tax_rate: number;
    stock_quantity: number;
  }) => {
    if (!variantModalState) return;
    setSavingEdit(true);
    setEditError(null);

    const res =
      variantModalState.mode === "edit" && variantModalState.variant
        ? await updateProductVariant(variantModalState.variant.id, {
            ...values,
            stock_quantity: variantModalState.variant.is_combo
              ? variantModalState.variant.current_stock
              : values.stock_quantity,
            current_stock: variantModalState.variant.current_stock,
          })
        : await addProductVariant(variantModalState.product.id, {
            ...values,
            opening_stock: values.stock_quantity,
          });

    if (!res.success) {
      setEditError(res.error || "Failed to save pack size");
      setSavingEdit(false);
      return;
    }

    toast.success(
      variantModalState.mode === "edit"
        ? `Pack size "${values.pack_size}" updated`
        : `Pack size "${values.pack_size}" added to ${variantModalState.product.name}`
    );
    setVariantModalState(null);
    setSavingEdit(false);
    await load();
  };

  const totalVariantsCount = products.reduce((acc, p) => acc + p.variants.length, 0);

  return (
    <div className="min-h-screen pb-12">
      <TopHeader title="Products & Packs" />

      <div className="space-y-6 pt-2">
        {/* Top Summary Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="bg-white/55 backdrop-blur-xl border border-white/65 rounded-[24px] p-6 shadow-sm">
            <span className="text-xs font-light text-neutral-500 block">
              Product lines
            </span>
            <div className="text-3xl font-normal text-neutral-900 mt-1 tracking-tight">
              {products.length}
            </div>
            <p className="text-[11px] font-light text-neutral-500 mt-0.5">Active products in catalog</p>
          </div>

          <div className="bg-white/55 backdrop-blur-xl border border-white/65 rounded-[24px] p-6 shadow-sm">
            <span className="text-xs font-light text-neutral-500 block">
              Active pack sizes (SKUs)
            </span>
            <div className="text-3xl font-normal text-emerald-800 mt-1 tracking-tight">
              {totalVariantsCount}
            </div>
            <p className="text-[11px] font-light text-neutral-500 mt-0.5">Registered packaging variants</p>
          </div>

          <div className="bg-white/55 backdrop-blur-xl border border-white/65 rounded-[24px] p-6 shadow-sm flex items-center justify-between gap-2">
            <div className="min-w-0">
              <span className="text-xs font-light text-neutral-500 block">
                Category management
              </span>
              <p className="text-sm text-neutral-900 font-normal mt-0.5 leading-snug">Configure catalog categories</p>
            </div>
            <Link
              href="/categories"
              className="px-4 min-h-[44px] flex items-center justify-center rounded-full bg-white/70 text-neutral-800 text-xs font-light border border-white/80 hover:bg-black hover:text-white transition-all shadow-sm cursor-pointer shrink-0"
            >
              Categories
            </Link>
          </div>
        </div>

        {/* Filter and Action Bar */}
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="flex flex-col sm:flex-row flex-1 items-stretch sm:items-center gap-2.5 max-w-2xl min-w-0">
            <div className="relative flex-1 min-w-0 sm:min-w-[200px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 z-10 pointer-events-none" />
              <input
                type="search"
                aria-label="Search products, SKUs, or pack sizes"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products, SKUs, pack sizes..."
                className="w-full h-10 pl-10 pr-4 text-xs bg-white/65 backdrop-blur-md rounded-full border border-white/70 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#E0FE52] shadow-sm transition-all"
              />
            </div>

            <StyledSelect
              aria-label="Filter products by category"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              wrapperClassName="w-full sm:w-48 shrink-0"
              className="h-10 py-0 pl-3.5 text-xs bg-white/65 backdrop-blur-md rounded-full border border-white/70 text-neutral-700 font-light focus:outline-none focus:ring-2 focus:ring-[#E0FE52] shadow-sm"
            >
              <option value="all">All categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </StyledSelect>
          </div>

          <Link
            href="/products/new"
            className="flex items-center justify-center gap-2 h-10 px-5 rounded-full bg-black text-white text-xs sm:text-sm font-normal shadow-md hover:scale-105 active:scale-95 transition-all shrink-0"
          >
            <Plus className="w-4 h-4 text-[#E0FE52]" />
            <span>Add Product</span>
          </Link>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="bg-white/55 backdrop-blur-xl rounded-[28px] p-10 text-center border border-white/65 text-xs text-neutral-500">
            Loading catalog...
          </div>
        ) : products.length === 0 ? (
          <div className="bg-white/55 backdrop-blur-xl rounded-[28px] p-10 text-center border border-white/65 space-y-3">
            <Package className="w-9 h-9 text-neutral-300 mx-auto" />
            <h3 className="text-sm font-medium text-neutral-900">No products in catalog</h3>
            <p className="text-xs font-light text-neutral-500 max-w-sm mx-auto">
              Add your first product line and pack size variants to start creating orders, batches, and invoices.
            </p>
            <Link
              href="/products/new"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-black text-white text-xs font-normal"
            >
              <Plus className="w-3.5 h-3.5 text-[#E0FE52]" />
              <span>Add First Product</span>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {products.map((product) => (
              <div
                key={product.id}
                className="bg-white/55 backdrop-blur-xl rounded-[28px] p-6 border border-white/65 shadow-sm space-y-4"
              >
                {/* Product Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/50">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/70 text-neutral-700 font-normal border border-white/80">
                        {product.sku}
                      </span>
                      <span className="text-[11px] font-light text-neutral-700 bg-white/70 px-2.5 py-0.5 rounded-full border border-white/80">
                        {product.category_name}
                      </span>
                      {product.hsn && (
                        <span className="text-[10px] font-mono text-neutral-500">
                          HSN: {product.hsn}
                        </span>
                      )}
                      {(() => {
                        const totalStock = product.variants.reduce(
                          (sum, v) => sum + (v.current_stock || 0),
                          0
                        );
                        return (
                          <span
                            className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full border ${
                              totalStock <= 0
                                ? "bg-rose-50 text-rose-700 border-rose-200/70"
                                : "bg-emerald-50 text-emerald-700 border-emerald-200/70"
                            }`}
                          >
                            Total Stock: {totalStock} Units
                          </span>
                        );
                      })()}
                    </div>
                    <h3 className="text-base font-normal text-neutral-900 mt-1 break-words">
                      {product.name}
                    </h3>
                    {product.description && (
                      <p className="text-xs font-light text-neutral-500 mt-0.5 break-words">
                        {product.description}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0 self-start sm:self-center">
                    {!product.is_combo && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditError(null);
                          setVariantModalState({ mode: "add", product });
                        }}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white/80 hover:bg-black text-neutral-800 hover:text-white border border-white/90 text-xs font-medium transition-colors shrink-0 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Pack</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setEditError(null);
                        setEditProductTarget(product);
                      }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white/80 hover:bg-black text-neutral-800 hover:text-white border border-white/90 text-xs font-medium transition-colors shrink-0 cursor-pointer"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setRemoveError(null);
                        setArchiveProductTarget(product);
                      }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white border border-rose-200/70 text-xs font-medium transition-colors shrink-0 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Product</span>
                    </button>
                  </div>
                </div>

                {/* Variants & Pack Sizes — Mobile Cards */}
                <div className="md:hidden space-y-2.5">
                  {product.variants.length === 0 ? (
                    <div className="py-4 px-4 text-center text-xs text-neutral-500 bg-white/40 rounded-2xl">
                      No pack size variants left on this product.
                    </div>
                  ) : (
                    product.variants.map((v) => {
                      const marginAmount = v.selling_price - v.cost_price;
                      const marginPct =
                        v.selling_price > 0
                          ? Math.round((marginAmount / v.selling_price) * 100)
                          : 0;

                      return (
                        <div
                          key={v.id}
                          className="rounded-2xl bg-white/55 border border-white/80 p-3.5 space-y-3"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 text-sm font-medium text-neutral-900">
                                <Tag className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                                <span className="truncate">{v.pack_size || v.name}</span>
                                {v.name && v.pack_size && v.name !== v.pack_size && (
                                  <span className="text-[11px] text-neutral-500 font-light truncate">
                                    ({v.name})
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] font-mono text-neutral-500 mt-0.5 break-all">
                                {v.sku}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setEditError(null);
                                setVariantModalState({
                                  mode: "edit",
                                  product,
                                  variant: v,
                                });
                              }}
                              title="Click to edit stock quantity & pricing"
                              className={`font-medium px-2.5 py-0.5 rounded-full text-[11px] shrink-0 transition-opacity hover:opacity-80 cursor-pointer ${
                                v.current_stock <= 0
                                  ? "bg-rose-100 text-rose-800"
                                  : "bg-white/85 text-neutral-800 border border-white/90"
                              }`}
                            >
                              {v.current_stock} Units
                            </button>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="bg-white/50 rounded-xl px-2.5 py-1.5">
                              <span className="text-[10px] text-neutral-500 block">Cost / Sell</span>
                              <span className="font-medium text-neutral-900">
                                {formatINR(v.cost_price)} → {formatINR(v.selling_price)}
                              </span>
                            </div>
                            <div className="bg-white/50 rounded-xl px-2.5 py-1.5">
                              <span className="text-[10px] text-neutral-500 block">
                                Margin / GST ({v.tax_rate}%)
                              </span>
                              <span className="font-medium text-neutral-900">
                                {marginPct >= 0 ? `+${marginPct}%` : `${marginPct}%`} (
                                {formatINR(marginAmount)})
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-end gap-2 pt-1 border-t border-black/5">
                            <button
                              type="button"
                              onClick={() => {
                                setEditError(null);
                                setVariantModalState({
                                  mode: "edit",
                                  product,
                                  variant: v,
                                });
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-neutral-700 bg-white/85 hover:bg-black hover:text-white border border-black/10 transition-colors cursor-pointer"
                            >
                              <Pencil className="w-3 h-3" />
                              <span>Edit</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setRemoveError(null);
                                setDeleteVariantTarget({
                                  productName: product.name,
                                  variant: v,
                                });
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-rose-600 bg-rose-50 hover:bg-rose-600 hover:text-white transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Remove</span>
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Variants & Pack Sizes Table — Desktop */}
                <div className="hidden md:block table-wrapper">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-white/40 text-neutral-500 font-normal rounded-xl border-b border-white/50">
                      <tr>
                        <th className="py-2.5 px-4 rounded-l-xl">Pack Size</th>
                        <th className="py-2.5 px-4">Variant SKU</th>
                        <th className="py-2.5 px-4 text-right">Cost Price</th>
                        <th className="py-2.5 px-4 text-right">Selling Price</th>
                        <th className="py-2.5 px-4 text-right">Gross Margin</th>
                        <th className="py-2.5 px-4 text-right">Stock On Hand</th>
                        <th className="py-2.5 px-4 text-center">Tax Rate</th>
                        <th className="py-2.5 px-4 rounded-r-xl text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/40">
                      {product.variants.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-4 px-4 text-center text-xs text-neutral-500">
                            No pack size variants left on this product.
                          </td>
                        </tr>
                      ) : (
                        product.variants.map((v) => {
                          const marginAmount = v.selling_price - v.cost_price;
                          const marginPct =
                            v.selling_price > 0
                              ? Math.round((marginAmount / v.selling_price) * 100)
                              : 0;

                          return (
                            <tr key={v.id} className="hover:bg-white/40 transition-colors">
                              <td className="py-3 px-4 font-normal text-neutral-900">
                                <div className="flex items-center gap-2">
                                  <Tag className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                                  <span>{v.pack_size || v.name}</span>
                                  {v.name && v.pack_size && v.name !== v.pack_size && (
                                    <span className="text-[11px] text-neutral-500 font-light">
                                      ({v.name})
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="py-3 px-4 font-mono text-neutral-500 text-[11px]">
                                {v.sku}
                              </td>
                              <td className="py-3 px-4 text-right text-neutral-600 font-light">
                                {formatINR(v.cost_price)}
                              </td>
                              <td className="py-3 px-4 text-right font-medium text-neutral-900">
                                {formatINR(v.selling_price)}
                              </td>
                              <td className="py-3 px-4 text-right">
                                <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-normal bg-white/70 text-neutral-800 border border-white/80">
                                  {marginPct >= 0 ? `+${marginPct}%` : `${marginPct}%`} ({formatINR(marginAmount)})
                                </span>
                              </td>
                              <td className="py-3 px-4 text-right">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditError(null);
                                    setVariantModalState({
                                      mode: "edit",
                                      product,
                                      variant: v,
                                    });
                                  }}
                                  title={
                                    v.is_combo
                                      ? "Auto-calculated from combo items; click to edit pricing"
                                      : "Click to edit stock quantity & pricing"
                                  }
                                  className={`font-medium px-2.5 py-0.5 rounded-full text-xs transition-opacity hover:opacity-80 cursor-pointer ${
                                    v.current_stock <= 0
                                      ? "bg-rose-100 text-rose-800"
                                      : "bg-white/80 text-neutral-800 border border-white/90"
                                  }`}
                                >
                                  {v.current_stock} Units
                                </button>
                                {v.is_combo && (
                                  <span className="block text-[10px] text-neutral-500 mt-0.5">
                                    Auto from items
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-4 text-center">
                                <span className="text-[11px] font-light text-neutral-600">
                                  {v.tax_rate}% GST
                                </span>
                              </td>
                              <td className="py-3 px-4 text-right">
                                <div className="inline-flex items-center justify-end gap-1.5 whitespace-nowrap">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditError(null);
                                      setVariantModalState({
                                        mode: "edit",
                                        product,
                                        variant: v,
                                      });
                                    }}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium text-neutral-700 bg-white/75 hover:bg-black hover:text-white border border-white/90 transition-colors cursor-pointer"
                                    title="Edit pack size"
                                  >
                                    <Pencil className="w-3 h-3" />
                                    <span>Edit</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setRemoveError(null);
                                      setDeleteVariantTarget({
                                        productName: product.name,
                                        variant: v,
                                      });
                                    }}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                    title="Remove pack size"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                    <span>Remove</span>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <EditProductModal
        product={editProductTarget}
        categories={categories}
        saving={savingEdit}
        error={editError}
        onSave={handleSaveProductEdit}
        onClose={() => {
          setEditProductTarget(null);
          setEditError(null);
        }}
      />

      <EditVariantModal
        state={variantModalState}
        saving={savingEdit}
        error={editError}
        onSave={handleSaveVariantModal}
        onClose={() => {
          setVariantModalState(null);
          setEditError(null);
        }}
      />

      <ConfirmDialog
        open={Boolean(archiveProductTarget)}
        title={`Delete product "${archiveProductTarget?.name ?? ""}"?`}
        description="Permanently deletes this product, its pack sizes, and uninvoiced stock batches from the database and UI. Products already used in orders or invoices are archived safely to preserve accounting history."
        confirmLabel="Delete Product"
        tone="danger"
        loading={removing}
        error={removeError}
        onConfirm={handleConfirmArchiveProduct}
        onClose={() => {
          setArchiveProductTarget(null);
          setRemoveError(null);
        }}
      />

      <ConfirmDialog
        open={Boolean(deleteVariantTarget)}
        title={`Remove pack size "${deleteVariantTarget?.variant.pack_size || deleteVariantTarget?.variant.name || ""}"?`}
        description={`Permanently deletes this variant and its uninvoiced stock batches from ${deleteVariantTarget?.productName ?? "product"}. Variants already used in orders or invoices cannot be deleted.`}
        confirmLabel="Remove Pack Size"
        tone="danger"
        loading={removing}
        error={removeError}
        onConfirm={handleConfirmDeleteVariant}
        onClose={() => {
          setDeleteVariantTarget(null);
          setRemoveError(null);
        }}
      />
    </div>
  );
}
