"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  Plus,
  Sparkles,
  UserPlus,
  ShoppingCart,
  FilePlus,
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

interface TopHeaderProps {
  title?: string;
  subtitle?: string;
}

export function TopHeader({ title = "Dashboard", subtitle }: TopHeaderProps) {
  const router = useRouter();
  const [quickActionOpen, setQuickActionOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/customers?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const quickActions = [
    {
      title: "New Bill / Invoice",
      desc: "Create tax invoice or non-GST bill",
      icon: FilePlus,
      href: "/invoices/new",
      color: "bg-[#D4F732] text-black",
    },
    {
      title: "New Customer Order",
      desc: "Record order without moving stock",
      icon: ShoppingCart,
      href: "/orders/new",
      color: "bg-blue-50 text-blue-700",
    },
    {
      title: "Add New Customer",
      desc: "Store shop profile, contact & GPS",
      icon: UserPlus,
      href: "/customers/new",
      color: "bg-purple-50 text-purple-700",
    },
    {
      title: "Record Payment",
      desc: "Collect cash, UPI or cheque and allocate",
      icon: CreditCard,
      href: "/payments/new",
      color: "bg-emerald-50 text-emerald-700",
    },
    {
      title: "Log Shop Visit",
      desc: "Check-in, follow-up date and notes",
      icon: CalendarPlus,
      href: "/visits/new",
      color: "bg-amber-50 text-amber-700",
    },
    {
      title: "Add Expense",
      desc: "Record raw material, transport or packaging",
      icon: ReceiptText,
      href: "/expenses/new",
      color: "bg-rose-50 text-rose-700",
    },
  ];

  return (
    <>
      <header className="sticky top-0 z-20 flex items-center justify-between px-4 sm:px-8 py-3.5 bg-[#EEEDF4]/90 backdrop-blur-md border-b border-[#E5E4EE]">
        {/* Left: Title & Subtitle */}
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#0A0A0A]">
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs sm:text-sm text-gray-500 hidden sm:block">
              {subtitle}
            </p>
          )}
        </div>

        {/* Center / Right: Search & Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Search bar */}
          <form onSubmit={handleSearchSubmit} className="relative hidden md:block w-64 lg:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search shops, phones, bills..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-9 pr-4 text-xs bg-white rounded-full border border-[#E5E4EE] text-[#0A0A0A] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#D4F732] focus:border-transparent transition-all shadow-sm"
            />
          </form>

          {/* Quick Action Button */}
          <button
            type="button"
            onClick={() => setQuickActionOpen(true)}
            className="flex items-center gap-1.5 px-3.5 sm:px-4 h-10 rounded-full bg-[#0A0A0A] text-white text-xs sm:text-sm font-semibold hover:bg-black/90 active:scale-95 transition-all shadow-sm"
          >
            <Plus className="w-4 h-4 text-[#D4F732]" />
            <span className="hidden sm:inline">Quick Action</span>
            <span className="sm:hidden">Action</span>
          </button>
        </div>
      </header>

      {/* Quick Action Dialog */}
      <Dialog open={quickActionOpen} onOpenChange={setQuickActionOpen}>
        <DialogContent className="sm:max-w-md p-6 rounded-3xl bg-white border border-[#E5E4EE] shadow-2xl">
          <DialogHeader className="pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#0A0A0A] text-[#D4F732] flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <DialogTitle className="text-lg font-bold text-[#0A0A0A]">
                Quick Business Action
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
                  className="flex items-start gap-3 p-3.5 rounded-2xl border border-[#E5E4EE] hover:border-[#0A0A0A] hover:bg-[#F9F8FD] transition-all group"
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${action.color} group-hover:scale-105 transition-transform`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-gray-900 group-hover:text-black leading-tight">
                      {action.title}
                    </h4>
                    <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-1">
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
