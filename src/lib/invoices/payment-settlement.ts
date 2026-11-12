import type { SupabaseClient } from "@supabase/supabase-js";

export type PaymentMethod = "cash" | "upi" | "bank_transfer" | "cheque" | "other";

export const PAYMENT_METHOD_OPTIONS: ReadonlyArray<{
  value: PaymentMethod;
  label: string;
}> = [
  { value: "cash", label: "Cash" },
  { value: "upi", label: "UPI" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "cheque", label: "Cheque" },
  { value: "other", label: "Other" },
];

export interface ParsedInvoicePayment {
  amount: number;
  method: PaymentMethod;
  paymentDate: string;
  reference: string | null;
  notes: string | null;
  idempotencyKey: string | null;
}

const VALID_METHODS = new Set<string>(PAYMENT_METHOD_OPTIONS.map((o) => o.value));

export function isValidPaymentMethod(value: unknown): value is PaymentMethod {
  return typeof value === "string" && VALID_METHODS.has(value);
}

export function roundMoney(value: number): number {
  return Math.round((Number(value) || 0) * 100) / 100;
}

export function getTodayIsoDate(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function isValidIsoDate(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value.trim());
}

/**
 * Validates optional payment intent passed on invoice finalization or direct bill payment.
 * Returns `{ payment: null }` when no settlement is requested (`unpaid`),
 * or `{ error }` on invalid inputs.
 */
export function parseInvoicePaymentInput(
  raw: unknown,
  options: {
    defaultDate: string;
    maxAmount: number;
    requirePositiveWhenPresent?: boolean;
  }
): { payment: ParsedInvoicePayment | null; error?: string } {
  if (raw == null) {
    return { payment: null };
  }

  if (typeof raw !== "object") {
    return { payment: null, error: "Invalid payment payload." };
  }

  const input = raw as Record<string, unknown>;
  const rawStatus = typeof input.status === "string" ? input.status.toLowerCase().trim() : undefined;
  if (rawStatus === "unpaid") {
    return { payment: null };
  }

  const maxAmount = roundMoney(options.maxAmount);
  const rawAmount =
    input.amount === undefined || input.amount === null || input.amount === ""
      ? maxAmount
      : Number(input.amount);

  if (!Number.isFinite(rawAmount) || rawAmount < 0) {
    return { payment: null, error: "Payment amount must be a valid non-negative number." };
  }

  const amount = roundMoney(rawAmount);
  if (options.requirePositiveWhenPresent && amount <= 0 && maxAmount > 0) {
    return { payment: null, error: "Payment amount must be greater than zero." };
  }

  if (amount > maxAmount + 0.001) {
    return {
      payment: null,
      error: `Payment amount (₹${amount.toFixed(2)}) cannot exceed bill balance (₹${maxAmount.toFixed(2)}).`,
    };
  }

  const rawMethod = input.method ?? "cash";
  if (!isValidPaymentMethod(rawMethod)) {
    return {
      payment: null,
      error: "Payment method must be cash, upi, bank_transfer, cheque, or other.",
    };
  }

  const paymentDate = isValidIsoDate(input.payment_date)
    ? input.payment_date.trim()
    : options.defaultDate;

  const reference =
    typeof input.reference === "string" && input.reference.trim()
      ? input.reference.trim().slice(0, 120)
      : null;

  const notes =
    typeof input.notes === "string" && input.notes.trim()
      ? input.notes.trim().slice(0, 500)
      : null;

  const idempotencyKey =
    typeof input.idempotency_key === "string" && input.idempotency_key.trim()
      ? input.idempotency_key.trim().slice(0, 160)
      : null;

  return {
    payment: {
      amount,
      method: rawMethod,
      paymentDate,
      reference,
      notes,
      idempotencyKey,
    },
  };
}

export interface SettleInvoiceResult {
  ok: boolean;
  paymentId?: string | null;
  amount: number;
  alreadyPaid?: boolean;
  error?: string;
}

/**
 * Records an atomic customer payment & allocates it against a single finalized invoice
 * via the `record_payment` Postgres RPC so `payments`, `payment_allocations`, and
 * `v_invoice_outstanding` stay authoritative across the app.
 */
export async function settleInvoiceWithPayment(params: {
  db: SupabaseClient;
  businessId: string;
  invoiceId: string;
  customerId: string;
  payment: ParsedInvoicePayment;
}): Promise<SettleInvoiceResult> {
  const { db, businessId, invoiceId, customerId, payment } = params;

  if (payment.amount <= 0) {
    return { ok: true, paymentId: null, amount: 0, alreadyPaid: true };
  }

  const { data: rpcRes, error: rpcErr } = await db.rpc("record_payment", {
    p_business_id: businessId,
    p_customer_id: customerId,
    p_amount: payment.amount,
    p_payment_date: payment.paymentDate,
    p_method: payment.method,
    p_reference: payment.reference ?? undefined,
    p_notes: payment.notes ?? undefined,
    p_idempotency_key: payment.idempotencyKey ?? undefined,
    p_allocations: [{ invoice_id: invoiceId, amount: payment.amount }],
  });

  if (rpcErr) {
    return {
      ok: false,
      amount: payment.amount,
      error: rpcErr.message || "Could not record invoice payment.",
    };
  }

  const paymentId =
    typeof rpcRes === "object" && rpcRes && "payment_id" in rpcRes
      ? String((rpcRes as { payment_id?: unknown }).payment_id ?? "") || null
      : null;

  return {
    ok: true,
    paymentId,
    amount: payment.amount,
  };
}

