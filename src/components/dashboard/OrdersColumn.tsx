"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { formatINR } from "@/lib/formatting/currency";

interface OrderCardItem {
  id: string;
  type: "Transfer" | "Purchase Orders";
  title: string;
  subtitle: string;
  amount: number;
  status: string;
  href: string;
}

interface OrdersColumnProps {
  orders?: OrderCardItem[];
}

export function OrdersColumn({ orders }: OrdersColumnProps) {
  const defaultCards: OrderCardItem[] = [
    {
      id: "TR-102",
      type: "Transfer",
      title: "Warehouse Transfer",
      subtitle: "Central Hub → Surat Outlet (48 Cans)",
      amount: 28400.00,
      status: "In Transit",
      href: "/inventory",
    },
    {
      id: "PO-308",
      type: "Purchase Orders",
      title: "Chemical Supplies",
      subtitle: "ChemCorp Ltd. • Acid slurry & LABSA",
      amount: 42150.00,
      status: "Dispatched",
      href: "/orders",
    },
    {
      id: "PO-309",
      type: "Purchase Orders",
      title: "Packaging Cans",
      subtitle: "Shreeji Polymer • 5L Cans (500 units)",
      amount: 18500.00,
      status: "Delivered",
      href: "/orders",
    },
  ];

  const items = orders && orders.length > 0 ? orders : defaultCards;

  return (
    <div className="flex flex-col gap-4 select-none h-full justify-between">
      {items.map((item) => (
        <div
          key={item.id}
          className="bg-white/55 backdrop-blur-xl border border-white/65 rounded-[24px] p-5 relative overflow-hidden flex flex-col justify-between group hover:shadow-lg transition-all flex-1 shadow-sm"
        >
          {/* Top Row: Type & Arrow Button */}
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="text-xs font-light text-neutral-500 block">
                {item.type}
              </span>
              <h4 className="text-sm font-normal text-neutral-900 mt-0.5">
                {item.title}
              </h4>
            </div>

            {/* Circular Arrow Button */}
            <Link
              href={item.href}
              className="w-8 h-8 rounded-full bg-white/70 hover:bg-black hover:text-white border border-white text-neutral-800 flex items-center justify-center transition-all shadow-sm group-hover:scale-105 active:scale-95"
              title={`View ${item.type}`}
            >
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Subtitle & Status */}
          <div className="my-2">
            <p className="text-xs font-light text-neutral-600 line-clamp-1">
              {item.subtitle}
            </p>
          </div>

          {/* Bottom Row: Amount & Badge */}
          <div className="flex items-baseline justify-between pt-2 border-t border-white/60">
            <span className="text-base sm:text-lg font-normal text-neutral-950 tracking-tight">
              {formatINR(item.amount)}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-white/60 text-[10px] font-light text-neutral-600 border border-white/70">
              {item.status}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
