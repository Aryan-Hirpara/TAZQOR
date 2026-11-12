"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import { CheckCircle2, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { formatINR } from "@/lib/formatting/currency";
import {
  getTodayIsoDate,
  PAYMENT_METHOD_OPTIONS,
  PaymentMethod,
} from "@/lib/invoices/payment-settlement";

export interface MarkPaidTargetInvoice {
  id: string;
  invoice_number: string;
  customer_name: string;
  grand_total: number;
  outstanding: number;
}

interface MarkPaidModalProps {
  open: boolean;
  invoice: MarkPaidTargetInvoice | null;
  onClose: () => void;
  onSuccess: () => void | Promise<void>;
}

export function MarkPaidModal({
  open,
  invoice,
  onClose,
  onSuccess,
}: MarkPaidModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [amount, setAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(getTodayIsoDate);
  const [reference, setReference] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && invoice) {
      setMethod("cash");
      setAmount(invoice.outstanding.toFixed(2));
      setPaymentDate(getTodayIsoDate());
      setReference("");
      setError(null);
      if (!dialog.open) {
        dialog.returnValue = "";
        dialog.showModal();
      }
    } else if (dialog.open) {
      dialog.returnValue = "";
      dialog.close();
    }
  }, [open, invoice]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoice || submitting) return;

    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setError("Enter a valid positive payment amount.");
      return;
    }

    if (numericAmount > invoice.outstanding + 0.001) {
      setError(
        `Amount cannot exceed remaining balance (${formatINR(invoice.outstanding)}).`
      );
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const idempKey =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `pay-${invoice.id}-${Date.now()}`;

      const res = await fetch(`/api/invoices/${invoice.id}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: numericAmount,
          method,
          payment_date: paymentDate || getTodayIsoDate(),
          reference: reference.trim() || null,
          idempotency_key: idempKey,
        }),
      });
      const payload = await res.json().catch(() => null);

      if (!res.ok || !payload?.success) {
        setError(payload?.error || "Could not record payment.");
        return;
      }

      toast.success(
        payload.outstanding <= 0
          ? `Bill ${invoice.invoice_number} marked Paid!`
          : `Payment of ${formatINR(numericAmount)} recorded on ${invoice.invoice_number}.`
      );
      onClose();
      await onSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to record payment.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault();
        if (!submitting) onClose();
      }}
      onClose={() => {
        if (dialogRef.current) {
          dialogRef.current.returnValue = "";
        }
      }}
      onClick={(e) => {
        if (e.target === dialogRef.current && !submitting) {
          onClose();
        }
      }}
      className="m-auto w-[calc(100vw-2rem)] max-w-md rounded-[28px] bg-white/95 backdrop-blur-2xl border border-black/10 p-6 sm:p-7 text-neutral-900 shadow-2xl outline-none"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200">
            <CheckCircle2 className="w-5 h-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h2
              id={titleId}
              className="text-lg font-semibold tracking-tight text-neutral-900"
            >
              Mark Bill as Paid
            </h2>
            {invoice && (
              <p className="text-xs text-neutral-500 mt-0.5 truncate">
                {invoice.invoice_number} • {invoice.customer_name}
              </p>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={() => !submitting && onClose()}
          aria-label="Close modal"
          className="w-8 h-8 rounded-full flex items-center justify-center text-neutral-400 hover:text-neutral-800 hover:bg-neutral-100 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {invoice && (
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="rounded-2xl bg-neutral-50 border border-neutral-200/80 p-3.5 flex items-center justify-between text-xs">
            <div>
              <span className="text-neutral-500 block">Bill Total</span>
              <span className="font-semibold text-neutral-900">
                {formatINR(invoice.grand_total)}
              </span>
            </div>
            <div className="text-right">
              <span className="text-neutral-500 block">Balance Due</span>
              <span className="font-bold text-rose-600">
                {formatINR(invoice.outstanding)}
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-neutral-700">
              Payment Method
            </label>
            <div className="flex flex-wrap gap-1.5">
              {PAYMENT_METHOD_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setMethod(opt.value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer border ${
                    method === opt.value
                      ? "bg-[#0A0A0A] text-white border-[#0A0A0A]"
                      : "bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-100"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="mark-paid-amount"
                  className="block text-xs font-medium text-neutral-700"
                >
                  Amount Received (₹)
                </label>
                {Number(amount) !== invoice.outstanding && (
                  <button
                    type="button"
                    onClick={() => setAmount(invoice.outstanding.toFixed(2))}
                    className="text-[11px] font-semibold text-emerald-700 hover:underline cursor-pointer"
                  >
                    Full
                  </button>
                )}
              </div>
              <input
                id="mark-paid-amount"
                type="number"
                step="0.01"
                min="0.01"
                max={invoice.outstanding}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="w-full h-10 px-3.5 text-xs bg-white rounded-xl border border-neutral-200 text-neutral-900 font-semibold focus:outline-none focus:ring-2 focus:ring-[#D7FF00]"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="mark-paid-date"
                className="block text-xs font-medium text-neutral-700"
              >
                Payment Date
              </label>
              <input
                id="mark-paid-date"
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                required
                className="w-full h-10 px-3.5 text-xs bg-white rounded-xl border border-neutral-200 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#D7FF00]"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="mark-paid-reference"
              className="block text-xs font-medium text-neutral-700"
            >
              Reference / Note (optional)
            </label>
            <input
              id="mark-paid-reference"
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="e.g. UPI Ref #, Cash received by..."
              className="w-full h-10 px-3.5 text-xs bg-white rounded-xl border border-neutral-200 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#D7FF00]"
            />
          </div>

          {error && (
            <div className="rounded-2xl bg-rose-50 border border-rose-200 px-3.5 py-2.5 text-xs text-rose-700">
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => !submitting && onClose()}
              disabled={submitting}
              className="h-10 px-4 rounded-full bg-neutral-100 text-neutral-700 text-xs font-medium hover:bg-neutral-200 transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-1.5 h-10 px-5 rounded-full bg-[#0A0A0A] text-white text-xs font-semibold hover:bg-neutral-800 transition-all cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#D7FF00]" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5 text-[#D7FF00]" />
              )}
              <span>{submitting ? "Saving..." : "Confirm Payment"}</span>
            </button>
          </div>
        </form>
      )}
    </dialog>
  );
}

