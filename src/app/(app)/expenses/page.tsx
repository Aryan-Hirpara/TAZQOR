"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { Edit2, FileText, Image as ImageIcon, Plus, Search, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { TopHeader } from "@/components/layout/TopHeader";
import { StyledSelect } from "@/components/ui/StyledSelect";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ExpenseForm } from "@/components/expenses/ExpenseForm";
import { ExpenseBillModal } from "@/components/expenses/ExpenseBillModal";
import { formatINR } from "@/lib/formatting/currency";
import {
  EXPENSE_PAYERS,
  type ExpensePayer,
  type ExpenseRecord,
} from "@/lib/expenses/expense-record";

const PAYER_BADGE_CLASSES: Record<ExpensePayer, string> = {
  Aryan: "bg-neutral-900 text-[#E0FE52] border-neutral-900",
  Yug: "bg-sky-50 text-sky-800 border-sky-200/80",
  Other: "bg-white/80 text-neutral-800 border-black/10",
};

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedPayer, setSelectedPayer] = useState<string>("all");

  const [editingExpense, setEditingExpense] = useState<ExpenseRecord | null>(null);
  const [viewingBillExpense, setViewingBillExpense] = useState<ExpenseRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ExpenseRecord | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const editDialogRef = useRef<HTMLDialogElement>(null);
  const pressedOutsideEditRef = useRef(false);
  const editTitleId = useId();

  const loadExpenses = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/expenses", { cache: "no-store" });
      const json = await res.json().catch(() => ({}));
      if (res.ok && Array.isArray(json.expenses)) {
        setExpenses(json.expenses as ExpenseRecord[]);
      }
    } catch (err) {
      console.warn("Expenses fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadExpenses();
  }, [loadExpenses]);

  useEffect(() => {
    const dialog = editDialogRef.current;
    if (!dialog) return;

    if (editingExpense) {
      if (!dialog.open) {
        dialog.returnValue = "";
        dialog.showModal();
      }
    } else if (dialog.open) {
      dialog.returnValue = "";
      dialog.close();
    }
  }, [editingExpense]);

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/expenses/${encodeURIComponent(deleteTarget.id)}`, {
        method: "DELETE",
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json.error || "Failed to delete expense");
      }
      setExpenses((prev) => prev.filter((item) => item.id !== deleteTarget.id));
      toast.success(`Deleted "${deleteTarget.expense_name}"`);
      setDeleteTarget(null);
    } catch (err: unknown) {
      setDeleteError(err instanceof Error ? err.message : "Failed to delete expense");
    } finally {
      setDeleting(false);
    }
  };

  const isOutsideEditDialog = (
    e: React.PointerEvent<HTMLDialogElement>,
    dialog: HTMLDialogElement
  ) => {
    const r = dialog.getBoundingClientRect();
    return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
  };

  const filteredExpenses = expenses.filter((e) => {
    const q = search.trim().toLowerCase();
    const matchSearch =
      !q ||
      e.expense_name.toLowerCase().includes(q) ||
      e.vendor.toLowerCase().includes(q) ||
      e.description.toLowerCase().includes(q) ||
      e.paid_by.toLowerCase().includes(q) ||
      e.payment_method.toLowerCase().includes(q);
    const matchPayer = selectedPayer === "all" || e.paid_by === selectedPayer;
    return matchSearch && matchPayer;
  });

  const now = new Date();
  const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const monthlyExpenses = expenses.filter((e) => e.date?.startsWith(monthPrefix));
  const totalMonthlyExpense = monthlyExpenses.reduce((acc, e) => acc + e.amount, 0);

  const payerTotals = monthlyExpenses.reduce<Record<ExpensePayer, number>>(
    (acc, exp) => {
      acc[exp.paid_by] = (acc[exp.paid_by] || 0) + exp.amount;
      return acc;
    },
    { Aryan: 0, Yug: 0, Other: 0 }
  );

  const topPayerEntry = (Object.entries(payerTotals) as [ExpensePayer, number][])
    .filter(([, amt]) => amt > 0)
    .sort((a, b) => b[1] - a[1])[0];

  return (
    <div className="min-h-screen pb-12">
      <TopHeader title="Business Expenses" />

      <div className="space-y-6 pt-2">
        {/* KPI Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <div className="bg-white/55 backdrop-blur-xl border border-white/65 rounded-[24px] p-4 sm:p-5 shadow-none min-w-0">
            <span className="text-[11px] sm:text-xs font-light text-neutral-500 block">
              Total expenses (this month)
            </span>
            <div className="text-2xl sm:text-3xl font-semibold text-neutral-900 mt-1 tracking-tight">
              {formatINR(totalMonthlyExpense)}
            </div>
            <p className="text-[10px] sm:text-[11px] font-light text-neutral-500 mt-0.5 truncate">
              Deducted from gross margin for net profit
            </p>
          </div>

          <div className="bg-white/55 backdrop-blur-xl border border-white/65 rounded-[24px] p-4 sm:p-5 shadow-none min-w-0">
            <span className="text-[11px] sm:text-xs font-light text-neutral-500 block">
              Paid by (this month)
            </span>
            <div className="text-2xl sm:text-3xl font-semibold text-neutral-900 mt-1 tracking-tight truncate">
              {topPayerEntry ? topPayerEntry[0] : "No expenses yet"}
            </div>
            <p className="text-[10px] sm:text-[11px] font-light text-neutral-500 mt-0.5 truncate">
              Aryan {formatINR(payerTotals.Aryan)} · Yug {formatINR(payerTotals.Yug)} · Other{" "}
              {formatINR(payerTotals.Other)}
            </p>
          </div>

          <div className="bg-white/55 backdrop-blur-xl border border-white/65 rounded-[24px] p-4 sm:p-5 shadow-none flex items-center justify-between gap-2 min-w-0">
            <div className="min-w-0">
              <span className="text-[11px] sm:text-xs font-light text-neutral-500 block">
                Logged records
              </span>
              <p className="text-sm font-normal text-neutral-900 mt-0.5">
                {expenses.length} Expense Bills
              </p>
            </div>
            <Link
              href="/expenses/new"
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-black text-white text-xs font-normal shadow-md hover:scale-105 active:scale-95 transition-all shrink-0"
            >
              <Plus className="w-3.5 h-3.5 text-[#E0FE52]" aria-hidden="true" />
              <span>Add Expense</span>
            </Link>
          </div>
        </div>

        {/* Action & Filter Bar */}
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <search className="flex flex-col sm:flex-row flex-1 items-stretch sm:items-center gap-2.5 max-w-2xl min-w-0">
            <div className="relative flex-1 min-w-0 sm:min-w-[200px]">
              <Search
                className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 z-10 pointer-events-none"
                aria-hidden="true"
              />
              <input
                type="search"
                aria-label="Search expenses by name, vendor, or notes"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search expense name, vendor, or notes..."
                className="w-full h-11 pl-10 pr-4 text-xs bg-white/60 backdrop-blur-md rounded-full border border-white/70 text-neutral-900 placeholder-neutral-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4F732] shadow-sm transition-all"
              />
            </div>

            <StyledSelect
              value={selectedPayer}
              onChange={(e) => setSelectedPayer(e.target.value)}
              aria-label="Filter expenses by who paid"
              wrapperClassName="w-full sm:w-48 shrink-0"
              className="h-11 py-0 pl-4 text-xs bg-white/60 backdrop-blur-md rounded-full border border-white/70 text-neutral-700 font-light focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4F732] shadow-sm"
            >
              <option value="all">Who Paid: All</option>
              {EXPENSE_PAYERS.map((payer) => (
                <option key={payer} value={payer}>
                  {payer}
                </option>
              ))}
            </StyledSelect>
          </search>

          <Link
            href="/expenses/new"
            className="flex items-center justify-center gap-2 h-11 px-5 rounded-full bg-black text-white text-xs sm:text-sm font-normal shadow-sm hover:scale-105 active:scale-95 transition-all shrink-0"
          >
            <Plus className="w-4 h-4 text-[#E0FE52]" aria-hidden="true" />
            <span>Add Expense</span>
          </Link>
        </div>

        {/* Expenses Table */}
        <div className="bg-white/55 backdrop-blur-xl rounded-[28px] border border-white/65 overflow-hidden shadow-none">
          <div
            className="table-wrapper"
            tabIndex={0}
            role="region"
            aria-label="Expenses table container"
          >
            <table className="w-full text-left text-xs min-w-[760px]">
              <thead className="bg-white/40 border-b border-white/60 text-neutral-500 font-normal">
                <tr>
                  <th scope="col" className="py-4 px-6 font-normal whitespace-nowrap">
                    Date
                  </th>
                  <th scope="col" className="py-4 px-4 font-normal">
                    Expense Name
                  </th>
                  <th scope="col" className="py-4 px-4 font-normal whitespace-nowrap">
                    Paid By
                  </th>
                  <th scope="col" className="py-4 px-4 font-normal">
                    Vendor
                  </th>
                  <th scope="col" className="py-4 px-4 font-normal whitespace-nowrap">
                    Payment Method
                  </th>
                  <th scope="col" className="py-4 px-4 font-normal whitespace-nowrap">
                    Bill
                  </th>
                  <th scope="col" className="py-4 px-4 text-right font-normal whitespace-nowrap">
                    Amount
                  </th>
                  <th scope="col" className="py-4 px-6 text-right font-normal whitespace-nowrap">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/40">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-xs text-neutral-500">
                      Loading expenses...
                    </td>
                  </tr>
                ) : filteredExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-xs text-neutral-500">
                      No expenses recorded yet.
                    </td>
                  </tr>
                ) : (
                  filteredExpenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-white/40 transition-colors">
                      <td className="py-4 px-6 font-normal text-neutral-600 whitespace-nowrap">
                        {exp.date}
                      </td>
                      <td className="py-4 px-4 max-w-[260px]">
                        <div className="font-medium text-neutral-900 truncate">
                          {exp.expense_name}
                        </div>
                        {exp.description && (
                          <div className="text-[11px] font-light text-neutral-500 truncate mt-0.5">
                            {exp.description}
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${
                            PAYER_BADGE_CLASSES[exp.paid_by]
                          }`}
                        >
                          {exp.paid_by}
                        </span>
                      </td>
                      <td className="py-4 px-4 font-normal text-neutral-700">
                        {exp.vendor || "—"}
                      </td>
                      <td className="py-4 px-4 text-neutral-600 font-light whitespace-nowrap">
                        {exp.payment_method}
                      </td>
                      <td className="py-4 px-4 whitespace-nowrap">
                        {exp.receipt_url ? (
                          <button
                            type="button"
                            onClick={() => setViewingBillExpense(exp)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/80 hover:bg-white border border-black/10 text-[11px] font-medium text-neutral-800 transition-colors cursor-pointer"
                          >
                            {exp.bill_kind === "pdf" ? (
                              <FileText className="w-3 h-3 text-rose-600" aria-hidden="true" />
                            ) : (
                              <ImageIcon className="w-3 h-3 text-neutral-700" aria-hidden="true" />
                            )}
                            <span>View Bill</span>
                          </button>
                        ) : (
                          <span className="text-neutral-400">—</span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-right font-medium text-rose-600 text-sm whitespace-nowrap">
                        {formatINR(exp.amount)}
                      </td>
                      <td className="py-4 px-6 text-right whitespace-nowrap">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setEditingExpense(exp)}
                            aria-label={`Edit ${exp.expense_name}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/80 hover:bg-white border border-black/10 text-[11px] font-medium text-neutral-800 transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3 h-3" aria-hidden="true" />
                            <span>Edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setDeleteError(null);
                              setDeleteTarget(exp);
                            }}
                            aria-label={`Delete ${exp.expense_name}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 hover:bg-rose-100 border border-rose-200/70 text-[11px] font-medium text-rose-600 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" aria-hidden="true" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Edit Expense Modal */}
      <dialog
        ref={editDialogRef}
        aria-labelledby={editTitleId}
        onCancel={(e) => {
          e.preventDefault();
          setEditingExpense(null);
        }}
        onClose={() => {
          if (editDialogRef.current) {
            editDialogRef.current.returnValue = "";
          }
        }}
        onPointerDown={(e) => {
          if (editDialogRef.current) {
            pressedOutsideEditRef.current = isOutsideEditDialog(e, editDialogRef.current);
          }
        }}
        onPointerUp={(e) => {
          if (
            editDialogRef.current &&
            pressedOutsideEditRef.current &&
            isOutsideEditDialog(e, editDialogRef.current)
          ) {
            setEditingExpense(null);
          }
          pressedOutsideEditRef.current = false;
        }}
        className="m-auto w-[calc(100vw-2rem)] max-w-2xl rounded-[28px] bg-white/95 backdrop-blur-2xl border border-black/10 p-6 sm:p-7 text-neutral-900 shadow-2xl outline-none"
      >
        {editingExpense && (
          <div className="space-y-5">
            <div className="flex items-start justify-between gap-4 border-b border-black/5 pb-3">
              <div>
                <h2 id={editTitleId} className="text-lg font-semibold text-neutral-900">
                  Edit Expense
                </h2>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Update expense name, who paid, payment method, or attached bill
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingExpense(null)}
                aria-label="Close edit expense modal"
                className="w-8 h-8 rounded-full hover:bg-neutral-100 flex items-center justify-center text-neutral-500 transition-colors cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            <ExpenseForm
              key={editingExpense.id}
              mode="edit"
              initialValues={editingExpense}
              onCancel={() => setEditingExpense(null)}
              onSuccess={(updated) => {
                setExpenses((prev) =>
                  prev.map((item) => (item.id === updated.id ? updated : item))
                );
                toast.success(`Updated "${updated.expense_name}"`);
                setEditingExpense(null);
              }}
            />
          </div>
        )}
      </dialog>

      {/* Bill Preview Modal */}
      <ExpenseBillModal
        expense={viewingBillExpense}
        onClose={() => setViewingBillExpense(null)}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title={`Delete "${deleteTarget?.expense_name || "Expense"}"?`}
        description="This permanently deletes the expense record and any uploaded bill file from Supabase."
        confirmLabel="Delete Expense"
        tone="danger"
        loading={deleting}
        error={deleteError}
        onConfirm={handleConfirmDelete}
        onClose={() => {
          if (!deleting) setDeleteTarget(null);
        }}
      />
    </div>
  );
}
