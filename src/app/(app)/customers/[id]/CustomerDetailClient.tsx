"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Phone,
  MessageCircle,
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
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-black transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to All Customers</span>
          </Link>
        </div>

        {/* Customer Header Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E5E4EE] shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-700">
                  {customer.customer_code}
                </span>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 capitalize">
                  {customer.status}
                </span>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 capitalize">
                  {customer.type}
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0A0A0A] tracking-tight">
                {customer.name}
              </h2>
              <p className="text-sm font-medium text-gray-500">
                {customer.shop_name} • Contact: <span className="text-black font-semibold">{customer.contact_person}</span>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <a
                href={`tel:${customer.phone.replace(/\s+/g, "")}`}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-gray-100 text-gray-800 text-xs font-bold hover:bg-gray-200 transition-all"
              >
                <Phone className="w-3.5 h-3.5 text-blue-600" />
                <span>Call</span>
              </a>

              {customer.whatsapp && (
                <a
                  href={`https://wa.me/${customer.whatsapp.replace(/[^0-9]/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold hover:bg-emerald-100 border border-emerald-200 transition-all"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                  <span>WhatsApp</span>
                </a>
              )}

              {customer.lat && customer.lng && (
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${customer.lat},${customer.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-blue-50 text-blue-800 text-xs font-bold hover:bg-blue-100 border border-blue-200 transition-all"
                >
                  <MapPin className="w-3.5 h-3.5 text-blue-600" />
                  <span>Directions</span>
                </a>
              )}
            </div>
          </div>

          {/* 4 Financial Balances Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-gray-100">
            <div className="p-4 rounded-2xl bg-[#F9F8FD] border border-[#E5E4EE]">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
                Total Invoiced
              </span>
              <span className="text-lg sm:text-xl font-black text-gray-900 mt-1 block">
                {formatINR(customer.total_invoiced)}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100">
              <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">
                Total Paid
              </span>
              <span className="text-lg sm:text-xl font-black text-emerald-800 mt-1 block">
                {formatINR(customer.total_paid)}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-100">
              <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider block">
                Outstanding Balance
              </span>
              <span className="text-lg sm:text-xl font-black text-rose-800 mt-1 block">
                {formatINR(customer.outstanding)}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-100">
              <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider block">
                Advance Deposit
              </span>
              <span className="text-lg sm:text-xl font-black text-amber-800 mt-1 block">
                {formatINR(customer.advance)}
              </span>
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
          <div className="flex flex-wrap items-center gap-2.5 pt-4 border-t border-gray-100">
            <Link
              href={`/invoices/new?customerId=${customer.id}`}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#0A0A0A] text-white text-xs font-bold shadow-sm hover:bg-black/80 transition-all"
            >
              <FilePlus className="w-3.5 h-3.5 text-[#D4F732]" />
              <span>Create Bill / Invoice</span>
            </Link>

            <Link
              href={`/orders/new?customerId=${customer.id}`}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white text-gray-900 border border-[#E5E4EE] text-xs font-bold shadow-sm hover:border-black transition-all"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>New Order</span>
            </Link>

            <Link
              href={`/payments/new?customerId=${customer.id}`}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white text-gray-900 border border-[#E5E4EE] text-xs font-bold shadow-sm hover:border-black transition-all"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Record Payment</span>
            </Link>

            <Link
              href={`/visits/new?customerId=${customer.id}`}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white text-gray-900 border border-[#E5E4EE] text-xs font-bold shadow-sm hover:border-black transition-all"
            >
              <CalendarPlus className="w-3.5 h-3.5" />
              <span>Record Visit</span>
            </Link>
          </div>
        </div>

        {/* History Tabs */}
        <div className="bg-white rounded-3xl p-6 border border-[#E5E4EE] shadow-sm space-y-6">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-3 overflow-x-auto no-scrollbar">
            {(["invoices", "orders", "payments", "visits"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-xs font-bold rounded-full capitalize transition-all whitespace-nowrap ${
                  activeTab === tab
                    ? "bg-[#0A0A0A] text-white"
                    : "text-gray-500 hover:text-black hover:bg-gray-100"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {activeTab === "invoices" && (
            <div className="divide-y divide-gray-100">
              {sampleInvoices.map((inv) => (
                <div key={inv.id} className="py-3.5 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-900">{inv.id}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 font-semibold uppercase">
                        {inv.mode}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400 mt-0.5">Date: {inv.date}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-gray-900 block">
                      {formatINR(inv.total)}
                    </span>
                    {inv.balance > 0 ? (
                      <span className="text-[11px] font-semibold text-rose-600">
                        Due: {formatINR(inv.balance)}
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold text-emerald-600">Paid</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "orders" && (
            <div className="divide-y divide-gray-100">
              {sampleOrders.map((ord) => (
                <div key={ord.id} className="py-3.5 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-900">{ord.id}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 font-medium capitalize">
                        {ord.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400 mt-0.5">{ord.itemsCount} Items • {ord.date}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-gray-900 block">
                      {formatINR(ord.total)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "payments" && (
            <div className="divide-y divide-gray-100">
              {samplePayments.map((pay) => (
                <div key={pay.id} className="py-3.5 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-900">{pay.id}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-medium">
                        {pay.method}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400 mt-0.5">Ref: {pay.ref} • {pay.date}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-emerald-600 block">
                      +{formatINR(pay.amount)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "visits" && (
            <div className="divide-y divide-gray-100">
              {sampleVisits.map((v) => (
                <div key={v.id} className="py-3.5 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-900">Visit on {v.date}</span>
                    <span className="text-[10px] text-gray-400">Next: {v.nextDate}</span>
                  </div>
                  <p className="text-xs text-gray-600">{v.outcome}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
