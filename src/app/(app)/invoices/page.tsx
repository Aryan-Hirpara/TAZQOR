"use client";

import { useState } from "react";
import Link from "next/link";
import {
  FileText,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Ban,
  ArrowUpRight,
  Printer,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";
import { TopHeader } from "@/components/layout/TopHeader";
import { formatINR } from "@/lib/formatting/currency";

interface InvoiceListItem {
  id: string;
  invoice_number: string;
  customer_name: string;
  mode: 'gst' | 'non_gst';
  invoice_date: string;
  due_date: string;
  grand_total: number;
  paid_amount: number;
  outstanding: number;
  status: 'draft' | 'finalized' | 'cancelled';
}

const DEMO_INVOICES: InvoiceListItem[] = [
  {
    id: "inv-1",
    invoice_number: "INV/2026-27/0001",
    customer_name: "Shreeji Supermarket",
    mode: "gst",
    invoice_date: "2026-02-15",
    due_date: "2026-03-01",
    grand_total: 18500.00,
    paid_amount: 12000.00,
    outstanding: 6500.00,
    status: "finalized",
  },
  {
    id: "inv-2",
    invoice_number: "BILL/2026-27/0001",
    customer_name: "Radhe Krishna PG",
    mode: "non_gst",
    invoice_date: "2026-02-12",
    due_date: "2026-02-12",
    grand_total: 3700.00,
    paid_amount: 3700.00,
    outstanding: 0.00,
    status: "finalized",
  },
  {
    id: "inv-3",
    invoice_number: "INV/2026-27/0002",
    customer_name: "Hotel Pride Plaza",
    mode: "gst",
    invoice_date: "2026-02-10",
    due_date: "2026-02-25",
    grand_total: 42000.00,
    paid_amount: 42000.00,
    outstanding: 0.00,
    status: "finalized",
  },
  {
    id: "inv-4",
    invoice_number: "DRAFT-003",
    customer_name: "Apex Co-Working Space",
    mode: "gst",
    invoice_date: "2026-02-16",
    due_date: "2026-03-02",
    grand_total: 9400.00,
    paid_amount: 0.00,
    outstanding: 9400.00,
    status: "draft",
  },
];

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<InvoiceListItem[]>(DEMO_INVOICES);
  const [search, setSearch] = useState("");
  const [selectedMode, setSelectedMode] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  const filteredInvoices = invoices.filter((inv) => {
    const matchSearch =
      inv.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
      inv.customer_name.toLowerCase().includes(search.toLowerCase());
    const matchMode = selectedMode === "all" || inv.mode === selectedMode;
    const matchStatus = selectedStatus === "all" || inv.status === selectedStatus;
    return matchSearch && matchMode && matchStatus;
  });

  const totalBilled = invoices
    .filter((i) => i.status === "finalized")
    .reduce((sum, i) => sum + i.grand_total, 0);

  const totalOutstanding = invoices
    .filter((i) => i.status === "finalized")
    .reduce((sum, i) => sum + i.outstanding, 0);

  return (
    <div className="min-h-screen">
      <TopHeader
        title="Billing & Invoicing"
        subtitle="GST Tax Invoices and Non-GST Bills of Supply with stock issue"
      />

      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
        {/* Summary KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-3xl p-5 border border-[#E5E4EE] shadow-sm">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
              Total Invoiced Revenue
            </span>
            <div className="text-2xl font-black text-[#0A0A0A] mt-1">
              {formatINR(totalBilled)}
            </div>
            <p className="text-[11px] text-gray-400 mt-0.5">Excludes cancelled & drafts</p>
          </div>

          <div className="bg-white rounded-3xl p-5 border border-[#E5E4EE] shadow-sm">
            <span className="text-xs font-bold text-rose-600 uppercase tracking-wider block">
              Unpaid Receivables
            </span>
            <div className="text-2xl font-black text-rose-700 mt-1">
              {formatINR(totalOutstanding)}
            </div>
            <p className="text-[11px] text-gray-400 mt-0.5">Pending collection from shops</p>
          </div>

          <div className="bg-white rounded-3xl p-5 border border-[#E5E4EE] shadow-sm">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
              Invoice Finalization Rule
            </span>
            <div className="text-sm font-extrabold text-gray-900 mt-1">
              Immutable & Stock Deducting
            </div>
            <p className="text-[11px] text-emerald-700 font-semibold mt-0.5">
              FEFO batches allocated atomically on finalize
            </p>
          </div>
        </div>

        {/* Filter and Action Bar */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="flex flex-1 items-center gap-2 max-w-lg">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by invoice # or customer shop..."
                className="w-full h-11 pl-10 pr-4 text-xs bg-white rounded-full border border-[#E5E4EE] text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#D4F732] shadow-sm transition-all"
              />
            </div>

            <select
              value={selectedMode}
              onChange={(e) => setSelectedMode(e.target.value)}
              className="h-11 px-3 text-xs bg-white rounded-full border border-[#E5E4EE] text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-[#D4F732] shadow-sm"
            >
              <option value="all">All Modes</option>
              <option value="gst">GST Tax Invoice</option>
              <option value="non_gst">Non-GST Bill</option>
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="h-11 px-3 text-xs bg-white rounded-full border border-[#E5E4EE] text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-[#D4F732] shadow-sm"
            >
              <option value="all">All Status</option>
              <option value="finalized">Finalized</option>
              <option value="draft">Draft</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <Link
            href="/invoices/new"
            className="flex items-center justify-center gap-2 h-11 px-5 rounded-full bg-[#0A0A0A] text-white text-xs sm:text-sm font-bold shadow-md hover:bg-black/90 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4 text-[#D4F732]" />
            <span>Generate Bill</span>
          </Link>
        </div>

        {/* Invoices List Table */}
        <div className="bg-white rounded-3xl border border-[#E5E4EE] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F9F8FD] border-b border-[#E5E4EE] text-gray-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-4 px-6">Invoice #</th>
                  <th className="py-4 px-4">Customer Shop</th>
                  <th className="py-4 px-4">Mode</th>
                  <th className="py-4 px-4">Dates</th>
                  <th className="py-4 px-4 text-right">Grand Total</th>
                  <th className="py-4 px-4 text-right">Outstanding</th>
                  <th className="py-4 px-4 text-center">Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E4EE]">
                {filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-[#F9F8FD]/60 transition-colors">
                    <td className="py-4 px-6 font-mono font-bold text-gray-900">
                      <Link href={`/invoices/${inv.id}`} className="hover:underline">
                        {inv.invoice_number}
                      </Link>
                    </td>

                    <td className="py-4 px-4 font-bold text-gray-900">
                      {inv.customer_name}
                    </td>

                    <td className="py-4 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          inv.mode === "gst"
                            ? "bg-purple-50 text-purple-700 border border-purple-200"
                            : "bg-gray-100 text-gray-700 border border-gray-200"
                        }`}
                      >
                        {inv.mode === "gst" ? "GST Invoice" : "Non-GST"}
                      </span>
                    </td>

                    <td className="py-4 px-4 text-gray-500">
                      <div>Date: {inv.invoice_date}</div>
                      <div className="text-[11px] text-gray-400">Due: {inv.due_date}</div>
                    </td>

                    <td className="py-4 px-4 text-right font-black text-gray-900">
                      {formatINR(inv.grand_total)}
                    </td>

                    <td className="py-4 px-4 text-right">
                      {inv.outstanding > 0 ? (
                        <span className="font-bold text-rose-600">
                          {formatINR(inv.outstanding)}
                        </span>
                      ) : (
                        <span className="font-medium text-emerald-600">Paid in Full</span>
                      )}
                    </td>

                    <td className="py-4 px-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold capitalize ${
                          inv.status === "finalized"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : inv.status === "draft"
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : "bg-rose-50 text-rose-700 border border-rose-200"
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>

                    <td className="py-4 px-6 text-right">
                      <Link
                        href={`/invoices/${inv.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-gray-100 text-gray-800 text-xs font-semibold hover:bg-black hover:text-white transition-all"
                      >
                        <span>View & Print</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
