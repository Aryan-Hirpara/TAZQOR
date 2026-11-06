"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
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
} from "lucide-react";
import { TopHeader } from "@/components/layout/TopHeader";
import { formatINR } from "@/lib/formatting/currency";
import { getCustomerById, Customer } from "@/lib/services/customers";

export default function CustomerDetailClient({ id }: { id: string }) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [activeTab, setActiveTab] = useState<"invoices" | "orders" | "payments" | "visits">("invoices");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const data = await getCustomerById(id);
      setCustomer(data);
      setLoading(false);
    }
    load();
  }, [id]);

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
        <p className="text-xs text-gray-500">The customer profile you requested does not exist or has been removed.</p>
        <Link href="/customers" className="inline-block px-4 py-2 bg-black text-white text-xs rounded-full">
          Return to Customers
        </Link>
      </div>
    );
  }

  const sampleInvoices = [
    { id: "INV-2026-01", date: "2026-02-15", total: 18500, paid: 12000, balance: 6500, status: "finalized", mode: "gst" },
    { id: "INV-2026-02", date: "2026-01-20", total: 30000, paid: 30000, balance: 0, status: "finalized", mode: "gst" },
  ];

  const sampleOrders = [
    { id: "ORD-1042", date: "2026-02-14", total: 5400, status: "confirmed", itemsCount: 12 },
    { id: "ORD-1015", date: "2026-01-18", total: 30000, status: "delivered", itemsCount: 45 },
  ];

  const samplePayments = [
    { id: "PAY-081", date: "2026-02-16", amount: 12000, method: "UPI", ref: "UPI/348912903" },
    { id: "PAY-042", date: "2026-01-25", amount: 30000, method: "Bank Transfer", ref: "NEFT/ICICI/99812" },
  ];

  const sampleVisits = [
    { id: "V-12", date: "2026-02-10", outcome: "Met owner Haresh Patel. Discussed 5L Citrus Floor cleaner bulk discount.", nextDate: "2026-02-24" },
  ];

  return (
    <div className="min-h-screen">
      <TopHeader
        title={customer.name}
        subtitle={`${customer.shop_name} • ${customer.customer_code}`}
      />

      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
        <div>
          <Link
            href="/customers"
            className="inline-flex items-center gap-1.5 min-h-[44px] text-xs font-semibold text-neutral-600 hover:text-black transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to All Customers</span>
          </Link>
        </div>

        {/* Customer Header Card */}
        <div className="bg-white/55 backdrop-blur-xl rounded-[28px] p-6 sm:p-8 border border-white/65 shadow-none space-y-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-normal px-2.5 py-0.5 rounded-full bg-white/70 border border-white/80 text-neutral-700">
                  {customer.customer_code}
                </span>
                <span className="text-xs font-normal px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 capitalize">
                  {customer.status}
                </span>
                <span className="text-xs font-normal px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-800 capitalize">
                  {customer.type}
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-semibold text-neutral-900 tracking-tight">
                {customer.name}
              </h2>
              <p className="text-sm font-light text-neutral-500">
                {customer.shop_name} • Contact: <span className="text-neutral-900 font-normal">{customer.contact_person}</span>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <a
                href={`tel:${customer.phone.replace(/\s+/g, "")}`}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-black text-white text-xs font-normal hover:scale-105 active:scale-95 transition-all shadow-sm"
              >
                <Phone className="w-3.5 h-3.5 text-[#E0FE52]" />
                <span>Call Store</span>
              </a>

              <a
                href={`https://wa.me/${(customer.whatsapp || customer.phone || "").replace(/[^0-9]/g, "")}?text=${encodeURIComponent(`Hello ${customer.contact_person || customer.shop_name}, greetings from TAZQOR!`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-emerald-600 text-white text-xs font-normal hover:bg-emerald-700 hover:scale-105 active:scale-95 transition-all shadow-sm"
              >
                <MessageCircle className="w-3.5 h-3.5 text-white" />
                <span>WhatsApp</span>
              </a>

              <a
                href={`mailto:${customer.email || "tazqor@gmail.com"}?subject=${encodeURIComponent(`TAZQOR Business Order - ${customer.shop_name || customer.name}`)}`}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-white/70 text-neutral-800 text-xs font-light border border-white/80 hover:bg-black hover:text-white transition-all shadow-sm"
              >
                <Mail className="w-3.5 h-3.5 text-blue-600" />
                <span>Mail Compose</span>
              </a>

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

          {/* 4 Financial Balances Cards - Unified Typography */}
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
              <p>{customer.city}, {customer.state} - {customer.pin}</p>
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
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-xs font-normal rounded-full capitalize transition-all whitespace-nowrap ${
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
              {sampleInvoices.map((inv) => (
                <div key={inv.id} className="py-3.5 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-normal text-neutral-900">{inv.id}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 font-normal uppercase">
                        {inv.mode}
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-500 font-light mt-0.5">Date: {inv.date}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-normal text-neutral-900 block">
                      {formatINR(inv.total)}
                    </span>
                    {inv.balance > 0 ? (
                      <span className="text-[11px] font-medium text-rose-600">
                        Due: {formatINR(inv.balance)}
                      </span>
                    ) : (
                      <span className="text-[11px] font-medium text-emerald-800">Paid</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "orders" && (
            <div className="divide-y divide-white/40">
              {sampleOrders.map((ord) => (
                <div key={ord.id} className="py-3.5 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-normal text-neutral-900">{ord.id}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/80 border border-white/80 text-neutral-700 font-light capitalize">
                        {ord.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-500 font-light mt-0.5">{ord.itemsCount} Items • {ord.date}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-normal text-neutral-900 block">
                      {formatINR(ord.total)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "payments" && (
            <div className="divide-y divide-white/40">
              {samplePayments.map((pay) => (
                <div key={pay.id} className="py-3.5 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-normal text-neutral-900">{pay.id}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-light">
                        {pay.method}
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-500 font-light mt-0.5">Ref: {pay.ref} • {pay.date}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-medium text-emerald-800 block">
                      +{formatINR(pay.amount)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "visits" && (
            <div className="divide-y divide-white/40">
              {sampleVisits.map((v) => (
                <div key={v.id} className="py-3.5 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-normal text-neutral-900">Visit on {v.date}</span>
                    <span className="text-[10px] text-neutral-500 font-light">Next: {v.nextDate}</span>
                  </div>
                  <p className="text-xs text-neutral-600 font-light">{v.outcome}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

