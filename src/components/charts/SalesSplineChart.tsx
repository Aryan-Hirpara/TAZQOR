"use client";

import { useState } from "react";
import { formatINR } from "@/lib/formatting/currency";
import { ChevronsLeft, ChevronsRight, Plus } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { FitNumber } from "@/components/ui/FitNumber";

interface SalesSplineChartProps {
  totalSales?: number;
  comparisonSales?: number;
}

export function SalesSplineChart({
  totalSales = 385990.3,
  comparisonSales = 311056.0,
}: SalesSplineChartProps) {
  const months = [
    "jan",
    "feb",
    "mar",
    "apr",
    "may",
    "jun",
    "jul",
    "aug",
    "sep",
    "oct",
    "nov",
    "dec",
  ];
  const [activeMonthIdx, setActiveMonthIdx] = useState(6); // July default matching reference

  // 12 data points plotted across a 1000 x 260 viewBox
  const points = [
    { month: "jan", x: 40, yCur: 180, yPrev: 200, cur: 184000, prev: 160000 },
    { month: "feb", x: 120, yCur: 160, yPrev: 185, cur: 210000, prev: 175000 },
    { month: "mar", x: 200, yCur: 175, yPrev: 170, cur: 195000, prev: 190000 },
    { month: "apr", x: 290, yCur: 130, yPrev: 155, cur: 260000, prev: 215000 },
    { month: "may", x: 380, yCur: 140, yPrev: 140, cur: 245000, prev: 245000 },
    { month: "jun", x: 480, yCur: 90, yPrev: 125, cur: 320000, prev: 270000 },
    {
      month: "jul",
      x: 570,
      yCur: 45,
      yPrev: 100,
      cur: 385990.3,
      prev: 311056.0,
    },
    { month: "aug", x: 670, yCur: 60, yPrev: 85, cur: 360000, prev: 330000 },
    { month: "sep", x: 760, yCur: 80, yPrev: 110, cur: 335000, prev: 290000 },
    { month: "oct", x: 840, yCur: 55, yPrev: 95, cur: 370000, prev: 315000 },
    { month: "nov", x: 910, yCur: 70, yPrev: 80, cur: 350000, prev: 335000 },
    { month: "dec", x: 960, yCur: 50, yPrev: 75, cur: 380000, prev: 345000 },
  ];

  // Smooth cubic bezier SVG curve calculation
  const createSmoothPath = (pts: { x: number; y: number }[]) => {
    if (pts.length < 2) return "";
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i === 0 ? 0 : i - 1];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[i + 2 < pts.length ? i + 2 : i + 1];

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x} ${p2.y}`;
    }
    return d;
  };

  const currentPts = points.map((p) => ({ x: p.x, y: p.yCur }));
  const previousPts = points.map((p) => ({ x: p.x, y: p.yPrev }));

  const currentPath = createSmoothPath(currentPts);
  const previousPath = createSmoothPath(previousPts);

  const activePoint = points[activeMonthIdx];

  return (
    <GlassCard
      variant="glass"
      className="h-full p-5 sm:p-6 lg:p-7 select-none relative flex flex-col justify-between min-w-0"
    >
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2 shrink-0">
        <div className="min-w-0 flex-1 pr-2">
          <span className="text-xs font-light text-black/55 block">
            Sales this year
          </span>
          <div className="flex items-baseline gap-2 mt-0.5 min-w-0">
            <FitNumber
              value={formatINR(totalSales)}
              minFontSize={14}
              maxFontSize={26}
            />
            <span className="text-xs font-light text-black/50 shrink-0">
              vs {formatINR(comparisonSales)}
            </span>
          </div>
        </div>

        {/* Legend + "+ Show More" outlined pill button */}
        <div className="flex items-center gap-3 text-xs font-light shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-1 rounded-full bg-[#D7FF00]" />
            <span className="text-black/70">This year</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-0.5 border-b border-dashed border-neutral-400" />
            <span className="text-black/50">Last year</span>
          </div>

          {/* "+ Show More" outlined pill next to legend per Addendum */}
          <button
            type="button"
            className="flex items-center gap-1 px-3 py-1 bg-white/40 hover:bg-white/70 border border-white/80 rounded-full text-[11px] font-normal text-neutral-800 transition-all ml-1"
          >
            <Plus className="w-3 h-3" />
            <span>Show More</span>
          </button>
        </div>
      </div>

      {/* SVG Dual Spline Canvas (NO drop shadows) */}
      <div className="relative w-full flex-1 min-h-[140px] my-1">
        <svg
          viewBox="0 0 1000 260"
          className="w-full h-full overflow-visible"
          preserveAspectRatio="none"
        >
          {/* Faint Horizontal Guide Lines */}
          <line
            x1="20"
            y1="60"
            x2="980"
            y2="60"
            stroke="rgba(255,255,255,0.4)"
            strokeWidth="1"
          />
          <line
            x1="20"
            y1="130"
            x2="980"
            y2="130"
            stroke="rgba(255,255,255,0.4)"
            strokeWidth="1"
          />
          <line
            x1="20"
            y1="200"
            x2="980"
            y2="200"
            stroke="rgba(255,255,255,0.4)"
            strokeWidth="1"
          />

          {/* Comparison Curve (Dashed slate line) */}
          <path
            d={previousPath}
            fill="none"
            stroke="#94A3B8"
            strokeWidth="2.2"
            strokeDasharray="5 5"
            strokeLinecap="round"
          />

          {/* Main Curve (Solid Electric Lime #D7FF00 line) */}
          <path
            d={currentPath}
            fill="none"
            stroke="#D7FF00"
            strokeWidth="3.2"
            strokeLinecap="round"
          />

          {/* Vertical Active Cursor Guideline */}
          <line
            x1={activePoint.x}
            y1="10"
            x2={activePoint.x}
            y2="250"
            stroke="rgba(0,0,0,0.2)"
            strokeWidth="1.5"
            strokeDasharray="3 3"
          />

          {/* Comparison Active Dot */}
          <circle
            cx={activePoint.x}
            cy={activePoint.yPrev}
            r="4"
            fill="#FFFFFF"
            stroke="#94A3B8"
            strokeWidth="2"
          />

          {/* Main Active Dot */}
          <circle
            cx={activePoint.x}
            cy={activePoint.yCur}
            r="5.5"
            fill="#000000"
            stroke="#D7FF00"
            strokeWidth="2.5"
          />
        </svg>

        {/* Dual Floating Tooltip Pills */}
        <div
          className="absolute pointer-events-none transition-all duration-200 z-20 flex flex-col items-center gap-1.5"
          style={{
            left: `${(activePoint.x / 1000) * 100}%`,
            top: `${(activePoint.yCur / 260) * 100}%`,
            transform: "translate(-50%, -120%)",
          }}
        >
          {/* Top Pill: Solid Black with Electric Lime Text, NO drop shadow */}
          <div className="bg-black text-[#D7FF00] px-3.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap border border-black/80">
            {formatINR(activePoint.cur)}
          </div>
          {/* Comparison Pill: Frosted white with dark text */}
          <div className="bg-white/90 text-neutral-800 px-2.5 py-0.5 rounded-full text-[11px] font-light whitespace-nowrap border border-white/90">
            {formatINR(activePoint.prev)}
          </div>
        </div>
      </div>

      {/* Bottom Timeline Scrubber Track with Active Pill and << >> markers */}
      <div className="pt-2 border-t border-white/40 shrink-0">
        <div className="flex items-center justify-between text-xs font-light text-black/55 px-1">
          {months.map((m, idx) => {
            const isActive = idx === activeMonthIdx;
            const isFar = Math.abs(idx - activeMonthIdx) > 2;

            return (
              <button
                key={m}
                type="button"
                onClick={() => setActiveMonthIdx(idx)}
                className={`transition-all ${
                  isFar ? "hidden sm:inline-flex" : "inline-flex"
                } ${
                  isActive
                    ? "bg-black text-white px-3.5 py-0.5 rounded-full text-xs font-normal items-center gap-1"
                    : "text-black/55 hover:text-black text-[11px] px-2 py-0.5 rounded-full border border-white/30 hover:border-white/80"
                }`}
              >
                {/* Selected month pill with << >> markers per Addendum */}
                {isActive && <ChevronsLeft className="w-3 h-3 text-neutral-400" />}
                <span>{m}</span>
                {isActive && <ChevronsRight className="w-3 h-3 text-neutral-400" />}
              </button>
            );
          })}
        </div>
      </div>
    </GlassCard>
  );
}
