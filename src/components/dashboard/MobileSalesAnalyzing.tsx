"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Grid3X3, ArrowUpRight, Sun, Moon } from "lucide-react";
import { formatINR } from "@/lib/formatting/currency";
import { FitNumber } from "@/components/ui/FitNumber";

interface MobileSalesAnalyzingProps {
  grossProfit?: number;
  netProfit?: number;
  grossMarginPct?: number;
  netMarginPct?: number;
  initialMode?: "dark" | "light";
}

export function MobileSalesAnalyzing({
  grossProfit = 177349.5,
  netProfit = 142875.0,
  grossMarginPct = 53.5,
  netMarginPct = 43.1,
  initialMode = "dark",
}: MobileSalesAnalyzingProps) {
  const [mode, setMode] = useState<"dark" | "light">(initialMode);
  const isDark = mode === "dark";

  return (
    <div
      className={`min-h-[600px] w-full rounded-[36px] p-4 sm:p-6 transition-colors duration-300 select-none ${
        isDark
          ? "bg-[#1C1C1A] text-white"
          : "bg-gradient-to-br from-[#DCD5E5] via-[#D3C7BD] to-[#D5D7CD] text-neutral-900 border border-white/60"
      }`}
    >
      {/* 1. Header: Back circle + Title + Grid circle header */}
      <div className="flex items-center justify-between mb-5">
        <Link
          href="/dashboard"
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
            isDark
              ? "bg-[#282826] hover:bg-[#343431] text-white"
              : "bg-white/60 hover:bg-white text-black border border-white/80"
          }`}
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>

        <div className="flex items-center gap-2">
          <h2 className="text-base sm:text-lg font-medium tracking-tight">
            Sales Analyzing
          </h2>
          {/* Light/Dark variant toggle per Addendum */}
          <button
            type="button"
            onClick={() => setMode(isDark ? "light" : "dark")}
            className={`p-1 rounded-full text-xs transition-colors ${
              isDark ? "text-neutral-400 hover:text-white" : "text-neutral-600 hover:text-black"
            }`}
            title="Toggle Light/Dark Variant"
          >
            {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          </button>
        </div>

        <button
          type="button"
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
            isDark
              ? "bg-[#282826] hover:bg-[#343431] text-white"
              : "bg-white/60 hover:bg-white text-black border border-white/80"
          }`}
        >
          <Grid3X3 className="w-4 h-4" />
        </button>
      </div>

      {/* 2. Two dark glass "Purchase Orders" / stats cards (numeral large, word small and light) */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {/* Card 1 */}
        <div
          className={`rounded-[24px] p-4 flex flex-col justify-between ${
            isDark
              ? "bg-[#252523] border border-white/5"
              : "bg-white/40 border border-white/70"
          }`}
        >
          <span className={`text-[11px] font-light ${isDark ? "text-neutral-400" : "text-black/55"}`}>
            Purchase orders
          </span>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-semibold tracking-tight">
              48
            </span>
            <span className={`text-xs font-light ${isDark ? "text-neutral-400" : "text-black/55"}`}>
              dispatched
            </span>
          </div>
        </div>

        {/* Card 2 */}
        <div
          className={`rounded-[24px] p-4 flex flex-col justify-between ${
            isDark
              ? "bg-[#252523] border border-white/5"
              : "bg-white/40 border border-white/70"
          }`}
        >
          <span className={`text-[11px] font-light ${isDark ? "text-neutral-400" : "text-black/55"}`}>
            Purchase orders
          </span>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-semibold tracking-tight">
              12
            </span>
            <span className={`text-xs font-light ${isDark ? "text-neutral-400" : "text-black/55"}`}>
              delivered
            </span>
          </div>
        </div>
      </div>

      {/* 3. Gross Profit & Net Profit joined by Notch Button */}
      <div className="flex flex-col gap-2 relative">
        {/* Gross Profit Card:
            Dark variant: Blue gradient #799892/#6F86AC -> #5886D4/#667CC6 + concentric arcs top-right
            Light variant: Electric Lime #D7FF00 card */}
        <div
          className={`rounded-[28px] p-5 sm:p-6 relative overflow-hidden notch-bottom-right min-h-[170px] flex flex-col justify-between ${
            isDark
              ? "text-white"
              : "bg-[#D7FF00] text-black"
          }`}
          style={{
            background: isDark
              ? "linear-gradient(135deg, #799892 0%, #6F86AC 35%, #5886D4 70%, #667CC6 100%)"
              : "#D7FF00",
          }}
        >
          {/* Concentric arcs top-right */}
          <svg
            viewBox="0 0 200 200"
            aria-hidden="true"
            data-decorative="true"
            className="absolute -right-10 -top-10 w-44 h-44 pointer-events-none opacity-15 z-0"
          >
            <circle cx="100" cy="100" r="30" fill="none" stroke={isDark ? "#FFFFFF" : "#000000"} strokeWidth="1.2" />
            <circle cx="100" cy="100" r="55" fill="none" stroke={isDark ? "#FFFFFF" : "#000000"} strokeWidth="1.2" />
            <circle cx="100" cy="100" r="80" fill="none" stroke={isDark ? "#FFFFFF" : "#000000"} strokeWidth="1.2" />
            <circle cx="100" cy="100" r="105" fill="none" stroke={isDark ? "#FFFFFF" : "#000000"} strokeWidth="1.2" />
          </svg>

          <div className="relative z-10">
            <span className={`text-xs font-normal block ${isDark ? "text-white/85" : "text-black/85"}`}>
              Gross profit
            </span>
            <span className={`text-[11px] font-light block mt-0.5 ${isDark ? "text-white/60" : "text-black/60"}`}>
              {grossMarginPct.toFixed(1)}% margin
            </span>
          </div>

          <div className="relative z-10 pt-4">
            <FitNumber
              value={formatINR(grossProfit)}
              minFontSize={14}
              maxFontSize={26}
              className={`font-normal tracking-tight ${isDark ? "text-white" : "text-black"}`}
            />
            <span className={`text-[11px] font-light mt-0.5 block ${isDark ? "text-white/60" : "text-black/60"}`}>
              After direct cost of goods
            </span>
          </div>
        </div>

        {/* Circular Notch Button joining both cards with background-matching ring */}
        <div
          data-notch-overlap="true"
          className={`absolute top-[170px] -translate-y-1/2 right-6 w-11 h-11 rounded-full flex items-center justify-center z-30 transition-all ${
            isDark
              ? "bg-[#D8FF00] text-black ring-[6px] ring-[#1C1C1A]"
              : "bg-black text-[#D7FF00] ring-[6px] ring-[#D3C7BD]"
          }`}
        >
          <ArrowUpRight className="w-5 h-5 stroke-[2.5]" />
        </div>

        {/* Net Profit Card:
            Dark variant: Electric Lime #D8FF00 with black text
            Light variant: Deep Black #000000 with white text */}
        <div
          className={`rounded-[28px] p-5 sm:p-6 relative overflow-hidden notch-top-right min-h-[140px] flex flex-col justify-between ${
            isDark
              ? "bg-[#D8FF00] text-black"
              : "bg-black text-white"
          }`}
        >
          <div className="relative z-10">
            <span className={`text-xs font-normal block ${isDark ? "text-black/85" : "text-white/85"}`}>
              Net profit
            </span>
            <span className={`text-[11px] font-light block mt-0.5 ${isDark ? "text-black/60" : "text-neutral-400"}`}>
              {netMarginPct.toFixed(1)}% margin
            </span>
          </div>

          <div className="relative z-10 pt-2">
            <FitNumber
              value={formatINR(netProfit)}
              minFontSize={14}
              maxFontSize={24}
              className={`font-normal tracking-tight ${isDark ? "text-black" : "text-white"}`}
            />
            <span className={`text-[11px] font-light mt-0.5 block ${isDark ? "text-black/60" : "text-neutral-400"}`}>
              Operational profit after expenses
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
