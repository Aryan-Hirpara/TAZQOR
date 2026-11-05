"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CalendarCheck,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  MapPin,
  Calendar,
  Phone,
  MessageCircle,
  ChevronRight,
} from "lucide-react";
import { TopHeader } from "@/components/layout/TopHeader";

interface VisitRecord {
  id: string;
  customer_name: string;
  shop_name: string;
  visit_date: string;
  outcome: string;
  next_follow_up?: string;
  gps_verified: boolean;
  status: 'completed' | 'upcoming' | 'missed';
}

const DEMO_VISITS: VisitRecord[] = [
  {
    id: "v-1",
    customer_name: "Shreeji Supermarket",
    shop_name: "Shreeji Provision Store",
    visit_date: "Today, 11:30 AM",
    outcome: "Presented new 5L Floor cleaner bulk discount scheme. Haresh Bhai agreed to place 10-can order.",
    next_follow_up: "2026-02-24",
    gps_verified: true,
    status: "completed",
  },
  {
    id: "v-2",
    customer_name: "Hotel Pride Plaza",
    shop_name: "Pride Hospitality Group",
    visit_date: "Today, 3:00 PM",
    outcome: "Meeting with housekeeping supervisor for monthly hotel sanitization supply renewal.",
    next_follow_up: "2026-02-28",
    gps_verified: false,
    status: "upcoming",
  },
  {
    id: "v-3",
    customer_name: "Apex Co-Working Space",
    shop_name: "Apex Tech Park",
    visit_date: "Yesterday, 2:15 PM",
    outcome: "Delivered product trial samples for foam hand wash dispenser.",
    next_follow_up: "2026-02-20",
    gps_verified: true,
    status: "completed",
  },
  {
    id: "v-4",
    customer_name: "Radhe Krishna PG",
    shop_name: "Radhe PG Accommodations",
    visit_date: "2026-02-12",
    outcome: "Payment reminder and collected cash payment of ₹3,700 for previous supply.",
    gps_verified: true,
    status: "completed",
  },
];

export default function VisitsPage() {
  const [visits, setVisits] = useState<VisitRecord[]>(DEMO_VISITS);
  const [filter, setFilter] = useState<"all" | "today" | "upcoming">("all");

  return (
    <div className="min-h-screen pb-12">
      <TopHeader title="Shop Visits" />

      <div className="space-y-6 pt-2">
        {/* KPI Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="bg-white/55 backdrop-blur-xl border border-white/65 rounded-[24px] p-6 shadow-sm">
            <span className="text-xs font-light text-neutral-500 block">
              Today&apos;s store visits
            </span>
            <div className="text-3xl font-normal text-neutral-900 mt-1 tracking-tight">
              2 Scheduled
            </div>
            <p className="text-[11px] font-light text-neutral-500 mt-0.5">1 Completed, 1 Pending</p>
          </div>

          <div className="bg-white/55 backdrop-blur-xl border border-white/65 rounded-[24px] p-6 shadow-sm">
            <span className="text-xs font-light text-neutral-500 block">
              Total logged this month
            </span>
            <div className="text-3xl font-normal text-emerald-800 mt-1 tracking-tight">
              18 Visits
            </div>
            <p className="text-[11px] font-light text-neutral-500 mt-0.5">14 Resulted in fresh orders</p>
          </div>

          <div className="bg-white/55 backdrop-blur-xl border border-white/65 rounded-[24px] p-6 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-light text-neutral-500 block">
                GPS verified check-in
              </span>
              <p className="text-sm font-normal text-neutral-900 mt-0.5">Browser geolocation check-in</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-[#E0FE52] text-black flex items-center justify-center shadow-sm">
              <MapPin className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 p-1 bg-white/55 backdrop-blur-md rounded-full border border-white/70 shadow-sm">
            <button
              onClick={() => setFilter("all")}
              className={`px-4 min-h-[44px] flex items-center justify-center text-xs font-light rounded-full transition-all cursor-pointer ${
                filter === "all" ? "bg-black text-white font-normal shadow-sm" : "text-neutral-700 hover:text-black"
              }`}
            >
              All Logs
            </button>
            <button
              onClick={() => setFilter("today")}
              className={`px-4 min-h-[44px] flex items-center justify-center text-xs font-light rounded-full transition-all cursor-pointer ${
                filter === "today" ? "bg-black text-white font-normal shadow-sm" : "text-neutral-700 hover:text-black"
              }`}
            >
              Today
            </button>
          </div>

          <Link
            href="/visits/new"
            className="flex items-center justify-center gap-2 h-10 px-5 rounded-full bg-black text-white text-xs sm:text-sm font-normal shadow-md hover:scale-105 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4 text-[#E0FE52]" />
            <span>Log Visit</span>
          </Link>
        </div>

        {/* Visits List */}
        <div className="space-y-3">
          {visits.map((v) => (
            <div
              key={v.id}
              className="bg-white/55 backdrop-blur-xl rounded-[24px] p-5 sm:p-6 border border-white/65 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 min-w-0">
                  <h3 className="text-base font-normal text-neutral-900">{v.customer_name}</h3>
                  <span className="text-[11px] font-light text-neutral-500">({v.shop_name})</span>
                  {v.gps_verified && (
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-light text-neutral-700 bg-white/70 px-2 py-0.5 rounded-full border border-white/80">
                      <MapPin className="w-3 h-3 text-[#E0FE52]" />
                      GPS
                    </span>
                  )}
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-light border capitalize ${
                      v.status === "completed"
                        ? "bg-emerald-50 text-emerald-800 border-emerald-200/60"
                        : "bg-amber-50 text-amber-800 border-amber-200/60"
                    }`}
                  >
                    {v.status}
                  </span>
                </div>

                <p className="text-xs font-light text-neutral-600 max-w-2xl">{v.outcome}</p>

                <div className="flex items-center gap-4 text-[11px] text-neutral-400 font-light pt-1">
                  <span>Visit Time: {v.visit_date}</span>
                  {v.next_follow_up && (
                    <span className="text-neutral-700 font-normal">
                      Next Follow-up: {v.next_follow_up}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Link
                  href="/customers"
                  className="px-4 min-h-[44px] flex items-center justify-center rounded-full bg-white/70 text-neutral-800 text-xs font-light border border-white/80 hover:bg-black hover:text-white transition-all shadow-sm cursor-pointer"
                >
                  View Shop
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

