"use client";

import { useState } from "react";
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

const DEMO_BATCHES: BatchItem[] = [
  {
    id: "b1",
    batch_number: "B-FLR-2026-01",
    product_name: "TAZQOR Citrus Floor Cleaner",
    variant_name: "5 Litre Can",
    sku: "TC-FLR-01-5L",
    mfg_date: "2026-01-15",
    expiry_date: "2028-01-14",
    qty_received: 100,
    qty_remaining: 45,
    cost_per_unit: 280,
  },
  {
    id: "b2",
    batch_number: "B-FLR-2026-02",
    product_name: "TAZQOR Citrus Floor Cleaner",
    variant_name: "1 Litre Bottle",
    sku: "TC-FLR-01-1L",
    mfg_date: "2026-01-20",
    expiry_date: "2028-01-19",
    qty_received: 200,
    qty_remaining: 120,
    cost_per_unit: 65,
  },
  {
    id: "b3",
    batch_number: "B-DSH-2026-01",
    product_name: "TAZQOR Sparkle Dish Wash Gel",
    variant_name: "5 Litre Can",
    sku: "TC-DSH-01-5L",
    mfg_date: "2026-02-01",
    expiry_date: "2028-01-31",
    qty_received: 80,
    qty_remaining: 35,
    cost_per_unit: 310,
  },
  {
    id: "b4",
    batch_number: "B-HND-2026-01",
    product_name: "TAZQOR Anti-Bacterial Hand Wash",
    variant_name: "500 mL Dispenser",
    sku: "TC-HND-01-500M",
    mfg_date: "2026-01-10",
    expiry_date: "2027-01-09",
    qty_received: 250,
    qty_remaining: 140,
    cost_per_unit: 48,
  },
];

const DEMO_MOVEMENTS: StockMovement[] = [
  { id: "sm-01", date: "2026-02-15 14:30", product: "Floor Cleaner 5L", type: "sale_out", quantity: 12, batch_number: "B-FLR-2026-01", reason: "Invoice Finalization", ref_doc: "INV/2025-26/0001" },
  { id: "sm-02", date: "2026-02-14 11:20", product: "Dish Wash 5L", type: "sale_out", quantity: 5, batch_number: "B-DSH-2026-01", reason: "Invoice Finalization", ref_doc: "INV/2025-26/0002" },
  { id: "sm-03", date: "2026-02-10 09:45", product: "Floor Cleaner 1L", type: "damage_out", quantity: 2, batch_number: "B-FLR-2026-02", reason: "Transport bottle puncture", ref_doc: "ADJ-001" },
  { id: "sm-04", date: "2026-02-01 10:00", product: "Dish Wash 5L", type: "purchase_in", quantity: 80, batch_number: "B-DSH-2026-01", reason: "Batch production receipt", ref_doc: "GRN-2026-02" },
  { id: "sm-05", date: "2026-01-15 09:00", product: "Floor Cleaner 5L", type: "opening_stock", quantity: 100, batch_number: "B-FLR-2026-01", reason: "Initial opening stock", ref_doc: "INIT" },
];

export default function InventoryPage() {
  const [activeTab, setActiveTab] = useState<"batches" | "movements">("batches");
  const [batches, setBatches] = useState<BatchItem[]>(DEMO_BATCHES);
  const [movements, setMovements] = useState<StockMovement[]>(DEMO_MOVEMENTS);
  const [search, setSearch] = useState("");
  const [receiveStockOpen, setReceiveStockOpen] = useState(false);
  const [adjustStockOpen, setAdjustStockOpen] = useState(false);

  // New stock receipt form
  const [receiveForm, setReceiveForm] = useState({
    product_variant: "Floor Cleaner 5L",
    batch_number: "",
    mfg_date: "2026-02-15",
    expiry_date: "2028-02-14",
    quantity: 50,
    cost_per_unit: 280,
    supplier: "TAZQOR Factory Plant 1",
  });

  // Adjust stock form
  const [adjustForm, setAdjustForm] = useState({
    batch_id: "b1",
    type: "damage_out",
    quantity: 1,
    reason: "",
  });

  const totalStockUnits = batches.reduce((acc, b) => acc + b.qty_remaining, 0);
  const totalStockValuation = batches.reduce((acc, b) => acc + (b.qty_remaining * b.cost_per_unit), 0);

  const handleReceiveStock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiveForm.batch_number) {
      toast.error("Please enter batch number");
      return;
    }

    const newBatch: BatchItem = {
      id: "b-" + Date.now(),
      batch_number: receiveForm.batch_number,
      product_name: "TAZQOR Citrus Floor Cleaner",
      variant_name: receiveForm.product_variant,
      sku: "TC-FLR-01-5L",
      mfg_date: receiveForm.mfg_date,
      expiry_date: receiveForm.expiry_date,
      qty_received: Number(receiveForm.quantity),
      qty_remaining: Number(receiveForm.quantity),
      cost_per_unit: Number(receiveForm.cost_per_unit),
    };

    const newMov: StockMovement = {
      id: "sm-" + Date.now(),
      date: new Date().toISOString().replace('T', ' ').substring(0, 16),
      product: receiveForm.product_variant,
      type: "purchase_in",
      quantity: Number(receiveForm.quantity),
      batch_number: receiveForm.batch_number,
      reason: "Supplier receipt: " + receiveForm.supplier,
      ref_doc: "GRN-" + Math.floor(1000 + Math.random() * 9000),
    };

    setBatches([newBatch, ...batches]);
    setMovements([newMov, ...movements]);
    setReceiveStockOpen(false);
    toast.success(`Received ${receiveForm.quantity} units for Batch ${receiveForm.batch_number}`);
  };

  const handleAdjustStock = (e: React.FormEvent) => {
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

    const updatedBatches = batches.map((b) => {
      if (b.id === adjustForm.batch_id) {
        return {
          ...b,
          qty_remaining: adjustForm.type === "adjustment_in" ? b.qty_remaining + qty : b.qty_remaining - qty,
        };
      }
      return b;
    });

    const newMov: StockMovement = {
      id: "sm-" + Date.now(),
      date: new Date().toISOString().replace('T', ' ').substring(0, 16),
      product: targetBatch.variant_name,
      type: adjustForm.type as StockMovement['type'],
      quantity: qty,
      batch_number: targetBatch.batch_number,
      reason: adjustForm.reason || "Manual Stock Adjustment",
      ref_doc: "ADJ-" + Math.floor(100 + Math.random() * 900),
    };

    setBatches(updatedBatches);
    setMovements([newMov, ...movements]);
    setAdjustStockOpen(false);
    toast.success("Stock adjustment logged in ledger");
  };

  return (
    <div className="min-h-screen pb-12">
      <TopHeader title="Inventory & Batches" />

      <div className="space-y-6 pt-2">
        {/* Valuation & Summary KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="bg-white/55 backdrop-blur-xl border border-white/65 rounded-[24px] p-6 shadow-sm">
            <span className="text-xs font-light text-neutral-500 block">
              Total stock valuation (at cost)
            </span>
            <div className="text-3xl font-normal text-neutral-900 mt-1 tracking-tight">
              {formatINR(totalStockValuation)}
            </div>
            <p className="text-[11px] font-light text-neutral-500 mt-0.5">Calculated from batch costs</p>
          </div>

          <div className="bg-white/55 backdrop-blur-xl border border-white/65 rounded-[24px] p-6 shadow-sm">
            <span className="text-xs font-light text-neutral-500 block">
              Total units on hand
            </span>
            <div className="text-3xl font-normal text-emerald-800 mt-1 tracking-tight">
              {totalStockUnits} Units
            </div>
            <p className="text-[11px] font-light text-neutral-500 mt-0.5">Across active FEFO batches</p>
          </div>

          <div className="bg-white/55 backdrop-blur-xl border border-white/65 rounded-[24px] p-6 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-light text-neutral-500 block">
                FEFO policy
              </span>
              <p className="text-sm text-neutral-900 font-normal mt-0.5">First-Expiry-First-Out</p>
              <p className="text-[11px] text-emerald-800 font-light">Automatic allocation on billing</p>
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

          <div className="flex items-center gap-2">
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
                <thead className="bg-[#F9F8FD] border-b border-[#E5E4EE] text-gray-500 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-4 px-6">Batch #</th>
                    <th className="py-4 px-4">Product Variant</th>
                    <th className="py-4 px-4">Mfg Date</th>
                    <th className="py-4 px-4">Expiry Date</th>
                    <th className="py-4 px-4 text-right">Received</th>
                    <th className="py-4 px-4 text-right">On Hand</th>
                    <th className="py-4 px-4 text-right">Cost / Unit</th>
                    <th className="py-4 px-6 text-right">Total Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E4EE]">
                  {batches.map((b) => (
                    <tr key={b.id} className="hover:bg-[#F9F8FD]/60">
                      <td className="py-4 px-6">
                        <span className="font-mono font-bold text-gray-900 bg-gray-100 px-2.5 py-1 rounded-lg">
                          {b.batch_number}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-bold text-gray-900">{b.product_name}</div>
                        <div className="text-[11px] text-gray-500">{b.variant_name} ({b.sku})</div>
                      </td>
                      <td className="py-4 px-4 text-gray-600 font-medium">{b.mfg_date}</td>
                      <td className="py-4 px-4 font-bold text-emerald-700">{b.expiry_date}</td>
                      <td className="py-4 px-4 text-right text-gray-500">{b.qty_received}</td>
                      <td className="py-4 px-4 text-right">
                        <span className="font-extrabold text-sm text-[#0A0A0A] bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-lg border border-emerald-100">
                          {b.qty_remaining}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right font-medium text-gray-700">{formatINR(b.cost_per_unit)}</td>
                      <td className="py-4 px-6 text-right font-bold text-gray-900">{formatINR(b.qty_remaining * b.cost_per_unit)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Stock Movements Ledger */}
        {activeTab === "movements" && (
          <div className="bg-white rounded-3xl border border-[#E5E4EE] overflow-hidden shadow-sm">
            <div className="p-5 border-b border-[#E5E4EE] flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Immutable Stock Ledger</h3>
                <p className="text-xs text-gray-500 mt-0.5">Every quantity change is recorded as an audited ledger entry</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F9F8FD] border-b border-[#E5E4EE] text-gray-500 font-bold uppercase tracking-wider">
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
                <tbody className="divide-y divide-[#E5E4EE]">
                  {movements.map((m) => (
                    <tr key={m.id} className="hover:bg-[#F9F8FD]/60">
                      <td className="py-4 px-6 font-mono text-gray-500">{m.date}</td>
                      <td className="py-4 px-4 font-bold text-gray-900">{m.product}</td>
                      <td className="py-4 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            m.type.includes('in')
                              ? "bg-emerald-50 text-emerald-800"
                              : "bg-rose-50 text-rose-800"
                          }`}
                        >
                          {m.type}
                        </span>
                      </td>
                      <td className="py-4 px-4 font-mono text-gray-600">{m.batch_number}</td>
                      <td className="py-4 px-4 text-right font-black text-sm">
                        {m.type.includes('in') ? `+${m.quantity}` : `-${m.quantity}`}
                      </td>
                      <td className="py-4 px-4 font-mono text-xs text-gray-600">{m.ref_doc}</td>
                      <td className="py-4 px-6 text-gray-600">{m.reason}</td>
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
        <DialogContent className="sm:max-w-lg p-6 rounded-3xl bg-white border border-[#E5E4EE] shadow-2xl">
          <DialogHeader className="pb-3 border-b border-gray-100">
            <DialogTitle className="text-lg font-bold text-[#0A0A0A]">
              Receive Stock from Supplier / Factory
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleReceiveStock} className="space-y-4 mt-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Product Variant
              </label>
              <select
                aria-label="Product Variant"
                value={receiveForm.product_variant}
                onChange={(e) => setReceiveForm({ ...receiveForm, product_variant: e.target.value })}
                className="w-full h-10 px-3 text-xs bg-[#F9F8FD] rounded-xl border border-[#E5E4EE]"
              >
                <option value="Floor Cleaner 5L">TAZQOR Citrus Floor Cleaner (5 L Can)</option>
                <option value="Floor Cleaner 1L">TAZQOR Citrus Floor Cleaner (1 L Bottle)</option>
                <option value="Dish Wash 5L">TAZQOR Sparkle Dish Wash Gel (5 L Can)</option>
                <option value="Hand Wash 500M">TAZQOR Anti-Bacterial Hand Wash (500 mL)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Batch Number *
                </label>
                <input
                  type="text"
                  value={receiveForm.batch_number}
                  onChange={(e) => setReceiveForm({ ...receiveForm, batch_number: e.target.value })}
                  placeholder="e.g. B-FLR-2026-03"
                  required
                  className="w-full h-10 px-3 text-xs font-mono bg-[#F9F8FD] rounded-xl border border-[#E5E4EE]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Quantity (Units) *
                </label>
                <input
                  type="number"
                  value={receiveForm.quantity}
                  onChange={(e) => setReceiveForm({ ...receiveForm, quantity: Number(e.target.value) })}
                  required
                  min="1"
                  className="w-full h-10 px-3 text-xs bg-[#F9F8FD] rounded-xl border border-[#E5E4EE]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Manufacturing Date
                </label>
                <input
                  type="date"
                  value={receiveForm.mfg_date}
                  onChange={(e) => setReceiveForm({ ...receiveForm, mfg_date: e.target.value })}
                  className="w-full h-10 px-3 text-xs bg-[#F9F8FD] rounded-xl border border-[#E5E4EE]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Expiry Date
                </label>
                <input
                  type="date"
                  value={receiveForm.expiry_date}
                  onChange={(e) => setReceiveForm({ ...receiveForm, expiry_date: e.target.value })}
                  className="w-full h-10 px-3 text-xs bg-[#F9F8FD] rounded-xl border border-[#E5E4EE]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Cost Per Unit (₹)
                </label>
                <input
                  type="number"
                  value={receiveForm.cost_per_unit}
                  onChange={(e) => setReceiveForm({ ...receiveForm, cost_per_unit: Number(e.target.value) })}
                  className="w-full h-10 px-3 text-xs bg-[#F9F8FD] rounded-xl border border-[#E5E4EE]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Supplier / Source
                </label>
                <input
                  type="text"
                  value={receiveForm.supplier}
                  onChange={(e) => setReceiveForm({ ...receiveForm, supplier: e.target.value })}
                  className="w-full h-10 px-3 text-xs bg-[#F9F8FD] rounded-xl border border-[#E5E4EE]"
                />
              </div>
            </div>

            <div className="pt-3 text-right">
              <button
                type="submit"
                className="px-6 h-11 rounded-full bg-[#0A0A0A] text-white text-xs font-bold shadow-md hover:bg-black/90"
              >
                Post Stock Receipt to Ledger
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Adjust Stock Modal */}
      <Dialog open={adjustStockOpen} onOpenChange={setAdjustStockOpen}>
        <DialogContent className="sm:max-w-md p-6 rounded-3xl bg-white border border-[#E5E4EE] shadow-2xl">
          <DialogHeader className="pb-3 border-b border-gray-100">
            <DialogTitle className="text-lg font-bold text-[#0A0A0A]">
              Record Stock Adjustment
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleAdjustStock} className="space-y-4 mt-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Select Batch
              </label>
              <select
                aria-label="Select Batch"
                value={adjustForm.batch_id}
                onChange={(e) => setAdjustForm({ ...adjustForm, batch_id: e.target.value })}
                className="w-full h-10 px-3 text-xs bg-[#F9F8FD] rounded-xl border border-[#E5E4EE]"
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
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Adjustment Type
                </label>
                <select
                  aria-label="Adjustment Type"
                  value={adjustForm.type}
                  onChange={(e) => setAdjustForm({ ...adjustForm, type: e.target.value })}
                  className="w-full h-10 px-3 text-xs bg-[#F9F8FD] rounded-xl border border-[#E5E4EE]"
                >
                  <option value="damage_out">Damaged / Leaked (-)</option>
                  <option value="expiry_out">Expired (-)</option>
                  <option value="adjustment_out">Missing / Shrinkage (-)</option>
                  <option value="adjustment_in">Audit Surplus (+)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Quantity
                </label>
                <input
                  type="number"
                  value={adjustForm.quantity}
                  onChange={(e) => setAdjustForm({ ...adjustForm, quantity: Number(e.target.value) })}
                  min="1"
                  required
                  className="w-full h-10 px-3 text-xs bg-[#F9F8FD] rounded-xl border border-[#E5E4EE]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Reason / Investigation Note
              </label>
              <textarea
                value={adjustForm.reason}
                onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })}
                rows={2}
                placeholder="e.g. Broken seal during van transit"
                className="w-full p-2.5 text-xs bg-[#F9F8FD] rounded-xl border border-[#E5E4EE]"
              />
            </div>

            <div className="pt-2 text-right">
              <button
                type="submit"
                className="px-6 h-11 rounded-full bg-[#0A0A0A] text-white text-xs font-bold shadow-md hover:bg-black/90"
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

