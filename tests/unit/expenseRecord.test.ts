import { describe, expect, it } from "vitest";
import {
  extractBillFileName,
  formatExpenseDescriptionFallback,
  inferBillKind,
  isAllowedBillMimeType,
  isOwnedBillPath,
  isValidExpensePayer,
  parseExpenseRow,
} from "@/lib/expenses/expense-record";

describe("expense-record helpers", () => {
  it("validates expense payers strictly", () => {
    expect(isValidExpensePayer("Aryan")).toBe(true);
    expect(isValidExpensePayer("Yug")).toBe(true);
    expect(isValidExpensePayer("Other")).toBe(true);
    expect(isValidExpensePayer("Unknown")).toBe(false);
    expect(isValidExpensePayer("")).toBe(false);
    expect(isValidExpensePayer(null)).toBe(false);
  });

  it("parses rows with native expense_name and paid_by columns", () => {
    const parsed = parseExpenseRow({
      id: "exp-1",
      expense_date: "2026-11-12",
      expense_name: "Packaging Cartons",
      paid_by: "Aryan",
      vendor: "Gujarat Box Works",
      description: "500 corrugated boxes",
      amount: 3450,
      payment_method: "UPI",
      receipt_url: "00000000-0000-0000-0000-000000000001/1731400000-abcdef12-bill.pdf",
    });

    expect(parsed.expense_name).toBe("Packaging Cartons");
    expect(parsed.paid_by).toBe("Aryan");
    expect(parsed.description).toBe("500 corrugated boxes");
    expect(parsed.bill_file_name).toBe("bill.pdf");
    expect(parsed.bill_kind).toBe("pdf");
  });

  it("parses fallback-encoded description when native columns are absent", () => {
    const encoded = formatExpenseDescriptionFallback(
      "Diesel Fuel",
      "Yug",
      "Delivery van refill"
    );
    expect(encoded).toBe("[Expense: Diesel Fuel | Paid by: Yug]\nDelivery van refill");

    const parsed = parseExpenseRow({
      id: "exp-2",
      expense_date: "2026-11-12",
      vendor: "Indian Oil",
      description: encoded,
      amount: 1200,
      payment_method: "Other / Don't Know",
      receipt_url: null,
    });

    expect(parsed.expense_name).toBe("Diesel Fuel");
    expect(parsed.paid_by).toBe("Yug");
    expect(parsed.description).toBe("Delivery van refill");
    expect(parsed.payment_method).toBe("Other / Don't Know");
  });

  it("parses fallback-encoded description with empty notes", () => {
    const encoded = formatExpenseDescriptionFallback("Office WiFi [Monthly]", "Other", "");
    const parsed = parseExpenseRow({
      id: "exp-3",
      expense_date: "2026-11-12",
      description: encoded,
      amount: 999,
      payment_method: "Cash",
      receipt_url: "00000000-0000-0000-0000-000000000001/1731400000-12345678-receipt.jpg",
    });

    expect(parsed.expense_name).toBe("Office WiFi [Monthly]");
    expect(parsed.paid_by).toBe("Other");
    expect(parsed.description).toBe("");
    expect(parsed.bill_kind).toBe("image");
    expect(extractBillFileName(parsed.receipt_url)).toBe("receipt.jpg");
  });

  it("enforces business ownership on bill storage paths", () => {
    const biz = "00000000-0000-0000-0000-000000000001";
    expect(isOwnedBillPath(`${biz}/1731400000-abcd1234-invoice.pdf`, biz)).toBe(true);
    expect(isOwnedBillPath(`other-biz/1731400000-abcd1234-invoice.pdf`, biz)).toBe(false);
    expect(isOwnedBillPath(`${biz}/../secret.pdf`, biz)).toBe(false);
    expect(isOwnedBillPath(`/etc/passwd`, biz)).toBe(false);
  });

  it("validates allowed bill MIME types and infers kinds", () => {
    expect(isAllowedBillMimeType("image/png")).toBe(true);
    expect(isAllowedBillMimeType("application/pdf")).toBe(true);
    expect(isAllowedBillMimeType("application/x-msdownload")).toBe(false);
    expect(inferBillKind("bill.PDF")).toBe("pdf");
    expect(inferBillKind("photo.webp")).toBe("image");
  });
});

