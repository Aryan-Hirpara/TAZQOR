"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { TopHeader } from "@/components/layout/TopHeader";
import { StyledSelect } from "@/components/ui/StyledSelect";
import { formatINR } from "@/lib/formatting/currency";
import { getCustomers, Customer } from "@/lib/services/customers";
import { createClient } from "@/lib/supabase/client";

const BUSINESS_ID = "00000000-0000-0000-0000-000000000001";

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
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [customerList, setCustomerList] = useState<Customer[]>([]);

  const [customer, setCustomer] = useState("");
  const [amount, setAmount] = useState<number | "">("");
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [method, setMethod] = useState<"upi" | "cash" | "bank_transfer" | "cheque">("upi");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [invoices, setInvoices] = useState<OpenInvoice[]>([]);

  useEffect(() => {
    async function loadCusts() {
      setLoadingCustomers(true);
      try {
        const custs = await getCustomers({ status: "active" });
        setCustomerList(custs);
        if (custs.length > 0) {
          setCustomer(custs[0].id);
        }
      } catch (e) {
        console.warn("Could not load customers for payments form", e);
      } finally {
        setLoadingCustomers(false);
      }
    }
    loadCusts();
  }, []);

  useEffect(() => {
    async function loadOpenInvoices() {
      if (!customer) {
        setInvoices([]);
        return;
      }
      setLoadingInvoices(true);
      try {
        const supabase = createClient();
        const { data: openData, error: openErr } = await supabase
          .from("v_invoice_outstanding")
          .select("invoice_id, invoice_number, grand_total, outstanding")
          .eq("business_id", BUSINESS_ID)
          .eq("customer_id", customer)
          .gt("outstanding", 0);

        if (openErr) throw openErr;

        const ids = (openData || []).map((r: { invoice_id: string }) => r.invoice_id);
        const dateMap = new Map<string, string>();
        if (ids.length > 0) {
          const { data: invDates } = await supabase
            .from("invoices")
            .select("id, invoice_date")
            .in("id", ids);
          for (const d of invDates || []) {
            dateMap.set(d.id, d.invoice_date || "");
          }
        }

        const list: OpenInvoice[] = (openData || []).map((row: any) => ({
          id: row.invoice_id,
          invoice_number: row.invoice_number || "Draft Invoice",
          date: dateMap.get(row.invoice_id) || "—",
          grand_total: Number(row.grand_total) || 0,
          outstanding: Number(row.outstanding) || 0,
          allocatedAmount: 0,
        }));
        setInvoices(list);
      } catch (e) {
        console.warn("Could not load customer open invoices", e);
        setInvoices([]);
      } finally {
        setLoadingInvoices(false);
      }
    }
    loadOpenInvoices();
  }, [customer]);

  const numericAmount = Number(amount) || 0;
  const totalAllocated = invoices.reduce((acc, inv) => acc + (Number(inv.allocatedAmount) || 0), 0);
  const advanceAmount = Math.max(0, numericAmount - totalAllocated);

  const handleAllocationChange = (idx: number, val: number) => {
    const copy = [...invoices];
    const maxAllowed = copy[idx].outstanding;
    copy[idx].allocatedAmount = Math.max(0, Math.min(maxAllowed, Number(val) || 0));
    setInvoices(copy);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer) {
      toast.error("Please add or select a customer first");
      return;
    }
    if (numericAmount <= 0) {
      toast.error("Payment amount must be greater than zero");
      return;
    }
    if (totalAllocated > numericAmount) {
      toast.error(`Allocations (${formatINR(totalAllocated)}) cannot exceed payment amount (${formatINR(numericAmount)})`);
      return;
    }

    setSubmitting(true);
    try {
      const supabase = createClient();
      const allocationsPayload = invoices
        .filter((inv) => Number(inv.allocatedAmount) > 0)
        .map((inv) => ({
          invoice_id: inv.id,
          amount: Number(inv.allocatedAmount),
        }));

      const { error: payErr } = await supabase.rpc("record_payment", {
        p_business_id: BUSINESS_ID,
        p_customer_id: customer,
        p_amount: numericAmount,
        p_payment_date: paymentDate || new Date().toISOString().split("T")[0],
        p_method: method,
        p_reference: reference.trim() || null,
        p_notes: notes.trim() || null,
        p_idempotency_key: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `pay-${Date.now()}`,
        p_allocations: allocationsPayload,
      });

      if (payErr) throw payErr;

      toast.success(`Payment of ${formatINR(numericAmount)} recorded!`);
      router.push("/payments");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to record payment");
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
              <div className="min-w-0">
                <label className="block text-xs font-normal text-neutral-700 mb-1.5">
                  Customer Account *
                </label>
                <StyledSelect
                  aria-label="Customer Account"
                  value={customer}
                  onChange={(e) => setCustomer(e.target.value)}
                  disabled={loadingCustomers || customerList.length === 0}
                  className="w-full h-11 pl-3.5 text-xs bg-white/70 backdrop-blur-md rounded-xl border border-white/80 font-light text-neutral-800 focus:outline-none focus:ring-2 focus:ring-[#D7FF00]"
                >
                  {loadingCustomers ? (
                    <option value="">Loading customers...</option>
                  ) : customerList.length === 0 ? (
                    <option value="">No active customers found</option>
                  ) : (
                    customerList.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.shop_name} ({formatINR(c.outstanding || 0)} due)
                      </option>
                    ))
                  )}
                </StyledSelect>
                {!loadingCustomers && customerList.length === 0 && (
                  <p className="text-[11px] text-neutral-500 mt-1">
                    <Link href="/customers/new" className="underline text-neutral-900">
                      Add a customer
                    </Link>{" "}
                    before recording a payment.
                  </p>
                )}
              </div>

              <div className="min-w-0">
                <label className="block text-xs font-normal text-neutral-700 mb-1.5">
                  Amount Received (₹) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value === "" ? "" : Number(e.target.value))}
                  placeholder="0.00"
                  required
                  className="w-full h-11 px-4 text-xs font-semibold text-neutral-900 bg-white/70 backdrop-blur-md rounded-xl border border-white/80 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#D7FF00]"
                />
              </div>

              <div className="min-w-0">
                <label className="block text-xs font-normal text-neutral-700 mb-1.5">
                  Payment Date *
                </label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  required
                  className="w-full h-11 px-3 text-xs bg-white/70 backdrop-blur-md rounded-xl border border-white/80 font-light text-neutral-800"
                />
              </div>

              <div className="min-w-0">
                <label className="block text-xs font-normal text-neutral-700 mb-1.5">
                  Payment Method *
                </label>
                <StyledSelect
                  aria-label="Payment Method"
                  value={method}
                  onChange={(e) => setMethod(e.target.value as typeof method)}
                  className="w-full h-11 pl-3.5 text-xs bg-white/70 backdrop-blur-md rounded-xl border border-white/80 font-light text-neutral-800"
                >
                  <option value="upi">UPI</option>
                  <option value="cash">Cash Collection</option>
                  <option value="bank_transfer">Bank Transfer (NEFT / RTGS / IMPS)</option>
                  <option value="cheque">Cheque</option>
                </StyledSelect>
              </div>

              <div className="min-w-0">
                <label className="block text-xs font-normal text-neutral-700 mb-1.5">
                  Transaction Reference / UTR / Cheque #
                </label>
                <input
                  type="text"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="e.g. UTR or cheque number"
                  className="w-full h-11 px-4 text-xs font-mono bg-white/70 backdrop-blur-md rounded-xl border border-white/80"
                />
              </div>

              <div className="min-w-0">
                <label className="block text-xs font-normal text-neutral-700 mb-1.5">
                  Notes
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional payment memo"
                  className="w-full h-11 px-4 text-xs bg-white/70 backdrop-blur-md rounded-xl border border-white/80"
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

            {loadingInvoices ? (
              <div className="py-6 text-center text-xs text-neutral-500">
                Checking open invoices...
              </div>
            ) : invoices.length === 0 ? (
              <div className="py-6 text-center text-xs text-neutral-500 border border-dashed border-black/10 rounded-2xl">
                No unpaid finalized invoices for this customer. The full payment will be stored as an on-account advance.
              </div>
            ) : (
              <div className="space-y-3">
                {invoices.map((inv, idx) => (
                  <div
                    key={inv.id}
                    className="p-4 rounded-2xl bg-white/60 backdrop-blur-md border border-white/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0">
                      <span className="font-mono font-medium text-neutral-900">{inv.invoice_number}</span>
                      <p className="text-[11px] font-light text-neutral-500 mt-0.5">
                        Billed: {inv.date} • Total: {formatINR(inv.grand_total)} • Outstanding: <strong className="text-rose-700 font-medium">{formatINR(inv.outstanding)}</strong>
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-neutral-500 text-[11px] font-light">Apply: ₹</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max={inv.outstanding}
                        value={inv.allocatedAmount || ""}
                        placeholder="0.00"
                        onChange={(e) => handleAllocationChange(idx, Number(e.target.value))}
                        className="w-28 h-9 px-2 text-xs font-semibold bg-white rounded-lg border border-neutral-200 text-right"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Reconciliation Strip */}
            <div className="p-4 rounded-2xl bg-white/60 backdrop-blur-md border border-white/70 text-xs space-y-1">
              <div className="flex justify-between text-neutral-600 font-light">
                <span>Payment Amount:</span>
                <span className="font-semibold text-neutral-900">{formatINR(numericAmount)}</span>
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
                disabled={submitting || !customer}
                className="w-full sm:w-auto px-8 h-12 rounded-full bg-black text-white text-xs sm:text-sm font-normal flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-none disabled:opacity-50 cursor-pointer"
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
