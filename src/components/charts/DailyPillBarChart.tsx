"use client";

import { useMemo } from "react";
import { formatINR } from "@/lib/formatting/currency";
import { FitNumber } from "@/components/ui/FitNumber";

interface DailyBarItem {
  day: number;
  heightPct: number; // 0 to 100 positive height
  negativePct?: number; // 0 to 100 negative height below axis
  highlight?: boolean;
}

interface DailyPillBarChartProps {
  averageSaleValue?: number;
  data?: DailyBarItem[];
}

export function DailyPillBarChart({
  averageSaleValue = 0,
  data,
}: DailyPillBarChartProps) {
  // 22 daily bars matching master reference distribution
  const bars: DailyBarItem[] = useMemo(
    () =>
      data || [
        { day: 1, heightPct: 45 },
        { day: 2, heightPct: 60 },
        { day: 3, heightPct: 35 },
        { day: 4, heightPct: 75 },
        { day: 5, heightPct: 55 },
        { day: 6, heightPct: 40 },
        { day: 7, heightPct: 0, negativePct: 30 }, // Negative day
        { day: 8, heightPct: 65 },
        { day: 9, heightPct: 50 },
        { day: 10, heightPct: 80 },
        { day: 11, heightPct: 70 },
        { day: 12, heightPct: 0, negativePct: 45 }, // Negative day
        { day: 13, heightPct: 0, negativePct: 25 }, // Negative day
        { day: 14, heightPct: 88, highlight: true }, // Today / Highlighted day
        { day: 15, heightPct: 60 },
        { day: 16, heightPct: 70 },
        { day: 17, heightPct: 40 },
        { day: 18, heightPct: 55 },
        { day: 19, heightPct: 92 },
        { day: 20, heightPct: 65 },
        { day: 21, heightPct: 50 },
        { day: 22, heightPct: 78 },
      ],
    [data]
  );

  return (
    <div className="flex-1 flex flex-col justify-between h-full p-1 select-none min-w-0">
      {/* Header */}
      <div>
        <span className="text-xs font-light text-black/55 block">
          Average sale value
        </span>
        <div className="flex items-baseline gap-2 mt-0.5">
          <FitNumber
            value={formatINR(averageSaleValue)}
            minFontSize={14}
            maxFontSize={25}
          />
          <span className="text-xs font-medium text-emerald-700 shrink-0">+4.2%</span>
        </div>
      </div>

      {/* Daily Pill Bars with Baseline & Negative Bars */}
      <div className="py-2 flex-1 flex flex-col justify-end">
        <div className="flex items-center justify-between gap-1 sm:gap-1.5 h-26 sm:h-28 relative px-1">
          {/* Baseline horizontal divider rule at 65% height */}
          <div className="absolute top-[65%] left-0 right-0 h-[1px] bg-neutral-300/60 z-0 pointer-events-none" />

          {bars.map((bar) => {
            const isNeg = (bar.negativePct ?? 0) > 0;

            return (
              <div
                key={bar.day}
                className="flex-1 flex flex-col items-center justify-center h-full relative z-10 group cursor-pointer"
                title={`Day ${bar.day}: ${isNeg ? `-${bar.negativePct}% return` : `${bar.heightPct}% sales`}`}
              >
                {/* Upper Positive Section (65% of container height) */}
                <div className="h-[65%] w-full flex items-end justify-center">
                  {!isNeg && (
                    <div
                      className={`w-full max-w-[9px] rounded-full flex flex-col overflow-hidden transition-all duration-300 ${
                        bar.highlight
                          ? "bg-black"
                          : "bg-white/50 group-hover:bg-white/80 border border-white/70"
                      }`}
                      style={{ height: `${bar.heightPct}%` }}
                    >
                      {/* Top cap: lime #D7FF00 if highlighted, diagonal hatched if normal */}
                      <div
                        className={`w-full h-1/2 rounded-t-full ${
                          bar.highlight
                            ? "bg-[#D7FF00]"
                            : "hatch-pattern-dark opacity-35"
                        }`}
                      />
                    </div>
                  )}
                </div>

                {/* Lower Negative Section (35% of container height) */}
                <div className="h-[35%] w-full flex items-start justify-center">
                  {isNeg && (
                    <div
                      className="w-full max-w-[9px] rounded-full bg-neutral-400/80 group-hover:bg-neutral-600 transition-all duration-300"
                      style={{ height: `${bar.negativePct}%` }}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
