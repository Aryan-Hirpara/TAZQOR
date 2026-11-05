import { NextResponse } from "next/server";
import { RECONCILED_FINANCIALS, RECONCILED_ORDERS } from "@/lib/services/businessData";
import { formatInvoiceNumberForFY } from "@/lib/calculations/financialYear";

export async function GET() {
  const num1 = formatInvoiceNumberForFY(1, new Date("2026-02-15"));
  const num2 = formatInvoiceNumberForFY(2, new Date("2026-04-01"));

  const i1Pass =
    Math.abs(
      RECONCILED_FINANCIALS.totalRevenue -
        (RECONCILED_FINANCIALS.collectedAmount + RECONCILED_FINANCIALS.outstandingReceivable)
    ) < 0.01;

  const i2Pass = num1 === "INV/2025-26/0001" && num2 === "INV/2026-27/0002";

  const confirmed = RECONCILED_ORDERS.filter((o) => o.status === "confirmed").length;
  const processing = RECONCILED_ORDERS.filter((o) => o.status === "processing").length;
  const dispatched = RECONCILED_ORDERS.filter((o) => o.status === "dispatched").length;
  const delivered = RECONCILED_ORDERS.filter((o) => o.status === "delivered").length;
  const cancelled = RECONCILED_ORDERS.filter((o) => o.status === "cancelled").length;

  const orderSum = confirmed + processing + dispatched + delivered + cancelled;
  const i3Pass = orderSum === RECONCILED_ORDERS.length;

  return NextResponse.json({
    i1: { passed: i1Pass, financials: RECONCILED_FINANCIALS },
    i2: { passed: i2Pass, num1, num2 },
    i3: { passed: i3Pass, orderSum, total: RECONCILED_ORDERS.length },
  });
}
