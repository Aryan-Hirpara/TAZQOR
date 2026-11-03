"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Sparkles,
  ChevronDown,
  Grid3X3,
  Plus,
  Search,
  FilePlus,
  ShoppingCart,
  UserPlus,
  CreditCard,
  CalendarPlus,
  ReceiptText,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface TopHeaderProps {
  title?: string;
  subtitle?: string;
  period?: "today" | "week" | "month";
  onPeriodChange?: (period: "today" | "week" | "month") => void;
}

export function TopHeader({
  title,
  subtitle,
  period = "month",
  onPeriodChange,
}: TopHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [quickActionOpen, setQuickActionOpen] = useState(false);
  const [outletMenuOpen, setOutletMenuOpen] = useState(false);
  const [selectedOutlet, setSelectedOutlet] = useState("All Outlets");

  const isDashboard = pathname === "/dashboard" || pathname === "/";

  const quickActions = [
    {
      title: "New Bill / Invoice",
      desc: "Create tax invoice or non-GST bill",
      icon: FilePlus,
      href: "/invoices/new",
      color: "bg-[#E0FE52] text-black",
    },
    {
      title: "New Customer Order",
      desc: "Record order without moving stock",
      icon: ShoppingCart,
      href: "/orders/new",
      color: "bg-blue-100 text-blue-800",
    },
    {
      title: "Add New Customer",
      desc: "Store shop profile, contact & GPS",
      icon: UserPlus,
      href: "/customers/new",
      color: "bg-purple-100 text-purple-800",
    },
    {
      title: "Record Payment",
      desc: "Collect cash, UPI or cheque and allocate",
      icon: CreditCard,
      href: "/payments/new",
      color: "bg-emerald-100 text-emerald-800",
    },
    {
      title: "Log Shop Visit",
      desc: "Check-in, follow-up date and notes",
      icon: CalendarPlus,
      href: "/visits/new",
      color: "bg-amber-100 text-amber-800",
    },
    {
      title: "Add Expense",
      desc: "Record raw material, transport or packaging",
      icon: ReceiptText,
      href: "/expenses/new",
      color: "bg-rose-100 text-rose-800",
    },
  ];

  return (
    <>
      <header className="w-full h-[84px] flex items-center justify-between px-2 sm:px-4 bg-transparent select-none z-20">
        {/* Left: Brand Logo & Title */}
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-2.5 group"
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-black text-[#E0FE52] shadow-sm">
              <Sparkles className="w-4 h-4 fill-current" />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-neutral-900 tracking-tight text-base sm:text-lg leading-tight">
                TAZQOR
              </span>
              {title && !isDashboard && (
                <span className="text-[11px] font-light text-neutral-600 leading-tight">
                  {title}
                </span>
              )}
            </div>
          </Link>
        </div>

        {/* Center: Segmented Floating Pill Tabs */}
        <div className="flex items-center gap-1 p-1 bg-white/45 backdrop-blur-md rounded-full border border-white/60 shadow-sm">
          <button
            type="button"
            onClick={() => onPeriodChange ? onPeriodChange("today") : router.push("/dashboard")}
            className={cn(
              "px-4 sm:px-5 py-1.5 text-xs sm:text-sm font-light rounded-full transition-all",
              period === "today" && isDashboard
                ? "bg-black text-white shadow-sm font-normal"
                : "text-neutral-700 hover:text-black hover:bg-white/50"
            )}
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => onPeriodChange ? onPeriodChange("week") : router.push("/dashboard")}
            className={cn(
              "px-4 sm:px-5 py-1.5 text-xs sm:text-sm font-light rounded-full transition-all",
              period === "week" && isDashboard
                ? "bg-black text-white shadow-sm font-normal"
                : "text-neutral-700 hover:text-black hover:bg-white/50"
            )}
          >
            This Week
          </button>
          <button
            type="button"
            onClick={() => onPeriodChange ? onPeriodChange("month") : router.push("/dashboard")}
            className={cn(
              "px-4 sm:px-5 py-1.5 text-xs sm:text-sm font-light rounded-full transition-all",
              period === "month" && isDashboard
                ? "bg-black text-white shadow-sm font-normal"
                : "text-neutral-700 hover:text-black hover:bg-white/50"
            )}
          >
            This Month
          </button>
          <Link
            href="/reports"
            className={cn(
              "px-4 sm:px-5 py-1.5 text-xs sm:text-sm font-light rounded-full transition-all",
              pathname === "/reports"
                ? "bg-black text-white shadow-sm font-normal"
                : "text-neutral-700 hover:text-black hover:bg-white/50"
            )}
          >
            Reports
          </Link>
        </div>

        {/* Right: Outlets Filter Pill + Quick Action + Grid Button */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Outlets Pill */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setOutletMenuOpen(!outletMenuOpen)}
              className="flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 bg-white/55 backdrop-blur-md rounded-full border border-white/70 text-xs sm:text-sm font-light text-neutral-800 hover:bg-white/80 transition-all shadow-sm"
            >
              <span>{selectedOutlet}</span>
              <ChevronDown className="w-3.5 h-3.5 text-neutral-500" />
            </button>

            {outletMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white/95 backdrop-blur-xl rounded-2xl border border-white shadow-xl py-1 z-50">
                {["All Outlets", "Central Warehouse", "Ahmedabad Retail", "Surat Hub"].map(
                  (outlet) => (
                    <button
                      key={outlet}
                      type="button"
                      onClick={() => {
                        setSelectedOutlet(outlet);
                        setOutletMenuOpen(false);
                      }}
                      className={cn(
                        "w-full text-left px-4 py-2 text-xs font-light hover:bg-neutral-100 transition-colors",
                        selectedOutlet === outlet ? "font-normal text-black bg-neutral-50" : "text-neutral-600"
                      )}
                    >
                      {outlet}
                    </button>
                  )
                )}
              </div>
            )}
          </div>

          {/* Quick Action Pill Button */}
          <button
            type="button"
            onClick={() => setQuickActionOpen(true)}
            className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-full bg-white/70 hover:bg-white text-black text-xs sm:text-sm font-light border border-white/80 shadow-sm transition-all active:scale-95"
            title="Create Bill, Order, Customer or Expense"
          >
            <Plus className="w-3.5 h-3.5 text-black" />
            <span className="hidden lg:inline">Quick Action</span>
          </button>

          {/* Black Circular 3x3 Grid Icon Button */}
          <button
            type="button"
            onClick={() => setQuickActionOpen(true)}
            className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black text-white hover:scale-105 active:scale-95 transition-all shadow-md"
            title="Menu & Quick Launch"
          >
            <Grid3X3 className="w-4 h-4 text-white" />
          </button>
        </div>
      </header>

      {/* Quick Action Modal */}
      <Dialog open={quickActionOpen} onOpenChange={setQuickActionOpen}>
        <DialogContent className="sm:max-w-md p-6 rounded-[28px] bg-white/95 backdrop-blur-2xl border border-white shadow-2xl">
          <DialogHeader className="pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-black text-[#E0FE52] flex items-center justify-center">
                <Sparkles className="w-4 h-4 fill-current" />
              </div>
              <DialogTitle className="text-base font-normal text-neutral-900">
                Quick Action
              </DialogTitle>
            </div>
          </DialogHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.title}
                  href={action.href}
                  onClick={() => setQuickActionOpen(false)}
                  className="flex items-start gap-3 p-3.5 rounded-2xl border border-neutral-200/70 hover:border-black hover:bg-neutral-50/80 transition-all group"
                >
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-transform group-hover:scale-105",
                      action.color
                    )}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-medium text-neutral-900 group-hover:text-black leading-tight">
                      {action.title}
                    </h4>
                    <p className="text-[11px] text-neutral-500 mt-0.5 line-clamp-1 font-light">
                      {action.desc}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
