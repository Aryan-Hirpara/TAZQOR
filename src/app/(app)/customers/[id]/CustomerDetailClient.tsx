"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Phone,
  MessageCircle,
  Mail,
  MapPin,
  ArrowLeft,
  AlertCircle,
  FilePlus,
  ShoppingCart,
  CreditCard,
  CalendarPlus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { TopHeader } from "@/components/layout/TopHeader";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { formatINR } from "@/lib/formatting/currency";
import { getCustomerById, deleteCustomer, Customer } from "@/lib/services/customers";
import { createClient } from "@/lib/supabase/client";

const BUSINESS_ID = "00000000-0000-0000-0000-000000000001";

interface CustomerInvoiceRow {
  id: string;
  invoice_number: string | null;
  invoice_date: string;
  grand_total: number;
  paid: number;
  balance: number;
  status: string;
  mode: string;
}

interface CustomerOrderRow {
  id: string;
  order_number: string;
  order_date: string;
  total_estimated: number;
  status: string;
  itemsCount: number;
}

interface CustomerPaymentRow {
  id: string;
  payment_date: string;
  amount: number;
  method: string;
  reference: string | null;
}

interface CustomerVisitRow {
  id: string;
  visit_date: string;
  outcome: string | null;
  notes: string | null;
  nextDate?: string;
}

export default function CustomerDetailClient({ id }: { id: string }) {
  const router = useRouter();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [invoices, setInvoices] = useState<CustomerInvoiceRow[]>([]);
  const [orders, setOrders] = useState<CustomerOrderRow[]>([]);
  const [payments, setPayments] = useState<CustomerPaymentRow[]>([]);
  const [visits, setVisits] = useState<CustomerVisitRow[]>([]);
  const [activeTab, setActiveTab] = useState<"invoices" | "orders" | "payments" | "visits">("invoices");
  const [loading, setLoading] = useState(true);

  const [archiveOpen, setArchiveOpen] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [archiveError, setArchiveError] = useState<string | null>(null);

  const loadCustomerProfile = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getCustomerById(id);
      setCustomer(data);

      if (!data) return;

      const supabase = createClient();
      const [
        { data: invData },
        { data: outData },
        { data: ordData },
        { data: payData },
        { data: visitData },
        { data: fuData },
      ] = await Promise.all([
        supabase
          .from("invoices")
          .select("id, invoice_number, invoice_date, grand_total, status, mode")
          .eq("business_id", BUSINESS_ID)
          .eq("customer_id", data.id)
          .order("invoice_date", { ascending: false }),
        supabase
          .from("v_invoice_outstanding")
          .select("invoice_id, amount_paid, outstanding")
          .eq("business_id", BUSINESS_ID)
          .eq("customer_id", data.id),
        supabase
          .from("orders")
          .select("id, order_number, created_at, status, order_items(id, quantity, unit_price, discount_percent)")
          .eq("business_id", BUSINESS_ID)
          .eq("customer_id", data.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("payments")
          .select("id, payment_date, amount, method, reference")
          .eq("business_id", BUSINESS_ID)
          .eq("customer_id", data.id)
          .order("payment_date", { ascending: false }),
        supabase
          .from("customer_visits")
          .select("id, visit_date, outcome, notes")
          .eq("business_id", BUSINESS_ID)
          .eq("customer_id", data.id)
          .order("visit_date", { ascending: false }),
        supabase
          .from("follow_ups")
          .select("visit_id, scheduled_for")
          .eq("business_id", BUSINESS_ID)
          .eq("customer_id", data.id),
      ]);

      const outMap = new Map<string, { paid: number; outstanding: number }>();
      for (const r of outData || []) {
        outMap.set(r.invoice_id, {
          paid: Number(r.amount_paid) || 0,
          outstanding: Number(r.outstanding) || 0,
        });
      }

      setInvoices(
        (invData || []).map((inv: any) => {
          const out = outMap.get(inv.id);
          const total = Number(inv.grand_total) || 0;
          return {
            id: inv.id,
            invoice_number: inv.invoice_number,
            invoice_date: inv.invoice_date,
            grand_total: total,
            paid: out ? out.paid : 0,
            balance: inv.status === "cancelled" ? 0 : out ? out.outstanding : total,
            status: inv.status,
            mode: inv.mode || "non_gst",
          };
        })
      );

      setOrders(
        (ordData || []).map((ord: any) => {
          const items = Array.isArray(ord.order_items) ? ord.order_items : [];
          const estTotal = items.reduce((sum: number, item: any) => {
            const qty = Number(item.quantity) || 0;
            const price = Number(item.unit_price) || 0;
            const disc = Number(item.discount_percent) || 0;
            return sum + qty * price * (1 - disc / 100);
          }, 0);
          return {
            id: ord.id,
            order_number: ord.order_number,
            order_date: ord.created_at ? String(ord.created_at).split("T")[0] : "—",
            total_estimated: estTotal,
            status: ord.status,
            itemsCount: items.length,
          };
        })
      );

      setPayments(
        (payData || []).map((p: any) => ({
          id: p.id,
          payment_date: p.payment_date,
          amount: Number(p.amount) || 0,
          method: p.method || "upi",
          reference: p.reference,
        }))
      );

      const fuMap = new Map<string, string>();
      for (const f of fuData || []) {
        if (f.visit_id && f.scheduled_for) {
          fuMap.set(f.visit_id, String(f.scheduled_for).split("T")[0]);
        }
      }

      setVisits(
        (visitData || []).map((v: any) => ({
          id: v.id,
          visit_date: String(v.visit_date || "").split("T")[0],
          outcome: v.outcome,
          notes: v.notes,
          nextDate: fuMap.get(v.id),
        }))
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadCustomerProfile();
  }, [loadCustomerProfile]);

  const handleConfirmArchive = async () => {
    if (!customer) return;
    setArchiving(true);
    setArchiveError(null);
    const res = await deleteCustomer(customer.id);
    if (!res.success) {
      setArchiveError(res.error || "Failed to archive customer");
      setArchiving(false);
      return;
    }
    toast.success(`Customer "${customer.shop_name || customer.name}" archived`);
    router.push("/customers");
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-sm text-gray-500">
        Loading customer record...
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="p-8 max-w-md mx-auto text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold">Customer Not Found</h2>
        <p className="text-xs text-gray-500">
          The customer profile you requested does not exist or has been archived.
        </p>
        <Link href="/customers" className="inline-block px-4 py-2 bg-black text-white text-xs rounded-full">
          Return to Customers
        </Link>
      </div>
    );
  }

  const formattedLocation = [customer.city, customer.state, customer.pin]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="min-h-screen pb-12">
      <TopHeader
        title={customer.name}
        subtitle={`${customer.shop_name}${customer.customer_code ? ` • ${customer.customer_code}` : ""}`}
      />

      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Link
            href="/customers"
            className="inline-flex items-center gap-1.5 min-h-[44px] text-xs font-semibold text-neutral-600 hover:text-black transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to All Customers</span>
          </Link>

          {customer.status !== "archived" && (
            <button
              type="button"
              onClick={() => {
                setArchiveError(null);
                setArchiveOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white border border-rose-200/70 text-xs font-medium transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Archive Customer</span>
            </button>
          )}
        </div>

        {/* Customer Header Card */}
        <div className="bg-white/55 backdrop-blur-xl rounded-[28px] p-6 sm:p-8 border border-white/65 shadow-none space-y-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                {customer.customer_code && (
                  <span className="text-xs font-mono font-normal px-2.5 py-0.5 rounded-full bg-white/70 border border-white/80 text-neutral-700">
                    {customer.customer_code}
                  </span>
                )}
                <span className="text-xs font-normal px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 capitalize">
                  {customer.status}
                </span>
                <span className="text-xs font-normal px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-800 capitalize">
                  {customer.type}
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-semibold text-neutral-900 tracking-tight break-words">
                {customer.name}
              </h2>
              <p className="text-sm font-light text-neutral-500 break-words">
                {customer.shop_name}
                {customer.contact_person ? (
                  <>
                    {" "}• Contact:{" "}
                    <span className="text-neutral-900 font-normal">{customer.contact_person}</span>
                  </>
                ) : null}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {customer.phone && (
                <a
                  href={`tel:${customer.phone.replace(/\s+/g, "")}`}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-black text-white text-xs font-normal hover:scale-105 active:scale-95 transition-all shadow-sm"
                >
                  <Phone className="w-3.5 h-3.5 text-[#E0FE52]" />
                  <span>Call Store</span>
                </a>
              )}

              {(customer.whatsapp || customer.phone) && (
                <a
                  href={`https://wa.me/${(customer.whatsapp || customer.phone || "").replace(/[^0-9]/g, "")}?text=${encodeURIComponent(`Hello ${customer.contact_person || customer.shop_name}!`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-emerald-600 text-white text-xs font-normal hover:bg-emerald-700 hover:scale-105 active:scale-95 transition-all shadow-sm"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-white" />
                  <span>WhatsApp</span>
                </a>
              )}

              {customer.email && (
                <a
                  href={`mailto:${customer.email}?subject=${encodeURIComponent(`Business Order - ${customer.shop_name || customer.name}`)}`}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-white/70 text-neutral-800 text-xs font-light border border-white/80 hover:bg-black hover:text-white transition-all shadow-sm"
                >
                  <Mail className="w-3.5 h-3.5 text-blue-600" />
                  <span>Mail Compose</span>
                </a>
              )}

              {customer.lat && customer.lng && (
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${customer.lat},${customer.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-white/70 text-neutral-800 text-xs font-light border border-white/80 hover:bg-black hover:text-white transition-all shadow-sm"
                >
                  <MapPin className="w-3.5 h-3.5 text-rose-600" />
                  <span>Directions</span>
                </a>
              )}
            </div>
          </div>

          {/* 4 Financial Balances Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 pt-4 border-t border-white/50">
            <div className="bg-white/55 backdrop-blur-xl border border-white/65 rounded-[24px] p-4 sm:p-5 shadow-none">
              <span className="text-[11px] sm:text-xs font-light text-neutral-500 block">
                Total Invoiced
              </span>
              <span className="text-2xl sm:text-3xl font-semibold text-neutral-900 mt-1 block tracking-tight">
                {formatINR(customer.total_invoiced)}
              </span>
            </div>

            <div className="bg-white/55 backdrop-blur-xl border border-white/65 rounded-[24px] p-4 sm:p-5 shadow-none">
              <span className="text-[11px] sm:text-xs font-light text-neutral-500 block">
                Total Paid
              </span>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="w-2 h-2 rounded-full bg-[#D7FF00]" />
                <span className="text-2xl sm:text-3xl font-semibold text-neutral-900 tracking-tight">
                  {formatINR(customer.total_paid)}
                </span>
              </div>
            </div>

            <div className="bg-white/55 backdrop-blur-xl border border-white/65 rounded-[24px] p-4 sm:p-5 shadow-none">
              <span className="text-[11px] sm:text-xs font-light text-neutral-500 block">
                Outstanding Balance
              </span>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="w-2 h-2 rounded-full bg-rose-400" />
                <span className="text-2xl sm:text-3xl font-semibold text-neutral-900 tracking-tight">
                  {formatINR(customer.outstanding)}
                </span>
              </div>
            </div>

            <div className="bg-white/55 backdrop-blur-xl border border-white/65 rounded-[24px] p-4 sm:p-5 shadow-none">
              <span className="text-[11px] sm:text-xs font-light text-neutral-500 block">
                Advance Deposit
              </span>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-2xl sm:text-3xl font-semibold text-neutral-900 tracking-tight">
                  {formatINR(customer.advance)}
                </span>
              </div>
            </div>
          </div>

          {/* Address & Operational Notes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 text-xs text-gray-600">
            <div className="space-y-1">
              <span className="font-bold text-gray-900 block">Delivery Address:</span>
              <p>{customer.delivery_address || customer.billing_address || "No address entered"}</p>
              {formattedLocation && <p>{formattedLocation}</p>}
            </div>
            <div className="space-y-1">
              <span className="font-bold text-gray-900 block">Owner Notes:</span>
              <p className="italic text-gray-500">{customer.notes || "No special instructions recorded."}</p>
            </div>
          </div>

          {/* Quick Transaction Action Strip */}
          <div className="flex flex-wrap items-center gap-2.5 pt-4 border-t border-white/40">
            <Link
              href={`/invoices/new?customerId=${customer.id}`}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-black text-white text-xs font-normal shadow-sm hover:scale-105 active:scale-95 transition-all"
            >
              <FilePlus className="w-3.5 h-3.5 text-[#D4F732]" />
              <span>Create Bill / Invoice</span>
            </Link>

            <Link
              href={`/orders/new?customerId=${customer.id}`}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/70 text-neutral-800 border border-white/80 text-xs font-normal shadow-sm hover:bg-white transition-all"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>New Order</span>
            </Link>

            <Link
              href={`/payments/new?customerId=${customer.id}`}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/70 text-neutral-800 border border-white/80 text-xs font-normal shadow-sm hover:bg-white transition-all"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Record Payment</span>
            </Link>

            <Link
              href={`/visits/new?customerId=${customer.id}`}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/70 text-neutral-800 border border-white/80 text-xs font-normal shadow-sm hover:bg-white transition-all"
            >
              <CalendarPlus className="w-3.5 h-3.5" />
              <span>Record Visit</span>
            </Link>
          </div>
        </div>

        {/* History Tabs */}
        <div className="bg-white/55 backdrop-blur-xl rounded-[28px] p-6 border border-white/65 shadow-none space-y-6">
          <div className="flex items-center gap-2 border-b border-white/40 pb-3 overflow-x-auto no-scrollbar">
            {(["invoices", "orders", "payments", "visits"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-xs font-normal rounded-full capitalize transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === tab
                    ? "bg-black text-white shadow-sm"
                    : "text-neutral-600 hover:text-black hover:bg-white/60"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {activeTab === "invoices" && (
            <div className="divide-y divide-white/40">
              {invoices.length === 0 ? (
                <div className="py-8 text-center text-xs text-neutral-500">
                  No invoices recorded for this customer yet.
                </div>
              ) : (
                invoices.map((inv) => (
                  <Link
                    key={inv.id}
                    href={`/invoices/${inv.id}`}
                    className="py-3.5 flex items-center justify-between hover:bg-white/40 px-2 rounded-xl transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-normal text-neutral-900">
                          {inv.invoice_number || "Draft"}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 font-normal uppercase">
                          {inv.mode}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/80 text-neutral-600 capitalize">
                          {inv.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-500 font-light mt-0.5">Date: {inv.invoice_date}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-normal text-neutral-900 block">
                        {formatINR(inv.grand_total)}
                      </span>
                      {inv.status === "cancelled" ? (
                        <span className="text-[11px] font-medium text-neutral-400">Cancelled</span>
                      ) : inv.status === "draft" ? (
                        <span className="text-[11px] font-medium text-amber-700">Draft</span>
                      ) : inv.balance > 0 ? (
                        <span className="text-[11px] font-medium text-rose-600">
                          Due: {formatINR(inv.balance)}
                        </span>
                      ) : (
                        <span className="text-[11px] font-medium text-emerald-800">Paid</span>
                      )}
                    </div>
                  </Link>
                ))
              )}
            </div>
          )}

          {activeTab === "orders" && (
            <div className="divide-y divide-white/40">
              {orders.length === 0 ? (
                <div className="py-8 text-center text-xs text-neutral-500">
                  No orders recorded for this customer yet.
                </div>
              ) : (
                orders.map((ord) => (
                  <Link
                    key={ord.id}
                    href={`/orders/${ord.id}`}
                    className="py-3.5 flex items-center justify-between hover:bg-white/40 px-2 rounded-xl transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-normal text-neutral-900">{ord.order_number}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/80 border border-white/80 text-neutral-700 font-light capitalize">
                          {ord.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-500 font-light mt-0.5">
                        {ord.itemsCount} Item{ord.itemsCount === 1 ? "" : "s"} • {ord.order_date}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-normal text-neutral-900 block">
                        {formatINR(ord.total_estimated)}
                      </span>
                    </div>
                  </Link>
                ))
              )}
            </div>
          )}

          {activeTab === "payments" && (
            <div className="divide-y divide-white/40">
              {payments.length === 0 ? (
                <div className="py-8 text-center text-xs text-neutral-500">
                  No payments recorded for this customer yet.
                </div>
              ) : (
                payments.map((pay) => (
                  <div key={pay.id} className="py-3.5 flex items-center justify-between px-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-normal text-neutral-900">
                          RCPT-{pay.id.slice(0, 6).toUpperCase()}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-light uppercase">
                          {pay.method.replace("_", " ")}
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-500 font-light mt-0.5">
                        Ref: {pay.reference || "—"} • {pay.payment_date}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-medium text-emerald-800 block">
                        +{formatINR(pay.amount)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === "visits" && (
            <div className="divide-y divide-white/40">
              {visits.length === 0 ? (
                <div className="py-8 text-center text-xs text-neutral-500">
                  No visits logged for this customer yet.
                </div>
              ) : (
                visits.map((v) => (
                  <div key={v.id} className="py-3.5 space-y-1 px-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-normal text-neutral-900">Visit on {v.visit_date}</span>
                      {v.nextDate && (
                        <span className="text-[10px] text-neutral-500 font-light">Next: {v.nextDate}</span>
                      )}
                    </div>
                    <p className="text-xs text-neutral-600 font-light">{v.outcome || v.notes || "Visited store"}</p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={archiveOpen}
        title={`Archive "${customer.shop_name || customer.name}"?`}
        description="Archived customers are hidden from active customer lists and new order/invoice pickers while keeping historical ledger records intact."
        confirmLabel="Archive Customer"
        tone="danger"
        loading={archiving}
        error={archiveError}
        onConfirm={handleConfirmArchive}
        onClose={() => {
          setArchiveOpen(false);
          setArchiveError(null);
        }}
      />
    </div>
  );
}
