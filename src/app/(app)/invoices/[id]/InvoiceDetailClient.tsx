"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Printer,
  Download,
  Loader2,
  Ban,
  CheckCircle2,
  Trash2,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { TopHeader } from "@/components/layout/TopHeader";
import { formatINR } from "@/lib/formatting/currency";
import { TazqorLogo } from "@/components/brand/TazqorLogo";
import { createClient } from "@/lib/supabase/client";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

export default function InvoiceDetailClient({ id }: { id: string }) {
  const router = useRouter();
  const [confirmKind, setConfirmKind] = useState<"cancel" | "delete" | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [finalizing, setFinalizing] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [loading, setLoading] = useState(true);
  const [invoice, setInvoice] = useState<any>(null);

  const [bankDetails, setBankDetails] = useState({
    accountName: "",
    bankName: "",
    accountNo: "",
    ifsc: "",
    upiId: "",
  });
  const [editingBank, setEditingBank] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("tazqor_bank_details");
      if (saved) {
        try {
          setBankDetails(JSON.parse(saved));
        } catch {}
      }
    }
  }, []);

  const loadInvoice = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = createClient();

      const { data: invRow } = await supabase
        .from("invoices")
        .select(
          "*, customers(*), invoice_items(*, invoice_item_batches(quantity_allocated, batches(batch_number)))"
        )
        .eq("id", id)
        .maybeSingle();

      if (!invRow) {
        setInvoice(null);
        return;
      }

      const [{ data: bizSettings }, { data: outRow }] = await Promise.all([
        supabase
          .from("business_settings")
          .select("*")
          .eq("business_id", invRow.business_id)
          .maybeSingle(),
        supabase
          .from("v_invoice_outstanding")
          .select("amount_paid, outstanding")
          .eq("invoice_id", invRow.id)
          .maybeSingle(),
      ]);

      const cust = (invRow.snapshot_customer as any) || invRow.customers || {};
      const snapBiz = (invRow.snapshot_business as any) || {};
      const bizName = bizSettings?.legal_name || snapBiz.name || "Your Business";

      const items = (invRow.invoice_items || []).map((it: any) => {
        const batches = (it.invoice_item_batches || [])
          .map((b: any) => b.batches?.batch_number)
          .filter(Boolean);
        const cgstRate = Number(it.cgst_rate) || 0;
        const sgstRate = Number(it.sgst_rate) || 0;
        const igstRate = Number(it.igst_rate) || 0;
        const taxAmt = Number(it.line_tax) || 0;
        const cgst = igstRate > 0 ? 0 : taxAmt / 2;
        const sgst = igstRate > 0 ? 0 : taxAmt / 2;

        return {
          name: it.description || "Product",
          sku: it.sku_snapshot || "—",
          hsn: it.hsn_snapshot || "—",
          batch: batches.length > 0 ? batches.join(", ") : "—",
          quantity: Number(it.quantity) || 0,
          unit_price: Number(it.unit_price) || 0,
          discount: Number(it.discount_percent) || 0,
          taxable: Number(it.line_subtotal) || 0,
          cgst,
          sgst,
          igst: igstRate > 0 ? taxAmt : 0,
          cgstRate,
          sgstRate,
          igstRate,
          total: Number(it.line_total) || 0,
        };
      });

      const grandTotal = Number(invRow.grand_total) || 0;
      const taxTotal = Number(invRow.tax_total) || 0;
      const subtotal = Number(invRow.subtotal) || Math.max(0, grandTotal - taxTotal);
      const isFinalized = invRow.status === "finalized";
      const isCancelled = invRow.status === "cancelled";

      const paidAmount = isFinalized && outRow ? Number(outRow.amount_paid) || 0 : 0;
      const outstanding = isCancelled
        ? 0
        : isFinalized && outRow
        ? Number(outRow.outstanding)
        : grandTotal;

      const cgstTotal = items.reduce((s: number, it: any) => s + it.cgst, 0);
      const sgstTotal = items.reduce((s: number, it: any) => s + it.sgst, 0);
      const igstTotal = items.reduce((s: number, it: any) => s + it.igst, 0);

      setInvoice({
        id: invRow.id,
        invoice_number: invRow.invoice_number || "DRAFT",
        mode: invRow.mode === "non_gst" ? "non_gst" : "gst",
        status: invRow.status || "draft",
        date: invRow.invoice_date || (invRow.created_at || "").split("T")[0],
        due_date: invRow.due_date || "—",
        place_of_supply: invRow.place_of_supply || cust.state || "—",
        notes: invRow.notes || "",
        business: {
          name: bizName,
          gstin: bizSettings?.gstin || snapBiz.gstin || "",
          address: [bizSettings?.address_line1, bizSettings?.address_line2].filter(Boolean).join(", "),
          city: [bizSettings?.city, bizSettings?.state, bizSettings?.pin].filter(Boolean).join(", "),
          phone: bizSettings?.phone || "",
          email: bizSettings?.email || "",
        },
        customer: {
          name: cust.shop_name || cust.name || "Customer",
          contact: cust.contact_person || cust.name || "",
          gstin: cust.customer_code || "",
          address: cust.delivery_address || cust.billing_address || "",
          city: [cust.city, cust.district, cust.state, cust.pin].filter(Boolean).join(", "),
          phone: cust.phone || "",
        },
        items,
        subtotal,
        discount_total: Number(invRow.discount_total) || 0,
        cgst_total: cgstTotal,
        sgst_total: sgstTotal,
        igst_total: igstTotal,
        round_off: Number(invRow.round_off) || 0,
        grand_total: grandTotal,
        paid_amount: paidAmount,
        outstanding,
      });
    } catch (e) {
      console.warn("Could not load invoice from Supabase", e);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadInvoice();
  }, [loadInvoice]);

  const handlePrint = () => {
    if (!invoice) return;
    const originalTitle = document.title;
    const safeNumber = (invoice.invoice_number || "Bill").replace(/[/\\?%*:|"<>]/g, "-");
    document.title = `Invoice_${safeNumber}`;
    window.print();
    setTimeout(() => {
      document.title = originalTitle;
    }, 1500);
  };

  const handleDownloadPdf = async () => {
    const invoiceEl = document.getElementById("printable-invoice");
    if (!invoiceEl || !invoice) {
      toast.error("Invoice document element not found");
      return;
    }

    setIsDownloadingPdf(true);
    const toastId = toast.loading("Generating invoice PDF...");

    try {
      const html2canvas = (await import("html2canvas-pro")).default;
      const { jsPDF } = await import("jspdf");

      const canvas = await html2canvas(invoiceEl, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
        windowWidth: 1024,
      });

      const imgData = canvas.toDataURL("image/jpeg", 0.95);
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 10;
      const printWidth = pageWidth - margin * 2;
      const printHeight = (canvas.height * printWidth) / canvas.width;

      pdf.addImage(imgData, "JPEG", margin, margin, printWidth, printHeight);

      const safeNumber = (invoice.invoice_number || "Bill").replace(/[/\\?%*:|"<>]/g, "-");
      const filename = `Invoice_${safeNumber}.pdf`;
      pdf.save(filename);

      toast.success(`${filename} downloaded!`, { id: toastId });
    } catch (err) {
      console.error("PDF generation error:", err);
      toast.error("Could not generate PDF. Please use Print Bill > Save as PDF.", { id: toastId });
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handleFinalizeDraft = async () => {
    if (!invoice || invoice.status !== "draft") return;
    setFinalizing(true);
    try {
      const supabase = createClient();
      const key =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `fin-${invoice.id}-${Date.now()}`;

      const { data, error } = await supabase.rpc("finalize_invoice", {
        p_invoice_id: invoice.id,
        p_idempotency_key: key,
      });

      if (error) {
        toast.error(error.message || "Could not finalize invoice");
        return;
      }
      toast.success(`Invoice finalized (${(data as any)?.invoice_number || ""})!`);
      await loadInvoice();
    } catch (err: any) {
      toast.error(err?.message || "Finalization error");
    } finally {
      setFinalizing(false);
    }
  };

  const handleConfirmModal = async () => {
    if (!invoice || !confirmKind) return;
    setConfirmLoading(true);
    setConfirmError(null);
    try {
      const supabase = createClient();
      if (confirmKind === "delete") {
        const { data, error } = await supabase
          .from("invoices")
          .delete()
          .eq("id", invoice.id)
          .select("id");
        if (error || !data || data.length === 0) {
          setConfirmError(error?.message || "Only draft invoices can be deleted.");
          return;
        }
        toast.success("Draft invoice deleted.");
        router.push("/invoices");
      } else {
        const { error } = await supabase.rpc("cancel_invoice", {
          p_invoice_id: invoice.id,
          p_reason: "Cancelled by user",
        });
        if (error) {
          setConfirmError(error.message);
          return;
        }
        toast.success("Invoice cancelled and allocated stock returned.");
        setConfirmKind(null);
        await loadInvoice();
      }
    } catch (err: any) {
      setConfirmError(err?.message || "Action failed");
    } finally {
      setConfirmLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen p-12 text-center text-xs text-neutral-500 font-light flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-black" />
        <span>Loading invoice from database...</span>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen p-12 text-center text-xs text-neutral-500 font-light space-y-4">
        <AlertCircle className="w-8 h-8 mx-auto text-neutral-400" />
        <p className="font-semibold text-neutral-800">Invoice not found</p>
        <Link href="/invoices" className="inline-block px-4 py-2 rounded-full bg-black text-white text-xs">
          Back to Invoices
        </Link>
      </div>
    );
  }

  const updateBankField = (field: keyof typeof bankDetails, val: string) => {
    const updated = { ...bankDetails, [field]: val };
    setBankDetails(updated);
    localStorage.setItem("tazqor_bank_details", JSON.stringify(updated));
  };

  const hasBankInfo = Boolean(
    bankDetails.bankName || bankDetails.accountNo || bankDetails.ifsc || bankDetails.upiId
  );

  return (
    <div className="min-h-screen">
      <div className="print:hidden">
        <TopHeader
          title={invoice.invoice_number}
          subtitle={`${invoice.status.toUpperCase()} • ${invoice.date} • Outstanding: ${formatINR(invoice.outstanding)}`}
        />
      </div>

      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-4xl mx-auto print:p-0 print:m-0 print:max-w-none print:space-y-0">
        {/* Actions Bar */}
        <div className="print:hidden flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/invoices"
            className="inline-flex items-center gap-1.5 min-h-[44px] text-xs font-semibold text-neutral-600 hover:text-black transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Invoices</span>
          </Link>

          <div className="flex flex-wrap items-center gap-2">
            {invoice.status === "draft" && (
              <>
                <button
                  type="button"
                  onClick={handleFinalizeDraft}
                  disabled={finalizing}
                  className="flex items-center gap-1.5 px-4 h-10 rounded-full bg-[#D7FF00] text-black text-xs font-semibold hover:brightness-95 transition-all disabled:opacity-50 cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{finalizing ? "Finalizing..." : "Finalize & Deduct Stock"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setConfirmError(null);
                    setConfirmKind("delete");
                  }}
                  className="flex items-center gap-1.5 px-4 h-10 rounded-full bg-rose-50 text-rose-700 text-xs font-semibold border border-rose-200 hover:bg-rose-100 transition-all cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Draft</span>
                </button>
              </>
            )}

            {invoice.status === "finalized" && (
              <button
                type="button"
                onClick={() => {
                  setConfirmError(null);
                  setConfirmKind("cancel");
                }}
                className="flex items-center gap-1.5 px-4 h-10 rounded-full bg-rose-50 text-rose-700 text-xs font-bold border border-rose-200 hover:bg-rose-100 transition-all cursor-pointer"
              >
                <Ban className="w-3.5 h-3.5" />
                <span>Cancel Invoice</span>
              </button>
            )}

            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 h-10 rounded-full bg-white/80 text-neutral-800 text-xs font-semibold border border-neutral-300/80 hover:bg-white transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-neutral-700" />
              <span>Print Bill</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isDownloadingPdf}
              className="flex items-center gap-1.5 px-5 h-10 rounded-full bg-[#0A0A0A] text-white text-xs font-semibold hover:bg-black/90 transition-all disabled:opacity-60 cursor-pointer"
            >
              {isDownloadingPdf ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#D7FF00]" />
              ) : (
                <Download className="w-3.5 h-3.5 text-[#D7FF00]" />
              )}
              <span>{isDownloadingPdf ? "Saving PDF..." : "Download PDF"}</span>
            </button>
          </div>
        </div>

        {/* Printable Document */}
        <div
          id="printable-invoice"
          className="printable-document bg-white rounded-3xl p-6 sm:p-10 border border-[#E5E4EE] shadow-lg text-xs print:p-0 print:border-none print:shadow-none print:rounded-none"
        >
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-gray-200 pb-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2 mb-2">
                <TazqorLogo className="h-8 w-auto object-contain" height={32} variant="black" />
              </div>
              <p className="text-gray-800 font-bold text-sm mt-1">{invoice.business.name}</p>
              {invoice.business.address && <p className="text-gray-500">{invoice.business.address}</p>}
              {invoice.business.city && <p className="text-gray-500">{invoice.business.city}</p>}
              {invoice.business.phone && (
                <p className="text-gray-700 font-medium">Phone: {invoice.business.phone}</p>
              )}
              {invoice.mode === "gst" && invoice.business.gstin && (
                <p className="font-mono font-bold text-gray-800">GSTIN: {invoice.business.gstin}</p>
              )}
            </div>

            <div className="sm:text-right space-y-1">
              <span className="text-xs font-extrabold tracking-wider uppercase px-3 py-1 rounded-full bg-[#0A0A0A] text-white inline-block">
                {invoice.mode === "gst" ? "TAX INVOICE" : "BILL OF SUPPLY"}
              </span>
              <h2 className="text-base font-mono font-black text-gray-900 mt-2">
                {invoice.invoice_number}
              </h2>
              <p className="text-gray-500">
                Date: <strong className="text-gray-800">{invoice.date}</strong>
              </p>
              <p className="text-gray-500">
                Due Date: <strong className="text-gray-800">{invoice.due_date}</strong>
              </p>
              <p className="text-gray-500">
                Place of Supply: <strong className="text-gray-800">{invoice.place_of_supply}</strong>
              </p>

              {invoice.status === "cancelled" && (
                <div className="inline-block px-3 py-1 bg-rose-100 text-rose-800 font-bold rounded-lg mt-2">
                  CANCELLED / VOID
                </div>
              )}
              {invoice.status === "draft" && (
                <div className="inline-block px-3 py-1 bg-amber-100 text-amber-800 font-bold rounded-lg mt-2">
                  DRAFT
                </div>
              )}
            </div>
          </div>

          {/* Bill To */}
          <div className="py-6 border-b border-gray-200 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-neutral-600 uppercase tracking-wider block">
                Billed To (Customer)
              </span>
              <h3 className="text-sm font-bold text-gray-900">{invoice.customer.name}</h3>
              {invoice.customer.contact && (
                <p className="text-gray-600">Attn: {invoice.customer.contact}</p>
              )}
              {invoice.customer.address && <p className="text-gray-500">{invoice.customer.address}</p>}
              {invoice.customer.city && <p className="text-gray-500">{invoice.customer.city}</p>}
              {invoice.customer.phone && <p className="text-gray-700">Phone: {invoice.customer.phone}</p>}
              {invoice.customer.gstin && (
                <p className="font-mono text-gray-700">Code / GSTIN: {invoice.customer.gstin}</p>
              )}
            </div>

            <div className="sm:text-right space-y-2">
              <span className="text-[10px] font-bold text-neutral-600 uppercase tracking-wider block">
                Payment Status
              </span>
              <div className="text-base font-black text-gray-900">
                {invoice.status === "cancelled" ? (
                  <span className="text-neutral-500">CANCELLED</span>
                ) : invoice.outstanding <= 0 ? (
                  <span className="text-emerald-600">PAID IN FULL</span>
                ) : (
                  <span className="text-rose-600">BALANCE DUE: {formatINR(invoice.outstanding)}</span>
                )}
              </div>
              <p className="text-gray-500 text-[11px]">
                Paid: {formatINR(invoice.paid_amount)} / Total: {formatINR(invoice.grand_total)}
              </p>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="py-6 border-b border-gray-200 table-wrapper">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-200 text-neutral-600 font-bold uppercase text-[10px]">
                  <th className="py-2 pr-3">Item Description</th>
                  <th className="py-2 px-2">HSN</th>
                  <th className="py-2 px-2">Batch</th>
                  <th className="py-2 px-2 text-right">Qty</th>
                  <th className="py-2 px-2 text-right">Rate</th>
                  <th className="py-2 px-2 text-right">Taxable</th>
                  {invoice.mode === "gst" && (
                    <>
                      <th className="py-2 px-2 text-right">CGST</th>
                      <th className="py-2 px-2 text-right">SGST</th>
                      {invoice.igst_total > 0 && <th className="py-2 px-2 text-right">IGST</th>}
                    </>
                  )}
                  <th className="py-2 pl-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {invoice.items.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-6 text-center text-gray-400">
                      No line items recorded on this invoice.
                    </td>
                  </tr>
                ) : (
                  invoice.items.map((item: any, i: number) => (
                    <tr key={i}>
                      <td className="py-3 pr-3 font-semibold text-gray-900">
                        <div>{item.name}</div>
                        {item.sku !== "—" && (
                          <div className="text-[10px] text-neutral-600 font-mono">{item.sku}</div>
                        )}
                      </td>
                      <td className="py-3 px-2 font-mono text-gray-600">{item.hsn}</td>
                      <td className="py-3 px-2 font-mono text-gray-600">{item.batch}</td>
                      <td className="py-3 px-2 text-right font-medium">{item.quantity}</td>
                      <td className="py-3 px-2 text-right">{formatINR(item.unit_price)}</td>
                      <td className="py-3 px-2 text-right">{formatINR(item.taxable)}</td>
                      {invoice.mode === "gst" && (
                        <>
                          <td className="py-3 px-2 text-right text-gray-600">{formatINR(item.cgst)}</td>
                          <td className="py-3 px-2 text-right text-gray-600">{formatINR(item.sgst)}</td>
                          {invoice.igst_total > 0 && (
                            <td className="py-3 px-2 text-right text-gray-600">{formatINR(item.igst)}</td>
                          )}
                        </>
                      )}
                      <td className="py-3 pl-2 text-right font-bold text-gray-900">{formatINR(item.total)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Totals Section */}
          <div className="pt-6 flex flex-col sm:flex-row justify-between gap-6">
            <div className="text-[11px] text-gray-500 max-w-sm">
              {invoice.notes && (
                <>
                  <p className="font-semibold text-gray-700 mb-1">Terms &amp; Notes:</p>
                  <p>{invoice.notes}</p>
                </>
              )}
            </div>

            <div className="w-full sm:w-72 space-y-2 text-xs">
              <div className="flex justify-between text-gray-600">
                <span>Taxable Amount:</span>
                <span className="font-semibold text-gray-900">{formatINR(invoice.subtotal)}</span>
              </div>

              {invoice.discount_total > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Discount:</span>
                  <span>-{formatINR(invoice.discount_total)}</span>
                </div>
              )}

              {invoice.mode === "gst" && (
                invoice.igst_total > 0 ? (
                  <div className="flex justify-between text-gray-600">
                    <span>IGST:</span>
                    <span>{formatINR(invoice.igst_total)}</span>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between text-gray-600">
                      <span>CGST:</span>
                      <span>{formatINR(invoice.cgst_total)}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>SGST:</span>
                      <span>{formatINR(invoice.sgst_total)}</span>
                    </div>
                  </>
                )
              )}

              <div className="flex justify-between text-neutral-600 text-[11px]">
                <span>Round off:</span>
                <span>{invoice.round_off.toFixed(2)}</span>
              </div>

              <div className="pt-2 border-t border-gray-200 flex justify-between items-baseline font-black text-sm text-gray-900">
                <span>Total Amount:</span>
                <span className="text-base">{formatINR(invoice.grand_total)}</span>
              </div>
            </div>
          </div>

          {/* Bank Details & Signatory */}
          <div className="mt-12 pt-8 border-t border-gray-200 grid grid-cols-1 sm:grid-cols-2 gap-8 text-[11px] text-gray-500">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <p className="font-bold text-gray-700">Bank Details for Payment:</p>
                <button
                  type="button"
                  onClick={() => setEditingBank(!editingBank)}
                  className="text-[10px] text-blue-600 hover:underline font-light print:hidden cursor-pointer"
                >
                  {editingBank ? "Done" : "Edit"}
                </button>
              </div>

              {editingBank ? (
                <div className="space-y-1.5 p-2.5 bg-neutral-50 rounded-xl border border-neutral-200 print:hidden text-xs">
                  <div>
                    <label className="text-[10px] text-neutral-500 block">Account Name</label>
                    <input
                      type="text"
                      value={bankDetails.accountName}
                      onChange={(e) => updateBankField("accountName", e.target.value)}
                      className="w-full h-7 px-2 text-xs border rounded bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-neutral-500 block">Bank Name</label>
                    <input
                      type="text"
                      value={bankDetails.bankName}
                      onChange={(e) => updateBankField("bankName", e.target.value)}
                      className="w-full h-7 px-2 text-xs border rounded bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-neutral-500 block">Account Number</label>
                    <input
                      type="text"
                      value={bankDetails.accountNo}
                      onChange={(e) => updateBankField("accountNo", e.target.value)}
                      className="w-full h-7 px-2 text-xs border rounded bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-neutral-500 block">IFSC Code</label>
                    <input
                      type="text"
                      value={bankDetails.ifsc}
                      onChange={(e) => updateBankField("ifsc", e.target.value)}
                      className="w-full h-7 px-2 text-xs border rounded bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-neutral-500 block">UPI ID</label>
                    <input
                      type="text"
                      value={bankDetails.upiId}
                      onChange={(e) => updateBankField("upiId", e.target.value)}
                      className="w-full h-7 px-2 text-xs border rounded bg-white"
                    />
                  </div>
                </div>
              ) : hasBankInfo ? (
                <>
                  {bankDetails.accountName && <p>Account Name: {bankDetails.accountName}</p>}
                  {bankDetails.bankName && <p>Bank: {bankDetails.bankName}</p>}
                  {bankDetails.accountNo && <p>A/C No: {bankDetails.accountNo}</p>}
                  {(bankDetails.ifsc || bankDetails.upiId) && (
                    <p>
                      {bankDetails.ifsc ? `IFSC: ${bankDetails.ifsc}` : ""}
                      {bankDetails.ifsc && bankDetails.upiId ? " • " : ""}
                      {bankDetails.upiId ? `UPI ID: ${bankDetails.upiId}` : ""}
                    </p>
                  )}
                </>
              ) : (
                <p className="text-neutral-400 italic">No bank details configured yet. Click Edit to add.</p>
              )}
            </div>

            <div className="sm:text-right flex flex-col justify-between sm:items-end">
              <p className="font-bold text-gray-700">For {invoice.business.name}</p>
              <div className="h-10" />
              <p className="border-t border-gray-300 pt-1 w-48 text-center text-neutral-600">
                Authorized Signatory
              </p>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(confirmKind)}
        title={
          confirmKind === "delete"
            ? "Delete draft invoice?"
            : `Cancel invoice ${invoice.invoice_number}?`
        }
        description={
          confirmKind === "delete"
            ? "This draft invoice will be permanently deleted."
            : "This reverses allocated FEFO stock movements and marks the invoice cancelled."
        }
        confirmLabel={confirmKind === "delete" ? "Delete Draft" : "Cancel Invoice"}
        loading={confirmLoading}
        error={confirmError}
        onConfirm={handleConfirmModal}
        onClose={() => !confirmLoading && setConfirmKind(null)}
      />
    </div>
  );
}
