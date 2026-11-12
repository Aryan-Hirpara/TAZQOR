"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { TopHeader } from "@/components/layout/TopHeader";
import { HeroMonthBars, MonthBarData } from "@/components/dashboard/HeroMonthBars";
import { TopRightMetricsCard } from "@/components/dashboard/TopRightMetricsCard";
import { TargetProgressBar } from "@/components/dashboard/TargetProgressBar";
import { SalesSplineChart } from "@/components/charts/SalesSplineChart";
import { DottedColumn } from "@/components/charts/DottedParticleChart";
import { DailyBarItem } from "@/components/charts/DailyPillBarChart";
import { OrderCard } from "@/components/dashboard/OrderCard";
import { GrossProfitCard, NetProfitCard } from "@/components/dashboard/ProfitCards";
import { MobilePeriodPills } from "@/components/dashboard/MobilePeriodPills";
import { createClient } from "@/lib/supabase/client";
import { RawExpenseDbRow } from "@/lib/expenses/expense-record";
import {
  computeDashboardMetrics,
  DashboardBatchRow,
  DashboardBatchStockRow,
  DashboardExpensesSummary,
  DashboardInventorySummary,
  DashboardInvoiceRow,
  DashboardOrderRow,
  DashboardPeriod,
  DashboardProductRow,
  DashboardStockSummaryRow,
  RecentOrderSummary,
  summarizeDashboardInventory,
  summarizeRecentActiveOrders,
} from "@/lib/dashboard/metrics";

const MONTH_NAMES = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
const TARGET_STORAGE_KEY = "tazqor_monthly_target";

interface RawDashboardSnapshot {
  invoices: DashboardInvoiceRow[];
  expenses: RawExpenseDbRow[];
  orders: DashboardOrderRow[];
  products: DashboardProductRow[];
  stockSummaries: DashboardStockSummaryRow[];
  batches: DashboardBatchRow[];
  batchStockOnHand: DashboardBatchStockRow[];
}

const EMPTY_SNAPSHOT: RawDashboardSnapshot = {
  invoices: [],
  expenses: [],
  orders: [],
  products: [],
  stockSummaries: [],
  batches: [],
  batchStockOnHand: [],
};

export default function DashboardPage() {
  const [period, setPeriod] = useState<DashboardPeriod>("month");
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("there");
  const [monthlyTarget, setMonthlyTarget] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const saved = Number(window.localStorage.getItem(TARGET_STORAGE_KEY));
      if (!Number.isNaN(saved) && saved >= 0) return saved;
    }
    return 0;
  });

  const [snapshot, setSnapshot] = useState<RawDashboardSnapshot>(EMPTY_SNAPSHOT);
  const [testMetricsOverride, setTestMetricsOverride] = useState<Record<string, unknown> | null>(null);

  const handleSaveTarget = useCallback((newTarget: number) => {
    setMonthlyTarget(newTarget);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(TARGET_STORAGE_KEY, String(newTarget));
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined" && (window as unknown as Record<string, unknown>).__TAZQOR_TEST_METRICS__) {
      setTestMetricsOverride(
        (window as unknown as Record<string, Record<string, unknown>>).__TAZQOR_TEST_METRICS__
      );
    }

    const handleTestMetrics = (e: Event) => {
      const custom = e as CustomEvent<Record<string, unknown>>;
      if (custom.detail) {
        setTestMetricsOverride((prev) => ({ ...(prev || {}), ...custom.detail }));
      }
    };
    window.addEventListener("tazqor:set-test-metrics", handleTestMetrics);

    let cancelled = false;

    async function loadLiveDashboardData() {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      if (!supabaseUrl || supabaseUrl.includes("placeholder")) {
        if (!cancelled) setLoading(false);
        return;
      }

      try {
        const supabase = createClient();

        // 1. User profile
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user && !cancelled) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", user.id)
            .maybeSingle();

          const name = profile?.full_name || user.user_metadata?.full_name;
          if (name) {
            const first = name.trim().split(" ")[0];
            if (first) setUserName(first);
          }
        }

        // 2. Fetch domain-isolated datasets in parallel:
        //    - Confirmed invoices (never cancelled or draft)
        //    - Business expenses (used for Net Profit + Expenses card)
        //    - Active non-cancelled orders (Orders card)
        //    - Live physical inventory state (Inventory card — never raw stock_movements audit reasons)
        const [
          { data: allInvoices },
          { data: allExpenses },
          { data: ordersData },
          { data: productsData },
          { data: stockSummariesData },
          { data: batchesData },
          { data: batchStockData },
        ] = await Promise.all([
          supabase
            .from("invoices")
            .select(
              "id, grand_total, subtotal, invoice_date, created_at, status, invoice_items(quantity, line_total, product_variants(cost_price), invoice_item_batches(quantity_allocated, cost_per_unit, batches(cost_per_unit)))"
            )
            .neq("status", "cancelled")
            .neq("status", "draft"),
          supabase
            .from("expenses")
            .select("id, expense_date, vendor, description, amount, payment_method, receipt_url, created_at"),
          supabase
            .from("orders")
            .select("id, order_number, status, created_at, customers(name, shop_name), order_items(quantity, unit_price)")
            .neq("status", "cancelled")
            .order("created_at", { ascending: false })
            .limit(5),
          supabase
            .from("products")
            .select("id, name, status, image_url, categories(name), product_variants(id, name, pack_size, sku, cost_price)")
            .neq("status", "archived"),
          supabase
            .from("v_stock_summary")
            .select("product_variant_id, total_quantity_on_hand"),
          supabase
            .from("batches")
            .select("id, product_variant_id, cost_per_unit"),
          supabase
            .from("v_stock_on_hand")
            .select("batch_id, quantity_on_hand"),
        ]);

        if (!cancelled) {
          setSnapshot({
            invoices: (allInvoices || []) as unknown as DashboardInvoiceRow[],
            expenses: (allExpenses || []) as unknown as RawExpenseDbRow[],
            orders: (ordersData || []) as unknown as DashboardOrderRow[],
            products: (productsData || []) as unknown as DashboardProductRow[],
            stockSummaries: (stockSummariesData || []) as unknown as DashboardStockSummaryRow[],
            batches: (batchesData || []) as unknown as DashboardBatchRow[],
            batchStockOnHand: (batchStockData || []) as unknown as DashboardBatchStockRow[],
          });
        }
      } catch (err) {
        console.warn("Failed to load dashboard data from Supabase:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadLiveDashboardData();

    return () => {
      cancelled = true;
      window.removeEventListener("tazqor:set-test-metrics", handleTestMetrics);
    };
  }, []);

  const computed = useMemo(
    () =>
      computeDashboardMetrics({
        invoices: snapshot.invoices,
        expenses: snapshot.expenses,
        period,
      }),
    [snapshot.invoices, snapshot.expenses, period]
  );

  const inventorySummary: DashboardInventorySummary = useMemo(
    () =>
      summarizeDashboardInventory({
        products: snapshot.products,
        stockSummaries: snapshot.stockSummaries,
        batches: snapshot.batches,
        batchStockOnHand: snapshot.batchStockOnHand,
      }),
    [snapshot.products, snapshot.stockSummaries, snapshot.batches, snapshot.batchStockOnHand]
  );

  const recentOrders: RecentOrderSummary[] = useMemo(
    () => summarizeRecentActiveOrders(snapshot.orders),
    [snapshot.orders]
  );

  const metrics = useMemo(
    () => ({
      ...computed.metrics,
      ...(testMetricsOverride || {}),
    }),
    [computed.metrics, testMetricsOverride]
  );

  const heroMonths: MonthBarData[] = computed.heroMonths;
  const particleData: DottedColumn[] = computed.particleData;
  const dailyData: DailyBarItem[] = computed.dailyData;
  const monthlyCurrentYear = computed.monthlyCurrentYear;
  const monthlyPrevYear = computed.monthlyPrevYear;
  const activeMonthName = computed.activeMonthName || MONTH_NAMES[new Date().getMonth()];
  const expensesSummary: DashboardExpensesSummary = computed.expensesSummary;

  const targetProgressPct =
    monthlyTarget > 0 ? Math.min(100, Math.round((metrics.currentMonthSales / monthlyTarget) * 100)) : 0;

  const periodExpensesTitle =
    period === "today"
      ? "Today's Expenses"
      : period === "week"
      ? "This Week Expenses"
      : "This Month Expenses";

  const inventorySubtitle = inventorySummary.topProduct
    ? `${inventorySummary.activeSkuCount} SKUs • Top: ${inventorySummary.topProduct.name} (${inventorySummary.topProduct.units})`
    : inventorySummary.activeSkuCount > 0
    ? `${inventorySummary.activeSkuCount} SKUs • Out of stock`
    : "Add stock in Inventory";

  return (
    <div className="min-h-0 flex-1 flex flex-col pb-4 lg:pb-0">
      {/* Top Navigation Bar */}
      <TopHeader period={period} onPeriodChange={setPeriod} />

      {/* Mobile-Only Period Segmented Pills */}
      <MobilePeriodPills period={period} onPeriodChange={setPeriod} />

      {/* Main Master Bento Canvas: 20 Columns x 5 Rows on Desktop */}
      <div className="flex-1 flex flex-col bento-grid gap-4 lg:gap-0 pt-1 select-none min-w-0 min-h-0">
        {/* 1. Hero Card: Cols 1-8, Rows 1-2 */}
        <div className="bento-hero min-w-0 min-h-0">
          <HeroMonthBars
            userName={userName}
            monthlySales={metrics.monthlySales}
            salesChange={metrics.salesChange}
            activeMonth={activeMonthName}
            months={heroMonths}
          />
        </div>

        {/* 2. Top-Right Analytics: Cols 9-20, Rows 1-2 */}
        <div className="bento-top-right min-w-0 min-h-0">
          <TopRightMetricsCard
            averageItems={metrics.averageItems}
            averageSaleValue={metrics.averageSaleValue}
            saleChangePct={metrics.saleChangePct}
            particleData={particleData}
            dailyData={dailyData}
          />
        </div>

        {/* 3. Sales Target Bar: Cols 1-12, Row 3 (always tracks monthly progress) */}
        <div className="bento-target min-w-0 min-h-0">
          <TargetProgressBar
            currentSales={metrics.currentMonthSales}
            targetSales={monthlyTarget}
            progressPct={targetProgressPct}
            onTargetSave={handleSaveTarget}
          />
        </div>

        {/* 4. Sales This Year Spline: Cols 1-12, Rows 4-5 */}
        <div className="bento-sales-chart min-w-0 min-h-0">
          <SalesSplineChart
            totalSales={metrics.totalSalesYear}
            comparisonSales={metrics.comparisonSalesYear}
            monthlyCurrent={monthlyCurrentYear}
            monthlyPrevious={monthlyPrevYear}
          />
        </div>

        {/* 5. Live Inventory Stock Card: Cols 13-16, Row 3 */}
        <div className="bento-transfer min-w-0 min-h-0">
          <OrderCard
            type="Inventory"
            title={inventorySummary.totalUnits > 0 ? "Stock on Hand" : "No Inventory Stock"}
            subtitle={inventorySubtitle}
            amount={inventorySummary.totalValuation}
            status={inventorySummary.totalUnits > 0 ? "IN STOCK" : "EMPTY"}
            countLabel={{
              count: inventorySummary.totalUnits,
              word: inventorySummary.totalUnits === 1 ? "unit" : "units",
            }}
            href="/inventory"
          />
        </div>

        {/* 6. Active Orders Card: Cols 13-16, Row 4 */}
        <div className="bento-po-1 min-w-0 min-h-0">
          <OrderCard
            type="Order"
            title={recentOrders[0] ? `#${recentOrders[0].order_number}` : "No active orders"}
            subtitle={recentOrders[0] ? recentOrders[0].customer_name : "All orders clear"}
            amount={recentOrders[0] ? recentOrders[0].totalAmount : 0}
            status={recentOrders[0] ? recentOrders[0].status.toUpperCase() : "CLEAR"}
            countLabel={
              recentOrders[0]
                ? {
                    count: recentOrders[0].itemCount,
                    word: recentOrders[0].itemCount === 1 ? "unit" : "units",
                  }
                : { count: 0, word: "orders" }
            }
            href={recentOrders[0] ? `/orders/${recentOrders[0].id}` : "/orders/new"}
          />
        </div>

        {/* 7. Period Expenses Card: Cols 13-16, Row 5 */}
        <div className="bento-po-2 min-w-0 min-h-0">
          <OrderCard
            type="Expenses"
            title={periodExpensesTitle}
            subtitle={expensesSummary.count > 0 ? expensesSummary.latestLabel : "No expenses recorded"}
            amount={expensesSummary.totalAmount}
            status={expensesSummary.count > 0 ? "RECORDED" : "NONE"}
            countLabel={{
              count: expensesSummary.count,
              word: expensesSummary.count === 1 ? "bill" : "bills",
            }}
            href="/expenses"
          />
        </div>

        {/* 8. Gross Profit Card: Cols 17-20, Rows 3-4 */}
        <div className="bento-gross-profit min-w-0 min-h-0 relative">
          <GrossProfitCard
            grossProfit={metrics.grossProfit}
            grossMarginPct={
              metrics.monthlySales > 0
                ? Number(((metrics.grossProfit / metrics.monthlySales) * 100).toFixed(1))
                : 0
            }
          />
          <Link
            href="/reports"
            data-notch-overlap="true"
            className="hidden lg:flex absolute -bottom-5 right-5 w-10 h-10 xl:w-11 xl:h-11 rounded-full bg-black text-[#D7FF00] hover:scale-105 active:scale-95 ring-[6px] ring-[#D3C7BD] items-center justify-center transition-all z-20"
            title="View Profit Analysis"
            aria-label="View Profit Analysis"
          >
            <ArrowUpRight className="w-4 h-4 xl:w-5 xl:h-5 text-[#D7FF00]" />
          </Link>
        </div>

        {/* 9. Net Profit Card: Cols 17-20, Row 5 */}
        <div className="bento-net-profit min-w-0 min-h-0">
          <NetProfitCard
            netProfit={metrics.netProfit}
            netMarginPct={
              metrics.monthlySales > 0
                ? Number(((metrics.netProfit / metrics.monthlySales) * 100).toFixed(1))
                : 0
            }
          />
        </div>
      </div>
      {loading && <span className="sr-only">Loading dashboard metrics</span>}
    </div>
  );
}
