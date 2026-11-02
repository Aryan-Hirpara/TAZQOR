"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Printer,
  FileText,
  Share2,
  Ban,
  CheckCircle2,
  Clock,
  Sparkles,
  CreditCard,
  Building2,
} from "lucide-react";
import { toast } from "sonner";
import { TopHeader } from "@/components/layout/TopHeader";
import { formatINR } from "@/lib/formatting/currency";

export default function InvoiceDetailClient({ id }: { id: string }) {
  const router = useRouter();
  const [cancelling, setCancelling] = useState(false);
  const [status, setStatus] = useState<"finalized" | "cancelled">("finalized");

  // Sample finalized invoice data
  const invoice = {
    id,
    invoice_number: "INV/2026-27/0001",
    mode: "gst" as const,
    status: status,
    date: "2026-02-15",
    due_date: "2026-03-01",
    place_of_supply: "24-Gujarat",
    business: {
      name: "TAZQOR Clean Solutions LLP",
      gstin: "24AAACT1234F1Z5",
      address: "Plot 42, Industrial Area, Phase II",
      city: "Ahmedabad, Gujarat - 380015",
      phone: "+91 98765 43210",
      email: "billing@tazqor.com",
    },
    customer: {
      name: "Shreeji Supermarket",
      contact: "Haresh Patel",
      gstin: "24BBYPA9988C1Z2",
      address: "Shop 4, Ground Floor, Shivalik Plaza, IIM Road",
      city: "Ahmedabad, Gujarat - 380015",
      phone: "+91 98250 11223",
    },
    items: [
      {
        name: "TAZQOR Citrus Floor Cleaner (5 L)",
        sku: "TC-FLR-01-5L",
        hsn: "3402",
        batch: "B-FLR-2026-01",
        quantity: 10,
        unit_price: 450.00,
        discount: 225.00,
        taxable: 4275.00,
        cgst: 384.75,
        sgst: 384.75,
        total: 5044.50,
      },
      {
        name: "TAZQOR Sparkle Dish Wash Gel (5 L)",
        sku: "TC-DSH-01-5L",
        hsn: "3402",
        batch: "B-DSH-2026-01",
        quantity: 24,
        unit_price: 520.00,
        discount: 0.00,
        taxable: 12480.00,
        cgst: 1123.20,
        sgst: 1123.20,
        total: 14726.40,
      },
    ],
    subtotal: 16755.00,
    discount_total: 225.00,
    cgst_total: 1507.95,
    sgst_total: 1507.95,
    round_off: -0.90,
    grand_total: 19770.00,
    paid_amount: 12000.00,
    outstanding: 7770.00,
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCancelInvoice = () => {
    if (!confirm("Are you sure you want to cancel this finalized invoice? This will post reversing stock return entries back to the inventory ledger.")) {
      return;
    }

    setCancelling(true);
    setTimeout(() => {
      setStatus("cancelled");
      setCancelling(false);
      toast.success("Invoice cancelled. Stock returned to batch ledger.");
    }, 700);
  };

  return (
    <div className="min-h-screen">
      <div className="print:hidden">
        <TopHeader
          title={invoice.invoice_number}
          subtitle={`Finalized on ${invoice.date} • Outstanding: ${formatINR(invoice.outstanding)}`}
        />
      </div>

      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-4xl mx-auto">
        {/* Navigation & Actions Bar (Hidden on print) */}
        <div className="print:hidden flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/invoices"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-black transition-colors"
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
                className="flex items-center gap-1.5 px-4 h-10 rounded-full bg-rose-50 text-rose-700 text-xs font-bold border border-rose-200 hover:bg-rose-100 transition-all disabled:opacity-50"
              >
                <Ban className="w-3.5 h-3.5" />
                <span>{cancelling ? "Reversing..." : "Cancel Invoice"}</span>
              </button>
            )}

            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-5 h-10 rounded-full bg-[#0A0A0A] text-white text-xs font-bold shadow-md hover:bg-black/90 active:scale-95 transition-all"
            >
              <Printer className="w-3.5 h-3.5 text-[#D4F732]" />
              <span>Print / Download PDF</span>
            </button>
          </div>
        </div>

        {/* Printable Branded Document Card */}
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-[#E5E4EE] shadow-lg text-xs print:p-0 print:border-none print:shadow-none print:rounded-none">
          {/* Header */}
          <div className="flex items-start justify-between border-b border-gray-200 pb-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#0A0A0A] text-[#D4F732] flex items-center justify-center font-bold">
                  TQ
                </div>
                <h1 className="text-xl font-extrabold text-[#0A0A0A] tracking-tight">
                  TAZQOR
                </h1>
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
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
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
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
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
                <tr className="border-b border-gray-200 text-gray-400 font-bold uppercase text-[10px]">
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
                {invoice.items.map((item, i) => (
                  <tr key={i}>
                    <td className="py-3 font-semibold text-gray-900">
                      <div>{item.name}</div>
                      <div className="text-[10px] text-gray-400 font-mono">{item.sku}</div>
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

              <div className="flex justify-between text-gray-400 text-[11px]">
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
              <p className="font-bold text-gray-700">Bank Details for Payment:</p>
              <p>Account Name: TAZQOR Clean Solutions LLP</p>
              <p>Bank: HDFC Bank, Bodakdev Branch</p>
              <p>A/C No: 50200088991122</p>
              <p>IFSC: HDFC0001234 • UPI ID: tazqor@hdfcbank</p>
            </div>

            <div className="text-right flex flex-col justify-between items-end">
              <p className="font-bold text-gray-700">For TAZQOR Clean Solutions LLP</p>
              <div className="h-10" />
              <p className="border-t border-gray-300 pt-1 w-48 text-center text-gray-400">
                Authorized Signatory
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
