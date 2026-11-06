"use client";

import { useState, useEffect } from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { TopHeader } from "@/components/layout/TopHeader";
import { formatINR } from "@/lib/formatting/currency";
import { MobileSalesAnalyzing } from "@/components/dashboard/MobileSalesAnalyzing";
import { createClient } from "@/lib/supabase/client";

interface TopProduct {
  name: string;
  sales: number;
  units: number;
  share: number;
}

interface CitySales {
  city: string;
  sales: number;
  percentage: number;
}

export default function ReportsPage() {
  const [period, setPeriod] = useState<"this_month" | "last_month" | "year">("this_month");
  const [loading, setLoading] = useState(true);

  // Live data state from Supabase
  const [revenue, setRevenue] = useState(0);
  const [operatingExpenses, setOperatingExpenses] = useState(0);
  const [totalCollections, setTotalCollections] = useState(0);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [salesByCity, setSalesByCity] = useState<CitySales[]>([]);

  useEffect(() => {
    async function fetchReportsData() {
      try {
        setLoading(true);
        const supabase = createClient();

        // Calculate date range based on period
        const now = new Date();
        let startDate: string;
        let endDate: string;

        if (period === "this_month") {
          startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];
        } else if (period === "last_month") {
          startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split("T")[0];
          endDate = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split("T")[0];
        } else {
          // FY 2026-27: April 2026 - March 2027
          startDate = "2026-04-01";
          endDate = "2027-03-31";
        }

        // 1. Fetch Invoices with items and customer city filtered by date
        const { data: invData } = await supabase
          .from("invoices")
          .select("id, grand_total, status, invoice_date, created_at, customers(name, city), invoice_items(description, quantity, line_total)")
          .gte("invoice_date", startDate)
          .lte("invoice_date", endDate)
          .order("created_at", { ascending: false });

        // 2. Fetch Expenses filtered by date
        const { data: expData } = await supabase
          .from("expenses")
          .select("id, amount, description, expense_date")
          .gte("expense_date", startDate)
          .lte("expense_date", endDate);

        // 3. Fetch Payments filtered by date
        const { data: payData } = await supabase
          .from("payments")
          .select("id, amount, payment_date")
          .gte("payment_date", startDate)
          .lte("payment_date", endDate);

        if (invData) {
          const validInvoices = invData.filter((i) => i.status !== "cancelled" && i.status !== "draft");
          const rev = validInvoices.reduce((sum, inv) => sum + (Number(inv.grand_total) || 0), 0);
          setRevenue(rev);

          // Group products from invoice_items
          const prodMap: Record<string, { units: number; sales: number }> = {};
          validInvoices.forEach((inv) => {
            const items = (inv.invoice_items as any[]) || [];
            items.forEach((it) => {
              const name = it.description || "Cleaning Supply";
              if (!prodMap[name]) {
                prodMap[name] = { units: 0, sales: 0 };
              }
              prodMap[name].units += Number(it.quantity) || 0;
              prodMap[name].sales += Number(it.line_total) || 0;
            });
          });

          const totalProdSales = Object.values(prodMap).reduce((s, p) => s + p.sales, 0) || rev || 1;
          const prods: TopProduct[] = Object.entries(prodMap).map(([name, data]) => ({
            name,
            sales: data.sales,
            units: data.units,
            share: Number(((data.sales / totalProdSales) * 100).toFixed(1)),
          })).sort((a, b) => b.sales - a.sales);

          setTopProducts(prods);

          // Group by customer city
          const cityMap: Record<string, number> = {};
          validInvoices.forEach((inv) => {
            const city = (inv.customers as any)?.city || "Unknown";
            cityMap[city] = (cityMap[city] || 0) + (Number(inv.grand_total) || 0);
          });

          const totalCitySales = Object.values(cityMap).reduce((s, c) => s + c, 0) || rev || 1;
          const cities: CitySales[] = Object.entries(cityMap).map(([city, sales]) => ({
            city,
            sales,
            percentage: Number(((sales / totalCitySales) * 100).toFixed(1)),
          })).sort((a, b) => b.sales - a.sales);

          setSalesByCity(cities);
        }

        if (expData) {
          const totalExp = expData.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
          setOperatingExpenses(totalExp);
        }

        if (payData) {
          const totalPay = payData.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
          setTotalCollections(totalPay);
        }
      } catch (err) {
        console.warn("Error fetching reports data:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchReportsData();
  }, [period]);

  // Compute calculated metrics
  const grossProfit = Math.round(revenue * 0.535); // Estimated ~53.5% chemical gross margin
  const grossMarginPct = revenue > 0 ? Number(((grossProfit / revenue) * 100).toFixed(1)) : 53.5;
  const netProfit = Math.max(0, grossProfit - operatingExpenses);
  const netMarginPct = revenue > 0 ? Number(((netProfit / revenue) * 100).toFixed(1)) : 0;
  const totalOutstanding = Math.max(0, revenue - totalCollections);

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
    for (const p of topProducts) {
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
      {/* Mobile "Sales Analyzing" Screen */}
      <div className="md:hidden pt-2 px-1">
        <MobileSalesAnalyzing
          grossProfit={grossProfit}
          netProfit={netProfit}
          grossMarginPct={grossMarginPct}
          netMarginPct={netMarginPct}
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
                className={`px-4 min-h-[44px] flex items-center justify-center text-xs font-light rounded-full transition-all cursor-pointer ${
                  period === "this_month" ? "bg-black text-white font-normal shadow-sm" : "text-neutral-700 hover:text-black"
                }`}
              >
                This Month
              </button>
              <button
                onClick={() => setPeriod("last_month")}
                className={`px-4 min-h-[44px] flex items-center justify-center text-xs font-light rounded-full transition-all cursor-pointer ${
                  period === "last_month" ? "bg-black text-white font-normal shadow-sm" : "text-neutral-700 hover:text-black"
                }`}
              >
                Last Month
              </button>
              <button
                onClick={() => setPeriod("year")}
                className={`px-4 min-h-[44px] flex items-center justify-center text-xs font-light rounded-full transition-all cursor-pointer ${
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

          {/* Financial Summary Cards - 100% Unified Typography matching Orders & Visits */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {/* Card 1: Revenue */}
            <div className="bg-white/55 backdrop-blur-xl border border-white/65 rounded-[24px] p-4 sm:p-5 shadow-none flex flex-col justify-between">
              <span className="text-[11px] sm:text-xs font-light text-neutral-500 block">
                Total invoiced revenue
              </span>
              <div className="text-2xl sm:text-3xl font-semibold text-neutral-900 mt-1 tracking-tight">
                {formatINR(revenue)}
              </div>
              <p className="text-[10px] sm:text-[11px] font-light text-neutral-500 mt-0.5 truncate">
                From finalized bills
              </p>
            </div>

            {/* Card 2: Gross Profit */}
            <div className="bg-white/55 backdrop-blur-xl border border-white/65 rounded-[24px] p-4 sm:p-5 shadow-none flex flex-col justify-between">
              <span className="text-[11px] sm:text-xs font-light text-neutral-500 block">
                Gross profit ({grossMarginPct}%)
              </span>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="w-2 h-2 rounded-full bg-[#D7FF00]" />
                <span className="text-2xl sm:text-3xl font-semibold text-neutral-900 tracking-tight">
                  {formatINR(grossProfit)}
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] font-light text-neutral-500 mt-0.5 truncate">
                Revenue minus batch costs
              </p>
            </div>

            {/* Card 3: Operating Expenses */}
            <div className="bg-white/55 backdrop-blur-xl border border-white/65 rounded-[24px] p-4 sm:p-5 shadow-none flex flex-col justify-between">
              <span className="text-[11px] sm:text-xs font-light text-neutral-500 block">
                Operating expenses
              </span>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="w-2 h-2 rounded-full bg-rose-400" />
                <span className="text-2xl sm:text-3xl font-semibold text-neutral-900 tracking-tight">
                  {formatINR(operatingExpenses)}
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] font-light text-neutral-500 mt-0.5 truncate">
                Logistics, materials, packing
              </p>
            </div>

            {/* Card 4: Net Profit */}
            <div className="bg-white/55 backdrop-blur-xl border border-white/65 rounded-[24px] p-4 sm:p-5 shadow-none flex flex-col justify-between">
              <span className="text-[11px] sm:text-xs font-light text-neutral-500 block">
                Net profit ({netMarginPct}%)
              </span>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-2xl sm:text-3xl font-semibold text-neutral-900 tracking-tight">
                  {formatINR(netProfit)}
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] font-light text-neutral-500 mt-0.5 truncate">
                Gross margin minus expenses
              </p>
            </div>
          </div>

          {/* Product Sales Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-8 bg-white/55 backdrop-blur-xl rounded-[28px] p-6 border border-white/65 shadow-none space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/50">
                <h3 className="text-sm font-normal text-neutral-900">
                  Top selling cleaning product lines
                </h3>
                <span className="text-xs font-light text-neutral-400">Ranked by revenue contribution</span>
              </div>

              <div className="space-y-4">
                {topProducts.map((p) => (
                  <div key={p.name} className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-normal text-neutral-900">{p.name}</span>
                      <div className="flex items-center gap-3">
                        <span className="font-light text-neutral-500">{p.units} units</span>
                        <span className="font-semibold text-neutral-900">{formatINR(p.sales)}</span>
                      </div>
                    </div>
                    {/* Modern pill progress bar */}
                    <div className="h-1.5 w-full bg-black/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-neutral-900 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, Math.max(5, p.share))}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Regional Territory Breakdown */}
            <div className="lg:col-span-4 bg-white/55 backdrop-blur-xl rounded-[28px] p-6 border border-white/65 shadow-none flex flex-col justify-between">
              <div>
                <div className="pb-3 border-b border-white/50">
                  <h3 className="text-sm font-normal text-neutral-900">
                    Sales by territory
                  </h3>
                  <span className="text-xs font-light text-neutral-400">Regional markets</span>
                </div>

                <div className="space-y-4 mt-4">
                  {salesByCity.map((c) => (
                    <div key={c.city} className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-normal text-neutral-900">{c.city}</span>
                        <span className="font-semibold text-neutral-900">{formatINR(c.sales)}</span>
                      </div>
                      <div className="h-1.5 w-full bg-black/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#D7FF00] rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, Math.max(5, c.percentage))}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-white/50 text-[11px] font-light text-neutral-500 flex items-center justify-between">
                <span>Collections: <strong className="font-semibold text-neutral-900">{formatINR(totalCollections)}</strong></span>
                <span>Outstanding: <strong className="font-semibold text-neutral-900">{formatINR(totalOutstanding)}</strong></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
