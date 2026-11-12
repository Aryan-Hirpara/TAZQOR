"use client";

import { useMemo, useState } from "react";
import { formatINR } from "@/lib/formatting/currency";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { FitNumber } from "@/components/ui/FitNumber";

export interface MonthBarData {
  month: string;
  heightPct: number;
  isActive?: boolean;
  amount?: number;
  orderCount?: number;
}

interface HeroMonthBarsProps {
  userName?: string;
  monthlySales: number;
  salesChange: number;
  activeMonth?: string;
  months?: MonthBarData[];
}

export function HeroMonthBars({
  userName = "there",
  monthlySales,
  salesChange,
  activeMonth,
  months: customMonths,
}: HeroMonthBarsProps) {
  const months: MonthBarData[] = useMemo(() => {
    if (customMonths && customMonths.length > 0) return customMonths;
    const monthNames = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
    const curMonthIdx = new Date().getMonth();
    const list: MonthBarData[] = [];
    for (let i = 5; i >= 0; i--) {
      const idx = (curMonthIdx - i + 12) % 12;
      const mName = monthNames[idx];
      const isAct = activeMonth ? mName.toLowerCase() === activeMonth.toLowerCase() : i === 0;
      list.push({
        month: mName,
        heightPct: 0,
        amount: 0,
        orderCount: 0,
        isActive: isAct,
      });
    }
    return list;
  }, [customMonths, activeMonth]);

  const maxAmount = useMemo(
    () => Math.max(0, ...months.map((m) => Number(m.amount) || 0)),
    [months]
  );

  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const activeHoverBar = hoveredIdx !== null ? months[hoveredIdx] : null;
  const isPositive = salesChange >= 0;

  return (
    <GlassCard
      variant="hero"
      className="h-full flex flex-col justify-between p-4 sm:p-5 lg:p-6 select-none min-w-0"
    >
      {/* Top Greeting + Live Hover Inspector */}
      <div className="flex items-start justify-between gap-2 min-w-0">
        <h1 className="text-lg sm:text-xl lg:text-[24px] lg:leading-[30px] tracking-tight text-neutral-900 min-w-0">
          <span className="font-semibold">Hi {userName}, </span>
          <span className="font-light italic">here&apos;s </span>
          <span className="font-semibold">what&apos;s happening in your store.</span>
        </h1>
      </div>

      {/* Middle: 6 Month Pill Bars (volume color ramp + interactive hover/focus/click) */}
      <div className="py-1.5 my-auto relative min-w-0">
        {/* In-bounds hover details strip so tooltips never clip at card edges */}
        <div className="h-5 mb-1 flex items-center justify-end">
          {activeHoverBar ? (
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-black text-[#D7FF00] text-[11px] font-medium transition-all">
              <span className="uppercase">{activeHoverBar.month}</span>
              <span className="text-white/70">•</span>
              <span>{formatINR(activeHoverBar.amount ?? 0)}</span>
              {typeof activeHoverBar.orderCount === "number" && (
                <>
                  <span className="text-white/70">•</span>
                  <span className="text-white/90">{activeHoverBar.orderCount} inv</span>
                </>
              )}
            </div>
          ) : (
            <span className="text-[10px] font-light text-black/45">
              Hover or tap a month bar to inspect sales volume
            </span>
          )}
        </div>

        <div className="flex items-end justify-between gap-2 sm:gap-2.5 h-24 sm:h-28 px-0.5">
          {months.map((m, idx) => {
            const amount = Number(m.amount) || 0;
            const ratio = maxAmount > 0 ? amount / maxAmount : 0;
            const isActive =
              m.isActive || (activeMonth ? m.month.toLowerCase() === activeMonth.toLowerCase() : false);
            const isHovered = hoveredIdx === idx;

            // Volume-based color tier
            let tierClasses = "bg-white/30 border-white/60 text-black/50";
            let showLimeCap = false;
            let showHatch = false;
            if (amount > 0) {
              if (ratio >= 0.7 || isActive) {
                tierClasses = "bg-black border-black text-white";
                showLimeCap = true;
              } else if (ratio >= 0.35) {
                tierClasses = "bg-neutral-800 border-neutral-800 text-white";
              } else {
                tierClasses = "bg-white/70 border-white text-neutral-800";
                showHatch = true;
              }
            }

            const visualHeightPct = amount > 0 ? Math.max(26, Math.min(100, m.heightPct)) : 24;

            return (
              <button
                key={m.month}
                type="button"
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx((cur) => (cur === idx ? null : cur))}
                onFocus={() => setHoveredIdx(idx)}
                onBlur={() => setHoveredIdx((cur) => (cur === idx ? null : cur))}
                onClick={() => setHoveredIdx((cur) => (cur === idx ? null : idx))}
                aria-label={`${m.month.toUpperCase()} sales: ${formatINR(amount)}`}
                className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer focus:outline-none min-w-0"
              >
                <div
                  className={`w-full max-w-[44px] min-h-[26px] rounded-full flex flex-col items-center justify-between overflow-hidden transition-all duration-300 relative border ${tierClasses} ${
                    isHovered ? "ring-2 ring-black/30 scale-[1.03]" : ""
                  } ${isActive && amount === 0 ? "ring-1 ring-black/25" : ""}`}
                  style={{ height: `${visualHeightPct}%` }}
                >
                  {showLimeCap && (
                    <div className="w-full h-2.5 rounded-t-full bg-[#D7FF00] shrink-0" />
                  )}
                  {showHatch && (
                    <div className="w-full h-[45%] rounded-t-full hatch-pattern-dark opacity-30 shrink-0" />
                  )}
                  <div className="flex-1" />
                  <span className="text-[11px] font-medium pb-1.5 z-10 leading-none">
                    {m.month}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom: Total Sales Metric */}
      <div className="pt-2 flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 border-t border-white/40 min-w-0">
        <div className="min-w-0 flex-1 pr-2">
          <span className="text-xs font-light text-black/55 block">
            Total sales
          </span>
          <FitNumber
            value={formatINR(monthlySales)}
            minFontSize={14}
            maxFontSize={24}
          />
        </div>

        <div className="flex items-center gap-1.5 text-xs text-black/60 font-light shrink-0 pt-1 sm:pt-0">
          <span
            className={`inline-flex items-center font-medium ${
              salesChange === 0
                ? "text-neutral-600"
                : isPositive
                ? "text-emerald-700"
                : "text-rose-700"
            }`}
          >
            {isPositive ? (
              <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
            ) : (
              <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />
            )}
            {salesChange > 0 ? `+${formatINR(salesChange)}` : formatINR(salesChange)}
          </span>
          <span className="text-black/50">vs last period</span>
        </div>
      </div>
    </GlassCard>
  );
}
