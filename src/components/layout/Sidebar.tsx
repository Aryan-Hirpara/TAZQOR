"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  ShoppingCart,
  Users,
  Boxes,
  Layers,
  Wallet,
  MapPin,
  CalendarCheck,
  Receipt,
  BarChart3,
  Settings,
  Mail,
  Bell,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/invoices", label: "Invoices", icon: FileText },
  { href: "/orders", label: "Orders", icon: ShoppingCart },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/products", label: "Products", icon: Layers },
  { href: "/inventory", label: "Inventory", icon: Boxes },
  { href: "/payments", label: "Payments", icon: Wallet },
  { href: "/map", label: "Store Map", icon: MapPin },
  { href: "/visits", label: "Visits", icon: CalendarCheck },
  { href: "/expenses", label: "Expenses", icon: Receipt },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col items-center justify-between w-[76px] py-6 h-screen sticky top-0 shrink-0 z-30 select-none bg-transparent">
      {/* Top: Brand Circular Button */}
      <div className="flex flex-col items-center gap-5">
        <Link
          href="/dashboard"
          className="flex items-center justify-center w-11 h-11 rounded-full bg-black text-[#E0FE52] shadow-md hover:scale-105 active:scale-95 transition-all"
          title="TAZQOR Business Manager"
        >
          <Sparkles className="w-5 h-5 fill-current" />
        </Link>

        {/* Navigation Icon Circles */}
        <nav className="flex flex-col items-center gap-2">
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
                  "relative flex items-center justify-center w-11 h-11 rounded-full transition-all group",
                  isActive
                    ? "bg-black text-white shadow-lg scale-100"
                    : "bg-white/40 hover:bg-white/80 text-neutral-800 hover:text-black border border-white/60 hover:shadow-sm"
                )}
              >
                <Icon className="w-4 h-4" />
                
                {/* Tooltip on hover */}
                <span className="absolute left-14 px-3 py-1.5 text-xs font-light text-white bg-black/95 rounded-xl shadow-xl whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom: Mail with Red Badge, Bell with Red Badge, User Avatar */}
      <div className="flex flex-col items-center gap-2.5">
        {/* Mail Button with Notification Badge */}
        <button
          type="button"
          title="Messages"
          className="relative flex items-center justify-center w-11 h-11 rounded-full bg-white/40 hover:bg-white/80 text-neutral-800 border border-white/60 transition-all hover:shadow-sm group"
        >
          <Mail className="w-4 h-4 text-neutral-800" />
          <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-[#EF4444] ring-2 ring-white" />
          <span className="absolute left-14 px-3 py-1.5 text-xs font-light text-white bg-black/95 rounded-xl shadow-xl whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
            Messages (1)
          </span>
        </button>

        {/* Bell Button with Notification Badge */}
        <button
          type="button"
          title="Notifications"
          className="relative flex items-center justify-center w-11 h-11 rounded-full bg-white/40 hover:bg-white/80 text-neutral-800 border border-white/60 transition-all hover:shadow-sm group"
        >
          <Bell className="w-4 h-4 text-neutral-800" />
          <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-[#EF4444] ring-2 ring-white" />
          <span className="absolute left-14 px-3 py-1.5 text-xs font-light text-white bg-black/95 rounded-xl shadow-xl whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
            Notifications (3)
          </span>
        </button>

        {/* User Avatar Circle */}
        <div
          className="w-11 h-11 rounded-full bg-gradient-to-tr from-neutral-800 to-black text-[#E0FE52] border border-white/80 flex items-center justify-center text-xs font-medium shadow-sm cursor-pointer hover:scale-105 transition-transform"
          title="TAZQOR Owner"
        >
          TQ
        </div>
      </div>
    </aside>
  );
}
