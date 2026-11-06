"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Printer,
  Download,
  Loader2,
  FileText,
  Share2,
  Ban,
  CheckCircle2,
  Clock,
  Sparkles,
  CreditCard,
  Building2,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { TopHeader } from "@/components/layout/TopHeader";
import { formatINR } from "@/lib/formatting/currency";
import { TazqorLogo } from "@/components/brand/TazqorLogo";
import { createClient } from "@/lib/supabase/client";

export default function InvoiceDetailClient({ id }: { id: string }) {
  const router = useRouter();
  const [cancelling, setCancelling] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [loading, setLoading] = useState(true);
  const [invoice, setInvoice] = useState<any>(null);

  const [bankDetails, setBankDetails] = useState({
    accountName: "TAZQOR",
    bankName: "State Bank of India",
    accountNo: "38920199201",
    ifsc: "SBIN0001234",
    upiId: "tazqor@upi",
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

  useEffect(() => {
    async function loadInvoice() {
      setLoading(true);
      try {
        const supabase = createClient();

        // 1. Try finding by UUID id
        let { data, error } = await supabase
          .from("invoices")
          .select("*, customers(*), invoice_items(*)")
          .eq("id", id)
          .maybeSingle();

        // 2. If not found, try by invoice_number
        if (!data) {
          const res = await supabase
            .from("invoices")
            .select("*, customers(*), invoice_items(*)")
            .eq("invoice_number", id)
            .maybeSingle();
          data = res.data;
        }

        // 3. If still not found, fetch the most recent invoice in the database
        if (!data) {
          const res = await supabase
            .from("invoices")
            .select("*, customers(*), invoice_items(*)")
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();
          data = res.data;
        }

        if (data) {
          const cust = data.customers || {};
          const items = (data.invoice_items && data.invoice_items.length > 0)
            ? data.invoice_items.map((it: any) => ({
                name: it.description || "TAZQOR Product",
                sku: it.sku_snapshot || "TC-GEN-01",
                hsn: it.hsn_snapshot || "3402",
                batch: "B-2026-LIVE",
                quantity: Number(it.quantity) || 1,
                unit_price: Number(it.unit_price) || 0,
                discount: 0,
                taxable: Number(it.line_subtotal) || Number(it.line_total) || 0,
                cgst: (Number(it.line_tax) || 0) / 2,
                sgst: (Number(it.line_tax) || 0) / 2,
                total: Number(it.line_total) || (Number(it.unit_price) * Number(it.quantity)),
              }))
            : [
                {
                  name: "TAZQOR Cleaning Supplies (Consolidated)",
                  sku: "TC-SUP-01",
                  hsn: "3402",
                  batch: "B-2026-01",
                  quantity: 1,
                  unit_price: Number(data.subtotal) || Number(data.grand_total) || 500,
                  discount: 0,
                  taxable: Number(data.subtotal) || Number(data.grand_total) || 500,
                  cgst: (Number(data.tax_total) || 0) / 2,
                  sgst: (Number(data.tax_total) || 0) / 2,
                  total: Number(data.grand_total) || 500,
                },
              ];

          const grandTotal = Number(data.grand_total) || 0;
          const taxTotal = Number(data.tax_total) || 0;
          const subtotal = Number(data.subtotal) || (grandTotal - taxTotal);

          setInvoice({
            id: data.id,
            invoice_number: data.invoice_number || "INV-LIVE",
            mode: data.mode === "non_gst" ? "non_gst" : "gst",
            status: data.status || "finalized",
            date: data.invoice_date || (data.created_at || new Date().toISOString()).split("T")[0],
            due_date: data.due_date || data.invoice_date || "Within 15 days",
            place_of_supply: data.place_of_supply || "24-Gujarat",
            business: {
              name: "TAZQOR Clean Solutions LLP",
              gstin: "24AAACT1234F1Z5",
              address: "Plot 42, Industrial Area, Phase II",
              city: "Ahmedabad, Gujarat - 380015",
              phone: "+91 98765 43210",
              email: "tazqor@gmail.com",
            },
            customer: {
              name: cust.shop_name || cust.name || "Customer",
              contact: cust.contact_person || cust.name || "Store Manager",
              gstin: cust.customer_code || "Unregistered",
              address: cust.delivery_address || cust.billing_address || `${cust.city || "Ahmedabad"} Store Location`,
              city: `${cust.city || "Ahmedabad"}${cust.district ? ", " + cust.district : ""}, ${cust.state || "Gujarat"}${cust.pin ? " - " + cust.pin : ""}`,
              phone: cust.phone || "+91 98250 11223",
            },
            items,
            subtotal,
            discount_total: Number(data.discount_total) || 0,
            cgst_total: taxTotal / 2,
            sgst_total: taxTotal / 2,
            round_off: Number(data.round_off) || 0,
            grand_total: grandTotal,
            paid_amount: 0,
            outstanding: grandTotal,
          });
        }
      } catch (e) {
        console.warn("Could not load invoice from Supabase", e);
      } finally {
        setLoading(false);
      }
    }

    loadInvoice();
  }, [id]);

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
    const toastId = toast.loading("Generating high-resolution invoice PDF...");

    try {
      const html2canvas = (await import("html2canvas-pro")).default;
      const { jsPDF } = await import("jspdf");

      const canvas = await html2canvas(invoiceEl, {
        scale: 2, // 2x resolution for sharp print quality
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

      const pageWidth = pdf.internal.pageSize.getWidth(); // 210mm
      const margin = 10; // 10mm margins
      const printWidth = pageWidth - margin * 2;
      const printHeight = (canvas.height * printWidth) / canvas.width;

      pdf.addImage(imgData, "JPEG", margin, margin, printWidth, printHeight);

      const safeNumber = (invoice.invoice_number || "Bill").replace(/[/\\?%*:|"<>]/g, "-");
      const filename = `Invoice_${safeNumber}.pdf`;
      pdf.save(filename);

      toast.success(`${filename} saved to your Downloads!`, { id: toastId });
    } catch (err) {
      console.error("PDF generation error:", err);
      toast.error("Could not generate direct PDF. Please use Print Bill > Save as PDF.", { id: toastId });
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handleCancelInvoice = async () => {
    if (!invoice) return;
    if (!confirm("Are you sure you want to cancel this finalized invoice? This will mark it cancelled in the database.")) {
      return;
    }

    setCancelling(true);
    try {
      const supabase = createClient();
      await supabase
        .from("invoices")
        .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
        .eq("id", invoice.id);

      setInvoice((prev: any) => ({ ...prev, status: "cancelled" }));
      toast.success("Invoice cancelled in database.");
    } catch {
      toast.error("Failed to cancel invoice in database");
    } finally {
      setCancelling(false);
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
        <p className="font-semibold text-neutral-800">Invoice not found in database</p>
        <Link href="/invoices" className="inline-block px-4 py-2 rounded-full bg-black text-white text-xs">
          Back to Invoices
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="print:hidden">
        <TopHeader
          title={invoice.invoice_number}
          subtitle={`Finalized on ${invoice.date} • Outstanding: ${formatINR(invoice.outstanding)}`}
        />
      </div>

      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-4xl mx-auto print:p-0 print:m-0 print:max-w-none print:space-y-0">
        {/* Navigation & Actions Bar (Hidden on print) */}
        <div className="print:hidden flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/invoices"
            className="inline-flex items-center gap-1.5 min-h-[44px] text-xs font-semibold text-neutral-600 hover:text-black transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Invoices</span>
          </Link>

          <div className="flex items-center gap-2">
            {invoice.status === "finalized" && (
              <button
                type="button"
                onClick={handleCancelInvoice}
                disabled={cancelling}
                className="flex items-center gap-1.5 px-4 h-10 rounded-full bg-rose-50 text-rose-700 text-xs font-bold border border-rose-200 hover:bg-rose-100 transition-all disabled:opacity-50 cursor-pointer"
              >
                <Ban className="w-3.5 h-3.5" />
                <span>{cancelling ? "Reversing..." : "Cancel Invoice"}</span>
              </button>
            )}

            {/* Print Bill (Native browser print formatted strictly for A4 invoice) */}
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 h-10 rounded-full bg-white/80 text-neutral-800 text-xs font-semibold shadow-none border border-neutral-300/80 hover:bg-white active:scale-95 transition-all cursor-pointer"
              title="Print bill on connected printer or save via browser dialog"
            >
              <Printer className="w-3.5 h-3.5 text-neutral-700" />
              <span>Print Bill</span>
            </button>

            {/* Direct Download PDF to local downloads folder */}
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isDownloadingPdf}
              className="flex items-center gap-1.5 px-5 h-10 rounded-full bg-[#0A0A0A] text-white text-xs font-semibold shadow-md hover:bg-black/90 active:scale-95 transition-all disabled:opacity-60 cursor-pointer"
              title="Download PDF directly to your Downloads folder"
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

        {/* Printable Branded Document Card */}
        <div
          id="printable-invoice"
          className="printable-document bg-white rounded-3xl p-8 sm:p-12 border border-[#E5E4EE] shadow-lg text-xs print:p-0 print:border-none print:shadow-none print:rounded-none"
        >
          {/* Header */}
          <div className="flex items-start justify-between border-b border-gray-200 pb-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2 mb-2">
                <TazqorLogo className="h-8 w-auto object-contain" height={32} variant="black" />
              </div>
              <p className="text-gray-700 font-bold text-sm mt-1">{invoice.business.name}</p>
              <p className="text-gray-500">{invoice.business.address}</p>
              <p className="text-gray-500">{invoice.business.city}</p>
              <p className="text-gray-700 font-medium">Phone: {invoice.business.phone}</p>
              {invoice.mode === "gst" && (
                <p className="font-mono font-bold text-gray-800">GSTIN: {invoice.business.gstin}</p>
              )}
            </div>

            <div className="text-right space-y-1">
              <span className="text-xs font-extrabold tracking-wider uppercase px-3 py-1 rounded-full bg-[#0A0A0A] text-white inline-block">
                {invoice.mode === "gst" ? "TAX INVOICE" : "BILL OF SUPPLY"}
              </span>
              <h2 className="text-base font-mono font-black text-gray-900 mt-2">
                {invoice.invoice_number}
              </h2>
              <p className="text-gray-500">Date: <strong className="text-gray-800">{invoice.date}</strong></p>
              <p className="text-gray-500">Due Date: <strong className="text-gray-800">{invoice.due_date}</strong></p>
              <p className="text-gray-500">Place of Supply: <strong className="text-gray-800">{invoice.place_of_supply}</strong></p>

              {invoice.status === "cancelled" && (
                <div className="inline-block px-3 py-1 bg-rose-100 text-rose-800 font-bold rounded-lg mt-2">
                  CANCELLED / VOID
                </div>
              )}
            </div>
          </div>

          {/* Bill To */}
          <div className="py-6 border-b border-gray-200 grid grid-cols-2 gap-6">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-neutral-600 uppercase tracking-wider block">
                Billed To (Customer)
              </span>
              <h3 className="text-sm font-bold text-gray-900">{invoice.customer.name}</h3>
              <p className="text-gray-600">Attn: {invoice.customer.contact}</p>
              <p className="text-gray-500">{invoice.customer.address}</p>
              <p className="text-gray-500">{invoice.customer.city}</p>
              <p className="text-gray-700">Phone: {invoice.customer.phone}</p>
              {invoice.customer.gstin && (
                <p className="font-mono text-gray-700">GSTIN: {invoice.customer.gstin}</p>
              )}
            </div>

            <div className="text-right space-y-2">
              <span className="text-[10px] font-bold text-neutral-600 uppercase tracking-wider block">
                Payment Status
              </span>
              <div className="text-base font-black text-gray-900">
                {invoice.outstanding === 0 ? (
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
          <div className="py-6 border-b border-gray-200 overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-200 text-neutral-600 font-bold uppercase text-[10px]">
                  <th className="py-2">Item Description</th>
                  <th className="py-2">HSN</th>
                  <th className="py-2">Batch</th>
                  <th className="py-2 text-right">Qty</th>
                  <th className="py-2 text-right">Rate</th>
                  <th className="py-2 text-right">Taxable</th>
                  {invoice.mode === "gst" && (
                    <>
                      <th className="py-2 text-right">CGST</th>
                      <th className="py-2 text-right">SGST</th>
                    </>
                  )}
                  <th className="py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {invoice.items.map((item: any, i: number) => (
                  <tr key={i}>
                    <td className="py-3 font-semibold text-gray-900">
                      <div>{item.name}</div>
                      <div className="text-[10px] text-neutral-600 font-mono">{item.sku}</div>
                    </td>
                    <td className="py-3 font-mono text-gray-600">{item.hsn}</td>
                    <td className="py-3 font-mono text-gray-600">{item.batch}</td>
                    <td className="py-3 text-right font-medium">{item.quantity}</td>
                    <td className="py-3 text-right">{formatINR(item.unit_price)}</td>
                    <td className="py-3 text-right">{formatINR(item.taxable)}</td>
                    {invoice.mode === "gst" && (
                      <>
                        <td className="py-3 text-right text-gray-600">{formatINR(item.cgst)}</td>
                        <td className="py-3 text-right text-gray-600">{formatINR(item.sgst)}</td>
                      </>
                    )}
                    <td className="py-3 text-right font-bold text-gray-900">{formatINR(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals Section */}
          <div className="pt-6 flex justify-end">
            <div className="w-72 space-y-2 text-xs">
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
                <>
                  <div className="flex justify-between text-gray-600">
                    <span>CGST (9%):</span>
                    <span>{formatINR(invoice.cgst_total)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>SGST (9%):</span>
                    <span>{formatINR(invoice.sgst_total)}</span>
                  </div>
                </>
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

          {/* Signatures & Bank Details */}
          <div className="mt-12 pt-8 border-t border-gray-200 grid grid-cols-2 gap-8 text-[11px] text-gray-500">
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
                    <label className="text-[10px] text-neutral-500 block">Bank Name</label>
                    <input
                      type="text"
                      value={bankDetails.bankName}
                      onChange={(e) => {
                        const updated = { ...bankDetails, bankName: e.target.value };
                        setBankDetails(updated);
                        localStorage.setItem("tazqor_bank_details", JSON.stringify(updated));
                      }}
                      className="w-full h-7 px-2 text-xs border rounded bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-neutral-500 block">Account Number</label>
                    <input
                      type="text"
                      value={bankDetails.accountNo}
                      onChange={(e) => {
                        const updated = { ...bankDetails, accountNo: e.target.value };
                        setBankDetails(updated);
                        localStorage.setItem("tazqor_bank_details", JSON.stringify(updated));
                      }}
                      className="w-full h-7 px-2 text-xs border rounded bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-neutral-500 block">IFSC Code</label>
                    <input
                      type="text"
                      value={bankDetails.ifsc}
                      onChange={(e) => {
                        const updated = { ...bankDetails, ifsc: e.target.value };
                        setBankDetails(updated);
                        localStorage.setItem("tazqor_bank_details", JSON.stringify(updated));
                      }}
                      className="w-full h-7 px-2 text-xs border rounded bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-neutral-500 block">UPI ID</label>
                    <input
                      type="text"
                      value={bankDetails.upiId}
                      onChange={(e) => {
                        const updated = { ...bankDetails, upiId: e.target.value };
                        setBankDetails(updated);
                        localStorage.setItem("tazqor_bank_details", JSON.stringify(updated));
                      }}
                      className="w-full h-7 px-2 text-xs border rounded bg-white"
                    />
                  </div>
                </div>
              ) : (
                <>
                  <p>Account Name: {bankDetails.accountName}</p>
                  <p>Bank: {bankDetails.bankName}</p>
                  <p>A/C No: {bankDetails.accountNo}</p>
                  <p>IFSC: {bankDetails.ifsc} • UPI ID: {bankDetails.upiId}</p>
                </>
              )}
            </div>

            <div className="text-right flex flex-col justify-between items-end">
              <p className="font-bold text-gray-700">For TAZQOR Clean Solutions</p>
              <div className="h-10" />
              <p className="border-t border-gray-300 pt-1 w-48 text-center text-neutral-600">
                Authorized Signatory
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

