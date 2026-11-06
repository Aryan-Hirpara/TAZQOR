"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Mail,
  Send,
  User,
  X,
  CheckCheck,
  Plus,
  MessageSquare,
  ChevronRight,
  Phone,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export interface MessageItem {
  id: string;
  sender: string;
  role: string;
  category: "customer" | "team";
  content: string;
  time: string;
  unread: boolean;
  phone?: string;
  link?: string;
}

const INITIAL_MESSAGES: MessageItem[] = [
  {
    id: "msg-1",
    sender: "Haresh Patel",
    role: "Shreeji Supermarket",
    category: "customer",
    content: "Please send the updated wholesale price list for 5 L Dish Wash refills. We need delivery by Saturday.",
    time: "10m ago",
    unread: true,
    phone: "+91 98250 11223",
  },
  {
    id: "msg-2",
    sender: "Kishan Shah",
    role: "Field Sales Rep",
    category: "team",
    content: "Store visit finished at Reliance Retail Vastrapur. Placed draft order for 35 cases of Citrus Cleaner.",
    time: "45m ago",
    unread: true,
    link: "/orders",
  },
  {
    id: "msg-3",
    sender: "Hemant Mehta",
    role: "Accounts & Tax",
    category: "team",
    content: "January GSTR-1 reconciled. All 42 B2B invoices matched against GST portal.",
    time: "2h ago",
    unread: false,
    link: "/invoices",
  },
  {
    id: "msg-4",
    sender: "Central Warehouse",
    role: "Logistics Team",
    category: "team",
    content: "Batch B-FLR-2026-01 packaging complete. Ready for outbound transporter pickup.",
    time: "Yesterday",
    unread: false,
    link: "/inventory",
  },
];

interface MessagesPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  onUnreadCountChange?: (count: number) => void;
  anchorPosition?: "sidebar" | "header";
}

export function MessagesPopover({
  isOpen,
  onClose,
  onUnreadCountChange,
  anchorPosition = "sidebar",
}: MessagesPopoverProps) {
  const router = useRouter();
  const [messages, setMessages] = useState<MessageItem[]>(INITIAL_MESSAGES);
  const [activeTab, setActiveTab] = useState<"all" | "customer" | "team">("all");
  const [selectedMessage, setSelectedMessage] = useState<MessageItem | null>(null);
  const [replyText, setReplyText] = useState("");
  const [isReplying, setIsReplying] = useState(false);

  const unreadCount = messages.filter((m) => m.unread).length;

  const handleMarkAllAsRead = () => {
    const updated = messages.map((m) => ({ ...m, unread: false }));
    setMessages(updated);
    onUnreadCountChange?.(0);
    toast.success("All messages marked as read");
  };

  const handleSelectMessage = (item: MessageItem) => {
    // Mark as read
    const updated = messages.map((m) =>
      m.id === item.id ? { ...m, unread: false } : m
    );
    setMessages(updated);
    const newUnread = updated.filter((m) => m.unread).length;
    onUnreadCountChange?.(newUnread);

    setSelectedMessage(item);
    setReplyText("");
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedMessage) return;

    setIsReplying(true);
    setTimeout(() => {
      toast.success(`Reply sent to ${selectedMessage.sender}!`);
      setIsReplying(false);
      setReplyText("");
      setSelectedMessage(null);
    }, 500);
  };

  if (!isOpen) return null;

  const filtered = messages.filter((item) => {
    if (activeTab === "customer") return item.category === "customer";
    if (activeTab === "team") return item.category === "team";
    return true;
  });

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  const containerClasses =
    anchorPosition === "sidebar"
      ? "fixed md:absolute left-3 md:left-16 bottom-20 md:bottom-20 z-50 w-[calc(100vw-24px)] max-w-[390px]"
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
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 leading-none">
                Store Messages
              </h3>
              <span className="text-[10px] text-neutral-500 font-light">
                {unreadCount > 0 ? `${unreadCount} unread communications` : "All messages read"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {unreadCount > 0 && !selectedMessage && (
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

        {/* View Details / Reply Panel */}
        {selectedMessage ? (
          <div className="p-4 flex flex-col space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-black text-[#D7FF00] font-semibold text-xs flex items-center justify-center">
                  {getInitials(selectedMessage.sender)}
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                    {selectedMessage.sender}
                  </h4>
                  <p className="text-[10px] text-neutral-500 font-light">
                    {selectedMessage.role}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedMessage(null)}
                className="text-[11px] text-neutral-500 hover:text-black dark:hover:text-white underline"
              >
                Back to list
              </button>
            </div>

            <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-2xl p-3 border border-neutral-100 dark:border-neutral-700/50 text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed font-light">
              {selectedMessage.content}
            </div>

            {selectedMessage.link && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  router.push(selectedMessage.link!);
                }}
                className="w-full py-1.5 px-3 rounded-full bg-neutral-100 dark:bg-neutral-800 text-xs font-medium text-neutral-800 dark:text-neutral-200 hover:bg-black hover:text-white transition-colors flex items-center justify-center gap-1.5"
              >
                <span>Go to associated page</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Quick Reply Form */}
            <form onSubmit={handleSendReply} className="pt-2 space-y-2">
              <div className="relative">
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={`Reply to ${selectedMessage.sender}...`}
                  className="w-full h-10 pl-3 pr-10 text-xs rounded-full bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-[#D7FF00]"
                />
                <button
                  type="submit"
                  disabled={!replyText.trim() || isReplying}
                  className="absolute right-1.5 top-1.5 w-7 h-7 rounded-full bg-black text-[#D7FF00] disabled:opacity-40 flex items-center justify-center cursor-pointer transition-opacity"
                  title="Send message"
                >
                  <Send className="w-3 h-3" />
                </button>
              </div>
            </form>
          </div>
        ) : (
          <>
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
                All ({messages.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("customer")}
                className={cn(
                  "px-3 py-1 rounded-full text-xs transition-all",
                  activeTab === "customer"
                    ? "bg-black text-white font-medium shadow-sm"
                    : "text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white"
                )}
              >
                Customers
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("team")}
                className={cn(
                  "px-3 py-1 rounded-full text-xs transition-all",
                  activeTab === "team"
                    ? "bg-black text-white font-medium shadow-sm"
                    : "text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white"
                )}
              >
                Field Team
              </button>
            </div>

            {/* Messages List */}
            <div className="flex-1 overflow-y-auto divide-y divide-neutral-100 dark:divide-neutral-800/80 p-2 space-y-1">
              {filtered.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleSelectMessage(item)}
                  className={cn(
                    "group p-3 rounded-2xl flex items-start gap-3 cursor-pointer transition-all hover:bg-neutral-100/70 dark:hover:bg-neutral-800/50",
                    item.unread ? "bg-lime-50/30 dark:bg-lime-950/20" : ""
                  )}
                >
                  <div className="w-8 h-8 rounded-full bg-black text-[#D7FF00] font-semibold text-xs flex items-center justify-center shrink-0">
                    {getInitials(item.sender)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <h4 className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                          {item.sender}
                        </h4>
                        {item.unread && (
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                        )}
                      </div>
                      <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-mono shrink-0">
                        {item.time}
                      </span>
                    </div>

                    <p className="text-[10px] text-neutral-500 font-light truncate">
                      {item.role}
                    </p>

                    <p className="text-[11px] text-neutral-600 dark:text-neutral-400 line-clamp-2 mt-1 leading-snug font-light">
                      {item.content}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}
