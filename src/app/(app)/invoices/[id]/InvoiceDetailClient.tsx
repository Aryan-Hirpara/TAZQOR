"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
  Upload,
  RefreshCw,
  FileCheck2,
  PenLine,
  MessageCircle,
  Mail,
} from "lucide-react";
import { toast } from "sonner";
import { TopHeader } from "@/components/layout/TopHeader";
import { formatINR } from "@/lib/formatting/currency";
import { TazqorLogo } from "@/components/brand/TazqorLogo";
import { createClient } from "@/lib/supabase/client";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { MarkPaidModal } from "@/components/invoices/MarkPaidModal";
import {
  DEFAULT_INVOICE_TERMS,
  formatBillCustomerBlock,
  formatBusinessAddressLines,
  formatPlaceOfSupplyWithCode,
  formatWhatsAppShareMessage,
  normalizeWhatsAppDigits,
  toIndianCurrencyWords,
} from "@/lib/invoices/bill-format";
import { loadTransparentSignatureDataUrl } from "@/lib/invoices/signature-ink";
import { generateInvoicePdf } from "@/lib/invoices/pdf-generator";

type BillCopyMode = "digital" | "print";

interface SignatureMeta {
  available: boolean;
  filename: string | null;
  source: "root" | "brand" | null;
  url: string | null;
}

export default function InvoiceDetailClient({ id }: { id: string }) {
  const router = useRouter();
  const signatureInputRef = useRef<HTMLInputElement | null>(null);

  const [copyMode, setCopyMode] = useState<BillCopyMode>("digital");
  const [confirmKind, setConfirmKind] = useState<"cancel" | "delete" | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [markPaidOpen, setMarkPaidOpen] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isUploadingSign, setIsUploadingSign] = useState(false);
  const [loading, setLoading] = useState(true);
  const [invoice, setInvoice] = useState<any>(null);

  const [signatureMeta, setSignatureMeta] = useState<SignatureMeta>({
    available: false,
    filename: null,
    source: null,
    url: null,
  });
  const [transparentSignUrl, setTransparentSignUrl] = useState<string | null>(null);

  const [termsList, setTermsList] = useState<string[]>([...DEFAULT_INVOICE_TERMS]);
  const [editingTerms, setEditingTerms] = useState(false);
  const [termsDraftText, setTermsDraftText] = useState(DEFAULT_INVOICE_TERMS.join("\n"));

  const loadSignatureMeta = useCallback(async () => {
    try {
      const res = await fetch("/api/business/signature?meta=1", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as SignatureMeta;
      setSignatureMeta(data);
    } catch {
      // ignore signature metadata fetch failures
    }
  }, []);

  useEffect(() => {
    loadSignatureMeta();
  }, [loadSignatureMeta]);

  useEffect(() => {
    let active = true;
    if (!signatureMeta.available || !signatureMeta.url) {
      setTransparentSignUrl(null);
      return;
    }
    loadTransparentSignatureDataUrl(signatureMeta.url).then((processed) => {
      if (active) {
        setTransparentSignUrl(processed || signatureMeta.url);
      }
    });
    return () => {
      active = false;
    };
  }, [signatureMeta.available, signatureMeta.url]);

  const loadInvoice = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = createClient();

      const { data: invRow } = await supabase
        .from("invoices")
        .select(
          "*, customers(*), orders(id, status, delivery_stock_deducted), invoice_items(*, product_variants(name, pack_size, sku, products(name)), invoice_item_batches(quantity_allocated, batches(batch_number)))"
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

      const rawCust = (invRow.snapshot_customer as any) || invRow.customers || {};
      const liveCust = invRow.customers || {};
      const mergedCust = {
        ...rawCust,
        whatsapp: rawCust.whatsapp || liveCust.whatsapp,
        email: rawCust.email || liveCust.email,
      };
      const snapBiz = (invRow.snapshot_business as any) || {};
      const bizName = bizSettings?.legal_name || snapBiz.name || "Your Business";
      const bizAddr = formatBusinessAddressLines({
        address_line1: bizSettings?.address_line1,
        address_line2: bizSettings?.address_line2,
        city: bizSettings?.city,
        state: bizSettings?.state,
        pin: bizSettings?.pin,
      });
      const formattedCust = formatBillCustomerBlock(mergedCust);

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

        const pv = it.product_variants as any;
        const variantFullName = pv?.products?.name
          ? (pv.pack_size || pv.name ? `${pv.products.name} (${pv.pack_size || pv.name})` : pv.products.name)
          : pv?.name || null;
        const resolvedName = it.description || variantFullName || "Product";
        const resolvedSku = it.sku_snapshot || pv?.sku || "—";

        return {
          name: resolvedName,
          sku: resolvedSku,
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

      if (Array.isArray(bizSettings?.invoice_terms) && bizSettings.invoice_terms.length > 0) {
        setTermsList(bizSettings.invoice_terms);
        setTermsDraftText(bizSettings.invoice_terms.join("\n"));
      }

      const isStockAlreadyDeducted = Boolean(
        invRow.orders?.delivery_stock_deducted ||
        invRow.orders?.status === "delivered"
      );

      setInvoice({
        id: invRow.id,
        business_id: invRow.business_id,
        order_id: invRow.order_id,
        stockAlreadyDeducted: isStockAlreadyDeducted,
        invoice_number: invRow.invoice_number || "DRAFT",
        mode: invRow.mode === "non_gst" ? "non_gst" : "gst",
        status: invRow.status || "draft",
        date: invRow.invoice_date || (invRow.created_at || "").split("T")[0],
        due_date: invRow.due_date || "—",
        place_of_supply: formatPlaceOfSupplyWithCode(
          invRow.place_of_supply || mergedCust.state || "—",
          bizSettings?.state_code
        ),
        notes: invRow.notes || "",
        business: {
          name: bizName,
          gstin: bizSettings?.gstin || snapBiz.gstin || "",
          address: bizAddr.streetLine,
          city: bizAddr.regionLine,
          phone: bizSettings?.phone || snapBiz.phone || "+91 96384 90740",
          email: bizSettings?.email || snapBiz.email || "tazqor@gmail.com",
        },
        customer: {
          name: formattedCust.displayName,
          contact: formattedCust.attnContact,
          gstin: formattedCust.gstin,
          address: formattedCust.streetLine,
          city: formattedCust.regionLine,
          phone: formattedCust.phone,
          email: formattedCust.email,
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

  const handleSaveTerms = async () => {
    const cleaned = termsDraftText
      .split("\n")
      .map((line) => line.replace(/^\d+[.)]\s*/, "").trim())
      .filter(Boolean);
    const nextTerms = cleaned.length > 0 ? cleaned : [...DEFAULT_INVOICE_TERMS];
    setTermsList(nextTerms);
    setTermsDraftText(nextTerms.join("\n"));
    if (invoice?.business_id) {
      try {
        const supabase = createClient();
        await supabase
          .from("business_settings")
          .update({ invoice_terms: nextTerms })
          .eq("business_id", invoice.business_id);
      } catch (err) {
        console.warn("Could not save invoice terms to database", err);
      }
    }
    setEditingTerms(false);
    toast.success("Terms & Conditions updated and saved.");
  };

  const handleResetTerms = async () => {
    const defaults = [...DEFAULT_INVOICE_TERMS];
    setTermsList(defaults);
    setTermsDraftText(defaults.join("\n"));
    if (invoice?.business_id) {
      try {
        const supabase = createClient();
        await supabase
          .from("business_settings")
          .update({ invoice_terms: null })
          .eq("business_id", invoice.business_id);
      } catch (err) {
        console.warn("Could not reset invoice terms in database", err);
      }
    }
    setEditingTerms(false);
    toast.success("Reset to default Terms & Conditions.");
  };

  const handleSignatureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setIsUploadingSign(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/business/signature", { method: "POST", body: fd });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        toast.error(data?.error || "Failed to upload signature");
        return;
      }
      setSignatureMeta({
        available: true,
        filename: data.filename,
        source: data.source,
        url: data.url,
      });
      setCopyMode("digital");
      toast.success("Digital signature uploaded!");
    } catch {
      toast.error("Could not upload signature.");
    } finally {
      setIsUploadingSign(false);
    }
  };

  const handlePrint = () => {
    if (!invoice) return;
    const originalTitle = document.title;
    const safeNumber = (invoice.invoice_number || "Bill").replace(/[/\\?%*:|"<>]/g, "-");
    document.title = `Invoice_${safeNumber}_${copyMode === "digital" ? "Digital" : "Print"}`;
    window.print();
    setTimeout(() => {
      document.title = originalTitle;
    }, 1500);
  };

  const captureInvoicePdf = async (forceDigital: boolean) => {
    if (forceDigital && copyMode !== "digital") {
      setCopyMode("digital");
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
      );
    }
    const invoiceEl = document.getElementById("printable-invoice");
    if (!invoiceEl || !invoice) {
      throw new Error("Invoice document element not found");
    }
    return generateInvoicePdf(invoiceEl, invoice.invoice_number);
  };

  const buildShareMessageLines = () => {
    return formatWhatsAppShareMessage({
      businessName: invoice.business.name,
      businessPhone: invoice.business.phone,
      businessEmail: invoice.business.email,
      customerName: invoice.customer.name,
      invoiceNumber: invoice.invoice_number,
      invoiceDate: invoice.date,
      docLabel: invoice.mode === "gst" ? "Tax Invoice" : "Bill of Supply",
      grandTotal: invoice.grand_total,
      outstanding: invoice.outstanding,
      status: invoice.status,
      items: (invoice.items || []).map((it: any) => ({
        description: it.name,
        quantity: it.quantity,
        line_total: it.total,
        rate: it.unit_price,
      })),
    });
  };

  const handleDownloadPdf = async () => {
    if (!invoice) return;

    setIsDownloadingPdf(true);
    const toastId = toast.loading("Generating invoice PDF...");

    try {
      const generated = await captureInvoicePdf(false);
      generated.save();
      toast.success(`${generated.filename} downloaded!`, { id: toastId });
    } catch (err) {
      console.error("PDF generation error:", err);
      toast.error("Could not generate PDF. Please use Print Bill > Save as PDF.", { id: toastId });
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handleShareWhatsApp = () => {
    if (!invoice) return;
    const digits = normalizeWhatsAppDigits(invoice.customer.phone);
    if (!digits) {
      toast.error("Customer phone/WhatsApp number is not available.");
      return;
    }

    const message = buildShareMessageLines().join("\n");
    const waUrl = `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;

    // 1. Immediately open WhatsApp chat with customer (instant user-gesture, never blocked)
    const popup = window.open(waUrl, "_blank", "noopener,noreferrer");
    if (!popup) {
      window.location.href = waUrl;
    }

    // 2. Copy message text to clipboard for quick paste
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(message).catch(() => {});
    }

    toast.success(`Opening WhatsApp chat with ${invoice.customer.name}...`);

    // 3. Switch to Digital Copy mode if not already active (includes digital signature)
    if (copyMode !== "digital") {
      setCopyMode("digital");
    }

    // 4. Automatically launch Print as PDF (native print preview dialog)
    // instead of direct canvas download, allowing the user to save as PDF in internal storage
    setTimeout(() => {
      const originalTitle = document.title;
      const safeNumber = (invoice.invoice_number || "Bill").replace(/[/\\?%*:|"<>]/g, "-");
      document.title = `Invoice_${safeNumber}_Digital`;
      window.print();
      setTimeout(() => {
        document.title = originalTitle;
      }, 1500);
    }, 250);
  };

  const handleEmailDigitalCopy = async () => {
    if (!invoice || isSendingEmail) return;
    const recipient = invoice.customer.email;
    if (!recipient) {
      toast.error("Customer email address is not saved yet.");
      return;
    }

    setIsSendingEmail(true);
    const toastId = toast.loading("Generating signed PDF & sending email...");
    try {
      const generated = await captureInvoicePdf(true);
      const docLabel = invoice.mode === "gst" ? "Tax Invoice" : "Bill of Supply";
      const res = await fetch("/api/mail/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: recipient,
          subject: `${docLabel} ${invoice.invoice_number} (Digital Copy) — ${invoice.business.name}`,
          text: [
            `Dear ${invoice.customer.name},`,
            "",
            `Please find attached ${docLabel} ${invoice.invoice_number} (Digital Copy) from ${invoice.business.name}.`,
            "",
            `Date: ${invoice.date}`,
            `Total Amount: ${formatINR(invoice.grand_total)}`,
            invoice.outstanding <= 0 ? "Status: Paid in Full" : `Balance Due: ${formatINR(invoice.outstanding)}`,
            "",
            "Terms & Conditions:",
            ...termsList.map((t, i) => `${i + 1}. ${t}`),
          ].join("\n"),
          attachments: [
            {
              filename: generated.filename,
              content: generated.base64,
              encoding: "base64",
              contentType: "application/pdf",
            },
          ],
        }),
      });
      const payload = await res.json().catch(() => null);
      if (!res.ok || !payload?.success) {
        toast.error(payload?.error || "Failed to send bill email", { id: toastId });
        return;
      }
      toast.success(payload.message || `PDF sent to ${recipient}!`, { id: toastId });
    } catch {
      toast.error("Error generating or sending bill email.", { id: toastId });
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleFinalizeDraft = async () => {
    if (!invoice || invoice.status !== "draft") return;
    setFinalizing(true);
    try {
      const key =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `fin-${invoice.id}-${Date.now()}`;

      const res = await fetch(`/api/invoices/${invoice.id}/finalize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idempotency_key: key }),
      });
      const payload = await res.json().catch(() => null);

      if (!res.ok || !payload?.success) {
        toast.error(payload?.error || "Could not finalize invoice");
        return;
      }
      toast.success(`Invoice finalized (${payload?.invoice_number || ""})!`);
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
      if (confirmKind === "delete") {
        const res = await fetch(`/api/invoices/${invoice.id}`, {
          method: "DELETE",
        });
        const payload = await res.json().catch(() => null);
        if (!res.ok || !payload?.success) {
          setConfirmError(payload?.error || "Failed to delete bill.");
          return;
        }
        toast.success(
          payload.stockMovementsRemoved > 0
            ? `Bill ${invoice.invoice_number} deleted and stock recovered.`
            : `Bill ${invoice.invoice_number} permanently deleted.`
        );
        router.push("/invoices");
      } else {
        const res = await fetch(`/api/invoices/${invoice.id}/cancel`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason: "Cancelled by user" }),
        });
        const payload = await res.json().catch(() => null);
        if (!res.ok || !payload?.success) {
          setConfirmError(payload?.error || "Failed to cancel invoice");
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

  const isDigitalCopy = copyMode === "digital";
  const amountInWords = toIndianCurrencyWords(invoice.grand_total);

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
        <div className="print:hidden space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Link
              href="/invoices"
              className="inline-flex items-center gap-1.5 min-h-[44px] text-xs font-semibold text-neutral-600 hover:text-black transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Invoices</span>
            </Link>

            <div className="flex flex-wrap items-center gap-2">
              {invoice.status === "draft" && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleFinalizeDraft}
                    disabled={finalizing}
                    className="flex items-center gap-1.5 px-4 h-10 rounded-full bg-[#D7FF00] text-black text-xs font-semibold hover:brightness-95 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>
                      {finalizing
                        ? "Finalizing..."
                        : invoice.stockAlreadyDeducted
                        ? "Finalize Bill"
                        : "Finalize & Deduct Stock"}
                    </span>
                  </button>
                  {invoice.stockAlreadyDeducted && (
                    <span className="hidden sm:inline-block px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-medium">
                      Stock already deducted on delivery
                    </span>
                  )}
                </div>
              )}

              {invoice.status === "finalized" && invoice.outstanding > 0 && (
                <button
                  type="button"
                  onClick={() => setMarkPaidOpen(true)}
                  className="flex items-center gap-1.5 px-4 h-10 rounded-full bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-all cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Mark Paid</span>
                </button>
              )}

              {invoice.status === "finalized" && (
                <button
                  type="button"
                  onClick={() => {
                    setConfirmError(null);
                    setConfirmKind("cancel");
                  }}
                  className="flex items-center gap-1.5 px-4 h-10 rounded-full bg-amber-50 text-amber-800 text-xs font-bold border border-amber-200 hover:bg-amber-100 transition-all cursor-pointer"
                >
                  <Ban className="w-3.5 h-3.5" />
                  <span>Cancel Invoice</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setConfirmError(null);
                  setConfirmKind("delete");
                }}
                className="flex items-center gap-1.5 px-4 h-10 rounded-full bg-rose-50 text-rose-700 text-xs font-semibold border border-rose-200 hover:bg-rose-100 transition-all cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Bill</span>
              </button>

              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="flex items-center gap-1.5 px-3.5 h-10 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200 hover:bg-emerald-100 transition-all cursor-pointer"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </button>

              {invoice.customer.email && (
                <button
                  type="button"
                  onClick={handleEmailDigitalCopy}
                  disabled={isSendingEmail}
                  className="flex items-center gap-1.5 px-3.5 h-10 rounded-full bg-white/80 text-neutral-800 text-xs font-semibold border border-neutral-300/80 hover:bg-white transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isSendingEmail ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Mail className="w-3.5 h-3.5" />
                  )}
                  <span>{isSendingEmail ? "Sending PDF..." : "Email PDF"}</span>
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

          {/* Copy Mode & Digital Signature Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl bg-white/75 backdrop-blur-md border border-white/80 px-4 py-2.5 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex rounded-full bg-neutral-100 p-1 border border-neutral-200/80">
                <button
                  type="button"
                  onClick={() => setCopyMode("digital")}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                    isDigitalCopy
                      ? "bg-[#0A0A0A] text-white shadow-sm"
                      : "text-neutral-600 hover:text-neutral-900"
                  }`}
                >
                  <FileCheck2 className="w-3.5 h-3.5" />
                  <span>Digital Copy (E-Sign)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCopyMode("print")}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                    !isDigitalCopy
                      ? "bg-[#0A0A0A] text-white shadow-sm"
                      : "text-neutral-600 hover:text-neutral-900"
                  }`}
                >
                  <PenLine className="w-3.5 h-3.5" />
                  <span>Physical Print Copy</span>
                </button>
              </div>
              <span className="text-[11px] text-neutral-500">
                {isDigitalCopy
                  ? "Digital signature & India e-bill declaration (WhatsApp / Email)"
                  : "Blank signatory space for printing & handwritten signature"}
              </span>
            </div>

            {isDigitalCopy && (
              <div className="flex items-center gap-2 shrink-0">
                <input
                  ref={signatureInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleSignatureUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => signatureInputRef.current?.click()}
                  disabled={isUploadingSign}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-neutral-300 text-neutral-800 text-[11px] font-semibold hover:bg-neutral-50 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Upload className="w-3 h-3" />
                  <span>
                    {isUploadingSign
                      ? "Uploading..."
                      : signatureMeta.available
                      ? "Change Sign"
                      : "Upload Sign"}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={loadSignatureMeta}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-white border border-neutral-300 text-neutral-700 text-[11px] font-medium hover:bg-neutral-50 transition-all cursor-pointer"
                  title="Check project root directory for signature image (e.g. signature.png)"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Sync Root</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Printable Document — Preserved Original Clean Structure */}
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
              {invoice.business.email && (
                <p className="text-gray-500">Email: {invoice.business.email}</p>
              )}
              {invoice.mode === "gst" && invoice.business.gstin && (
                <p className="font-mono font-bold text-gray-800">GSTIN: {invoice.business.gstin}</p>
              )}
            </div>

            <div className="sm:text-right space-y-1">
              <div className="flex flex-wrap sm:justify-end items-center gap-1.5">
                <span className="text-xs font-extrabold tracking-wider uppercase px-3 py-1 rounded-full bg-[#0A0A0A] text-white inline-block">
                  {invoice.mode === "gst" ? "TAX INVOICE" : "BILL OF SUPPLY"}
                </span>
                <span className="text-[10px] font-bold tracking-wide uppercase px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 border border-gray-200 inline-block">
                  {isDigitalCopy ? "Digital Copy" : "Original for Recipient"}
                </span>
              </div>
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
              {invoice.status === "finalized" && invoice.outstanding > 0 && (
                <div className="pt-1 print:hidden" data-html2canvas-ignore="true">
                  <button
                    type="button"
                    onClick={() => setMarkPaidOpen(true)}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-semibold border border-emerald-200 hover:bg-emerald-100 transition-colors cursor-pointer"
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Mark as Paid</span>
                  </button>
                </div>
              )}
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
            <div className="text-[11px] text-gray-500 max-w-sm space-y-2">
              <div>
                <p className="font-semibold text-gray-700 mb-0.5">Amount in Words:</p>
                <p className="text-gray-800 font-medium">{amountInWords}</p>
              </div>
              {invoice.notes && (
                <div>
                  <p className="font-semibold text-gray-700 mb-0.5">Notes:</p>
                  <p>{invoice.notes}</p>
                </div>
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

          {/* Terms & Conditions + Signatory (Replaces Bank Details) */}
          <div className="mt-12 pt-8 border-t border-gray-200 grid grid-cols-1 sm:grid-cols-2 gap-8 text-[11px] text-gray-500">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <p className="font-bold text-gray-700">Terms &amp; Conditions:</p>
                <button
                  type="button"
                  data-html2canvas-ignore="true"
                  onClick={() => setEditingTerms(!editingTerms)}
                  className="text-[10px] text-blue-600 hover:underline font-light print:hidden cursor-pointer"
                >
                  {editingTerms ? "Cancel" : "Edit"}
                </button>
              </div>

              {editingTerms ? (
                <div
                  data-html2canvas-ignore="true"
                  className="space-y-2 p-2.5 bg-neutral-50 rounded-xl border border-neutral-200 print:hidden text-xs"
                >
                  <textarea
                    rows={5}
                    value={termsDraftText}
                    onChange={(e) => setTermsDraftText(e.target.value)}
                    className="w-full p-2 text-[11px] border rounded bg-white text-gray-800"
                    placeholder="Enter one term per line..."
                  />
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={handleResetTerms}
                      className="text-[10px] text-neutral-500 hover:text-neutral-800 cursor-pointer"
                    >
                      Reset Defaults
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveTerms}
                      className="px-3 py-1 rounded-full bg-black text-white text-[10px] font-semibold cursor-pointer"
                    >
                      Save Terms
                    </button>
                  </div>
                </div>
              ) : (
                <ol className="space-y-1 text-[10px] text-gray-500 leading-relaxed list-decimal list-inside">
                  {termsList.map((term, idx) => (
                    <li key={idx}>{term}</li>
                  ))}
                </ol>
              )}
            </div>

            <div className="sm:text-right flex flex-col justify-between sm:items-end">
              <p className="font-bold text-gray-700">For {invoice.business.name}</p>

              <div className="mt-auto pt-4 flex flex-col items-center sm:items-end">
                {isDigitalCopy ? (
                  <div className="w-48 flex items-end justify-center leading-none">
                    {signatureMeta.available && (transparentSignUrl || signatureMeta.url) ? (
                      <img
                        src={transparentSignUrl || signatureMeta.url || ""}
                        alt={`Signature of ${invoice.business.name}`}
                        crossOrigin="anonymous"
                        className="block max-h-14 w-auto max-w-[184px] object-contain object-bottom -mb-px"
                      />
                    ) : (
                      <span className="text-[11px] font-semibold italic text-gray-700 pb-0.5">
                        {invoice.business.name}
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="h-12" />
                )}

                <p className="border-t border-gray-300 pt-1 w-48 text-center text-neutral-600">
                  Authorized Signatory
                </p>
              </div>
            </div>
          </div>

          {/* Indian Digital / Billing Statutory Declaration */}
          <div className="mt-6 pt-4 border-t border-gray-100 text-[10px] text-gray-400 flex flex-row items-baseline justify-between gap-4">
            <p className="flex-1 pr-6 sm:pr-10 leading-relaxed text-left">
              {isDigitalCopy
                ? "Certified that the particulars given above are true and correct. This is a computer-generated Digital Copy bearing an authorized electronic signature."
                : "Certified that the particulars given above are true and correct."}
              {invoice.mode === "non_gst" &&
                " Bill of Supply (Non-GST / Exempt / Unregistered Supply)."}
            </p>
            <span className="shrink-0 font-medium text-gray-500 whitespace-nowrap text-right self-end">
              E. &amp; O.E.
            </span>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(confirmKind)}
        title={
          confirmKind === "delete"
            ? `Delete bill ${invoice.invoice_number}?`
            : `Cancel invoice ${invoice.invoice_number}?`
        }
        description={
          confirmKind === "delete"
            ? "This permanently removes this bill from the software and database, reverses ledger allocations, and automatically recovers any deducted inventory stock."
            : "This reverses allocated FEFO stock movements and marks the invoice cancelled."
        }
        confirmLabel={confirmKind === "delete" ? "Delete Bill" : "Cancel Invoice"}
        loading={confirmLoading}
        error={confirmError}
        onConfirm={handleConfirmModal}
        onClose={() => !confirmLoading && setConfirmKind(null)}
      />

      <MarkPaidModal
        open={markPaidOpen}
        invoice={
          invoice
            ? {
                id: invoice.id,
                invoice_number: invoice.invoice_number,
                customer_name: invoice.customer?.name || "Customer",
                grand_total: invoice.grand_total,
                outstanding: invoice.outstanding,
              }
            : null
        }
        onClose={() => setMarkPaidOpen(false)}
        onSuccess={loadInvoice}
      />
    </div>
  );
}
