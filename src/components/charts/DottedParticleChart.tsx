"use client";

import { useMemo, useState } from "react";

export interface DottedColumn {
  month: string;
  value: number;
  dotsCount: number;
  invoiceCount?: number;
  highlight?: boolean;
}

interface DottedParticleChartProps {
  averageItems?: number;
  data?: DottedColumn[];
}

function createLCG(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export function DottedParticleChart({
  averageItems = 0,
  data,
}: DottedParticleChartProps) {
  const columns: DottedColumn[] = useMemo(() => {
    if (data && data.length > 0) return data;
    const monthNames = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
    const curIdx = new Date().getMonth();
    const list: DottedColumn[] = [];
    for (let i = 4; i >= 0; i--) {
      const idx = (curIdx - i + 12) % 12;
      list.push({
        month: monthNames[idx],
        value: 0,
        dotsCount: 0,
        invoiceCount: 0,
        highlight: i === 0,
      });
    }
    return list;
  }, [data]);

  const maxVal = useMemo(
    () => Math.max(0, ...columns.map((c) => Number(c.value) || 0)),
    [columns]
  );

  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const hoveredCol = hoveredIdx !== null ? columns[hoveredIdx] : null;

  const columnDots = useMemo(() => {
    return columns.map((col, colIdx) => {
      const rng = createLCG(colIdx * 1000 + 42);
      const dots: { xPct: number; yPct: number; isTopHighlight: boolean }[] = [];
      const denom = Math.max(1, maxVal);
      const heightFactor = col.value > 0 ? Math.min(1, Math.max(0.2, col.value / denom)) : 0;

      for (let i = 0; i < col.dotsCount; i++) {
        const xPct = 18 + rng() * 64;
        const yRaw = rng();
        const yPct = 95 - yRaw * heightFactor * 82;
        const isTopHighlight = Boolean((col.highlight || (maxVal > 0 && col.value / maxVal >= 0.75)) && yPct < 95 - heightFactor * 60);
        dots.push({ xPct, yPct, isTopHighlight });
      }
      return dots;
    });
  }, [columns, maxVal]);

  return (
    <div className="flex-1 flex flex-col justify-between h-full p-1 select-none min-w-0">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 min-w-0">
        <div className="min-w-0">
          <span className="text-xs font-light text-black/55 block">
            Average items per sale
          </span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-2xl sm:text-[25px] font-semibold text-neutral-900 tracking-tight">
              {averageItems.toFixed(1)}
            </span>
            <span className="text-xs font-light text-black/55">items/bill</span>
          </div>
        </div>

        {hoveredCol && (
          <div className="px-2 py-0.5 rounded-full bg-black text-[#D7FF00] text-[10px] font-medium shrink-0">
            {hoveredCol.month.toUpperCase()}: {hoveredCol.value.toFixed(1)} ({hoveredCol.invoiceCount ?? 0} inv)
          </div>
        )}
      </div>

      {/* Deterministic Stippled Dot Chart */}
      <div className="py-1.5 flex-1 flex flex-col justify-end min-w-0">
        <div className="flex items-end justify-between gap-1.5 h-24 sm:h-28 px-1">
          {columns.map((col, idx) => {
            const dots = columnDots[idx];
            const ratio = maxVal > 0 ? col.value / maxVal : 0;
            const isPeak = col.value > 0 && (col.highlight || ratio >= 0.75);
            const isMid = col.value > 0 && !isPeak && ratio >= 0.35;
            const isHovered = hoveredIdx === idx;

            return (
              <button
                key={col.month}
                type="button"
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx((cur) => (cur === idx ? null : cur))}
                onFocus={() => setHoveredIdx(idx)}
                onBlur={() => setHoveredIdx((cur) => (cur === idx ? null : cur))}
                onClick={() => setHoveredIdx((cur) => (cur === idx ? null : idx))}
                aria-label={`${col.month.toUpperCase()}: ${col.value.toFixed(1)} average items per bill`}
                className="flex-1 flex flex-col items-center justify-end h-full relative group cursor-pointer focus:outline-none min-w-0"
              >
                <div className="w-full h-full relative mb-1.5 overflow-hidden">
                  <svg
                    viewBox="0 0 100 100"
                    className="w-full h-full"
                    preserveAspectRatio="none"
                  >
                    {dots.length === 0 ? (
                      <circle cx={50} cy={90} r={2.4} className="fill-neutral-400/40" />
                    ) : (
                      dots.map((dot, dIdx) => (
                        <circle
                          key={dIdx}
                          cx={dot.xPct}
                          cy={dot.yPct}
                          r={dot.isTopHighlight ? 3.5 : 2.8}
                          className={`transition-all duration-200 ${
                            dot.isTopHighlight
                              ? "fill-[#D7FF00] stroke-black stroke-[0.9]"
                              : isPeak
                              ? "fill-black"
                              : isMid
                              ? "fill-neutral-800"
                              : "fill-neutral-500/80 group-hover:fill-black"
                          }`}
                        />
                      ))
                    )}
                  </svg>
                </div>

                <div
                  className={`px-2 py-0.5 rounded-full text-[10px] border transition-all ${
                    isPeak
                      ? "bg-black text-[#D7FF00] border-black font-semibold"
                      : isMid
                      ? "bg-neutral-800 text-white border-neutral-800 font-medium"
                      : "bg-white/60 text-neutral-700 border-white/80 font-normal"
                  } ${isHovered ? "ring-2 ring-black/25 scale-105" : ""}`}
                >
                  {col.value.toFixed(1)}
                </div>

                <span className="text-[10px] font-light text-black/55 mt-1">
                  {col.month}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
