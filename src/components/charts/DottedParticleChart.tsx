"use client";

import { useMemo } from "react";

interface DottedColumn {
  month: string;
  value: number; // e.g. 11.4
  dotsCount: number; // number of dots to render vertically (e.g. 4 to 12)
  highlight?: boolean;
}

interface DottedParticleChartProps {
  averageItems?: number;
  data?: DottedColumn[];
}

export function DottedParticleChart({
  averageItems = 8.3,
  data,
}: DottedParticleChartProps) {
  const columns: DottedColumn[] = useMemo(() => data || [
    { month: "may", value: 11.4, dotsCount: 10 },
    { month: "jun", value: 8.1, dotsCount: 7 },
    { month: "jul", value: 2.1, dotsCount: 3 },
    { month: "aug", value: 7.3, dotsCount: 6 },
    { month: "sep", value: 12.5, dotsCount: 11, highlight: true },
  ], [data]);

  return (
    <div className="flex-1 flex flex-col justify-between h-full p-1 select-none">
      {/* Header */}
      <div>
        <span className="text-xs font-light text-neutral-500 block">
          Average items per sale
        </span>
        <div className="flex items-baseline gap-2 mt-0.5">
          <span className="text-2xl sm:text-3xl font-normal text-neutral-900 tracking-tight">
            {averageItems.toFixed(1)}
          </span>
          <span className="text-xs font-light text-neutral-500">items/bill</span>
        </div>
      </div>

      {/* Dotted Columns Visualization */}
      <div className="py-4">
        <div className="flex items-end justify-between gap-2.5 h-36 px-2">
          {columns.map((col) => (
            <div
              key={col.month}
              className="flex-1 flex flex-col items-center justify-end h-full group"
            >
              {/* Stacked Particle Dots */}
              <div className="flex flex-col-reverse gap-1.5 items-center mb-2.5">
                {Array.from({ length: col.dotsCount }).map((_, dotIdx) => (
                  <span
                    key={dotIdx}
                    className={`w-2.5 h-2.5 rounded-full transition-all ${
                      col.highlight
                        ? dotIdx >= col.dotsCount - 2
                          ? "bg-[#E0FE52] ring-1 ring-black"
                          : "bg-black"
                        : "bg-neutral-800/80 group-hover:bg-black"
                    }`}
                  />
                ))}
              </div>

              {/* Pill badge with value */}
              <div
                className={`px-2 py-0.5 rounded-full text-[10px] font-light border transition-all ${
                  col.highlight
                    ? "bg-black text-[#E0FE52] border-black font-normal shadow-sm"
                    : "bg-white/70 text-neutral-800 border-white/80 group-hover:bg-white"
                }`}
              >
                {col.value.toFixed(1)}
              </div>

              {/* Month Label */}
              <span className="text-[10px] font-light text-neutral-500 uppercase mt-1">
                {col.month}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
