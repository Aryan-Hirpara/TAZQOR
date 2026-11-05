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
  ChevronDown,
} from "lucide-react";
import { TopHeader } from "@/components/layout/TopHeader";
import { formatINR } from "@/lib/formatting/currency";
import { formatDate } from "@/lib/formatting/dates";
import { RECONCILED_ORDERS, OrderRecord } from "@/lib/services/businessData";

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderRecord[]>(RECONCILED_ORDERS);
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");

  const filteredOrders = orders.filter((o) => {
    const matchSearch =
      o.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      o.order_number.toLowerCase().includes(search.toLowerCase());
    const matchStatus = selectedStatus === "all" || o.status === selectedStatus;
    return matchSearch && matchStatus;
  });

  // KPI Status Counts that strictly sum to total orders
  const counts = {
    total: orders.length,
    confirmed: orders.filter((o) => o.status === "confirmed").length,
    processing: orders.filter((o) => o.status === "processing").length,
    dispatched: orders.filter((o) => o.status === "dispatched").length,
    delivered: orders.filter((o) => o.status === "delivered").length,
    cancelled: orders.filter((o) => o.status === "cancelled").length,
  };

  const getStatusDot = (status: OrderRecord["status"]) => {
    switch (status) {
      case "delivered":
      case "confirmed":
        return "bg-[#D7FF00]";
      case "processing":
      case "dispatched":
        return "bg-[#23D7FF]";
      case "cancelled":
        return "bg-[#DB9595]";
      default:
        return "bg-black dark:bg-white";
    }
  };

  const getStatusLabel = (status: OrderRecord["status"]) => {
    switch (status) {
      case "confirmed":
        return "Confirmed";
      case "processing":
        return "Processing";
      case "dispatched":
        return "Out for delivery";
      case "delivered":
        return "Delivered";
      case "cancelled":
        return "Cancelled";
      default:
        return status;
    }
  };

  return (
    <div className="min-h-screen pb-12">
      <TopHeader title="Customer Orders" subtitle="Dispatch & Route Tracking" />

      <div className="space-y-4 sm:space-y-6 pt-2">
        {/* Summary KPIs: Compact 2-column cards on mobile, 4-column on desktop */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {/* Card 1: Total Orders */}
          <div className="bg-white/55 dark:bg-[#242422]/80 backdrop-blur-xl border border-white/65 dark:border-white/10 rounded-[24px] p-4 sm:p-5 shadow-none">
            <span className="text-[11px] sm:text-xs font-light text-neutral-500 dark:text-neutral-400 block">
              Total orders
            </span>
            <div className="text-2xl sm:text-3xl font-semibold text-neutral-900 dark:text-white mt-1 tracking-tight">
              {counts.total}
            </div>
            <p className="text-[10px] sm:text-[11px] font-light text-neutral-500 dark:text-neutral-400 mt-0.5 truncate">
              Active this month
            </p>
          </div>

          {/* Card 2: Confirmed & Processing */}
          <div className="bg-white/55 dark:bg-[#242422]/80 backdrop-blur-xl border border-white/65 dark:border-white/10 rounded-[24px] p-4 sm:p-5 shadow-none">
            <span className="text-[11px] sm:text-xs font-light text-neutral-500 dark:text-neutral-400 block">
              Processing
            </span>
            <div className="text-2xl sm:text-3xl font-semibold text-neutral-900 dark:text-white mt-1 tracking-tight flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#23D7FF] inline-block shrink-0" />
              <span>{counts.confirmed + counts.processing}</span>
            </div>
            <p className="text-[10px] sm:text-[11px] font-light text-neutral-500 dark:text-neutral-400 mt-0.5 truncate">
              {counts.confirmed} confirmed • {counts.processing} packing
            </p>
          </div>

          {/* Card 3: Out for delivery */}
          <div className="bg-white/55 dark:bg-[#242422]/80 backdrop-blur-xl border border-white/65 dark:border-white/10 rounded-[24px] p-4 sm:p-5 shadow-none">
            <span className="text-[11px] sm:text-xs font-light text-neutral-500 dark:text-neutral-400 block">
              Out for delivery
            </span>
            <div className="text-2xl sm:text-3xl font-semibold text-neutral-900 dark:text-white mt-1 tracking-tight flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#23D7FF] inline-block shrink-0" />
              <span>{counts.dispatched}</span>
            </div>
            <p className="text-[10px] sm:text-[11px] font-light text-neutral-500 dark:text-neutral-400 mt-0.5 truncate">
              On delivery van route
            </p>
          </div>

          {/* Card 4: Delivered */}
          <div className="bg-white/55 dark:bg-[#242422]/80 backdrop-blur-xl border border-white/65 dark:border-white/10 rounded-[24px] p-4 sm:p-5 shadow-none">
            <span className="text-[11px] sm:text-xs font-light text-neutral-500 dark:text-neutral-400 block">
              Delivered
            </span>
            <div className="text-2xl sm:text-3xl font-semibold text-neutral-900 dark:text-white mt-1 tracking-tight flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#D7FF00] inline-block shrink-0" />
              <span>{counts.delivered}</span>
            </div>
            <p className="text-[10px] sm:text-[11px] font-light text-neutral-500 dark:text-neutral-400 mt-0.5 truncate">
              {counts.cancelled > 0 ? `${counts.cancelled} cancelled` : "Receipt acknowledged"}
            </p>
          </div>
        </div>

        {/* Filter and Action Bar */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="flex items-center gap-2 flex-1 max-w-lg">
            {/* Search Input with visible search icon & short placeholder */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search orders"
                className="w-full h-10 pl-10 pr-4 text-xs bg-white/65 dark:bg-[#242422]/80 backdrop-blur-md rounded-full border border-white/70 dark:border-white/10 text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#D7FF00] shadow-none transition-all"
              />
            </div>

            {/* Custom styled select */}
            <div className="relative">
              <select
                aria-label="Filter order status"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="appearance-none h-10 pl-3.5 pr-8 text-xs bg-white/65 dark:bg-[#242422]/80 backdrop-blur-md rounded-full border border-white/70 dark:border-white/10 text-neutral-700 dark:text-neutral-200 font-light focus:outline-none focus:ring-2 focus:ring-[#D7FF00] shadow-none cursor-pointer"
              >
                <option value="all">All statuses</option>
                <option value="confirmed">Confirmed</option>
                <option value="processing">Processing</option>
                <option value="dispatched">Out for delivery</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-neutral-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <Link
            href="/orders/new"
            className="flex items-center justify-center gap-2 h-10 px-5 rounded-full bg-black text-white dark:bg-[#D7FF00] dark:text-black text-xs sm:text-sm font-normal shadow-none hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#D7FF00] dark:text-black" />
            <span>New Order</span>
          </Link>
        </div>

        {/* Order List: Desktop Table + Mobile Cards */}
        {filteredOrders.length === 0 ? (
          <div className="bg-white/55 dark:bg-[#242422]/80 backdrop-blur-xl rounded-[28px] p-8 sm:p-12 text-center border border-white/65 dark:border-white/10 space-y-3">
            <ShoppingCart className="w-10 h-10 text-neutral-300 dark:text-neutral-600 mx-auto" />
            <h3 className="text-base font-normal text-neutral-900 dark:text-white">No Orders Found</h3>
            <p className="text-xs font-light text-neutral-500 dark:text-neutral-400 max-w-sm mx-auto">
              No orders matched your filter. Clear filters or create a new order.
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block bg-white/55 dark:bg-[#242422]/80 backdrop-blur-xl rounded-[28px] border border-white/65 dark:border-white/10 overflow-x-auto shadow-none">
              <table className="w-full text-left text-xs">
                <thead className="bg-white/40 dark:bg-neutral-800/40 border-b border-white/60 dark:border-white/10 text-neutral-500 dark:text-neutral-400 font-normal">
                  <tr>
                    <th className="py-4 px-6">Order & Shop</th>
                    <th className="py-4 px-4">Date</th>
                    <th className="py-4 px-4">Items Summary</th>
                    <th className="py-4 px-4">Status</th>
                    <th className="py-4 px-4 text-right">Order Total</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/50 dark:divide-neutral-700/50">
                  {filteredOrders.map((o) => (
                    <tr key={o.id} className="hover:bg-white/40 dark:hover:bg-neutral-800/40 transition-colors">
                      <td className="py-4 px-6">
                        <div className="font-semibold text-neutral-900 dark:text-white text-sm">
                          {o.customer_name}
                        </div>
                        <div className="text-[11px] font-light text-neutral-500 dark:text-neutral-400 mt-0.5">
                          Ref: <span className="tabular-nums font-normal">{o.order_number}</span>
                        </div>
                      </td>

                      <td className="py-4 px-4 text-neutral-700 dark:text-neutral-300 font-light">
                        {formatDate(o.date)}
                      </td>

                      <td className="py-4 px-4 text-neutral-700 dark:text-neutral-300 font-light max-w-xs truncate">
                        {o.items_summary}
                      </td>

                      <td className="py-4 px-4">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-light bg-white/70 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-white/70 dark:border-white/10">
                          <span className={`w-2 h-2 rounded-full ${getStatusDot(o.status)}`} />
                          <span>{getStatusLabel(o.status)}</span>
                        </span>
                      </td>

                      <td className="py-4 px-4 text-right font-semibold text-neutral-900 dark:text-white">
                        {formatINR(o.total)}
                      </td>

                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {!o.invoiced && (
                            <Link
                              href={`/invoices/new?order_id=${o.id}`}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/60 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 text-xs font-light hover:bg-[#D7FF00] hover:text-black border border-white/70 dark:border-white/10 transition-all shadow-none"
                            >
                              <FilePlus className="w-3.5 h-3.5" />
                              <span>Bill</span>
                            </Link>
                          )}
                          <Link
                            href={`/orders/${o.id}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/60 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 text-xs font-light hover:bg-black hover:text-white dark:hover:bg-[#D7FF00] dark:hover:text-black border border-white/70 dark:border-white/10 transition-all shadow-none"
                          >
                            <span>Details</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View: compact glass cards with palette dots and tabular-nums IDs */}
            <div className="md:hidden space-y-3">
              {filteredOrders.map((o) => (
                <div
                  key={o.id}
                  className="bg-white/55 dark:bg-[#242422]/80 backdrop-blur-xl rounded-[24px] p-4 border border-white/65 dark:border-white/10 shadow-none space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <span className="text-[10px] tabular-nums font-normal text-neutral-500 dark:text-neutral-400 block mb-0.5">
                        {o.order_number}
                      </span>
                      <h4 className="text-sm font-semibold text-neutral-900 dark:text-white truncate">
                        {o.customer_name}
                      </h4>
                      <p className="text-xs font-light text-neutral-500 dark:text-neutral-400 line-clamp-1">
                        {o.items_summary}
                      </p>
                    </div>

                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-light bg-white/80 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-white/70 dark:border-white/10 shrink-0">
                      <span className={`w-2 h-2 rounded-full ${getStatusDot(o.status)}`} />
                      <span>{getStatusLabel(o.status)}</span>
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1 border-t border-white/40 dark:border-neutral-700/40">
                    <span className="text-[11px] font-light text-neutral-500 dark:text-neutral-400">
                      {formatDate(o.date)}
                    </span>
                    <span className="text-sm font-semibold text-neutral-900 dark:text-white">
                      {formatINR(o.total)}
                    </span>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    {!o.invoiced && (
                      <Link
                        href={`/invoices/new?order_id=${o.id}`}
                        className="inline-flex items-center justify-center gap-1 px-4 min-h-[44px] rounded-full bg-white/70 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 text-xs font-light hover:bg-[#D7FF00] hover:text-black border border-white/70 dark:border-white/10 transition-all shadow-none"
                      >
                        <FilePlus className="w-3.5 h-3.5" />
                        <span>Generate Bill</span>
                      </Link>
                    )}
                    <Link
                      href={`/orders/${o.id}`}
                      className="inline-flex items-center justify-center gap-1 px-4 min-h-[44px] rounded-full bg-black text-white dark:bg-[#D7FF00] dark:text-black text-xs font-normal hover:scale-105 active:scale-95 transition-all shadow-none"
                    >
                      <span>View</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Mobile Floating Action Button (FAB) bottom-right */}
      <Link
        href="/orders/new"
        className="md:hidden fixed right-5 bottom-24 z-30 w-12 h-12 rounded-full bg-black text-[#D7FF00] dark:bg-[#D7FF00] dark:text-black flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all"
        title="New Order"
        aria-label="New Order"
      >
        <Plus className="w-6 h-6" />
      </Link>
    </div>
  );
}
