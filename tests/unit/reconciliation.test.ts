import { describe, it, expect } from "vitest";
import {
  RECONCILED_INVOICES,
  RECONCILED_PAYMENTS,
  RECONCILED_ORDERS,
  RECONCILED_EXPENSES,
  getBusinessMetrics,
} from "@/lib/services/businessData";

describe("Financial Figures & Cross-Screen Reconciliation", () => {
  const metrics = getBusinessMetrics();

  it("reconciles Total Invoiced Revenue between Invoices and Dashboard", () => {
    const finalizedInvoices = RECONCILED_INVOICES.filter((i) => i.status === "finalized");
    const sumInvoices = finalizedInvoices.reduce((sum, i) => sum + i.grand_total, 0);

    expect(sumInvoices).toBe(64200.0);
    expect(metrics.monthlySales).toBe(sumInvoices);
    expect(metrics.totalBilled).toBe(sumInvoices);
  });

  it("reconciles Total Payments Collected with Invoice paid amounts", () => {
    const sumPayments = RECONCILED_PAYMENTS.reduce((sum, p) => sum + p.amount, 0);
    const finalizedInvoices = RECONCILED_INVOICES.filter((i) => i.status === "finalized");
    const sumPaidOnInvoices = finalizedInvoices.reduce((sum, i) => sum + i.paid_amount, 0);

    expect(sumPayments).toBe(57700.0);
    expect(sumPaidOnInvoices).toBe(sumPayments);
    expect(metrics.totalCollected).toBe(sumPayments);
  });

  it("reconciles Total Outstanding Balance (Invoices grand_total - paid_amount)", () => {
    const finalizedInvoices = RECONCILED_INVOICES.filter((i) => i.status === "finalized");
    const totalOutstanding = finalizedInvoices.reduce((sum, i) => sum + i.outstanding, 0);

    expect(totalOutstanding).toBe(6500.0);
    expect(metrics.totalBilled - metrics.totalCollected).toBe(totalOutstanding);
    expect(metrics.totalOutstanding).toBe(totalOutstanding);
  });

  it("verifies Gross Profit = Total Billed - COGS and Net Profit = Gross Profit - Operating Expenses", () => {
    const cogs = RECONCILED_EXPENSES.filter((e) => e.is_cogs).reduce((sum, e) => sum + e.amount, 0);
    const opex = RECONCILED_EXPENSES.filter((e) => !e.is_cogs).reduce((sum, e) => sum + e.amount, 0);

    expect(cogs).toBe(29800.0);
    expect(opex).toBe(8200.0);
    expect(metrics.grossProfit).toBe(metrics.totalBilled - cogs);
    expect(metrics.grossProfit).toBe(34400.0);
    expect(metrics.netProfit).toBe(metrics.grossProfit - opex);
    expect(metrics.netProfit).toBe(26200.0);
  });

  it("verifies Orders status breakdown sums exactly to total orders", () => {
    const { orderCounts } = metrics;
    const sumStatus =
      orderCounts.confirmed +
      orderCounts.processing +
      orderCounts.dispatched +
      orderCounts.delivered +
      orderCounts.cancelled;

    expect(sumStatus).toBe(orderCounts.total);
    expect(orderCounts.total).toBe(RECONCILED_ORDERS.length);
    expect(orderCounts.confirmed).toBe(1);
    expect(orderCounts.processing).toBe(1);
    expect(orderCounts.dispatched).toBe(1);
    expect(orderCounts.delivered).toBe(1);
    expect(orderCounts.cancelled).toBe(0);
  });
});

