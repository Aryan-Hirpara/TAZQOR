"use client";

import { useMemo, useState } from "react";
import { formatINR } from "@/lib/formatting/currency";
import { FitNumber } from "@/components/ui/FitNumber";

export interface DailyBarItem {
  day: number;
  label?: string;
  amount: number;
  heightPct: number;
  negativePct?: number;
  highlight?: boolean;
}

interface DailyPillBarChartProps {
  averageSaleValue?: number;
  changePct?: number | null;
  data?: DailyBarItem[];
}

export function DailyPillBarChart({
  averageSaleValue = 0,
  changePct = null,
  data,
}: DailyPillBarChartProps) {
  const bars: DailyBarItem[] = useMemo(() => {
    if (data && data.length > 0) return data;
    return Array.from({ length: 14 }, (_, idx) => ({
      day: idx + 1,
      label: `Day ${idx + 1}`,
      amount: 0,
      heightPct: 0,
    }));
  }, [data]);

  const maxAmount = useMemo(
    () => Math.max(0, ...bars.map((b) => Math.abs(Number(b.amount) || 0))),
    [bars]
  );

  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const hoveredBar = hoveredIdx !== null ? bars[hoveredIdx] : null;

  return (
    <div className="flex-1 flex flex-col justify-between h-full p-1 select-none min-w-0">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 min-w-0">
        <div className="min-w-0 flex-1">
          <span className="text-xs font-light text-black/55 block">
            Average sale value
          </span>
          <div className="flex items-baseline gap-2 mt-0.5 min-w-0">
            <FitNumber
              value={formatINR(averageSaleValue)}
              minFontSize={14}
              maxFontSize={24}
            />
            {changePct !== null && changePct !== undefined ? (
              <span
                className={`text-xs font-medium shrink-0 ${
                  changePct > 0
                    ? "text-emerald-700"
                    : changePct < 0
                    ? "text-rose-700"
                    : "text-neutral-500"
                }`}
              >
                {changePct > 0 ? `+${changePct.toFixed(1)}%` : `${changePct.toFixed(1)}%`}
              </span>
            ) : null}
          </div>
        </div>

        {hoveredBar && (
          <div className="px-2 py-0.5 rounded-full bg-black text-[#D7FF00] text-[10px] font-medium shrink-0">
            {hoveredBar.label || `Day ${hoveredBar.day}`}: {formatINR(hoveredBar.amount)}
          </div>
        )}
      </div>

      {/* Daily Pill Bars with Baseline & Volume Ramp */}
      <div className="py-1.5 flex-1 flex flex-col justify-end min-w-0">
        <div className="flex items-center justify-between gap-1 h-24 sm:h-28 relative px-1">
          {/* Baseline horizontal divider rule */}
          <div className="absolute top-[72%] left-0 right-0 h-[1px] bg-neutral-300/60 z-0 pointer-events-none" />

          {bars.map((bar, idx) => {
            const isNeg = (bar.negativePct ?? 0) > 0;
            const hasVal = (bar.amount ?? 0) > 0;
            const ratio = maxAmount > 0 ? Math.abs(bar.amount) / maxAmount : 0;
            const isPeak = hasVal && (bar.highlight || ratio >= 0.72);
            const isMid = hasVal && !isPeak && ratio >= 0.35;
            const isHovered = hoveredIdx === idx;

            return (
              <button
                key={`${bar.day}-${bar.label || idx}`}
                type="button"
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx((cur) => (cur === idx ? null : cur))}
                onFocus={() => setHoveredIdx(idx)}
                onBlur={() => setHoveredIdx((cur) => (cur === idx ? null : cur))}
                onClick={() => setHoveredIdx((cur) => (cur === idx ? null : idx))}
                aria-label={`${bar.label || `Day ${bar.day}`}: ${formatINR(bar.amount)}`}
                className="flex-1 flex flex-col items-center justify-center h-full relative z-10 group cursor-pointer focus:outline-none min-w-0"
              >
                {/* Upper Positive Section (72% of container height) */}
                <div className="h-[72%] w-full flex items-end justify-center pb-0.5">
                  {!isNeg && (
                    <div
                      className={`w-full max-w-[10px] rounded-full flex flex-col overflow-hidden transition-all duration-300 ${
                        !hasVal
                          ? "bg-neutral-400/25 h-1.5"
                          : isPeak
                          ? "bg-black"
                          : isMid
                          ? "bg-neutral-700"
                          : "bg-white/75 border border-white"
                      } ${isHovered ? "ring-2 ring-black/30 scale-110" : ""}`}
                      style={
                        hasVal
                          ? { height: `${Math.max(18, Math.min(100, bar.heightPct))}%` }
                          : undefined
                      }
                    >
                      {hasVal && (
                        <div
                          className={`w-full h-1/2 rounded-t-full ${
                            isPeak ? "bg-[#D7FF00]" : isMid ? "bg-neutral-500/40" : "hatch-pattern-dark opacity-30"
                          }`}
                        />
                      )}
                    </div>
                  )}
                </div>

                {/* Lower Negative Section (28% of container height) */}
                <div className="h-[28%] w-full flex items-start justify-center pt-0.5">
                  {isNeg && (
                    <div
                      className="w-full max-w-[10px] rounded-full bg-rose-500/80 group-hover:bg-rose-600 transition-all duration-300"
                      style={{ height: `${Math.max(20, Math.min(100, bar.negativePct ?? 0))}%` }}
                    />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
