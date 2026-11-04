"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { TopHeader } from "@/components/layout/TopHeader";
import { HeroMonthBars } from "@/components/dashboard/HeroMonthBars";
import { TopRightMetricsCard } from "@/components/dashboard/TopRightMetricsCard";
import { TargetProgressBar } from "@/components/dashboard/TargetProgressBar";
import { SalesSplineChart } from "@/components/charts/SalesSplineChart";
import { OrderCard } from "@/components/dashboard/OrderCard";
import { GrossProfitCard, NetProfitCard } from "@/components/dashboard/ProfitCards";
import { MobilePeriodPills } from "@/components/dashboard/MobilePeriodPills";
import { getBusinessMetrics } from "@/lib/services/businessData";
import { createClient } from "@/lib/supabase/client";

export default function DashboardPage() {
  const [period, setPeriod] = useState<"today" | "week" | "month">("month");
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("there");

  // Reconciled Business Metrics State (initialized with unified aggregates)
  const [metrics, setMetrics] = useState(() => {
    const base = getBusinessMetrics();
    return {
      monthlySales: base.monthlySales,
      previousMonthSales: base.previousMonthSales,
      salesChange: base.salesChange,
      grossProfit: base.grossProfit,
      netProfit: base.netProfit,
      monthlyTarget: base.monthlyTarget,
      targetProgressPct: base.targetProgressPct,
      averageItems: base.averageItems,
      averageSaleValue: base.averageSaleValue,
      totalSalesYear: base.totalSalesYear,
      comparisonSalesYear: base.comparisonSalesYear,
    };
  });

  useEffect(() => {
    // Check if Playwright test metrics are injected
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

    async function loadUserProfileAndLiveAggregates() {
      try {
        const supabase = createClient();

        // 1. Fetch authenticated user profile to get first name
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", user.id)
            .single();

          const name = profile?.full_name || user.user_metadata?.full_name;
          if (name) {
            const first = name.trim().split(" ")[0];
            if (first) setUserName(first);
          }
        }

        // 2. Fetch live invoices & expenses if live DB contains rows
        const now = new Date();
        const startOfMonth = new Date(
          now.getFullYear(),
          now.getMonth(),
          1
        ).toISOString();
        const startOfLastMonth = new Date(
          now.getFullYear(),
          now.getMonth() - 1,
          1
        ).toISOString();
        const endOfLastMonth = new Date(
          now.getFullYear(),
          now.getMonth(),
          0,
          23,
          59,
          59
        ).toISOString();

        const [
          { data: curInvoices, error: curErr },
          { data: prevInvoices, error: prevErr },
          { data: expensesData, error: expErr },
        ] = await Promise.all([
          supabase
            .from("invoices")
            .select("total_amount, created_at")
            .gte("created_at", startOfMonth),
          supabase
            .from("invoices")
            .select("total_amount")
            .gte("created_at", startOfLastMonth)
            .lte("created_at", endOfLastMonth),
          supabase
            .from("expenses")
            .select("amount")
            .gte("created_at", startOfMonth),
        ]);

        if (!curErr && curInvoices && curInvoices.length > 0) {
          const curSales = curInvoices.reduce(
            (sum, inv) => sum + (Number(inv.total_amount) || 0),
            0
          );
          const prevSales = (prevInvoices || []).reduce(
            (sum, inv) => sum + (Number(inv.total_amount) || 0),
            0
          );
          const curExp = (expensesData || []).reduce(
            (sum, exp) => sum + (Number(exp.amount) || 0),
            0
          );

          const estimatedGrossProfit = curSales * 0.535;
          const calculatedNetProfit = Math.max(0, estimatedGrossProfit - curExp);
          const target = 80000.0;
          const targetPct =
            target > 0 ? Math.round((curSales / target) * 100) : 0;
          const avgSale =
            curInvoices.length > 0 ? curSales / curInvoices.length : 0;

          setMetrics({
            monthlySales: curSales,
            previousMonthSales: prevSales,
            salesChange: curSales - prevSales,
            grossProfit: estimatedGrossProfit,
            netProfit: calculatedNetProfit,
            monthlyTarget: target,
            targetProgressPct: targetPct,
            averageItems: 8.3,
            averageSaleValue: avgSale > 0 ? avgSale : 1240.0,
            totalSalesYear: curSales * 4.5,
            comparisonSalesYear: prevSales * 4.2,
          });
        }
      } catch (e) {
        // Falls back seamlessly to reconciled business metrics
      } finally {
        setLoading(false);
      }
    }

    loadUserProfileAndLiveAggregates();

    return () => {
      window.removeEventListener("tazqor:set-test-metrics", handleTestMetrics);
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col pb-4">
      {/* Top Navigation Bar */}
      <TopHeader period={period} onPeriodChange={setPeriod} />

      {/* Mobile-Only Period Segmented Pills (horizontal scroll with scroll-snap) */}
      <MobilePeriodPills period={period} onPeriodChange={setPeriod} />

      {/* Main Master Bento Canvas: 20 Columns x 5 Equal-Height Rows */}
      <div className="flex-1 flex flex-col lg:bento-grid gap-4 lg:gap-0 pt-1 select-none min-w-0 min-h-0">
        {/* 1. Hero Card: Cols 1-8, Rows 1-2 */}
        <div className="bento-hero min-w-0 min-h-0">
          <HeroMonthBars
            userName={userName}
            monthlySales={metrics.monthlySales}
            salesChange={metrics.salesChange}
            activeMonth="oct"
          />
        </div>

        {/* 2. Top-Right Analytics: Cols 9-20, Rows 1-2 */}
        <div className="bento-top-right min-w-0 min-h-0">
          <TopRightMetricsCard
            averageItems={metrics.averageItems}
            averageSaleValue={metrics.averageSaleValue}
          />
        </div>

        {/* 3. Sales Target Bar: Cols 1-12, Row 3 */}
        <div className="bento-target min-w-0 min-h-0">
          <TargetProgressBar
            currentSales={metrics.monthlySales}
            targetSales={metrics.monthlyTarget}
            progressPct={metrics.targetProgressPct}
          />
        </div>

        {/* 4. Sales This Year Spline: Cols 1-12, Rows 4-5 */}
        <div className="bento-sales-chart min-w-0 min-h-0">
          <SalesSplineChart
            totalSales={metrics.totalSalesYear}
            comparisonSales={metrics.comparisonSalesYear}
          />
        </div>

        {/* 5. Transfer Card: Cols 13-16, Row 3 */}
        <div className="bento-transfer min-w-0 min-h-0">
          <OrderCard
            type="Transfer"
            title="Warehouse transfer"
            subtitle="Central Hub → Surat Outlet"
            amount={28400.0}
            status="In Transit"
            countLabel={{ count: 48, word: "in transit" }}
            href="/inventory"
          />
        </div>

        {/* 6. Purchase Orders Card 1: Cols 13-16, Row 4 */}
        <div className="bento-po-1 min-w-0 min-h-0">
          <OrderCard
            type="Purchase orders"
            title="Chemical supplies"
            subtitle="ChemCorp Ltd. • Acid slurry"
            amount={42150.0}
            status="Dispatched"
            countLabel={{ count: 3, word: "dispatched" }}
            href="/orders"
          />
        </div>

        {/* 7. Purchase Orders Card 2: Cols 13-16, Row 5 */}
        <div className="bento-po-2 min-w-0 min-h-0">
          <OrderCard
            type="Purchase orders"
            title="Packaging cans"
            subtitle="Shreeji Polymer • 5L Cans"
            amount={18500.0}
            status="Delivered"
            countLabel={{ count: 500, word: "delivered" }}
            href="/orders"
          />
        </div>

        {/* 8. Gross Profit Card: Cols 17-20, Rows 3-4 */}
        <div className="bento-gross-profit min-w-0 min-h-0 relative">
          <GrossProfitCard
            grossProfit={metrics.grossProfit}
            grossMarginPct={53.5}
          />
          {/* Overlapping Round Arrow Button in circular notch with ring in page-background colour (#D3C7BD) */}
          <Link
            href="/reports"
            data-notch-overlap="true"
            className="absolute -bottom-5 right-5 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-black text-[#D7FF00] hover:scale-105 active:scale-95 ring-[6px] ring-[#D3C7BD] flex items-center justify-center transition-all z-30"
            title="View Profit Analysis"
            aria-label="View Profit Analysis"
          >
            <ArrowUpRight className="w-4 h-4 sm:w-5 sm:h-5 text-[#D7FF00]" />
          </Link>
        </div>

        {/* 9. Net Profit Card: Cols 17-20, Row 5 */}
        <div className="bento-net-profit min-w-0 min-h-0">
          <NetProfitCard
            netProfit={metrics.netProfit}
            netMarginPct={43.1}
          />
        </div>
      </div>
    </div>
  );
}
