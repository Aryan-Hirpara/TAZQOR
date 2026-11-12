import { describe, it, expect } from "vitest";
import { parseInvoicePaymentInput } from "@/lib/invoices/payment-settlement";

describe("parseInvoicePaymentInput", () => {
  it("returns null payment when omitted or explicitly unpaid", () => {
    expect(
      parseInvoicePaymentInput(undefined, {
        defaultDate: "2026-11-12",
        maxAmount: 400,
      })
    ).toEqual({ payment: null });

    expect(
      parseInvoicePaymentInput(
        { status: "unpaid", method: "cash" },
        { defaultDate: "2026-11-12", maxAmount: 400 }
      )
    ).toEqual({ payment: null });
  });

  it("defaults paid settlement to full balance and cash method", () => {
    const res = parseInvoicePaymentInput(
      { status: "paid" },
      { defaultDate: "2026-11-12", maxAmount: 400 }
    );
    expect(res.error).toBeUndefined();
    expect(res.payment).toEqual({
      amount: 400,
      method: "cash",
      paymentDate: "2026-11-12",
      reference: null,
      notes: null,
      idempotencyKey: null,
    });
  });

  it("supports partial payments, custom methods, and references", () => {
    const res = parseInvoicePaymentInput(
      {
        status: "paid",
        method: "upi",
        amount: 250.5,
        payment_date: "2026-11-10",
        reference: "UPI-998877",
        idempotency_key: "key-123",
      },
      { defaultDate: "2026-11-12", maxAmount: 400, requirePositiveWhenPresent: true }
    );
    expect(res.error).toBeUndefined();
    expect(res.payment).toEqual({
      amount: 250.5,
      method: "upi",
      paymentDate: "2026-11-10",
      reference: "UPI-998877",
      notes: null,
      idempotencyKey: "key-123",
    });
  });

  it("rejects amounts exceeding invoice balance or zero when positive is required", () => {
    const over = parseInvoicePaymentInput(
      { amount: 450, method: "cash" },
      { defaultDate: "2026-11-12", maxAmount: 400, requirePositiveWhenPresent: true }
    );
    expect(over.payment).toBeNull();
    expect(over.error).toContain("cannot exceed");

    const zero = parseInvoicePaymentInput(
      { amount: 0, method: "cash" },
      { defaultDate: "2026-11-12", maxAmount: 400, requirePositiveWhenPresent: true }
    );
    expect(zero.payment).toBeNull();
    expect(zero.error).toContain("greater than zero");
  });

  it("rejects unsupported payment methods", () => {
    const bad = parseInvoicePaymentInput(
      { amount: 100, method: "crypto" },
      { defaultDate: "2026-11-12", maxAmount: 400 }
    );
    expect(bad.payment).toBeNull();
    expect(bad.error).toContain("Payment method");
  });
});

