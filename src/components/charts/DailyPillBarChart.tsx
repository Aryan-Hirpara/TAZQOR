"use client";

import { useMemo } from "react";
import { formatINR } from "@/lib/formatting/currency";

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
  averageSaleValue = 1240.00,
  data,
}: DailyPillBarChartProps) {
  // 24 daily bars matching reference visual distribution
  const bars: DailyBarItem[] = useMemo(() => data || [
    { day: 1, heightPct: 45 },
    { day: 2, heightPct: 60 },
    { day: 3, heightPct: 35 },
    { day: 4, heightPct: 75 },
    { day: 5, heightPct: 55 },
    { day: 6, heightPct: 40 },
    { day: 7, heightPct: 0, negativePct: 30 }, // Day 7 negative
    { day: 8, heightPct: 65 },
    { day: 9, heightPct: 50 },
    { day: 10, heightPct: 80 },
    { day: 11, heightPct: 70 },
    { day: 12, heightPct: 0, negativePct: 45 }, // Day 12 negative
    { day: 13, heightPct: 0, negativePct: 25 }, // Day 13 negative
    { day: 14, heightPct: 85, highlight: true }, // Highlighted high day
    { day: 15, heightPct: 60 },
    { day: 16, heightPct: 70 },
    { day: 17, heightPct: 40 },
    { day: 18, heightPct: 55 },
    { day: 19, heightPct: 90 },
    { day: 20, heightPct: 65 },
    { day: 21, heightPct: 50 },
    { day: 22, heightPct: 75 },
  ], [data]);

  return (
    <div className="flex-1 flex flex-col justify-between h-full p-1 select-none">
      {/* Header */}
      <div>
        <span className="text-xs font-light text-neutral-500 block">
          Average sale value
        </span>
        <div className="flex items-baseline gap-2 mt-0.5">
          <span className="text-2xl sm:text-3xl font-normal text-neutral-900 tracking-tight">
            {formatINR(averageSaleValue)}
          </span>
          <span className="text-xs font-light text-emerald-600">+4.2%</span>
        </div>
      </div>

      {/* Daily Pill Bars with Axis & Negative Values */}
      <div className="py-2">
        <div className="flex items-center justify-between gap-1 sm:gap-1.5 h-36 relative px-1">
          {/* Baseline horizontal rule */}
          <div className="absolute top-[65%] left-0 right-0 h-[1px] bg-neutral-300/80 z-0" />

          {bars.map((bar) => {
            const isNeg = (bar.negativePct ?? 0) > 0;

            return (
              <div
                key={bar.day}
                className="flex-1 flex flex-col items-center justify-center h-full relative z-10 group"
              >
                {/* Upper Positive Section */}
                <div className="h-[65%] w-full flex items-end justify-center">
                  {!isNeg && (
                    <div
                      className={`w-full max-w-[10px] rounded-full flex flex-col overflow-hidden transition-all duration-300 ${
                        bar.highlight
                          ? "bg-black shadow-sm ring-1 ring-black"
                          : "bg-white/60 group-hover:bg-white/90 border border-white/80"
                      }`}
                      style={{ height: `${bar.heightPct}%` }}
                    >
                      {/* Diagonal stripes on the top half */}
                      <div
                        className={`w-full h-1/2 rounded-t-full ${
                          bar.highlight ? "bg-[#E0FE52]" : "hatch-pattern-dark opacity-40"
                        }`}
                      />
                    </div>
                  )}
                </div>

                {/* Lower Negative Section (Below Axis) */}
                <div className="h-[35%] w-full flex items-start justify-center">
                  {isNeg && (
                    <div
                      className="w-full max-w-[10px] rounded-full bg-neutral-800/80 group-hover:bg-black flex flex-col overflow-hidden transition-all duration-300"
                      style={{ height: `${bar.negativePct}%` }}
                    >
                      <div className="w-full h-1/2 rounded-b-full hatch-pattern opacity-60" />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Timeline Axis Labels */}
        <div className="flex items-center justify-between text-[10px] font-light text-neutral-400 px-1 pt-1">
          <span>Day 1</span>
          <span>Day 11</span>
          <span>Day 22</span>
        </div>
      </div>
    </div>
  );
}
