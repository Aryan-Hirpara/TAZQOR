"use client";

import { useMemo } from "react";
import { formatINR } from "@/lib/formatting/currency";
import { ArrowUpRight } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { FitNumber } from "@/components/ui/FitNumber";

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
  const months: MonthBarData[] = useMemo(
    () => [
      { month: "may", heightPct: 62 },
      { month: "jun", heightPct: 78 },
      { month: "jul", heightPct: 45 },
      { month: "aug", heightPct: 88 },
      { month: "sep", heightPct: 70 },
      { month: "oct", heightPct: 92, isActive: true },
    ],
    []
  );

  const isPositive = salesChange >= 0;

  return (
    <GlassCard variant="glass" className="h-full flex flex-col justify-between p-5 sm:p-6 lg:p-7 select-none">
      {/* Top Greeting Heading: Light geometric sans, light italic for 'here's', bold for stores clause */}
      <div className="space-y-1">
        <h2 className="text-2xl sm:text-[27px] lg:text-[29px] font-light text-neutral-900 tracking-tight leading-snug">
          Hi {userName}, <span className="italic font-light">here&apos;s</span>{" "}
          <span className="font-semibold text-neutral-950">what&apos;s happening in your stores.</span>
        </h2>
      </div>

      {/* Middle: 6 Month Pill Bars matching reference */}
      <div className="py-2 sm:py-3 my-auto">
        <div className="flex items-end justify-between gap-2 sm:gap-3.5 h-32 sm:h-36 px-1">
          {months.map((m) => {
            const isActive =
              m.isActive || m.month.toLowerCase() === activeMonth.toLowerCase();

            return (
              <div
                key={m.month}
                className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer"
              >
                {/* Bar pill container */}
                <div
                  className="w-full max-w-[48px] rounded-full flex flex-col overflow-hidden transition-all duration-300 relative shadow-sm"
                  style={{ height: `${m.heightPct}%` }}
                >
                  {isActive ? (
                    /* Active Month (Solid black with electric lime top cap) */
                    <div className="w-full h-full bg-black flex flex-col justify-between items-center py-2 relative shadow-md">
                      {/* Electric Lime Top Cap */}
                      <div className="w-full h-3 rounded-t-full bg-[#E0FE52] absolute top-0 left-0 right-0" />
                      <div className="flex-1" />
                      {/* Active Month Label: sentence-case/lowercase, clean text */}
                      <span className="text-[11px] sm:text-xs font-normal text-white z-10">
                        {m.month}
                      </span>
                    </div>
                  ) : (
                    /* Inactive Month (Hatched diagonal upper half, translucent lower half) */
                    <div className="w-full h-full bg-white/45 border border-white/65 rounded-full flex flex-col justify-between items-center py-2 relative group-hover:bg-white/70 transition-colors">
                      {/* Upper diagonal hatched pattern */}
                      <div className="w-full h-[52%] rounded-t-full hatch-pattern-dark opacity-35" />
                      {/* Lower Month Label */}
                      <span className="text-[11px] sm:text-xs font-light text-neutral-600">
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

      {/* Bottom: Main Sales Metric & Comparison with FitNumber to prevent any overflow */}
      <div className="pt-2 flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 border-t border-white/50">
        <div className="min-w-0 flex-1 pr-2">
          <span className="text-xs font-light text-neutral-500 block">Total Sales</span>
          <FitNumber
            value={formatINR(monthlySales)}
            minFontSize={20}
            maxFontSize={36}
            className="font-normal text-neutral-950"
          />
        </div>

        <div className="flex items-center gap-1.5 text-xs text-neutral-600 font-light shrink-0 pt-1 sm:pt-0">
          <span className="inline-flex items-center text-emerald-600 font-normal">
            <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
            {isPositive ? `+${formatINR(salesChange)}` : formatINR(salesChange)}
          </span>
          <span>vs last period</span>
        </div>
      </div>
    </GlassCard>
  );
}
