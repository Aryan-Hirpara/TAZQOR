"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { formatINR } from "@/lib/formatting/currency";

interface ProfitCardsProps {
  grossProfit?: number;
  netProfit?: number;
  grossMarginPct?: number;
  netMarginPct?: number;
}

export function ProfitCards({
  grossProfit = 177349.50,
  netProfit = 142875.00,
  grossMarginPct = 53.5,
  netMarginPct = 43.1,
}: ProfitCardsProps) {
  return (
    <div className="flex flex-col gap-4 select-none h-full justify-between">
      {/* 1. Gross Profit Card (Electric Lime with Concentric Circle Rings & Top-Right Button Notch) */}
      <div className="bg-[#E0FE52] text-black rounded-[24px] p-6 flex flex-col justify-between flex-1 relative min-h-[250px] overflow-hidden shadow-xl shadow-[#E0FE52]/25">
        {/* Concentric Vector Circle Line Art Background */}
        <svg
          viewBox="0 0 280 250"
          className="absolute inset-0 w-full h-full pointer-events-none opacity-25"
          preserveAspectRatio="xMidYMid slice"
        >
          <circle cx="140" cy="125" r="40" fill="none" stroke="#000000" strokeWidth="1.2" />
          <circle cx="140" cy="125" r="70" fill="none" stroke="#000000" strokeWidth="1.2" />
          <circle cx="140" cy="125" r="100" fill="none" stroke="#000000" strokeWidth="1.2" />
          <circle cx="140" cy="125" r="130" fill="none" stroke="#000000" strokeWidth="1.2" />
          <circle cx="140" cy="125" r="160" fill="none" stroke="#000000" strokeWidth="1.2" />
        </svg>

        {/* Top Row: Label & Notch Button */}
        <div className="flex items-start justify-between relative z-10">
          <div>
            <span className="text-xs font-normal text-black/80 uppercase tracking-wide block">
              Gross profit
            </span>
            <span className="text-[11px] font-light text-black/65">
              {grossMarginPct.toFixed(1)}% margin
            </span>
          </div>

          {/* Standalone Black Circular Arrow Button */}
          <Link
            href="/reports"
            className="w-10 h-10 rounded-full bg-black text-white hover:scale-105 active:scale-95 flex items-center justify-center transition-transform shadow-md"
            title="View Gross Profit Analysis"
          >
            <ArrowUpRight className="w-4 h-4 text-[#E0FE52]" />
          </Link>
        </div>

        {/* Bottom Row: Amount */}
        <div className="pt-4 relative z-10">
          <span className="text-3xl sm:text-[34px] font-normal text-black tracking-tight block">
            {formatINR(grossProfit)}
          </span>
          <span className="text-xs font-light text-black/70 mt-0.5 block">
            After direct cost of goods
          </span>
        </div>
      </div>

      {/* 2. Net Profit Card (Deep Black with Translucent Concentric Rings & Concave Notch Design) */}
      <div className="bg-black text-white rounded-[24px] p-6 flex flex-col justify-between flex-1 relative min-h-[250px] overflow-hidden shadow-2xl shadow-black/40">
        {/* Concentric Vector Circle Line Art Background */}
        <svg
          viewBox="0 0 280 250"
          className="absolute inset-0 w-full h-full pointer-events-none opacity-20"
          preserveAspectRatio="xMidYMid slice"
        >
          <circle cx="140" cy="125" r="35" fill="none" stroke="#FFFFFF" strokeWidth="1.2" />
          <circle cx="140" cy="125" r="65" fill="none" stroke="#FFFFFF" strokeWidth="1.2" />
          <circle cx="140" cy="125" r="95" fill="none" stroke="#FFFFFF" strokeWidth="1.2" />
          <circle cx="140" cy="125" r="125" fill="none" stroke="#FFFFFF" strokeWidth="1.2" />
          <circle cx="140" cy="125" r="155" fill="none" stroke="#FFFFFF" strokeWidth="1.2" />
        </svg>

        {/* Top Row: Label & Circular Arrow Button */}
        <div className="flex items-start justify-between relative z-10">
          <div>
            <span className="text-xs font-normal text-white/90 uppercase tracking-wide block">
              Net profit
            </span>
            <span className="text-[11px] font-light text-neutral-400">
              {netMarginPct.toFixed(1)}% margin
            </span>
          </div>

          {/* Circular Button */}
          <Link
            href="/reports"
            className="w-10 h-10 rounded-full bg-white/15 hover:bg-white text-white hover:text-black border border-white/25 flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-sm"
            title="View Net Profit Report"
          >
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Bottom Row: Amount */}
        <div className="pt-4 relative z-10">
          <span className="text-3xl sm:text-[34px] font-normal text-white tracking-tight block">
            {formatINR(netProfit)}
          </span>
          <span className="text-xs font-light text-neutral-400 mt-0.5 block">
            All operating expenses deducted
          </span>
        </div>
      </div>
    </div>
  );
}
