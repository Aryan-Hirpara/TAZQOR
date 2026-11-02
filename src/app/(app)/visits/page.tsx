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
    <div className="min-h-screen">
      <TopHeader
        title="Store Visits & Follow-ups"
        subtitle="Track field salesperson client check-ins, sales pitches and revisit schedule"
      />

      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
        {/* KPI Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-3xl p-5 border border-[#E5E4EE] shadow-sm">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
              Today&apos;s Store Visits
            </span>
            <div className="text-2xl font-black text-gray-900 mt-1">
              2 Scheduled
            </div>
            <p className="text-[11px] text-gray-400 mt-0.5">1 Completed, 1 Pending</p>
          </div>

          <div className="bg-white rounded-3xl p-5 border border-[#E5E4EE] shadow-sm">
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider block">
              Total Logged This Month
            </span>
            <div className="text-2xl font-black text-emerald-700 mt-1">
              18 Visits
            </div>
            <p className="text-[11px] text-gray-400 mt-0.5">14 Resulted in fresh orders</p>
          </div>

          <div className="bg-white rounded-3xl p-5 border border-[#E5E4EE] shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
                GPS Verified
              </span>
              <p className="text-xs text-gray-700 font-bold mt-1">Browser Geolocation Check-in</p>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <MapPin className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 p-1 bg-white rounded-full border border-[#E5E4EE] shadow-sm">
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-1.5 text-xs font-bold rounded-full transition-all ${
                filter === "all" ? "bg-[#0A0A0A] text-white" : "text-gray-500 hover:text-black"
              }`}
            >
              All Logs
            </button>
            <button
              onClick={() => setFilter("today")}
              className={`px-4 py-1.5 text-xs font-bold rounded-full transition-all ${
                filter === "today" ? "bg-[#0A0A0A] text-white" : "text-gray-500 hover:text-black"
              }`}
            >
              Today
            </button>
          </div>

          <Link
            href="/visits/new"
            className="flex items-center gap-1.5 px-5 h-11 rounded-full bg-[#0A0A0A] text-white text-xs sm:text-sm font-bold shadow-md hover:bg-black/90 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4 text-[#D4F732]" />
            <span>Log Visit</span>
          </Link>
        </div>

        {/* Visits List */}
        <div className="space-y-3">
          {visits.map((v) => (
            <div
              key={v.id}
              className="bg-white rounded-3xl p-5 sm:p-6 border border-[#E5E4EE] shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-gray-900">{v.customer_name}</h3>
                  <span className="text-[11px] text-gray-500">({v.shop_name})</span>
                  {v.gps_verified && (
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
                      <MapPin className="w-3 h-3" />
                      GPS
                    </span>
                  )}
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold capitalize ${
                      v.status === "completed"
                        ? "bg-emerald-50 text-emerald-800"
                        : "bg-amber-50 text-amber-800"
                    }`}
                  >
                    {v.status}
                  </span>
                </div>

                <p className="text-xs text-gray-600 max-w-2xl">{v.outcome}</p>

                <div className="flex items-center gap-4 text-[11px] text-gray-400 font-medium pt-1">
                  <span>Visit Time: {v.visit_date}</span>
                  {v.next_follow_up && (
                    <span className="text-gray-700 font-semibold">
                      Next Follow-up: {v.next_follow_up}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Link
                  href="/customers"
                  className="px-4 py-2 rounded-full bg-gray-100 text-gray-800 text-xs font-bold hover:bg-black hover:text-white transition-all"
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
