"use client";

import React, { useEffect, useId, useRef } from "react";
import { AlertTriangle, X } from "lucide-react";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "danger" | "default";
  loading?: boolean;
  error?: string | null;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "danger",
  loading = false,
  error = null,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const cancelBtnRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open) {
      if (!dialog.open) {
        dialog.returnValue = "";
        dialog.showModal();
      }
      if (tone === "danger") {
        cancelBtnRef.current?.focus();
      }
    } else if (dialog.open) {
      dialog.returnValue = "";
      dialog.close();
    }
  }, [open, tone]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={description ? descId : undefined}
      onCancel={(e) => {
        e.preventDefault();
        if (!loading) onClose();
      }}
      onClose={() => {
        if (dialogRef.current) {
          dialogRef.current.returnValue = "";
        }
      }}
      onClick={(e) => {
        if (e.target === dialogRef.current && !loading) {
          onClose();
        }
      }}
      className="m-auto w-[calc(100vw-2rem)] max-w-md rounded-[28px] bg-white/95 backdrop-blur-2xl border border-black/10 p-6 sm:p-7 text-neutral-900 shadow-2xl outline-none"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3.5 min-w-0">
          {tone === "danger" && (
            <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center shrink-0 border border-red-100">
              <AlertTriangle className="w-5 h-5" aria-hidden="true" />
            </div>
          )}
          <div className="min-w-0">
            <h2 id={titleId} className="text-lg font-semibold tracking-tight text-neutral-900">
              {title}
            </h2>
            {description && (
              <p id={descId} className="text-sm text-neutral-600 mt-1.5 leading-relaxed">
                {description}
              </p>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={() => !loading && onClose()}
          disabled={loading}
          aria-label="Close confirmation dialog"
          className="w-8 h-8 rounded-full hover:bg-neutral-100 flex items-center justify-center text-neutral-500 transition-colors shrink-0 disabled:opacity-40"
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="mt-4 rounded-2xl bg-red-50 border border-red-200/80 px-3.5 py-2.5 text-xs font-medium text-red-700"
        >
          {error}
        </div>
      )}

      <div className="mt-6 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5">
        <button
          ref={cancelBtnRef}
          type="button"
          autoFocus={tone === "danger"}
          onClick={() => !loading && onClose()}
          disabled={loading}
          className="px-5 py-2.5 rounded-full border border-neutral-200 bg-white text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors disabled:opacity-50"
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={() => void onConfirm()}
          disabled={loading}
          className={
            tone === "danger"
              ? "px-5 py-2.5 rounded-full bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
              : "px-5 py-2.5 rounded-full bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-800 transition-colors disabled:opacity-50"
          }
        >
          {loading ? "Processing..." : confirmLabel}
        </button>
      </div>
    </dialog>
  );
}

