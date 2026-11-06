"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  X,
  Search,
  Plus,
  FilePlus,
  ShoppingCart,
  UserPlus,
  CreditCard,
  CalendarPlus,
  Receipt,
  Layers,
  Boxes,
  Wallet,
  MapPin,
  CalendarCheck,
  BarChart3,
  Settings,
  Sun,
  Moon,
  LogOut,
  Bell,
  Users,
  LayoutDashboard,
  FileText,
  Sparkles,
} from "lucide-react";
import { TazqorLogo } from "@/components/brand/TazqorLogo";
import { cn } from "@/lib/utils";

interface MoreLauncherSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MoreLauncherSheet({ isOpen, onClose }: MoreLauncherSheetProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [isDark, setIsDark] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  // Ensure dark mode is disabled so text is always high-contrast and readable
  useEffect(() => {
    if (typeof window !== "undefined") {
      document.documentElement.classList.remove("dark");
      localStorage.removeItem("tazqor-theme");
    }
  }, []);

  // Close on Escape & Lock body scroll while open
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Focus input on open
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, onClose]);

  // Close on route change
  useEffect(() => {
    if (isOpen) {
      onClose();
    }
  }, [pathname]);

  if (!isOpen) return null;

  const quickActions = [
    { title: "Add Customer", icon: UserPlus, href: "/customers/new" },
    { title: "New Order", icon: ShoppingCart, href: "/orders/new" },
    { title: "Create Bill", icon: FilePlus, href: "/invoices/new" },
    { title: "Record Payment", icon: CreditCard, href: "/payments/new" },
    { title: "Record Visit", icon: CalendarPlus, href: "/visits/new" },
    { title: "Add Expense", icon: Receipt, href: "/expenses/new" },
  ];

  const allModules = [
    { title: "Dashboard", desc: "Overview & stores pulse", icon: LayoutDashboard, href: "/dashboard" },
    { title: "Customers", desc: "Retail clients & credit", icon: Users, href: "/customers" },
    { title: "Orders", desc: "Dispatch & tracking", icon: ShoppingCart, href: "/orders" },
    { title: "Bills & Invoices", desc: "GST & cash invoices", icon: FileText, href: "/invoices" },
    { title: "Payments", desc: "Collections & ledger", icon: Wallet, href: "/payments" },
    { title: "Stock & Batches", desc: "FEFO batches & inventory", icon: Boxes, href: "/inventory" },
    { title: "Products & Packs", desc: "Catalog & price tiers", icon: Layers, href: "/products" },
    { title: "Store Map", desc: "Customer GPS locations", icon: MapPin, href: "/map" },
    { title: "Visits", desc: "Field route & beat logs", icon: CalendarCheck, href: "/visits" },
    { title: "Expenses", desc: "Operational & direct costs", icon: Receipt, href: "/expenses" },
    { title: "Reports", desc: "Financial P&L & analytics", icon: BarChart3, href: "/reports" },
    { title: "Settings", desc: "Business profile & series", icon: Settings, href: "/settings" },
  ];

  const filteredQuickActions = quickActions.filter((a) =>
    a.title.toLowerCase().includes(search.toLowerCase())
  );

  const filteredModules = allModules.filter(
    (m) =>
      m.title.toLowerCase().includes(search.toLowerCase()) ||
      m.desc.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end bg-black/50 backdrop-blur-sm animate-in fade-in"
      role="dialog"
      aria-modal="true"
      aria-label="App Launcher & Navigation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={sheetRef}
        className="w-full bg-white dark:bg-[#1C1C1A] text-neutral-900 dark:text-neutral-100 rounded-t-[32px] max-h-[92dvh] flex flex-col border-t border-white/80 dark:border-white/10 shadow-2xl overflow-hidden"
      >
        {/* Drag handle pill */}
        <div className="w-full flex items-center justify-center pt-3 pb-1 cursor-grab" onClick={onClose}>
          <div className="w-12 h-1.5 rounded-full bg-neutral-300 dark:bg-neutral-700" />
        </div>

        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <TazqorLogo className="h-6 w-auto object-contain" height={24} variant={isDark ? "dark" : "black"} />
          </div>

          <div className="flex items-center gap-2">
            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-600 hover:text-black hover:scale-105 active:scale-95 transition-all"
              aria-label="Close menu"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Global Live Search Bar */}
        <div className="p-4 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Jump to route or action..."
              className="w-full h-10 pl-10 pr-4 text-xs bg-white dark:bg-neutral-800 rounded-full border border-neutral-200 dark:border-neutral-700 placeholder-neutral-400 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-[#D7FF00] transition-all"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Quick Actions */}
          {filteredQuickActions.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2.5 px-1">
                <span className="text-xs font-semibold tracking-tight text-neutral-500 uppercase">
                  Quick Actions
                </span>
                <span className="text-[11px] text-neutral-400 font-light">1-tap create</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {filteredQuickActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <Link
                      key={action.href}
                      href={action.href}
                      onClick={onClose}
                      className="flex items-center gap-2.5 p-3 rounded-2xl bg-neutral-100/70 dark:bg-neutral-800/60 hover:bg-black hover:text-white dark:hover:bg-[#D7FF00] dark:hover:text-black transition-all group border border-transparent dark:border-neutral-700/50"
                    >
                      <div className="w-7 h-7 rounded-full bg-white dark:bg-neutral-700 flex items-center justify-center shrink-0 group-hover:bg-neutral-800 dark:group-hover:bg-black text-neutral-800 dark:text-neutral-200 group-hover:text-[#D7FF00] transition-colors">
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-medium truncate">{action.title}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* All Application Modules */}
          <div>
            <div className="flex items-center justify-between mb-2.5 px-1">
              <span className="text-xs font-semibold tracking-tight text-neutral-500 uppercase">
                All Modules ({filteredModules.length})
              </span>
              <span className="text-[11px] text-neutral-400 font-light">Full desktop parity</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {filteredModules.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      "flex flex-col p-3 rounded-2xl border transition-all text-left group",
                      isActive
                        ? "bg-black text-white border-black dark:bg-[#D7FF00] dark:text-black dark:border-[#D7FF00]"
                        : "bg-white/70 dark:bg-neutral-800/40 border-neutral-200/70 dark:border-neutral-700/60 text-neutral-900 dark:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                    )}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div
                        className={cn(
                          "w-7 h-7 rounded-full flex items-center justify-center transition-colors",
                          isActive
                            ? "bg-white/20 dark:bg-black/15 text-[#D7FF00] dark:text-black"
                            : "bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 group-hover:bg-black group-hover:text-[#D7FF00]"
                        )}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      {isActive && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#D7FF00] text-black dark:bg-black dark:text-[#D7FF00] font-semibold">
                          Active
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-medium leading-tight truncate">{item.title}</span>
                    <span
                      className={cn(
                        "text-[10px] mt-0.5 line-clamp-1 font-light",
                        isActive ? "text-neutral-300 dark:text-neutral-800" : "text-neutral-500 dark:text-neutral-400"
                      )}
                    >
                      {item.desc}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Info & Sign out */}
        <div className="p-4 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-900/70 flex items-center justify-between text-xs font-light text-neutral-600 dark:text-neutral-400">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-black text-[#D7FF00] flex items-center justify-center text-[10px] font-semibold">
              TQ
            </div>
            <span>TAZQOR Enterprise</span>
          </div>

          <button
            type="button"
            onClick={async () => {
              onClose();
              try {
                await fetch("/api/auth/logout", { method: "POST" });
              } catch {
                // best effort
              }
              router.push("/login");
              router.refresh();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}

