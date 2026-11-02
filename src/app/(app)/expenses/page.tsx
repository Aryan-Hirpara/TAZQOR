"use client";

import { useState } from "react";
import Link from "next/link";
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

  const filteredExpenses = expenses.filter((e) => {
    const matchSearch =
      e.description.toLowerCase().includes(search.toLowerCase()) ||
      e.vendor.toLowerCase().includes(search.toLowerCase());
    const matchCat = selectedCategory === "all" || e.category === selectedCategory;
    return matchSearch && matchCat;
  });

  const totalExpenseAmount = expenses.reduce((acc, e) => acc + e.amount, 0);

  return (
    <div className="min-h-screen">
      <TopHeader
        title="Business Expenses"
        subtitle="Track operating expenditures, raw materials, packaging and logistics"
      />

      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
        {/* KPI Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-3xl p-5 border border-[#E5E4EE] shadow-sm">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
              Total Expenses (This Month)
            </span>
            <div className="text-2xl font-black text-rose-600 mt-1">
              {formatINR(totalExpenseAmount)}
            </div>
            <p className="text-[11px] text-gray-400 mt-0.5">Deducted from gross margin for net profit</p>
          </div>

          <div className="bg-white rounded-3xl p-5 border border-[#E5E4EE] shadow-sm">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
              Largest Expense Category
            </span>
            <div className="text-2xl font-black text-gray-900 mt-1">
              Raw Materials
            </div>
            <p className="text-[11px] text-gray-400 mt-0.5">₹ 34,500.00 spent this month</p>
          </div>

          <div className="bg-white rounded-3xl p-5 border border-[#E5E4EE] shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
                Logged Records
              </span>
              <p className="text-sm font-extrabold text-gray-900 mt-1">{expenses.length} Expense Bills</p>
            </div>
            <Link
              href="/expenses/new"
              className="px-4 py-2 rounded-full bg-[#0A0A0A] text-white text-xs font-bold shadow-sm"
            >
              Add Expense
            </Link>
          </div>
        </div>

        {/* Action & Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="flex flex-1 items-center gap-2 max-w-lg">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
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
          <div className="overflow-x-auto">
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
