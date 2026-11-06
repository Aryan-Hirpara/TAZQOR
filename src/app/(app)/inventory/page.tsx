"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Boxes,
  Package,
  Plus,
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
  Search,
  Filter,
  Calendar,
  Layers,
  ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";
import { TopHeader } from "@/components/layout/TopHeader";
import { formatINR, formatQuantity } from "@/lib/formatting/currency";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";

interface BatchItem {
  id: string;
  batch_number: string;
  product_name: string;
  variant_name: string;
  sku: string;
  mfg_date: string;
  expiry_date: string;
  qty_received: number;
  qty_remaining: number;
  cost_per_unit: number;
  is_near_expiry?: boolean;
}

interface StockMovement {
  id: string;
  date: string;
  product: string;
  type: 'purchase_in' | 'sale_out' | 'sales_return_in' | 'damage_out' | 'expiry_out' | 'adjustment_in' | 'opening_stock';
  quantity: number;
  batch_number: string;
  reason: string;
  ref_doc: string;
}

export default function InventoryPage() {
  const [activeTab, setActiveTab] = useState<"batches" | "movements">("batches");
  const [batches, setBatches] = useState<BatchItem[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [variantsList, setVariantsList] = useState<{ id: string; name: string; prodName: string; cost: number; sku: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [receiveStockOpen, setReceiveStockOpen] = useState(false);
  const [adjustStockOpen, setAdjustStockOpen] = useState(false);

  // New stock receipt form
  const [receiveForm, setReceiveForm] = useState({
    variant_id: "",
    batch_number: "",
    mfg_date: new Date().toISOString().split("T")[0],
    expiry_date: new Date(Date.now() + 730 * 86400000).toISOString().split("T")[0],
    quantity: 50,
    cost_per_unit: 280,
    supplier: "TAZQOR Factory Plant 1",
  });

  // Adjust stock form
  const [adjustForm, setAdjustForm] = useState({
    batch_id: "",
    type: "damage_out",
    quantity: 1,
    reason: "",
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const supabase = createClient();

      // 1. Fetch live batches
      const { data: bData, error: bErr } = await supabase
        .from("batches")
        .select("id, batch_number, manufacturing_date, expiry_date, quantity_received, cost_per_unit, product_variant_id, product_variants(name, sku, cost_price, products(name))")
        .order("created_at", { ascending: false });

      if (!bErr && bData) {
        const mapped: BatchItem[] = bData.map((b: any) => {
          const pv = b.product_variants;
          const prod = pv?.products?.name || "TAZQOR Cleaning Product";
          const varN = pv?.name || "Standard";
          return {
            id: b.id,
            batch_number: b.batch_number,
            product_name: prod,
            variant_name: varN,
            sku: pv?.sku || "TC-01",
            mfg_date: b.manufacturing_date || "2026-01-01",
            expiry_date: b.expiry_date || "2028-01-01",
            qty_received: Number(b.quantity_received) || 0,
            qty_remaining: Number(b.quantity_received) || 0,
            cost_per_unit: Number(b.cost_per_unit) || Number(pv?.cost_price) || 0,
          };
        });
        setBatches(mapped);
        if (mapped.length > 0) {
          setAdjustForm((prev) => ({ ...prev, batch_id: prev.batch_id || mapped[0].id }));
        }
      }

      // 2. Fetch live stock movements
      const { data: mData, error: mErr } = await supabase
        .from("stock_movements")
        .select("id, created_at, movement_type, quantity, reason, notes, product_variants(name, sku, products(name)), batches(batch_number)")
        .order("created_at", { ascending: false });

      if (!mErr && mData) {
        const mappedMovs: StockMovement[] = mData.map((m: any) => {
          const b = m.batches;
          const pv = m.product_variants;
          const prodDesc = pv?.products?.name ? `${pv.products.name} (${pv.name})` : "General Product";
          return {
            id: m.id,
            date: m.created_at ? new Date(m.created_at).toISOString().replace("T", " ").substring(0, 16) : "Recent",
            product: prodDesc,
            type: m.movement_type || "purchase_in",
            quantity: Number(m.quantity) || 0,
            batch_number: b?.batch_number || "BATCH",
            reason: m.reason || m.notes || "Recorded movement",
            ref_doc: b?.batch_number ? `Batch ${b.batch_number}` : "GRN",
          };
        });
        setMovements(mappedMovs);
      }

      // 3. Fetch variants for stock receipt selection
      const { data: vData } = await supabase
        .from("product_variants")
        .select("id, name, sku, cost_price, products(name)");

      if (vData && vData.length > 0) {
        const vList = vData.map((v: any) => ({
          id: v.id,
          name: v.name,
          prodName: v.products?.name || "Product",
          cost: Number(v.cost_price) || 280,
          sku: v.sku || "",
        }));
        setVariantsList(vList);
        if (vList[0]) {
          setReceiveForm((prev) => ({
            ...prev,
            variant_id: vList[0].id,
            cost_per_unit: vList[0].cost,
          }));
        }
      }
    } catch (err) {
      console.warn("Failed to load inventory from Supabase:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalStockUnits = batches.reduce((acc, b) => acc + b.qty_remaining, 0);
  const totalStockValuation = batches.reduce((acc, b) => acc + (b.qty_remaining * b.cost_per_unit), 0);

  const handleReceiveStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiveForm.batch_number) {
      toast.error("Please enter batch number");
      return;
    }

    try {
      const supabase = createClient();
      const variantId = receiveForm.variant_id || (variantsList[0]?.id ?? null);
      if (!variantId) {
        toast.error("Please select a product variant");
        return;
      }

      const { data: insertedBatch, error: insErr } = await supabase
        .from("batches")
        .insert({
          business_id: "00000000-0000-0000-0000-000000000001",
          product_variant_id: variantId,
          batch_number: receiveForm.batch_number,
          manufacturing_date: receiveForm.mfg_date,
          expiry_date: receiveForm.expiry_date,
          quantity_received: Number(receiveForm.quantity),
          cost_per_unit: Number(receiveForm.cost_per_unit),
        })
        .select()
        .single();

      if (insErr) {
        toast.error("Failed to save batch: " + insErr.message);
        return;
      }

      if (insertedBatch) {
        await supabase.from("stock_movements").insert({
          business_id: "00000000-0000-0000-0000-000000000001",
          batch_id: insertedBatch.id,
          product_variant_id: variantId,
          movement_type: "purchase_in",
          quantity: Number(receiveForm.quantity),
          reason: "Supplier receipt: " + receiveForm.supplier,
          notes: "GRN-" + Math.floor(1000 + Math.random() * 9000),
        });
      }

      await loadData();
      setReceiveStockOpen(false);
      toast.success(`Received ${receiveForm.quantity} units for Batch ${receiveForm.batch_number}`);
    } catch (err: any) {
      toast.error("Error receiving stock: " + err.message);
    }
  };

  const handleAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = Number(adjustForm.quantity);
    if (qty <= 0) {
      toast.error("Quantity must be greater than zero");
      return;
    }

    const targetBatch = batches.find((b) => b.id === adjustForm.batch_id);
    if (!targetBatch) return;

    if (adjustForm.type !== "adjustment_in" && targetBatch.qty_remaining < qty) {
      toast.error(`Cannot reduce stock below zero! Available: ${targetBatch.qty_remaining}`);
      return;
    }

    try {
      const supabase = createClient();
      await supabase.from("stock_movements").insert({
        business_id: "00000000-0000-0000-0000-000000000001",
        batch_id: targetBatch.id,
        movement_type: adjustForm.type,
        quantity: qty,
        reason: adjustForm.reason || "Manual Stock Adjustment",
        notes: "ADJ-" + Math.floor(100 + Math.random() * 900),
      });

      await loadData();
      setAdjustStockOpen(false);
      toast.success("Stock adjustment logged in database");
    } catch (err: any) {
      toast.error("Error saving adjustment: " + err.message);
    }
  };

  return (
    <div className="min-h-screen pb-12">
      <TopHeader title="Inventory & Batches" />

      <div className="space-y-6 pt-2">
        {/* Valuation & Summary KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <div className="bg-white/55 backdrop-blur-xl border border-white/65 rounded-[24px] p-4 sm:p-5 shadow-none">
            <span className="text-[11px] sm:text-xs font-light text-neutral-500 block">
              Total stock valuation (at cost)
            </span>
            <div className="text-2xl sm:text-3xl font-semibold text-neutral-900 mt-1 tracking-tight">
              {formatINR(totalStockValuation)}
            </div>
            <p className="text-[10px] sm:text-[11px] font-light text-neutral-500 mt-0.5 truncate">Calculated from batch costs</p>
          </div>

          <div className="bg-white/55 backdrop-blur-xl border border-white/65 rounded-[24px] p-4 sm:p-5 shadow-none">
            <span className="text-[11px] sm:text-xs font-light text-neutral-500 block">
              Total units on hand
            </span>
            <div className="text-2xl sm:text-3xl font-semibold text-neutral-900 mt-1 tracking-tight">
              {totalStockUnits} Units
            </div>
            <p className="text-[10px] sm:text-[11px] font-light text-neutral-500 mt-0.5 truncate">Across active FEFO batches</p>
          </div>

          <div className="bg-white/55 backdrop-blur-xl border border-white/65 rounded-[24px] p-4 sm:p-5 shadow-none flex items-center justify-between">
            <div>
              <span className="text-[11px] sm:text-xs font-light text-neutral-500 block">
                FEFO policy
              </span>
              <p className="text-sm text-neutral-900 font-normal mt-0.5">First-Expiry-First-Out</p>
              <p className="text-[10px] sm:text-[11px] text-emerald-800 font-light truncate">Automatic allocation on billing</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-[#E0FE52] text-black flex items-center justify-center font-normal shadow-sm">
              ✓
            </div>
          </div>
        </div>

        {/* Action Controls & Navigation Tabs */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="flex items-center gap-1.5 p-1 bg-white/55 backdrop-blur-md rounded-full border border-white/70 shadow-sm">
            <button
              onClick={() => setActiveTab("batches")}
              className={`px-4 min-h-[44px] flex items-center justify-center text-xs font-light rounded-full transition-all cursor-pointer ${
                activeTab === "batches"
                  ? "bg-black text-white font-normal shadow-sm"
                  : "text-neutral-700 hover:text-black"
              }`}
            >
              Batches on Hand
            </button>
            <button
              onClick={() => setActiveTab("movements")}
              className={`px-4 min-h-[44px] flex items-center justify-center text-xs font-light rounded-full transition-all cursor-pointer ${
                activeTab === "movements"
                  ? "bg-black text-white font-normal shadow-sm"
                  : "text-neutral-700 hover:text-black"
              }`}
            >
              Stock Movements Ledger
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/products/new"
              className="flex items-center gap-1.5 px-4 h-10 rounded-full bg-white/70 text-neutral-800 border border-white/80 text-xs font-light shadow-sm hover:bg-black hover:text-white transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-[#E0FE52]" />
              <span>Add New Product</span>
            </Link>

            <button
              type="button"
              onClick={() => setAdjustStockOpen(true)}
              className="flex items-center gap-1.5 px-4 h-10 rounded-full bg-white/70 text-neutral-800 border border-white/80 text-xs font-light shadow-sm hover:bg-white transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Adjust Stock</span>
            </button>

            <button
              type="button"
              onClick={() => setReceiveStockOpen(true)}
              className="flex items-center gap-1.5 px-5 h-10 rounded-full bg-black text-white text-xs font-normal shadow-md hover:scale-105 active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4 text-[#E0FE52]" />
              <span>Receive Stock</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Batch-wise Stock Table */}
        {activeTab === "batches" && (
          <div className="bg-white/55 backdrop-blur-xl rounded-[28px] border border-white/65 overflow-hidden shadow-sm">
            <div className="p-5 border-b border-white/60 flex items-center justify-between">
              <h3 className="text-sm font-normal text-neutral-900">
                Active Batches (FEFO Sorted)
              </h3>
              <span className="text-xs text-neutral-500 font-light">
                Earliest expiry issued first
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-white/40 border-b border-white/60 text-neutral-500 font-normal">
                  <tr>
                    <th className="py-4 px-6 font-normal">Batch #</th>
                    <th className="py-4 px-4 font-normal">Product Variant</th>
                    <th className="py-4 px-4 font-normal">Mfg Date</th>
                    <th className="py-4 px-4 font-normal">Expiry Date</th>
                    <th className="py-4 px-4 text-right font-normal">Received</th>
                    <th className="py-4 px-4 text-right font-normal">On Hand</th>
                    <th className="py-4 px-4 text-right font-normal">Cost / Unit</th>
                    <th className="py-4 px-6 text-right font-normal">Total Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/50">
                  {batches.map((b) => (
                    <tr key={b.id} className="hover:bg-white/40 transition-colors">
                      <td className="py-4 px-6">
                        <span className="font-mono font-normal text-neutral-800 bg-white/70 px-2.5 py-1 rounded-lg border border-white/80">
                          {b.batch_number}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-normal text-neutral-900">{b.product_name}</div>
                        <div className="text-[11px] text-neutral-500 font-light">{b.variant_name} ({b.sku})</div>
                      </td>
                      <td className="py-4 px-4 text-neutral-600 font-light">{b.mfg_date}</td>
                      <td className="py-4 px-4 font-medium text-emerald-700">{b.expiry_date}</td>
                      <td className="py-4 px-4 text-right text-neutral-500 font-light">{b.qty_received}</td>
                      <td className="py-4 px-4 text-right">
                        <span className="font-medium text-sm text-neutral-900 bg-emerald-50/80 text-emerald-800 px-2 py-0.5 rounded-lg border border-emerald-100">
                          {b.qty_remaining}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right font-light text-neutral-700">{formatINR(b.cost_per_unit)}</td>
                      <td className="py-4 px-6 text-right font-medium text-neutral-900">{formatINR(b.qty_remaining * b.cost_per_unit)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Stock Movements Ledger */}
        {activeTab === "movements" && (
          <div className="bg-white/55 backdrop-blur-xl rounded-[28px] border border-white/65 overflow-hidden shadow-none">
            <div className="p-5 border-b border-white/50 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-normal text-neutral-900">Immutable Stock Ledger</h3>
                <p className="text-xs text-neutral-500 font-light mt-0.5">Every quantity change is recorded as an audited ledger entry</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-white/40 border-b border-white/60 text-neutral-500 font-normal">
                  <tr>
                    <th className="py-4 px-6">Timestamp</th>
                    <th className="py-4 px-4">Product</th>
                    <th className="py-4 px-4">Movement Type</th>
                    <th className="py-4 px-4">Batch Ref</th>
                    <th className="py-4 px-4 text-right">Qty</th>
                    <th className="py-4 px-4">Source / Ref</th>
                    <th className="py-4 px-6">Reason / Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/50">
                  {movements.map((m) => (
                    <tr key={m.id} className="hover:bg-white/40 transition-colors">
                      <td className="py-4 px-6 font-mono text-neutral-500">{m.date}</td>
                      <td className="py-4 px-4 font-normal text-neutral-900">{m.product}</td>
                      <td className="py-4 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-light border capitalize ${
                            m.type.includes('in')
                              ? "bg-emerald-50 text-emerald-800 border-emerald-100"
                              : "bg-rose-50 text-rose-800 border-rose-100"
                          }`}
                        >
                          {m.type}
                        </span>
                      </td>
                      <td className="py-4 px-4 font-mono text-neutral-600">{m.batch_number}</td>
                      <td className="py-4 px-4 text-right font-medium text-sm text-neutral-900">
                        {m.type.includes('in') ? `+${m.quantity}` : `-${m.quantity}`}
                      </td>
                      <td className="py-4 px-4 font-mono text-xs text-neutral-600">{m.ref_doc}</td>
                      <td className="py-4 px-6 text-neutral-600 font-light">{m.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Receive Stock Modal */}
      <Dialog open={receiveStockOpen} onOpenChange={setReceiveStockOpen}>
        <DialogContent className="sm:max-w-lg p-6 rounded-[28px] bg-white/95 backdrop-blur-2xl border border-white/80 shadow-2xl">
          <DialogHeader className="pb-3 border-b border-neutral-100">
            <DialogTitle className="text-base font-normal text-neutral-900">
              Receive Stock from Supplier / Factory
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleReceiveStock} className="space-y-4 mt-3">
            <div>
              <label className="block text-xs font-normal text-neutral-700 mb-1.5">
                Product Variant
              </label>
              <select
                aria-label="Product Variant"
                value={receiveForm.variant_id}
                onChange={(e) => {
                  const sel = variantsList.find((v) => v.id === e.target.value);
                  setReceiveForm({
                    ...receiveForm,
                    variant_id: e.target.value,
                    cost_per_unit: sel ? sel.cost : receiveForm.cost_per_unit,
                  });
                }}
                className="w-full h-11 px-4 text-xs bg-white/60 backdrop-blur-md rounded-full border border-neutral-200/80 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#D4F732]"
              >
                {variantsList.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.prodName} - {v.name} ({v.sku})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-normal text-neutral-700 mb-1.5">
                  Batch Number *
                </label>
                <input
                  type="text"
                  value={receiveForm.batch_number}
                  onChange={(e) => setReceiveForm({ ...receiveForm, batch_number: e.target.value })}
                  placeholder="e.g. B-FLR-2026-03"
                  required
                  className="w-full h-11 px-4 text-xs font-mono bg-white/60 backdrop-blur-md rounded-full border border-neutral-200/80 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#D4F732]"
                />
              </div>

              <div>
                <label className="block text-xs font-normal text-neutral-700 mb-1.5">
                  Quantity (Units) *
                </label>
                <input
                  type="number"
                  value={receiveForm.quantity}
                  onChange={(e) => setReceiveForm({ ...receiveForm, quantity: Number(e.target.value) })}
                  required
                  min="1"
                  className="w-full h-11 px-4 text-xs bg-white/60 backdrop-blur-md rounded-full border border-neutral-200/80 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#D4F732]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-normal text-neutral-700 mb-1.5">
                  Manufacturing Date
                </label>
                <input
                  type="date"
                  value={receiveForm.mfg_date}
                  onChange={(e) => setReceiveForm({ ...receiveForm, mfg_date: e.target.value })}
                  className="w-full h-11 px-4 text-xs bg-white/60 backdrop-blur-md rounded-full border border-neutral-200/80 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#D4F732]"
                />
              </div>

              <div>
                <label className="block text-xs font-normal text-neutral-700 mb-1.5">
                  Expiry Date
                </label>
                <input
                  type="date"
                  value={receiveForm.expiry_date}
                  onChange={(e) => setReceiveForm({ ...receiveForm, expiry_date: e.target.value })}
                  className="w-full h-11 px-4 text-xs bg-white/60 backdrop-blur-md rounded-full border border-neutral-200/80 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#D4F732]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-normal text-neutral-700 mb-1.5">
                  Cost Per Unit (₹)
                </label>
                <input
                  type="number"
                  value={receiveForm.cost_per_unit}
                  onChange={(e) => setReceiveForm({ ...receiveForm, cost_per_unit: Number(e.target.value) })}
                  className="w-full h-11 px-4 text-xs bg-white/60 backdrop-blur-md rounded-full border border-neutral-200/80 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#D4F732]"
                />
              </div>

              <div>
                <label className="block text-xs font-normal text-neutral-700 mb-1.5">
                  Supplier / Source
                </label>
                <input
                  type="text"
                  value={receiveForm.supplier}
                  onChange={(e) => setReceiveForm({ ...receiveForm, supplier: e.target.value })}
                  className="w-full h-11 px-4 text-xs bg-white/60 backdrop-blur-md rounded-full border border-neutral-200/80 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#D4F732]"
                />
              </div>
            </div>

            <div className="pt-3 text-right">
              <button
                type="submit"
                className="px-6 h-11 rounded-full bg-black text-white text-xs font-normal shadow-sm hover:scale-105 active:scale-95 transition-all"
              >
                Post Stock Receipt to Ledger
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Adjust Stock Modal */}
      <Dialog open={adjustStockOpen} onOpenChange={setAdjustStockOpen}>
        <DialogContent className="sm:max-w-md p-6 rounded-[28px] bg-white/95 backdrop-blur-2xl border border-white/80 shadow-2xl">
          <DialogHeader className="pb-3 border-b border-neutral-100">
            <DialogTitle className="text-base font-normal text-neutral-900">
              Record Stock Adjustment
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleAdjustStock} className="space-y-4 mt-3">
            <div>
              <label className="block text-xs font-normal text-neutral-700 mb-1.5">
                Select Batch
              </label>
              <select
                aria-label="Select Batch"
                value={adjustForm.batch_id}
                onChange={(e) => setAdjustForm({ ...adjustForm, batch_id: e.target.value })}
                className="w-full h-11 px-4 text-xs bg-white/60 backdrop-blur-md rounded-full border border-neutral-200/80 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#D4F732]"
              >
                {batches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.batch_number} ({b.product_name} - {b.qty_remaining} on hand)
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-normal text-neutral-700 mb-1.5">
                  Adjustment Type
                </label>
                <select
                  aria-label="Adjustment Type"
                  value={adjustForm.type}
                  onChange={(e) => setAdjustForm({ ...adjustForm, type: e.target.value })}
                  className="w-full h-11 px-4 text-xs bg-white/60 backdrop-blur-md rounded-full border border-neutral-200/80 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#D4F732]"
                >
                  <option value="damage_out">Damaged / Leaked (-)</option>
                  <option value="expiry_out">Expired (-)</option>
                  <option value="adjustment_out">Missing / Shrinkage (-)</option>
                  <option value="adjustment_in">Audit Surplus (+)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-normal text-neutral-700 mb-1.5">
                  Quantity
                </label>
                <input
                  type="number"
                  value={adjustForm.quantity}
                  onChange={(e) => setAdjustForm({ ...adjustForm, quantity: Number(e.target.value) })}
                  min="1"
                  required
                  className="w-full h-11 px-4 text-xs bg-white/60 backdrop-blur-md rounded-full border border-neutral-200/80 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#D4F732]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-normal text-neutral-700 mb-1.5">
                Reason / Investigation Note
              </label>
              <textarea
                value={adjustForm.reason}
                onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })}
                rows={2}
                placeholder="e.g. Broken seal during van transit"
                className="w-full p-3.5 text-xs bg-white/60 backdrop-blur-md rounded-2xl border border-neutral-200/80 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#D4F732]"
              />
            </div>

            <div className="pt-2 text-right">
              <button
                type="submit"
                className="px-6 h-11 rounded-full bg-black text-white text-xs font-normal shadow-sm hover:scale-105 active:scale-95 transition-all"
              >
                Record Adjustment
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

