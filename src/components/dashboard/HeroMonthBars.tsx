"use client";

import { useMemo } from "react";
import { formatINR } from "@/lib/formatting/currency";
import { ArrowUpRight } from "lucide-react";

interface MonthBarData {
  month: string;
  heightPct: number;
  isActive?: boolean;
}

interface HeroMonthBarsProps {
  userName?: string;
  monthlySales: number;
  salesChange: number;
  activeMonth?: string;
}

export function HeroMonthBars({
  userName = "Mike",
  monthlySales,
  salesChange,
  activeMonth = "oct",
}: HeroMonthBarsProps) {
  const months: MonthBarData[] = useMemo(() => [
    { month: "may", heightPct: 62 },
    { month: "jun", heightPct: 78 },
    { month: "jul", heightPct: 45 },
    { month: "aug", heightPct: 88 },
    { month: "sep", heightPct: 70 },
    { month: "oct", heightPct: 92, isActive: true },
  ], []);

  const isPositive = salesChange >= 0;

  return (
    <div className="bg-white/55 backdrop-blur-xl border border-white/65 rounded-[28px] shadow-sm p-6 sm:p-7 flex flex-col justify-between h-full relative overflow-hidden select-none">
      {/* Top Greeting Heading */}
      <div className="space-y-1">
        <h2 className="text-2xl sm:text-[28px] font-light text-neutral-900 tracking-tight leading-snug">
          Hi {userName}, <span className="italic font-serif font-light">here&apos;s</span> what&apos;s happening in your stores.
        </h2>
      </div>

      {/* Middle: 6 Month Pill Bars matching reference */}
      <div className="py-4">
        <div className="flex items-end justify-between gap-2.5 sm:gap-3.5 h-36 sm:h-40 px-1">
          {months.map((m) => {
            const isActive = m.isActive || m.month.toLowerCase() === activeMonth.toLowerCase();

            return (
              <div
                key={m.month}
                className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer"
              >
                {/* Bar pill container */}
                <div
                  className="w-full max-w-[52px] rounded-full flex flex-col overflow-hidden transition-all duration-300 relative"
                  style={{ height: `${m.heightPct}%` }}
                >
                  {isActive ? (
                    /* Active Month (Solid black with electric lime top cap) */
                    <div className="w-full h-full bg-black flex flex-col justify-between items-center py-2 relative shadow-md">
                      {/* Electric Lime Top Cap */}
                      <div className="w-full h-3 rounded-t-full bg-[#E0FE52] absolute top-0 left-0 right-0" />
                      <div className="flex-1" />
                      {/* Active Month Label */}
                      <span className="text-[11px] sm:text-xs font-normal text-white uppercase tracking-wider z-10">
                        {m.month}
                      </span>
                    </div>
                  ) : (
                    /* Inactive Month (Hatched diagonal upper half, translucent lower half) */
                    <div className="w-full h-full bg-white/45 border border-white/65 rounded-full flex flex-col justify-between items-center py-2 relative group-hover:bg-white/65 transition-colors">
                      {/* Upper diagonal hatched pattern */}
                      <div className="w-full h-[55%] rounded-t-full hatch-pattern-dark opacity-40" />
                      {/* Lower Month Label */}
                      <span className="text-[11px] sm:text-xs font-light text-neutral-700 uppercase tracking-wider">
                        {m.month}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom: Main Sales Metric & Comparison */}
      <div className="pt-2 flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 border-t border-white/60">
        <div>
          <span className="text-xs font-light text-neutral-500 block">Total Sales</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-normal text-neutral-950 tracking-tight">
              {formatINR(monthlySales)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-neutral-600 font-light">
          <span className="inline-flex items-center text-emerald-600 font-normal">
            <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
            {isPositive ? `+${formatINR(salesChange)}` : formatINR(salesChange)}
          </span>
          <span>vs last period</span>
        </div>
      </div>
    </div>
  );
}
