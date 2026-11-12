"use client";

import React, { useState, useEffect } from "react";
import {
  Mail,
  Send,
  User,
  X,
  CheckCheck,
  Plus,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Paperclip,
  Check,
  AlertCircle,
  KeyRound,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export interface MailMessage {
  id: string;
  uid: number;
  subject: string;
  fromName: string;
  fromEmail: string;
  toEmail: string;
  date: string;
  snippet: string;
  htmlBody: string;
  textBody: string;
  unread: boolean;
  hasAttachments: boolean;
}

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
  const [messages, setMessages] = useState<MailMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [requiresAppPassword, setRequiresAppPassword] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "unread" | "inquiries">("all");
  const [selectedEmail, setSelectedEmail] = useState<MailMessage | null>(null);

  // Quick reply & compose states
  const [replyText, setReplyText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isComposing, setIsComposing] = useState(false);
  const [composeTo, setComposeTo] = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");

  // App Password setup modal / banner state
  const [showConfig, setShowConfig] = useState(false);
  const [connectEmail, setConnectEmail] = useState("");
  const [appPasswordInput, setAppPasswordInput] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [mailboxEmail, setMailboxEmail] = useState("");

  // Fetch inbox from API
  const fetchInbox = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/mail/inbox");
      const data = await res.json();
      if (data && Array.isArray(data.messages)) {
        setMessages(data.messages);
        setIsLive(Boolean(data.isLive));
        setRequiresAppPassword(Boolean(data.requiresAppPassword));
        if (data.email) {
          setMailboxEmail(data.email);
          setConnectEmail((prev) => prev || data.email);
        }
        const unread = data.messages.filter((m: MailMessage) => m.unread).length;
        onUnreadCountChange?.(unread);
      }
    } catch (err) {
      console.warn("Could not fetch mail inbox:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInbox();
  }, [isOpen]);

  const unreadCount = messages.filter((m) => m.unread).length;

  const handleMarkAllAsRead = () => {
    const updated = messages.map((m) => ({ ...m, unread: false }));
    setMessages(updated);
    onUnreadCountChange?.(0);
    toast.success("All emails marked as read");
  };

  const handleSelectEmail = (msg: MailMessage) => {
    const updated = messages.map((m) =>
      m.id === msg.id ? { ...m, unread: false } : m
    );
    setMessages(updated);
    onUnreadCountChange?.(updated.filter((m) => m.unread).length);

    setSelectedEmail(msg);
    setReplyText("");
    setIsComposing(false);
  };

  // Send Reply
  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedEmail) return;

    setIsSending(true);
    try {
      const res = await fetch("/api/mail/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: selectedEmail.fromEmail,
          subject: selectedEmail.subject.startsWith("Re:")
            ? selectedEmail.subject
            : `Re: ${selectedEmail.subject}`,
          text: replyText.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send email");

      toast.success(`Reply sent to ${selectedEmail.fromEmail}!`);
      setReplyText("");
      setSelectedEmail(null);
    } catch (err: any) {
      toast.error(err?.message || "Failed to send email");
    } finally {
      setIsSending(false);
    }
  };

  // Send New Composed Email
  const handleSendComposed = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!composeTo.trim() || !composeSubject.trim() || !composeBody.trim()) {
      toast.error("Please fill recipient, subject, and message body.");
      return;
    }

    setIsSending(true);
    try {
      const res = await fetch("/api/mail/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: composeTo.trim(),
          subject: composeSubject.trim(),
          text: composeBody.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send email");

      toast.success(`Email sent to ${composeTo.trim()}!`);
      setComposeTo("");
      setComposeSubject("");
      setComposeBody("");
      setIsComposing(false);
    } catch (err: any) {
      toast.error(err?.message || "Failed to send email");
    } finally {
      setIsSending(false);
    }
  };

  // Connect Google App Password
  const handleConnectAppPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appPasswordInput.trim() || !connectEmail.trim()) {
      toast.error("Please enter both your email address and Google App Password.");
      return;
    }

    setIsConnecting(true);
    try {
      const res = await fetch("/api/mail/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: connectEmail.trim(),
          appPassword: appPasswordInput.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to connect to Gmail");

      toast.success(`Connected to live Gmail inbox ${connectEmail.trim()}!`);
      setMailboxEmail(connectEmail.trim());
      setShowConfig(false);
      setAppPasswordInput("");
      fetchInbox();
    } catch (err: any) {
      toast.error(err?.message || "Failed to authenticate with Gmail");
    } finally {
      setIsConnecting(false);
    }
  };

  if (!isOpen) return null;

  const filtered = messages.filter((item) => {
    if (activeTab === "unread") return item.unread;
    if (activeTab === "inquiries") {
      return (
        item.subject.toLowerCase().includes("order") ||
        item.subject.toLowerCase().includes("quotation") ||
        item.snippet.toLowerCase().includes("wholesale")
      );
    }
    return true;
  });

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - d.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 60) return `${Math.max(1, diffMins)}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      return d.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
    } catch {
      return dateStr;
    }
  };

  const containerClasses =
    anchorPosition === "sidebar"
      ? "fixed md:absolute left-3 md:left-16 bottom-20 md:bottom-16 z-50 w-[calc(100vw-24px)] max-w-[420px]"
      : "fixed md:absolute right-3 top-16 z-50 w-[calc(100vw-24px)] max-w-[420px]";

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/15 backdrop-blur-[2px] transition-opacity"
        onClick={onClose}
      />

      {/* Popover Sheet */}
      <div
        className={cn(
          "bg-white/95 dark:bg-neutral-900/95 backdrop-blur-2xl rounded-[28px] border border-white/80 dark:border-neutral-800 shadow-[0_20px_50px_rgba(0,0,0,0.18)] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 select-none z-50",
          containerClasses
        )}
        style={{ height: "560px", maxHeight: "calc(100dvh - 100px)" }}
      >
        {/* Header */}
        <div className="p-4 pb-3 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-black text-[#D7FF00] flex items-center justify-center shrink-0">
              <Mail className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 truncate leading-none">
                  {mailboxEmail || "Business Inbox"}
                </h3>
                {isLive ? (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400">
                    Live Sync
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowConfig(!showConfig)}
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-medium bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400 hover:underline cursor-pointer"
                  >
                    <KeyRound className="w-2.5 h-2.5" />
                    <span>Setup Live Sync</span>
                  </button>
                )}
              </div>
              <span className="text-[10px] text-neutral-500 font-light block truncate mt-0.5">
                {unreadCount > 0 ? `${unreadCount} unread emails` : "All emails read"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={fetchInbox}
              disabled={loading}
              className="w-7 h-7 rounded-full text-neutral-500 hover:text-black dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center justify-center transition-colors disabled:opacity-50"
              title="Refresh inbox"
            >
              <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin text-black dark:text-[#D7FF00]")} />
            </button>

            {!isComposing && !selectedEmail && (
              <button
                type="button"
                onClick={() => setIsComposing(true)}
                className="px-2.5 py-1 rounded-full bg-black text-[#D7FF00] text-[11px] font-medium flex items-center gap-1 hover:bg-black/90 active:scale-95 transition-all cursor-pointer"
                title="Compose new email"
              >
                <Plus className="w-3 h-3" />
                <span>Compose</span>
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

        {/* Live App Password Connect Drawer Banner */}
        {showConfig && (
          <div className="p-3 bg-amber-50/90 dark:bg-amber-950/40 border-b border-amber-200/60 dark:border-amber-800/40 text-xs animate-in slide-in-from-top-2">
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1">
                <p className="font-semibold text-amber-900 dark:text-amber-200">
                  Connect Live Gmail Mailbox
                </p>
                <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80 leading-relaxed font-light">
                  Enter your Gmail address and Google 16-character App Password.
                </p>
              </div>
              <a
                href="https://myaccount.google.com/apppasswords"
                target="_blank"
                rel="noreferrer"
                className="text-[10px] text-amber-900 dark:text-amber-200 underline font-medium inline-flex items-center gap-0.5 shrink-0"
              >
                <span>Get Code</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>

            <form onSubmit={handleConnectAppPassword} className="mt-2.5 space-y-2">
              <input
                type="email"
                required
                value={connectEmail}
                onChange={(e) => setConnectEmail(e.target.value)}
                placeholder="your-business@gmail.com"
                className="w-full h-8 px-2.5 rounded-xl bg-white dark:bg-neutral-800 border border-amber-300 dark:border-amber-700 text-xs text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-black"
              />
              <div className="flex items-center gap-2">
                <input
                  type="password"
                  value={appPasswordInput}
                  onChange={(e) => setAppPasswordInput(e.target.value)}
                  placeholder="16-char Google App Password"
                  className="flex-1 h-8 px-2.5 rounded-xl bg-white dark:bg-neutral-800 border border-amber-300 dark:border-amber-700 text-xs text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-black"
                />
                <button
                  type="submit"
                  disabled={!connectEmail.trim() || !appPasswordInput.trim() || isConnecting}
                  className="h-8 px-3 rounded-xl bg-black text-[#D7FF00] font-semibold text-xs disabled:opacity-50 hover:bg-black/90 active:scale-95 transition-all shrink-0 cursor-pointer"
                >
                  {isConnecting ? "Connecting..." : "Connect"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ==================== VIEW 1: COMPOSE NEW EMAIL ==================== */}
        {isComposing ? (
          <div className="flex-1 p-4 flex flex-col space-y-3 overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-neutral-800">
              <h4 className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                New Email{mailboxEmail ? ` from ${mailboxEmail}` : ""}
              </h4>
              <button
                type="button"
                onClick={() => setIsComposing(false)}
                className="text-xs text-neutral-500 hover:text-black dark:hover:text-white underline cursor-pointer"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleSendComposed} className="flex-1 flex flex-col space-y-2.5">
              <div>
                <label className="text-[10px] font-semibold text-neutral-500 uppercase block mb-1">
                  To (Recipient Email)
                </label>
                <input
                  type="email"
                  required
                  value={composeTo}
                  onChange={(e) => setComposeTo(e.target.value)}
                  placeholder="customer@domain.com"
                  className="w-full h-9 px-3 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold text-neutral-500 uppercase block mb-1">
                  Subject
                </label>
                <input
                  type="text"
                  required
                  value={composeSubject}
                  onChange={(e) => setComposeSubject(e.target.value)}
                  placeholder="Quotation / Invoice / Inquiry"
                  className="w-full h-9 px-3 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              <div className="flex-1 flex flex-col">
                <label className="text-[10px] font-semibold text-neutral-500 uppercase block mb-1">
                  Message Body
                </label>
                <textarea
                  required
                  rows={6}
                  value={composeBody}
                  onChange={(e) => setComposeBody(e.target.value)}
                  placeholder="Type your message here..."
                  className="flex-1 w-full p-3 rounded-2xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-black resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isSending}
                  className="h-9 px-4 rounded-full bg-black text-[#D7FF00] font-semibold text-xs flex items-center gap-1.5 shadow-sm hover:bg-black/90 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSending ? "Sending..." : "Send Email"}</span>
                </button>
              </div>
            </form>
          </div>
        ) : selectedEmail ? (
          /* ==================== VIEW 2: EMAIL READING & REPLY ==================== */
          <div className="flex-1 p-4 flex flex-col space-y-3 overflow-y-auto">
            {/* Subject and Back to Inbox */}
            <div className="flex items-start justify-between gap-2 pb-2 border-b border-neutral-100 dark:border-neutral-800">
              <div className="min-w-0">
                <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 leading-snug">
                  {selectedEmail.subject}
                </h4>
                <div className="flex items-center gap-1.5 mt-1 text-[11px] text-neutral-500">
                  <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                    {selectedEmail.fromName}
                  </span>
                  <span>&lt;{selectedEmail.fromEmail}&gt;</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedEmail(null)}
                className="text-xs text-neutral-500 hover:text-black dark:hover:text-white underline shrink-0 cursor-pointer"
              >
                Back to Inbox
              </button>
            </div>

            {/* Email Body Content */}
            <div className="flex-1 bg-neutral-50/70 dark:bg-neutral-800/40 rounded-2xl p-3.5 border border-neutral-100 dark:border-neutral-700/50 text-xs text-neutral-800 dark:text-neutral-200 leading-relaxed font-light overflow-y-auto">
              <div
                dangerouslySetInnerHTML={{ __html: selectedEmail.htmlBody || selectedEmail.textBody.replace(/\n/g, "<br/>") }}
              />
            </div>

            {/* Quick Reply Box */}
            <form onSubmit={handleSendReply} className="pt-1 space-y-2">
              <div className="relative">
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={`Reply to ${selectedEmail.fromEmail}...`}
                  className="w-full h-10 pl-3 pr-10 text-xs rounded-full bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-black"
                />
                <button
                  type="submit"
                  disabled={!replyText.trim() || isSending}
                  className="absolute right-1.5 top-1.5 w-7 h-7 rounded-full bg-black text-[#D7FF00] disabled:opacity-40 flex items-center justify-center cursor-pointer transition-opacity"
                  title="Send reply"
                >
                  <Send className="w-3 h-3" />
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* ==================== VIEW 3: INBOX EMAIL LIST ==================== */
          <>
            {/* Filter Tabs */}
            <div className="px-4 py-2 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between bg-neutral-50/50 dark:bg-neutral-950/30">
              <div className="flex items-center gap-1.5">
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
                  Inbox ({messages.length})
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
                  onClick={() => setActiveTab("inquiries")}
                  className={cn(
                    "px-3 py-1 rounded-full text-xs transition-all",
                    activeTab === "inquiries"
                      ? "bg-black text-white font-medium shadow-sm"
                      : "text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white"
                  )}
                >
                  Orders & Rates
                </button>
              </div>

              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllAsRead}
                  className="text-[11px] font-medium text-neutral-500 hover:text-black dark:hover:text-white flex items-center gap-1 cursor-pointer"
                  title="Mark all as read"
                >
                  <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Mark read</span>
                </button>
              )}
            </div>

            {/* Email Rows List */}
            <div className="flex-1 overflow-y-auto divide-y divide-neutral-100 dark:divide-neutral-800/80 p-2 space-y-1">
              {loading ? (
                <div className="py-16 text-center text-xs text-neutral-400 flex flex-col items-center justify-center gap-2">
                  <RefreshCw className="w-5 h-5 animate-spin text-neutral-600" />
                  <span>{mailboxEmail ? `Fetching emails from ${mailboxEmail}...` : "Fetching inbox..."}</span>
                </div>
              ) : filtered.length === 0 ? (
                <div className="py-16 text-center text-xs text-neutral-400">
                  <Mail className="w-7 h-7 mx-auto mb-2 opacity-50" />
                  <span>No emails found in this view.</span>
                </div>
              ) : (
                filtered.map((msg) => (
                  <div
                    key={msg.id}
                    onClick={() => handleSelectEmail(msg)}
                    className={cn(
                      "group p-3 rounded-2xl flex items-start gap-3 cursor-pointer transition-all hover:bg-neutral-100/70 dark:hover:bg-neutral-800/50",
                      msg.unread ? "bg-lime-50/30 dark:bg-lime-950/20" : ""
                    )}
                  >
                    <div className="w-8 h-8 rounded-full bg-black text-[#D7FF00] font-semibold text-xs flex items-center justify-center shrink-0">
                      {msg.fromName
                        .split(" ")
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join("")
                        .toUpperCase() || "M"}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <h4 className={cn("text-xs truncate", msg.unread ? "font-bold text-neutral-950 dark:text-white" : "font-semibold text-neutral-800 dark:text-neutral-200")}>
                            {msg.fromName}
                          </h4>
                          {msg.unread && (
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                          )}
                          {msg.hasAttachments && (
                            <Paperclip className="w-3 h-3 text-neutral-400 shrink-0" />
                          )}
                        </div>
                        <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-mono shrink-0">
                          {formatDate(msg.date)}
                        </span>
                      </div>

                      <h5 className={cn("text-[11px] truncate mt-0.5", msg.unread ? "font-semibold text-neutral-900 dark:text-neutral-100" : "text-neutral-600 dark:text-neutral-400")}>
                        {msg.subject}
                      </h5>

                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400 line-clamp-1 mt-0.5 leading-snug font-light">
                        {msg.snippet}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}
