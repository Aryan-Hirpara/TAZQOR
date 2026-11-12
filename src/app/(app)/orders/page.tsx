"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ShoppingCart,
  Plus,
  Search,
  ChevronRight,
  FilePlus,
  Trash2,
  Ban,
} from "lucide-react";
import { toast } from "sonner";
import { TopHeader } from "@/components/layout/TopHeader";
import { formatINR } from "@/lib/formatting/currency";
import { formatDate } from "@/lib/formatting/dates";
import { OrderRecord } from "@/lib/services/businessData";
import { createClient } from "@/lib/supabase/client";
import { StyledSelect } from "@/components/ui/StyledSelect";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

interface ExtendedOrderRecord extends OrderRecord {
  rawStatus: string;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<ExtendedOrderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");

  const [pendingAction, setPendingAction] = useState<{
    order: ExtendedOrderRecord;
    kind: "delete" | "cancel";
  } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const [{ data, error }, { data: invData }] = await Promise.all([
        supabase
          .from("orders")
          .select("*, customers(name, shop_name), order_items(*)")
          .order("created_at", { ascending: false }),
        supabase
          .from("invoices")
          .select("order_id")
          .not("order_id", "is", null)
          .neq("status", "cancelled"),
      ]);

      const invoicedOrderIds = new Set((invData || []).map((i: any) => i.order_id));

      if (!error && data) {
        const mapped: ExtendedOrderRecord[] = data.map((o: any) => {
          const customerName = o.customers?.shop_name || o.customers?.name || "Customer";
          const itemCount = (o.order_items || []).length;
          const totalUnits = (o.order_items || []).reduce(
            (s: number, it: any) => s + (Number(it.quantity) || 0),
            0
          );
          const itemsSummary =
            o.notes || (itemCount > 0 ? `${itemCount} line(s) • ${totalUnits} units` : "No items");
          const orderTotal =
            (o.order_items || []).reduce(
              (sum: number, it: any) => sum + (Number(it.unit_price) * Number(it.quantity) || 0),
              0
            ) || 0;

          return {
            id: o.id,
            order_number: o.order_number || "ORD-LIVE",
            customer_name: customerName,
            customer_id: o.customer_id,
            date: (o.created_at || new Date().toISOString()).split("T")[0],
            items_summary: itemsSummary,
            total: orderTotal,
            status: (o.status as OrderRecord["status"]) || "confirmed",
            rawStatus: o.status || "confirmed",
            invoiced: invoicedOrderIds.has(o.id),
          };
        });

        setOrders(mapped);
      }
    } catch (e) {
      console.warn("Could not load orders from Supabase", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleConfirmAction = async () => {
    if (!pendingAction) return;
    setActionLoading(true);
    setActionError(null);
    try {
      const supabase = createClient();
      if (pendingAction.kind === "delete") {
        const { data, error } = await supabase
          .from("orders")
          .delete()
          .eq("id", pendingAction.order.id)
          .select("id");

        if (error) {
          setActionError(error.message);
          return;
        }
        if (!data || data.length === 0) {
          setActionError("Only draft orders can be permanently deleted. Cancel non-draft orders instead.");
          return;
        }
        toast.success(`Draft order ${pendingAction.order.order_number} deleted.`);
      } else {
        const { data, error } = await supabase
          .from("orders")
          .update({ status: "cancelled" })
          .eq("id", pendingAction.order.id)
          .select("id");

        if (error) {
          setActionError(error.message);
          return;
        }
        if (!data || data.length === 0) {
          setActionError("Order could not be cancelled.");
          return;
        }
        toast.success(`Order ${pendingAction.order.order_number} cancelled.`);
      }
      setPendingAction(null);
      await loadOrders();
    } catch (err: any) {
      setActionError(err?.message || "Failed to update order");
    } finally {
      setActionLoading(false);
    }
  };

  const filteredOrders = orders.filter((o) => {
    const matchSearch =
      o.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      o.order_number.toLowerCase().includes(search.toLowerCase());
    const matchStatus = selectedStatus === "all" || o.rawStatus === selectedStatus;
    return matchSearch && matchStatus;
  });

  const counts = {
    total: orders.length,
    confirmed: orders.filter((o) => o.rawStatus === "confirmed").length,
    processing: orders.filter((o) => o.rawStatus === "processing").length,
    dispatched: orders.filter((o) => o.rawStatus === "dispatched").length,
    delivered: orders.filter((o) => o.rawStatus === "delivered").length,
    cancelled: orders.filter((o) => o.rawStatus === "cancelled").length,
  };

  const getStatusDot = (status: string) => {
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
        return "bg-neutral-400";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "draft":
        return "Draft";
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
        {/* Summary KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white/55 backdrop-blur-xl border border-white/65 rounded-[24px] p-4 sm:p-5 shadow-none min-w-0">
            <span className="text-[11px] sm:text-xs font-light text-neutral-500 block">
              Total orders
            </span>
            <div className="text-2xl sm:text-3xl font-semibold text-neutral-900 mt-1 tracking-tight">
              {counts.total}
            </div>
            <p className="text-[10px] sm:text-[11px] font-light text-neutral-500 mt-0.5 truncate">
              All recorded orders
            </p>
          </div>

          <div className="bg-white/55 backdrop-blur-xl border border-white/65 rounded-[24px] p-4 sm:p-5 shadow-none min-w-0">
            <span className="text-[11px] sm:text-xs font-light text-neutral-500 block">
              Processing
            </span>
            <div className="text-2xl sm:text-3xl font-semibold text-neutral-900 mt-1 tracking-tight flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#23D7FF] inline-block shrink-0" />
              <span>{counts.confirmed + counts.processing}</span>
            </div>
            <p className="text-[10px] sm:text-[11px] font-light text-neutral-500 mt-0.5 truncate">
              {counts.confirmed} confirmed • {counts.processing} packing
            </p>
          </div>

          <div className="bg-white/55 backdrop-blur-xl border border-white/65 rounded-[24px] p-4 sm:p-5 shadow-none min-w-0">
            <span className="text-[11px] sm:text-xs font-light text-neutral-500 block">
              Out for delivery
            </span>
            <div className="text-2xl sm:text-3xl font-semibold text-neutral-900 mt-1 tracking-tight flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#23D7FF] inline-block shrink-0" />
              <span>{counts.dispatched}</span>
            </div>
            <p className="text-[10px] sm:text-[11px] font-light text-neutral-500 mt-0.5 truncate">
              On delivery route
            </p>
          </div>

          <div className="bg-white/55 backdrop-blur-xl border border-white/65 rounded-[24px] p-4 sm:p-5 shadow-none min-w-0">
            <span className="text-[11px] sm:text-xs font-light text-neutral-500 block">
              Delivered
            </span>
            <div className="text-2xl sm:text-3xl font-semibold text-neutral-900 mt-1 tracking-tight flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#D7FF00] inline-block shrink-0" />
              <span>{counts.delivered}</span>
            </div>
            <p className="text-[10px] sm:text-[11px] font-light text-neutral-500 mt-0.5 truncate">
              {counts.cancelled > 0 ? `${counts.cancelled} cancelled` : "Completed"}
            </p>
          </div>
        </div>

        {/* Filter and Action Bar */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-1 max-w-xl min-w-0">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search orders"
                className="w-full h-10 pl-10 pr-4 text-xs bg-white/75 backdrop-blur-md rounded-full border border-white/80 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#D7FF00] transition-all"
              />
            </div>

            <StyledSelect
              aria-label="Filter order status"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              wrapperClassName="sm:w-44"
              className="h-10 py-0 text-xs bg-white/75 border-white/80 text-neutral-800"
            >
              <option value="all">All statuses</option>
              <option value="draft">Draft</option>
              <option value="confirmed">Confirmed</option>
              <option value="processing">Processing</option>
              <option value="dispatched">Out for delivery</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </StyledSelect>
          </div>

          <Link
            href="/orders/new"
            className="flex items-center justify-center gap-2 h-10 px-5 rounded-full bg-black text-white text-xs sm:text-sm font-normal hover:scale-105 active:scale-95 transition-all cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4 text-[#D7FF00]" />
            <span>New Order</span>
          </Link>
        </div>

        {/* Order List */}
        {loading ? (
          <div className="bg-white/55 backdrop-blur-xl rounded-[28px] p-10 text-center border border-white/65 text-xs text-neutral-500">
            Loading orders from database...
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white/55 backdrop-blur-xl rounded-[28px] p-8 sm:p-12 text-center border border-white/65 space-y-3">
            <ShoppingCart className="w-10 h-10 text-neutral-300 mx-auto" />
            <h3 className="text-base font-normal text-neutral-900">No Orders Found</h3>
            <p className="text-xs font-light text-neutral-500 max-w-sm mx-auto">
              No orders matched your filter. Clear filters or create a new order.
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block bg-white/55 backdrop-blur-xl rounded-[28px] border border-white/65 table-wrapper shadow-none">
              <table className="w-full text-left text-xs">
                <thead className="bg-white/40 border-b border-white/60 text-neutral-500 font-normal">
                  <tr>
                    <th className="py-4 px-6">Order & Shop</th>
                    <th className="py-4 px-4">Date</th>
                    <th className="py-4 px-4">Items Summary</th>
                    <th className="py-4 px-4">Status</th>
                    <th className="py-4 px-4 text-right">Order Total</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/50">
                  {filteredOrders.map((o) => (
                    <tr key={o.id} className="hover:bg-white/40 transition-colors">
                      <td className="py-4 px-6">
                        <div className="font-semibold text-neutral-900 text-sm">
                          {o.customer_name}
                        </div>
                        <div className="text-[11px] font-light text-neutral-500 mt-0.5">
                          Ref: <span className="tabular-nums font-normal">{o.order_number}</span>
                        </div>
                      </td>

                      <td className="py-4 px-4 text-neutral-700 font-light whitespace-nowrap">
                        {formatDate(o.date)}
                      </td>

                      <td className="py-4 px-4 text-neutral-700 font-light max-w-xs truncate">
                        {o.items_summary}
                      </td>

                      <td className="py-4 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-light bg-white/70 text-neutral-800 border border-white/70">
                          <span className={`w-2 h-2 rounded-full ${getStatusDot(o.rawStatus)}`} />
                          <span>{getStatusLabel(o.rawStatus)}</span>
                        </span>
                      </td>

                      <td className="py-4 px-4 text-right font-semibold text-neutral-900 whitespace-nowrap">
                        {formatINR(o.total)}
                      </td>

                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {!o.invoiced && o.rawStatus !== "cancelled" && (
                            <Link
                              href={`/invoices/new?order_id=${o.id}`}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/70 text-neutral-800 text-xs font-light hover:bg-[#D7FF00] hover:text-black border border-white/80 transition-all"
                            >
                              <FilePlus className="w-3.5 h-3.5" />
                              <span>Bill</span>
                            </Link>
                          )}

                          {o.rawStatus === "draft" && (
                            <button
                              type="button"
                              onClick={() => {
                                setActionError(null);
                                setPendingAction({ order: o, kind: "delete" });
                              }}
                              aria-label={`Delete draft order ${o.order_number}`}
                              title="Delete Draft Order"
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-rose-50 text-rose-700 text-xs font-medium hover:bg-rose-100 border border-rose-200 transition-all cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Remove</span>
                            </button>
                          )}

                          {o.rawStatus !== "draft" &&
                            o.rawStatus !== "cancelled" &&
                            o.rawStatus !== "delivered" &&
                            !o.invoiced && (
                              <button
                                type="button"
                                onClick={() => {
                                  setActionError(null);
                                  setPendingAction({ order: o, kind: "cancel" });
                                }}
                                aria-label={`Cancel order ${o.order_number}`}
                                title="Cancel Order"
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-rose-50 text-rose-700 text-xs font-medium hover:bg-rose-100 border border-rose-200 transition-all cursor-pointer"
                              >
                                <Ban className="w-3.5 h-3.5" />
                                <span>Cancel</span>
                              </button>
                            )}

                          <Link
                            href={`/orders/${o.id}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/70 text-neutral-800 text-xs font-light hover:bg-black hover:text-white border border-white/80 transition-all"
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

            {/* Mobile Cards View */}
            <div className="md:hidden space-y-3">
              {filteredOrders.map((o) => (
                <div
                  key={o.id}
                  className="bg-white/55 backdrop-blur-xl rounded-[24px] p-4 border border-white/65 shadow-none space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <span className="text-[10px] tabular-nums font-normal text-neutral-500 block mb-0.5">
                        {o.order_number}
                      </span>
                      <h4 className="text-sm font-semibold text-neutral-900 truncate">
                        {o.customer_name}
                      </h4>
                      <p className="text-xs font-light text-neutral-500 line-clamp-1">
                        {o.items_summary}
                      </p>
                    </div>

                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-light bg-white/80 text-neutral-800 border border-white/70 shrink-0">
                      <span className={`w-2 h-2 rounded-full ${getStatusDot(o.rawStatus)}`} />
                      <span>{getStatusLabel(o.rawStatus)}</span>
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1 border-t border-white/40">
                    <span className="text-[11px] font-light text-neutral-500">
                      {formatDate(o.date)}
                    </span>
                    <span className="text-sm font-semibold text-neutral-900">
                      {formatINR(o.total)}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                    {o.rawStatus === "draft" && (
                      <button
                        type="button"
                        onClick={() => {
                          setActionError(null);
                          setPendingAction({ order: o, kind: "delete" });
                        }}
                        className="inline-flex items-center justify-center gap-1 px-3.5 min-h-[40px] rounded-full bg-rose-50 text-rose-700 text-xs font-medium border border-rose-200"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove</span>
                      </button>
                    )}

                    {o.rawStatus !== "draft" &&
                      o.rawStatus !== "cancelled" &&
                      o.rawStatus !== "delivered" &&
                      !o.invoiced && (
                        <button
                          type="button"
                          onClick={() => {
                            setActionError(null);
                            setPendingAction({ order: o, kind: "cancel" });
                          }}
                          className="inline-flex items-center justify-center gap-1 px-3.5 min-h-[40px] rounded-full bg-rose-50 text-rose-700 text-xs font-medium border border-rose-200"
                        >
                          <Ban className="w-3.5 h-3.5" />
                          <span>Cancel</span>
                        </button>
                      )}

                    {!o.invoiced && o.rawStatus !== "cancelled" && (
                      <Link
                        href={`/invoices/new?order_id=${o.id}`}
                        className="inline-flex items-center justify-center gap-1 px-4 min-h-[40px] rounded-full bg-white/75 text-neutral-800 text-xs font-medium border border-white/80"
                      >
                        <FilePlus className="w-3.5 h-3.5" />
                        <span>Bill</span>
                      </Link>
                    )}

                    <Link
                      href={`/orders/${o.id}`}
                      className="inline-flex items-center justify-center gap-1 px-4 min-h-[40px] rounded-full bg-black text-white text-xs font-normal"
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

      <ConfirmDialog
        open={Boolean(pendingAction)}
        title={
          pendingAction?.kind === "delete"
            ? `Delete draft order ${pendingAction.order.order_number}?`
            : `Cancel order ${pendingAction?.order.order_number}?`
        }
        description={
          pendingAction?.kind === "delete"
            ? "This draft order and its line items will be permanently deleted."
            : "This marks the customer order as cancelled while preserving the audit record."
        }
        confirmLabel={pendingAction?.kind === "delete" ? "Delete Draft" : "Cancel Order"}
        loading={actionLoading}
        error={actionError}
        onConfirm={handleConfirmAction}
        onClose={() => !actionLoading && setPendingAction(null)}
      />
    </div>
  );
}
