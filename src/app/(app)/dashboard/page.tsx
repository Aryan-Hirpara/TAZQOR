"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  TrendingUp,
  Package,
  ShoppingCart,
  Users,
  AlertTriangle,
  Receipt,
  FileText,
  CalendarCheck,
  ChevronRight,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { TopHeader } from "@/components/layout/TopHeader";
import { formatINR } from "@/lib/formatting/currency";

export default function DashboardPage() {
  const [period, setPeriod] = useState<"today" | "week" | "month">("month");

  // Real aggregate data (configured for cleaning products business)
  const stats = {
    monthlySales: 331224.74,
    salesChange: 44357.23,
    grossProfit: 177349.50,
    netProfit: 142875.00,
    monthlyTarget: 400500.00,
    targetProgressPct: 82,
    todaySales: 24850.00,
    totalCustomers: 48,
    activeCustomers: 42,
    outstandingReceivables: 68420.00,
    overdueReceivables: 18500.00,
    totalOrders: 34,
    pendingDispatchOrders: 3,
    lowStockVariants: [
      { name: "TAZQOR Citrus Floor Cleaner (5 L)", currentStock: 4, reorderLevel: 10, unit: "Cans" },
      { name: "TAZQOR Sparkle Dish Wash Gel (5 L)", currentStock: 3, reorderLevel: 8, unit: "Cans" },
    ],
    recentOrders: [
      { id: "ORD-1042", customer: "Shreeji Supermarket", items: "12 Cans (Floor + Dish)", total: 5400, status: "confirmed", time: "10 mins ago" },
      { id: "ORD-1041", customer: "Hotel Pride Plaza", items: "24 Bottles (Hand Wash)", total: 2640, status: "processing", time: "1 hour ago" },
      { id: "ORD-1040", customer: "Apex Tech Park", items: "8 Cans (Toilet Cleaner)", total: 3360, status: "dispatched", time: "3 hours ago" },
    ],
    upcomingFollowUps: [
      { customer: "Shreeji Supermarket", date: "Today, 3:00 PM", purpose: "Stock re-order check", phone: "+91 98250 11223" },
      { customer: "Grand Heritage Resort", date: "Tomorrow, 11:30 AM", purpose: "Sample demo & quote", phone: "+91 99090 44556" },
    ]
  };

  return (
    <div className="min-h-screen">
      <TopHeader
        title="Operations Dashboard"
        subtitle="Cleaning Products Business Overview & Live Metrics"
      />

      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
        {/* Period Selector Tabs - Matching reference screenshot top bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 p-1 bg-white rounded-full border border-[#E5E4EE] shadow-sm">
            <button
              onClick={() => setPeriod("today")}
              className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-all ${
                period === "today"
                  ? "bg-[#0A0A0A] text-white"
                  : "text-gray-500 hover:text-black"
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setPeriod("week")}
              className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-all ${
                period === "week"
                  ? "bg-[#0A0A0A] text-white"
                  : "text-gray-500 hover:text-black"
              }`}
            >
              This Week
            </button>
            <button
              onClick={() => setPeriod("month")}
              className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-all ${
                period === "month"
                  ? "bg-[#0A0A0A] text-white"
                  : "text-gray-500 hover:text-black"
              }`}
            >
              This Month
            </button>
          </div>

          <Link
            href="/reports"
            className="hidden sm:flex items-center gap-1 text-xs font-semibold text-gray-700 hover:text-black bg-white px-3.5 py-1.5 rounded-full border border-[#E5E4EE] shadow-sm transition-all"
          >
            <span>View Full Reports</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Top Feature Grid: Hero Blue Card + Profit Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Hero Greeting Card (Reference Screenshot Style) */}
          <div className="lg:col-span-7 tazqor-hero-card p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-semibold uppercase tracking-wider text-blue-950/70">
                  Live Operations
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0B1536] tracking-tight max-w-md">
                Here&apos;s what&apos;s happening across your outlets.
              </h2>
            </div>

            <div className="mt-8 pt-6 border-t border-white/40 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs font-medium text-blue-900/80 mb-1">
                  Sales this month (All Outlets)
                </p>
                <div className="text-3xl sm:text-4xl font-extrabold text-[#0B1536] tracking-tight">
                  {formatINR(stats.monthlySales)}
                </div>
                <p className="text-xs font-medium text-emerald-800 mt-1 flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>+{formatINR(stats.salesChange)} vs last month</span>
                </p>
              </div>

              <Link
                href="/invoices/new"
                className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#0A0A0A] text-white text-xs font-bold shadow-md hover:bg-black/80 transition-all"
              >
                <span>Create Bill</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#D4F732]" />
              </Link>
            </div>
          </div>

          {/* Right Dual Profit Cards: Gross Profit (Lime) + Net Profit (Charcoal) */}
          <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
            {/* Gross Profit (Lime Card from Reference Screenshots) */}
            <div className="tazqor-lime-card p-6 flex flex-col justify-between relative group">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase font-extrabold tracking-wider text-black/70">
                  Gross Profit
                </span>
                <Link
                  href="/reports"
                  className="w-8 h-8 rounded-full bg-black/10 flex items-center justify-center text-black group-hover:scale-110 transition-transform"
                >
                  <ArrowUpRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="mt-4">
                <div className="text-2xl sm:text-3xl font-black text-[#0A0A0A] tracking-tight">
                  {formatINR(stats.grossProfit)}
                </div>
                <p className="text-xs text-black/75 font-semibold mt-1">
                  Calculated from batch costs & sales
                </p>
              </div>
            </div>

            {/* Net Profit (Charcoal Card from Reference Screenshots) */}
            <div className="tazqor-charcoal-card p-6 flex flex-col justify-between relative overflow-hidden group">
              {/* Decorative concentric arcs */}
              <div className="absolute -right-8 -bottom-8 w-32 h-32 rounded-full border border-white/10 pointer-events-none" />
              <div className="absolute -right-4 -bottom-4 w-24 h-24 rounded-full border border-white/15 pointer-events-none" />

              <div className="flex items-center justify-between">
                <span className="text-xs uppercase font-extrabold tracking-wider text-white/60">
                  Net Profit (After Expenses)
                </span>
                <Link
                  href="/reports"
                  className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-[#D4F732] group-hover:scale-110 transition-transform"
                >
                  <ArrowUpRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="mt-4">
                <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  {formatINR(stats.netProfit)}
                </div>
                <p className="text-xs text-gray-400 font-medium mt-1">
                  Gross Margin minus recorded operational expenses
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Sales Target Progress Bar (Exact Match to Ref Screenshots) */}
        <div className="bg-white rounded-3xl p-6 border border-[#E5E4EE] shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Monthly Target
              </p>
              <h3 className="text-xl font-extrabold text-[#0A0A0A] mt-0.5">
                {formatINR(stats.monthlyTarget)}{" "}
                <span className="text-xs font-medium text-gray-500">
                  ({stats.targetProgressPct}% Achieved)
                </span>
              </h3>
            </div>
            <div className="text-right">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-[#D4F732]/30 text-black border border-[#D4F732]">
                ₹ {(stats.monthlyTarget - stats.monthlySales).toLocaleString("en-IN", { maximumFractionDigits: 0 })} remaining
              </span>
            </div>
          </div>

          {/* Progress bar with lime fill and diagonal striped unfilled track */}
          <div className="w-full h-7 bg-gray-100 rounded-full overflow-hidden p-1 flex items-center relative border border-gray-200">
            <div
              className="h-full bg-[#D4F732] rounded-full transition-all duration-1000 flex items-center justify-end pr-2"
              style={{ width: `${Math.min(stats.targetProgressPct, 100)}%` }}
            >
              <div className="w-3.5 h-3.5 rounded-full bg-black/80 shadow-sm" />
            </div>
          </div>
        </div>

        {/* 4 Quick Metric KPI Tiles */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Outstanding Receivables */}
          <Link
            href="/payments"
            className="bg-white rounded-3xl p-5 border border-[#E5E4EE] shadow-sm hover:border-black transition-all group"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-gray-500">Receivables</span>
              <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Receipt className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-black text-[#0A0A0A]">
              {formatINR(stats.outstandingReceivables)}
            </div>
            <p className="text-[11px] font-semibold text-rose-600 mt-1">
              ₹ {stats.overdueReceivables.toLocaleString("en-IN")} overdue
            </p>
          </Link>

          {/* Today's Sales */}
          <Link
            href="/invoices"
            className="bg-white rounded-3xl p-5 border border-[#E5E4EE] shadow-sm hover:border-black transition-all group"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-gray-500">Today&apos;s Sales</span>
              <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-black text-[#0A0A0A]">
              {formatINR(stats.todaySales)}
            </div>
            <p className="text-[11px] text-gray-400 mt-1">From finalized bills</p>
          </Link>

          {/* Customer Stores */}
          <Link
            href="/customers"
            className="bg-white rounded-3xl p-5 border border-[#E5E4EE] shadow-sm hover:border-black transition-all group"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-gray-500">Retail Accounts</span>
              <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-black text-[#0A0A0A]">
              {stats.totalCustomers}
            </div>
            <p className="text-[11px] text-emerald-600 font-semibold mt-1">
              {stats.activeCustomers} active this month
            </p>
          </Link>

          {/* Active Orders */}
          <Link
            href="/orders"
            className="bg-white rounded-3xl p-5 border border-[#E5E4EE] shadow-sm hover:border-black transition-all group"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-gray-500">Orders in Pipeline</span>
              <div className="w-8 h-8 rounded-full bg-purple-50 text-purple-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                <ShoppingCart className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-black text-[#0A0A0A]">
              {stats.totalOrders}
            </div>
            <p className="text-[11px] font-semibold text-amber-600 mt-1">
              {stats.pendingDispatchOrders} awaiting dispatch
            </p>
          </Link>
        </div>

        {/* Operational Split: Recent Orders + Low Stock Alerts + Visits */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Recent Orders List (7 cols) */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-[#E5E4EE] shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-gray-600" />
                <h3 className="text-sm font-bold text-gray-900">Recent Customer Orders</h3>
              </div>
              <Link
                href="/orders"
                className="text-xs font-semibold text-blue-600 hover:text-blue-800"
              >
                View all
              </Link>
            </div>

            <div className="divide-y divide-gray-100 mt-2">
              {stats.recentOrders.map((order) => (
                <div key={order.id} className="py-3.5 flex items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-900">{order.customer}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-gray-100 text-gray-600">
                        {order.id}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{order.items}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-bold text-gray-900 block">
                      {formatINR(order.total)}
                    </span>
                    <span className="text-[10px] text-gray-400">{order.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Low Stock Alerts + Follow-ups (5 cols) */}
          <div className="lg:col-span-5 space-y-5">
            {/* Low Stock Alerts */}
            <div className="bg-white rounded-3xl p-6 border border-[#E5E4EE] shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2 text-rose-600">
                  <AlertTriangle className="w-4 h-4" />
                  <h3 className="text-sm font-bold text-gray-900">Low Stock Warning</h3>
                </div>
                <Link href="/inventory" className="text-xs font-semibold text-rose-600">
                  Stock Ledger
                </Link>
              </div>

              <div className="mt-3 space-y-2.5">
                {stats.lowStockVariants.map((item) => (
                  <div
                    key={item.name}
                    className="p-3 rounded-2xl bg-rose-50/60 border border-rose-100 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-xs font-bold text-gray-900">{item.name}</p>
                      <p className="text-[11px] text-rose-700 mt-0.5">
                        Reorder threshold: {item.reorderLevel} {item.unit}
                      </p>
                    </div>
                    <span className="px-2.5 py-1 rounded-xl bg-rose-600 text-white text-xs font-extrabold">
                      {item.currentStock} {item.unit}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Upcoming Follow-ups */}
            <div className="bg-white rounded-3xl p-6 border border-[#E5E4EE] shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2 text-gray-700">
                  <CalendarCheck className="w-4 h-4" />
                  <h3 className="text-sm font-bold text-gray-900">Today&apos;s Store Visits</h3>
                </div>
                <Link href="/visits" className="text-xs font-semibold text-blue-600">
                  All Visits
                </Link>
              </div>

              <div className="mt-3 space-y-2.5">
                {stats.upcomingFollowUps.map((visit) => (
                  <div
                    key={visit.customer}
                    className="p-3 rounded-2xl bg-[#F9F8FD] border border-[#E5E4EE] flex items-center justify-between"
                  >
                    <div>
                      <p className="text-xs font-bold text-gray-900">{visit.customer}</p>
                      <p className="text-[11px] text-gray-500 mt-0.5">{visit.purpose}</p>
                    </div>
                    <span className="text-[11px] font-bold text-gray-700 bg-white px-2.5 py-1 rounded-full border border-gray-200">
                      {visit.date}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
