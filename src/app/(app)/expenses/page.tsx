"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  Receipt,
  Plus,
  Search,
  Filter,
  CreditCard,
  Building2,
  Calendar,
  Tag,
  Download,
} from "lucide-react";
import { TopHeader } from "@/components/layout/TopHeader";
import { formatINR } from "@/lib/formatting/currency";

interface ExpenseItem {
  id: string;
  date: string;
  category: string;
  vendor: string;
  description: string;
  amount: number;
  payment_method: string;
}

const DEMO_EXPENSES: ExpenseItem[] = [
  {
    id: "exp-1",
    date: "2026-02-14",
    category: "Raw Materials",
    vendor: "Gujarat Chemical Corp",
    description: "Pine oil, surfactants and citrus fragrance concentrate for batch production",
    amount: 34500.00,
    payment_method: "Bank Transfer",
  },
  {
    id: "exp-2",
    date: "2026-02-12",
    category: "Packaging",
    vendor: "PlastoPack Industries",
    description: "500x 5-Litre HDPE blow-moulded cans with anti-leak caps",
    amount: 14200.00,
    payment_method: "UPI",
  },
  {
    id: "exp-3",
    date: "2026-02-10",
    category: "Transport & Fuel",
    vendor: "Indian Oil Petrol Pump",
    description: "Diesel fuel for delivery van route (Ahmedabad & Gandhinagar)",
    amount: 4800.00,
    payment_method: "Cash",
  },
  {
    id: "exp-4",
    date: "2026-02-05",
    category: "Rent & Maintenance",
    vendor: "GIDC Industrial Estate",
    description: "Warehouse unit monthly rent & maintenance",
    amount: 22000.00,
    payment_method: "Bank Transfer",
  },
];

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<ExpenseItem[]>(DEMO_EXPENSES);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  useEffect(() => {
    async function loadExpenses() {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("expenses")
          .select("*")
          .order("expense_date", { ascending: false });

        if (!error && data && data.length > 0) {
          const list: ExpenseItem[] = data.map((d: any) => ({
            id: d.id,
            date: d.expense_date,
            category: "Operational",
            vendor: d.vendor || "Supplier",
            description: d.description || "Business Expense",
            amount: Number(d.amount) || 0,
            payment_method: d.payment_method || "Bank Transfer",
          }));
          setExpenses(list);
        }
      } catch (err) {
        console.warn("Supabase expenses fallback:", err);
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

  const totalExpenseAmount = expenses.reduce((acc, e) => acc + e.amount, 0);

  return (
    <div className="min-h-screen pb-12">
      <TopHeader title="Business Expenses" />

      <div className="space-y-6 pt-2">
        {/* KPI Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="bg-white/55 backdrop-blur-xl border border-white/65 rounded-[24px] p-6 shadow-sm">
            <span className="text-xs font-light text-neutral-500 block">
              Total expenses (this month)
            </span>
            <div className="text-3xl font-normal text-rose-600 mt-1 tracking-tight">
              {formatINR(totalExpenseAmount)}
            </div>
            <p className="text-[11px] font-light text-neutral-500 mt-0.5">Deducted from gross margin for net profit</p>
          </div>

          <div className="bg-white/55 backdrop-blur-xl border border-white/65 rounded-[24px] p-6 shadow-sm">
            <span className="text-xs font-light text-neutral-500 block">
              Largest expense category
            </span>
            <div className="text-3xl font-normal text-neutral-900 mt-1 tracking-tight">
              Raw Materials
            </div>
            <p className="text-[11px] font-light text-neutral-500 mt-0.5">₹34,500.00 spent this month</p>
          </div>

          <div className="bg-white/55 backdrop-blur-xl border border-white/65 rounded-[24px] p-6 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-light text-neutral-500 block">
                Logged records
              </span>
              <p className="text-sm font-normal text-neutral-900 mt-0.5">{expenses.length} Expense Bills</p>
            </div>
            <Link
              href="/expenses/new"
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-black text-white text-xs font-normal shadow-md hover:scale-105 active:scale-95 transition-all"
            >
              <Plus className="w-3.5 h-3.5 text-[#E0FE52]" />
              <span>Add Expense</span>
            </Link>
          </div>
        </div>

        {/* Action & Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="flex flex-1 items-center gap-2 max-w-lg">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search vendor or description..."
                className="w-full h-11 pl-10 pr-4 text-xs bg-white rounded-full border border-[#E5E4EE] text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#D4F732] shadow-sm transition-all"
              />
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              aria-label="Filter expenses by category"
              className="h-11 px-3 text-xs bg-white rounded-full border border-[#E5E4EE] text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-[#D4F732] shadow-sm"
            >
              <option value="all">All Categories</option>
              <option value="Raw Materials">Raw Materials</option>
              <option value="Packaging">Packaging</option>
              <option value="Transport & Fuel">Transport & Fuel</option>
              <option value="Rent & Maintenance">Rent & Maintenance</option>
            </select>
          </div>

          <Link
            href="/expenses/new"
            className="flex items-center justify-center gap-2 h-11 px-5 rounded-full bg-[#0A0A0A] text-white text-xs sm:text-sm font-bold shadow-md hover:bg-black/90 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4 text-[#D4F732]" />
            <span>Add Expense</span>
          </Link>
        </div>

        {/* Expenses Table */}
        <div className="bg-white rounded-3xl border border-[#E5E4EE] overflow-hidden shadow-sm">
          <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Expenses table container">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F9F8FD] border-b border-[#E5E4EE] text-gray-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-4 px-6">Date</th>
                  <th className="py-4 px-4">Category</th>
                  <th className="py-4 px-4">Vendor</th>
                  <th className="py-4 px-4">Description</th>
                  <th className="py-4 px-4">Payment Method</th>
                  <th className="py-4 px-6 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E4EE]">
                {filteredExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-[#F9F8FD]/60">
                    <td className="py-4 px-6 font-mono text-gray-500">{exp.date}</td>
                    <td className="py-4 px-4">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-gray-100 text-gray-800">
                        {exp.category}
                      </span>
                    </td>
                    <td className="py-4 px-4 font-bold text-gray-900">{exp.vendor}</td>
                    <td className="py-4 px-4 text-gray-600 max-w-sm">{exp.description}</td>
                    <td className="py-4 px-4 text-gray-600 font-medium">{exp.payment_method}</td>
                    <td className="py-4 px-6 text-right font-black text-rose-600 text-sm">
                      {formatINR(exp.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

