"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { formatINR } from "@/lib/formatting/currency";
import { GlassCard } from "@/components/ui/GlassCard";
import { FitNumber } from "@/components/ui/FitNumber";

export interface OrderCardProps {
  type: "Transfer" | "Purchase orders";
  title: string;
  subtitle: string;
  amount: number;
  status: string;
  href: string;
  countLabel?: { count: number | string; word: string };
}

export function OrderCard({
  type,
  title,
  subtitle,
  amount,
  status,
  href,
  countLabel,
}: OrderCardProps) {
  return (
    <GlassCard
      variant="glass-sm"
      className="h-full p-3.5 sm:p-4 lg:p-4.5 flex flex-col justify-between select-none group min-w-0"
    >
      {/* Top Row: Type, Title, and Circular Arrow Button (NO drop shadows) */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <span className="text-[11px] sm:text-xs font-light text-black/55 block leading-none">
            {type}
          </span>
          <h4 className="text-xs sm:text-sm font-normal text-neutral-900 mt-1 truncate">
            {title}
          </h4>
        </div>

        {/* Circular Arrow Button (NO drop shadow) */}
        <Link
          href={href}
          className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/60 hover:bg-black hover:text-white border border-white text-neutral-800 flex items-center justify-center transition-all group-hover:scale-105 active:scale-95 shrink-0"
          title={`View ${type}`}
        >
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Middle: Subtitle details */}
      <div className="my-0.5">
        <p className="text-[11px] sm:text-xs font-light text-black/55 line-clamp-1">
          {subtitle}
        </p>
      </div>

      {/* Bottom: Amount via FitNumber and Status Pill (counts = numeral SemiBold + word Light) */}
      <div className="flex items-baseline justify-between pt-1 border-t border-white/40 gap-2">
        <div className="min-w-0 flex-1">
          <FitNumber
            value={formatINR(amount)}
            minFontSize={13}
            maxFontSize={22}
          />
        </div>

        {countLabel ? (
          <span className="px-2 py-0.5 rounded-full bg-white/50 text-[10px] border border-white/70 shrink-0">
            <span className="font-semibold text-neutral-900">{countLabel.count}</span>{" "}
            <span className="font-light text-black/55">{countLabel.word}</span>
          </span>
        ) : (
          <span className="px-2 py-0.5 rounded-full bg-white/50 text-[10px] font-light text-neutral-700 border border-white/70 shrink-0">
            {status}
          </span>
        )}
      </div>
    </GlassCard>
  );
}
