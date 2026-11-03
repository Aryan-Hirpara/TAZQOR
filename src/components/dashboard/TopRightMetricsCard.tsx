"use client";

import { DottedParticleChart } from "@/components/charts/DottedParticleChart";
import { DailyPillBarChart } from "@/components/charts/DailyPillBarChart";

interface TopRightMetricsCardProps {
  averageItems?: number;
  averageSaleValue?: number;
}

export function TopRightMetricsCard({
  averageItems = 8.3,
  averageSaleValue = 1240.00,
}: TopRightMetricsCardProps) {
  return (
    <div className="bg-white/55 backdrop-blur-xl border border-white/65 rounded-[28px] p-6 sm:p-7 h-full flex flex-col justify-between select-none relative overflow-hidden shadow-sm">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full items-stretch">
        {/* Left Half: Average Items per Sale */}
        <DottedParticleChart averageItems={averageItems} />

        {/* Vertical divider */}
        <div className="hidden md:block w-[1px] bg-white/70 self-stretch my-2" />

        {/* Right Half: Average Sale Value */}
        <DailyPillBarChart averageSaleValue={averageSaleValue} />
      </div>
    </div>
  );
}
