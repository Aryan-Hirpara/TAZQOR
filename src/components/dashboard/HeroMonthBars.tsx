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
  userName = "there",
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
    <GlassCard
      variant="hero"
      className="h-full flex flex-col justify-between p-5 sm:p-6 lg:p-7 select-none"
    >
      {/* Top Greeting Headline per spec:
          "Hi Mike," SemiBold, "here's" Light Italic, "what's happening in your stores." SemiBold */}
      <div className="space-y-1">
        <h1 className="text-xl sm:text-2xl lg:text-[28px] lg:leading-[34px] tracking-tight text-neutral-900">
          <span className="font-semibold">Hi {userName}, </span>
          <span className="font-light italic">here&apos;s </span>
          <span className="font-semibold">what&apos;s happening in your stores.</span>
        </h1>
      </div>

      {/* Middle: 6 Month Pill Bars (lowercase, active black with lime top cap) */}
      <div className="py-2 my-auto">
        <div className="flex items-end justify-between gap-2 sm:gap-3 h-28 sm:h-32 px-1">
          {months.map((m) => {
            const isActive =
              m.isActive || m.month.toLowerCase() === activeMonth.toLowerCase();

            return (
              <div
                key={m.month}
                className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer"
              >
                {/* Outlined bar pill container */}
                <div
                  className="w-full max-w-[44px] rounded-full flex flex-col overflow-hidden transition-all duration-300 relative border border-white/60"
                  style={{ height: `${m.heightPct}%` }}
                >
                  {isActive ? (
                    /* Active Month (Solid black with #D7FF00 lime top cap) */
                    <div className="w-full h-full bg-black flex flex-col justify-between items-center py-2 relative">
                      <div className="w-full h-3 rounded-t-full bg-[#D7FF00] absolute top-0 left-0 right-0" />
                      <div className="flex-1" />
                      <span className="text-[11px] sm:text-xs font-normal text-white z-10">
                        {m.month}
                      </span>
                    </div>
                  ) : (
                    /* Inactive Month (Diagonal hatched upper half, translucent lower half) */
                    <div className="w-full h-full bg-white/35 rounded-full flex flex-col justify-between items-center py-2 relative group-hover:bg-white/60 transition-colors">
                      <div className="w-full h-[52%] rounded-t-full hatch-pattern-dark opacity-35" />
                      <span className="text-[11px] sm:text-xs font-light text-black/65">
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

      {/* Bottom: Total Sales Metric (Symbol Light, Digits SemiBold, max ~26px) */}
      <div className="pt-2 flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 border-t border-white/40">
        <div className="min-w-0 flex-1 pr-2">
          <span className="text-xs font-light text-black/55 block">
            Total sales
          </span>
          <FitNumber
            value={formatINR(monthlySales)}
            minFontSize={14}
            maxFontSize={26}
          />
        </div>

        <div className="flex items-center gap-1.5 text-xs text-black/60 font-light shrink-0 pt-1 sm:pt-0">
          <span className="inline-flex items-center text-emerald-700 font-medium">
            <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
            {isPositive ? `+${formatINR(salesChange)}` : formatINR(salesChange)}
          </span>
          <span className="text-black/50">vs last period</span>
        </div>
      </div>
    </GlassCard>
  );
}
