"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  FileText,
  Plus,
  Search,
  ChevronRight,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { TopHeader } from "@/components/layout/TopHeader";
import { formatINR } from "@/lib/formatting/currency";
import { formatDate } from "@/lib/formatting/dates";
import { InvoiceRecord } from "@/lib/services/businessData";
import { FitNumber } from "@/components/ui/FitNumber";
import { createClient } from "@/lib/supabase/client";
import { StyledSelect } from "@/components/ui/StyledSelect";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedMode, setSelectedMode] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  const [draftToDelete, setDraftToDelete] = useState<InvoiceRecord | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const loadInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const [{ data, error }, { data: outData }] = await Promise.all([
        supabase
          .from("invoices")
          .select("*, customers(name, shop_name)")
          .order("created_at", { ascending: false }),
        supabase
          .from("v_invoice_outstanding")
          .select("invoice_id, amount_paid, outstanding, is_overdue"),
      ]);

      const outMap = new Map<string, any>();
      for (const row of outData || []) {
        outMap.set(row.invoice_id, row);
      }

      if (!error && data) {
        const mapped: InvoiceRecord[] = data.map((inv: any) => {
          const custName = inv.customers?.shop_name || inv.customers?.name || "Customer";
          const grandTotal = Number(inv.grand_total) || 0;
          const out = outMap.get(inv.id);
          const isFinalized = inv.status === "finalized";
          const isCancelled = inv.status === "cancelled";

          return {
            id: inv.id,
            invoice_number: inv.invoice_number || "DRAFT",
            customer_name: custName,
            customer_id: inv.customer_id,
            mode: (inv.mode as InvoiceRecord["mode"]) || "gst",
            invoice_date: inv.invoice_date || (inv.created_at || new Date().toISOString()).split("T")[0],
            due_date: inv.due_date || inv.invoice_date || (inv.created_at || new Date().toISOString()).split("T")[0],
            grand_total: grandTotal,
            paid_amount: isFinalized && out ? Number(out.amount_paid) || 0 : 0,
            outstanding: isCancelled
              ? 0
              : isFinalized && out
              ? Number(out.outstanding)
              : grandTotal,
            status: (inv.status as InvoiceRecord["status"]) || "draft",
          };
        });

        setInvoices(mapped);
      }
    } catch (e) {
      console.warn("Could not load invoices from Supabase", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  const handleDeleteInvoice = async () => {
    if (!draftToDelete) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/invoices/${draftToDelete.id}`, {
        method: "DELETE",
      });
      const payload = await res.json().catch(() => null);

      if (!res.ok || !payload?.success) {
        setDeleteError(payload?.error || "Failed to delete invoice.");
        return;
      }
      toast.success(
        payload.stockMovementsRemoved > 0
          ? `Bill ${draftToDelete.invoice_number} deleted and stock recovered.`
          : `Bill ${draftToDelete.invoice_number} deleted permanently.`
      );
      setDraftToDelete(null);
      await loadInvoices();
    } catch (err: any) {
      setDeleteError(err?.message || "Failed to delete invoice");
    } finally {
      setDeleting(false);
    }
  };

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
  const settledCount = finalizedInvoices.filter((i) => i.outstanding <= 0).length;

  return (
    <div className="min-h-screen pb-12">
      <TopHeader title="Invoices & Bills" subtitle="GST & Cash Invoicing" />

      <div className="space-y-4 sm:space-y-6 pt-2">
        {/* Summary KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-5">
          <div className="bg-white/55 backdrop-blur-xl border border-white/65 rounded-[24px] p-4 sm:p-6 shadow-none min-w-0">
            <span className="text-[11px] sm:text-xs font-light text-neutral-500 block">
              Total invoiced revenue
            </span>
            <div className="mt-1">
              <FitNumber
                value={totalBilled}
                maxFontSize={26}
                className="tracking-tight text-neutral-900 font-semibold"
              />
            </div>
            <p className="text-[10px] sm:text-[11px] font-light text-neutral-500 mt-0.5 truncate">
              Excludes cancelled & drafts
            </p>
          </div>

          <div className="bg-white/55 backdrop-blur-xl border border-white/65 rounded-[24px] p-4 sm:p-6 shadow-none min-w-0">
            <span className="text-[11px] sm:text-xs font-light text-neutral-500 block">
              Unpaid receivables
            </span>
            <div className="mt-1">
              <FitNumber
                value={totalOutstanding}
                maxFontSize={26}
                className="tracking-tight text-neutral-900 font-semibold"
              />
            </div>
            <p className="text-[10px] sm:text-[11px] font-light text-neutral-500 mt-0.5 truncate">
              Pending collection from shops
            </p>
          </div>

          <div className="col-span-2 sm:col-span-1 bg-white/55 backdrop-blur-xl border border-white/65 rounded-[24px] p-4 sm:p-6 shadow-none min-w-0">
            <span className="text-[11px] sm:text-xs font-light text-neutral-500 block">
              Settled bills
            </span>
            <div className="text-2xl sm:text-3xl font-semibold text-neutral-900 mt-1 tracking-tight flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#D7FF00] inline-block shrink-0" />
              <span>{settledCount} / {finalizedInvoices.length}</span>
            </div>
            <p className="text-[10px] sm:text-[11px] font-light text-neutral-500 mt-0.5">
              Paid in full with zero balance
            </p>
          </div>
        </div>

        {/* Filter and Action Bar */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-1 max-w-2xl min-w-0">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 z-10 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search bills"
                className="w-full h-10 pl-10 pr-4 text-xs bg-white/75 backdrop-blur-md rounded-full border border-white/80 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#D7FF00] transition-all"
              />
            </div>

            <StyledSelect
              aria-label="Filter invoice type"
              value={selectedMode}
              onChange={(e) => setSelectedMode(e.target.value)}
              wrapperClassName="sm:w-44"
              className="h-10 py-0 text-xs bg-white/75 border-white/80 text-neutral-800"
            >
              <option value="all">All types</option>
              <option value="gst">Tax Invoice (GST)</option>
              <option value="non_gst">Cash Bill (Non-GST)</option>
            </StyledSelect>

            <StyledSelect
              aria-label="Filter invoice status"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              wrapperClassName="sm:w-40"
              className="h-10 py-0 text-xs bg-white/75 border-white/80 text-neutral-800"
            >
              <option value="all">All statuses</option>
              <option value="finalized">Finalized</option>
              <option value="draft">Draft</option>
              <option value="cancelled">Cancelled</option>
            </StyledSelect>
          </div>

          <Link
            href="/invoices/new"
            className="flex items-center justify-center gap-2 h-10 px-5 rounded-full bg-black text-white text-xs sm:text-sm font-normal hover:scale-105 active:scale-95 transition-all cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4 text-[#D7FF00]" />
            <span>Create Bill</span>
          </Link>
        </div>

        {/* Invoice List */}
        {loading ? (
          <div className="bg-white/55 backdrop-blur-xl rounded-[28px] p-10 text-center border border-white/65 text-xs text-neutral-500">
            Loading invoices from database...
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="bg-white/55 backdrop-blur-xl rounded-[28px] p-8 sm:p-12 text-center border border-white/65 space-y-3">
            <FileText className="w-10 h-10 text-neutral-300 mx-auto" />
            <h3 className="text-base font-normal text-neutral-900">No Invoices Found</h3>
            <p className="text-xs font-light text-neutral-500 max-w-sm mx-auto">
              No bills match your current filters. Clear filters or generate a new bill.
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block bg-white/55 backdrop-blur-xl rounded-[28px] border border-white/65 table-wrapper shadow-none">
              <table className="w-full text-left text-xs">
                <thead className="bg-white/40 border-b border-white/60 text-neutral-500 font-normal">
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
                <tbody className="divide-y divide-white/50">
                  {filteredInvoices.map((inv) => {
                    const statusLabel =
                      inv.status === "cancelled"
                        ? "Cancelled"
                        : inv.status === "draft"
                        ? "Draft"
                        : inv.outstanding <= 0
                        ? "Paid in full"
                        : inv.paid_amount > 0
                        ? "Partial"
                        : "Unpaid";
                    const dotColor =
                      inv.status === "cancelled"
                        ? "bg-rose-400"
                        : inv.status === "draft"
                        ? "bg-neutral-400"
                        : inv.outstanding <= 0
                        ? "bg-[#D7FF00]"
                        : "bg-[#DB9595]";

                    return (
                      <tr key={inv.id} className="hover:bg-white/40 transition-colors">
                        <td className="py-4 px-6">
                          <Link href={`/invoices/${inv.id}`} className="group">
                            <div className="font-normal text-neutral-900 group-hover:text-black group-hover:underline text-sm tabular-nums">
                              {inv.invoice_number}
                            </div>
                            <div className="text-[11px] font-light text-neutral-500 mt-0.5">
                              {inv.customer_name}
                            </div>
                          </Link>
                        </td>

                        <td className="py-4 px-4 text-neutral-700 font-light whitespace-nowrap">
                          {formatDate(inv.invoice_date)}
                        </td>

                        <td className="py-4 px-4 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-light bg-white/60 text-neutral-700 uppercase border border-white/70">
                            {inv.mode === "gst" ? "GST Tax Invoice" : "Cash Bill"}
                          </span>
                        </td>

                        <td className="py-4 px-4 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-light bg-white/70 text-neutral-800 border border-white/70">
                            <span className={`w-2 h-2 rounded-full ${dotColor}`} />
                            <span>{statusLabel}</span>
                          </span>
                        </td>

                        <td className="py-4 px-4 text-right font-light text-neutral-800 whitespace-nowrap">
                          {formatINR(inv.grand_total)}
                        </td>

                        <td className="py-4 px-4 text-right font-semibold whitespace-nowrap">
                          {inv.status === "cancelled" ? (
                            <span className="text-neutral-400 font-light">Void</span>
                          ) : inv.outstanding > 0 ? (
                            <span className="text-neutral-900 flex items-center justify-end gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-[#DB9595]" />
                              <span>{formatINR(inv.outstanding)}</span>
                            </span>
                          ) : (
                            <span className="text-neutral-700 font-light flex items-center justify-end gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-[#D7FF00]" />
                              <span>Settled</span>
                            </span>
                          )}
                        </td>

                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setDeleteError(null);
                                setDraftToDelete(inv);
                              }}
                              aria-label={`Delete invoice ${inv.invoice_number}`}
                              title="Delete Bill"
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-rose-50 text-rose-700 text-xs font-medium hover:bg-rose-100 border border-rose-200 transition-all cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete</span>
                            </button>
                            <Link
                              href={`/invoices/${inv.id}`}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/60 text-neutral-800 text-xs font-light hover:bg-black hover:text-white border border-white/70 transition-all"
                            >
                              <span>View</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="md:hidden space-y-3">
              {filteredInvoices.map((inv) => {
                const statusLabel =
                  inv.status === "cancelled"
                    ? "Cancelled"
                    : inv.status === "draft"
                    ? "Draft"
                    : inv.outstanding <= 0
                    ? "Paid"
                    : "Due";
                return (
                  <div
                    key={inv.id}
                    className="bg-white/55 backdrop-blur-xl rounded-[24px] p-4 border border-white/65 shadow-none space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span className="text-[10px] tabular-nums font-normal text-neutral-500 block mb-0.5">
                          {inv.invoice_number}
                        </span>
                        <h4 className="text-sm font-semibold text-neutral-900 truncate">
                          {inv.customer_name}
                        </h4>
                        <p className="text-xs font-light text-neutral-500">
                          {inv.mode === "gst" ? "Tax Invoice (GST)" : "Cash Bill"}
                        </p>
                      </div>

                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-light bg-white/80 text-neutral-800 border border-white/70 shrink-0">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            inv.status === "finalized"
                              ? inv.outstanding <= 0
                                ? "bg-[#D7FF00]"
                                : "bg-[#DB9595]"
                              : inv.status === "cancelled"
                              ? "bg-rose-400"
                              : "bg-neutral-400"
                          }`}
                        />
                        <span>{statusLabel}</span>
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1 border-t border-white/40">
                      <span className="text-[11px] font-light text-neutral-500">
                        {formatDate(inv.invoice_date)}
                      </span>
                      <span className="text-sm font-semibold text-neutral-900">
                        {formatINR(inv.grand_total)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-1">
                      <div>
                        {inv.status === "cancelled" ? (
                          <span className="text-[11px] text-neutral-400">Cancelled</span>
                        ) : inv.outstanding > 0 ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-neutral-900">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#DB9595]" />
                            <span>{formatINR(inv.outstanding)} due</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-light text-neutral-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#D7FF00]" />
                            <span>Zero balance</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setDeleteError(null);
                            setDraftToDelete(inv);
                          }}
                          aria-label={`Delete invoice ${inv.invoice_number}`}
                          className="inline-flex items-center justify-center px-3 min-h-[40px] rounded-full bg-rose-50 text-rose-700 text-xs font-medium border border-rose-200"
                        >
                          Delete
                        </button>
                        <Link
                          href={`/invoices/${inv.id}`}
                          className="inline-flex items-center justify-center gap-1 px-4 min-h-[40px] rounded-full bg-black text-white text-xs font-normal"
                        >
                          <span>View</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(draftToDelete)}
        title={`Delete bill ${draftToDelete?.invoice_number || ""}?`}
        description="This permanently deletes this bill from the software and database, removes its ledger impact, and recovers any deducted inventory stock automatically."
        confirmLabel="Delete Bill"
        loading={deleting}
        error={deleteError}
        onConfirm={handleDeleteInvoice}
        onClose={() => !deleting && setDraftToDelete(null)}
      />
    </div>
  );
}
