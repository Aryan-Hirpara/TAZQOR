"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  ShoppingCart,
  FileText,
  Boxes,
  Wallet,
  BarChart3,
  CalendarCheck,
  Mail,
  Bell,
} from "lucide-react";
import { RoundIconButton } from "@/components/ui/RoundIconButton";

// Exactly 8 primary navigation items matching reference
const PRIMARY_NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/orders", label: "Orders", icon: ShoppingCart },
  { href: "/invoices", label: "Invoices", icon: FileText },
  { href: "/inventory", label: "Inventory", icon: Boxes },
  { href: "/payments", label: "Payments", icon: Wallet },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/visits", label: "Visits", icon: CalendarCheck },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="hidden md:flex flex-col items-center justify-between w-[68px] py-6 select-none bg-transparent shrink-0 z-30"
      style={{
        position: "sticky",
        top: 0,
        height: "100dvh",
      }}
    >
      {/* Top Group: Primary 8 Circular Icon Buttons (NO redundant logo in rail) */}
      <nav className="flex flex-col items-center gap-2">
        {PRIMARY_NAV.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));

          return (
            <RoundIconButton
              key={item.href}
              href={item.href}
              label={item.label}
              isActive={isActive}
              icon={<Icon className="w-4 h-4" />}
            />
          );
        })}
      </nav>

      {/* Bottom Group: Pinned Mail (red dot), Bell (red dot), User Avatar */}
      <div className="flex flex-col items-center gap-2.5 pt-4">
        <RoundIconButton
          icon={<Mail className="w-4 h-4 text-neutral-800" />}
          label="Messages"
          hasBadge
        />
        <RoundIconButton
          icon={<Bell className="w-4 h-4 text-neutral-800" />}
          label="Notifications"
          hasBadge
        />

        {/* Circular User Avatar */}
        <div
          className="w-11 h-11 rounded-full bg-gradient-to-tr from-neutral-800 to-black text-[#E0FE52] border border-white/80 flex items-center justify-center text-xs font-medium shadow-sm cursor-pointer hover:scale-105 active:scale-95 transition-transform"
          title="TAZQOR Owner"
        >
          TQ
        </div>
      </div>
    </aside>
  );
}
