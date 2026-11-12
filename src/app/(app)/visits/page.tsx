"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Plus,
  MapPin,
} from "lucide-react";
import { TopHeader } from "@/components/layout/TopHeader";
import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/formatting/dates";

interface VisitRecord {
  id: string;
  customer_id: string;
  customer_name: string;
  shop_name: string;
  visit_date: string;
  outcome: string;
  next_follow_up?: string;
  gps_verified: boolean;
  status: 'completed' | 'upcoming' | 'missed';
}

export default function VisitsPage() {
  const [visits, setVisits] = useState<VisitRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "today">("all");

  useEffect(() => {
    async function loadVisits() {
      try {
        setLoading(true);
        const supabase = createClient();
        const [{ data, error }, { data: followUps }] = await Promise.all([
          supabase
            .from("customer_visits")
            .select("*, customers(name, shop_name)")
            .order("visit_date", { ascending: false }),
          supabase
            .from("follow_ups")
            .select("visit_id, scheduled_for, status"),
        ]);

        const followUpMap = new Map<string, { scheduled_for: string; status: string }>();
        for (const f of followUps || []) {
          if (f.visit_id) {
            followUpMap.set(f.visit_id, { scheduled_for: f.scheduled_for, status: f.status });
          }
        }

        if (!error && data) {
          const mapped: VisitRecord[] = data.map((v: any) => {
            const custName = v.customers?.name || "Customer";
            const shopName = v.customers?.shop_name || custName;
            const fu = followUpMap.get(v.id);
            return {
              id: v.id,
              customer_id: v.customer_id,
              customer_name: custName,
              shop_name: shopName,
              visit_date: v.visit_date || new Date().toISOString().split("T")[0],
              outcome: v.outcome || v.notes || "Visited store",
              next_follow_up: fu?.scheduled_for,
              gps_verified: Boolean(v.gps_lat && v.gps_lng),
              status: fu?.status === "pending" && new Date(fu.scheduled_for) > new Date() ? "upcoming" : "completed",
            };
          });

          setVisits(mapped);
        }
      } catch (e) {
        console.warn("Could not load visits from Supabase", e);
      } finally {
        setLoading(false);
      }
    }
    loadVisits();
  }, []);

  // Filter visits based on selected tab
  const todayStr = new Date().toISOString().split("T")[0];
  const filteredVisits = filter === "today"
    ? visits.filter((v) => v.visit_date.startsWith(todayStr))
    : visits;

  return (
    <div className="min-h-screen pb-12">
      <TopHeader title="Shop Visits" />

      <div className="space-y-6 pt-2">
        {/* KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {/* Card 1: Total Visits */}
          <div className="bg-white/55 backdrop-blur-xl border border-white/65 rounded-[24px] p-4 sm:p-5 shadow-none">
            <span className="text-[11px] sm:text-xs font-light text-neutral-500 block">
              Total visits
            </span>
            <div className="text-2xl sm:text-3xl font-semibold text-neutral-900 mt-1 tracking-tight">
              {visits.length}
            </div>
            <p className="text-[10px] sm:text-[11px] font-light text-neutral-500 mt-0.5 truncate">
              Logged this month
            </p>
          </div>

          {/* Card 2: Completed Visits */}
          <div className="bg-white/55 backdrop-blur-xl border border-white/65 rounded-[24px] p-4 sm:p-5 shadow-none">
            <span className="text-[11px] sm:text-xs font-light text-neutral-500 block">
              Completed
            </span>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="w-2 h-2 rounded-full bg-[#D7FF00]" />
              <span className="text-2xl sm:text-3xl font-semibold text-neutral-900 tracking-tight">
                {visits.filter((v) => v.status === "completed").length}
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] font-light text-neutral-500 mt-0.5 truncate">
              Verified store check-ins
            </p>
          </div>

          {/* Card 3: Upcoming Visits */}
          <div className="bg-white/55 backdrop-blur-xl border border-white/65 rounded-[24px] p-4 sm:p-5 shadow-none">
            <span className="text-[11px] sm:text-xs font-light text-neutral-500 block">
              Upcoming
            </span>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="w-2 h-2 rounded-full bg-[#23D7FF]" />
              <span className="text-2xl sm:text-3xl font-semibold text-neutral-900 tracking-tight">
                {visits.filter((v) => v.status === "upcoming").length}
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] font-light text-neutral-500 mt-0.5 truncate">
              Scheduled field routes
            </p>
          </div>

          {/* Card 4: GPS Check-in */}
          <div className="bg-white/55 backdrop-blur-xl border border-white/65 rounded-[24px] p-4 sm:p-5 shadow-none">
            <span className="text-[11px] sm:text-xs font-light text-neutral-500 block">
              GPS verified
            </span>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-2xl sm:text-3xl font-semibold text-neutral-900 tracking-tight">
                {visits.filter((v) => v.gps_verified).length}
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] font-light text-neutral-500 mt-0.5 truncate">
              Geolocation tracked
            </p>
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
          {loading ? (
            <div className="bg-white/55 backdrop-blur-xl rounded-[24px] p-8 border border-white/65 text-center">
              <p className="text-sm font-light text-neutral-500">Loading visits...</p>
            </div>
          ) : filteredVisits.length === 0 ? (
            <div className="bg-white/55 backdrop-blur-xl rounded-[24px] p-8 border border-white/65 text-center">
              <p className="text-sm font-light text-neutral-500">
                {filter === "today" ? "No visits logged today." : "No visits found."}
              </p>
            </div>
          ) : (
            filteredVisits.map((v) => (
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
                    <span>Visit Date: {formatDate(v.visit_date)}</span>
                    {v.next_follow_up && (
                      <span className="text-neutral-700 font-normal">
                        Next Follow-up: {formatDate(v.next_follow_up)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href={v.customer_id ? `/customers/${v.customer_id}` : "/customers"}
                    className="px-4 min-h-[44px] flex items-center justify-center rounded-full bg-white/70 text-neutral-800 text-xs font-light border border-white/80 hover:bg-black hover:text-white transition-all shadow-sm cursor-pointer"
                  >
                    View Shop
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
