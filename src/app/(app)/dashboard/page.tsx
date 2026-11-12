"use client";

import { useState, useEffect, useCallback } from "react";
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

const MONTH_NAMES = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
const TARGET_STORAGE_KEY = "tazqor_monthly_target";

interface RecentOrderSummary {
  id: string;
  order_number: string;
  customer_name: string;
  itemCount: number;
  totalAmount: number;
  status: string;
}

interface RecentMovementSummary {
  id: string;
  batch_number: string;
  product: string;
  type: string;
  quantity: number;
  valuation: number;
  notes: string;
}

export default function DashboardPage() {
  const [period, setPeriod] = useState<"today" | "week" | "month">("month");
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("there");
  const [monthlyTarget, setMonthlyTarget] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const saved = Number(window.localStorage.getItem(TARGET_STORAGE_KEY));
      if (!Number.isNaN(saved) && saved >= 0) return saved;
    }
    return 0;
  });

  const [metrics, setMetrics] = useState({
    monthlySales: 0,
    previousMonthSales: 0,
    salesChange: 0,
    grossProfit: 0,
    netProfit: 0,
    averageItems: 0,
    averageSaleValue: 0,
    saleChangePct: null as number | null,
    totalSalesYear: 0,
    comparisonSalesYear: 0,
  });

  const [heroMonths, setHeroMonths] = useState<MonthBarData[]>([]);
  const [particleData, setParticleData] = useState<DottedColumn[]>([]);
  const [dailyData, setDailyData] = useState<DailyBarItem[]>([]);
  const [monthlyCurrentYear, setMonthlyCurrentYear] = useState<number[]>(Array(12).fill(0));
  const [monthlyPrevYear, setMonthlyPrevYear] = useState<number[]>(Array(12).fill(0));
  const [activeMonthName, setActiveMonthName] = useState(() => MONTH_NAMES[new Date().getMonth()]);
  const [recentOrders, setRecentOrders] = useState<RecentOrderSummary[]>([]);
  const [recentMovement, setRecentMovement] = useState<RecentMovementSummary | null>(null);

  const handleSaveTarget = useCallback((newTarget: number) => {
    setMonthlyTarget(newTarget);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(TARGET_STORAGE_KEY, String(newTarget));
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).__TAZQOR_TEST_METRICS__) {
      setMetrics((prev) => ({
        ...prev,
        ...(window as any).__TAZQOR_TEST_METRICS__,
      }));
    }

    const handleTestMetrics = (e: any) => {
      if (e.detail) {
        setMetrics((prev) => ({ ...prev, ...e.detail }));
      }
    };
    window.addEventListener("tazqor:set-test-metrics", handleTestMetrics);

    async function loadLiveDashboardData() {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      if (!supabaseUrl || supabaseUrl.includes("placeholder")) {
        setLoading(false);
        return;
      }

      try {
        const supabase = createClient();

        // 1. User profile
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
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

        // 2. Fetch live non-cancelled invoices with items, variant cost & allocated FEFO batch costs
        const [
          { data: allInvoices },
          { data: allExpenses },
          { data: ordersData },
          { data: movsData },
        ] = await Promise.all([
          supabase
            .from("invoices")
            .select(
              "id, grand_total, subtotal, invoice_date, created_at, status, invoice_items(quantity, line_total, product_variants(cost_price), invoice_item_batches(quantity_allocated, cost_per_unit))"
            )
            .neq("status", "cancelled"),
          supabase.from("expenses").select("amount, expense_date, created_at"),
          supabase
            .from("orders")
            .select("id, order_number, status, created_at, customers(name, shop_name), order_items(quantity, unit_price)")
            .neq("status", "cancelled")
            .order("created_at", { ascending: false })
            .limit(4),
          supabase
            .from("stock_movements")
            .select("id, movement_type, quantity, reason, notes, product_variant_id, batch_id, product_variants(name, products(name)), batches(batch_number, cost_per_unit)")
            .order("created_at", { ascending: false })
            .limit(1),
        ]);

        if (ordersData) {
          const ords: RecentOrderSummary[] = ordersData.map((o: any) => {
            const custName = o.customers?.shop_name || o.customers?.name || "Customer";
            const items = o.order_items || [];
            const count = items.reduce((sum: number, it: any) => sum + (Number(it.quantity) || 0), 0);
            const total = items.reduce(
              (sum: number, it: any) => sum + (Number(it.quantity) || 0) * (Number(it.unit_price) || 0),
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
          setRecentOrders(ords);
        } else {
          setRecentOrders([]);
        }

        if (movsData && movsData.length > 0) {
          const m = movsData[0] as any;
          const qty = Math.abs(Number(m.quantity) || 0);
          const costPerUnit = Number(m.batches?.cost_per_unit) || 0;
          const prodName = m.product_variants?.products?.name
            ? `${m.product_variants.products.name} (${m.product_variants.name})`
            : m.product_variants?.name || "Inventory";
          const isInbound =
            m.movement_type === "opening_stock" ||
            m.movement_type === "purchase_in" ||
            m.movement_type === "sales_return_in" ||
            m.movement_type === "adjustment_in";

          setRecentMovement({
            id: m.id,
            batch_number: m.batches?.batch_number || "—",
            product: prodName,
            type: isInbound ? "Stock In" : "Stock Out",
            quantity: qty,
            valuation: qty * costPerUnit,
            notes: m.reason || m.notes || m.movement_type.replace(/_/g, " "),
          });
        } else {
          setRecentMovement(null);
        }

        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonthIdx = now.getMonth();
        setActiveMonthName(MONTH_NAMES[currentMonthIdx]);

        const invoicesList = (allInvoices || []) as any[];
        const expensesList = (allExpenses || []) as any[];

        // Annual 12-month series for SalesSplineChart
        const curYrMonthly = Array(12).fill(0);
        const prevYrMonthly = Array(12).fill(0);
        invoicesList.forEach((inv) => {
          const d = new Date(inv.invoice_date || inv.created_at);
          const amt = Number(inv.grand_total) || 0;
          if (d.getFullYear() === currentYear) {
            curYrMonthly[d.getMonth()] += amt;
          } else if (d.getFullYear() === currentYear - 1) {
            prevYrMonthly[d.getMonth()] += amt;
          }
        });
        setMonthlyCurrentYear(curYrMonthly);
        setMonthlyPrevYear(prevYrMonthly);

        const salesThisYear = curYrMonthly.reduce((a, b) => a + b, 0);
        const salesPrevYear = prevYrMonthly.reduce((a, b) => a + b, 0);

        // Date helper for period filtering
        const parseDate = (dateStr?: string, createdStr?: string) => new Date(dateStr || createdStr || 0);
        const todayStr = now.toISOString().split("T")[0];
        const yesterdayStr = new Date(now.getTime() - 86400000).toISOString().split("T")[0];
        const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000);
        const fourteenDaysAgo = new Date(now.getTime() - 14 * 86400000);
        const startOfMonth = new Date(currentYear, currentMonthIdx, 1);
        const startOfLastMonth = new Date(currentYear, currentMonthIdx - 1, 1);
        const endOfLastMonth = new Date(currentYear, currentMonthIdx, 0, 23, 59, 59);

        const inPeriod = (dateStr?: string, createdStr?: string, mode: "current" | "prev" = "current") => {
          const raw = dateStr || createdStr || "";
          const d = parseDate(dateStr, createdStr);
          if (period === "today") {
            return mode === "current" ? raw.startsWith(todayStr) : raw.startsWith(yesterdayStr);
          }
          if (period === "week") {
            return mode === "current" ? d >= sevenDaysAgo : d >= fourteenDaysAgo && d < sevenDaysAgo;
          }
          return mode === "current"
            ? d >= startOfMonth
            : d >= startOfLastMonth && d <= endOfLastMonth;
        };

        const periodInvoices = invoicesList.filter((inv) => inPeriod(inv.invoice_date, inv.created_at, "current"));
        const prevPeriodInvoices = invoicesList.filter((inv) => inPeriod(inv.invoice_date, inv.created_at, "prev"));
        const periodExpensesList = expensesList.filter((exp) => inPeriod(exp.expense_date, exp.created_at, "current"));

        const periodSales = periodInvoices.reduce((sum, inv) => sum + (Number(inv.grand_total) || 0), 0);
        const prevPeriodSales = prevPeriodInvoices.reduce((sum, inv) => sum + (Number(inv.grand_total) || 0), 0);
        const periodExpenses = periodExpensesList.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);

        // COGS from invoice_item_batches (real FEFO batch costs) or variant cost_price fallback
        let periodCOGS = 0;
        let totalItemsCount = 0;
        periodInvoices.forEach((inv) => {
          const items = inv.invoice_items || [];
          items.forEach((it: any) => {
            const qty = Number(it.quantity) || 0;
            totalItemsCount += qty;
            const batchAllocs = it.invoice_item_batches || [];
            if (batchAllocs.length > 0) {
              periodCOGS += batchAllocs.reduce(
                (s: number, b: any) => s + (Number(b.quantity_allocated) || 0) * (Number(b.cost_per_unit) || 0),
                0
              );
            } else {
              periodCOGS += qty * (Number(it.product_variants?.cost_price) || 0);
            }
          });
        });

        const avgItems = periodInvoices.length > 0 ? Number((totalItemsCount / periodInvoices.length).toFixed(1)) : 0;
        const avgSale = periodInvoices.length > 0 ? Math.round(periodSales / periodInvoices.length) : 0;
        const prevAvgSale = prevPeriodInvoices.length > 0 ? prevPeriodSales / prevPeriodInvoices.length : 0;
        const saleChangePct =
          prevAvgSale > 0 ? Number((((avgSale - prevAvgSale) / prevAvgSale) * 100).toFixed(1)) : null;

        const grossProfit = Math.max(0, periodSales - periodCOGS);
        const netProfit = Math.max(0, grossProfit - periodExpenses);

        // Last 6 months Hero Bars (real revenue & invoice counts)
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
        invoicesList.forEach((inv) => {
          const d = parseDate(inv.invoice_date, inv.created_at);
          const bucket = monthBuckets.find((b) => b.year === d.getFullYear() && b.mIdx === d.getMonth());
          if (bucket) {
            bucket.amount += Number(inv.grand_total) || 0;
            bucket.count += 1;
          }
        });
        const maxMonthSales = Math.max(0, ...monthBuckets.map((b) => b.amount));
        setHeroMonths(
          monthBuckets.map((b, idx) => ({
            month: b.month,
            amount: b.amount,
            orderCount: b.count,
            heightPct: maxMonthSales > 0 ? Math.round((b.amount / maxMonthSales) * 100) : 0,
            isActive: idx === monthBuckets.length - 1,
          }))
        );

        // Last 5 months Particle Data (real avg items/bill)
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
        invoicesList.forEach((inv) => {
          const d = parseDate(inv.invoice_date, inv.created_at);
          const pb = particleBuckets.find((b) => b.year === d.getFullYear() && b.mIdx === d.getMonth());
          if (pb) {
            pb.invs += 1;
            pb.items += (inv.invoice_items || []).reduce((s: number, it: any) => s + (Number(it.quantity) || 0), 0);
          }
        });
        setParticleData(
          particleBuckets.map((pb, idx) => {
            const val = pb.invs > 0 ? Number((pb.items / pb.invs).toFixed(1)) : 0;
            return {
              month: pb.month,
              value: val,
              invoiceCount: pb.invs,
              dotsCount: pb.invs === 0 ? 0 : Math.max(3, Math.min(22, Math.round(val * 2))),
              highlight: idx === particleBuckets.length - 1 && pb.invs > 0,
            };
          })
        );

        // Last 14 days Daily Pill Bars (real sales)
        const dayBuckets: { key: string; label: string; day: number; amount: number }[] = [];
        for (let i = 13; i >= 0; i--) {
          const dt = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
          const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
          const label = dt.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
          dayBuckets.push({ key, label, day: dt.getDate(), amount: 0 });
        }
        invoicesList.forEach((inv) => {
          const key = (inv.invoice_date || inv.created_at || "").slice(0, 10);
          const db = dayBuckets.find((b) => b.key === key);
          if (db) db.amount += Number(inv.grand_total) || 0;
        });
        const maxDaySales = Math.max(0, ...dayBuckets.map((b) => b.amount));
        setDailyData(
          dayBuckets.map((db, idx) => ({
            day: idx + 1,
            label: db.label,
            amount: db.amount,
            heightPct: maxDaySales > 0 ? Math.round((db.amount / maxDaySales) * 100) : 0,
            highlight: maxDaySales > 0 && db.amount === maxDaySales,
          }))
        );

        setMetrics({
          monthlySales: periodSales,
          previousMonthSales: prevPeriodSales,
          salesChange: periodSales - prevPeriodSales,
          grossProfit,
          netProfit,
          averageItems: avgItems,
          averageSaleValue: avgSale,
          saleChangePct,
          totalSalesYear: salesThisYear,
          comparisonSalesYear: salesPrevYear,
        });
      } catch (err) {
        console.warn("Failed to load dashboard data from Supabase:", err);
      } finally {
        setLoading(false);
      }
    }

    loadLiveDashboardData();

    return () => {
      window.removeEventListener("tazqor:set-test-metrics", handleTestMetrics);
    };
  }, [period]);

  const targetProgressPct =
    monthlyTarget > 0 ? Math.min(100, Math.round((metrics.monthlySales / monthlyTarget) * 100)) : 0;

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

        {/* 3. Sales Target Bar: Cols 1-12, Row 3 */}
        <div className="bento-target min-w-0 min-h-0">
          <TargetProgressBar
            currentSales={metrics.monthlySales}
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

        {/* 5. Stock Movement / Transfer Card: Cols 13-16, Row 3 */}
        <div className="bento-transfer min-w-0 min-h-0">
          <OrderCard
            type={recentMovement ? "Inventory" : "Transfer"}
            title={recentMovement ? recentMovement.notes : "No recent movements"}
            subtitle={recentMovement ? recentMovement.product : "Warehouse"}
            amount={recentMovement ? recentMovement.valuation : 0}
            status={recentMovement ? recentMovement.type : "Empty"}
            countLabel={{
              count: recentMovement ? recentMovement.quantity : 0,
              word: "units",
            }}
            href="/inventory"
          />
        </div>

        {/* 6. Recent Order Card 1: Cols 13-16, Row 4 */}
        <div className="bento-po-1 min-w-0 min-h-0">
          <OrderCard
            type="Order"
            title={recentOrders[0] ? `#${recentOrders[0].order_number}` : "No orders yet"}
            subtitle={recentOrders[0] ? recentOrders[0].customer_name : "Create your first order"}
            amount={recentOrders[0] ? recentOrders[0].totalAmount : 0}
            status={recentOrders[0] ? recentOrders[0].status.toUpperCase() : "—"}
            countLabel={{
              count: recentOrders[0] ? recentOrders[0].itemCount : 0,
              word: "units",
            }}
            href={recentOrders[0] ? `/orders/${recentOrders[0].id}` : "/orders/new"}
          />
        </div>

        {/* 7. Recent Order Card 2: Cols 13-16, Row 5 */}
        <div className="bento-po-2 min-w-0 min-h-0">
          <OrderCard
            type="Order"
            title={recentOrders[1] ? `#${recentOrders[1].order_number}` : "No recent order"}
            subtitle={recentOrders[1] ? recentOrders[1].customer_name : "—"}
            amount={recentOrders[1] ? recentOrders[1].totalAmount : 0}
            status={recentOrders[1] ? recentOrders[1].status.toUpperCase() : "—"}
            countLabel={{
              count: recentOrders[1] ? recentOrders[1].itemCount : 0,
              word: "units",
            }}
            href={recentOrders[1] ? `/orders/${recentOrders[1].id}` : "/orders"}
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
      {loading && (
        <span className="sr-only">Loading dashboard metrics</span>
      )}
    </div>
  );
}
