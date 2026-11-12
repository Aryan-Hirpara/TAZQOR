"use client";

import { useState, useEffect } from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { TopHeader } from "@/components/layout/TopHeader";
import { formatINR } from "@/lib/formatting/currency";
import { MobileSalesAnalyzing } from "@/components/dashboard/MobileSalesAnalyzing";
import { createClient } from "@/lib/supabase/client";

const BUSINESS_ID = "00000000-0000-0000-0000-000000000001";

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

function getCurrentFiscalRange() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const startYear = month >= 4 ? year : year - 1;
  const endYear = startYear + 1;
  return {
    startDate: `${startYear}-04-01`,
    endDate: `${endYear}-03-31`,
    label: `FY ${startYear}-${String(endYear).slice(-2)}`,
  };
}

export default function ReportsPage() {
  const [period, setPeriod] = useState<"this_month" | "last_month" | "year">("this_month");
  const [loading, setLoading] = useState(true);

  const [revenue, setRevenue] = useState(0);
  const [totalCogs, setTotalCogs] = useState(0);
  const [operatingExpenses, setOperatingExpenses] = useState(0);
  const [totalCollections, setTotalCollections] = useState(0);
  const [dispatchedCount, setDispatchedCount] = useState(0);
  const [deliveredCount, setDeliveredCount] = useState(0);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [salesByCity, setSalesByCity] = useState<CitySales[]>([]);

  const fyInfo = getCurrentFiscalRange();

  useEffect(() => {
    async function fetchReportsData() {
      try {
        setLoading(true);
        const supabase = createClient();

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
          startDate = fyInfo.startDate;
          endDate = fyInfo.endDate;
        }

        const [{ data: invData }, { data: expData }, { data: payData }, { data: ordData }] = await Promise.all([
          supabase
            .from("invoices")
            .select(
              "id, grand_total, status, invoice_date, created_at, customers(name, city), invoice_items(id, description, quantity, line_total, product_variants(cost_price), invoice_item_batches(quantity_allocated, batches(cost_per_unit)))"
            )
            .eq("business_id", BUSINESS_ID)
            .gte("invoice_date", startDate)
            .lte("invoice_date", endDate)
            .order("created_at", { ascending: false }),
          supabase
            .from("expenses")
            .select("id, amount, expense_date")
            .eq("business_id", BUSINESS_ID)
            .gte("expense_date", startDate)
            .lte("expense_date", endDate),
          supabase
            .from("payments")
            .select("id, amount, payment_date")
            .eq("business_id", BUSINESS_ID)
            .gte("payment_date", startDate)
            .lte("payment_date", endDate),
          supabase
            .from("orders")
            .select("id, status, created_at")
            .eq("business_id", BUSINESS_ID)
            .gte("created_at", `${startDate}T00:00:00.000Z`)
            .lte("created_at", `${endDate}T23:59:59.999Z`),
        ]);

        if (invData) {
          const validInvoices = invData.filter((i: any) => i.status !== "cancelled" && i.status !== "draft");
          const rev = validInvoices.reduce((sum: number, inv: any) => sum + (Number(inv.grand_total) || 0), 0);
          setRevenue(rev);

          let cogsSum = 0;
          const prodMap: Record<string, { units: number; sales: number }> = {};

          validInvoices.forEach((inv: any) => {
            const items = (inv.invoice_items as any[]) || [];
            items.forEach((it) => {
              const name = it.description || "Product";
              const qty = Number(it.quantity) || 0;
              if (!prodMap[name]) {
                prodMap[name] = { units: 0, sales: 0 };
              }
              prodMap[name].units += qty;
              prodMap[name].sales += Number(it.line_total) || 0;

              const batchesAlloc = (it.invoice_item_batches as any[]) || [];
              if (batchesAlloc.length > 0) {
                batchesAlloc.forEach((ba) => {
                  const allocQty = Number(ba.quantity_allocated) || 0;
                  const unitCost = Number(ba.batches?.cost_per_unit) || Number(it.product_variants?.cost_price) || 0;
                  cogsSum += allocQty * unitCost;
                });
              } else {
                const fallbackCost = Number(it.product_variants?.cost_price) || 0;
                cogsSum += qty * fallbackCost;
              }
            });
          });
          setTotalCogs(cogsSum);

          const totalProdSales = Object.values(prodMap).reduce((s, p) => s + p.sales, 0) || rev || 1;
          const prods: TopProduct[] = Object.entries(prodMap)
            .map(([name, data]) => ({
              name,
              sales: data.sales,
              units: data.units,
              share: Number(((data.sales / totalProdSales) * 100).toFixed(1)),
            }))
            .sort((a, b) => b.sales - a.sales);
          setTopProducts(prods);

          const cityMap: Record<string, number> = {};
          validInvoices.forEach((inv: any) => {
            const city = (inv.customers as any)?.city || "Unspecified";
            cityMap[city] = (cityMap[city] || 0) + (Number(inv.grand_total) || 0);
          });

          const totalCitySales = Object.values(cityMap).reduce((s, c) => s + c, 0) || rev || 1;
          const cities: CitySales[] = Object.entries(cityMap)
            .map(([city, sales]) => ({
              city,
              sales,
              percentage: Number(((sales / totalCitySales) * 100).toFixed(1)),
            }))
            .sort((a, b) => b.sales - a.sales);
          setSalesByCity(cities);
        }

        if (expData) {
          const totalExp = expData.reduce((sum: number, e: any) => sum + (Number(e.amount) || 0), 0);
          setOperatingExpenses(totalExp);
        }

        if (payData) {
          const totalPay = payData.reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0);
          setTotalCollections(totalPay);
        }

        if (ordData) {
          setDispatchedCount(ordData.filter((o: any) => o.status === "dispatched").length);
          setDeliveredCount(ordData.filter((o: any) => o.status === "delivered").length);
        }
      } catch (err) {
        console.warn("Error fetching reports data:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchReportsData();
  }, [period, fyInfo.endDate, fyInfo.startDate]);

  const grossProfit = Math.max(0, revenue - totalCogs);
  const grossMarginPct = revenue > 0 ? Number(((grossProfit / revenue) * 100).toFixed(1)) : 0;
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

    let csv = "\uFEFF";
    csv += "Product Name,Units Sold,Total Sales (INR),Revenue Share (%)\r\n";
    for (const p of topProducts) {
      csv += `${sanitize(p.name)},${sanitize(p.units)},${sanitize(p.sales)},${sanitize(p.share)}\r\n`;
    }

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const todayStamp = new Date().toISOString().split("T")[0];
    link.setAttribute("download", `TAZQOR_Sales_Report_${period}_${todayStamp}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("CSV report exported!");
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
          dispatchedCount={dispatchedCount}
          deliveredCount={deliveredCount}
        />
      </div>

      <div className="hidden md:block">
        <TopHeader title="Financial Reports" />

        <div className="space-y-6 pt-2">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="flex items-center gap-1.5 p-1 bg-white/55 backdrop-blur-md rounded-full border border-white/70 shadow-sm">
              <button
                type="button"
                onClick={() => setPeriod("this_month")}
                className={`px-4 min-h-[44px] flex items-center justify-center text-xs font-light rounded-full transition-all cursor-pointer ${
                  period === "this_month" ? "bg-black text-white font-normal shadow-sm" : "text-neutral-700 hover:text-black"
                }`}
              >
                This Month
              </button>
              <button
                type="button"
                onClick={() => setPeriod("last_month")}
                className={`px-4 min-h-[44px] flex items-center justify-center text-xs font-light rounded-full transition-all cursor-pointer ${
                  period === "last_month" ? "bg-black text-white font-normal shadow-sm" : "text-neutral-700 hover:text-black"
                }`}
              >
                Last Month
              </button>
              <button
                type="button"
                onClick={() => setPeriod("year")}
                className={`px-4 min-h-[44px] flex items-center justify-center text-xs font-light rounded-full transition-all cursor-pointer ${
                  period === "year" ? "bg-black text-white font-normal shadow-sm" : "text-neutral-700 hover:text-black"
                }`}
              >
                {fyInfo.label}
              </button>
            </div>

            <button
              type="button"
              onClick={handleExportCSV}
              className="flex items-center justify-center gap-2 h-10 px-5 rounded-full bg-black text-white text-xs sm:text-sm font-normal shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4 text-[#E0FE52]" />
              <span>Export CSV</span>
            </button>
          </div>

          {/* Financial Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white/55 backdrop-blur-xl border border-white/65 rounded-[24px] p-4 sm:p-5 shadow-none flex flex-col justify-between">
              <span className="text-[11px] sm:text-xs font-light text-neutral-500 block">
                Total invoiced revenue
              </span>
              <div className="text-2xl sm:text-3xl font-semibold text-neutral-900 mt-1 tracking-tight">
                {loading ? "—" : formatINR(revenue)}
              </div>
              <p className="text-[10px] sm:text-[11px] font-light text-neutral-500 mt-0.5 truncate">
                From finalized bills
              </p>
            </div>

            <div className="bg-white/55 backdrop-blur-xl border border-white/65 rounded-[24px] p-4 sm:p-5 shadow-none flex flex-col justify-between">
              <span className="text-[11px] sm:text-xs font-light text-neutral-500 block">
                Gross profit ({grossMarginPct}%)
              </span>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="w-2 h-2 rounded-full bg-[#D7FF00]" />
                <span className="text-2xl sm:text-3xl font-semibold text-neutral-900 tracking-tight">
                  {loading ? "—" : formatINR(grossProfit)}
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] font-light text-neutral-500 mt-0.5 truncate">
                Revenue minus batch costs
              </p>
            </div>

            <div className="bg-white/55 backdrop-blur-xl border border-white/65 rounded-[24px] p-4 sm:p-5 shadow-none flex flex-col justify-between">
              <span className="text-[11px] sm:text-xs font-light text-neutral-500 block">
                Operating expenses
              </span>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="w-2 h-2 rounded-full bg-rose-400" />
                <span className="text-2xl sm:text-3xl font-semibold text-neutral-900 tracking-tight">
                  {loading ? "—" : formatINR(operatingExpenses)}
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] font-light text-neutral-500 mt-0.5 truncate">
                Logistics, materials, packing
              </p>
            </div>

            <div className="bg-white/55 backdrop-blur-xl border border-white/65 rounded-[24px] p-4 sm:p-5 shadow-none flex flex-col justify-between">
              <span className="text-[11px] sm:text-xs font-light text-neutral-500 block">
                Net profit ({netMarginPct}%)
              </span>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-2xl sm:text-3xl font-semibold text-neutral-900 tracking-tight">
                  {loading ? "—" : formatINR(netProfit)}
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
                  Top selling product lines
                </h3>
                <span className="text-xs font-light text-neutral-400">Ranked by revenue contribution</span>
              </div>

              {topProducts.length === 0 ? (
                <div className="py-10 text-center text-xs text-neutral-500">
                  No finalized invoice items in this period yet.
                </div>
              ) : (
                <div className="space-y-4">
                  {topProducts.map((p) => (
                    <div key={p.name} className="space-y-2">
                      <div className="flex items-center justify-between text-xs gap-2">
                        <span className="font-normal text-neutral-900 truncate">{p.name}</span>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="font-light text-neutral-500">{p.units} units</span>
                          <span className="font-semibold text-neutral-900">{formatINR(p.sales)}</span>
                        </div>
                      </div>
                      <div className="h-1.5 w-full bg-black/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-neutral-900 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, Math.max(5, p.share))}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Regional Territory Breakdown */}
            <div className="lg:col-span-4 bg-white/55 backdrop-blur-xl rounded-[28px] p-6 border border-white/65 shadow-none flex flex-col justify-between gap-4">
              <div>
                <div className="pb-3 border-b border-white/50">
                  <h3 className="text-sm font-normal text-neutral-900">
                    Sales by territory
                  </h3>
                  <span className="text-xs font-light text-neutral-400">Regional markets</span>
                </div>

                {salesByCity.length === 0 ? (
                  <div className="py-10 text-center text-xs text-neutral-500">
                    No regional sales recorded in this period.
                  </div>
                ) : (
                  <div className="space-y-4 mt-4">
                    {salesByCity.map((c) => (
                      <div key={c.city} className="space-y-2">
                        <div className="flex items-center justify-between text-xs gap-2">
                          <span className="font-normal text-neutral-900 truncate">{c.city}</span>
                          <span className="font-semibold text-neutral-900 shrink-0">{formatINR(c.sales)}</span>
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
                )}
              </div>

              <div className="pt-4 border-t border-white/50 text-[11px] font-light text-neutral-500 flex items-center justify-between gap-2">
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
