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
    <div
      className={cn(
        "md:hidden w-full overflow-x-auto no-scrollbar scroll-smooth snap-x snap-mandatory py-1 my-1",
        className
      )}
    >
      <div className="flex items-center gap-1.5 p-1 bg-white/40 dark:bg-neutral-800/60 backdrop-blur-md rounded-full border border-white/60 dark:border-white/10 w-fit shrink-0">
        <button
          type="button"
          onClick={() => onPeriodChange?.("today")}
          className={cn(
            "px-4 py-2 text-xs rounded-full transition-all shrink-0 cursor-pointer snap-start min-h-[44px] flex items-center justify-center",
            period === "today" && isDashboard
              ? "bg-black text-white dark:bg-[#D7FF00] dark:text-black font-normal"
              : "text-neutral-700 dark:text-neutral-300 font-light hover:bg-white/40"
          )}
        >
          Today
        </button>
        <button
          type="button"
          onClick={() => onPeriodChange?.("week")}
          className={cn(
            "px-4 py-2 text-xs rounded-full transition-all shrink-0 cursor-pointer snap-start min-h-[44px] flex items-center justify-center",
            period === "week" && isDashboard
              ? "bg-black text-white dark:bg-[#D7FF00] dark:text-black font-normal"
              : "text-neutral-700 dark:text-neutral-300 font-light hover:bg-white/40"
          )}
        >
          This Week
        </button>
        <button
          type="button"
          onClick={() => onPeriodChange?.("month")}
          className={cn(
            "px-4 py-2 text-xs rounded-full transition-all shrink-0 cursor-pointer snap-start min-h-[44px] flex items-center justify-center",
            period === "month" && isDashboard
              ? "bg-black text-white dark:bg-[#D7FF00] dark:text-black font-normal"
              : "text-neutral-700 dark:text-neutral-300 font-light hover:bg-white/40"
          )}
        >
          This Month
        </button>
        <Link
          href="/reports"
          className={cn(
            "px-4 py-2 text-xs rounded-full transition-all shrink-0 cursor-pointer snap-start min-h-[44px] flex items-center justify-center",
            pathname === "/reports"
              ? "bg-black text-white dark:bg-[#D7FF00] dark:text-black font-normal"
              : "text-neutral-700 dark:text-neutral-300 font-light hover:bg-white/40"
          )}
        >
          Reports
        </Link>
      </div>
    </div>
  );
}

