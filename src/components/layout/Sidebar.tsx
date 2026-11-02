"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  ShoppingCart,
  Boxes,
  Users,
  Layers,
  BarChart3,
  MapPin,
  CalendarCheck,
  Wallet,
  Receipt,
  Settings,
  Sparkles,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/invoices", label: "Invoices & Bills", icon: FileText },
  { href: "/orders", label: "Orders", icon: ShoppingCart },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/products", label: "Products", icon: Layers },
  { href: "/inventory", label: "Inventory", icon: Boxes },
  { href: "/payments", label: "Payments & Ledger", icon: Wallet },
  { href: "/map", label: "Store Map", icon: MapPin },
  { href: "/visits", label: "Visits", icon: CalendarCheck },
  { href: "/expenses", label: "Expenses", icon: Receipt },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col items-center justify-between w-16 py-5 bg-[#F6F5FB] border-r border-[#E5E4EE] h-screen sticky top-0 shrink-0 z-30 select-none">
      {/* Brand Icon */}
      <div className="flex flex-col items-center gap-6">
        <Link
          href="/dashboard"
          className="flex items-center justify-center w-11 h-11 rounded-2xl bg-[#0A0A0A] text-[#D4F732] shadow-sm hover:scale-105 transition-all"
          title="TAZQOR Business Manager"
        >
          <Sparkles className="w-5 h-5 fill-current" />
        </Link>

        {/* Navigation Icons */}
        <nav className="flex flex-col items-center gap-1.5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                className={cn(
                  "relative flex items-center justify-center w-10 h-10 rounded-full transition-all group",
                  isActive
                    ? "bg-[#0A0A0A] text-white shadow-sm"
                    : "text-gray-400 hover:text-[#0A0A0A] hover:bg-white/80"
                )}
              >
                <Icon className="w-5 h-5" />
                
                {/* Tooltip on hover */}
                <span className="absolute left-14 px-2.5 py-1 text-xs font-medium text-white bg-[#0A0A0A] rounded-lg shadow-md whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User Avatar & Logout */}
      <div className="flex flex-col items-center gap-3">
        <div
          className="w-9 h-9 rounded-full bg-[#E0E8FF] border border-[#C8D5F5] flex items-center justify-center text-xs font-semibold text-[#1E3A8A]"
          title="TAZQOR Owner"
        >
          TQ
        </div>
        <Link
          href="/login"
          title="Sign Out"
          className="text-gray-400 hover:text-red-500 transition-colors p-2"
        >
          <LogOut className="w-4 h-4" />
        </Link>
      </div>
    </aside>
  );
}
