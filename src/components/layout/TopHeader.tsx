"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Sparkles,
  ChevronDown,
  Grid3X3,
  ChevronLeft,
  Search,
  Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MoreLauncherSheet } from "./MoreLauncherSheet";
import { NotificationsPopover } from "./NotificationsPopover";
import { TazqorLogo } from "@/components/brand/TazqorLogo";
import { createClient } from "@/lib/supabase/client";

const BUSINESS_ID = "00000000-0000-0000-0000-000000000001";

interface TopHeaderProps {
  title?: string;
  subtitle?: string;
  period?: "today" | "week" | "month" | "year";
  onPeriodChange?: (period: "today" | "week" | "month" | "year") => void;
  showBack?: boolean;
}

export function TopHeader({
  title,
  subtitle,
  period = "month",
  onPeriodChange,
  showBack,
}: TopHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [launcherOpen, setLauncherOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [unreadNotifsCount, setUnreadNotifsCount] = useState(0);
  const [businessName, setBusinessName] = useState("Workspace");

  useEffect(() => {
    let active = true;
    createClient()
      .from("business_settings")
      .select("legal_name")
      .eq("business_id", BUSINESS_ID)
      .maybeSingle()
      .then(({ data }) => {
        if (active && data?.legal_name) {
          setBusinessName(data.legal_name);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const isHome = pathname === "/dashboard" || pathname === "/";

  return (
    <>
      {/* 
        Header Component:
        - Desktop: exactly 73px high, pl-[27px], centered pill tabs, All Outlets pill + black grid button.
        - Mobile Home: Avatar left + round action buttons right (Search, Notifications with red dot).
        - Mobile Sub-page: Round back button + page title + round 3x3 grid button (opening More launcher).
      */}
      <header className="w-full h-[64px] sm:h-[73px] flex items-center justify-between px-0 md:pl-0 md:pr-0 bg-transparent select-none z-20 shrink-0">
        
        {/* ==================== DESKTOP HEADER VIEW (md:flex) ==================== */}
        <div className="hidden md:flex items-center justify-between w-full">
          {/* Left: Wordmark logo (ONE logo only, no redundant logo in rail) */}
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/70 hover:bg-white/90 backdrop-blur-md border border-white/80 shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all group focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 active:scale-95"
              title="TAZQOR Home"
              aria-label="TAZQOR Home"
            >
              <TazqorLogo className="h-6 sm:h-7 w-auto object-contain" height={26} />
            </Link>
            {title && (
              <div className="flex items-center gap-2 pl-3 border-l border-neutral-400/40">
                <h1 className="text-sm font-light text-neutral-700 dark:text-neutral-300 tracking-tight">{title}</h1>
              </div>
            )}
          </div>

          {/* Center: Centered pill tabs (shown on desktop when on home dashboard) */}
          {isHome && (
            <div className="hidden xl:flex items-center gap-1 p-1 h-[42px] bg-white/30 backdrop-blur-md rounded-full border border-white/60">
              <button
                type="button"
                onClick={() => onPeriodChange ? onPeriodChange("today") : router.push("/dashboard")}
                className={cn(
                  "px-4 sm:px-5 py-1 text-xs sm:text-sm rounded-full transition-all h-full flex items-center cursor-pointer",
                  period === "today" && isHome
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
                  "px-4 sm:px-5 py-1 text-xs sm:text-sm rounded-full transition-all h-full flex items-center cursor-pointer",
                  period === "week" && isHome
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
                  "px-4 sm:px-5 py-1 text-xs sm:text-sm rounded-full transition-all h-full flex items-center cursor-pointer",
                  period === "month" && isHome
                    ? "bg-black text-white font-normal"
                    : "text-neutral-700 hover:text-black font-light hover:bg-white/40"
                )}
              >
                This Month
              </button>
              <button
                type="button"
                onClick={() => onPeriodChange ? onPeriodChange("year") : router.push("/dashboard")}
                className={cn(
                  "px-4 sm:px-5 py-1 text-xs sm:text-sm rounded-full transition-all h-full flex items-center cursor-pointer",
                  period === "year" && isHome
                    ? "bg-black text-white font-normal"
                    : "text-neutral-700 hover:text-black font-light hover:bg-white/40"
                )}
              >
                This Year
              </button>
            </div>
          )}

          {/* Right: Live Business Settings pill + round black grid button */}
          <div className="flex items-center gap-2.5 shrink-0">
            <Link
              href="/settings"
              className="flex items-center gap-1.5 px-4 h-[38px] max-w-[200px] bg-white/40 backdrop-blur-md rounded-full border border-white/70 text-xs sm:text-sm font-light text-neutral-800 hover:bg-white/70 transition-all cursor-pointer"
              title="Business Profile & Settings"
            >
              <span className="truncate">{businessName}</span>
            </Link>

            {/* Round black 3x3 grid button (Launcher trigger) */}
            <button
              type="button"
              onClick={() => setLauncherOpen(true)}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-black text-white hover:scale-105 active:scale-95 transition-all cursor-pointer shrink-0"
              title="App Launcher & Navigation"
              aria-label="App Launcher"
            >
              <Grid3X3 className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>

        {/* ==================== MOBILE HEADER VIEW (md:hidden) ==================== */}
        <div className="flex md:hidden items-center justify-between w-full">
          {isHome ? (
            /* Mobile Home: Avatar left + Actions right */
            <>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/70 active:bg-white/90 backdrop-blur-md border border-white/80 shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all group focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900"
                aria-label="TAZQOR Home"
              >
                <TazqorLogo className="h-5 sm:h-6 w-auto object-contain" height={22} />
              </Link>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setLauncherOpen(true)}
                  className="w-9 h-9 rounded-full bg-white/60 dark:bg-neutral-800 backdrop-blur-md border border-white/70 dark:border-white/10 flex items-center justify-center text-neutral-700 dark:text-neutral-200 cursor-pointer"
                  aria-label="Search and quick jump"
                >
                  <Search className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setNotificationsOpen(true)}
                  className="w-9 h-9 rounded-full bg-white/60 dark:bg-neutral-800 backdrop-blur-md border border-white/70 dark:border-white/10 flex items-center justify-center text-neutral-700 dark:text-neutral-200 relative cursor-pointer"
                  aria-label="Notifications"
                >
                  <Bell className="w-4 h-4" />
                  {unreadNotifsCount > 0 && (
                    <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
                  )}
                </button>
              </div>
            </>
          ) : (
            /* Mobile Sub-page: Round back button + Page title + Round grid button */
            <>
              <div className="flex items-center gap-2.5 min-w-0">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="w-9 h-9 rounded-full bg-white/70 dark:bg-neutral-800 backdrop-blur-md border border-white/80 dark:border-white/10 flex items-center justify-center text-neutral-800 dark:text-neutral-100 hover:scale-105 active:scale-95 transition-all cursor-pointer shrink-0"
                  aria-label="Go back"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="min-w-0 flex flex-col">
                  <h1 className="text-base font-semibold text-neutral-900 dark:text-white truncate leading-tight">
                    {title || "TAZQOR"}
                  </h1>
                  {subtitle && (
                    <span className="text-[10px] font-light text-neutral-500 dark:text-neutral-400 truncate">
                      {subtitle}
                    </span>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setLauncherOpen(true)}
                className="w-9 h-9 rounded-full bg-black text-white dark:bg-[#D7FF00] dark:text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-all cursor-pointer shrink-0"
                aria-label="App Launcher"
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </header>

      {/* Universal More Launcher Sheet */}
      <MoreLauncherSheet
        isOpen={launcherOpen}
        onClose={() => setLauncherOpen(false)}
      />

      {/* Notifications Popover */}
      <NotificationsPopover
        isOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        onUnreadCountChange={(c) => setUnreadNotifsCount(c)}
        anchorPosition="header"
      />
    </>
  );
}
