"use client";

import { formatINR } from "@/lib/formatting/currency";

interface TargetProgressBarProps {
  currentSales: number;
  targetSales: number;
  progressPct?: number;
}

export function TargetProgressBar({
  currentSales,
  targetSales,
  progressPct,
}: TargetProgressBarProps) {
  const pct = Math.min(
    100,
    Math.max(
      0,
      progressPct ?? (targetSales > 0 ? Math.round((currentSales / targetSales) * 100) : 0)
    )
  );

  return (
    <div className="bg-white/55 backdrop-blur-xl border border-white/65 rounded-[24px] p-5 sm:p-6 select-none relative overflow-hidden shadow-sm">
      {/* Top Labels */}
      <div className="flex items-center justify-between mb-3.5">
        <div className="flex items-center gap-2">
          <span className="text-sm sm:text-base font-normal text-neutral-900">
            Sales target
          </span>
          <span className="text-xs font-light text-neutral-500">
            ({pct}% achieved)
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-xs sm:text-sm font-light text-neutral-700">
          <span className="font-normal text-neutral-900">{formatINR(currentSales)}</span>
          <span className="text-neutral-400">/</span>
          <span>{formatINR(targetSales)}</span>
        </div>
      </div>

      {/* Progress Bar Container with Lime Fill, Knob Handle, and Hatched Remainder */}
      <div className="relative w-full h-8 sm:h-9 bg-white/40 backdrop-blur-md rounded-full border border-white/65 p-1 flex items-center shadow-inner overflow-visible">
        {/* Filled Portion (Electric Lime) */}
        <div
          className="h-full bg-[#E0FE52] rounded-full transition-all duration-500 shadow-sm"
          style={{ width: `${pct}%` }}
        />

        {/* Draggable-Style Knob Thumb (White circle with 3 vertical micro-dots) */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white shadow-md border border-neutral-100 flex items-center justify-center cursor-grab active:cursor-grabbing hover:scale-105 transition-transform z-10"
          style={{ left: `calc(${pct}% - 14px)` }}
          title={`Current Target: ${pct}%`}
        >
          <div className="flex flex-col gap-0.5 items-center justify-center">
            <span className="w-0.5 h-0.5 rounded-full bg-neutral-400" />
            <span className="w-0.5 h-0.5 rounded-full bg-neutral-400" />
            <span className="w-0.5 h-0.5 rounded-full bg-neutral-400" />
          </div>
        </div>

        {/* Remainder Track (Diagonal Hatched Pattern) */}
        <div
          className="h-full rounded-r-full hatch-pattern-dark opacity-30 flex-1 ml-1"
          style={{ width: `${100 - pct}%` }}
        />
      </div>
    </div>
  );
}
