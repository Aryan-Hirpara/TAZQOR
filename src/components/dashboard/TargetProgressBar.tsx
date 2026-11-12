"use client";

import { useState } from "react";
import { Pencil, Check } from "lucide-react";
import { formatINR } from "@/lib/formatting/currency";
import { GlassCard } from "@/components/ui/GlassCard";

interface TargetProgressBarProps {
  currentSales: number;
  targetSales: number;
  progressPct?: number;
  onTargetSave?: (newTarget: number) => void;
}

export function TargetProgressBar({
  currentSales,
  targetSales,
  progressPct,
  onTargetSave,
}: TargetProgressBarProps) {
  const [editing, setEditing] = useState(false);
  const [draftTarget, setDraftTarget] = useState(targetSales > 0 ? String(targetSales) : "");
  const [hovered, setHovered] = useState(false);

  const pct =
    targetSales > 0
      ? Math.min(
          100,
          Math.max(0, progressPct ?? Math.round((currentSales / targetSales) * 100))
        )
      : 0;

  const remaining = Math.max(0, targetSales - currentSales);
  const exceeded = Math.max(0, currentSales - targetSales);

  // Volume-based progress bar fill color
  const fillColor =
    pct === 0
      ? "bg-transparent"
      : pct < 40
      ? "bg-amber-400"
      : pct < 85
      ? "bg-[#D7FF00]"
      : "bg-emerald-400";

  const handleSave = () => {
    const val = Math.max(0, Number(draftTarget) || 0);
    onTargetSave?.(val);
    setEditing(false);
  };

  return (
    <GlassCard
      variant="glass"
      className="h-full px-4 sm:px-6 py-3 sm:py-3.5 select-none flex flex-col justify-center min-w-0"
    >
      {/* Top Labels */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2 min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm sm:text-[15px] font-normal text-neutral-900 truncate">
            Your sales targets
          </span>
          <span className="text-xs font-light text-black/55 shrink-0">
            {targetSales > 0 ? `(${pct}% achieved)` : "(No target set)"}
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs sm:text-sm text-neutral-800 shrink-0">
          {editing ? (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-black/55">₹</span>
              <input
                type="number"
                min={0}
                step={1000}
                value={draftTarget}
                onChange={(e) => setDraftTarget(e.target.value)}
                placeholder="e.g. 50000"
                className="w-28 bg-white/90 border border-black/15 rounded-full px-2.5 py-1 text-xs font-medium text-neutral-900 focus:outline-none focus:ring-2 focus:ring-black/20"
                aria-label="Monthly sales target in INR"
                onKeyDown={(e) => e.key === "Enter" && handleSave()}
                autoFocus
              />
              <button
                type="button"
                onClick={handleSave}
                className="w-7 h-7 rounded-full bg-black text-[#D7FF00] flex items-center justify-center cursor-pointer"
                aria-label="Save sales target"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center">
                <span className="font-light text-[0.85em] mr-0.5">₹</span>
                <span className="font-semibold">
                  {formatINR(currentSales).replace(/^₹\s*/, "")}
                </span>
                <span className="text-black/35 mx-1.5 font-light">/</span>
                <span className="font-light text-[0.85em] mr-0.5 text-black/70">₹</span>
                <span className="font-semibold text-black/75">
                  {formatINR(targetSales).replace(/^₹\s*/, "")}
                </span>
              </div>
              {onTargetSave && (
                <button
                  type="button"
                  onClick={() => {
                    setDraftTarget(targetSales > 0 ? String(targetSales) : "");
                    setEditing(true);
                  }}
                  aria-label="Edit monthly sales target"
                  title="Set or edit monthly sales target"
                  className="w-6 h-6 rounded-full bg-white/70 hover:bg-black hover:text-white border border-black/10 flex items-center justify-center text-neutral-600 transition-colors cursor-pointer"
                >
                  <Pencil className="w-3 h-3" />
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Progress Bar Container: clamped knob never overflows 0% or 100% */}
      <div
        className="relative w-full h-7 sm:h-8 bg-white/35 rounded-full border border-white/60 p-0.5 sm:p-1 flex items-center overflow-hidden cursor-pointer"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onFocus={() => setHovered(true)}
        onBlur={() => setHovered(false)}
        onClick={() => setHovered((v) => !v)}
        tabIndex={0}
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Sales target progress"
      >
        <div
          className={`h-full ${fillColor} rounded-full transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />

        {/* Clamped Knob */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white border border-neutral-300 flex items-center justify-center transition-transform z-10 pointer-events-none"
          style={{ left: `clamp(2px, calc(${pct}% - 14px), calc(100% - 30px))` }}
        >
          <div className="flex flex-col gap-0.5 items-center justify-center">
            <span className="w-0.5 h-0.5 rounded-full bg-neutral-400" />
            <span className="w-0.5 h-0.5 rounded-full bg-neutral-400" />
            <span className="w-0.5 h-0.5 rounded-full bg-neutral-400" />
          </div>
        </div>

        {/* Remainder Track */}
        <div className="h-full rounded-r-full hatch-pattern-dark opacity-20 flex-1 ml-1" />

        {/* Hover Status Overlay Pill inside bar */}
        {hovered && (
          <div className="absolute inset-x-0 flex justify-center pointer-events-none z-20">
            <span className="px-2.5 py-0.5 rounded-full bg-black/90 text-[#D7FF00] text-[10px] font-medium">
              {targetSales === 0
                ? "Click the edit button to set your monthly sales target"
                : exceeded > 0
                ? `Target exceeded by ${formatINR(exceeded)}!`
                : `${formatINR(remaining)} remaining to reach target (${pct}%)`}
            </span>
          </div>
        )}
      </div>
    </GlassCard>
  );
}
