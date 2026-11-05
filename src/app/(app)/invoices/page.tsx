"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  FileText,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Printer,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import { TopHeader } from "@/components/layout/TopHeader";
import { formatINR } from "@/lib/formatting/currency";
import { formatDate } from "@/lib/formatting/dates";
import { RECONCILED_INVOICES, InvoiceRecord } from "@/lib/services/businessData";
import { FitNumber } from "@/components/ui/FitNumber";
import { createClient } from "@/lib/supabase/client";

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<InvoiceRecord[]>(RECONCILED_INVOICES);
  const [search, setSearch] = useState("");
  const [selectedMode, setSelectedMode] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  useEffect(() => {
    async function loadInvoices() {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("invoices")
          .select("*, customers(name, shop_name)")
          .order("created_at", { ascending: false });

        if (!error && data && data.length > 0) {
          const mapped: InvoiceRecord[] = data.map((inv: any) => {
            const custName = inv.customers?.shop_name || inv.customers?.name || "Customer";
            return {
              id: inv.id,
              invoice_number: inv.invoice_number || "INV-LIVE",
              customer_name: custName,
              customer_id: inv.customer_id,
              mode: (inv.mode as InvoiceRecord["mode"]) || "gst",
              invoice_date: inv.invoice_date || new Date().toISOString().split("T")[0],
              due_date: inv.due_date || inv.invoice_date || new Date().toISOString().split("T")[0],
              grand_total: Number(inv.grand_total) || 0,
              paid_amount: 0,
              outstanding: Number(inv.grand_total) || 0,
              status: (inv.status as InvoiceRecord["status"]) || "finalized",
            };
          });

          const merged = [...mapped, ...RECONCILED_INVOICES.filter(ri => !mapped.some(m => m.id === ri.id))];
          setInvoices(merged);
        }
      } catch (e) {
        console.warn("Could not load invoices from Supabase", e);
      }
    }
    loadInvoices();
  }, []);

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

  const finalizedInvoices = invoices.filter((i) => i.status === "finalized");
  const settledCount = finalizedInvoices.filter((i) => i.outstanding === 0).length;

  return (
    <div className="min-h-screen pb-12">
      <TopHeader title="Invoices & Bills" subtitle="GST & Cash Invoicing" />

      <div className="space-y-4 sm:space-y-6 pt-2">
        {/* Summary KPIs: Compact 2-column cards on mobile, 3-column on desktop */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-5">
          {/* Card 1: Total invoiced revenue */}
          <div className="bg-white/55 dark:bg-[#242422]/80 backdrop-blur-xl border border-white/65 dark:border-white/10 rounded-[24px] p-4 sm:p-6 shadow-none">
            <span className="text-[11px] sm:text-xs font-light text-neutral-500 dark:text-neutral-400 block">
              Total invoiced revenue
            </span>
            <div className="mt-1">
              <FitNumber
                value={totalBilled}
                maxFontSize={26}
                className="tracking-tight text-neutral-900 dark:text-white font-semibold"
              />
            </div>
            <p className="text-[10px] sm:text-[11px] font-light text-neutral-500 dark:text-neutral-400 mt-0.5 truncate">
              Excludes cancelled & drafts
            </p>
          </div>

          {/* Card 2: Unpaid receivables */}
          <div className="bg-white/55 dark:bg-[#242422]/80 backdrop-blur-xl border border-white/65 dark:border-white/10 rounded-[24px] p-4 sm:p-6 shadow-none">
            <span className="text-[11px] sm:text-xs font-light text-neutral-500 dark:text-neutral-400 block">
              Unpaid receivables
            </span>
            <div className="mt-1">
              <FitNumber
                value={totalOutstanding}
                maxFontSize={26}
                className="tracking-tight text-neutral-900 dark:text-white font-semibold"
              />
            </div>
            <p className="text-[10px] sm:text-[11px] font-light text-neutral-500 dark:text-neutral-400 mt-0.5 truncate">
              Pending collection from shops
            </p>
          </div>

          {/* Card 3: Settled Bills (Replaces previous developer text per spec) */}
          <div className="col-span-2 sm:col-span-1 bg-white/55 dark:bg-[#242422]/80 backdrop-blur-xl border border-white/65 dark:border-white/10 rounded-[24px] p-4 sm:p-6 shadow-none">
            <span className="text-[11px] sm:text-xs font-light text-neutral-500 dark:text-neutral-400 block">
              Settled bills
            </span>
            <div className="text-2xl sm:text-3xl font-semibold text-neutral-900 dark:text-white mt-1 tracking-tight flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#D7FF00] inline-block shrink-0" />
              <span>{settledCount} / {finalizedInvoices.length}</span>
            </div>
            <p className="text-[10px] sm:text-[11px] font-light text-neutral-500 dark:text-neutral-400 mt-0.5">
              Paid in full with zero balance
            </p>
          </div>
        </div>

        {/* Filter and Action Bar */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="flex items-center gap-2 flex-1 max-w-lg">
            {/* Search Input with visible search icon & short placeholder */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search bills"
                className="w-full h-10 pl-10 pr-4 text-xs bg-white/65 dark:bg-[#242422]/80 backdrop-blur-md rounded-full border border-white/70 dark:border-white/10 text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#D7FF00] shadow-none transition-all"
              />
            </div>

            {/* Custom styled select */}
            <div className="relative">
              <select
                aria-label="Filter invoice type"
                value={selectedMode}
                onChange={(e) => setSelectedMode(e.target.value)}
                className="appearance-none h-10 pl-3.5 pr-8 text-xs bg-white/65 dark:bg-[#242422]/80 backdrop-blur-md rounded-full border border-white/70 dark:border-white/10 text-neutral-700 dark:text-neutral-200 font-light focus:outline-none focus:ring-2 focus:ring-[#D7FF00] shadow-none cursor-pointer"
              >
                <option value="all">All types</option>
                <option value="gst">Tax Invoice (GST)</option>
                <option value="non_gst">Cash Bill (Non-GST)</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-neutral-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <Link
            href="/invoices/new"
            className="flex items-center justify-center gap-2 h-10 px-5 rounded-full bg-black text-white dark:bg-[#D7FF00] dark:text-black text-xs sm:text-sm font-normal shadow-none hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#D7FF00] dark:text-black" />
            <span>Create Bill</span>
          </Link>
        </div>

        {/* Invoice List: Desktop Table + Mobile Cards */}
        {filteredInvoices.length === 0 ? (
          <div className="bg-white/55 dark:bg-[#242422]/80 backdrop-blur-xl rounded-[28px] p-8 sm:p-12 text-center border border-white/65 dark:border-white/10 space-y-3">
            <FileText className="w-10 h-10 text-neutral-300 dark:text-neutral-600 mx-auto" />
            <h3 className="text-base font-normal text-neutral-900 dark:text-white">No Invoices Found</h3>
            <p className="text-xs font-light text-neutral-500 dark:text-neutral-400 max-w-sm mx-auto">
              No bills match your current filters. Clear filters or generate a new bill.
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block bg-white/55 dark:bg-[#242422]/80 backdrop-blur-xl rounded-[28px] border border-white/65 dark:border-white/10 overflow-x-auto shadow-none">
              <table className="w-full text-left text-xs">
                <thead className="bg-white/40 dark:bg-neutral-800/40 border-b border-white/60 dark:border-white/10 text-neutral-500 dark:text-neutral-400 font-normal">
                  <tr>
                    <th className="py-4 px-6">Invoice # & Customer</th>
                    <th className="py-4 px-4">Date</th>
                    <th className="py-4 px-4">Type</th>
                    <th className="py-4 px-4">Status</th>
                    <th className="py-4 px-4 text-right">Total Amount</th>
                    <th className="py-4 px-4 text-right">Outstanding</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/50 dark:divide-neutral-700/50">
                  {filteredInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-white/40 dark:hover:bg-neutral-800/40 transition-colors">
                      <td className="py-4 px-6">
                        <Link href={`/invoices/${inv.id}`} className="group">
                          <div className="font-normal text-neutral-900 dark:text-white group-hover:text-black group-hover:underline text-sm tabular-nums">
                            {inv.invoice_number}
                          </div>
                          <div className="text-[11px] font-light text-neutral-500 dark:text-neutral-400 mt-0.5">
                            {inv.customer_name}
                          </div>
                        </Link>
                      </td>

                      <td className="py-4 px-4 text-neutral-700 dark:text-neutral-300 font-light">
                        {formatDate(inv.invoice_date)}
                      </td>

                      <td className="py-4 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-light bg-white/60 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 uppercase border border-white/70 dark:border-white/10">
                          {inv.mode === "gst" ? "GST Tax Invoice" : "Cash Bill"}
                        </span>
                      </td>

                      <td className="py-4 px-4">
                        {inv.status === "finalized" ? (
                          inv.outstanding === 0 ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-light bg-white/70 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-white/70 dark:border-white/10">
                              <span className="w-2 h-2 rounded-full bg-[#D7FF00]" />
                              <span>Paid in full</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-light bg-white/70 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-white/70 dark:border-white/10">
                              <span className="w-2 h-2 rounded-full bg-[#DB9595]" />
                              <span>Partial</span>
                            </span>
                          )
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-light bg-white/70 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-white/70 dark:border-white/10">
                            <span className="w-2 h-2 rounded-full bg-neutral-400" />
                            <span>Draft</span>
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-4 text-right font-light text-neutral-800 dark:text-neutral-200">
                        {formatINR(inv.grand_total)}
                      </td>

                      <td className="py-4 px-4 text-right font-semibold">
                        {inv.outstanding > 0 ? (
                          <span className="text-neutral-900 dark:text-white flex items-center justify-end gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-[#DB9595]" />
                            <span>{formatINR(inv.outstanding)}</span>
                          </span>
                        ) : (
                          <span className="text-neutral-700 dark:text-neutral-300 font-light flex items-center justify-end gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-[#D7FF00]" />
                            <span>Settled</span>
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-6 text-right">
                        <Link
                          href={`/invoices/${inv.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/60 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 text-xs font-light hover:bg-black hover:text-white dark:hover:bg-[#D7FF00] dark:hover:text-black border border-white/70 dark:border-white/10 transition-all shadow-none"
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

            {/* Mobile Cards View: compact glass cards with palette dots and tabular-nums IDs */}
            <div className="md:hidden space-y-3">
              {filteredInvoices.map((inv) => (
                <div
                  key={inv.id}
                  className="bg-white/55 dark:bg-[#242422]/80 backdrop-blur-xl rounded-[24px] p-4 border border-white/65 dark:border-white/10 shadow-none space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <span className="text-[10px] tabular-nums font-normal text-neutral-500 dark:text-neutral-400 block mb-0.5">
                        {inv.invoice_number}
                      </span>
                      <h4 className="text-sm font-semibold text-neutral-900 dark:text-white truncate">
                        {inv.customer_name}
                      </h4>
                      <p className="text-xs font-light text-neutral-500 dark:text-neutral-400">
                        {inv.mode === "gst" ? "Tax Invoice (GST)" : "Cash Bill"}
                      </p>
                    </div>

                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-light bg-white/80 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-white/70 dark:border-white/10 shrink-0">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          inv.status === "finalized"
                            ? inv.outstanding === 0
                              ? "bg-[#D7FF00]"
                              : "bg-[#DB9595]"
                            : "bg-neutral-400"
                        }`}
                      />
                      <span>
                        {inv.status === "finalized"
                          ? inv.outstanding === 0
                            ? "Paid"
                            : "Partial"
                          : "Draft"}
                      </span>
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1 border-t border-white/40 dark:border-neutral-700/40">
                    <span className="text-[11px] font-light text-neutral-500 dark:text-neutral-400">
                      {formatDate(inv.invoice_date)}
                    </span>
                    <span className="text-sm font-semibold text-neutral-900 dark:text-white">
                      {formatINR(inv.grand_total)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div>
                      {inv.outstanding > 0 ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-neutral-900 dark:text-white">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#DB9595]" />
                          <span>{formatINR(inv.outstanding)} due</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-light text-neutral-700 dark:text-neutral-300">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#D7FF00]" />
                          <span>Zero balance</span>
                        </span>
                      )}
                    </div>

                    <Link
                      href={`/invoices/${inv.id}`}
                      className="inline-flex items-center justify-center gap-1 px-4 min-h-[44px] rounded-full bg-black text-white dark:bg-[#D7FF00] dark:text-black text-xs font-normal hover:scale-105 active:scale-95 transition-all shadow-none"
                    >
                      <span>View</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Mobile Floating Action Button (FAB) bottom-right */}
      <Link
        href="/invoices/new"
        className="md:hidden fixed right-5 bottom-24 z-30 w-12 h-12 rounded-full bg-black text-[#D7FF00] dark:bg-[#D7FF00] dark:text-black flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all"
        title="Create Bill"
        aria-label="Create Bill"
      >
        <Plus className="w-6 h-6" />
      </Link>
    </div>
  );
}
