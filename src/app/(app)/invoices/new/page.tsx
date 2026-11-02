"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  Trash2,
  FileText,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Sparkles,
  Printer,
  Receipt,
} from "lucide-react";
import { toast } from "sonner";
import { TopHeader } from "@/components/layout/TopHeader";
import { calculateInvoice, LineItemCalculationInput } from "@/lib/calculations/money";
import { formatINR } from "@/lib/formatting/currency";

interface BillLineItem {
  variant_id: string;
  name: string;
  pack_size: string;
  sku: string;
  hsn: string;
  quantity: number;
  unit_price: number;
  discount_percent: number;
  tax_rate: number;
  stock_on_hand: number;
}

const AVAILABLE_VARIANTS: BillLineItem[] = [
  {
    variant_id: "v-flr-5l",
    name: "TAZQOR Citrus Floor Cleaner",
    pack_size: "5 L Can",
    sku: "TC-FLR-01-5L",
    hsn: "3402",
    quantity: 1,
    unit_price: 450,
    discount_percent: 0,
    tax_rate: 18,
    stock_on_hand: 45,
  },
  {
    variant_id: "v-flr-1l",
    name: "TAZQOR Citrus Floor Cleaner",
    pack_size: "1 L Bottle",
    sku: "TC-FLR-01-1L",
    hsn: "3402",
    quantity: 1,
    unit_price: 110,
    discount_percent: 0,
    tax_rate: 18,
    stock_on_hand: 120,
  },
  {
    variant_id: "v-dsh-5l",
    name: "TAZQOR Sparkle Dish Wash Gel",
    pack_size: "5 L Can",
    sku: "TC-DSH-01-5L",
    hsn: "3402",
    quantity: 1,
    unit_price: 520,
    discount_percent: 0,
    tax_rate: 18,
    stock_on_hand: 35,
  },
  {
    variant_id: "v-hnd-500m",
    name: "TAZQOR Anti-Bacterial Hand Wash",
    pack_size: "500 mL Pump",
    sku: "TC-HND-01-500M",
    hsn: "3401",
    quantity: 1,
    unit_price: 85,
    discount_percent: 0,
    tax_rate: 18,
    stock_on_hand: 140,
  },
];

export default function NewInvoicePage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  // Business GST state (configured in settings)
  const isGstEligible = true; // In production read from business_settings

  const [mode, setMode] = useState<"gst" | "non_gst">("gst");
  const [customer, setCustomer] = useState("c1-shreeji");
  const [invoiceDate, setInvoiceDate] = useState("2026-02-16");
  const [dueDate, setDueDate] = useState("2026-03-02");
  const [isInterState, setIsInterState] = useState(false);
  const [roundOffEnabled, setRoundOffEnabled] = useState(true);
  const [notes, setNotes] = useState("Goods once sold will not be taken back without batch seal.");

  const [lines, setLines] = useState<BillLineItem[]>([
    { ...AVAILABLE_VARIANTS[0], quantity: 10, discount_percent: 5 },
    { ...AVAILABLE_VARIANTS[2], quantity: 4, discount_percent: 0 },
  ]);

  // Recalculate invoice totals accurately using the money calculation engine
  const calculationInputs: LineItemCalculationInput[] = useMemo(() => {
    return lines.map((l) => ({
      quantity: l.quantity,
      unitPrice: l.unit_price,
      discountPercent: l.discount_percent,
      taxRatePercent: mode === "gst" ? l.tax_rate : 0, // Non-GST bills have zero tax
      isTaxInclusive: false,
      isInterState,
    }));
  }, [lines, mode, isInterState]);

  const invoiceTotals = useMemo(() => {
    return calculateInvoice(calculationInputs, roundOffEnabled);
  }, [calculationInputs, roundOffEnabled]);

  const addLine = () => {
    setLines([...lines, { ...AVAILABLE_VARIANTS[1], quantity: 6, discount_percent: 0 }]);
  };

  const removeLine = (idx: number) => {
    if (lines.length <= 1) {
      toast.error("Invoice must contain at least one line item");
      return;
    }
    setLines(lines.filter((_, i) => i !== idx));
  };

  const handleFinalize = async () => {
    // Check stock for all lines
    for (const l of lines) {
      if (l.quantity > l.stock_on_hand) {
        toast.error(`Cannot finalize invoice: Shortage of stock for ${l.name} (${l.pack_size}). Required: ${l.quantity}, On hand: ${l.stock_on_hand}`);
        return;
      }
    }

    setSubmitting(true);
    try {
      await new Promise((r) => setTimeout(r, 800));
      const generatedNumber = mode === "gst" ? "INV/2026-27/0003" : "BILL/2026-27/0002";
      toast.success(`Invoice ${generatedNumber} finalized and FEFO stock deducted!`);
      router.push("/invoices");
    } catch {
      toast.error("Failed to finalize invoice");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen">
      <TopHeader
        title={mode === "gst" ? "Generate GST Tax Invoice" : "Generate Non-GST Bill of Supply"}
        subtitle="Transactional document generator with automated FEFO batch allocation"
      />

      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-5xl mx-auto">
        <div>
          <Link
            href="/invoices"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-black transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Cancel and back to invoices</span>
          </Link>
        </div>

        {/* GST Mode Selector & Security Gate Banner */}
        <div className="bg-white rounded-3xl p-6 border border-[#E5E4EE] shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
            <div>
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
                Billing Mode
              </span>
              <h2 className="text-base font-extrabold text-gray-900 mt-0.5">
                Choose Document Type
              </h2>
            </div>

            <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-full">
              <button
                type="button"
                onClick={() => setMode("gst")}
                className={`px-4 py-2 text-xs font-bold rounded-full transition-all ${
                  mode === "gst"
                    ? "bg-[#0A0A0A] text-white shadow-sm"
                    : "text-gray-600 hover:text-black"
                }`}
              >
                GST Tax Invoice
              </button>
              <button
                type="button"
                onClick={() => setMode("non_gst")}
                className={`px-4 py-2 text-xs font-bold rounded-full transition-all ${
                  mode === "non_gst"
                    ? "bg-[#0A0A0A] text-white shadow-sm"
                    : "text-gray-600 hover:text-black"
                }`}
              >
                Non-GST Bill / Receipt
              </button>
            </div>
          </div>

          {/* Mode Info Callout */}
          {mode === "gst" ? (
            <div className="p-3.5 rounded-2xl bg-purple-50/70 border border-purple-200 text-xs text-purple-900 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-purple-700 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">GST Tax Invoice Mode Active:</span> In compliance with GST laws,
                item HSN codes, taxable values, and {isInterState ? "IGST (18%)" : "CGST (9%) + SGST (9%)"} split will be printed.
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Non-GST Bill of Supply Mode:</span> Tax claims, GSTIN and &quot;Tax Invoice&quot; wording
                will NOT appear on this bill as mandated by law.
              </div>
            </div>
          )}

          {/* Customer, Dates & Place of Supply */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Customer Account *
              </label>
              <select
                value={customer}
                onChange={(e) => setCustomer(e.target.value)}
                className="w-full h-11 px-3 text-xs bg-[#F9F8FD] rounded-xl border border-[#E5E4EE] font-medium"
              >
                <option value="c1-shreeji">Shreeji Supermarket (Ahmedabad)</option>
                <option value="c2-pride-hotel">Hotel Pride Plaza (Ahmedabad)</option>
                <option value="c3-apex-cowork">Apex Co-Working (Gandhinagar)</option>
                <option value="c4-radhe-pg">Radhe Krishna PG (Ahmedabad)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Invoice Date *
              </label>
              <input
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                className="w-full h-11 px-3 text-xs bg-[#F9F8FD] rounded-xl border border-[#E5E4EE]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Payment Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full h-11 px-3 text-xs bg-[#F9F8FD] rounded-xl border border-[#E5E4EE]"
              />
            </div>
          </div>
        </div>

        {/* Invoice Line Items */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E5E4EE] shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-gray-900">Line Items & Calculations</h2>
              <p className="text-xs text-gray-500">Live batch allocation check per line</p>
            </div>
            <button
              type="button"
              onClick={addLine}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-gray-100 text-gray-800 text-xs font-bold hover:bg-[#0A0A0A] hover:text-white transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Item</span>
            </button>
          </div>

          <div className="space-y-3">
            {lines.map((line, idx) => {
              const res = invoiceTotals.items[idx];
              return (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-[#F9F8FD] border border-[#E5E4EE] space-y-3"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                    <div className="sm:col-span-4">
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">
                        Product Variant
                      </label>
                      <input
                        type="text"
                        value={`${line.name} (${line.pack_size})`}
                        readOnly
                        className="w-full h-9 px-3 text-xs bg-white rounded-lg border border-gray-200 font-semibold text-gray-900"
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

                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">
                        Disc %
                      </label>
                      <input
                        type="number"
                        value={line.discount_percent}
                        onChange={(e) => {
                          const copy = [...lines];
                          copy[idx].discount_percent = Number(e.target.value);
                          setLines(copy);
                        }}
                        className="w-full h-9 px-2.5 text-xs bg-white rounded-lg border border-gray-200"
                      />
                    </div>

                    <div className="sm:col-span-2 flex items-center justify-end gap-2">
                      <div className="text-right">
                        <span className="block text-[10px] text-gray-400">Total</span>
                        <span className="text-xs font-black text-gray-900">
                          {formatINR(res?.lineTotal || 0)}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeLine(idx)}
                        className="p-1.5 text-rose-500 hover:text-rose-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Tax Breakdown Strip (for GST mode) */}
                  {mode === "gst" && res && (
                    <div className="flex flex-wrap items-center gap-4 text-[11px] pt-2 border-t border-gray-200/60 text-gray-600 font-medium">
                      <span>HSN: <strong className="font-mono text-gray-800">{line.hsn}</strong></span>
                      <span>Taxable Base: <strong>{formatINR(res.lineSubtotal)}</strong></span>
                      {!isInterState ? (
                        <>
                          <span>CGST (9%): <strong>{formatINR(res.cgstAmount)}</strong></span>
                          <span>SGST (9%): <strong>{formatINR(res.sgstAmount)}</strong></span>
                        </>
                      ) : (
                        <span>IGST (18%): <strong>{formatINR(res.igstAmount)}</strong></span>
                      )}
                      <span className="ml-auto text-emerald-700 text-[10px]">
                        ✓ {line.stock_on_hand} in FEFO batches
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Totals Summary Calculation Breakdown */}
          <div className="pt-6 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-start gap-6">
            <div className="w-full sm:max-w-md space-y-2">
              <label className="block text-xs font-bold text-gray-700">
                Invoice Terms & Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="w-full p-3 text-xs bg-[#F9F8FD] rounded-xl border border-[#E5E4EE]"
              />
            </div>

            <div className="w-full sm:w-72 bg-[#F9F8FD] p-4 rounded-2xl border border-[#E5E4EE] space-y-2.5 text-xs">
              <div className="flex justify-between text-gray-600">
                <span>Taxable Subtotal:</span>
                <span className="font-semibold text-gray-900">{formatINR(invoiceTotals.subtotal)}</span>
              </div>

              {invoiceTotals.discountTotal > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Total Discount:</span>
                  <span className="font-semibold">-{formatINR(invoiceTotals.discountTotal)}</span>
                </div>
              )}

              {mode === "gst" && (
                <>
                  <div className="flex justify-between text-gray-600">
                    <span>CGST:</span>
                    <span className="font-semibold text-gray-900">{formatINR(invoiceTotals.cgstTotal)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>SGST:</span>
                    <span className="font-semibold text-gray-900">{formatINR(invoiceTotals.sgstTotal)}</span>
                  </div>
                </>
              )}

              {roundOffEnabled && (
                <div className="flex justify-between text-gray-500 text-[11px]">
                  <span>Round off:</span>
                  <span>{invoiceTotals.roundOff >= 0 ? `+${invoiceTotals.roundOff.toFixed(2)}` : invoiceTotals.roundOff.toFixed(2)}</span>
                </div>
              )}

              <div className="pt-2 border-t border-gray-200 flex justify-between items-baseline">
                <span className="font-extrabold text-sm text-gray-900">Grand Total:</span>
                <span className="text-xl font-black text-[#0A0A0A]">
                  {formatINR(invoiceTotals.grandTotal)}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-gray-100 flex flex-wrap items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                toast.success("Draft saved successfully");
                router.push("/invoices");
              }}
              className="px-6 h-11 rounded-full bg-white text-gray-800 border border-[#E5E4EE] text-xs font-bold hover:border-black transition-all"
            >
              Save as Draft
            </button>

            <button
              type="button"
              onClick={handleFinalize}
              disabled={submitting}
              className="px-8 h-12 rounded-full bg-[#0A0A0A] text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 hover:bg-black/90 active:scale-95 transition-all shadow-md disabled:opacity-50"
            >
              <FileText className="w-4 h-4 text-[#D4F732]" />
              <span>{submitting ? "Finalizing & Deducting Stock..." : "Finalize & Issue Stock"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
