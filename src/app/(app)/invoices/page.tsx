"use client";

import { useState } from "react";
import Link from "next/link";
import {
  FileText,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Printer,
  ChevronRight,
} from "lucide-react";
import { TopHeader } from "@/components/layout/TopHeader";
import { formatINR } from "@/lib/formatting/currency";

interface InvoiceListItem {
  id: string;
  invoice_number: string;
  customer_name: string;
  mode: "gst" | "non_gst";
  invoice_date: string;
  due_date: string;
  grand_total: number;
  paid_amount: number;
  outstanding: number;
  status: "draft" | "finalized" | "cancelled";
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
    <div className="min-h-screen pb-12">
      <TopHeader title="Invoices & Bills" />

      <div className="space-y-6 pt-2">
        {/* Summary KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="bg-white/55 backdrop-blur-xl border border-white/65 rounded-[24px] p-6 shadow-sm">
            <span className="text-xs font-light text-neutral-500 block">
              Total invoiced revenue
            </span>
            <div className="text-3xl font-normal text-neutral-900 mt-1 tracking-tight">
              {formatINR(totalBilled)}
            </div>
            <p className="text-[11px] font-light text-neutral-500 mt-0.5">Excludes cancelled & drafts</p>
          </div>

          <div className="bg-white/55 backdrop-blur-xl border border-white/65 rounded-[24px] p-6 shadow-sm">
            <span className="text-xs font-light text-neutral-500 block">
              Unpaid receivables
            </span>
            <div className="text-3xl font-normal text-rose-600 mt-1 tracking-tight">
              {formatINR(totalOutstanding)}
            </div>
            <p className="text-[11px] font-light text-neutral-500 mt-0.5">Pending collection from shops</p>
          </div>

          <div className="bg-white/55 backdrop-blur-xl border border-white/65 rounded-[24px] p-6 shadow-sm">
            <span className="text-xs font-light text-neutral-500 block">
              Stock issue rule
            </span>
            <div className="text-sm font-normal text-neutral-900 mt-1">
              Immutable & stock deducting
            </div>
            <p className="text-[11px] font-light text-emerald-600 mt-0.5">
              FEFO batches allocated atomically on finalize
            </p>
          </div>
        </div>

        {/* Filter and Action Bar */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="flex flex-1 items-center gap-2 max-w-lg">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by bill number or shop..."
                className="w-full h-10 pl-10 pr-4 text-xs bg-white/65 backdrop-blur-md rounded-full border border-white/70 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#E0FE52] shadow-sm transition-all"
              />
            </div>

            <select
              value={selectedMode}
              onChange={(e) => setSelectedMode(e.target.value)}
              className="h-10 px-3.5 text-xs bg-white/65 backdrop-blur-md rounded-full border border-white/70 text-neutral-700 font-light focus:outline-none focus:ring-2 focus:ring-[#E0FE52] shadow-sm"
            >
              <option value="all">All tax types</option>
              <option value="gst">GST Tax Invoices</option>
              <option value="non_gst">Non-GST Bills</option>
            </select>
          </div>

          <Link
            href="/invoices/new"
            className="flex items-center justify-center gap-2 h-10 px-5 rounded-full bg-black text-white text-xs sm:text-sm font-normal shadow-md hover:scale-105 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4 text-[#E0FE52]" />
            <span>Create Bill</span>
          </Link>
        </div>

        {/* Invoices Table */}
        <div className="hidden md:block bg-white/55 backdrop-blur-xl rounded-[28px] border border-white/65 overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-white/40 border-b border-white/60 text-neutral-500 font-normal">
              <tr>
                <th className="py-4 px-6">Invoice #</th>
                <th className="py-4 px-4">Customer</th>
                <th className="py-4 px-4">Type</th>
                <th className="py-4 px-4">Date</th>
                <th className="py-4 px-4 text-right">Grand Total</th>
                <th className="py-4 px-4 text-right">Paid</th>
                <th className="py-4 px-4 text-right">Outstanding</th>
                <th className="py-4 px-4 text-center">Status</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/50">
              {filteredInvoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-white/40 transition-colors">
                  <td className="py-4 px-6 font-mono font-normal text-neutral-900">
                    <Link href={`/invoices/${inv.id}`} className="hover:underline">
                      {inv.invoice_number}
                    </Link>
                  </td>
                  <td className="py-4 px-4 font-normal text-neutral-900">
                    {inv.customer_name}
                  </td>
                  <td className="py-4 px-4">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-light bg-white/60 text-neutral-700 border border-white/70">
                      {inv.mode === "gst" ? "GST Tax Invoice" : "Bill of Supply"}
                    </span>
                  </td>
                  <td className="py-4 px-4 font-light text-neutral-500">
                    {inv.invoice_date}
                  </td>
                  <td className="py-4 px-4 text-right font-normal text-neutral-900">
                    {formatINR(inv.grand_total)}
                  </td>
                  <td className="py-4 px-4 text-right font-light text-emerald-600">
                    {formatINR(inv.paid_amount)}
                  </td>
                  <td className="py-4 px-4 text-right font-normal text-rose-600">
                    {inv.outstanding > 0 ? formatINR(inv.outstanding) : "—"}
                  </td>
                  <td className="py-4 px-4 text-center">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-light border capitalize ${
                        inv.status === "finalized"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200/60"
                          : inv.status === "draft"
                          ? "bg-amber-50 text-amber-700 border-amber-200/60"
                          : "bg-rose-50 text-rose-700 border-rose-200/60"
                      }`}
                    >
                      {inv.status}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <Link
                      href={`/invoices/${inv.id}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/60 hover:bg-black hover:text-white text-neutral-800 text-xs font-light border border-white/70 transition-all shadow-sm"
                    >
                      <span>View</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile View */}
        <div className="md:hidden space-y-3">
          {filteredInvoices.map((inv) => (
            <div
              key={inv.id}
              className="bg-white/55 backdrop-blur-xl rounded-[24px] p-5 border border-white/65 shadow-sm space-y-2.5"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono text-neutral-400 block mb-0.5">
                    {inv.invoice_number}
                  </span>
                  <h4 className="text-sm font-normal text-neutral-900">{inv.customer_name}</h4>
                  <p className="text-xs font-light text-neutral-500">{inv.invoice_date}</p>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-white/60 text-[10px] font-light border border-white/70 capitalize">
                  {inv.status}
                </span>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-white/50 text-xs">
                <div>
                  <span className="text-[10px] font-light text-neutral-400 block">Total</span>
                  <span className="font-normal text-neutral-900">{formatINR(inv.grand_total)}</span>
                </div>
                <Link
                  href={`/invoices/${inv.id}`}
                  className="px-3 py-1 rounded-full bg-black text-white text-xs font-light shadow-sm"
                >
                  View
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
