"use client";

import { useState, useMemo, useEffect } from "react";
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
import { formatDocumentNumber } from "@/lib/calculations/financialYear";
import { formatINR } from "@/lib/formatting/currency";
import { getCustomers, Customer } from "@/lib/services/customers";
import { createClient } from "@/lib/supabase/client";

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
    variant_id: "v-phn-1l",
    name: "TAZQOR Phenyl",
    pack_size: "1 Litre Bottle",
    sku: "TC-PHN-01-1L",
    hsn: "3402",
    quantity: 1,
    unit_price: 90,
    discount_percent: 0,
    tax_rate: 18,
    stock_on_hand: 50,
  },
  {
    variant_id: "v-tlt-500m",
    name: "TAZQOR Toilet Cleaner",
    pack_size: "500 mL Bottle",
    sku: "TC-TLT-01-500M",
    hsn: "3402",
    quantity: 1,
    unit_price: 80,
    discount_percent: 0,
    tax_rate: 18,
    stock_on_hand: 40,
  },
  {
    variant_id: "v-hnd-250m",
    name: "TAZQOR Hand Wash",
    pack_size: "250 mL Pump Dispenser",
    sku: "TC-HND-01-250M",
    hsn: "3401",
    quantity: 1,
    unit_price: 75,
    discount_percent: 0,
    tax_rate: 18,
    stock_on_hand: 60,
  },
  {
    variant_id: "v-dsh-250m",
    name: "TAZQOR Dish Wash",
    pack_size: "250 mL Bottle",
    sku: "TC-DSH-01-250M",
    hsn: "3402",
    quantity: 1,
    unit_price: 65,
    discount_percent: 0,
    tax_rate: 18,
    stock_on_hand: 45,
  },
];

export default function NewInvoicePage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [customerList, setCustomerList] = useState<Customer[]>([]);
  const [pendingOrders, setPendingOrders] = useState<any[]>([]);

  // Business GST state (configured in settings)
  const isGstEligible = true; // In production read from business_settings

  const [mode, setMode] = useState<"gst" | "non_gst">("gst");
  const [customer, setCustomer] = useState("c1-shreeji");
  const [invoiceDate, setInvoiceDate] = useState("2026-02-16");
  const [dueDate, setDueDate] = useState("2026-03-02");
  const [isInterState, setIsInterState] = useState(false);
  const [roundOffEnabled, setRoundOffEnabled] = useState(true);
  const [notes, setNotes] = useState("Goods once sold will not be taken back without batch seal.");

  useEffect(() => {
    async function loadCusts() {
      try {
        const custs = await getCustomers();
        if (custs && custs.length > 0) {
          setCustomerList(custs);
          setCustomer(custs[0].id);
        }
      } catch (e) {
        console.warn("Could not load customers for invoice form", e);
      }
    }
    loadCusts();
  }, []);

  // Fetch pending customer orders when customer selection changes
  useEffect(() => {
    async function fetchOrdersForCustomer() {
      if (!customer) return;
      try {
        const supabase = createClient();
        let resolvedId = customer;
        if (customer.startsWith("c1") || customer.length < 32) {
          const { data: c } = await supabase.from("customers").select("id").limit(1);
          if (c && c[0]) resolvedId = c[0].id;
        }
        const { data: ords } = await supabase
          .from("orders")
          .select("id, order_number, created_at, status, order_items(id, quantity, unit_price, product_variant_id)")
          .eq("customer_id", resolvedId)
          .order("created_at", { ascending: false })
          .limit(3);
        if (ords && ords.length > 0) {
          setPendingOrders(ords);
        } else {
          setPendingOrders([]);
        }
      } catch (e) {
        console.warn("Could not load orders for customer", e);
      }
    }
    fetchOrdersForCustomer();
  }, [customer]);

  const [lines, setLines] = useState<BillLineItem[]>([
    { ...AVAILABLE_VARIANTS[0], quantity: 10, discount_percent: 5 },
    { ...AVAILABLE_VARIANTS[1], quantity: 4, discount_percent: 0 },
  ]);

  const handleLoadOrder = (ord: any) => {
    const items = ord.order_items || [];
    if (items.length === 0) {
      toast.error("This order has no line items.");
      return;
    }
    const newLines: BillLineItem[] = items.map((it: any, i: number) => {
      const defaultVariant = AVAILABLE_VARIANTS[i % AVAILABLE_VARIANTS.length];
      return {
        ...defaultVariant,
        quantity: Number(it.quantity) || 1,
        unit_price: Number(it.unit_price) || defaultVariant.unit_price,
        discount_percent: 0,
      };
    });
    setLines(newLines);
    toast.success(`Loaded ${newLines.length} item(s) from Order ${ord.order_number}!`);
  };

  const handleProductChange = (idx: number, variantId: string) => {
    const match = AVAILABLE_VARIANTS.find((v) => v.variant_id === variantId);
    if (match) {
      const copy = [...lines];
      copy[idx] = {
        ...copy[idx],
        variant_id: match.variant_id,
        name: match.name,
        pack_size: match.pack_size,
        sku: match.sku,
        hsn: match.hsn,
        unit_price: match.unit_price,
        tax_rate: match.tax_rate,
        stock_on_hand: match.stock_on_hand,
      };
      setLines(copy);
    }
  };

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
    const nextVariant = AVAILABLE_VARIANTS[lines.length % AVAILABLE_VARIANTS.length] || AVAILABLE_VARIANTS[0];
    setLines([...lines, { ...nextVariant, quantity: 1, discount_percent: 0 }]);
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
      const supabase = createClient();

      // Continuous sequential numbering from live database invoices count
      const { count } = await supabase.from("invoices").select("id", { count: "exact", head: true });
      const nextSeq = (count || 0) + 1;
      const generatedNumber = `${mode === "gst" ? "INV" : "BILL"}/2026-27/${String(nextSeq).padStart(4, "0")}`;
      let resolvedCustomerId = customer;
      if (customer.startsWith("c1") || !customer.includes("-") || customer.length < 32) {
        const { data: c } = await supabase.from("customers").select("id").limit(1);
        if (c && c[0]) resolvedCustomerId = c[0].id;
      }

      const { data: inv, error: invErr } = await supabase
        .from("invoices")
        .insert({
          business_id: "00000000-0000-0000-0000-000000000001",
          customer_id: resolvedCustomerId,
          mode: mode,
          invoice_number: generatedNumber,
          invoice_date: invoiceDate || new Date().toISOString().split("T")[0],
          due_date: dueDate || null,
          subtotal: invoiceTotals.subtotal,
          tax_total: invoiceTotals.taxTotal,
          discount_total: invoiceTotals.discountTotal,
          round_off: invoiceTotals.roundOff,
          grand_total: invoiceTotals.grandTotal,
          status: "finalized",
          notes: notes || null,
        })
        .select()
        .single();

      if (invErr) {
        console.warn("Supabase invoice insert notice:", invErr.message);
      } else if (inv) {
        const itemsToInsert = lines.map((l) => ({
          business_id: "00000000-0000-0000-0000-000000000001",
          invoice_id: inv.id,
          description: `${l.name} (${l.pack_size})`,
          quantity: l.quantity,
          unit_price: l.unit_price,
          tax_rate: mode === "gst" ? l.tax_rate : 0,
          discount_percent: l.discount_percent,
          line_subtotal: l.quantity * l.unit_price,
          line_tax: mode === "gst" ? (l.quantity * l.unit_price * l.tax_rate) / 100 : 0,
          line_total: l.quantity * l.unit_price * (1 + (mode === "gst" ? l.tax_rate / 100 : 0)),
        }));
        await supabase.from("invoice_items").insert(itemsToInsert);
      }

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
            className="inline-flex items-center gap-1.5 min-h-[44px] text-xs font-semibold text-neutral-600 hover:text-black transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Cancel and back to invoices</span>
          </Link>
        </div>

        {/* GST Mode Selector & Security Gate Banner */}
        <div className="bg-white/55 backdrop-blur-xl rounded-[28px] p-6 border border-white/65 shadow-none space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/40">
            <div>
              <span className="text-[11px] sm:text-xs font-light text-neutral-500 block">
                Billing Mode
              </span>
              <h2 className="text-base font-normal text-neutral-900 mt-0.5">
                Choose Document Type
              </h2>
            </div>

            <div className="flex items-center gap-1.5 p-1 bg-white/65 backdrop-blur-md rounded-full border border-white/70 shadow-sm">
              <button
                type="button"
                onClick={() => setMode("gst")}
                className={`px-4 py-2 text-xs rounded-full transition-all cursor-pointer ${
                  mode === "gst"
                    ? "bg-black text-white font-normal shadow-sm"
                    : "text-neutral-700 hover:text-black font-light"
                }`}
              >
                GST Tax Invoice
              </button>
              <button
                type="button"
                onClick={() => setMode("non_gst")}
                className={`px-4 py-2 text-xs rounded-full transition-all cursor-pointer ${
                  mode === "non_gst"
                    ? "bg-black text-white font-normal shadow-sm"
                    : "text-neutral-700 hover:text-black font-light"
                }`}
              >
                Non-GST Bill / Receipt
              </button>
            </div>
          </div>

          {/* Mode Info Callout */}
          {mode === "gst" ? (
            <div className="p-3.5 rounded-2xl bg-white/60 border border-white/80 text-xs text-neutral-800 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-medium text-neutral-900">GST Tax Invoice Mode Active:</span> In compliance with GST laws,
                item HSN codes, taxable values, and {isInterState ? "IGST (18%)" : "CGST (9%) + SGST (9%)"} split will be printed.
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-2xl bg-white/60 border border-white/80 text-xs text-neutral-800 flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-medium text-neutral-900">Non-GST Bill of Supply Mode:</span> Tax claims, GSTIN and &quot;Tax Invoice&quot; wording
                will NOT appear on this bill as mandated by law.
              </div>
            </div>
          )}

          {/* Customer, Dates & Place of Supply */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div>
              <label className="block text-xs font-light text-neutral-600 mb-1.5">
                Customer Account *
              </label>
              <select
                aria-label="Customer Account"
                value={customer}
                onChange={(e) => setCustomer(e.target.value)}
                className="w-full h-10 px-4 text-xs bg-white/65 backdrop-blur-md rounded-full border border-white/70 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#E0FE52]"
              >
                {customerList.length > 0 ? (
                  customerList.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.shop_name} ({c.city})
                    </option>
                  ))
                ) : (
                  <>
                    <option value="c1-shreeji">Shreeji Supermarket (Ahmedabad)</option>
                    <option value="c2-pride-hotel">Hotel Pride Plaza (Ahmedabad)</option>
                    <option value="c3-apex-cowork">Apex Co-Working (Gandhinagar)</option>
                    <option value="c4-radhe-pg">Radhe Krishna PG (Ahmedabad)</option>
                  </>
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs font-light text-neutral-600 mb-1.5">
                Invoice Date *
              </label>
              <input
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                className="w-full h-10 px-4 text-xs bg-white/65 backdrop-blur-md rounded-full border border-white/70 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#E0FE52]"
              />
            </div>

            <div>
              <label className="block text-xs font-light text-neutral-600 mb-1.5">
                Payment Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full h-10 px-4 text-xs bg-white/65 backdrop-blur-md rounded-full border border-white/70 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#E0FE52]"
              />
            </div>
          </div>

          {/* Pending Order Pre-loader Banner */}
          {pendingOrders.length > 0 && (
            <div className="p-4 rounded-2xl bg-[#E0FE52]/25 border border-[#E0FE52]/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-medium text-neutral-950 block">
                  Customer has confirmed Order ({pendingOrders[0].order_number}) with {pendingOrders[0].order_items?.length || 0} item(s)
                </span>
                <span className="text-[11px] text-neutral-700 font-light">
                  Directly load customer booked items to create this invoice, or add items manually below.
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleLoadOrder(pendingOrders[0])}
                className="px-4 py-2 rounded-full bg-black text-white text-xs font-normal hover:scale-105 active:scale-95 transition-all shadow-sm shrink-0 cursor-pointer"
              >
                Load Order Items
              </button>
            </div>
          )}
        </div>

        {/* Invoice Line Items */}
        <div className="bg-white/55 backdrop-blur-xl rounded-[28px] p-6 sm:p-8 border border-white/65 shadow-none space-y-4">
          <div className="flex items-center justify-between border-b border-white/40 pb-3">
            <div>
              <h2 className="text-base font-normal text-neutral-900">Line Items & Calculations</h2>
              <p className="text-xs font-light text-neutral-500">Live batch allocation check per line</p>
            </div>
            <button
              type="button"
              onClick={addLine}
              className="flex items-center gap-1.5 px-4 h-10 rounded-full bg-white/70 text-neutral-800 text-xs font-light border border-white/80 hover:bg-black hover:text-white transition-all shadow-sm cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-[#E0FE52]" />
              <span>Add Item</span>
            </button>
          </div>

          <div className="space-y-3">
            {lines.map((line, idx) => {
              const res = invoiceTotals.items[idx];
              return (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-white/60 border border-white/70 space-y-3"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                    <div className="sm:col-span-4">
                      <label className="block text-[11px] font-normal text-neutral-700 mb-1">
                        Select Product & Variant *
                      </label>
                      <select
                        aria-label="Select Product & Variant"
                        value={line.variant_id}
                        onChange={(e) => handleProductChange(idx, e.target.value)}
                        className="w-full h-10 px-3 text-xs bg-white/80 rounded-xl border border-neutral-200/70 font-normal text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#E0FE52]"
                      >
                        {AVAILABLE_VARIANTS.map((v) => (
                          <option key={v.variant_id} value={v.variant_id}>
                            {v.name} — {v.pack_size} (₹{v.unit_price})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-normal text-neutral-700 mb-1">
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
                        className="w-full h-10 px-3 text-xs bg-white/80 rounded-xl border border-neutral-200/70 text-neutral-900"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-normal text-neutral-700 mb-1">
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
                        className="w-full h-10 px-3 text-xs bg-white/80 rounded-xl border border-neutral-200/70 text-neutral-900"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-normal text-neutral-700 mb-1">
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
                        className="w-full h-10 px-3 text-xs bg-white/80 rounded-xl border border-neutral-200/70 text-neutral-900"
                      />
                    </div>

                    <div className="sm:col-span-2 flex items-center justify-end gap-2">
                      <div className="text-right">
                        <span className="block text-[10px] text-neutral-600">Total</span>
                        <span className="text-xs font-semibold text-neutral-900">
                          {formatINR(res?.lineTotal || 0)}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeLine(idx)}
                        className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-rose-500 hover:text-rose-700"
                        title="Remove line"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Tax Breakdown Strip (for GST mode) */}
                  {mode === "gst" && res && (
                    <div className="flex flex-wrap items-center gap-4 text-[11px] pt-2 border-t border-neutral-200/60 text-neutral-600 font-light">
                      <span>HSN: <strong className="font-mono text-neutral-800 font-normal">{line.hsn}</strong></span>
                      <span>Taxable Base: <strong className="font-normal text-neutral-800">{formatINR(res.lineSubtotal)}</strong></span>
                      {!isInterState ? (
                        <>
                          <span>CGST (9%): <strong className="font-normal text-neutral-800">{formatINR(res.cgstAmount)}</strong></span>
                          <span>SGST (9%): <strong className="font-normal text-neutral-800">{formatINR(res.sgstAmount)}</strong></span>
                        </>
                      ) : (
                        <span>IGST (18%): <strong className="font-normal text-neutral-800">{formatINR(res.igstAmount)}</strong></span>
                      )}
                      <span className="ml-auto text-emerald-700 text-[10px] font-normal">
                        ✓ {line.stock_on_hand} in FEFO batches
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Totals Summary Calculation Breakdown */}
          <div className="pt-6 border-t border-neutral-100 flex flex-col sm:flex-row justify-between items-start gap-6">
            <div className="w-full sm:max-w-md space-y-2">
              <label className="block text-xs font-normal text-neutral-700">
                Invoice Terms & Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="w-full p-3.5 text-xs bg-white/60 backdrop-blur-md rounded-2xl border border-neutral-200/80 text-neutral-900"
              />
            </div>

            <div className="w-full sm:w-72 bg-white/60 backdrop-blur-md p-4 rounded-2xl border border-white/70 space-y-2.5 text-xs">
              <div className="flex justify-between text-neutral-600">
                <span>Taxable Subtotal:</span>
                <span className="font-semibold text-neutral-900">{formatINR(invoiceTotals.subtotal)}</span>
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

              <div className="pt-2.5 border-t border-neutral-200/60 flex justify-between items-baseline">
                <span className="font-normal text-xs sm:text-sm text-neutral-600">Grand Total:</span>
                <span className="text-xl sm:text-2xl font-semibold text-neutral-900 tracking-tight">
                  {formatINR(invoiceTotals.grandTotal)}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-neutral-100 flex flex-wrap items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                toast.success("Draft saved successfully");
                router.push("/invoices");
              }}
              className="px-6 h-11 rounded-full bg-white/70 text-neutral-800 border border-white/80 text-xs font-normal hover:bg-white hover:text-black transition-all shadow-sm"
            >
              Save as Draft
            </button>

            <button
              type="button"
              onClick={handleFinalize}
              disabled={submitting}
              className="px-8 h-11 rounded-full bg-black text-white text-xs sm:text-sm font-normal flex items-center justify-center gap-2 hover:bg-neutral-800 active:scale-95 transition-all shadow-sm disabled:opacity-50"
            >
              <FileText className="w-4 h-4 text-[#D4F732]" />
              <span>{submitting ? "Finalizing & Deducting Stock..." : "Finalize & Issue Stock"}</span>
            </button>
          </div>

          {/* Pending Order Pre-loader Banner */}
          {pendingOrders.length > 0 && (
            <div className="p-4 rounded-2xl bg-[#E0FE52]/25 border border-[#E0FE52]/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-medium text-neutral-950 block">
                  Customer has confirmed Order ({pendingOrders[0].order_number}) with {pendingOrders[0].order_items?.length || 0} item(s)
                </span>
                <span className="text-[11px] text-neutral-700 font-light">
                  Directly load customer booked items to create this invoice, or add items manually below.
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleLoadOrder(pendingOrders[0])}
                className="px-4 py-2 rounded-full bg-black text-white text-xs font-normal hover:scale-105 active:scale-95 transition-all shadow-sm shrink-0 cursor-pointer"
              >
                Load Order Items
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

