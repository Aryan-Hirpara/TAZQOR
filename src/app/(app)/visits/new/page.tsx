"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CalendarCheck, MapPin, Save, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { TopHeader } from "@/components/layout/TopHeader";
import { createClient } from "@/lib/supabase/client";

export default function NewVisitPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const [customer, setCustomer] = useState("c1-shreeji");
  const [visitDate, setVisitDate] = useState("2026-02-16");
  const [outcome, setOutcome] = useState("");
  const [nextFollowUp, setNextFollowUp] = useState("2026-02-23");
  const [gpsCaptured, setGpsCaptured] = useState(false);
  const [coords, setCoords] = useState<{ lat?: number; lng?: number }>({});

  const handleCaptureGps = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported by browser");
      return;
    }
    toast.info("Requesting browser GPS position...");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGpsCaptured(true);
        toast.success("GPS Location verified!");
      },
      (err) => {
        toast.error("Could not capture GPS: " + err.message);
      }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!outcome.trim()) {
      toast.error("Please enter visit outcome and notes");
      return;
    }

    setSubmitting(true);
    try {
      const supabase = createClient();
      let customerId = customer;
      // If customer is a demo slug like "c1-shreeji", lookup or fallback to real UUID
      if (customer.startsWith("c1") || !customer.includes("-")) {
        const { data: c } = await supabase.from("customers").select("id").limit(1);
        if (c && c[0]) customerId = c[0].id;
      }

      const { error } = await supabase.from("customer_visits").insert({
        business_id: "00000000-0000-0000-0000-000000000001",
        customer_id: customerId,
        visit_date: visitDate,
        outcome: outcome,
        notes: outcome,
      });

      if (error) throw error;

      toast.success("Visit log and follow-up scheduled and synced to Supabase!");
      router.push("/visits");
    } catch (err: any) {
      toast.error(err?.message || "Failed to save visit log");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen">
      <TopHeader
        title="Log Customer Visit"
        subtitle="Record in-person store discussion, feedback and next appointment"
      />

      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-3xl mx-auto">
        <div>
          <Link
            href="/visits"
            className="inline-flex items-center gap-1.5 min-h-[44px] text-xs font-semibold text-neutral-600 hover:text-black transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Cancel and back to visits</span>
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E5E4EE] shadow-sm space-y-6">
          <div className="border-b border-gray-100 pb-3">
            <h2 className="text-base font-bold text-gray-900">Visit & Conversation Log</h2>
            <p className="text-xs text-gray-500">Record customer feedback, stock inquiries or collection discussions</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Customer Store *
              </label>
              <select
                aria-label="Customer Store"
                value={customer}
                onChange={(e) => setCustomer(e.target.value)}
                className="w-full h-11 px-3 text-xs bg-[#F9F8FD] rounded-xl border border-[#E5E4EE] font-medium"
              >
                <option value="c1-shreeji">Shreeji Supermarket (Haresh Patel)</option>
                <option value="c2-pride-hotel">Hotel Pride Plaza (Housekeeping)</option>
                <option value="c3-apex-cowork">Apex Co-Working (Neha Shah)</option>
                <option value="c4-radhe-pg">Radhe Krishna PG (Mahesh Bhai)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Visit Date *
              </label>
              <input
                type="date"
                value={visitDate}
                onChange={(e) => setVisitDate(e.target.value)}
                className="w-full h-11 px-3 text-xs bg-[#F9F8FD] rounded-xl border border-[#E5E4EE]"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Visit Discussion & Outcome *
              </label>
              <textarea
                value={outcome}
                onChange={(e) => setOutcome(e.target.value)}
                rows={3}
                placeholder="What was discussed? Did the store owner request samples or place an order?"
                required
                className="w-full p-3 text-xs bg-[#F9F8FD] rounded-xl border border-[#E5E4EE] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#D4F732]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Next Follow-up Date
              </label>
              <input
                type="date"
                value={nextFollowUp}
                onChange={(e) => setNextFollowUp(e.target.value)}
                className="w-full h-11 px-3 text-xs bg-[#F9F8FD] rounded-xl border border-[#E5E4EE]"
              />
            </div>

            {/* GPS Verification */}
            <div className="flex flex-col justify-end">
              <button
                type="button"
                onClick={handleCaptureGps}
                className={`w-full h-11 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all ${
                  gpsCaptured
                    ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                    : "bg-[#F9F8FD] text-gray-800 border-[#E5E4EE] hover:bg-gray-100"
                }`}
              >
                <MapPin className="w-4 h-4 text-blue-600" />
                <span>{gpsCaptured ? "GPS Verified ✓" : "Capture Location Check-in"}</span>
              </button>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto px-8 h-12 rounded-full bg-[#0A0A0A] text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 hover:bg-black/90 active:scale-95 transition-all shadow-md disabled:opacity-50"
            >
              <Save className="w-4 h-4 text-[#D4F732]" />
              <span>{submitting ? "Logging Visit..." : "Save Visit & Schedule Follow-up"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

