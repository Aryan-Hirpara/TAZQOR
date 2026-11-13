import { describe, it, expect } from "vitest";
import {
  computeDashboardMetrics,
  extractLocalRecordDateKey,
  isRecordInPeriod,
  summarizeDashboardInventory,
  summarizeRecentActiveOrders,
} from "@/lib/dashboard/metrics";
import { encodeComboRecipe } from "@/lib/products/combo-pack";

describe("dashboard metrics & domain isolation", () => {
  it("computes live Inventory valuation and units from physical SKUs while ignoring Combo virtual double-counting and invoice cancellations", () => {
    const comboRecipe = encodeComboRecipe([
      { variant_id: "var-dish", quantity: 1 },
      { variant_id: "var-toilet", quantity: 1 },
    ]);

    const summary = summarizeDashboardInventory({
      products: [
        {
          id: "prod-dish",
          name: "Dish wash ( lemon )",
          status: "active",
          categories: { name: "Dish Wash" },
          product_variants: [
            { id: "var-dish", name: "250ml", pack_size: "250ml", sku: "TQR-001", cost_price: 26.78 },
          ],
        },
        {
          id: "prod-toilet",
          name: "Toilet cleaner",
          status: "active",
          categories: { name: "Toilet Cleaner" },
          product_variants: [
            { id: "var-toilet", name: "500ml", pack_size: "500ml", sku: "TQR-004", cost_price: 34.5 },
          ],
        },
        {
          id: "prod-archived",
          name: "Old Discontinued",
          status: "archived",
          categories: { name: "Dish Wash" },
          product_variants: [
            { id: "var-arch", name: "1L", pack_size: "1L", sku: "ARC-01", cost_price: 50 },
          ],
        },
        {
          id: "prod-combo",
          name: "TC-DW-COMBO",
          status: "active",
          image_url: comboRecipe,
          categories: { name: "Combo Pack" },
          product_variants: [
            { id: "var-combo", name: "750 ml (2 items)", pack_size: "750 ml (2 items)", sku: "TQR-005-COMBO", cost_price: 61.28 },
          ],
        },
      ],
      stockSummaries: [
        { product_variant_id: "var-dish", total_quantity_on_hand: 40 },
        { product_variant_id: "var-toilet", total_quantity_on_hand: 100 },
        { product_variant_id: "var-arch", total_quantity_on_hand: 99 },
      ],
      batches: [
        { id: "b-1", product_variant_id: "var-dish", cost_per_unit: 26.78 },
        { id: "b-2", product_variant_id: "var-toilet", cost_per_unit: 34.5 },
      ],
      batchStockOnHand: [
        { batch_id: "b-1", quantity_on_hand: 40 },
        { batch_id: "b-2", quantity_on_hand: 100 },
      ],
    });

    expect(summary.totalUnits).toBe(140);
    expect(summary.totalValuation).toBeCloseTo(40 * 26.78 + 100 * 34.5, 2);
    expect(summary.activeSkuCount).toBe(2);
    expect(summary.inStockSkuCount).toBe(2);
    expect(summary.topProduct?.name).toBe("Toilet cleaner");
    expect(summary.topProduct?.units).toBe(100);
  });

  it("excludes cancelled and draft invoices from sales, profit, and chart series while tracking period expenses and honest net profit", () => {
    const now = new Date(2026, 10, 12, 14, 0, 0); // 12 Nov 2026 local

    const state = computeDashboardMetrics({
      period: "month",
      now,
      invoices: [
        {
          id: "inv-cancelled",
          grand_total: 400,
          invoice_date: "2026-11-12",
          status: "cancelled",
          invoice_items: [{ quantity: 2, product_variants: { cost_price: 124.93 } }],
        },
        {
          id: "inv-draft",
          grand_total: 900,
          invoice_date: "2026-11-12",
          status: "draft",
          invoice_items: [{ quantity: 5, product_variants: { cost_price: 100 } }],
        },
        {
          id: "inv-valid",
          grand_total: 500,
          invoice_date: "2026-11-10",
          status: "paid",
          invoice_items: [
            {
              quantity: 2,
              invoice_item_batches: [{ quantity_allocated: 2, cost_per_unit: 120 }],
            },
          ],
        },
      ],
      expenses: [
        {
          id: "exp-nov",
          expense_date: "2026-11-02",
          amount: 2160,
          description: "[Expense: labels | Paid by: Aryan]",
        },
        {
          id: "exp-oct",
          expense_date: "2026-10-31",
          amount: 300,
          description: "[Expense: boxes | Paid by: Yug]",
        },
      ],
    });

    expect(state.metrics.monthlySales).toBe(500);
    expect(state.metrics.currentMonthSales).toBe(500);
    expect(state.metrics.totalSalesYear).toBe(500);
    expect(state.metrics.averageItems).toBe(2);
    expect(state.metrics.averageSaleValue).toBe(500);
    expect(state.metrics.grossProfit).toBe(260); // 500 - 2*120
    expect(state.metrics.netProfit).toBe(-1900); // 260 - 2160 (Oct expense excluded)
    expect(state.expensesSummary).toEqual({
      totalAmount: 2160,
      count: 1,
      latestLabel: "labels • Aryan",
    });

    // Switch to today: currentMonthSales stays 500 for monthly sales target, while period metrics reflect today (0 sales)
    const todayState = computeDashboardMetrics({
      period: "today",
      now,
      invoices: [
        {
          id: "inv-valid",
          grand_total: 500,
          invoice_date: "2026-11-10",
          status: "paid",
          invoice_items: [{ quantity: 2, product_variants: { cost_price: 120 } }],
        },
      ],
      expenses: [
        {
          id: "exp-nov",
          expense_date: "2026-11-02",
          amount: 2160,
          description: "[Expense: labels | Paid by: Aryan]",
        },
      ],
    });

    expect(todayState.metrics.monthlySales).toBe(0);
    expect(todayState.metrics.currentMonthSales).toBe(500);
    expect(todayState.expensesSummary.count).toBe(0);
  });

  it("filters cancelled orders out of active recent orders card", () => {
    const active = summarizeRecentActiveOrders([
      {
        id: "ord-1",
        order_number: "ORD-503585",
        status: "cancelled",
        customers: { shop_name: "jeel panoliya" },
        order_items: [{ quantity: 2, unit_price: 200 }],
      },
      {
        id: "ord-2",
        order_number: "ORD-503590",
        status: "confirmed",
        customers: { shop_name: "Shreeji Store" },
        order_items: [{ quantity: 3, unit_price: 150 }],
      },
    ]);

    expect(active).toHaveLength(1);
    expect(active[0]).toMatchObject({
      id: "ord-2",
      order_number: "ORD-503590",
      customer_name: "Shreeji Store",
      itemCount: 3,
      totalAmount: 450,
    });
  });

  it("preserves calendar date strings cleanly across local period boundaries", () => {
    const now = new Date(2026, 10, 12, 0, 15, 0); // 12 Nov 2026 00:15 AM local
    expect(extractLocalRecordDateKey("2026-11-12")).toBe("2026-11-12");
    expect(isRecordInPeriod("2026-11-12", null, "today", "current", now)).toBe(true);
    expect(isRecordInPeriod("2026-11-11", null, "today", "prev", now)).toBe(true);
    expect(isRecordInPeriod("2026-11-06", null, "week", "current", now)).toBe(true);
    expect(isRecordInPeriod("2026-11-05", null, "week", "current", now)).toBe(false);
    expect(isRecordInPeriod("2026-10-31", null, "month", "current", now)).toBe(false);
    expect(isRecordInPeriod("2026-11-01", null, "month", "current", now)).toBe(true);
    expect(isRecordInPeriod("2026-10-31", null, "year", "current", now)).toBe(true);
    expect(isRecordInPeriod("2025-10-31", null, "year", "prev", now)).toBe(true);
  });

  it("calculates dashboard metrics accurately under 'year' condition", () => {
    const now = new Date(2026, 10, 13, 11, 0, 0); // 13 Nov 2026 local

    const state = computeDashboardMetrics({
      period: "year",
      now,
      invoices: [
        {
          id: "inv-nov",
          grand_total: 800,
          invoice_date: "2026-11-12",
          status: "finalized",
          invoice_items: [{ quantity: 4, product_variants: { cost_price: 125 } }],
        },
        {
          id: "inv-prev-year",
          grand_total: 600,
          invoice_date: "2025-11-12",
          status: "finalized",
          invoice_items: [{ quantity: 3, product_variants: { cost_price: 100 } }],
        },
      ],
      expenses: [
        {
          id: "exp-nov",
          expense_date: "2026-11-02",
          amount: 2160,
          description: "[Expense: labels | Paid by: Aryan]",
        },
        {
          id: "exp-oct",
          expense_date: "2026-10-31",
          amount: 3592,
          description: "[Expense: bottles | Paid by: Yug]",
        },
        {
          id: "exp-prev-year",
          expense_date: "2025-10-31",
          amount: 1000,
          description: "[Expense: old | Paid by: Yug]",
        },
      ],
    });

    expect(state.metrics.monthlySales).toBe(800);
    expect(state.metrics.totalSalesYear).toBe(800);
    expect(state.metrics.comparisonSalesYear).toBe(600);
    expect(state.metrics.salesChange).toBe(200); // 800 - 600
    expect(state.metrics.grossProfit).toBe(300); // 800 - 4*125
    expect(state.metrics.netProfit).toBe(300 - (2160 + 3592)); // -5452
    expect(state.expensesSummary.totalAmount).toBe(5752); // 2160 + 3592
    expect(state.expensesSummary.count).toBe(2);
    expect(state.heroMonths).toHaveLength(12); // All 12 months in year mode
    expect(state.heroMonths[10].month).toBe("nov");
    expect(state.heroMonths[10].isActive).toBe(true);
  });
});

