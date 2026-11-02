"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  ShoppingCart,
  FileText,
  Menu,
  Boxes,
  Layers,
  MapPin,
  CalendarCheck,
  Wallet,
  Receipt,
  BarChart3,
  Settings,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const PRIMARY_MOBILE_ITEMS = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/orders", label: "Orders", icon: ShoppingCart },
  { href: "/invoices", label: "Bills", icon: FileText },
];

const MORE_ITEMS = [
  { href: "/products", label: "Products & Packs", icon: Layers, desc: "Catalog & pack sizes" },
  { href: "/inventory", label: "Stock & Batches", icon: Boxes, desc: "Stock levels & FEFO batches" },
  { href: "/payments", label: "Payments & Ledger", icon: Wallet, desc: "Collections & balances" },
  { href: "/map", label: "Store Map", icon: MapPin, desc: "Customer GPS locations" },
  { href: "/visits", label: "Visits & Follow-ups", icon: CalendarCheck, desc: "Daily route & logs" },
  { href: "/expenses", label: "Business Expenses", icon: Receipt, desc: "Track costs & receipts" },
  { href: "/reports", label: "Financial Reports", icon: BarChart3, desc: "Sales, revenue & profit" },
  { href: "/settings", label: "Business Settings", icon: Settings, desc: "Tax, numbering & profile" },
];

export function BottomNav() {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const isMoreActive = MORE_ITEMS.some(
    (item) => pathname === item.href || pathname.startsWith(item.href)
  );

  return (
    <>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E5E4EE] pb-safe">
        <div className="flex items-center justify-around h-16 px-2">
          {PRIMARY_MOBILE_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center flex-1 h-full py-1 transition-colors relative",
                  isActive ? "text-[#0A0A0A] font-semibold" : "text-gray-400 hover:text-gray-600"
                )}
              >
                <div
                  className={cn(
                    "p-1 rounded-xl transition-all",
                    isActive && "bg-[#D4F732]/40"
                  )}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[11px] mt-0.5 tracking-tight">{item.label}</span>
                {isActive && (
                  <span className="absolute bottom-1 w-1 h-1 rounded-full bg-[#0A0A0A]" />
                )}
              </Link>
            );
          })}

          {/* More / Menu Button */}
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className={cn(
              "flex flex-col items-center justify-center flex-1 h-full py-1 transition-colors",
              isMoreActive ? "text-[#0A0A0A] font-semibold" : "text-gray-400 hover:text-gray-600"
            )}
          >
            <div
              className={cn(
                "p-1 rounded-xl transition-all",
                isMoreActive && "bg-[#D4F732]/40"
              )}
            >
              <Menu className="w-5 h-5" />
            </div>
            <span className="text-[11px] mt-0.5 tracking-tight">More</span>
          </button>
        </div>
      </nav>

      {/* Mobile Drawer */}
      {drawerOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-t-3xl max-h-[85vh] overflow-y-auto p-5 pb-10 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <span className="text-base font-bold text-gray-900">All Modules</span>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="p-1 rounded-full bg-gray-100 text-gray-500 hover:text-gray-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5 mt-4">
              {MORE_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setDrawerOpen(false)}
                    className={cn(
                      "flex flex-col p-3 rounded-2xl border transition-all text-left",
                      isActive
                        ? "bg-[#0A0A0A] text-white border-[#0A0A0A]"
                        : "bg-[#F9F8FD] border-[#E5E4EE] text-gray-800 hover:bg-white"
                    )}
                  >
                    <div
                      className={cn(
                        "w-8 h-8 rounded-xl flex items-center justify-center mb-2",
                        isActive ? "bg-white/20 text-[#D4F732]" : "bg-white text-gray-700 shadow-sm"
                      )}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-semibold leading-tight">{item.label}</span>
                    <span
                      className={cn(
                        "text-[10px] mt-0.5 line-clamp-1",
                        isActive ? "text-gray-300" : "text-gray-400"
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
      )}
    </>
  );
}
