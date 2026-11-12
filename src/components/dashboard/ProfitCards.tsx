"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { formatINR } from "@/lib/formatting/currency";
import { GlassCard } from "@/components/ui/GlassCard";
import { FitNumber } from "@/components/ui/FitNumber";

interface ProfitCardsProps {
  grossProfit?: number;
  netProfit?: number;
  grossMarginPct?: number;
  netMarginPct?: number;
}

export function GrossProfitCard({
  grossProfit = 0,
  grossMarginPct = 0,
}: {
  grossProfit?: number;
  grossMarginPct?: number;
}) {
  return (
    <GlassCard
      variant="lime"
      className="h-full p-4 sm:p-5 lg:p-6 flex flex-col justify-between relative select-none min-w-0 notch-bottom-right overflow-hidden"
    >
      {/* Decorative Concentric Circle Line Art: pointer-events: none, aria-hidden, z-0, opacity <= 0.12 */}
      <svg
        viewBox="0 0 300 300"
        aria-hidden="true"
        data-decorative="true"
        className="absolute inset-0 w-full h-full pointer-events-none opacity-10 z-0 overflow-hidden"
        preserveAspectRatio="xMaxYMid slice"
      >
        <defs>
          <clipPath id="gross-circle-clip">
            <rect x="0" y="0" width="300" height="300" />
          </clipPath>
        </defs>
        <g clipPath="url(#gross-circle-clip)">
          <circle cx="220" cy="80" r="40" fill="none" stroke="#000000" strokeWidth="1.2" />
          <circle cx="220" cy="80" r="75" fill="none" stroke="#000000" strokeWidth="1.2" />
          <circle cx="220" cy="80" r="110" fill="none" stroke="#000000" strokeWidth="1.2" />
          <circle cx="220" cy="80" r="145" fill="none" stroke="#000000" strokeWidth="1.2" />
          <circle cx="220" cy="80" r="180" fill="none" stroke="#000000" strokeWidth="1.2" />
        </g>
      </svg>

      {/* Top Row: Label & Margin */}
      <div className="relative z-10 flex items-start justify-between">
        <div>
          <span className="text-xs font-normal text-black/85 block">
            Gross profit
          </span>
          <span className="text-[11px] font-light text-black/60 block mt-0.5">
            {grossMarginPct.toFixed(1)}% margin
          </span>
        </div>
      </div>

      {/* Bottom Row: Amount via FitNumber and Subtext (NO drop shadows) */}
      <div className="relative z-10 pt-3 pr-10 min-w-0">
        <FitNumber
          value={formatINR(grossProfit)}
          minFontSize={15}
          maxFontSize={26}
          className="font-normal text-black tracking-tight"
        />
        <span className="text-[11px] sm:text-xs font-light text-black/65 mt-0.5 block truncate">
          After direct cost of goods
        </span>
      </div>
    </GlassCard>
  );
}

export function NetProfitCard({
  netProfit = 0,
  netMarginPct = 0,
}: {
  netProfit?: number;
  netMarginPct?: number;
}) {
  return (
    <GlassCard
      variant="black"
      className="h-full p-4 sm:p-5 lg:p-6 flex flex-col justify-between relative select-none min-w-0 notch-top-right overflow-hidden"
    >
      {/* Decorative Concentric Circle Line Art: opacity <= 0.12, z-0 */}
      <svg
        viewBox="0 0 300 300"
        aria-hidden="true"
        data-decorative="true"
        className="absolute inset-0 w-full h-full pointer-events-none opacity-10 z-0 overflow-hidden"
        preserveAspectRatio="xMaxYMid slice"
      >
        <defs>
          <clipPath id="net-circle-clip">
            <rect x="0" y="0" width="300" height="300" />
          </clipPath>
        </defs>
        <g clipPath="url(#net-circle-clip)">
          <circle cx="220" cy="180" r="35" fill="none" stroke="#FFFFFF" strokeWidth="1.2" />
          <circle cx="220" cy="180" r="70" fill="none" stroke="#FFFFFF" strokeWidth="1.2" />
          <circle cx="220" cy="180" r="105" fill="none" stroke="#FFFFFF" strokeWidth="1.2" />
          <circle cx="220" cy="180" r="140" fill="none" stroke="#FFFFFF" strokeWidth="1.2" />
          <circle cx="220" cy="180" r="175" fill="none" stroke="#FFFFFF" strokeWidth="1.2" />
        </g>
      </svg>

      {/* Top Row: Label & Margin */}
      <div className="relative z-10 flex items-start justify-between">
        <div>
          <span className="text-xs font-normal text-white/90 block">
            Net profit
          </span>
          <span className="text-[11px] font-light text-neutral-400 block mt-0.5">
            {netMarginPct.toFixed(1)}% margin
          </span>
        </div>
      </div>

      {/* Bottom Row: Amount via FitNumber and Subtext */}
      <div className="relative z-10 pt-1.5">
        <FitNumber
          value={formatINR(netProfit)}
          minFontSize={14}
          maxFontSize={24}
          className="font-normal text-white tracking-tight"
        />
        <span className="text-[11px] sm:text-xs font-light text-neutral-400 mt-0.5 block truncate">
          Operational net profit
        </span>
      </div>
    </GlassCard>
  );
}

export function ProfitCards({
  grossProfit = 0,
  netProfit = 0,
  grossMarginPct = 0,
  netMarginPct = 0,
}: ProfitCardsProps) {
  return (
    <div className="h-full flex flex-col gap-2 min-w-0 relative">
      <div className="flex-1 min-h-0">
        <GrossProfitCard grossProfit={grossProfit} grossMarginPct={grossMarginPct} />
      </div>
      <div className="h-[36%] min-h-0">
        <NetProfitCard netProfit={netProfit} netMarginPct={netMarginPct} />
      </div>
    </div>
  );
}
