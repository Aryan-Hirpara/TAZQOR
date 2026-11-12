"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { formatINR } from "@/lib/formatting/currency";

interface OrderCardItem {
  id: string;
  type: "Transfer" | "Purchase Orders" | "Order";
  title: string;
  subtitle: string;
  amount: number;
  status: string;
  href: string;
}

interface OrdersColumnProps {
  orders?: OrderCardItem[];
}

export function OrdersColumn({ orders = [] }: OrdersColumnProps) {
  if (orders.length === 0) {
    return (
      <div className="bg-white/45 backdrop-blur-xl border border-white/60 rounded-[24px] p-5 flex flex-col justify-center items-center text-center h-full min-h-[140px]">
        <p className="text-xs font-medium text-neutral-700">No recent orders or transfers</p>
        <Link
          href="/orders/new"
          className="mt-2 text-[11px] font-medium text-neutral-900 underline underline-offset-2"
        >
          Create order
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 select-none h-full justify-between">
      {orders.map((item) => (
        <div
          key={item.id}
          className="bg-white/55 backdrop-blur-xl border border-white/65 rounded-[24px] p-5 relative overflow-hidden flex flex-col justify-between group hover:shadow-lg transition-all flex-1 shadow-sm min-w-0"
        >
          <div className="flex items-start justify-between gap-2 min-w-0">
            <div className="min-w-0 flex-1">
              <span className="text-xs font-light text-neutral-500 block">
                {item.type}
              </span>
              <h4 className="text-sm font-normal text-neutral-900 mt-0.5 truncate">
                {item.title}
              </h4>
            </div>

            <Link
              href={item.href}
              className="w-8 h-8 rounded-full bg-white/70 hover:bg-black hover:text-white border border-white text-neutral-800 flex items-center justify-center transition-all shadow-sm group-hover:scale-105 active:scale-95 shrink-0"
              title={`View ${item.type}`}
            >
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="my-2 min-w-0">
            <p className="text-xs font-light text-neutral-600 line-clamp-1">
              {item.subtitle}
            </p>
          </div>

          <div className="flex items-baseline justify-between pt-2 border-t border-white/60 gap-2">
            <span className="text-base sm:text-lg font-normal text-neutral-950 tracking-tight truncate">
              {formatINR(item.amount)}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-white/60 text-[10px] font-light text-neutral-600 border border-white/70 shrink-0">
              {item.status}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
