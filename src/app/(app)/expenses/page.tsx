"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Plus, Search } from "lucide-react";
import { TopHeader } from "@/components/layout/TopHeader";
import { StyledSelect } from "@/components/ui/StyledSelect";
import { formatINR } from "@/lib/formatting/currency";

const BUSINESS_ID = "00000000-0000-0000-0000-000000000001";

interface ExpenseItem {
  id: string;
  date: string;
  category: string;
  vendor: string;
  description: string;
  amount: number;
  payment_method: string;
}

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  useEffect(() => {
    async function loadExpenses() {
      try {
        setLoading(true);
        const supabase = createClient();
        const [{ data, error }, { data: catData }] = await Promise.all([
          supabase
            .from("expenses")
            .select("*, expense_categories(name)")
            .eq("business_id", BUSINESS_ID)
            .order("expense_date", { ascending: false }),
          supabase
            .from("expense_categories")
            .select("id, name")
            .or(`business_id.is.null,business_id.eq.${BUSINESS_ID}`)
            .order("name", { ascending: true }),
        ]);

        if (catData) {
          setCategories(Array.from(new Set(catData.map((c: { name: string }) => c.name))));
        }

        if (!error && data) {
          const list: ExpenseItem[] = data.map((d: any) => ({
            id: d.id,
            date: d.expense_date,
            category: d.expense_categories?.name || "Uncategorised",
            vendor: d.vendor || "—",
            description: d.description || "Business Expense",
            amount: Number(d.amount) || 0,
            payment_method: d.payment_method || "—",
          }));
          setExpenses(list);
        }
      } catch (err) {
        console.warn("Supabase expenses query error:", err);
      } finally {
        setLoading(false);
      }
    }
    loadExpenses();
  }, []);

  const filteredExpenses = expenses.filter((e) => {
    const matchSearch =
      e.description.toLowerCase().includes(search.toLowerCase()) ||
      e.vendor.toLowerCase().includes(search.toLowerCase());
    const matchCat = selectedCategory === "all" || e.category === selectedCategory;
    return matchSearch && matchCat;
  });

  const now = new Date();
  const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const monthlyExpenses = expenses.filter((e) => e.date?.startsWith(monthPrefix));
  const totalMonthlyExpense = monthlyExpenses.reduce((acc, e) => acc + e.amount, 0);

  const categoryTotals = monthlyExpenses.reduce((acc, exp) => {
    acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
    return acc;
  }, {} as Record<string, number>);

  const largestCat = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0] || [
    "No expenses yet",
    0,
  ];

  const categoryOptions = Array.from(
    new Set([...categories, ...expenses.map((e) => e.category).filter(Boolean)])
  );

  return (
    <div className="min-h-screen pb-12">
      <TopHeader title="Business Expenses" />

      <div className="space-y-6 pt-2">
        {/* KPI Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <div className="bg-white/55 backdrop-blur-xl border border-white/65 rounded-[24px] p-4 sm:p-5 shadow-none">
            <span className="text-[11px] sm:text-xs font-light text-neutral-500 block">
              Total expenses (this month)
            </span>
            <div className="text-2xl sm:text-3xl font-semibold text-neutral-900 mt-1 tracking-tight">
              {formatINR(totalMonthlyExpense)}
            </div>
            <p className="text-[10px] sm:text-[11px] font-light text-neutral-500 mt-0.5 truncate">Deducted from gross margin for net profit</p>
          </div>

          <div className="bg-white/55 backdrop-blur-xl border border-white/65 rounded-[24px] p-4 sm:p-5 shadow-none">
            <span className="text-[11px] sm:text-xs font-light text-neutral-500 block">
              Largest expense category
            </span>
            <div className="text-2xl sm:text-3xl font-semibold text-neutral-900 mt-1 tracking-tight truncate">
              {largestCat[0]}
            </div>
            <p className="text-[10px] sm:text-[11px] font-light text-neutral-500 mt-0.5 truncate">
              {formatINR(largestCat[1])} spent this month
            </p>
          </div>

          <div className="bg-white/55 backdrop-blur-xl border border-white/65 rounded-[24px] p-4 sm:p-5 shadow-none flex items-center justify-between gap-2">
            <div className="min-w-0">
              <span className="text-[11px] sm:text-xs font-light text-neutral-500 block">
                Logged records
              </span>
              <p className="text-sm font-normal text-neutral-900 mt-0.5">{expenses.length} Expense Bills</p>
            </div>
            <Link
              href="/expenses/new"
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-black text-white text-xs font-normal shadow-md hover:scale-105 active:scale-95 transition-all shrink-0"
            >
              <Plus className="w-3.5 h-3.5 text-[#E0FE52]" />
              <span>Add Expense</span>
            </Link>
          </div>
        </div>

        {/* Action & Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="flex flex-1 items-center gap-2 max-w-lg min-w-0">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search vendor or description..."
                className="w-full h-11 pl-10 pr-4 text-xs bg-white/60 backdrop-blur-md rounded-full border border-white/70 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#D4F732] shadow-sm transition-all"
              />
            </div>

            <StyledSelect
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              aria-label="Filter expenses by category"
              wrapperClassName="min-w-[150px]"
              className="h-11 pl-4 text-xs bg-white/60 backdrop-blur-md rounded-full border border-white/70 text-neutral-700 font-light focus:outline-none focus:ring-2 focus:ring-[#D4F732] shadow-sm"
            >
              <option value="all">All Categories</option>
              {categoryOptions.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </StyledSelect>
          </div>

          <Link
            href="/expenses/new"
            className="flex items-center justify-center gap-2 h-11 px-5 rounded-full bg-black text-white text-xs sm:text-sm font-normal shadow-sm hover:scale-105 active:scale-95 transition-all shrink-0"
          >
            <Plus className="w-4 h-4 text-[#E0FE52]" />
            <span>Add Expense</span>
          </Link>
        </div>

        {/* Expenses Table */}
        <div className="bg-white/55 backdrop-blur-xl rounded-[28px] border border-white/65 overflow-hidden shadow-none">
          <div className="table-wrapper" tabIndex={0} role="region" aria-label="Expenses table container">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/40 border-b border-white/60 text-neutral-500 font-normal">
                <tr>
                  <th className="py-4 px-6 font-normal">Date</th>
                  <th className="py-4 px-4 font-normal">Category</th>
                  <th className="py-4 px-4 font-normal">Vendor</th>
                  <th className="py-4 px-4 font-normal">Description</th>
                  <th className="py-4 px-4 font-normal">Payment Method</th>
                  <th className="py-4 px-6 text-right font-normal">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/40">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-xs text-neutral-500">
                      Loading expenses...
                    </td>
                  </tr>
                ) : filteredExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-xs text-neutral-500">
                      No expenses recorded yet.
                    </td>
                  </tr>
                ) : (
                  filteredExpenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-white/40 transition-colors">
                      <td className="py-4 px-6 font-normal text-neutral-600">{exp.date}</td>
                      <td className="py-4 px-4">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-normal bg-white/80 border border-white/80 text-neutral-800">
                          {exp.category}
                        </span>
                      </td>
                      <td className="py-4 px-4 font-normal text-neutral-900">{exp.vendor}</td>
                      <td className="py-4 px-4 text-neutral-600 font-light max-w-sm">{exp.description}</td>
                      <td className="py-4 px-4 text-neutral-600 font-light">{exp.payment_method}</td>
                      <td className="py-4 px-6 text-right font-medium text-rose-600 text-sm">
                        {formatINR(exp.amount)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
