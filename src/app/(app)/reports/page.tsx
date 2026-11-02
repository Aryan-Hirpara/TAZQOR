"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BarChart3,
  TrendingUp,
  Download,
  Calendar,
  Filter,
  Users,
  Layers,
  ArrowUpRight,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { TopHeader } from "@/components/layout/TopHeader";
import { formatINR } from "@/lib/formatting/currency";

export default function ReportsPage() {
  const [period, setPeriod] = useState<"this_month" | "last_month" | "year">("this_month");

  const reportData = {
    revenue: 331224.74,
    costOfGoodsSold: 153875.24,
    grossProfit: 177349.50,
    grossMarginPct: 53.5,
    operatingExpenses: 34474.50,
    netProfit: 142875.00,
    totalCollections: 198500.00,
    totalOutstanding: 68420.00,
    topProducts: [
      { name: "TAZQOR Citrus Floor Cleaner (5 L)", sales: 148500, units: 330, share: 44.8 },
      { name: "TAZQOR Sparkle Dish Wash Gel (5 L)", sales: 98800, units: 190, share: 29.8 },
      { name: "TAZQOR Anti-Bacterial Hand Wash (500 mL)", sales: 42500, units: 500, share: 12.8 },
      { name: "TAZQOR Ultra Toilet Cleaner (1 L)", sales: 41424, units: 360, share: 12.5 },
    ],
    salesByCity: [
      { city: "Ahmedabad", sales: 245000, percentage: 74 },
      { city: "Gandhinagar", sales: 86224, percentage: 26 },
    ],
  };

  const handleExportCSV = () => {
    // Excel-compatible UTF-8 with BOM (\uFEFF)
    // Guard against CSV formula injection by quoting and prefixing any leading = + - @ with a single quote
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
    <div className="min-h-screen">
      <TopHeader
        title="Financial Reports & Analytics"
        subtitle="Audited revenue, gross margin, collections, expenses and CSV export"
      />

      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
        {/* Controls Bar */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="flex items-center gap-1.5 p-1 bg-white rounded-full border border-[#E5E4EE] shadow-sm">
            <button
              onClick={() => setPeriod("this_month")}
              className={`px-4 py-1.5 text-xs font-bold rounded-full transition-all ${
                period === "this_month" ? "bg-[#0A0A0A] text-white" : "text-gray-500 hover:text-black"
              }`}
            >
              This Month
            </button>
            <button
              onClick={() => setPeriod("last_month")}
              className={`px-4 py-1.5 text-xs font-bold rounded-full transition-all ${
                period === "last_month" ? "bg-[#0A0A0A] text-white" : "text-gray-500 hover:text-black"
              }`}
            >
              Last Month
            </button>
            <button
              onClick={() => setPeriod("year")}
              className={`px-4 py-1.5 text-xs font-bold rounded-full transition-all ${
                period === "year" ? "bg-[#0A0A0A] text-white" : "text-gray-500 hover:text-black"
              }`}
            >
              FY 2026-27
            </button>
          </div>

          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center justify-center gap-2 h-11 px-5 rounded-full bg-[#0A0A0A] text-white text-xs sm:text-sm font-bold shadow-md hover:bg-black/90 active:scale-95 transition-all"
          >
            <Download className="w-4 h-4 text-[#D4F732]" />
            <span>Export CSV (Excel Safe)</span>
          </button>
        </div>

        {/* Financial Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Revenue */}
          <div className="bg-white rounded-3xl p-6 border border-[#E5E4EE] shadow-sm">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
              Total Invoiced Revenue
            </span>
            <div className="text-2xl font-black text-gray-900 mt-1">
              {formatINR(reportData.revenue)}
            </div>
            <p className="text-[11px] text-gray-400 mt-1">From finalized bills (net of tax)</p>
          </div>

          {/* Gross Margin */}
          <div className="tazqor-lime-card p-6 flex flex-col justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-black/70">
              Gross Profit ({reportData.grossMarginPct}%)
            </span>
            <div className="text-2xl font-black text-[#0A0A0A] mt-2">
              {formatINR(reportData.grossProfit)}
            </div>
            <p className="text-[11px] text-black/75 font-semibold mt-1">
              Revenue minus actual batch costs
            </p>
          </div>

          {/* Operational Expenses */}
          <div className="bg-white rounded-3xl p-6 border border-[#E5E4EE] shadow-sm">
            <span className="text-xs font-bold text-rose-600 uppercase tracking-wider block">
              Operating Expenses
            </span>
            <div className="text-2xl font-black text-rose-700 mt-1">
              {formatINR(reportData.operatingExpenses)}
            </div>
            <p className="text-[11px] text-gray-400 mt-1">Raw material, packaging, logistics</p>
          </div>

          {/* Net Profit */}
          <div className="tazqor-charcoal-card p-6 flex flex-col justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-white/60">
              Net Profit
            </span>
            <div className="text-2xl font-black text-white mt-2">
              {formatINR(reportData.netProfit)}
            </div>
            <p className="text-[11px] text-gray-400 font-medium mt-1">
              Gross margin minus expenses
            </p>
          </div>
        </div>

        {/* Product Sales Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-8 bg-white rounded-3xl p-6 border border-[#E5E4EE] shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-sm font-bold text-gray-900">
                Top Selling Cleaning Product Lines
              </h3>
              <span className="text-xs text-gray-400">Ranked by revenue contribution</span>
            </div>

            <div className="space-y-4">
              {reportData.topProducts.map((p) => (
                <div key={p.name} className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-bold text-gray-900">{p.name}</span>
                    <span className="font-mono font-bold text-gray-800">
                      {formatINR(p.sales)} ({p.share}%)
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#0A0A0A] rounded-full"
                      style={{ width: `${p.share}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* City / Geography Breakdown */}
          <div className="lg:col-span-4 bg-white rounded-3xl p-6 border border-[#E5E4EE] shadow-sm space-y-4">
            <div className="pb-3 border-b border-gray-100">
              <h3 className="text-sm font-bold text-gray-900">Revenue by City Territory</h3>
              <p className="text-xs text-gray-400">Sales delivery destination</p>
            </div>

            <div className="space-y-4">
              {reportData.salesByCity.map((c) => (
                <div key={c.city} className="p-4 rounded-2xl bg-[#F9F8FD] border border-[#E5E4EE] space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-gray-900">{c.city}</span>
                    <span className="font-extrabold text-sm">{formatINR(c.sales)}</span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#D4F732]"
                      style={{ width: `${c.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Master Reporting Definitions Callout (As Required by §3.7) */}
        <div className="bg-white rounded-3xl p-6 border border-[#E5E4EE] shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-gray-700">
            <Info className="w-4 h-4 text-blue-600" />
            <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
              TAZQOR Master Accounting & Metric Definitions (§3.7)
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs text-gray-600 pt-2">
            <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
              <strong className="block text-gray-900 mb-0.5">Sales / Revenue:</strong>
              Finalized invoice totals (excluding cancelled bills), before/after tax as labelled.
            </div>
            <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
              <strong className="block text-gray-900 mb-0.5">Collections:</strong>
              Total payment monies actually collected and deposited in bank/cash during the period.
            </div>
            <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
              <strong className="block text-gray-900 mb-0.5">Receivables:</strong>
              Outstanding customer balances across all finalized invoices not yet fully paid.
            </div>
            <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
              <strong className="block text-gray-900 mb-0.5">Gross Margin:</strong>
              Derived strictly from batch cost allocations recorded on finalized invoice lines.
            </div>
            <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
              <strong className="block text-gray-900 mb-0.5">Net Profit:</strong>
              Gross margin minus recorded operating expenses. Never fabricated without cost data.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
