import { DottedColumn } from "@/components/charts/DottedParticleChart";
import { DailyBarItem } from "@/components/charts/DailyPillBarChart";
import { MonthBarData } from "@/components/dashboard/HeroMonthBars";
import { parseExpenseRow, RawExpenseDbRow } from "@/lib/expenses/expense-record";
import { isComboPackCategoryName, parseComboRecipe } from "@/lib/products/combo-pack";

export type DashboardPeriod = "today" | "week" | "month";

const MONTH_NAMES = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
const CALENDAR_DATE_PREFIX_RE = /^(\d{4})-(\d{2})-(\d{2})/;

export interface DashboardProductRow {
  id: string;
  name: string;
  status?: string | null;
  image_url?: string | null;
  categories?: { name?: string | null } | null;
  product_variants?: Array<{
    id: string;
    name?: string | null;
    pack_size?: string | null;
    sku?: string | null;
    cost_price?: number | string | null;
  }> | null;
}

export interface DashboardStockSummaryRow {
  product_variant_id: string;
  total_quantity_on_hand: number | string | null;
}

export interface DashboardBatchRow {
  id: string;
  product_variant_id: string;
  cost_per_unit?: number | string | null;
}

export interface DashboardBatchStockRow {
  batch_id: string;
  quantity_on_hand: number | string | null;
}

export interface DashboardInventorySummary {
  totalUnits: number;
  totalValuation: number;
  activeSkuCount: number;
  inStockSkuCount: number;
  topProduct: {
    name: string;
    variantLabel: string;
    units: number;
    valuation: number;
  } | null;
}

export interface DashboardInvoiceBatchAlloc {
  quantity_allocated?: number | string | null;
  cost_per_unit?: number | string | null;
  batches?: { cost_per_unit?: number | string | null } | null;
}

export interface DashboardInvoiceItemRow {
  quantity?: number | string | null;
  line_total?: number | string | null;
  product_variants?: { cost_price?: number | string | null } | null;
  invoice_item_batches?: DashboardInvoiceBatchAlloc[] | null;
}

export interface DashboardInvoiceRow {
  id: string;
  grand_total?: number | string | null;
  subtotal?: number | string | null;
  invoice_date?: string | null;
  created_at?: string | null;
  status?: string | null;
  invoice_items?: DashboardInvoiceItemRow[] | null;
}

export interface DashboardOrderRow {
  id: string;
  order_number: string;
  status?: string | null;
  created_at?: string | null;
  customers?: { name?: string | null; shop_name?: string | null } | null;
  order_items?: Array<{ quantity?: number | string | null; unit_price?: number | string | null }> | null;
}

export interface RecentOrderSummary {
  id: string;
  order_number: string;
  customer_name: string;
  itemCount: number;
  totalAmount: number;
  status: string;
}

export interface DashboardExpensesSummary {
  totalAmount: number;
  count: number;
  latestLabel: string;
}

export interface ComputedDashboardState {
  metrics: {
    monthlySales: number;
    currentMonthSales: number;
    previousMonthSales: number;
    salesChange: number;
    grossProfit: number;
    netProfit: number;
    averageItems: number;
    averageSaleValue: number;
    saleChangePct: number | null;
    totalSalesYear: number;
    comparisonSalesYear: number;
  };
  heroMonths: MonthBarData[];
  particleData: DottedColumn[];
  dailyData: DailyBarItem[];
  monthlyCurrentYear: number[];
  monthlyPrevYear: number[];
  activeMonthName: string;
  expensesSummary: DashboardExpensesSummary;
}

/**
 * Formats a local Date instance as YYYY-MM-DD without UTC timezone drift.
 */
export function toLocalDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Parses a calendar date string (YYYY-MM-DD) or ISO timestamp into a local Date.
 */
export function parseLocalRecordDate(dateStr?: string | null, createdStr?: string | null): Date {
  const raw = (dateStr || "").trim();
  const match = raw.match(CALENDAR_DATE_PREFIX_RE);
  // Keep YYYY-MM-DD dates in local calendar time when there is no explicit timestamp component
  if (match && raw.length === 10) {
    return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  }
  const source = raw || (createdStr || "").trim();
  if (!source) return new Date(0);
  const parsed = new Date(source);
  return Number.isNaN(parsed.getTime()) ? new Date(0) : parsed;
}

/**
 * Extracts a YYYY-MM-DD local calendar date key from dateStr or fallback createdStr.
 */
export function extractLocalRecordDateKey(dateStr?: string | null, createdStr?: string | null): string {
  const raw = (dateStr || "").trim();
  const match = raw.match(CALENDAR_DATE_PREFIX_RE);
  if (match && raw.length === 10) {
    return `${match[1]}-${match[2]}-${match[3]}`;
  }
  const parsed = parseLocalRecordDate(dateStr, createdStr);
  if (parsed.getTime() === 0) return "";
  return toLocalDateKey(parsed);
}

/**
 * Checks whether a dated record belongs to the current or previous comparison window.
 */
export function isRecordInPeriod(
  dateStr: string | null | undefined,
  createdStr: string | null | undefined,
  period: DashboardPeriod,
  mode: "current" | "prev" = "current",
  now: Date = new Date()
): boolean {
  const recordKey = extractLocalRecordDateKey(dateStr, createdStr);
  if (!recordKey) return false;

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (period === "today") {
    const target = mode === "current" ? today : new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
    return recordKey === toLocalDateKey(target);
  }

  if (period === "week") {
    const startOffset = mode === "current" ? -6 : -13;
    const endOffset = mode === "current" ? 0 : -7;
    const startKey = toLocalDateKey(new Date(today.getFullYear(), today.getMonth(), today.getDate() + startOffset));
    const endKey = toLocalDateKey(new Date(today.getFullYear(), today.getMonth(), today.getDate() + endOffset));
    return recordKey >= startKey && recordKey <= endKey;
  }

  const start =
    mode === "current"
      ? new Date(today.getFullYear(), today.getMonth(), 1)
      : new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const end =
    mode === "current"
      ? new Date(today.getFullYear(), today.getMonth() + 1, 0)
      : new Date(today.getFullYear(), today.getMonth(), 0);
  return recordKey >= toLocalDateKey(start) && recordKey <= toLocalDateKey(end);
}

/**
 * Aggregates live physical stock on hand and valuation across active non-combo SKUs.
 * Never surfaces stock movement audit reasons (such as invoice cancellation logs).
 */
export function summarizeDashboardInventory(params: {
  products: DashboardProductRow[];
  stockSummaries: DashboardStockSummaryRow[];
  batches: DashboardBatchRow[];
  batchStockOnHand: DashboardBatchStockRow[];
}): DashboardInventorySummary {
  const summaryQtyByVariant = new Map<string, number>();
  for (const row of params.stockSummaries) {
    if (!row.product_variant_id) continue;
    summaryQtyByVariant.set(row.product_variant_id, Math.max(0, Number(row.total_quantity_on_hand) || 0));
  }

  const batchQtyByBatchId = new Map<string, number>();
  for (const row of params.batchStockOnHand) {
    if (!row.batch_id) continue;
    batchQtyByBatchId.set(row.batch_id, Math.max(0, Number(row.quantity_on_hand) || 0));
  }

  const batchBreakdownByVariant = new Map<string, { units: number; valuation: number }>();
  for (const batch of params.batches) {
    if (!batch.product_variant_id) continue;
    const qty = batchQtyByBatchId.get(batch.id) ?? 0;
    if (qty <= 0) continue;
    const unitCost = Math.max(0, Number(batch.cost_per_unit) || 0);
    const existing = batchBreakdownByVariant.get(batch.product_variant_id) ?? { units: 0, valuation: 0 };
    existing.units += qty;
    existing.valuation += qty * unitCost;
    batchBreakdownByVariant.set(batch.product_variant_id, existing);
  }

  let totalUnits = 0;
  let totalValuation = 0;
  let activeSkuCount = 0;
  let inStockSkuCount = 0;
  let topProduct: DashboardInventorySummary["topProduct"] = null;

  for (const product of params.products) {
    if (product.status === "archived") continue;
    // Skip virtual Combo Pack products so physical component stock is never double-counted
    const isComboProduct =
      Boolean(parseComboRecipe(product.image_url)?.length) ||
      isComboPackCategoryName(product.categories?.name);
    if (isComboProduct) continue;

    for (const variant of product.product_variants || []) {
      activeSkuCount += 1;
      const summaryUnits = summaryQtyByVariant.get(variant.id);
      const batchInfo = batchBreakdownByVariant.get(variant.id);

      const units = summaryUnits !== undefined ? summaryUnits : batchInfo?.units ?? 0;
      const fallbackUnitCost = Math.max(0, Number(variant.cost_price) || 0);

      let valuation = 0;
      if (batchInfo && batchInfo.units > 0) {
        // Reconcile any difference between view summary and batch rows using variant cost price
        const unbatchedUnits = Math.max(0, units - batchInfo.units);
        valuation = batchInfo.valuation + unbatchedUnits * fallbackUnitCost;
      } else {
        valuation = units * fallbackUnitCost;
      }

      if (units > 0) {
        inStockSkuCount += 1;
        totalUnits += units;
        totalValuation += valuation;

        if (
          !topProduct ||
          units > topProduct.units ||
          (units === topProduct.units && valuation > topProduct.valuation)
        ) {
          topProduct = {
            name: product.name,
            variantLabel: variant.pack_size || variant.name || variant.sku || "Standard",
            units,
            valuation,
          };
        }
      }
    }
  }

  return {
    totalUnits,
    totalValuation: Number(totalValuation.toFixed(2)),
    activeSkuCount,
    inStockSkuCount,
    topProduct,
  };
}

/**
 * Summarizes active non-cancelled orders for the dashboard Orders card.
 */
export function summarizeRecentActiveOrders(orders: DashboardOrderRow[]): RecentOrderSummary[] {
  return orders
    .filter((o) => (o.status || "").toLowerCase() !== "cancelled")
    .map((o) => {
      const custName = o.customers?.shop_name || o.customers?.name || "Customer";
      const items = o.order_items || [];
      const count = items.reduce((sum, it) => sum + (Number(it.quantity) || 0), 0);
      const total = items.reduce(
        (sum, it) => sum + (Number(it.quantity) || 0) * (Number(it.unit_price) || 0),
        0
      );
      return {
        id: o.id,
        order_number: o.order_number,
        customer_name: custName,
        itemCount: count,
        totalAmount: total,
        status: o.status || "confirmed",
      };
    });
}

function isConfirmedInvoiceStatus(status: string | null | undefined): boolean {
  const normalized = (status || "").trim().toLowerCase();
  return normalized !== "cancelled" && normalized !== "draft";
}

function computeInvoicesCogs(invoices: DashboardInvoiceRow[]): { cogs: number; itemCount: number } {
  let cogs = 0;
  let itemCount = 0;

  for (const inv of invoices) {
    for (const it of inv.invoice_items || []) {
      const qty = Number(it.quantity) || 0;
      itemCount += qty;
      const allocs = it.invoice_item_batches || [];
      if (allocs.length > 0) {
        for (const alloc of allocs) {
          const allocQty = Number(alloc.quantity_allocated) || 0;
          const unitCost =
            Number(alloc.cost_per_unit) ||
            Number(alloc.batches?.cost_per_unit) ||
            Number(it.product_variants?.cost_price) ||
            0;
          cogs += allocQty * unitCost;
        }
      } else {
        cogs += qty * (Number(it.product_variants?.cost_price) || 0);
      }
    }
  }

  return { cogs, itemCount };
}

/**
 * Computes all time-series, chart, profit, expense, and target metrics for the dashboard.
 */
export function computeDashboardMetrics(params: {
  invoices: DashboardInvoiceRow[];
  expenses: RawExpenseDbRow[];
  period: DashboardPeriod;
  now?: Date;
}): ComputedDashboardState {
  const now = params.now ?? new Date();
  const currentYear = now.getFullYear();
  const currentMonthIdx = now.getMonth();

  const confirmedInvoices = params.invoices.filter((inv) => isConfirmedInvoiceStatus(inv.status));

  const monthlyCurrentYear = Array(12).fill(0);
  const monthlyPrevYear = Array(12).fill(0);
  let currentMonthSales = 0;

  for (const inv of confirmedInvoices) {
    const d = parseLocalRecordDate(inv.invoice_date, inv.created_at);
    const amt = Number(inv.grand_total) || 0;
    if (d.getFullYear() === currentYear) {
      monthlyCurrentYear[d.getMonth()] += amt;
      if (d.getMonth() === currentMonthIdx) {
        currentMonthSales += amt;
      }
    } else if (d.getFullYear() === currentYear - 1) {
      monthlyPrevYear[d.getMonth()] += amt;
    }
  }

  const totalSalesYear = monthlyCurrentYear.reduce((a, b) => a + b, 0);
  const comparisonSalesYear = monthlyPrevYear.reduce((a, b) => a + b, 0);

  const periodInvoices = confirmedInvoices.filter((inv) =>
    isRecordInPeriod(inv.invoice_date, inv.created_at, params.period, "current", now)
  );
  const prevPeriodInvoices = confirmedInvoices.filter((inv) =>
    isRecordInPeriod(inv.invoice_date, inv.created_at, params.period, "prev", now)
  );
  const periodExpenseRows = params.expenses.filter((exp) =>
    isRecordInPeriod(exp.expense_date, (exp as { created_at?: string }).created_at, params.period, "current", now)
  );

  const periodSales = periodInvoices.reduce((sum, inv) => sum + (Number(inv.grand_total) || 0), 0);
  const prevPeriodSales = prevPeriodInvoices.reduce((sum, inv) => sum + (Number(inv.grand_total) || 0), 0);
  const periodExpenses = periodExpenseRows.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);

  let latestExpenseLabel = "Recorded bills";
  if (periodExpenseRows.length > 0) {
    const sorted = [...periodExpenseRows].sort((a, b) =>
      extractLocalRecordDateKey(b.expense_date).localeCompare(extractLocalRecordDateKey(a.expense_date))
    );
    const parsedLatest = parseExpenseRow(sorted[0]);
    latestExpenseLabel = `${parsedLatest.expense_name} • ${parsedLatest.paid_by}`;
  }

  const { cogs: periodCOGS, itemCount: totalItemsCount } = computeInvoicesCogs(periodInvoices);
  const averageItems =
    periodInvoices.length > 0 ? Number((totalItemsCount / periodInvoices.length).toFixed(1)) : 0;
  const averageSaleValue = periodInvoices.length > 0 ? Math.round(periodSales / periodInvoices.length) : 0;
  const prevAvgSale = prevPeriodInvoices.length > 0 ? prevPeriodSales / prevPeriodInvoices.length : 0;
  const saleChangePct =
    prevAvgSale > 0 ? Number((((averageSaleValue - prevAvgSale) / prevAvgSale) * 100).toFixed(1)) : null;

  const grossProfit = periodSales - periodCOGS;
  const netProfit = grossProfit - periodExpenses;

  // Last 6 months Hero Bars
  const monthBuckets: { month: string; year: number; mIdx: number; amount: number; count: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const dt = new Date(currentYear, currentMonthIdx - i, 1);
    monthBuckets.push({
      month: MONTH_NAMES[dt.getMonth()],
      year: dt.getFullYear(),
      mIdx: dt.getMonth(),
      amount: 0,
      count: 0,
    });
  }
  for (const inv of confirmedInvoices) {
    const d = parseLocalRecordDate(inv.invoice_date, inv.created_at);
    const bucket = monthBuckets.find((b) => b.year === d.getFullYear() && b.mIdx === d.getMonth());
    if (bucket) {
      bucket.amount += Number(inv.grand_total) || 0;
      bucket.count += 1;
    }
  }
  const maxMonthSales = Math.max(0, ...monthBuckets.map((b) => b.amount));
  const heroMonths: MonthBarData[] = monthBuckets.map((b, idx) => ({
    month: b.month,
    amount: b.amount,
    orderCount: b.count,
    heightPct: maxMonthSales > 0 ? Math.round((b.amount / maxMonthSales) * 100) : 0,
    isActive: idx === monthBuckets.length - 1,
  }));

  // Last 5 months Particle Data
  const particleBuckets: { month: string; year: number; mIdx: number; items: number; invs: number }[] = [];
  for (let i = 4; i >= 0; i--) {
    const dt = new Date(currentYear, currentMonthIdx - i, 1);
    particleBuckets.push({
      month: MONTH_NAMES[dt.getMonth()],
      year: dt.getFullYear(),
      mIdx: dt.getMonth(),
      items: 0,
      invs: 0,
    });
  }
  for (const inv of confirmedInvoices) {
    const d = parseLocalRecordDate(inv.invoice_date, inv.created_at);
    const pb = particleBuckets.find((b) => b.year === d.getFullYear() && b.mIdx === d.getMonth());
    if (pb) {
      pb.invs += 1;
      pb.items += (inv.invoice_items || []).reduce((s, it) => s + (Number(it.quantity) || 0), 0);
    }
  }
  const particleData: DottedColumn[] = particleBuckets.map((pb, idx) => {
    const val = pb.invs > 0 ? Number((pb.items / pb.invs).toFixed(1)) : 0;
    return {
      month: pb.month,
      value: val,
      invoiceCount: pb.invs,
      dotsCount: pb.invs === 0 ? 0 : Math.max(3, Math.min(22, Math.round(val * 2))),
      highlight: idx === particleBuckets.length - 1 && pb.invs > 0,
    };
  });

  // Last 14 local days Daily Pill Bars
  const dayBuckets: { key: string; label: string; day: number; amount: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const dt = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const key = toLocalDateKey(dt);
    const label = dt.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
    dayBuckets.push({ key, label, day: dt.getDate(), amount: 0 });
  }
  for (const inv of confirmedInvoices) {
    const key = extractLocalRecordDateKey(inv.invoice_date, inv.created_at);
    const db = dayBuckets.find((b) => b.key === key);
    if (db) db.amount += Number(inv.grand_total) || 0;
  }
  const maxDaySales = Math.max(0, ...dayBuckets.map((b) => b.amount));
  const dailyData: DailyBarItem[] = dayBuckets.map((db, idx) => ({
    day: idx + 1,
    label: db.label,
    amount: db.amount,
    heightPct: maxDaySales > 0 ? Math.round((db.amount / maxDaySales) * 100) : 0,
    highlight: maxDaySales > 0 && db.amount === maxDaySales,
  }));

  return {
    metrics: {
      monthlySales: periodSales,
      currentMonthSales,
      previousMonthSales: prevPeriodSales,
      salesChange: periodSales - prevPeriodSales,
      grossProfit,
      netProfit,
      averageItems,
      averageSaleValue,
      saleChangePct,
      totalSalesYear,
      comparisonSalesYear,
    },
    heroMonths,
    particleData,
    dailyData,
    monthlyCurrentYear,
    monthlyPrevYear,
    activeMonthName: MONTH_NAMES[currentMonthIdx],
    expensesSummary: {
      totalAmount: Number(periodExpenses.toFixed(2)),
      count: periodExpenseRows.length,
      latestLabel: latestExpenseLabel,
    },
  };
}

