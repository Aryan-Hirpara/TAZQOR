"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  Trash2,
  FileText,
  CheckCircle2,
  ShieldAlert,
  Save,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { TopHeader } from "@/components/layout/TopHeader";
import { calculateInvoice, LineItemCalculationInput } from "@/lib/calculations/money";
import { formatINR } from "@/lib/formatting/currency";
import { getCustomers, Customer } from "@/lib/services/customers";
import { getProducts } from "@/lib/services/products";
import { createClient } from "@/lib/supabase/client";
import { StyledSelect } from "@/components/ui/StyledSelect";

interface VariantOption {
  variant_id: string;
  name: string;
  pack_size: string;
  sku: string;
  hsn: string;
  unit_price: number;
  tax_rate: number;
  stock_on_hand: number;
}

interface BillLineItem extends VariantOption {
  quantity: number;
  discount_percent: number;
}

function getDefaultDates() {
  const today = new Date();
  const due = new Date(today.getTime() + 15 * 86400000);
  return {
    today: today.toISOString().split("T")[0],
    due: due.toISOString().split("T")[0],
  };
}

function NewInvoiceForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialOrderId = searchParams.get("order_id");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [customerList, setCustomerList] = useState<Customer[]>([]);
  const [variants, setVariants] = useState<VariantOption[]>([]);
  const [pendingOrders, setPendingOrders] = useState<any[]>([]);
  const [sourceOrderId, setSourceOrderId] = useState<string | null>(initialOrderId);

  const [gstEligible, setGstEligible] = useState(false);
  const [businessState, setBusinessState] = useState("Gujarat");
  const [mode, setMode] = useState<"gst" | "non_gst">("non_gst");
  const [customer, setCustomer] = useState("");

  const defaults = useMemo(() => getDefaultDates(), []);
  const [invoiceDate, setInvoiceDate] = useState(defaults.today);
  const [dueDate, setDueDate] = useState(defaults.due);
  const [isInterState, setIsInterState] = useState(false);
  const [roundOffEnabled, setRoundOffEnabled] = useState(true);
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<BillLineItem[]>([]);

  useEffect(() => {
    async function loadInitialData() {
      setLoading(true);
      try {
        const supabase = createClient();
        const [custs, prods, { data: settings }] = await Promise.all([
          getCustomers(),
          getProducts(),
          supabase
            .from("business_settings")
            .select("gst_enabled, gst_confirmed, gstin, state, round_off_enabled")
            .eq("business_id", "00000000-0000-0000-0000-000000000001")
            .maybeSingle(),
        ]);

        setCustomerList(custs);

        const flatVariants: VariantOption[] = [];
        for (const p of prods) {
          if (p.status !== "active") continue;
          for (const v of p.variants) {
            flatVariants.push({
              variant_id: v.id,
              name: p.name,
              pack_size: v.pack_size || v.name || "Standard",
              sku: v.sku || p.sku || "",
              hsn: p.hsn || "",
              unit_price: Number(v.selling_price) || 0,
              tax_rate: Number(v.tax_rate) || 18,
              stock_on_hand: Number(v.current_stock) || 0,
            });
          }
        }
        setVariants(flatVariants);

        const isGstReady = Boolean(
          settings?.gst_enabled &&
            settings?.gst_confirmed &&
            settings?.gstin &&
            settings.gstin.trim().length === 15
        );
        setGstEligible(isGstReady);
        setMode(isGstReady ? "gst" : "non_gst");
        if (settings?.state) setBusinessState(settings.state);
        if (typeof settings?.round_off_enabled === "boolean") {
          setRoundOffEnabled(settings.round_off_enabled);
        }

        // If ?order_id=... is provided, prefill customer & order items directly
        if (initialOrderId) {
          const { data: ord } = await supabase
            .from("orders")
            .select("id, order_number, customer_id, order_items(*)")
            .eq("id", initialOrderId)
            .maybeSingle();

          if (ord) {
            setCustomer(ord.customer_id);
            setSourceOrderId(ord.id);
            const loadedLines: BillLineItem[] = (ord.order_items || [])
              .map((it: any) => {
                const matched = flatVariants.find((v) => v.variant_id === it.product_variant_id);
                if (!matched) return null;
                return {
                  ...matched,
                  quantity: Number(it.quantity) || 1,
                  unit_price: Number(it.unit_price) || matched.unit_price,
                  discount_percent: 0,
                };
              })
              .filter(Boolean) as BillLineItem[];
            if (loadedLines.length > 0) {
              setLines(loadedLines);
              setLoading(false);
              return;
            }
          }
        }

        if (custs.length > 0) {
          setCustomer(custs[0].id);
        }
        if (flatVariants.length > 0) {
          setLines([
            {
              ...flatVariants[0],
              quantity: 1,
              discount_percent: 0,
            },
          ]);
        }
      } catch (e) {
        console.warn("Could not load invoice form data:", e);
      } finally {
        setLoading(false);
      }
    }
    loadInitialData();
  }, [initialOrderId]);

  useEffect(() => {
    async function fetchOrdersForCustomer() {
      if (!customer) {
        setPendingOrders([]);
        return;
      }
      try {
        const supabase = createClient();
        const { data: ords } = await supabase
          .from("orders")
          .select("id, order_number, created_at, status, order_items(id, quantity, unit_price, product_variant_id)")
          .eq("customer_id", customer)
          .neq("status", "cancelled")
          .order("created_at", { ascending: false })
          .limit(3);

        setPendingOrders(ords || []);
      } catch (e) {
        console.warn("Could not load orders for customer", e);
      }
    }
    fetchOrdersForCustomer();
  }, [customer]);

  const handleLoadOrder = (ord: any) => {
    const items = ord.order_items || [];
    if (items.length === 0) {
      toast.error("This order has no line items.");
      return;
    }
    const newLines: BillLineItem[] = items
      .map((it: any) => {
        const matched = variants.find((v) => v.variant_id === it.product_variant_id);
        if (!matched) return null;
        return {
          ...matched,
          quantity: Number(it.quantity) || 1,
          unit_price: Number(it.unit_price) || matched.unit_price,
          discount_percent: 0,
        };
      })
      .filter(Boolean) as BillLineItem[];

    if (newLines.length === 0) {
      toast.error("Products from this order are no longer active in catalog.");
      return;
    }
    setSourceOrderId(ord.id);
    setLines(newLines);
    toast.success(`Loaded ${newLines.length} item(s) from Order ${ord.order_number}`);
  };

  const handleProductChange = (idx: number, variantId: string) => {
    const match = variants.find((v) => v.variant_id === variantId);
    if (!match) return;
    const copy = [...lines];
    copy[idx] = {
      ...copy[idx],
      ...match,
    };
    setLines(copy);
  };

  const calculationInputs: LineItemCalculationInput[] = useMemo(() => {
    return lines.map((l) => ({
      quantity: l.quantity,
      unitPrice: l.unit_price,
      discountPercent: l.discount_percent,
      taxRatePercent: mode === "gst" ? l.tax_rate : 0,
      isTaxInclusive: false,
      isInterState,
    }));
  }, [lines, mode, isInterState]);

  const invoiceTotals = useMemo(() => {
    return calculateInvoice(calculationInputs, roundOffEnabled);
  }, [calculationInputs, roundOffEnabled]);

  const addLine = () => {
    if (variants.length === 0) {
      toast.error("Add a product first before adding invoice items");
      return;
    }
    const nextVariant = variants[lines.length % variants.length];
    setLines([...lines, { ...nextVariant, quantity: 1, discount_percent: 0 }]);
  };

  const removeLine = (idx: number) => {
    if (lines.length <= 1) {
      toast.error("Invoice must contain at least one line item");
      return;
    }
    setLines(lines.filter((_, i) => i !== idx));
  };

  const submitInvoice = async (action: "draft" | "finalize") => {
    if (!customer) {
      toast.error("Please select a customer");
      return;
    }
    if (lines.length === 0 || lines.some((l) => !l.variant_id || l.quantity <= 0)) {
      toast.error("Please add at least one valid product line with quantity > 0");
      return;
    }

    if (action === "finalize") {
      if (mode === "gst" && !gstEligible) {
        toast.error("Configure a 15-character GSTIN and confirm GST eligibility in Settings before finalizing a GST Tax Invoice.");
        return;
      }
      for (const l of lines) {
        if (l.quantity > l.stock_on_hand) {
          toast.error(
            `Insufficient stock for ${l.name} (${l.pack_size}). Required: ${l.quantity}, On hand: ${l.stock_on_hand}`
          );
          return;
        }
      }
    }

    setSubmitting(true);
    try {
      const supabase = createClient();
      const selectedCust = customerList.find((c) => c.id === customer);
      const placeOfSupply = selectedCust?.state || businessState || null;

      const { data: inv, error: invErr } = await supabase
        .from("invoices")
        .insert({
          business_id: "00000000-0000-0000-0000-000000000001",
          customer_id: customer,
          order_id: sourceOrderId || null,
          mode,
          place_of_supply: placeOfSupply,
          invoice_date: invoiceDate || defaults.today,
          due_date: dueDate || null,
          subtotal: invoiceTotals.subtotal,
          discount_total: invoiceTotals.discountTotal,
          tax_total: invoiceTotals.taxTotal,
          round_off: invoiceTotals.roundOff,
          grand_total: invoiceTotals.grandTotal,
          status: "draft",
          notes: notes || null,
        })
        .select()
        .single();

      if (invErr || !inv) {
        throw new Error(invErr?.message || "Failed to save invoice");
      }

      const itemsToInsert = lines.map((l, idx) => {
        const calc = invoiceTotals.items[idx];
        return {
          business_id: "00000000-0000-0000-0000-000000000001",
          invoice_id: inv.id,
          product_variant_id: l.variant_id,
          description: `${l.name} (${l.pack_size})`,
          sku_snapshot: l.sku || null,
          hsn_snapshot: l.hsn || null,
          quantity: l.quantity,
          unit_price: l.unit_price,
          discount_percent: l.discount_percent,
          tax_rate: mode === "gst" ? l.tax_rate : 0,
          cgst_rate: calc?.cgstRate || 0,
          sgst_rate: calc?.sgstRate || 0,
          igst_rate: calc?.igstRate || 0,
          line_subtotal: calc?.lineSubtotal || 0,
          line_tax: calc?.taxAmount || 0,
          line_total: calc?.lineTotal || 0,
        };
      });

      const { error: itemsErr } = await supabase.from("invoice_items").insert(itemsToInsert);
      if (itemsErr) {
        await supabase.from("invoices").delete().eq("id", inv.id);
        throw new Error(itemsErr.message || "Failed to insert invoice line items");
      }

      if (action === "draft") {
        toast.success("Draft invoice saved!");
        router.push(`/invoices/${inv.id}`);
        return;
      }

      const idempKey =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `inv-${inv.id}-${Date.now()}`;

      const { data: rpcRes, error: rpcErr } = await supabase.rpc("finalize_invoice", {
        p_invoice_id: inv.id,
        p_idempotency_key: idempKey,
      });

      if (rpcErr) {
        // Leave as draft so user isn't lost, or inform them cleanly
        toast.error(`Saved as Draft — Finalization failed: ${rpcErr.message}`);
        router.push(`/invoices/${inv.id}`);
        return;
      }

      const invNum = (rpcRes as any)?.invoice_number || "Finalized";
      toast.success(`Invoice ${invNum} finalized and FEFO stock deducted!`);
      router.push(`/invoices/${inv.id}`);
    } catch (err: any) {
      toast.error(err?.message || "Failed to create invoice");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen pb-12">
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

        {loading ? (
          <div className="bg-white/55 backdrop-blur-xl rounded-[28px] p-10 text-center border border-white/65 text-xs text-neutral-500">
            Loading invoice settings, customers, and inventory...
          </div>
        ) : (
          <>
            {/* GST Mode Selector & Customer Details */}
            <div className="bg-white/55 backdrop-blur-xl rounded-[28px] p-6 border border-white/65 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/40">
                <div>
                  <span className="text-[11px] sm:text-xs font-light text-neutral-500 block">
                    Billing Mode
                  </span>
                  <h2 className="text-base font-normal text-neutral-900 mt-0.5">
                    Choose Document Type
                  </h2>
                </div>

                <div className="flex items-center gap-1.5 p-1 bg-white/65 backdrop-blur-md rounded-full border border-white/70">
                  <button
                    type="button"
                    onClick={() => setMode("gst")}
                    className={`px-4 py-2 text-xs rounded-full transition-all cursor-pointer ${
                      mode === "gst"
                        ? "bg-black text-white font-normal"
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
                        ? "bg-black text-white font-normal"
                        : "text-neutral-700 hover:text-black font-light"
                    }`}
                  >
                    Non-GST Bill / Receipt
                  </button>
                </div>
              </div>

              {mode === "gst" ? (
                gstEligible ? (
                  <div className="p-3.5 rounded-2xl bg-white/60 border border-white/80 text-xs text-neutral-800 flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-medium text-neutral-900">GST Tax Invoice Mode Active:</span>{" "}
                      HSN codes, taxable values, and {isInterState ? "IGST" : "CGST + SGST"} split will be recorded.
                    </div>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-2xl bg-amber-50/90 border border-amber-200 text-xs text-amber-900 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <span>
                        GSTIN &amp; GST confirmation are not completed in Settings yet. Finalizing a GST invoice requires valid GST setup.
                      </span>
                    </div>
                    <Link
                      href="/settings"
                      className="px-3.5 py-1.5 rounded-full bg-black text-white text-[11px] font-medium shrink-0"
                    >
                      Configure in Settings
                    </Link>
                  </div>
                )
              ) : (
                <div className="p-3.5 rounded-2xl bg-white/60 border border-white/80 text-xs text-neutral-800 flex items-start gap-2.5">
                  <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-medium text-neutral-900">Non-GST Bill of Supply Mode:</span>{" "}
                    Tax claims, GSTIN, and &quot;Tax Invoice&quot; wording will not appear on this bill.
                  </div>
                </div>
              )}

              {customerList.length === 0 ? (
                <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-200 text-xs text-amber-900 flex flex-wrap items-center justify-between gap-3">
                  <span>No active customers found. Add a customer to create an invoice.</span>
                  <Link
                    href="/customers/new"
                    className="px-4 py-2 rounded-full bg-black text-white text-xs font-medium"
                  >
                    + Add Customer
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                  <div className="min-w-0">
                    <label className="block text-xs font-light text-neutral-600 mb-1.5">
                      Customer Account *
                    </label>
                    <StyledSelect
                      aria-label="Customer Account"
                      value={customer}
                      onChange={(e) => setCustomer(e.target.value)}
                      className="h-10 py-0 text-xs bg-white/80 border-white/80"
                    >
                      {customerList.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.shop_name} {c.city ? `(${c.city})` : ""}
                        </option>
                      ))}
                    </StyledSelect>
                  </div>

                  <div className="min-w-0">
                    <label className="block text-xs font-light text-neutral-600 mb-1.5">
                      Invoice Date *
                    </label>
                    <input
                      type="date"
                      value={invoiceDate}
                      onChange={(e) => setInvoiceDate(e.target.value)}
                      className="w-full h-10 px-4 text-xs bg-white/80 rounded-full border border-white/80 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#D7FF00]"
                    />
                  </div>

                  <div className="min-w-0">
                    <label className="block text-xs font-light text-neutral-600 mb-1.5">
                      Payment Due Date
                    </label>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full h-10 px-4 text-xs bg-white/80 rounded-full border border-white/80 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#D7FF00]"
                    />
                  </div>
                </div>
              )}

              {mode === "gst" && (
                <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-neutral-700">
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isInterState}
                      onChange={(e) => setIsInterState(e.target.checked)}
                      className="rounded accent-black"
                    />
                    <span>Inter-State Supply (Apply IGST instead of CGST + SGST)</span>
                  </label>
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={roundOffEnabled}
                      onChange={(e) => setRoundOffEnabled(e.target.checked)}
                      className="rounded accent-black"
                    />
                    <span>Auto Round-off Total</span>
                  </label>
                </div>
              )}

              {/* Single Pending Order Pre-loader Banner */}
              {pendingOrders.length > 0 && (
                <div className="p-4 rounded-2xl bg-[#D7FF00]/25 border border-[#D7FF00]/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="min-w-0">
                    <span className="text-xs font-medium text-neutral-950 block">
                      Customer has recent Order ({pendingOrders[0].order_number}) with{" "}
                      {pendingOrders[0].order_items?.length || 0} item(s)
                    </span>
                    <span className="text-[11px] text-neutral-700 font-light">
                      Load booked order items into this bill or enter line items manually below.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleLoadOrder(pendingOrders[0])}
                    className="px-4 py-2 rounded-full bg-black text-white text-xs font-normal hover:scale-105 active:scale-95 transition-all shrink-0 cursor-pointer"
                  >
                    Load Order Items
                  </button>
                </div>
              )}
            </div>

            {/* Invoice Line Items */}
            <div className="bg-white/55 backdrop-blur-xl rounded-[28px] p-6 sm:p-8 border border-white/65 space-y-4">
              <div className="flex items-center justify-between border-b border-white/40 pb-3 gap-2">
                <div>
                  <h2 className="text-base font-normal text-neutral-900">Line Items &amp; Calculations</h2>
                  <p className="text-xs font-light text-neutral-500">
                    Live batch stock check per pack size
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addLine}
                  disabled={variants.length === 0}
                  className="flex items-center gap-1.5 px-4 h-10 rounded-full bg-white/75 text-neutral-800 text-xs font-medium border border-white/80 hover:bg-black hover:text-white transition-all cursor-pointer disabled:opacity-40 shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Item</span>
                </button>
              </div>

              {variants.length === 0 ? (
                <div className="p-6 rounded-2xl bg-white/50 border border-white/70 text-center space-y-3">
                  <p className="text-xs text-neutral-600">
                    No active products in catalog yet.
                  </p>
                  <Link
                    href="/products/new"
                    className="inline-flex items-center px-4 py-2 rounded-full bg-black text-white text-xs font-medium"
                  >
                    + Add Product
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {lines.map((line, idx) => {
                    const res = invoiceTotals.items[idx];
                    const hasStock = line.quantity <= line.stock_on_hand;
                    return (
                      <div
                        key={idx}
                        className="p-4 rounded-2xl bg-white/65 border border-white/80 space-y-3"
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                          <div className="sm:col-span-5 min-w-0">
                            <label className="block text-[11px] font-normal text-neutral-700 mb-1">
                              Select Product &amp; Variant *
                            </label>
                            <StyledSelect
                              aria-label="Select Product & Variant"
                              value={line.variant_id}
                              onChange={(e) => handleProductChange(idx, e.target.value)}
                              className="h-10 py-0 text-xs bg-white/95 border-neutral-200"
                            >
                              {variants.map((v) => (
                                <option key={v.variant_id} value={v.variant_id}>
                                  {v.name} — {v.pack_size} ({formatINR(v.unit_price)})
                                </option>
                              ))}
                            </StyledSelect>
                          </div>

                          <div className="sm:col-span-2 min-w-0">
                            <label className="block text-[11px] font-normal text-neutral-700 mb-1">
                              Qty (Units)
                            </label>
                            <input
                              type="number"
                              min="1"
                              step="any"
                              value={line.quantity}
                              onChange={(e) => {
                                const copy = [...lines];
                                copy[idx].quantity = Number(e.target.value);
                                setLines(copy);
                              }}
                              className="w-full h-10 px-3 text-xs bg-white/95 rounded-full border border-neutral-200 text-neutral-900"
                            />
                          </div>

                          <div className="sm:col-span-2 min-w-0">
                            <label className="block text-[11px] font-normal text-neutral-700 mb-1">
                              Price (₹)
                            </label>
                            <input
                              type="number"
                              min="0"
                              step="any"
                              value={line.unit_price}
                              onChange={(e) => {
                                const copy = [...lines];
                                copy[idx].unit_price = Number(e.target.value);
                                setLines(copy);
                              }}
                              className="w-full h-10 px-3 text-xs bg-white/95 rounded-full border border-neutral-200 text-neutral-900"
                            />
                          </div>

                          <div className="sm:col-span-1 min-w-0">
                            <label className="block text-[11px] font-normal text-neutral-700 mb-1">
                              Disc %
                            </label>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="any"
                              value={line.discount_percent}
                              onChange={(e) => {
                                const copy = [...lines];
                                copy[idx].discount_percent = Number(e.target.value);
                                setLines(copy);
                              }}
                              className="w-full h-10 px-2 text-xs bg-white/95 rounded-full border border-neutral-200 text-neutral-900 text-center"
                            />
                          </div>

                          <div className="sm:col-span-2 flex items-center justify-end gap-2 min-w-0">
                            <div className="text-right min-w-0">
                              <span className="block text-[10px] text-neutral-600">Total</span>
                              <span className="text-xs font-semibold text-neutral-900 truncate block">
                                {formatINR(res?.lineTotal || 0)}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeLine(idx)}
                              aria-label="Remove line"
                              className="p-2 min-w-[36px] min-h-[36px] flex items-center justify-center text-rose-500 hover:text-rose-700 rounded-full hover:bg-rose-50 cursor-pointer shrink-0"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 text-[11px] pt-2 border-t border-neutral-200/60 text-neutral-600 font-light">
                          {mode === "gst" && res && (
                            <>
                              <span>
                                HSN:{" "}
                                <strong className="font-mono text-neutral-800 font-normal">
                                  {line.hsn || "—"}
                                </strong>
                              </span>
                              <span>
                                Taxable:{" "}
                                <strong className="font-normal text-neutral-800">
                                  {formatINR(res.lineSubtotal)}
                                </strong>
                              </span>
                              {!isInterState ? (
                                <>
                                  <span>
                                    CGST ({res.cgstRate}%):{" "}
                                    <strong className="font-normal text-neutral-800">
                                      {formatINR(res.cgstAmount)}
                                    </strong>
                                  </span>
                                  <span>
                                    SGST ({res.sgstRate}%):{" "}
                                    <strong className="font-normal text-neutral-800">
                                      {formatINR(res.sgstAmount)}
                                    </strong>
                                  </span>
                                </>
                              ) : (
                                <span>
                                  IGST ({res.igstRate}%):{" "}
                                  <strong className="font-normal text-neutral-800">
                                    {formatINR(res.igstAmount)}
                                  </strong>
                                </span>
                              )}
                            </>
                          )}
                          <span
                            className={`ml-auto text-[10px] font-medium ${
                              hasStock ? "text-emerald-700" : "text-amber-700"
                            }`}
                          >
                            {hasStock ? "✓" : "!"} {line.stock_on_hand} in FEFO batches
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Totals Summary */}
              <div className="pt-6 border-t border-neutral-100 flex flex-col sm:flex-row justify-between items-start gap-6">
                <div className="w-full sm:max-w-md space-y-2">
                  <label className="block text-xs font-normal text-neutral-700">
                    Invoice Terms &amp; Notes
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Payment terms or delivery notes (optional)"
                    rows={2}
                    className="w-full p-3.5 text-xs bg-white/75 rounded-2xl border border-neutral-200/80 text-neutral-900"
                  />
                </div>

                <div className="w-full sm:w-72 bg-white/70 p-4 rounded-2xl border border-white/80 space-y-2.5 text-xs">
                  <div className="flex justify-between text-neutral-600">
                    <span>Taxable Subtotal:</span>
                    <span className="font-semibold text-neutral-900">
                      {formatINR(invoiceTotals.subtotal)}
                    </span>
                  </div>

                  {invoiceTotals.discountTotal > 0 && (
                    <div className="flex justify-between text-emerald-700">
                      <span>Total Discount:</span>
                      <span className="font-semibold">
                        -{formatINR(invoiceTotals.discountTotal)}
                      </span>
                    </div>
                  )}

                  {mode === "gst" && (
                    !isInterState ? (
                      <>
                        <div className="flex justify-between text-gray-600">
                          <span>CGST:</span>
                          <span className="font-semibold text-gray-900">
                            {formatINR(invoiceTotals.cgstTotal)}
                          </span>
                        </div>
                        <div className="flex justify-between text-gray-600">
                          <span>SGST:</span>
                          <span className="font-semibold text-gray-900">
                            {formatINR(invoiceTotals.sgstTotal)}
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="flex justify-between text-gray-600">
                        <span>IGST:</span>
                        <span className="font-semibold text-gray-900">
                          {formatINR(invoiceTotals.igstTotal)}
                        </span>
                      </div>
                    )
                  )}

                  {roundOffEnabled && (
                    <div className="flex justify-between text-gray-500 text-[11px]">
                      <span>Round off:</span>
                      <span>
                        {invoiceTotals.roundOff >= 0
                          ? `+${invoiceTotals.roundOff.toFixed(2)}`
                          : invoiceTotals.roundOff.toFixed(2)}
                      </span>
                    </div>
                  )}

                  <div className="pt-2.5 border-t border-neutral-200/60 flex justify-between items-baseline">
                    <span className="font-normal text-xs sm:text-sm text-neutral-600">
                      Grand Total:
                    </span>
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
                  disabled={submitting || !customer || lines.length === 0}
                  onClick={() => void submitInvoice("draft")}
                  className="px-6 h-11 rounded-full bg-white/80 text-neutral-800 border border-black/10 text-xs font-medium flex items-center gap-2 hover:bg-white transition-all cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save as Draft</span>
                </button>

                <button
                  type="button"
                  onClick={() => void submitInvoice("finalize")}
                  disabled={submitting || !customer || lines.length === 0}
                  className="px-8 h-11 rounded-full bg-black text-white text-xs sm:text-sm font-normal flex items-center justify-center gap-2 hover:bg-neutral-800 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                >
                  <FileText className="w-4 h-4 text-[#D7FF00]" />
                  <span>{submitting ? "Finalizing & Deducting Stock..." : "Finalize & Issue Stock"}</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function NewInvoicePage() {
  return (
    <Suspense
      fallback={<div className="p-10 text-center text-xs text-neutral-500">Loading invoice form...</div>}
    >
      <NewInvoiceForm />
    </Suspense>
  );
}
