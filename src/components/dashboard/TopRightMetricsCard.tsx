"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { DottedParticleChart, DottedColumn } from "@/components/charts/DottedParticleChart";
import { DailyPillBarChart, DailyBarItem } from "@/components/charts/DailyPillBarChart";

interface TopRightMetricsCardProps {
  averageItems?: number;
  averageSaleValue?: number;
  saleChangePct?: number | null;
  particleData?: DottedColumn[];
  dailyData?: DailyBarItem[];
}

export function TopRightMetricsCard({
  averageItems = 0,
  averageSaleValue = 0,
  saleChangePct = null,
  particleData,
  dailyData,
}: TopRightMetricsCardProps) {
  return (
    <GlassCard
      variant="glass"
      className="h-full p-4 sm:p-5 lg:p-6 select-none flex flex-col justify-between min-w-0"
    >
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 lg:gap-5 h-full items-stretch min-w-0">
        {/* Left section: Average Items per Sale */}
        <div className="md:col-span-5 h-full min-w-0 flex flex-col">
          <DottedParticleChart averageItems={averageItems} data={particleData} />
        </div>

        {/* Vertical thin glass divider line */}
        <div className="hidden md:flex md:col-span-1 justify-center items-center pointer-events-none">
          <div className="w-[1px] h-[85%] bg-white/50" />
        </div>

        {/* Right section: Average Sale Value */}
        <div className="md:col-span-6 h-full min-w-0 flex flex-col">
          <DailyPillBarChart
            averageSaleValue={averageSaleValue}
            changePct={saleChangePct}
            data={dailyData}
          />
        </div>
      </div>
    </GlassCard>
  );
}
