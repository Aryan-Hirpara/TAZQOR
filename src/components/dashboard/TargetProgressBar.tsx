"use client";

import { formatINR } from "@/lib/formatting/currency";
import { GlassCard } from "@/components/ui/GlassCard";

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
      progressPct ??
        (targetSales > 0 ? Math.round((currentSales / targetSales) * 100) : 0)
    )
  );

  return (
    <GlassCard
      variant="glass"
      className="h-full px-5 sm:px-6 py-3.5 sm:py-4 select-none flex flex-col justify-center min-w-0"
    >
      {/* Top Labels: Sentence case "Your sales targets" */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-sm sm:text-[15px] font-normal text-neutral-900">
            Your sales targets
          </span>
          <span className="text-xs font-light text-black/55">
            ({pct}% achieved)
          </span>
        </div>

        {/* Number styling: currency symbol Light, digits SemiBold */}
        <div className="flex items-center text-xs sm:text-sm text-neutral-800">
          <span className="font-light text-[0.85em] mr-0.5">₹</span>
          <span className="font-semibold">{formatINR(currentSales).replace(/^₹\s*/, "")}</span>
          <span className="text-black/35 mx-1.5 font-light">/</span>
          <span className="font-light text-[0.85em] mr-0.5 text-black/70">₹</span>
          <span className="font-semibold text-black/75">{formatINR(targetSales).replace(/^₹\s*/, "")}</span>
        </div>
      </div>

      {/* Progress Bar Container: Lime #D7FF00, 3-dot knob, diagonal hatched remainder, NO drop shadow */}
      <div className="relative w-full h-7 sm:h-8 bg-white/35 rounded-full border border-white/60 p-0.5 sm:p-1 flex items-center overflow-visible">
        {/* Filled Portion (#D7FF00 Lime) */}
        <div
          className="h-full bg-[#D7FF00] rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />

        {/* Draggable Knob (White circle with 3 vertical micro-dots, zero drop shadow) */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white border border-neutral-300 flex items-center justify-center cursor-grab active:cursor-grabbing hover:scale-105 transition-transform z-10"
          style={{ left: `calc(${pct}% - 14px)` }}
          title={`Target Achieved: ${pct}%`}
        >
          <div className="flex flex-col gap-0.5 items-center justify-center">
            <span className="w-0.5 h-0.5 rounded-full bg-neutral-400" />
            <span className="w-0.5 h-0.5 rounded-full bg-neutral-400" />
            <span className="w-0.5 h-0.5 rounded-full bg-neutral-400" />
          </div>
        </div>

        {/* Remainder Track (Diagonal Hatched Pattern) */}
        <div
          className="h-full rounded-r-full hatch-pattern-dark opacity-20 flex-1 ml-1"
          style={{ width: `${100 - pct}%` }}
        />
      </div>
    </GlassCard>
  );
}
