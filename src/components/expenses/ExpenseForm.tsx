"use client";

import React, { useId, useRef, useState } from "react";
import { FileText, Image as ImageIcon, Paperclip, Save, Trash2, Upload } from "lucide-react";
import { StyledSelect } from "@/components/ui/StyledSelect";
import {
  EXPENSE_PAYERS,
  EXPENSE_PAYMENT_METHODS,
  inferBillKind,
  isAllowedBillMimeType,
  isValidExpensePayer,
  MAX_BILL_SIZE_BYTES,
  type ExpensePayer,
  type ExpenseRecord,
} from "@/lib/expenses/expense-record";

export interface ExpenseFormValues {
  expense_name: string;
  paid_by: ExpensePayer;
  amount: number;
  expense_date: string;
  payment_method: string;
  vendor: string;
  description: string;
  receipt_url: string | null;
}

interface ExpenseFormProps {
  mode: "create" | "edit";
  initialValues?: Partial<ExpenseRecord>;
  submitLabel?: string;
  onCancel?: () => void;
  onSuccess: (saved: ExpenseRecord) => void | Promise<void>;
}

export function ExpenseForm({
  mode,
  initialValues,
  submitLabel,
  onCancel,
  onSuccess,
}: ExpenseFormProps) {
  const uid = useId();
  const nameRef = useRef<HTMLInputElement>(null);
  const amountRef = useRef<HTMLInputElement>(null);
  const paidByRef = useRef<HTMLSelectElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [expenseName, setExpenseName] = useState(initialValues?.expense_name || "");
  const [paidBy, setPaidBy] = useState<string>(
    isValidExpensePayer(initialValues?.paid_by) ? initialValues.paid_by : ""
  );
  const [amount, setAmount] = useState<string>(
    initialValues?.amount != null && initialValues.amount > 0 ? String(initialValues.amount) : ""
  );
  const [expenseDate, setExpenseDate] = useState(
    initialValues?.date || new Date().toISOString().split("T")[0]
  );
  const [paymentMethod, setPaymentMethod] = useState(
    initialValues?.payment_method || "Bank Transfer"
  );
  const [vendor, setVendor] = useState(initialValues?.vendor || "");
  const [description, setDescription] = useState(initialValues?.description || "");

  const [existingReceiptUrl, setExistingReceiptUrl] = useState<string | null>(
    initialValues?.receipt_url || null
  );
  const [existingBillName, setExistingBillName] = useState<string | null>(
    initialValues?.bill_file_name || null
  );
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (!file) return;

    if (file.size > MAX_BILL_SIZE_BYTES) {
      setFormError("Expense bill must be 10 MB or smaller.");
      e.target.value = "";
      return;
    }

    const ext = (file.name.split(".").pop() || "").toLowerCase();
    const extOk = ["jpg", "jpeg", "png", "webp", "gif", "heic", "pdf"].includes(ext);
    if (file.type ? !isAllowedBillMimeType(file.type) && !extOk : !extOk) {
      setFormError("Only images (JPG, PNG, WEBP, GIF, HEIC) and PDF files are supported.");
      e.target.value = "";
      return;
    }

    setFormError(null);
    if (localPreviewUrl) {
      URL.revokeObjectURL(localPreviewUrl);
    }
    setSelectedFile(file);
    if (file.type.startsWith("image/") || /\.(png|jpe?g|webp|gif|heic)$/i.test(file.name)) {
      setLocalPreviewUrl(URL.createObjectURL(file));
    } else {
      setLocalPreviewUrl(null);
    }
  };

  const handleClearBill = () => {
    if (localPreviewUrl) {
      URL.revokeObjectURL(localPreviewUrl);
    }
    setSelectedFile(null);
    setLocalPreviewUrl(null);
    setExistingReceiptUrl(null);
    setExistingBillName(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const trimmedName = expenseName.trim();
    if (!trimmedName) {
      setFormError("Please enter the expense name.");
      nameRef.current?.focus();
      return;
    }

    const numAmount = Number(amount);
    if (!Number.isFinite(numAmount) || numAmount <= 0) {
      setFormError("Expense amount must be greater than zero.");
      amountRef.current?.focus();
      return;
    }

    if (!isValidExpensePayer(paidBy)) {
      setFormError("Please select who paid this expense (Aryan, Yug, or Other).");
      paidByRef.current?.focus();
      return;
    }

    setSubmitting(true);
    try {
      let receiptUrlToSave: string | null = existingReceiptUrl;

      if (selectedFile) {
        const uploadData = new FormData();
        uploadData.append("file", selectedFile);
        const uploadRes = await fetch("/api/expenses/bill", {
          method: "POST",
          body: uploadData,
        });
        const uploadJson = await uploadRes.json().catch(() => ({}));
        if (!uploadRes.ok || !uploadJson.path) {
          throw new Error(uploadJson.error || "Failed to upload expense bill");
        }
        receiptUrlToSave = uploadJson.path;
      }

      const payload: ExpenseFormValues = {
        expense_name: trimmedName,
        paid_by: paidBy,
        amount: numAmount,
        expense_date: expenseDate || new Date().toISOString().split("T")[0],
        payment_method: paymentMethod,
        vendor: vendor.trim(),
        description: description.trim(),
        receipt_url: receiptUrlToSave,
      };

      const endpoint =
        mode === "edit" && initialValues?.id
          ? `/api/expenses/${encodeURIComponent(initialValues.id)}`
          : "/api/expenses";

      const res = await fetch(endpoint, {
        method: mode === "edit" ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.expense) {
        // Clean up newly uploaded file if saving expense failed
        if (selectedFile && receiptUrlToSave && receiptUrlToSave !== initialValues?.receipt_url) {
          await fetch(`/api/expenses/bill?path=${encodeURIComponent(receiptUrlToSave)}`, {
            method: "DELETE",
          }).catch(() => {});
        }
        throw new Error(data.error || "Failed to save expense");
      }

      if (localPreviewUrl) {
        URL.revokeObjectURL(localPreviewUrl);
      }

      await onSuccess(data.expense as ExpenseRecord);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Failed to save expense");
    } finally {
      setSubmitting(false);
    }
  };

  const activeBillName = selectedFile?.name || existingBillName;
  const activeBillKind = selectedFile
    ? inferBillKind(selectedFile.name, selectedFile.type)
    : inferBillKind(existingReceiptUrl);
  const activeImageSrc =
    localPreviewUrl ||
    (existingReceiptUrl && activeBillKind === "image"
      ? `/api/expenses/bill?path=${encodeURIComponent(existingReceiptUrl)}`
      : null);

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {formError && (
        <div
          role="alert"
          aria-live="polite"
          className="rounded-2xl bg-red-50 border border-red-200 px-4 py-3 text-xs font-medium text-red-700"
        >
          {formError}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="min-w-0">
          <label
            htmlFor={`${uid}-name`}
            className="block text-xs font-light text-neutral-600 mb-1.5"
          >
            Expense Name <span aria-hidden="true">*</span>
          </label>
          <input
            ref={nameRef}
            id={`${uid}-name`}
            name="expense_name"
            type="text"
            value={expenseName}
            onChange={(e) => {
              setExpenseName(e.target.value);
              if (formError) setFormError(null);
            }}
            placeholder="e.g. Packaging Tape, Diesel, Office WiFi"
            required
            className="w-full h-10 px-4 text-base sm:text-xs bg-white/75 backdrop-blur-md rounded-full border border-black/10 text-neutral-900 placeholder-neutral-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4F732]"
          />
        </div>

        <div className="min-w-0">
          <label
            htmlFor={`${uid}-amount`}
            className="block text-xs font-light text-neutral-600 mb-1.5"
          >
            Expense Amount (₹) <span aria-hidden="true">*</span>
          </label>
          <input
            ref={amountRef}
            id={`${uid}-amount`}
            name="amount"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0.01"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
              if (formError) setFormError(null);
            }}
            placeholder="0.00"
            required
            className="w-full h-10 px-4 text-base sm:text-xs font-semibold text-neutral-900 bg-white/75 backdrop-blur-md rounded-full border border-black/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4F732]"
          />
        </div>

        <div className="min-w-0">
          <label
            htmlFor={`${uid}-paid-by`}
            className="block text-xs font-light text-neutral-600 mb-1.5"
          >
            Who Paid (Paid By) <span aria-hidden="true">*</span>
          </label>
          <StyledSelect
            ref={paidByRef}
            id={`${uid}-paid-by`}
            name="paid_by"
            value={paidBy}
            onChange={(e) => {
              setPaidBy(e.target.value);
              if (formError) setFormError(null);
            }}
            required
            className="w-full h-10 py-0 pl-4 text-base sm:text-xs bg-white/75 backdrop-blur-md rounded-full border border-black/10 text-neutral-900 font-normal focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4F732]"
          >
            <option value="" disabled>
              Select who paid...
            </option>
            {EXPENSE_PAYERS.map((payer) => (
              <option key={payer} value={payer}>
                {payer}
              </option>
            ))}
          </StyledSelect>
        </div>

        <div className="min-w-0">
          <label
            htmlFor={`${uid}-payment-method`}
            className="block text-xs font-light text-neutral-600 mb-1.5"
          >
            Payment Method
          </label>
          <StyledSelect
            id={`${uid}-payment-method`}
            name="payment_method"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="w-full h-10 py-0 pl-4 text-base sm:text-xs bg-white/75 backdrop-blur-md rounded-full border border-black/10 text-neutral-900 font-normal focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4F732]"
          >
            {EXPENSE_PAYMENT_METHODS.map((pm) => (
              <option key={pm.value} value={pm.value}>
                {pm.label}
              </option>
            ))}
          </StyledSelect>
        </div>

        <div className="min-w-0">
          <label
            htmlFor={`${uid}-date`}
            className="block text-xs font-light text-neutral-600 mb-1.5"
          >
            Expense Date <span aria-hidden="true">*</span>
          </label>
          <input
            id={`${uid}-date`}
            name="expense_date"
            type="date"
            value={expenseDate}
            onChange={(e) => setExpenseDate(e.target.value)}
            required
            className="w-full h-10 px-4 text-base sm:text-xs bg-white/75 backdrop-blur-md rounded-full border border-black/10 text-neutral-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4F732]"
          />
        </div>

        <div className="min-w-0">
          <label
            htmlFor={`${uid}-vendor`}
            className="block text-xs font-light text-neutral-600 mb-1.5"
          >
            Vendor / Supplier Name
          </label>
          <input
            id={`${uid}-vendor`}
            name="vendor"
            type="text"
            value={vendor}
            onChange={(e) => setVendor(e.target.value)}
            placeholder="Supplier or payee name (optional)"
            className="w-full h-10 px-4 text-base sm:text-xs bg-white/75 backdrop-blur-md rounded-full border border-black/10 text-neutral-900 placeholder-neutral-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4F732]"
          />
        </div>

        <div className="sm:col-span-2 min-w-0">
          <label
            htmlFor={`${uid}-description`}
            className="block text-xs font-light text-neutral-600 mb-1.5"
          >
            Expense Notes
          </label>
          <textarea
            id={`${uid}-description`}
            name="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="Optional purchase details, invoice number, or remarks..."
            className="w-full p-3.5 text-base sm:text-xs bg-white/75 backdrop-blur-md rounded-2xl border border-black/10 text-neutral-900 placeholder-neutral-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4F732]"
          />
        </div>

        <div className="sm:col-span-2 min-w-0">
          <label
            htmlFor={`${uid}-bill`}
            className="block text-xs font-light text-neutral-600 mb-1.5"
          >
            Expense Bill / Receipt (Optional — Image or PDF)
          </label>

          <input
            ref={fileInputRef}
            id={`${uid}-bill`}
            name="bill"
            type="file"
            accept="image/*,application/pdf,.pdf,.png,.jpg,.jpeg,.webp,.gif,.heic"
            onChange={handleFileChange}
            className="sr-only"
          />

          {activeBillName ? (
            <div className="flex items-center justify-between gap-3 rounded-2xl bg-white/80 border border-black/10 p-3">
              <div className="flex items-center gap-3 min-w-0">
                {activeImageSrc ? (
                  <img
                    src={activeImageSrc}
                    alt="Attached expense bill preview"
                    className="w-12 h-12 rounded-xl object-cover border border-black/10 shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-200/80 text-rose-600 flex items-center justify-center shrink-0">
                    {activeBillKind === "pdf" ? (
                      <FileText className="w-5 h-5" aria-hidden="true" />
                    ) : (
                      <ImageIcon className="w-5 h-5" aria-hidden="true" />
                    )}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-xs font-medium text-neutral-900 truncate">{activeBillName}</p>
                  <p className="text-[11px] text-neutral-500">
                    {selectedFile
                      ? `${(selectedFile.size / 1024).toFixed(1)} KB · Ready to save`
                      : "Stored in Supabase expense-bills bucket"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-full bg-white border border-black/10 text-[11px] font-medium text-neutral-700 hover:bg-neutral-50 transition-colors cursor-pointer"
                >
                  Replace
                </button>
                <button
                  type="button"
                  onClick={handleClearBill}
                  aria-label="Remove attached bill"
                  className="p-1.5 rounded-full bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full rounded-2xl border border-dashed border-black/20 bg-white/55 hover:bg-white/80 px-4 py-4 flex items-center justify-center gap-3 text-left transition-colors cursor-pointer"
            >
              <div className="w-9 h-9 rounded-full bg-white border border-black/10 flex items-center justify-center text-neutral-700 shrink-0">
                <Upload className="w-4 h-4" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-neutral-800 flex items-center gap-1.5">
                  <Paperclip className="w-3.5 h-3.5 text-neutral-500" aria-hidden="true" />
                  <span>Attach bill image or PDF</span>
                </p>
                <p className="text-[11px] text-neutral-500">
                  Optional · JPG, PNG, WEBP, GIF, HEIC or PDF (max 10 MB)
                </p>
              </div>
            </button>
          )}
        </div>
      </div>

      <div className="pt-2 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="px-6 h-11 rounded-full border border-neutral-200 bg-white text-xs sm:text-sm font-normal text-neutral-700 hover:bg-neutral-50 transition-colors disabled:opacity-50 cursor-pointer"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="px-8 h-11 rounded-full bg-black text-white text-xs sm:text-sm font-normal inline-flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-md disabled:opacity-50 cursor-pointer"
        >
          <Save className="w-4 h-4 text-[#E0FE52]" aria-hidden="true" />
          <span>
            {submitting
              ? "Saving..."
              : submitLabel || (mode === "edit" ? "Save Changes" : "Record Expense")}
          </span>
        </button>
      </div>
    </form>
  );
}

