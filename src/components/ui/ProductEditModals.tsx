"use client";

import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import { Lock, Save, X } from "lucide-react";
import { StyledSelect } from "@/components/ui/StyledSelect";
import { Product, ProductVariant } from "@/lib/services/products";
import { buildVariantSkusForProduct } from "@/lib/identifiers/codes";

export interface CategoryChoice {
  id: string;
  name: string;
}

interface EditProductModalProps {
  product: Product | null;
  categories: CategoryChoice[];
  saving: boolean;
  error: string | null;
  onSave: (values: {
    name: string;
    sku: string;
    hsn: string;
    category_id: string;
    description: string;
  }) => Promise<void>;
  onClose: () => void;
}

/**
 * Native modal dialog for editing a product line's metadata.
 */
export function EditProductModal({
  product,
  categories,
  saving,
  error,
  onSave,
  onClose,
}: EditProductModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [hsn, setHsn] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (product) {
      setName(product.name || "");
      setSku(product.sku || "");
      setHsn(product.hsn || "");
      setCategoryId(product.category_id || "");
      setDescription(product.description || "");
      if (!dialog.open) {
        dialog.returnValue = "";
        dialog.showModal();
      }
    } else if (dialog.open) {
      dialog.returnValue = "";
      dialog.close();
    }
  }, [product]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !sku.trim()) return;
    await onSave({ name, sku, hsn, category_id: categoryId, description });
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault();
        if (!saving) onClose();
      }}
      onClose={() => {
        if (dialogRef.current) dialogRef.current.returnValue = "";
      }}
      onClick={(e) => {
        if (e.target === dialogRef.current && !saving) onClose();
      }}
      className="m-auto w-[calc(100vw-2rem)] max-w-lg max-h-[90dvh] overflow-y-auto overscroll-contain rounded-[28px] bg-white/95 backdrop-blur-2xl border border-black/10 p-6 sm:p-7 text-neutral-900 shadow-2xl outline-none"
    >
      <div className="flex items-start justify-between gap-4 pb-4 border-b border-neutral-200/70">
        <div className="min-w-0">
          <h2 id={titleId} className="text-lg font-semibold tracking-tight text-neutral-900">
            Edit Product Details
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Update name, category, base SKU, HSN code, or description.
          </p>
        </div>
        <button
          type="button"
          onClick={() => !saving && onClose()}
          disabled={saving}
          aria-label="Close edit product dialog"
          className="w-8 h-8 rounded-full hover:bg-neutral-100 flex items-center justify-center text-neutral-500 shrink-0 disabled:opacity-40 cursor-pointer"
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="mt-4 rounded-2xl bg-red-50 border border-red-200/80 px-3.5 py-2.5 text-xs font-medium text-red-700"
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        <div className="min-w-0">
          <label htmlFor="edit-prod-name" className="block text-xs font-medium text-neutral-700 mb-1.5">
            Product Name *
          </label>
          <input
            id="edit-prod-name"
            type="text"
            required
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full h-10 px-4 text-xs bg-neutral-50 rounded-full border border-neutral-200 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#E0FE52]"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="min-w-0">
            <label htmlFor="edit-prod-category" className="block text-xs font-medium text-neutral-700 mb-1.5">
              Category
            </label>
            <StyledSelect
              id="edit-prod-category"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full h-10 py-0 pl-3.5 text-xs bg-neutral-50 border-neutral-200 font-normal"
            >
              <option value="">Uncategorised</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </StyledSelect>
          </div>

          <div className="min-w-0">
            <label htmlFor="edit-prod-sku" className="block text-xs font-medium text-neutral-700 mb-1.5">
              Base SKU Code *
            </label>
            <input
              id="edit-prod-sku"
              type="text"
              required
              autoCorrect="off"
              autoCapitalize="none"
              spellCheck={false}
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              className="w-full h-10 px-4 text-xs font-mono bg-neutral-50 rounded-full border border-neutral-200 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#E0FE52]"
            />
          </div>
        </div>

        <div className="min-w-0">
          <label htmlFor="edit-prod-hsn" className="block text-xs font-medium text-neutral-700 mb-1.5">
            HSN / SAC Code
          </label>
          <input
            id="edit-prod-hsn"
            type="text"
            autoCorrect="off"
            spellCheck={false}
            placeholder="Optional HSN / SAC"
            value={hsn}
            onChange={(e) => setHsn(e.target.value)}
            className="w-full h-10 px-4 text-xs font-mono bg-neutral-50 rounded-full border border-neutral-200 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#E0FE52]"
          />
        </div>

        <div className="min-w-0">
          <label htmlFor="edit-prod-desc" className="block text-xs font-medium text-neutral-700 mb-1.5">
            Description
          </label>
          <textarea
            id="edit-prod-desc"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Application areas, formulation notes, packaging..."
            className="w-full px-4 py-2.5 text-xs bg-neutral-50 rounded-2xl border border-neutral-200 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#E0FE52]"
          />
        </div>

        <div className="pt-2 flex flex-col-reverse sm:flex-row justify-end gap-2.5">
          <button
            type="button"
            disabled={saving}
            onClick={onClose}
            className="px-5 py-2.5 rounded-full border border-neutral-200 bg-white text-xs font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-full bg-black text-white text-xs font-medium hover:bg-neutral-800 disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5 text-[#E0FE52]" aria-hidden="true" />
            <span>{saving ? "Saving..." : "Save Changes"}</span>
          </button>
        </div>
      </form>
    </dialog>
  );
}

export interface VariantModalState {
  mode: "edit" | "add";
  product: Product;
  variant?: ProductVariant;
}

interface EditVariantModalProps {
  state: VariantModalState | null;
  saving: boolean;
  error: string | null;
  onSave: (values: {
    pack_size: string;
    name: string;
    sku: string;
    cost_price: number;
    selling_price: number;
    tax_rate: number;
    stock_quantity: number;
  }) => Promise<void>;
  onClose: () => void;
}

/**
 * Native modal dialog for editing or adding a product pack-size variant.
 */
export function EditVariantModal({
  state,
  saving,
  error,
  onSave,
  onClose,
}: EditVariantModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (state) {
      if (!dialog.open) {
        dialog.returnValue = "";
        dialog.showModal();
      }
    } else if (dialog.open) {
      dialog.returnValue = "";
      dialog.close();
    }
  }, [state]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault();
        if (!saving) onClose();
      }}
      onClose={() => {
        if (dialogRef.current) dialogRef.current.returnValue = "";
      }}
      onClick={(e) => {
        if (e.target === dialogRef.current && !saving) onClose();
      }}
      className="m-auto w-[calc(100vw-2rem)] max-w-lg max-h-[90dvh] overflow-y-auto overscroll-contain rounded-[28px] bg-white/95 backdrop-blur-2xl border border-black/10 p-6 sm:p-7 text-neutral-900 shadow-2xl outline-none"
    >
      <div className="flex items-start justify-between gap-4 pb-4 border-b border-neutral-200/70">
        <div className="min-w-0">
          <h2 id={titleId} className="text-lg font-semibold tracking-tight text-neutral-900">
            {state?.mode === "edit" ? "Edit Pack Size & Pricing" : "Add Pack Size Variant"}
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5 truncate">
            {state?.product.name} ({state?.product.sku})
          </p>
        </div>
        <button
          type="button"
          onClick={() => !saving && onClose()}
          disabled={saving}
          aria-label="Close pack size dialog"
          className="w-8 h-8 rounded-full hover:bg-neutral-100 flex items-center justify-center text-neutral-500 shrink-0 disabled:opacity-40 cursor-pointer"
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="mt-4 rounded-2xl bg-red-50 border border-red-200/80 px-3.5 py-2.5 text-xs font-medium text-red-700"
        >
          {error}
        </div>
      )}

      {state && (
        <EditVariantForm
          key={`${state.mode}-${state.variant?.id ?? state.product.id}-${state.variant?.current_stock ?? 0}`}
          state={state}
          saving={saving}
          onSave={onSave}
          onClose={onClose}
        />
      )}
    </dialog>
  );
}

function EditVariantForm({
  state,
  saving,
  onSave,
  onClose,
}: {
  state: VariantModalState;
  saving: boolean;
  onSave: EditVariantModalProps["onSave"];
  onClose: () => void;
}) {
  const isEdit = state.mode === "edit" && Boolean(state.variant);
  const v = state.variant;
  const [packSize, setPackSize] = useState(
    isEdit && v ? v.pack_size || v.name || "" : ""
  );
  const [displayName, setDisplayName] = useState(
    isEdit && v && v.name && v.name !== v.pack_size ? v.name : ""
  );
  const existingProductSkus = useMemo(
    () =>
      new Set(
        (state.product.variants || [])
          .map((item) => item.sku?.trim().toUpperCase())
          .filter(Boolean)
      ),
    [state.product.variants]
  );

  const [sku, setSku] = useState(
    isEdit && v
      ? v.sku || ""
      : buildVariantSkusForProduct({
          productName: state.product.name,
          variants: [{ pack_size: "", name: "" }],
          existingCatalogSkus: existingProductSkus,
        })[0]
  );
  const [skuManuallyEdited, setSkuManuallyEdited] = useState(false);

  useEffect(() => {
    if (isEdit || skuManuallyEdited) return;
    const nextSuggested = buildVariantSkusForProduct({
      productName: state.product.name,
      variants: [{ pack_size: packSize || "STD", name: displayName }],
      existingCatalogSkus: existingProductSkus,
    })[0];
    setSku(nextSuggested);
  }, [isEdit, skuManuallyEdited, state.product.name, packSize, displayName, existingProductSkus]);
  const [costPrice, setCostPrice] = useState(
    isEdit && v ? String(v.cost_price ?? 0) : ""
  );
  const [sellingPrice, setSellingPrice] = useState(
    isEdit && v ? String(v.selling_price ?? 0) : ""
  );
  const [taxRate, setTaxRate] = useState(
    isEdit && v ? String(v.tax_rate ?? 18) : "18"
  );
  const [stockQuantity, setStockQuantity] = useState(
    isEdit && v ? String(v.current_stock ?? 0) : "0"
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!packSize.trim() || !sku.trim() || sellingPrice === "") return;
    await onSave({
      pack_size: packSize.trim(),
      name: (displayName.trim() || packSize).trim(),
      sku: sku.trim(),
      cost_price: Number(costPrice) || 0,
      selling_price: Number(sellingPrice) || 0,
      tax_rate: Number(taxRate) || 0,
      stock_quantity: Math.max(0, Number(stockQuantity) || 0),
    });
  };

  return (
      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="min-w-0">
            <label htmlFor="var-pack-size" className="block text-xs font-medium text-neutral-700 mb-1.5">
              Pack Size *
            </label>
            <input
              id="var-pack-size"
              type="text"
              required
              autoFocus
              placeholder="e.g. 250 ml, 1 L, 5 L"
              value={packSize}
              onChange={(e) => setPackSize(e.target.value)}
              className="w-full h-10 px-4 text-xs bg-neutral-50 rounded-full border border-neutral-200 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#E0FE52]"
            />
          </div>

          <div className="min-w-0">
            <label htmlFor="var-display-name" className="block text-xs font-medium text-neutral-700 mb-1.5">
              Variant Label (Optional)
            </label>
            <input
              id="var-display-name"
              type="text"
              placeholder="Defaults to pack size"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full h-10 px-4 text-xs bg-neutral-50 rounded-full border border-neutral-200 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#E0FE52]"
            />
          </div>
        </div>

        <div className="min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <label htmlFor="var-sku" className="block text-xs font-medium text-neutral-700">
              Variant SKU *
            </label>
            {isEdit && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-black text-white text-[10px] font-medium">
                <Lock className="w-2.5 h-2.5 text-[#D4F732]" aria-hidden="true" />
                Permanent
              </span>
            )}
          </div>
          <input
            id="var-sku"
            type="text"
            required
            readOnly={isEdit}
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck={false}
            placeholder="e.g. TQR-DW-250M"
            value={sku}
            onChange={(e) => {
              if (isEdit) return;
              setSkuManuallyEdited(true);
              setSku(e.target.value.toUpperCase());
            }}
            className={`w-full h-10 px-4 text-xs font-mono rounded-full border border-neutral-200 focus:outline-none ${
              isEdit
                ? "bg-neutral-100 text-neutral-600 cursor-not-allowed"
                : "bg-neutral-50 text-neutral-900 focus:ring-2 focus:ring-[#E0FE52]"
            }`}
          />
          {isEdit && (
            <p className="text-[11px] text-neutral-500 mt-1">
              Permanent identifier — locked to preserve batch and billing history.
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="min-w-0">
            <label htmlFor="var-cost" className="block text-xs font-medium text-neutral-700 mb-1.5">
              Cost Price (₹)
            </label>
            <input
              id="var-cost"
              type="number"
              min="0"
              step="0.01"
              value={costPrice}
              onChange={(e) => setCostPrice(e.target.value)}
              placeholder="0.00"
              className="w-full h-10 px-4 text-xs bg-neutral-50 rounded-full border border-neutral-200 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#E0FE52]"
            />
          </div>

          <div className="min-w-0">
            <label htmlFor="var-selling" className="block text-xs font-medium text-neutral-700 mb-1.5">
              Selling Price (₹) *
            </label>
            <input
              id="var-selling"
              type="number"
              required
              min="0"
              step="0.01"
              value={sellingPrice}
              onChange={(e) => setSellingPrice(e.target.value)}
              placeholder="0.00"
              className="w-full h-10 px-4 text-xs bg-neutral-50 rounded-full border border-neutral-200 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#E0FE52]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="min-w-0">
            <label htmlFor="var-tax" className="block text-xs font-medium text-neutral-700 mb-1.5">
              GST Tax Rate
            </label>
            <StyledSelect
              id="var-tax"
              value={taxRate}
              onChange={(e) => setTaxRate(e.target.value)}
              className="w-full h-10 py-0 pl-3.5 text-xs bg-neutral-50 border-neutral-200 font-normal"
            >
              <option value="0">0% GST</option>
              <option value="5">5% GST</option>
              <option value="12">12% GST</option>
              <option value="18">18% GST</option>
              <option value="28">28% GST</option>
            </StyledSelect>
          </div>

          {state?.variant?.is_combo ? (
            <div className="min-w-0">
              <span className="block text-xs font-medium text-neutral-700 mb-1.5">
                Possible Combo Packs (Auto)
              </span>
              <div className="w-full h-10 px-4 text-xs bg-neutral-100 rounded-full border border-neutral-200 text-neutral-700 flex items-center">
                {state.variant.current_stock} units (auto from components)
              </div>
            </div>
          ) : (
            <div className="min-w-0">
              <label htmlFor="var-stock" className="block text-xs font-medium text-neutral-700 mb-1.5">
                {state?.mode === "edit" ? "Stock On Hand (Units)" : "Opening Stock (Units)"}
              </label>
              <input
                id="var-stock"
                type="number"
                min="0"
                step="1"
                value={stockQuantity}
                onChange={(e) => setStockQuantity(e.target.value)}
                placeholder="0"
                className="w-full h-10 px-4 text-xs bg-neutral-50 rounded-full border border-neutral-200 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#E0FE52]"
              />
            </div>
          )}
        </div>

        {(() => {
          const qty = state?.variant?.is_combo
            ? state.variant.current_stock
            : Math.max(0, Number(stockQuantity) || 0);
          const statusLabel = qty <= 0 ? "Out of Stock" : "In Stock";
          const statusStyle =
            qty <= 0
              ? "bg-rose-50 text-rose-700 border-rose-200/70"
              : "bg-emerald-50 text-emerald-700 border-emerald-200/70";
          return (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-neutral-50 border border-neutral-200/80 px-3.5 py-2.5 text-[11px]">
              <span className="text-neutral-600">
                {state?.variant?.is_combo
                  ? "Combo stock updates dynamically from included item inventory"
                  : state?.mode === "edit" && state.variant
                  ? `Saved inventory: ${state.variant.current_stock} units`
                  : `Initial batch will record ${qty} unit(s) into inventory`}
              </span>
              <span className={`px-2.5 py-0.5 rounded-full font-medium border ${statusStyle}`}>
                {statusLabel} ({qty} units)
              </span>
            </div>
          );
        })()}

        <div className="pt-2 flex flex-col-reverse sm:flex-row justify-end gap-2.5">
          <button
            type="button"
            disabled={saving}
            onClick={onClose}
            className="px-5 py-2.5 rounded-full border border-neutral-200 bg-white text-xs font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-full bg-black text-white text-xs font-medium hover:bg-neutral-800 disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5 text-[#E0FE52]" aria-hidden="true" />
            <span>{saving ? "Saving..." : state?.mode === "edit" ? "Save Pack Size" : "Add Pack Size"}</span>
          </button>
        </div>
      </form>
  );
}

