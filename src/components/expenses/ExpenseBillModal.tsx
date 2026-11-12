"use client";

import React, { useEffect, useId, useRef } from "react";
import { Download, ExternalLink, FileText, Image as ImageIcon, X } from "lucide-react";
import type { ExpenseRecord } from "@/lib/expenses/expense-record";

interface ExpenseBillModalProps {
  expense: ExpenseRecord | null;
  onClose: () => void;
}

export function ExpenseBillModal({ expense, onClose }: ExpenseBillModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const pressedOutsideRef = useRef(false);
  const titleId = useId();
  const open = Boolean(expense?.receipt_url);

  const isOutsideDialog = (e: React.PointerEvent<HTMLDialogElement>, dialog: HTMLDialogElement) => {
    const r = dialog.getBoundingClientRect();
    return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
  };

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open) {
      if (!dialog.open) {
        dialog.returnValue = "";
        dialog.showModal();
      }
    } else if (dialog.open) {
      dialog.returnValue = "";
      dialog.close();
    }
  }, [open]);

  const billSrc = expense?.receipt_url
    ? `/api/expenses/bill?path=${encodeURIComponent(expense.receipt_url)}`
    : "";
  const downloadSrc = billSrc ? `${billSrc}&download=1` : "";

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClose={() => {
        if (dialogRef.current) {
          dialogRef.current.returnValue = "";
        }
      }}
      onPointerDown={(e) => {
        if (dialogRef.current) {
          pressedOutsideRef.current = isOutsideDialog(e, dialogRef.current);
        }
      }}
      onPointerUp={(e) => {
        if (dialogRef.current && pressedOutsideRef.current && isOutsideDialog(e, dialogRef.current)) {
          onClose();
        }
        pressedOutsideRef.current = false;
      }}
      className="m-auto w-[calc(100vw-2rem)] max-w-3xl rounded-[28px] bg-white/95 backdrop-blur-2xl border border-black/10 p-5 sm:p-6 text-neutral-900 shadow-2xl outline-none"
    >
      {expense && expense.receipt_url && (
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full bg-neutral-100 border border-black/5 flex items-center justify-center shrink-0 text-neutral-700">
                {expense.bill_kind === "pdf" ? (
                  <FileText className="w-5 h-5 text-rose-600" aria-hidden="true" />
                ) : (
                  <ImageIcon className="w-5 h-5 text-neutral-700" aria-hidden="true" />
                )}
              </div>
              <div className="min-w-0">
                <h2 id={titleId} className="text-base font-semibold text-neutral-900 truncate">
                  {expense.expense_name} — Bill
                </h2>
                <p className="text-xs text-neutral-500 truncate">
                  {expense.bill_file_name || "Expense receipt"} · Paid by {expense.paid_by}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <a
                href={downloadSrc}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-100 hover:bg-neutral-200 text-xs font-medium text-neutral-800 transition-colors"
              >
                <Download className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Download</span>
              </a>
              <a
                href={billSrc}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black text-white hover:opacity-90 text-xs font-medium transition-opacity"
              >
                <ExternalLink className="w-3.5 h-3.5 text-[#E0FE52]" aria-hidden="true" />
                <span>Open</span>
              </a>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close bill preview"
                className="w-8 h-8 rounded-full hover:bg-neutral-100 flex items-center justify-center text-neutral-500 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </div>

          <div className="rounded-2xl bg-neutral-50 border border-black/10 overflow-hidden flex items-center justify-center min-h-[320px] max-h-[70vh]">
            {expense.bill_kind === "pdf" ? (
              <iframe
                src={billSrc}
                title={`PDF bill for ${expense.expense_name}`}
                className="w-full h-[65vh] border-0"
              />
            ) : (
              <img
                src={billSrc}
                alt={`Bill receipt for ${expense.expense_name}`}
                className="max-w-full max-h-[68vh] object-contain"
              />
            )}
          </div>
        </div>
      )}
    </dialog>
  );
}
