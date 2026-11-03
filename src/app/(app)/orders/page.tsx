"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ShoppingCart,
  Plus,
  Search,
  ChevronRight,
  PackageCheck,
  Clock,
  Truck,
  CheckCircle2,
  FilePlus,
} from "lucide-react";
import { TopHeader } from "@/components/layout/TopHeader";
import { formatINR } from "@/lib/formatting/currency";

interface OrderItem {
  id: string;
  order_number: string;
  customer_name: string;
  date: string;
  items_summary: string;
  total: number;
  status: "draft" | "confirmed" | "processing" | "dispatched" | "delivered" | "cancelled";
  invoiced: boolean;
}

const DEMO_ORDERS: OrderItem[] = [
  {
    id: "ord-1",
    order_number: "ORD-1042",
    customer_name: "Shreeji Supermarket",
    date: "2026-02-15",
    items_summary: "10x Floor Cleaner 5L, 2x Dish Wash 5L",
    total: 5540.00,
    status: "confirmed",
    invoiced: false,
  },
  {
    id: "ord-2",
    order_number: "ORD-1041",
    customer_name: "Hotel Pride Plaza",
    date: "2026-02-15",
    items_summary: "24x Hand Wash 500mL, 6x Floor Cleaner 5L",
    total: 4740.00,
    status: "processing",
    invoiced: false,
  },
  {
    id: "ord-3",
    order_number: "ORD-1040",
    customer_name: "Apex Tech Park",
    date: "2026-02-14",
    items_summary: "8x Toilet Cleaner 5L, 4x Glass Cleaner 5L",
    total: 5000.00,
    status: "dispatched",
    invoiced: true,
  },
  {
    id: "ord-4",
    order_number: "ORD-1039",
    customer_name: "Radhe Krishna PG",
    date: "2026-02-12",
    items_summary: "4x Toilet Cleaner 1L, 4x Floor Cleaner 1L",
    total: 900.00,
    status: "delivered",
    invoiced: true,
  },
];

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderItem[]>(DEMO_ORDERS);
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");

  const filteredOrders = orders.filter((o) => {
    const matchSearch =
      o.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      o.order_number.toLowerCase().includes(search.toLowerCase());
    const matchStatus = selectedStatus === "all" || o.status === selectedStatus;
    return matchSearch && matchStatus;
  });

  const getStatusBadge = (status: OrderItem["status"]) => {
    switch (status) {
      case "confirmed":
        return "bg-blue-50 text-blue-800 border-blue-200/60";
      case "processing":
        return "bg-purple-50 text-purple-800 border-purple-200/60";
      case "dispatched":
        return "bg-amber-50 text-amber-800 border-amber-200/60";
      case "delivered":
        return "bg-emerald-50 text-emerald-800 border-emerald-200/60";
      case "cancelled":
        return "bg-rose-50 text-rose-800 border-rose-200/60";
      default:
        return "bg-white/60 text-neutral-700 border-white/70";
    }
  };

  return (
    <div className="min-h-screen pb-12">
      <TopHeader title="Customer Orders" />

      <div className="space-y-6 pt-2">
        {/* Summary KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-5">
          <div className="bg-white/55 backdrop-blur-xl border border-white/65 rounded-[24px] p-5 sm:p-6 shadow-sm">
            <span className="text-xs font-light text-neutral-500 block">
              Total orders
            </span>
            <div className="text-2xl sm:text-3xl font-normal text-neutral-900 mt-1 tracking-tight">
              {orders.length}
            </div>
            <p className="text-[11px] font-light text-neutral-500 mt-0.5">Active this month</p>
          </div>

          <div className="bg-white/55 backdrop-blur-xl border border-white/65 rounded-[24px] p-5 sm:p-6 shadow-sm">
            <span className="text-xs font-light text-neutral-500 block">
              Processing
            </span>
            <div className="text-2xl sm:text-3xl font-normal text-purple-700 mt-1 tracking-tight">
              {orders.filter((o) => o.status === "confirmed" || o.status === "processing").length}
            </div>
            <p className="text-[11px] font-light text-neutral-500 mt-0.5">Packing at facility</p>
          </div>

          <div className="bg-white/55 backdrop-blur-xl border border-white/65 rounded-[24px] p-5 sm:p-6 shadow-sm">
            <span className="text-xs font-light text-neutral-500 block">
              Out for delivery
            </span>
            <div className="text-2xl sm:text-3xl font-normal text-amber-700 mt-1 tracking-tight">
              {orders.filter((o) => o.status === "dispatched").length}
            </div>
            <p className="text-[11px] font-light text-neutral-500 mt-0.5">On delivery van route</p>
          </div>

          <div className="bg-white/55 backdrop-blur-xl border border-white/65 rounded-[24px] p-5 sm:p-6 shadow-sm">
            <span className="text-xs font-light text-neutral-500 block">
              Delivered
            </span>
            <div className="text-2xl sm:text-3xl font-normal text-emerald-700 mt-1 tracking-tight">
              {orders.filter((o) => o.status === "delivered").length}
            </div>
            <p className="text-[11px] font-light text-neutral-500 mt-0.5">Receipt acknowledged</p>
          </div>
        </div>

        {/* Filter and Action Bar */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="flex flex-1 items-center gap-2 max-w-lg">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search orders by number or customer..."
                className="w-full h-10 pl-10 pr-4 text-xs bg-white/65 backdrop-blur-md rounded-full border border-white/70 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#E0FE52] shadow-sm transition-all"
              />
            </div>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="h-10 px-3.5 text-xs bg-white/65 backdrop-blur-md rounded-full border border-white/70 text-neutral-700 font-light focus:outline-none focus:ring-2 focus:ring-[#E0FE52] shadow-sm"
            >
              <option value="all">All statuses</option>
              <option value="confirmed">Confirmed</option>
              <option value="processing">Processing</option>
              <option value="dispatched">Dispatched</option>
              <option value="delivered">Delivered</option>
            </select>
          </div>

          <Link
            href="/orders/new"
            className="flex items-center justify-center gap-2 h-10 px-5 rounded-full bg-black text-white text-xs sm:text-sm font-normal shadow-md hover:scale-105 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4 text-[#E0FE52]" />
            <span>New Order</span>
          </Link>
        </div>

        {/* Orders Table */}
        <div className="hidden md:block bg-white/55 backdrop-blur-xl rounded-[28px] border border-white/65 overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-white/40 border-b border-white/60 text-neutral-500 font-normal">
              <tr>
                <th className="py-4 px-6">Order</th>
                <th className="py-4 px-4">Customer</th>
                <th className="py-4 px-4">Items Summary</th>
                <th className="py-4 px-4">Date</th>
                <th className="py-4 px-4">Status</th>
                <th className="py-4 px-4 text-right">Total</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/50">
              {filteredOrders.map((o) => (
                <tr key={o.id} className="hover:bg-white/40 transition-colors">
                  <td className="py-4 px-6 font-mono font-normal text-neutral-900">
                    {o.order_number}
                  </td>
                  <td className="py-4 px-4 font-normal text-neutral-900">
                    {o.customer_name}
                  </td>
                  <td className="py-4 px-4 font-light text-neutral-600 line-clamp-1">
                    {o.items_summary}
                  </td>
                  <td className="py-4 px-4 font-light text-neutral-500">
                    {o.date}
                  </td>
                  <td className="py-4 px-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-light border capitalize ${getStatusBadge(
                        o.status
                      )}`}
                    >
                      {o.status}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-right font-normal text-neutral-900">
                    {formatINR(o.total)}
                  </td>
                  <td className="py-4 px-6 text-right">
                    <Link
                      href={`/invoices/new?order_id=${o.id}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/60 hover:bg-black hover:text-white text-neutral-800 text-xs font-light border border-white/70 transition-all shadow-sm"
                    >
                      <span>Convert to bill</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile View */}
        <div className="md:hidden space-y-3">
          {filteredOrders.map((o) => (
            <div
              key={o.id}
              className="bg-white/55 backdrop-blur-xl rounded-[24px] p-5 border border-white/65 shadow-sm space-y-2.5"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono text-neutral-400 block mb-0.5">
                    {o.order_number}
                  </span>
                  <h4 className="text-sm font-normal text-neutral-900">{o.customer_name}</h4>
                  <p className="text-xs font-light text-neutral-500">{o.items_summary}</p>
                </div>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-light border capitalize ${getStatusBadge(
                    o.status
                  )}`}
                >
                  {o.status}
                </span>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-white/50 text-xs">
                <span className="font-normal text-neutral-900">{formatINR(o.total)}</span>
                <Link
                  href={`/invoices/new?order_id=${o.id}`}
                  className="px-3 py-1 rounded-full bg-black text-white text-xs font-light shadow-sm"
                >
                  Bill
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
