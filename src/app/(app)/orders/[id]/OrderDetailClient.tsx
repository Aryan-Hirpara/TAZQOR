"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  FilePlus,
  Trash2,
  Ban,
  Package,
} from "lucide-react";
import { toast } from "sonner";
import { TopHeader } from "@/components/layout/TopHeader";
import { formatINR } from "@/lib/formatting/currency";
import { formatDate } from "@/lib/formatting/dates";
import { createClient } from "@/lib/supabase/client";
import { StyledSelect } from "@/components/ui/StyledSelect";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

const ORDER_STATUSES = [
  { value: "draft", label: "Draft" },
  { value: "confirmed", label: "Confirmed" },
  { value: "processing", label: "Processing" },
  { value: "dispatched", label: "Out for delivery" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

export default function OrderDetailClient({ id }: { id: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<any>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const [confirmKind, setConfirmKind] = useState<"delete" | "cancel" | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  const loadOrder = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("orders")
        .select(
          "*, customers(id, name, shop_name, phone, city, delivery_address), order_items(*, product_variants(name, pack_size, sku, products(name)))"
        )
        .eq("id", id)
        .maybeSingle();

      if (!error && data) {
        const { data: linkedInv } = await supabase
          .from("invoices")
          .select("id, invoice_number, status")
          .eq("order_id", data.id)
          .neq("status", "cancelled")
          .maybeSingle();

        setOrder({ ...data, linkedInvoice: linkedInv || null });
      } else {
        setOrder(null);
      }
    } catch (err) {
      console.warn("Could not load order details:", err);
      setOrder(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  const handleStatusChange = async (newStatus: string) => {
    if (!order || newStatus === order.status) return;
    setUpdatingStatus(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("orders")
        .update({ status: newStatus as any })
        .eq("id", order.id);

      if (error) {
        toast.error(error.message || "Could not update order status");
        return;
      }
      setOrder((prev: any) => ({ ...prev, status: newStatus }));
      toast.success(`Order status updated to ${newStatus}`);
    } catch (err: any) {
      toast.error(err?.message || "Failed to update status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleConfirm = async () => {
    if (!order || !confirmKind) return;
    setConfirmLoading(true);
    setConfirmError(null);
    try {
      if (confirmKind === "delete") {
        const res = await fetch(
          `/api/orders/${order.id}?delete_linked_invoices=true`,
          { method: "DELETE" }
        );
        const payload = await res.json().catch(() => null);
        if (!res.ok || !payload?.success) {
          setConfirmError(payload?.error || "Failed to delete order.");
          return;
        }
        toast.success(
          payload.deletedInvoices > 0
            ? `Order ${order.order_number}, linked bill(s), and stock updated.`
            : `Order ${order.order_number} permanently deleted.`
        );
        router.push("/orders");
      } else {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("orders")
          .update({ status: "cancelled" })
          .eq("id", order.id)
          .select("id");

        if (error || !data || data.length === 0) {
          setConfirmError(error?.message || "Could not cancel order.");
          return;
        }
        toast.success(`Order ${order.order_number} cancelled.`);
        setConfirmKind(null);
        await loadOrder();
      }
    } catch (err: any) {
      setConfirmError(err?.message || "Operation failed");
    } finally {
      setConfirmLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen p-12 flex flex-col items-center justify-center gap-3 text-xs text-neutral-500">
        <Loader2 className="w-6 h-6 animate-spin text-black" />
        <span>Loading order details...</span>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen p-12 text-center space-y-4">
        <AlertCircle className="w-10 h-10 mx-auto text-neutral-400" />
        <p className="text-sm font-medium text-neutral-800">Order not found</p>
        <Link
          href="/orders"
          className="inline-flex items-center px-5 py-2.5 rounded-full bg-black text-white text-xs"
        >
          Back to Orders
        </Link>
      </div>
    );
  }

  const items = order.order_items || [];
  const totalAmount = items.reduce(
    (s: number, it: any) => s + (Number(it.quantity) || 0) * (Number(it.unit_price) || 0),
    0
  );
  const cust = order.customers || {};

  return (
    <div className="min-h-screen pb-12">
      <TopHeader
        title={`Order ${order.order_number}`}
        subtitle={`${cust.shop_name || cust.name || "Customer"} • ${formatDate(order.created_at)}`}
      />

      <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/orders"
            className="inline-flex items-center gap-1.5 min-h-[44px] text-xs font-semibold text-neutral-600 hover:text-black transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Orders</span>
          </Link>

          <div className="flex flex-wrap items-center gap-2">
            {order.linkedInvoice ? (
              <Link
                href={`/invoices/${order.linkedInvoice.id}`}
                className="inline-flex items-center gap-1.5 px-4 h-10 rounded-full bg-[#D7FF00] text-black text-xs font-medium hover:brightness-95 transition-all"
              >
                <FilePlus className="w-3.5 h-3.5" />
                <span>View Bill ({order.linkedInvoice.invoice_number || "Draft"})</span>
              </Link>
            ) : (
              order.status !== "cancelled" && (
                <Link
                  href={`/invoices/new?order_id=${order.id}`}
                  className="inline-flex items-center gap-1.5 px-4 h-10 rounded-full bg-black text-white text-xs font-medium hover:bg-neutral-800 transition-all"
                >
                  <FilePlus className="w-3.5 h-3.5 text-[#D7FF00]" />
                  <span>Convert to Invoice</span>
                </Link>
              )
            )}

            {order.status !== "draft" &&
              order.status !== "cancelled" &&
              !order.linkedInvoice && (
                <button
                  type="button"
                  onClick={() => {
                    setConfirmError(null);
                    setConfirmKind("cancel");
                  }}
                  className="inline-flex items-center gap-1.5 px-4 h-10 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-medium hover:bg-amber-100 cursor-pointer"
                >
                  <Ban className="w-3.5 h-3.5" />
                  <span>Cancel Order</span>
                </button>
              )}

            <button
              type="button"
              onClick={() => {
                setConfirmError(null);
                setConfirmKind("delete");
              }}
              className="inline-flex items-center gap-1.5 px-4 h-10 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-xs font-medium hover:bg-rose-100 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Order</span>
            </button>
          </div>
        </div>

        {/* Summary Card */}
        <div className="bg-white/60 backdrop-blur-xl rounded-[28px] p-6 border border-white/75 grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="min-w-0">
            <span className="text-[11px] font-light text-neutral-500 block">Customer</span>
            {cust.id ? (
              <Link
                href={`/customers/${cust.id}`}
                className="text-sm font-semibold text-neutral-900 hover:underline block truncate mt-0.5"
              >
                {cust.shop_name || cust.name}
              </Link>
            ) : (
              <span className="text-sm font-semibold text-neutral-900 block truncate mt-0.5">
                {cust.shop_name || cust.name || "Customer"}
              </span>
            )}
            <p className="text-xs font-light text-neutral-600 mt-0.5 truncate">
              {cust.city || cust.delivery_address || "—"}
            </p>
            {cust.phone && <p className="text-xs text-neutral-500 mt-0.5">{cust.phone}</p>}
          </div>

          <div className="min-w-0">
            <label className="text-[11px] font-light text-neutral-500 block mb-1">
              Fulfillment Status
            </label>
            <StyledSelect
              aria-label="Update order status"
              value={order.status}
              disabled={updatingStatus}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="h-10 py-0 text-xs bg-white border-neutral-200"
            >
              {ORDER_STATUSES.map((st) => (
                <option key={st.value} value={st.value}>
                  {st.label}
                </option>
              ))}
            </StyledSelect>
          </div>

          <div className="sm:text-right min-w-0">
            <span className="text-[11px] font-light text-neutral-500 block">Order Total</span>
            <div className="text-2xl font-semibold text-neutral-900 tracking-tight mt-0.5">
              {formatINR(totalAmount)}
            </div>
            <p className="text-xs font-light text-neutral-500 mt-0.5">
              {items.length} line item(s)
            </p>
          </div>
        </div>

        {/* Order Notes */}
        {order.notes && (
          <div className="bg-white/55 backdrop-blur-xl rounded-[24px] p-5 border border-white/70">
            <span className="text-[11px] font-light text-neutral-500 block">Delivery Instructions / Notes</span>
            <p className="text-xs text-neutral-800 mt-1">{order.notes}</p>
          </div>
        )}

        {/* Line Items Table */}
        <div className="bg-white/60 backdrop-blur-xl rounded-[28px] border border-white/75 table-wrapper">
          <div className="p-5 border-b border-white/60 flex items-center gap-2">
            <Package className="w-4 h-4 text-neutral-600" />
            <h2 className="text-sm font-medium text-neutral-900">Booked Line Items</h2>
          </div>

          {items.length === 0 ? (
            <div className="p-8 text-center text-xs text-neutral-500">
              No line items recorded on this order.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-white/40 border-b border-white/60 text-neutral-500 font-normal">
                <tr>
                  <th className="py-3.5 px-6">Product & Pack Size</th>
                  <th className="py-3.5 px-4 text-right">Quantity</th>
                  <th className="py-3.5 px-4 text-right">Unit Price</th>
                  <th className="py-3.5 px-6 text-right">Line Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/50">
                {items.map((it: any) => {
                  const prodName = it.product_variants?.products?.name || "Product";
                  const pack = it.product_variants?.pack_size || it.product_variants?.name || "Standard";
                  const qty = Number(it.quantity) || 0;
                  const price = Number(it.unit_price) || 0;
                  return (
                    <tr key={it.id}>
                      <td className="py-3.5 px-6">
                        <div className="font-medium text-neutral-900">{prodName}</div>
                        <div className="text-[11px] font-light text-neutral-500">
                          {pack} {it.product_variants?.sku ? `• ${it.product_variants.sku}` : ""}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right tabular-nums">{qty}</td>
                      <td className="py-3.5 px-4 text-right tabular-nums">{formatINR(price)}</td>
                      <td className="py-3.5 px-6 text-right font-semibold tabular-nums">
                        {formatINR(qty * price)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(confirmKind)}
        title={
          confirmKind === "delete"
            ? `Delete order ${order.order_number}?`
            : `Cancel order ${order.order_number}?`
        }
        description={
          confirmKind === "delete"
            ? order.linkedInvoice
              ? `This permanently deletes order ${order.order_number} and its linked bill (${order.linkedInvoice.invoice_number || "Draft"}) from the database and software, and recovers any deducted inventory stock.`
              : `This permanently deletes order ${order.order_number} from your workspace and database, and recovers any deducted inventory stock.`
            : "This marks the order as cancelled. It will no longer appear as active."
        }
        confirmLabel={confirmKind === "delete" ? "Delete Order" : "Cancel Order"}
        loading={confirmLoading}
        error={confirmError}
        onConfirm={handleConfirm}
        onClose={() => !confirmLoading && setConfirmKind(null)}
      />
    </div>
  );
}

