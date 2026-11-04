"use client";

import { useState } from "react";
import {
  BarChart3,
  TrendingUp,
  Download,
  Calendar,
  Layers,
  ArrowUpRight,
} from "lucide-react";
import { toast } from "sonner";
import { TopHeader } from "@/components/layout/TopHeader";
import { formatINR } from "@/lib/formatting/currency";
import { MobileSalesAnalyzing } from "@/components/dashboard/MobileSalesAnalyzing";
import { getBusinessMetrics } from "@/lib/services/businessData";

export default function ReportsPage() {
  const [period, setPeriod] = useState<"this_month" | "last_month" | "year">("this_month");
  const metrics = getBusinessMetrics();

  const reportData = {
    revenue: metrics.monthlySales, // 64,200.00
    costOfGoodsSold: metrics.costOfGoodsSold, // 29,800.00
    grossProfit: metrics.grossProfit, // 34,400.00
    grossMarginPct: metrics.grossMarginPct, // 53.6%
    operatingExpenses: metrics.operatingExpenses, // 8,200.00
    netProfit: metrics.netProfit, // 26,200.00
    totalCollections: metrics.totalCollected, // 57,700.00
    totalOutstanding: metrics.totalOutstanding, // 6,500.00
    topProducts: [
      { name: "TAZQOR Citrus Floor Cleaner (5 L)", sales: 28500, units: 65, share: 44.4 },
      { name: "TAZQOR Sparkle Dish Wash Gel (5 L)", sales: 18200, units: 35, share: 28.3 },
      { name: "TAZQOR Anti-Bacterial Hand Wash (500 mL)", sales: 9400, units: 110, share: 14.6 },
      { name: "TAZQOR Ultra Toilet Cleaner (1 L)", sales: 8100, units: 70, share: 12.6 },
    ],
    salesByCity: [
      { city: "Ahmedabad", sales: 48500, percentage: 75.5 },
      { city: "Gandhinagar", sales: 15700, percentage: 24.5 },
    ],
  };

  const handleExportCSV = () => {
    const sanitize = (val: string | number) => {
      const s = String(val);
      if (/^[=+\-@]/.test(s)) {
        return `"'${s}"`;
      }
      return `"${s.replace(/"/g, '""')}"`;
    };

    let csv = "\uFEFF"; // UTF-8 BOM
    csv += "Product Name,Units Sold,Total Sales (INR),Revenue Share (%)\r\n";
    for (const p of reportData.topProducts) {
      csv += `${sanitize(p.name)},${sanitize(p.units)},${sanitize(p.sales)},${sanitize(p.share)}\r\n`;
    }

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `TAZQOR_Sales_Report_${period}_2026.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("Excel-compatible CSV exported successfully!");
  };

  return (
    <div className="min-h-screen pb-12">
      {/* Mobile "Sales Analyzing" Screen matching Ref-10, Ref-13, and Ref-14 */}
      <div className="md:hidden pt-2 px-1">
        <MobileSalesAnalyzing
          grossProfit={reportData.grossProfit}
          netProfit={reportData.netProfit}
          grossMarginPct={reportData.grossMarginPct}
          netMarginPct={43.1}
        />
      </div>

      <div className="hidden md:block">
        <TopHeader title="Financial Reports" />

      <div className="space-y-6 pt-2">
        {/* Controls Bar */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="flex items-center gap-1.5 p-1 bg-white/55 backdrop-blur-md rounded-full border border-white/70 shadow-sm">
            <button
              onClick={() => setPeriod("this_month")}
              className={`px-4 py-1.5 text-xs font-light rounded-full transition-all ${
                period === "this_month" ? "bg-black text-white font-normal shadow-sm" : "text-neutral-700 hover:text-black"
              }`}
            >
              This Month
            </button>
            <button
              onClick={() => setPeriod("last_month")}
              className={`px-4 py-1.5 text-xs font-light rounded-full transition-all ${
                period === "last_month" ? "bg-black text-white font-normal shadow-sm" : "text-neutral-700 hover:text-black"
              }`}
            >
              Last Month
            </button>
            <button
              onClick={() => setPeriod("year")}
              className={`px-4 py-1.5 text-xs font-light rounded-full transition-all ${
                period === "year" ? "bg-black text-white font-normal shadow-sm" : "text-neutral-700 hover:text-black"
              }`}
            >
              FY 2026-27
            </button>
          </div>

          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center justify-center gap-2 h-10 px-5 rounded-full bg-black text-white text-xs sm:text-sm font-normal shadow-md hover:scale-105 active:scale-95 transition-all"
          >
            <Download className="w-4 h-4 text-[#E0FE52]" />
            <span>Export CSV</span>
          </button>
        </div>

        {/* Financial Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Revenue */}
          <div className="bg-white/55 backdrop-blur-xl border border-white/65 rounded-[24px] p-6 shadow-sm flex flex-col justify-between">
            <span className="text-xs font-light text-neutral-500 block">
              Total invoiced revenue
            </span>
            <div className="text-3xl font-normal text-neutral-900 mt-1 tracking-tight">
              {formatINR(reportData.revenue)}
            </div>
            <p className="text-[11px] font-light text-neutral-400 mt-1">From finalized bills (net of tax)</p>
          </div>

          {/* Gross Margin (Electric Lime Card) */}
          <div className="bg-[#E0FE52] text-black rounded-[24px] p-6 shadow-xl shadow-[#E0FE52]/20 flex flex-col justify-between relative overflow-hidden">
            <svg
              viewBox="0 0 200 120"
              className="absolute inset-0 w-full h-full pointer-events-none opacity-20"
              preserveAspectRatio="xMidYMid slice"
            >
              <circle cx="100" cy="60" r="30" fill="none" stroke="#000000" strokeWidth="1" />
              <circle cx="100" cy="60" r="60" fill="none" stroke="#000000" strokeWidth="1" />
              <circle cx="100" cy="60" r="90" fill="none" stroke="#000000" strokeWidth="1" />
            </svg>
            <div className="relative z-10">
              <span className="text-xs font-normal text-black/80 block uppercase tracking-wide">
                Gross profit ({reportData.grossMarginPct}%)
              </span>
              <div className="text-3xl font-normal text-black mt-1 tracking-tight">
                {formatINR(reportData.grossProfit)}
              </div>
              <p className="text-[11px] font-light text-black/70 mt-1">
                Revenue minus batch production costs
              </p>
            </div>
          </div>

          {/* Operational Expenses */}
          <div className="bg-white/55 backdrop-blur-xl border border-white/65 rounded-[24px] p-6 shadow-sm flex flex-col justify-between">
            <span className="text-xs font-light text-neutral-500 block">
              Operating expenses
            </span>
            <div className="text-3xl font-normal text-rose-600 mt-1 tracking-tight">
              {formatINR(reportData.operatingExpenses)}
            </div>
            <p className="text-[11px] font-light text-neutral-400 mt-1">Logistics, packaging, materials</p>
          </div>

          {/* Net Profit (Black Card) */}
          <div className="bg-black text-white rounded-[24px] p-6 shadow-xl shadow-black/40 flex flex-col justify-between relative overflow-hidden">
            <svg
              viewBox="0 0 200 120"
              className="absolute inset-0 w-full h-full pointer-events-none opacity-20"
              preserveAspectRatio="xMidYMid slice"
            >
              <circle cx="100" cy="60" r="30" fill="none" stroke="#FFFFFF" strokeWidth="1" />
              <circle cx="100" cy="60" r="60" fill="none" stroke="#FFFFFF" strokeWidth="1" />
              <circle cx="100" cy="60" r="90" fill="none" stroke="#FFFFFF" strokeWidth="1" />
            </svg>
            <div className="relative z-10">
              <span className="text-xs font-normal text-white/80 block uppercase tracking-wide">
                Net profit
              </span>
              <div className="text-3xl font-normal text-white mt-1 tracking-tight">
                {formatINR(reportData.netProfit)}
              </div>
              <p className="text-[11px] font-light text-neutral-400 mt-1">
                Gross margin minus operating expenses
              </p>
            </div>
          </div>
        </div>

        {/* Product Sales Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-8 bg-white/55 backdrop-blur-xl rounded-[28px] p-6 border border-white/65 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/50">
              <h3 className="text-sm font-normal text-neutral-900">
                Top selling cleaning product lines
              </h3>
              <span className="text-xs font-light text-neutral-400">Ranked by revenue contribution</span>
            </div>

            <div className="space-y-4">
              {reportData.topProducts.map((p) => (
                <div key={p.name} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-normal text-neutral-900">{p.name}</span>
                    <div className="flex items-center gap-3">
                      <span className="font-light text-neutral-500">{p.units} units</span>
                      <span className="font-normal text-neutral-900">{formatINR(p.sales)}</span>
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="h-2 w-full bg-white/50 rounded-full overflow-hidden border border-white/70">
                    <div
                      className="h-full bg-black rounded-full"
                      style={{ width: `${p.share}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Regional Territory Breakdown */}
          <div className="lg:col-span-4 bg-white/55 backdrop-blur-xl rounded-[28px] p-6 border border-white/65 shadow-sm flex flex-col justify-between">
            <div>
              <div className="pb-3 border-b border-white/50">
                <h3 className="text-sm font-normal text-neutral-900">
                  Sales by territory
                </h3>
                <span className="text-xs font-light text-neutral-400">Gujarat regional markets</span>
              </div>

              <div className="space-y-4 mt-4">
                {reportData.salesByCity.map((c) => (
                  <div key={c.city} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-normal text-neutral-900">{c.city}</span>
                      <span className="font-normal text-neutral-900">{formatINR(c.sales)}</span>
                    </div>
                    <div className="h-2 w-full bg-white/50 rounded-full overflow-hidden border border-white/70">
                      <div
                        className="h-full bg-[#D7FF00] rounded-full"
                        style={{ width: `${c.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-white/50 text-[11px] font-light text-neutral-500">
              Collections: <span className="font-normal text-neutral-900">{formatINR(reportData.totalCollections)}</span> • Outstanding: <span className="font-normal text-rose-600">{formatINR(reportData.totalOutstanding)}</span>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
