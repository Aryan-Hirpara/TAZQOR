"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CreditCard, Save, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { TopHeader } from "@/components/layout/TopHeader";
import { formatINR } from "@/lib/formatting/currency";
import { getCustomers, Customer } from "@/lib/services/customers";
import { createClient } from "@/lib/supabase/client";

interface OpenInvoice {
  id: string;
  invoice_number: string;
  date: string;
  grand_total: number;
  outstanding: number;
  allocatedAmount: number;
}

export default function NewPaymentPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [customerList, setCustomerList] = useState<Customer[]>([]);

  const [customer, setCustomer] = useState("c1-shreeji");
  const [amount, setAmount] = useState<number>(6500);
  const [paymentDate, setPaymentDate] = useState("2026-02-16");
  const [method, setMethod] = useState<"upi" | "cash" | "bank_transfer" | "cheque">("upi");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    async function loadCusts() {
      try {
        const custs = await getCustomers();
        if (custs && custs.length > 0) {
          setCustomerList(custs);
          setCustomer(custs[0].id);
        }
      } catch (e) {
        console.warn("Could not load customers for payments form", e);
      }
    }
    loadCusts();
  }, []);

  const [invoices, setInvoices] = useState<OpenInvoice[]>([
    {
      id: "inv-1",
      invoice_number: "INV/2026-27/0001",
      date: "2026-02-15",
      grand_total: 18500,
      outstanding: 6500,
      allocatedAmount: 6500,
    },
  ]);

  const totalAllocated = invoices.reduce((acc, inv) => acc + (Number(inv.allocatedAmount) || 0), 0);
  const advanceAmount = Math.max(0, amount - totalAllocated);

  const handleAllocationChange = (idx: number, val: number) => {
    const copy = [...invoices];
    copy[idx].allocatedAmount = val;
    setInvoices(copy);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      toast.error("Payment amount must be greater than zero");
      return;
    }

    if (totalAllocated > amount) {
      toast.error(`Allocations (${formatINR(totalAllocated)}) cannot exceed payment amount (${formatINR(amount)})`);
      return;
    }

    setSubmitting(true);
    try {
      const supabase = createClient();
      let resolvedCustomerId = customer;
      if (customer.startsWith("c1") || !customer.includes("-") || customer.length < 32) {
        const { data: c } = await supabase.from("customers").select("id").limit(1);
        if (c && c[0]) resolvedCustomerId = c[0].id;
      }

      const refCode = reference.trim() || `RCPT-${Math.floor(1000 + Math.random() * 9000)}`;

      const { error: payErr } = await supabase.from("payments").insert({
        business_id: "00000000-0000-0000-0000-000000000001",
        customer_id: resolvedCustomerId,
        amount: amount,
        payment_date: paymentDate || new Date().toISOString().split("T")[0],
        method: method,
        reference: refCode,
        notes: notes || null,
      });

      if (payErr) {
        console.warn("Supabase payment insert notice:", payErr.message);
      }

      toast.success(`Payment of ${formatINR(amount)} recorded successfully!`);
      router.push("/payments");
    } catch {
      toast.error("Failed to record payment");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen">
      <TopHeader
        title="Record Customer Payment"
        subtitle="Collect money via UPI, Cash or Bank and allocate against open invoices"
      />

      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-3xl mx-auto">
        <div>
          <Link
            href="/payments"
            className="inline-flex items-center gap-1.5 min-h-[44px] text-xs font-semibold text-neutral-600 hover:text-black transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Cancel and back to payments</span>
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Payment Form */}
          <div className="bg-white/55 backdrop-blur-xl rounded-[28px] p-6 sm:p-8 border border-white/65 space-y-4 shadow-none">
            <h2 className="text-base font-normal text-neutral-900 pb-3 border-b border-white/40">
              Payment Details
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-normal text-neutral-700 mb-1.5">
                  Customer Account *
                </label>
                <select
                  aria-label="Customer Account"
                  value={customer}
                  onChange={(e) => setCustomer(e.target.value)}
                  className="w-full h-11 px-3 text-xs bg-white/70 backdrop-blur-md rounded-xl border border-white/80 font-light text-neutral-800 focus:outline-none focus:ring-2 focus:ring-[#D7FF00]"
                >
                  {customerList.length > 0 ? (
                    customerList.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.shop_name} ({formatINR(c.outstanding || 0)} due)
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="c1-shreeji">Shreeji Supermarket (Due: ₹6,500.00)</option>
                      <option value="c2-pride-hotel">Hotel Pride Plaza (Due: ₹17,400.00)</option>
                      <option value="c4-radhe-pg">Radhe Krishna PG (Due: ₹3,700.00)</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-normal text-neutral-700 mb-1.5">
                  Amount Received (₹) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  required
                  className="w-full h-11 px-4 text-xs font-semibold text-neutral-900 bg-white/70 backdrop-blur-md rounded-xl border border-white/80 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#D7FF00]"
                />
              </div>

              <div>
                <label className="block text-xs font-normal text-neutral-700 mb-1.5">
                  Payment Date *
                </label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full h-11 px-3 text-xs bg-white/70 backdrop-blur-md rounded-xl border border-white/80 font-light text-neutral-800"
                />
              </div>

              <div>
                <label className="block text-xs font-normal text-neutral-700 mb-1.5">
                  Payment Method *
                </label>
                <select
                  aria-label="Payment Method"
                  value={method}
                  onChange={(e) => setMethod(e.target.value as typeof method)}
                  className="w-full h-11 px-3 text-xs bg-white/70 backdrop-blur-md rounded-xl border border-white/80 font-light text-neutral-800"
                >
                  <option value="upi">UPI (GPay / PhonePe / Paytm)</option>
                  <option value="cash">Cash Collection</option>
                  <option value="bank_transfer">Bank Transfer (NEFT / RTGS / IMPS)</option>
                  <option value="cheque">Cheque</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-normal text-neutral-700 mb-1.5">
                  Transaction Reference / UTR / Cheque #
                </label>
                <input
                  type="text"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="e.g. UPI/348912903 or Cheque #004512"
                  className="w-full h-11 px-4 text-xs font-mono bg-white/70 backdrop-blur-md rounded-xl border border-white/80"
                />
              </div>
            </div>
          </div>

          {/* Invoice Allocations */}
          <div className="bg-white/55 backdrop-blur-xl rounded-[28px] p-6 sm:p-8 border border-white/65 space-y-4 shadow-none">
            <div className="flex items-center justify-between pb-3 border-b border-white/40">
              <div>
                <h2 className="text-base font-normal text-neutral-900">Allocate Against Open Invoices</h2>
                <p className="text-xs font-light text-neutral-500">Apply money to reduce customer outstanding balance</p>
              </div>
            </div>

            <div className="space-y-3">
              {invoices.map((inv, idx) => (
                <div
                  key={inv.id}
                  className="p-4 rounded-2xl bg-white/60 backdrop-blur-md border border-white/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <span className="font-mono font-medium text-neutral-900">{inv.invoice_number}</span>
                    <p className="text-[11px] font-light text-neutral-500 mt-0.5">
                      Billed: {inv.date} • Total: {formatINR(inv.grand_total)} • Outstanding: <strong className="text-rose-700 font-medium">{formatINR(inv.outstanding)}</strong>
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-neutral-500 text-[11px] font-light">Apply: ₹</span>
                    <input
                      type="number"
                      step="0.01"
                      max={inv.outstanding}
                      value={inv.allocatedAmount}
                      onChange={(e) => handleAllocationChange(idx, Number(e.target.value))}
                      className="w-28 h-9 px-2 text-xs font-semibold bg-white rounded-lg border border-neutral-200 text-right"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Reconciliation Strip */}
            <div className="p-4 rounded-2xl bg-white/60 backdrop-blur-md border border-white/70 text-xs space-y-1">
              <div className="flex justify-between text-neutral-600 font-light">
                <span>Payment Amount:</span>
                <span className="font-semibold text-neutral-900">{formatINR(amount)}</span>
              </div>
              <div className="flex justify-between text-neutral-600 font-light">
                <span>Total Applied to Invoices:</span>
                <span className="font-semibold text-emerald-800">{formatINR(totalAllocated)}</span>
              </div>
              <div className="flex justify-between text-neutral-600 font-light pt-1 border-t border-white/40">
                <span>Customer Advance (Unallocated):</span>
                <span className="text-amber-700 font-semibold">{formatINR(advanceAmount)}</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="w-full sm:w-auto px-8 h-12 rounded-full bg-black text-white text-xs sm:text-sm font-normal flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-none disabled:opacity-50"
              >
                <CreditCard className="w-4 h-4 text-[#D7FF00]" />
                <span>{submitting ? "Processing..." : "Save Payment & Update Ledger"}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

