"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface MobilePeriodPillsProps {
  period: "today" | "week" | "month";
  onPeriodChange?: (period: "today" | "week" | "month") => void;
  className?: string;
}

export function MobilePeriodPills({
  period,
  onPeriodChange,
  className,
}: MobilePeriodPillsProps) {
  const pathname = usePathname();
  const isDashboard = pathname === "/dashboard" || pathname === "/";

  return (
    <div className={cn("md:hidden w-full py-1 my-1", className)}>
      <div className="grid grid-cols-4 gap-1 p-1 bg-white/55 backdrop-blur-md rounded-full border border-white/60 w-full">
        <button
          type="button"
          onClick={() => onPeriodChange?.("today")}
          className={cn(
            "py-2 px-1 text-[11px] sm:text-xs rounded-full transition-all cursor-pointer min-h-[42px] flex items-center justify-center text-center truncate",
            period === "today" && isDashboard
              ? "bg-black text-white font-normal shadow-sm"
              : "text-neutral-700 font-light hover:bg-white/40"
          )}
        >
          Today
        </button>
        <button
          type="button"
          onClick={() => onPeriodChange?.("week")}
          className={cn(
            "py-2 px-1 text-[11px] sm:text-xs rounded-full transition-all cursor-pointer min-h-[42px] flex items-center justify-center text-center truncate",
            period === "week" && isDashboard
              ? "bg-black text-white font-normal shadow-sm"
              : "text-neutral-700 font-light hover:bg-white/40"
          )}
        >
          This Week
        </button>
        <button
          type="button"
          onClick={() => onPeriodChange?.("month")}
          className={cn(
            "py-2 px-1 text-[11px] sm:text-xs rounded-full transition-all cursor-pointer min-h-[42px] flex items-center justify-center text-center truncate",
            period === "month" && isDashboard
              ? "bg-black text-white font-normal shadow-sm"
              : "text-neutral-700 font-light hover:bg-white/40"
          )}
        >
          This Month
        </button>
        <Link
          href="/reports"
          className={cn(
            "py-2 px-1 text-[11px] sm:text-xs rounded-full transition-all cursor-pointer min-h-[42px] flex items-center justify-center text-center truncate",
            pathname === "/reports"
              ? "bg-black text-white font-normal shadow-sm"
              : "text-neutral-700 font-light hover:bg-white/40"
          )}
        >
          Reports
        </Link>
      </div>
    </div>
  );
}

