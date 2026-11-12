"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, MapPin, Save } from "lucide-react";
import { toast } from "sonner";
import { TopHeader } from "@/components/layout/TopHeader";
import { StyledSelect } from "@/components/ui/StyledSelect";
import { getCustomers, Customer } from "@/lib/services/customers";
import { createClient } from "@/lib/supabase/client";

const BUSINESS_ID = "00000000-0000-0000-0000-000000000001";

export default function NewVisitPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [customers, setCustomers] = useState<Customer[]>([]);

  const [customer, setCustomer] = useState("");
  const [visitDate, setVisitDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [outcome, setOutcome] = useState("");
  const [nextFollowUp, setNextFollowUp] = useState("");
  const [gpsCaptured, setGpsCaptured] = useState(false);
  const [coords, setCoords] = useState<{ lat?: number; lng?: number }>({});

  useEffect(() => {
    async function loadCusts() {
      setLoadingCustomers(true);
      try {
        const list = await getCustomers({ status: "active" });
        setCustomers(list);
        if (list.length > 0) {
          setCustomer(list[0].id);
        }
      } catch (e) {
        console.warn("Could not load customers", e);
      } finally {
        setLoadingCustomers(false);
      }
    }
    loadCusts();
  }, []);

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
    if (!customer) {
      toast.error("Please add or select a customer first");
      return;
    }
    if (!outcome.trim()) {
      toast.error("Please enter visit outcome and notes");
      return;
    }

    setSubmitting(true);
    try {
      const supabase = createClient();
      const { data: visitRow, error } = await supabase
        .from("customer_visits")
        .insert({
          business_id: BUSINESS_ID,
          customer_id: customer,
          visit_date: visitDate || new Date().toISOString().split("T")[0],
          outcome: outcome.trim(),
          notes: outcome.trim(),
          gps_lat: coords.lat ?? null,
          gps_lng: coords.lng ?? null,
        })
        .select("id")
        .single();

      if (error) throw error;

      if (nextFollowUp && visitRow) {
        const { error: fuErr } = await supabase.from("follow_ups").insert({
          business_id: BUSINESS_ID,
          customer_id: customer,
          visit_id: visitRow.id,
          scheduled_for: new Date(`${nextFollowUp}T09:00:00`).toISOString(),
          notes: outcome.trim(),
        });
        if (fuErr) {
          console.warn("Follow-up scheduling warning:", fuErr.message);
        }
      }

      toast.success("Visit log saved to Supabase!");
      router.push("/visits");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to save visit log");
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

        <form onSubmit={handleSubmit} className="bg-white/55 backdrop-blur-xl rounded-[28px] p-6 sm:p-8 border border-white/65 shadow-none space-y-6">
          <div className="border-b border-white/40 pb-3">
            <h2 className="text-base font-normal text-neutral-900">Visit & Conversation Log</h2>
            <p className="text-xs font-light text-neutral-500">Record customer feedback, stock inquiries or collection discussions</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="min-w-0">
              <label className="block text-xs font-light text-neutral-600 mb-1.5">
                Customer Store *
              </label>
              <StyledSelect
                aria-label="Customer Store"
                value={customer}
                onChange={(e) => setCustomer(e.target.value)}
                disabled={loadingCustomers || customers.length === 0}
                className="w-full h-10 pl-4 text-xs bg-white/65 backdrop-blur-md rounded-full border border-white/70 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#E0FE52]"
              >
                {loadingCustomers ? (
                  <option value="">Loading customers...</option>
                ) : customers.length === 0 ? (
                  <option value="">No active customers found</option>
                ) : (
                  customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.shop_name} {c.contact_person ? `(${c.contact_person})` : ""}
                    </option>
                  ))
                )}
              </StyledSelect>
              {!loadingCustomers && customers.length === 0 && (
                <p className="text-[11px] text-neutral-500 mt-1">
                  <Link href="/customers/new" className="underline text-neutral-900">
                    Add a customer
                  </Link>{" "}
                  before logging a visit.
                </p>
              )}
            </div>

            <div className="min-w-0">
              <label className="block text-xs font-light text-neutral-600 mb-1.5">
                Visit Date *
              </label>
              <input
                type="date"
                value={visitDate}
                onChange={(e) => setVisitDate(e.target.value)}
                required
                className="w-full h-10 px-4 text-xs bg-white/65 backdrop-blur-md rounded-full border border-white/70 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#E0FE52]"
              />
            </div>

            <div className="sm:col-span-2 min-w-0">
              <label className="block text-xs font-light text-neutral-600 mb-1.5">
                Visit Discussion & Outcome *
              </label>
              <textarea
                value={outcome}
                onChange={(e) => setOutcome(e.target.value)}
                rows={3}
                placeholder="What was discussed? Did the store owner request samples or place an order?"
                required
                className="w-full p-3.5 text-xs bg-white/65 backdrop-blur-md rounded-2xl border border-white/70 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#E0FE52]"
              />
            </div>

            <div className="min-w-0">
              <label className="block text-xs font-light text-neutral-600 mb-1.5">
                Next Follow-up Date
              </label>
              <input
                type="date"
                value={nextFollowUp}
                onChange={(e) => setNextFollowUp(e.target.value)}
                className="w-full h-10 px-4 text-xs bg-white/65 backdrop-blur-md rounded-full border border-white/70 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#E0FE52]"
              />
            </div>

            {/* GPS Verification */}
            <div className="flex flex-col justify-end min-w-0">
              <button
                type="button"
                onClick={handleCaptureGps}
                className={`w-full h-10 rounded-full text-xs font-light flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                  gpsCaptured
                    ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                    : "bg-white/70 text-neutral-800 border-white/80 hover:bg-black hover:text-white"
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
              disabled={submitting || !customer}
              className="w-full sm:w-auto px-8 h-11 rounded-full bg-black text-white text-xs sm:text-sm font-normal flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-md disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-4 h-4 text-[#E0FE52]" />
              <span>{submitting ? "Logging Visit..." : "Save Visit Log"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
