"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Wallet,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Calendar,
  CreditCard,
  Building2,
  ChevronRight,
  Receipt,
  Download,
} from "lucide-react";
import { TopHeader } from "@/components/layout/TopHeader";
import { formatINR } from "@/lib/formatting/currency";
import { formatDate } from "@/lib/formatting/dates";
import { createClient } from "@/lib/supabase/client";

interface PaymentRecord {
  id: string;
  customer_name: string;
  amount: number;
  payment_date: string;
  method: 'cash' | 'upi' | 'bank_transfer' | 'cheque';
  reference: string;
  allocated_to: string;
  advance: number;
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedMethod, setSelectedMethod] = useState("all");

  useEffect(() => {
    async function loadPayments() {
      try {
        setLoading(true);
        const supabase = createClient();
        const { data, error } = await supabase
          .from("payments")
          .select("*, customers(name, shop_name)")
          .order("payment_date", { ascending: false });

        if (!error && data) {
          const mapped: PaymentRecord[] = data.map((p: any) => {
            const custName = p.customers?.shop_name || p.customers?.name || "Customer";
            return {
              id: p.id,
              customer_name: custName,
              amount: Number(p.amount) || 0,
              payment_date: p.payment_date || new Date().toISOString().split("T")[0],
              method: (p.method as PaymentRecord["method"]) || "upi",
              reference: p.reference || "RECEIPT-LIVE",
              allocated_to: p.notes || "Against Open Invoices",
              advance: 0,
            };
          });

          setPayments(mapped);
        }
      } catch (e) {
        console.warn("Could not load payments from Supabase", e);
      } finally {
        setLoading(false);
      }
    }
    loadPayments();
  }, []);

  const filteredPayments = payments.filter((p) => {
    const matchSearch =
      p.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      p.id.toLowerCase().includes(search.toLowerCase()) ||
      p.reference.toLowerCase().includes(search.toLowerCase());
    const matchMethod = selectedMethod === "all" || p.method === selectedMethod;
    return matchSearch && matchMethod;
  });

  const totalCollected = payments.reduce((acc, p) => acc + p.amount, 0);

  return (
    <div className="min-h-screen pb-12">
      <TopHeader title="Payment Collections" />

      <div className="space-y-6 pt-2">
        {/* KPI Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <div className="bg-white/55 backdrop-blur-xl border border-white/65 rounded-[24px] p-4 sm:p-5 shadow-none">
            <span className="text-[11px] sm:text-xs font-light text-neutral-500 block">
              Total collections (this month)
            </span>
            <div className="text-2xl sm:text-3xl font-semibold text-neutral-900 mt-1 tracking-tight">
              {formatINR(totalCollected)}
            </div>
            <p className="text-[10px] sm:text-[11px] font-light text-neutral-500 mt-0.5 truncate">Across UPI, Bank Transfer & Cash</p>
          </div>

          <div className="bg-white/55 backdrop-blur-xl border border-white/65 rounded-[24px] p-4 sm:p-5 shadow-none">
            <span className="text-[11px] sm:text-xs font-light text-neutral-500 block">
              Total customer advances
            </span>
            <div className="text-2xl sm:text-3xl font-semibold text-neutral-900 mt-1 tracking-tight">
              ₹1,500.00
            </div>
            <p className="text-[10px] sm:text-[11px] font-light text-neutral-500 mt-0.5 truncate">Unallocated payments held on account</p>
          </div>

          <div className="bg-white/55 backdrop-blur-xl border border-white/65 rounded-[24px] p-4 sm:p-5 shadow-none flex items-center justify-between">
            <div>
              <span className="text-[11px] sm:text-xs font-light text-neutral-500 block">
                Customer ledger
              </span>
              <p className="text-sm font-normal text-neutral-900 mt-0.5">View full account statements</p>
            </div>
            <Link
              href="/customers"
              className="px-4 min-h-[44px] flex items-center justify-center rounded-full bg-white/70 text-neutral-800 text-xs font-light border border-white/80 hover:bg-black hover:text-white transition-all shadow-sm cursor-pointer"
            >
              Ledger
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
                placeholder="Search by receipt #, customer, reference..."
                className="w-full h-10 pl-10 pr-4 text-xs bg-white/65 backdrop-blur-md rounded-full border border-white/70 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#E0FE52] shadow-sm transition-all"
              />
            </div>

            <select
              aria-label="Filter payment method"
              value={selectedMethod}
              onChange={(e) => setSelectedMethod(e.target.value)}
              className="h-11 px-3 text-xs bg-white rounded-full border border-[#E5E4EE] text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-[#D4F732] shadow-sm"
            >
              <option value="all">All Methods</option>
              <option value="upi">UPI</option>
              <option value="bank_transfer">Bank Transfer / NEFT</option>
              <option value="cash">Cash</option>
              <option value="cheque">Cheque</option>
            </select>
          </div>

          <Link
            href="/payments/new"
            className="flex items-center justify-center gap-2 h-11 px-5 rounded-full bg-[#0A0A0A] text-white text-xs sm:text-sm font-bold shadow-md hover:bg-black/90 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4 text-[#D4F732]" />
            <span>Record Payment</span>
          </Link>
        </div>

        {/* Payments Table */}
        <div className="bg-white/55 backdrop-blur-xl rounded-[28px] border border-white/65 overflow-hidden shadow-none">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/40 border-b border-white/60 text-neutral-500 font-normal">
                <tr>
                  <th className="py-4 px-6">Receipt #</th>
                  <th className="py-4 px-4">Customer</th>
                  <th className="py-4 px-4">Date</th>
                  <th className="py-4 px-4">Method & Ref</th>
                  <th className="py-4 px-4 text-right">Amount Received</th>
                  <th className="py-4 px-4">Allocated To</th>
                  <th className="py-4 px-6 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/50">
                {filteredPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-white/40 transition-colors">
                    <td className="py-4 px-6 font-mono font-medium text-neutral-900">
                      {p.id.length > 12 ? `RCPT-${p.id.slice(0, 6).toUpperCase()}` : p.id}
                    </td>

                    <td className="py-4 px-4 font-normal text-neutral-900">
                      {p.customer_name}
                    </td>

                    <td className="py-4 px-4 text-neutral-600 font-light">
                      {formatDate(p.payment_date)}
                    </td>

                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1.5 font-light capitalize text-[11px] text-neutral-800">
                        <CreditCard className="w-3.5 h-3.5 text-neutral-500" />
                        <span>{p.method.replace('_', ' ')}</span>
                      </div>
                      <div className="text-[11px] font-mono text-neutral-500 mt-0.5">{p.reference}</div>
                    </td>

                    <td className="py-4 px-4 text-right font-medium text-sm text-neutral-950">
                      +{formatINR(p.amount)}
                    </td>

                    <td className="py-4 px-4 text-neutral-600 font-light">
                      {p.allocated_to}
                    </td>

                    <td className="py-4 px-6 text-right">
                      <button
                        type="button"
                        onClick={() => window.print()}
                        className="inline-flex items-center justify-center gap-1 px-4 min-h-[44px] rounded-full bg-white/70 text-neutral-800 text-xs font-light hover:bg-black hover:text-white transition-all cursor-pointer border border-white/80"
                      >
                        <Receipt className="w-3.5 h-3.5" />
                        <span>Receipt</span>
                      </button>
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

