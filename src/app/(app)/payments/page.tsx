"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Wallet,
  Plus,
  Search,
  CheckCircle2,
  Calendar,
  CreditCard,
  Building2,
  ChevronRight,
  Receipt,
  Download,
  X,
} from "lucide-react";
import { TopHeader } from "@/components/layout/TopHeader";
import { StyledSelect } from "@/components/ui/StyledSelect";
import { formatINR } from "@/lib/formatting/currency";
import { formatDate } from "@/lib/formatting/dates";
import { createClient } from "@/lib/supabase/client";

const BUSINESS_ID = "00000000-0000-0000-0000-000000000001";

interface PaymentRecord {
  id: string;
  customer_name: string;
  amount: number;
  payment_date: string;
  method: "cash" | "upi" | "bank_transfer" | "cheque" | "other";
  reference: string;
  allocated_to: string;
  advance: number;
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [totalAdvances, setTotalAdvances] = useState(0);
  const [businessName, setBusinessName] = useState("");
  const [businessEmail, setBusinessEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedMethod, setSelectedMethod] = useState("all");
  const [printPayment, setPrintPayment] = useState<PaymentRecord | null>(null);

  useEffect(() => {
    async function loadPayments() {
      try {
        setLoading(true);
        const supabase = createClient();
        const [{ data, error }, { data: balData }, { data: settingsData }] = await Promise.all([
          supabase
            .from("payments")
            .select("*, customers(name, shop_name), payment_allocations(amount_allocated, invoices(invoice_number))")
            .eq("business_id", BUSINESS_ID)
            .order("payment_date", { ascending: false }),
          supabase
            .from("v_customer_balances")
            .select("advance")
            .eq("business_id", BUSINESS_ID),
          supabase
            .from("business_settings")
            .select("legal_name, email")
            .eq("business_id", BUSINESS_ID)
            .maybeSingle(),
        ]);

        if (balData) {
          const advSum = balData.reduce((sum: number, row: { advance?: number }) => sum + (Number(row.advance) || 0), 0);
          setTotalAdvances(advSum);
        }

        if (settingsData) {
          setBusinessName(settingsData.legal_name || "");
          setBusinessEmail(settingsData.email || "");
        }

        if (!error && data) {
          const mapped: PaymentRecord[] = data.map((p: any) => {
            const custName = p.customers?.shop_name || p.customers?.name || "Customer";
            const allocs = (p.payment_allocations || []) as Array<{ amount_allocated: number; invoices?: { invoice_number?: string } }>;
            const allocLabels = allocs
              .map((a) => a.invoices?.invoice_number)
              .filter(Boolean);
            const allocatedTotal = allocs.reduce((s, a) => s + (Number(a.amount_allocated) || 0), 0);
            const amt = Number(p.amount) || 0;
            const adv = Math.max(0, amt - allocatedTotal);
            return {
              id: p.id,
              customer_name: custName,
              amount: amt,
              payment_date: p.payment_date || new Date().toISOString().split("T")[0],
              method: (p.method as PaymentRecord["method"]) || "upi",
              reference: p.reference || "—",
              allocated_to:
                allocLabels.length > 0
                  ? allocLabels.join(", ")
                  : adv > 0
                  ? p.notes || "On-account advance"
                  : p.notes || "Unallocated",
              advance: adv,
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

  const now = new Date();
  const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const totalCollected = payments
    .filter((p) => p.payment_date.startsWith(monthPrefix))
    .reduce((acc, p) => acc + p.amount, 0);

  const handlePrintReceipt = (p: PaymentRecord) => {
    setPrintPayment(p);
    setTimeout(() => {
      const printArea = document.getElementById("receipt-print-area");
      if (!printArea) return;
      const html = printArea.innerHTML;
      const win = window.open("", "_blank", "width=400,height=600");
      if (!win) return;
      win.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Receipt</title>
            <style>
              * { margin:0; padding:0; box-sizing:border-box; font-family: sans-serif; }
              body { padding: 24px; color: #111; }
              .r-header { text-align:center; border-bottom:2px solid #111; padding-bottom:12px; margin-bottom:16px; }
              .r-header h1 { font-size:20px; font-weight:700; letter-spacing:2px; }
              .r-header p { font-size:11px; color:#666; margin-top:4px; }
              .r-row { display:flex; justify-content:space-between; margin:8px 0; font-size:13px; }
              .r-row span:first-child { color:#555; }
              .r-row span:last-child { font-weight:600; }
              .r-amount { text-align:center; border:2px solid #111; border-radius:8px; padding:12px; margin:16px 0; }
              .r-amount .label { font-size:11px; color:#555; margin-bottom:4px; }
              .r-amount .value { font-size:28px; font-weight:700; }
              .r-footer { text-align:center; margin-top:20px; padding-top:12px; border-top:1px dashed #aaa; font-size:10px; color:#888; }
              @media print { body { padding:12px; } }
            </style>
          </head>
          <body>${html}</body>
        </html>
      `);
      win.document.close();
      win.focus();
      win.print();
      win.close();
      setPrintPayment(null);
    }, 100);
  };

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
              {formatINR(totalAdvances)}
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
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="flex flex-col sm:flex-row flex-1 items-stretch sm:items-center gap-2.5 max-w-2xl min-w-0">
            <div className="relative flex-1 min-w-0 sm:min-w-[200px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 z-10 pointer-events-none" />
              <input
                type="search"
                aria-label="Search payments by receipt, customer, or reference"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by receipt #, customer, reference..."
                className="w-full h-10 pl-10 pr-4 text-xs bg-white/65 backdrop-blur-md rounded-full border border-white/70 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#E0FE52] shadow-sm transition-all"
              />
            </div>

            <StyledSelect
              aria-label="Filter payment method"
              value={selectedMethod}
              onChange={(e) => setSelectedMethod(e.target.value)}
              wrapperClassName="w-full sm:w-48 shrink-0"
              className="h-10 py-0 pl-4 text-xs bg-white/65 backdrop-blur-md rounded-full border border-white/70 text-neutral-700 font-light focus:outline-none focus:ring-2 focus:ring-[#E0FE52] shadow-sm"
            >
              <option value="all">All Methods</option>
              <option value="upi">UPI</option>
              <option value="bank_transfer">Bank Transfer / NEFT</option>
              <option value="cash">Cash</option>
              <option value="cheque">Cheque</option>
            </StyledSelect>
          </div>

          <Link
            href="/payments/new"
            className="flex items-center justify-center gap-2 h-10 px-5 rounded-full bg-black text-white text-xs sm:text-sm font-normal shadow-sm hover:scale-105 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4 text-[#E0FE52]" />
            <span>Record Payment</span>
          </Link>
        </div>

        {/* Payments Table */}
        <div className="bg-white/55 backdrop-blur-xl rounded-[28px] border border-white/65 overflow-hidden shadow-none">
          <div className="table-wrapper">
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
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-xs text-neutral-500">
                      Loading payments...
                    </td>
                  </tr>
                ) : filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-xs text-neutral-500">
                      No payments recorded yet.
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map((p) => (
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
                        onClick={() => handlePrintReceipt(p)}
                        className="inline-flex items-center justify-center gap-1 px-4 min-h-[44px] rounded-full bg-white/70 text-neutral-800 text-xs font-light hover:bg-black hover:text-white transition-all cursor-pointer border border-white/80"
                      >
                        <Receipt className="w-3.5 h-3.5" />
                        <span>Receipt</span>
                      </button>
                    </td>
                  </tr>
                ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Hidden receipt print area — rendered off-screen, content extracted by handlePrintReceipt */}
      {printPayment && (
        <div id="receipt-print-area" style={{ position: "absolute", left: "-9999px", top: 0 }}>
          <div className="r-header">
            <h1>{businessName || "TAZQOR"}</h1>
            <p>Payment Receipt</p>
          </div>
          <div className="r-amount">
            <div className="label">Amount Received</div>
            <div className="value">₹{printPayment.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</div>
          </div>
          <div className="r-row"><span>Customer</span><span>{printPayment.customer_name}</span></div>
          <div className="r-row"><span>Receipt #</span><span>{printPayment.id.length > 12 ? `RCPT-${printPayment.id.slice(0, 6).toUpperCase()}` : printPayment.id}</span></div>
          <div className="r-row"><span>Date</span><span>{printPayment.payment_date}</span></div>
          <div className="r-row"><span>Method</span><span>{printPayment.method.replace("_", " ").toUpperCase()}</span></div>
          <div className="r-row"><span>Reference</span><span>{printPayment.reference}</span></div>
          <div className="r-row"><span>Allocated To</span><span>{printPayment.allocated_to}</span></div>
          <div className="r-footer">
            <p>Thank you for your payment!</p>
            {(businessName || businessEmail) && (
              <p>{[businessName, businessEmail].filter(Boolean).join(" — ")}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

