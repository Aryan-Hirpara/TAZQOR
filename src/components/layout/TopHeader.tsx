"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Sparkles,
  ChevronDown,
  Grid3X3,
  Layers,
  MapPin,
  Receipt,
  Settings,
  Plus,
  FilePlus,
  ShoppingCart,
  UserPlus,
  CreditCard,
  CalendarPlus,
  X,
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
  const [launcherOpen, setLauncherOpen] = useState(false);
  const [outletMenuOpen, setOutletMenuOpen] = useState(false);
  const [selectedOutlet, setSelectedOutlet] = useState("All Outlets");

  const isDashboard = pathname === "/dashboard" || pathname === "/";

  const launcherModules = [
    { title: "Products & Packs", desc: "Catalog, pack sizes & SKUs", icon: Layers, href: "/products" },
    { title: "Store Map", desc: "Customer GPS locations & routes", icon: MapPin, href: "/map" },
    { title: "Expenses", desc: "Operating & raw material costs", icon: Receipt, href: "/expenses" },
    { title: "Settings & Profile", desc: "GST, prefixes & backups", icon: Settings, href: "/settings" },
  ];

  const quickActions = [
    { title: "New Invoice / Bill", icon: FilePlus, href: "/invoices/new", color: "bg-[#E0FE52] text-black" },
    { title: "New Order", icon: ShoppingCart, href: "/orders/new", color: "bg-blue-100 text-blue-800" },
    { title: "Add Customer", icon: UserPlus, href: "/customers/new", color: "bg-purple-100 text-purple-800" },
    { title: "Collect Payment", icon: CreditCard, href: "/payments/new", color: "bg-emerald-100 text-emerald-800" },
    { title: "Log Visit", icon: CalendarPlus, href: "/visits/new", color: "bg-amber-100 text-amber-800" },
  ];

  return (
    <>
      <header className="w-full h-[73px] flex items-center justify-between pl-[27px] pr-4 sm:pr-6 bg-transparent select-none z-20 shrink-0">
        {/* Left: Wordmark logo (ONE logo only, no redundant logo in rail) */}
        <div className="flex items-center gap-2.5">
          <Link href="/dashboard" className="flex items-center gap-2 group">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-black text-[#D7FF00] group-hover:scale-105 transition-transform">
              <Sparkles className="w-4 h-4 fill-current" />
            </div>
            <span className="font-semibold text-neutral-900 tracking-tight text-lg leading-none">
              TAZQOR
            </span>
          </Link>
          {title && (
            <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-neutral-400/40">
              <span className="text-sm font-light text-neutral-700 tracking-tight">{title}</span>
            </div>
          )}
        </div>

        {/* Center: Centered pill tabs (Today / This Week / This Month / Reports; active = black pill, height 42px) */}
        <div className="flex items-center gap-1 p-1 h-[42px] bg-white/30 backdrop-blur-md rounded-full border border-white/60">
          <button
            type="button"
            onClick={() => onPeriodChange ? onPeriodChange("today") : router.push("/dashboard")}
            className={cn(
              "px-4 sm:px-5 py-1 text-xs sm:text-sm rounded-full transition-all h-full flex items-center",
              period === "today" && isDashboard
                ? "bg-black text-white font-normal"
                : "text-neutral-700 hover:text-black font-light hover:bg-white/40"
            )}
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => onPeriodChange ? onPeriodChange("week") : router.push("/dashboard")}
            className={cn(
              "px-4 sm:px-5 py-1 text-xs sm:text-sm rounded-full transition-all h-full flex items-center",
              period === "week" && isDashboard
                ? "bg-black text-white font-normal"
                : "text-neutral-700 hover:text-black font-light hover:bg-white/40"
            )}
          >
            This Week
          </button>
          <button
            type="button"
            onClick={() => onPeriodChange ? onPeriodChange("month") : router.push("/dashboard")}
            className={cn(
              "px-4 sm:px-5 py-1 text-xs sm:text-sm rounded-full transition-all h-full flex items-center",
              period === "month" && isDashboard
                ? "bg-black text-white font-normal"
                : "text-neutral-700 hover:text-black font-light hover:bg-white/40"
            )}
          >
            This Month
          </button>
          <Link
            href="/reports"
            className={cn(
              "px-4 sm:px-5 py-1 text-xs sm:text-sm rounded-full transition-all h-full flex items-center",
              pathname === "/reports"
                ? "bg-black text-white font-normal"
                : "text-neutral-700 hover:text-black font-light hover:bg-white/40"
            )}
          >
            Reports
          </Link>
        </div>

        {/* Right: "All Outlets" outlined pill + round black grid button (NO search bar, NO big title, NO shadows) */}
        <div className="flex items-center gap-2.5">
          {/* Outlined Pill */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setOutletMenuOpen(!outletMenuOpen)}
              className="flex items-center gap-1.5 px-4 h-[38px] bg-white/40 backdrop-blur-md rounded-full border border-white/70 text-xs sm:text-sm font-light text-neutral-800 hover:bg-white/70 transition-all"
            >
              <span>{selectedOutlet}</span>
              <ChevronDown className="w-3.5 h-3.5 text-neutral-500" />
            </button>

            {outletMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white/95 backdrop-blur-xl rounded-[20px] border border-white py-1 z-50">
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

          {/* Round black 3x3 grid button (Launcher trigger) */}
          <button
            type="button"
            onClick={() => setLauncherOpen(true)}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-black text-white hover:scale-105 active:scale-95 transition-all shadow-md shrink-0"
            title="App Launcher & Navigation"
          >
            <Grid3X3 className="w-4 h-4 text-white" />
          </button>
        </div>
      </header>

      {/* App Launcher Modal (hosts remaining pages & quick actions) */}
      <Dialog open={launcherOpen} onOpenChange={setLauncherOpen}>
        <DialogContent className="sm:max-w-lg p-6 rounded-[32px] bg-white/95 backdrop-blur-2xl border border-white shadow-2xl">
          <DialogHeader className="pb-3 border-b border-neutral-100 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-black text-[#E0FE52] flex items-center justify-center">
                <Sparkles className="w-4 h-4 fill-current" />
              </div>
              <DialogTitle className="text-base font-normal text-neutral-900">
                TAZQOR Launcher
              </DialogTitle>
            </div>
          </DialogHeader>

          {/* Module Links */}
          <div className="mt-4 space-y-4">
            <div>
              <span className="text-[11px] font-light text-neutral-400 block mb-2">
                Operational Modules
              </span>
              <div className="grid grid-cols-2 gap-2.5">
                {launcherModules.map((m) => {
                  const Icon = m.icon;
                  return (
                    <Link
                      key={m.title}
                      href={m.href}
                      onClick={() => setLauncherOpen(false)}
                      className="flex items-start gap-3 p-3 rounded-2xl bg-white/60 border border-neutral-200/60 hover:border-black hover:bg-neutral-50 transition-all group"
                    >
                      <div className="w-9 h-9 rounded-full bg-neutral-100 flex items-center justify-center group-hover:bg-black group-hover:text-white transition-colors">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-normal text-neutral-900 leading-tight">
                          {m.title}
                        </h4>
                        <p className="text-[10px] font-light text-neutral-500 mt-0.5 line-clamp-1">
                          {m.desc}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Quick Actions */}
            <div>
              <span className="text-[11px] font-light text-neutral-400 block mb-2">
                Quick Actions
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {quickActions.map((a) => {
                  const Icon = a.icon;
                  return (
                    <Link
                      key={a.title}
                      href={a.href}
                      onClick={() => setLauncherOpen(false)}
                      className="flex items-center gap-2 p-2.5 rounded-xl border border-neutral-200/60 hover:border-black hover:bg-neutral-50 transition-all text-xs font-light text-neutral-800"
                    >
                      <div className={cn("w-6 h-6 rounded-full flex items-center justify-center shrink-0", a.color)}>
                        <Icon className="w-3 h-3" />
                      </div>
                      <span className="truncate">{a.title}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
