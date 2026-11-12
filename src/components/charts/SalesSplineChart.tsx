"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { formatINR } from "@/lib/formatting/currency";
import { ChevronsLeft, ChevronsRight, Plus } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { FitNumber } from "@/components/ui/FitNumber";

interface SalesSplineChartProps {
  totalSales?: number;
  comparisonSales?: number;
  monthlyCurrent?: number[];
  monthlyPrevious?: number[];
}

const MONTH_LABELS = [
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

export function SalesSplineChart({
  totalSales = 0,
  comparisonSales = 0,
  monthlyCurrent,
  monthlyPrevious,
}: SalesSplineChartProps) {
  const [activeMonthIdx, setActiveMonthIdx] = useState(0);

  useEffect(() => {
    setActiveMonthIdx(new Date().getMonth());
  }, []);

  const curSeries = useMemo(
    () =>
      monthlyCurrent && monthlyCurrent.length === 12
        ? monthlyCurrent
        : Array(12).fill(0),
    [monthlyCurrent]
  );

  const prevSeries = useMemo(
    () =>
      monthlyPrevious && monthlyPrevious.length === 12
        ? monthlyPrevious
        : Array(12).fill(0),
    [monthlyPrevious]
  );

  const maxSeriesVal = useMemo(
    () => Math.max(0, ...curSeries, ...prevSeries),
    [curSeries, prevSeries]
  );

  const points = useMemo(() => {
    const xCoords = [40, 124, 208, 292, 376, 460, 544, 628, 712, 796, 880, 960];
    const scaleMax = Math.max(100, maxSeriesVal * 1.25);

    return MONTH_LABELS.map((m, idx) => {
      const curVal = Number(curSeries[idx]) || 0;
      const prevVal = Number(prevSeries[idx]) || 0;

      const yCur = curVal > 0 ? Math.max(32, Math.min(218, 218 - (curVal / scaleMax) * 170)) : 215;
      const yPrev = prevVal > 0 ? Math.max(38, Math.min(218, 218 - (prevVal / scaleMax) * 165)) : 218;

      return {
        month: m,
        x: xCoords[idx],
        yCur,
        yPrev,
        cur: curVal,
        prev: prevVal,
      };
    });
  }, [curSeries, prevSeries, maxSeriesVal]);

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
  const activePoint = points[activeMonthIdx] || points[0];

  return (
    <GlassCard
      variant="glass"
      className="h-full p-4 sm:p-5 lg:p-6 select-none relative flex flex-col justify-between min-w-0"
    >
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-1 shrink-0 min-w-0">
        <div className="min-w-0 flex-1 pr-2">
          <span className="text-xs font-light text-black/55 block">
            Sales this year
          </span>
          <div className="flex items-baseline gap-2 mt-0.5 min-w-0 flex-wrap">
            <FitNumber
              value={formatINR(totalSales)}
              minFontSize={14}
              maxFontSize={24}
            />
            <span className="text-xs font-light text-black/50 shrink-0">
              vs {formatINR(comparisonSales)} last yr
            </span>
          </div>
        </div>

        {/* Legend + "+ Show More" Link */}
        <div className="flex items-center gap-2.5 text-xs font-light shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-1 rounded-full bg-[#D7FF00]" />
            <span className="text-black/70 hidden sm:inline">This year</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-0.5 border-b border-dashed border-neutral-400" />
            <span className="text-black/50 hidden sm:inline">Last year</span>
          </div>

          <Link
            href="/reports"
            className="flex items-center gap-1 px-3 py-1.5 bg-white/50 hover:bg-black hover:text-white border border-white/80 rounded-full text-[11px] font-medium text-neutral-800 transition-all cursor-pointer"
          >
            <Plus className="w-3 h-3" />
            <span>Show More</span>
          </Link>
        </div>
      </div>

      {/* SVG Dual Spline Canvas with Interactive Hover Columns & Volume Nodes */}
      <div className="relative w-full flex-1 min-h-[120px] my-1">
        <svg
          viewBox="0 0 1000 250"
          className="w-full h-full overflow-visible"
          preserveAspectRatio="none"
        >
          {/* Horizontal Guide Lines */}
          {[60, 130, 200].map((y) => (
            <line
              key={y}
              x1="20"
              y1={y}
              x2="980"
              y2={y}
              stroke="rgba(255,255,255,0.45)"
              strokeWidth="1"
            />
          ))}

          {/* Comparison Curve */}
          <path
            d={previousPath}
            fill="none"
            stroke="#94A3B8"
            strokeWidth="2"
            strokeDasharray="5 5"
            strokeLinecap="round"
          />

          {/* Current Year Curve */}
          <path
            d={currentPath}
            fill="none"
            stroke="#D7FF00"
            strokeWidth="3.2"
            strokeLinecap="round"
          />

          {/* Volume-colored Data Points */}
          {points.map((pt, idx) => {
            const ratio = maxSeriesVal > 0 ? pt.cur / maxSeriesVal : 0;
            const nodeFill =
              pt.cur === 0 ? "#CBD5E1" : ratio >= 0.7 ? "#D7FF00" : "#171717";
            const isSel = idx === activeMonthIdx;
            return (
              <circle
                key={pt.month}
                cx={pt.x}
                cy={pt.yCur}
                r={isSel ? 5.5 : 3.2}
                fill={isSel ? "#000000" : nodeFill}
                stroke={isSel ? "#D7FF00" : "#FFFFFF"}
                strokeWidth={isSel ? 2.5 : 1}
              />
            );
          })}

          {/* Vertical Active Guideline */}
          <line
            x1={activePoint.x}
            y1="10"
            x2={activePoint.x}
            y2="240"
            stroke="rgba(0,0,0,0.2)"
            strokeWidth="1.5"
            strokeDasharray="3 3"
          />

          {/* Interactive Hover Zones across the 12 months */}
          {points.map((pt, idx) => (
            <rect
              key={`hover-${pt.month}`}
              x={Math.max(0, pt.x - 42)}
              y={0}
              width={84}
              height={250}
              fill="transparent"
              className="cursor-pointer"
              onMouseEnter={() => setActiveMonthIdx(idx)}
              onClick={() => setActiveMonthIdx(idx)}
            />
          ))}
        </svg>

        {/* Clamped Dual Floating Tooltip Pills */}
        <div
          role="tooltip"
          data-tooltip="true"
          className="absolute pointer-events-none transition-all duration-150 z-20 flex flex-col items-center gap-1"
          style={{
            left: `${Math.min(Math.max((activePoint.x / 1000) * 100, 15), 85)}%`,
            top: `${(activePoint.yCur / 250) * 100}%`,
            transform: activePoint.yCur < 85 ? "translate(-50%, 14px)" : "translate(-50%, -115%)",
          }}
        >
          <div className="bg-black text-[#D7FF00] px-3 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap border border-black/80">
            <span className="uppercase mr-1 text-white/75">{activePoint.month}</span>
            {formatINR(activePoint.cur)}
          </div>
          {activePoint.prev > 0 && (
            <div className="bg-white/95 text-neutral-800 px-2 py-0.5 rounded-full text-[10px] font-light whitespace-nowrap border border-white">
              Prev: {formatINR(activePoint.prev)}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Timeline Scrubber Track */}
      <div className="pt-1.5 border-t border-white/40 shrink-0 min-w-0">
        <div className="flex items-center justify-between gap-0.5 text-[11px] font-light text-black/55">
          {MONTH_LABELS.map((m, idx) => {
            const isActive = idx === activeMonthIdx;
            const isFar = Math.abs(idx - activeMonthIdx) > 2;
            const hasSales = curSeries[idx] > 0;

            return (
              <button
                key={m}
                type="button"
                onMouseEnter={() => setActiveMonthIdx(idx)}
                onFocus={() => setActiveMonthIdx(idx)}
                onClick={() => setActiveMonthIdx(idx)}
                className={`transition-all min-h-[30px] flex items-center justify-center cursor-pointer shrink-0 ${
                  isFar ? "hidden sm:inline-flex" : "inline-flex"
                } ${
                  isActive
                    ? "bg-black text-white px-2.5 py-0.5 rounded-full font-medium gap-1"
                    : hasSales
                    ? "text-neutral-900 font-medium bg-white/55 px-1.5 py-0.5 rounded-full border border-white/80 hover:bg-white"
                    : "text-black/55 hover:text-black px-1.5 py-0.5 rounded-full border border-transparent hover:border-white/60"
                }`}
              >
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
