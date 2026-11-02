"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ShoppingCart,
  Plus,
  Search,
  Filter,
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
  status: 'draft' | 'confirmed' | 'processing' | 'dispatched' | 'delivered' | 'cancelled';
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

  const getStatusBadge = (status: OrderItem['status']) => {
    switch (status) {
      case "confirmed":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "processing":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "dispatched":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "delivered":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "cancelled":
        return "bg-rose-50 text-rose-700 border-rose-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  return (
    <div className="min-h-screen">
      <TopHeader
        title="Customer Orders"
        subtitle="Manage sales pipeline, dispatch tracking and order-to-invoice conversion"
      />

      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
        {/* Summary KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-3xl p-5 border border-[#E5E4EE] shadow-sm">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
              Total Orders
            </span>
            <div className="text-2xl font-black text-gray-900 mt-1">
              {orders.length}
            </div>
            <p className="text-[11px] text-gray-400 mt-0.5">Active this month</p>
          </div>

          <div className="bg-white rounded-3xl p-5 border border-[#E5E4EE] shadow-sm">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider block">
              Processing
            </span>
            <div className="text-2xl font-black text-blue-700 mt-1">
              {orders.filter((o) => o.status === "confirmed" || o.status === "processing").length}
            </div>
            <p className="text-[11px] text-gray-400 mt-0.5">Packing at facility</p>
          </div>

          <div className="bg-white rounded-3xl p-5 border border-[#E5E4EE] shadow-sm">
            <span className="text-xs font-bold text-amber-600 uppercase tracking-wider block">
              Out for Delivery
            </span>
            <div className="text-2xl font-black text-amber-700 mt-1">
              {orders.filter((o) => o.status === "dispatched").length}
            </div>
            <p className="text-[11px] text-gray-400 mt-0.5">On delivery van route</p>
          </div>

          <div className="bg-white rounded-3xl p-5 border border-[#E5E4EE] shadow-sm">
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider block">
              Delivered
            </span>
            <div className="text-2xl font-black text-emerald-700 mt-1">
              {orders.filter((o) => o.status === "delivered").length}
            </div>
            <p className="text-[11px] text-gray-400 mt-0.5">Receipt acknowledged</p>
          </div>
        </div>

        {/* Filter and Action Bar */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="flex flex-1 items-center gap-2 max-w-lg">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by order # or customer shop..."
                className="w-full h-11 pl-10 pr-4 text-xs bg-white rounded-full border border-[#E5E4EE] text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#D4F732] shadow-sm transition-all"
              />
            </div>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="h-11 px-3 text-xs bg-white rounded-full border border-[#E5E4EE] text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-[#D4F732] shadow-sm"
            >
              <option value="all">All Statuses</option>
              <option value="confirmed">Confirmed</option>
              <option value="processing">Processing</option>
              <option value="dispatched">Dispatched</option>
              <option value="delivered">Delivered</option>
            </select>
          </div>

          <Link
            href="/orders/new"
            className="flex items-center justify-center gap-2 h-11 px-5 rounded-full bg-[#0A0A0A] text-white text-xs sm:text-sm font-bold shadow-md hover:bg-black/90 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4 text-[#D4F732]" />
            <span>Create Order</span>
          </Link>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-3xl border border-[#E5E4EE] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F9F8FD] border-b border-[#E5E4EE] text-gray-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-4 px-6">Order #</th>
                  <th className="py-4 px-4">Customer Shop</th>
                  <th className="py-4 px-4">Date</th>
                  <th className="py-4 px-4">Items Summary</th>
                  <th className="py-4 px-4 text-right">Order Total</th>
                  <th className="py-4 px-4 text-center">Status</th>
                  <th className="py-4 px-6 text-right">Convert / Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E4EE]">
                {filteredOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-[#F9F8FD]/60 transition-colors">
                    <td className="py-4 px-6 font-mono font-bold text-gray-900">
                      {ord.order_number}
                    </td>
                    <td className="py-4 px-4 font-bold text-gray-900">
                      {ord.customer_name}
                    </td>
                    <td className="py-4 px-4 text-gray-500">{ord.date}</td>
                    <td className="py-4 px-4 text-gray-600 max-w-xs truncate">{ord.items_summary}</td>
                    <td className="py-4 px-4 text-right font-black text-gray-900">{formatINR(ord.total)}</td>
                    <td className="py-4 px-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold border capitalize ${getStatusBadge(
                          ord.status
                        )}`}
                      >
                        {ord.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      {ord.invoiced ? (
                        <span className="text-[11px] font-semibold text-emerald-600">
                          Invoiced ✓
                        </span>
                      ) : (
                        <Link
                          href={`/invoices/new?orderId=${ord.id}&customerName=${encodeURIComponent(ord.customer_name)}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#0A0A0A] text-white text-[11px] font-bold hover:bg-black/80 transition-all shadow-sm"
                        >
                          <FilePlus className="w-3 h-3 text-[#D4F732]" />
                          <span>Generate Bill</span>
                        </Link>
                      )}
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
