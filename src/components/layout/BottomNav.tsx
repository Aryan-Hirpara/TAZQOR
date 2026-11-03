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
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/orders", label: "Orders", icon: ShoppingCart },
  { href: "/invoices", label: "Bills", icon: FileText },
];

const MORE_ITEMS = [
  { href: "/products", label: "Products", icon: Layers, desc: "Catalog & pack sizes" },
  { href: "/inventory", label: "Stock & Batches", icon: Boxes, desc: "Stock levels & FEFO batches" },
  { href: "/payments", label: "Payments", icon: Wallet, desc: "Collections & ledger" },
  { href: "/map", label: "Store Map", icon: MapPin, desc: "Customer GPS locations" },
  { href: "/visits", label: "Visits", icon: CalendarCheck, desc: "Daily route & logs" },
  { href: "/expenses", label: "Expenses", icon: Receipt, desc: "Track costs & receipts" },
  { href: "/reports", label: "Reports", icon: BarChart3, desc: "Financial analytics" },
  { href: "/settings", label: "Settings", icon: Settings, desc: "Business profile & config" },
];

export function BottomNav() {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const isMoreActive = MORE_ITEMS.some(
    (item) => pathname === item.href || pathname.startsWith(item.href)
  );

  return (
    <>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/75 backdrop-blur-xl border-t border-white/80 pb-safe shadow-lg">
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
                  "flex flex-col items-center justify-center flex-1 h-full py-1 transition-all relative",
                  isActive ? "text-black" : "text-neutral-500 hover:text-black"
                )}
              >
                <div
                  className={cn(
                    "w-9 h-9 rounded-full flex items-center justify-center transition-all",
                    isActive ? "bg-black text-[#E0FE52] shadow-sm" : "bg-transparent text-neutral-600"
                  )}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-[10px] mt-0.5 tracking-tight font-light">{item.label}</span>
              </Link>
            );
          })}

          {/* More / Menu Button */}
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className={cn(
              "flex flex-col items-center justify-center flex-1 h-full py-1 transition-all",
              isMoreActive ? "text-black" : "text-neutral-500 hover:text-black"
            )}
          >
            <div
              className={cn(
                "w-9 h-9 rounded-full flex items-center justify-center transition-all",
                isMoreActive ? "bg-black text-[#E0FE52] shadow-sm" : "bg-transparent text-neutral-600"
              )}
            >
              <Menu className="w-4 h-4" />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight font-light">More</span>
          </button>
        </div>
      </nav>

      {/* Mobile Drawer */}
      {drawerOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end bg-black/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white/95 backdrop-blur-2xl rounded-t-[32px] max-h-[85vh] overflow-y-auto p-6 pb-12 shadow-2xl border-t border-white">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
              <span className="text-sm font-medium text-neutral-900">All Modules</span>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-600 hover:text-neutral-900"
              >
                <X className="w-4 h-4" />
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
                        ? "bg-black text-white border-black"
                        : "bg-white/60 border-neutral-200/60 text-neutral-800 hover:bg-white"
                    )}
                  >
                    <div
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center mb-2",
                        isActive ? "bg-white/20 text-[#E0FE52]" : "bg-neutral-100 text-neutral-700"
                      )}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-normal leading-tight">{item.label}</span>
                    <span
                      className={cn(
                        "text-[10px] mt-0.5 line-clamp-1 font-light",
                        isActive ? "text-neutral-300" : "text-neutral-500"
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
