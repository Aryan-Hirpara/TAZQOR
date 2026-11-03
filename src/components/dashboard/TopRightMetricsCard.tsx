"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { DottedParticleChart } from "@/components/charts/DottedParticleChart";
import { DailyPillBarChart } from "@/components/charts/DailyPillBarChart";

interface TopRightMetricsCardProps {
  averageItems?: number;
  averageSaleValue?: number;
}

export function TopRightMetricsCard({
  averageItems = 8.3,
  averageSaleValue = 1240.0,
}: TopRightMetricsCardProps) {
  return (
    <GlassCard
      variant="glass"
      className="h-full p-5 sm:p-6 lg:p-7 select-none flex flex-col justify-between"
    >
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 lg:gap-6 h-full items-stretch min-w-0">
        {/* Left section: Average Items per Sale */}
        <div className="md:col-span-5 h-full min-w-0 flex flex-col">
          <DottedParticleChart averageItems={averageItems} />
        </div>

        {/* Vertical thin glass divider line */}
        <div className="hidden md:flex md:col-span-1 justify-center items-center pointer-events-none">
          <div className="w-[1px] h-[85%] bg-white/50" />
        </div>

        {/* Right section: Average Sale Value */}
        <div className="md:col-span-6 h-full min-w-0 flex flex-col">
          <DailyPillBarChart averageSaleValue={averageSaleValue} />
        </div>
      </div>
    </GlassCard>
  );
}
