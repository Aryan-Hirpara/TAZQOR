"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { formatINR } from "@/lib/formatting/currency";
import { GlassCard } from "@/components/ui/GlassCard";
import { FitNumber } from "@/components/ui/FitNumber";

export interface OrderCardProps {
  type: "Transfer" | "Purchase Orders";
  title: string;
  subtitle: string;
  amount: number;
  status: string;
  href: string;
}

export function OrderCard({
  type,
  title,
  subtitle,
  amount,
  status,
  href,
}: OrderCardProps) {
  return (
    <GlassCard
      variant="glass-sm"
      className="h-full p-3.5 sm:p-4 lg:p-5 flex flex-col justify-between select-none group min-w-0"
    >
      {/* Top Row: Type, Title, and Circular Arrow Button */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <span className="text-[11px] sm:text-xs font-light text-neutral-500 block leading-none">
            {type}
          </span>
          <h4 className="text-xs sm:text-sm font-normal text-neutral-900 mt-1 truncate">
            {title}
          </h4>
        </div>

        {/* Circular Arrow Button (matching reference) */}
        <Link
          href={href}
          className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/70 hover:bg-black hover:text-white border border-white text-neutral-800 flex items-center justify-center transition-all shadow-sm group-hover:scale-105 active:scale-95 shrink-0"
          title={`View ${type}`}
        >
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Middle: Subtitle details */}
      <div className="my-1">
        <p className="text-[11px] sm:text-xs font-light text-neutral-600 line-clamp-1">
          {subtitle}
        </p>
      </div>

      {/* Bottom: Amount via FitNumber and Status Pill */}
      <div className="flex items-baseline justify-between pt-1.5 border-t border-white/50 gap-2">
        <div className="min-w-0 flex-1">
          <FitNumber
            value={formatINR(amount)}
            minFontSize={14}
            maxFontSize={22}
            className="font-normal text-neutral-950 tracking-tight"
          />
        </div>
        <span className="px-2 py-0.5 rounded-full bg-white/60 text-[10px] font-light text-neutral-600 border border-white/70 shrink-0">
          {status}
        </span>
      </div>
    </GlassCard>
  );
}
