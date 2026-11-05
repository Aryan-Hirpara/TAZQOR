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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MoreLauncherSheet } from "./MoreLauncherSheet";

const PRIMARY_MOBILE_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/orders", label: "Orders", icon: ShoppingCart },
  { href: "/invoices", label: "Bills", icon: FileText },
];

export function BottomNav() {
  const pathname = usePathname();
  const [launcherOpen, setLauncherOpen] = useState(false);

  const isMoreActive =
    launcherOpen ||
    (!PRIMARY_MOBILE_ITEMS.some(
      (item) => pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))
    ) && pathname !== "/");

  return (
    <>
      {/* Floating glass bar: inset 12px from edges, radius ~28px, backdrop blur, safe area padding */}
      <nav
        aria-label="Mobile Navigation"
        className="md:hidden fixed left-3 right-3 bottom-3 z-40 bg-white/75 dark:bg-[#242422]/90 backdrop-blur-2xl rounded-[28px] border border-white/70 dark:border-white/10 shadow-lg px-1.5 h-16 flex items-center justify-around select-none"
      >
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
                "flex flex-col items-center justify-center flex-1 h-full py-1 transition-all relative min-w-0",
                isActive ? "text-black dark:text-white" : "text-neutral-800 hover:text-black dark:text-neutral-200"
              )}
            >
              <div
                className={cn(
                  "w-9 h-9 rounded-full flex items-center justify-center transition-all shrink-0",
                  isActive
                    ? "bg-black text-[#D7FF00] dark:bg-[#D7FF00] dark:text-black shadow-sm"
                    : "bg-transparent text-neutral-800 dark:text-neutral-200"
                )}
              >
                <Icon className="w-4 h-4" />
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight font-medium truncate max-w-full">
                {item.label}
              </span>
            </Link>
          );
        })}

        {/* More Button: a real button with aria-expanded */}
        <button
          type="button"
          onClick={() => setLauncherOpen(true)}
          aria-expanded={launcherOpen}
          aria-label="More navigation and actions"
          className={cn(
            "flex flex-col items-center justify-center flex-1 h-full py-1 transition-all relative min-w-0 cursor-pointer",
            isMoreActive ? "text-black dark:text-white" : "text-neutral-800 hover:text-black dark:text-neutral-200"
          )}
        >
          <div
            className={cn(
              "w-9 h-9 rounded-full flex items-center justify-center transition-all shrink-0",
              isMoreActive
                ? "bg-black text-[#D7FF00] dark:bg-[#D7FF00] dark:text-black shadow-sm"
                : "bg-transparent text-neutral-800 dark:text-neutral-200"
            )}
          >
            <Menu className="w-4 h-4" />
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight font-medium truncate max-w-full">
            More
          </span>
        </button>
      </nav>

      {/* Universal More Launcher Bottom Sheet */}
      <MoreLauncherSheet
        isOpen={launcherOpen}
        onClose={() => setLauncherOpen(false)}
      />
    </>
  );
}
