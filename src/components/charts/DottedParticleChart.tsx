"use client";

import { useMemo } from "react";

interface DottedColumn {
  month: string;
  value: number;
  dotsCount: number;
  highlight?: boolean;
}

interface DottedParticleChartProps {
  averageItems?: number;
  data?: DottedColumn[];
}

// Deterministic Pseudo-Random Generator (Lehmer LCG)
function createLCG(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export function DottedParticleChart({
  averageItems = 8.3,
  data,
}: DottedParticleChartProps) {
  const columns: DottedColumn[] = useMemo(
    () =>
      data || [
        { month: "may", value: 11.4, dotsCount: 16 },
        { month: "jun", value: 8.1, dotsCount: 12 },
        { month: "jul", value: 2.1, dotsCount: 5 },
        { month: "aug", value: 7.3, dotsCount: 10 },
        { month: "sep", value: 12.5, dotsCount: 18, highlight: true },
      ],
    [data]
  );

  // Compute deterministic stipple dots for each column
  const columnDots = useMemo(() => {
    return columns.map((col, colIdx) => {
      const rng = createLCG(colIdx * 1000 + 42);
      const dots: { xPct: number; yPct: number; isTopHighlight: boolean }[] = [];
      const heightFactor = Math.min(1, Math.max(0.15, col.value / 14));

      for (let i = 0; i < col.dotsCount; i++) {
        const xPct = 15 + rng() * 70;
        const yRaw = rng();
        const yPct = 100 - (yRaw * heightFactor * 90);
        const isTopHighlight = Boolean(col.highlight && yPct < (100 - heightFactor * 75));
        dots.push({ xPct, yPct, isTopHighlight });
      }
      return dots;
    });
  }, [columns]);

  return (
    <div className="flex-1 flex flex-col justify-between h-full p-1 select-none min-w-0">
      {/* Header */}
      <div>
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

      {/* Deterministic Stippled Dot Chart */}
      <div className="py-2 flex-1 flex flex-col justify-end">
        <div className="flex items-end justify-between gap-1.5 h-26 sm:h-28 px-1">
          {columns.map((col, idx) => {
            const dots = columnDots[idx];

            return (
              <div
                key={col.month}
                className="flex-1 flex flex-col items-center justify-end h-full relative group cursor-pointer"
              >
                {/* Stipple Dot Area with Seeded Particles */}
                <div className="w-full h-full relative mb-1.5 overflow-hidden">
                  <svg
                    viewBox="0 0 100 100"
                    className="w-full h-full"
                    preserveAspectRatio="none"
                  >
                    {dots.map((dot, dIdx) => (
                      <circle
                        key={dIdx}
                        cx={dot.xPct}
                        cy={dot.yPct}
                        r={dot.isTopHighlight ? 3.5 : 2.8}
                        className={`transition-all duration-200 ${
                          dot.isTopHighlight
                            ? "fill-[#D7FF00] stroke-black stroke-[0.8]"
                            : col.highlight
                            ? "fill-black"
                            : "fill-neutral-800/80 group-hover:fill-black"
                        }`}
                      />
                    ))}
                  </svg>
                </div>

                {/* Pill badge with value (NO drop shadow) */}
                <div
                  className={`px-2 py-0.5 rounded-full text-[10px] border transition-all ${
                    col.highlight
                      ? "bg-black text-[#D7FF00] border-black font-semibold"
                      : "bg-white/60 text-neutral-800 border-white/80 font-normal group-hover:bg-white"
                  }`}
                >
                  {col.value.toFixed(1)}
                </div>

                {/* Lowercase Month Label */}
                <span className="text-[10px] font-light text-black/55 mt-1">
                  {col.month}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
