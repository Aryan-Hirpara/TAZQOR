"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Boxes,
  FileText,
  Wallet,
  ShoppingCart,
  X,
  CheckCheck,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface NotificationItem {
  id: string;
  category: "inventory" | "billing" | "payment" | "orders";
  type: "warning" | "alert" | "success" | "info";
  title: string;
  message: string;
  time: string;
  link: string;
  unread: boolean;
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "notif-1",
    category: "inventory",
    type: "warning",
    title: "Low Stock: Citrus Floor Cleaner (5 L)",
    message: "8 units remaining in Batch B-FLR-2026-01. Below minimum threshold of 15 units.",
    time: "15m ago",
    link: "/inventory",
    unread: true,
  },
  {
    id: "notif-2",
    category: "billing",
    type: "alert",
    title: "Overdue Balance: Shreeji Supermarket",
    message: "Invoice INV/2025-26/0001 has ₹7,770 unpaid balance overdue since March 1.",
    time: "1h ago",
    link: "/invoices/INV-1",
    unread: true,
  },
  {
    id: "notif-3",
    category: "payment",
    type: "success",
    title: "Payment Received: Riddhi Mart",
    message: "₹12,000 received via HDFC UPI. Auto-reconciled with ledger.",
    time: "3h ago",
    link: "/payments",
    unread: false,
  },
  {
    id: "notif-4",
    category: "orders",
    type: "info",
    title: "New Order #ORD-2026-104",
    message: "Field Rep Aryan recorded an order for 20 cases of Sparkle Dish Wash Gel.",
    time: "5h ago",
    link: "/orders",
    unread: false,
  },
  {
    id: "notif-5",
    category: "inventory",
    type: "warning",
    title: "FEFO Alert: Expiring Batch",
    message: "Batch B-DSH-2026-01 expires within 45 days. Prioritize for dispatch.",
    time: "Yesterday",
    link: "/inventory",
    unread: false,
  },
];

interface NotificationsPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  onUnreadCountChange?: (count: number) => void;
  anchorPosition?: "sidebar" | "header";
}

export function NotificationsPopover({
  isOpen,
  onClose,
  onUnreadCountChange,
  anchorPosition = "sidebar",
}: NotificationsPopoverProps) {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [activeTab, setActiveTab] = useState<"all" | "unread" | "alerts">("all");

  const unreadCount = notifications.filter((n) => n.unread).length;

  const handleMarkAllAsRead = () => {
    const updated = notifications.map((n) => ({ ...n, unread: false }));
    setNotifications(updated);
    onUnreadCountChange?.(0);
  };

  const handleItemClick = (item: NotificationItem) => {
    // Mark as read
    const updated = notifications.map((n) =>
      n.id === item.id ? { ...n, unread: false } : n
    );
    setNotifications(updated);
    const newUnread = updated.filter((n) => n.unread).length;
    onUnreadCountChange?.(newUnread);

    // Close and navigate
    onClose();
    router.push(item.link);
  };

  const handleDismiss = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const updated = notifications.filter((n) => n.id !== id);
    setNotifications(updated);
    const newUnread = updated.filter((n) => n.unread).length;
    onUnreadCountChange?.(newUnread);
  };

  if (!isOpen) return null;

  const filtered = notifications.filter((item) => {
    if (activeTab === "unread") return item.unread;
    if (activeTab === "alerts") return item.type === "warning" || item.type === "alert";
    return true;
  });

  const getIcon = (category: NotificationItem["category"], type: NotificationItem["type"]) => {
    if (category === "inventory") {
      return (
        <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
          <Boxes className="w-4 h-4" />
        </div>
      );
    }
    if (category === "billing") {
      return (
        <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
          <AlertTriangle className="w-4 h-4" />
        </div>
      );
    }
    if (category === "payment") {
      return (
        <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
          <Wallet className="w-4 h-4" />
        </div>
      );
    }
    return (
      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
        <ShoppingCart className="w-4 h-4" />
      </div>
    );
  };

  const containerClasses =
    anchorPosition === "sidebar"
      ? "fixed md:absolute left-3 md:left-16 bottom-20 md:bottom-12 z-50 w-[calc(100vw-24px)] max-w-[390px]"
      : "fixed md:absolute right-3 top-16 z-50 w-[calc(100vw-24px)] max-w-[390px]";

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/10 backdrop-blur-[2px] transition-opacity"
        onClick={onClose}
      />

      {/* Popover Sheet */}
      <div
        className={cn(
          "bg-white/95 dark:bg-neutral-900/95 backdrop-blur-2xl rounded-[28px] border border-white/80 dark:border-neutral-800 shadow-[0_20px_50px_rgba(0,0,0,0.15)] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 select-none",
          containerClasses
        )}
        style={{ maxHeight: "calc(100dvh - 120px)" }}
      >
        {/* Header */}
        <div className="p-4 pb-3 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-neutral-900 text-[#D7FF00] flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 leading-none">
                Notifications
              </h3>
              <span className="text-[10px] text-neutral-500 font-light">
                {unreadCount > 0 ? `${unreadCount} unread store alerts` : "All caught up"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                className="px-2.5 py-1 rounded-full text-[11px] font-medium text-neutral-600 hover:text-black dark:text-neutral-300 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors flex items-center gap-1"
                title="Mark all as read"
              >
                <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Mark read</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="w-7 h-7 rounded-full text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center justify-center transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="px-4 py-2 border-b border-neutral-100 dark:border-neutral-800 flex items-center gap-1.5 bg-neutral-50/50 dark:bg-neutral-950/30">
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={cn(
              "px-3 py-1 rounded-full text-xs transition-all",
              activeTab === "all"
                ? "bg-black text-white font-medium shadow-sm"
                : "text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white"
            )}
          >
            All ({notifications.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("unread")}
            className={cn(
              "px-3 py-1 rounded-full text-xs transition-all flex items-center gap-1",
              activeTab === "unread"
                ? "bg-black text-white font-medium shadow-sm"
                : "text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white"
            )}
          >
            <span>Unread</span>
            {unreadCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("alerts")}
            className={cn(
              "px-3 py-1 rounded-full text-xs transition-all",
              activeTab === "alerts"
                ? "bg-black text-white font-medium shadow-sm"
                : "text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white"
            )}
          >
            Alerts
          </button>
        </div>

        {/* Notification Items List */}
        <div className="flex-1 overflow-y-auto divide-y divide-neutral-100 dark:divide-neutral-800/80 p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="py-12 px-4 text-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
              <p className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                No notifications in this view
              </p>
              <p className="text-[11px] text-neutral-500 mt-0.5 font-light">
                All inventory and store operations are running normally.
              </p>
            </div>
          ) : (
            filtered.map((item) => (
              <div
                key={item.id}
                onClick={() => handleItemClick(item)}
                className={cn(
                  "group relative p-3 rounded-2xl flex items-start gap-3 cursor-pointer transition-all hover:bg-neutral-100/70 dark:hover:bg-neutral-800/50",
                  item.unread ? "bg-amber-50/40 dark:bg-amber-950/20" : ""
                )}
              >
                {getIcon(item.category, item.type)}

                <div className="flex-1 min-w-0 pr-6">
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                      {item.title}
                    </h4>
                    {item.unread && (
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                    )}
                  </div>
                  <p className="text-[11px] text-neutral-600 dark:text-neutral-400 line-clamp-2 mt-0.5 leading-relaxed font-light">
                    {item.message}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-mono">
                      {item.time}
                    </span>
                    <span className="text-[10px] font-medium text-neutral-900 dark:text-neutral-200 group-hover:underline flex items-center">
                      View details <ChevronRight className="w-3 h-3 ml-0.5" />
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => handleDismiss(e, item.id)}
                  className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 opacity-0 group-hover:opacity-100 hover:bg-neutral-200/60 dark:hover:bg-neutral-700 flex items-center justify-center transition-all"
                  title="Dismiss notification"
                  aria-label="Dismiss"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
