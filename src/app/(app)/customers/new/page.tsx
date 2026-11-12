"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Sparkles, MapPin, Phone, Building2 } from "lucide-react";
import { toast } from "sonner";
import { TopHeader } from "@/components/layout/TopHeader";
import { StyledSelect } from "@/components/ui/StyledSelect";
import { createCustomer } from "@/lib/services/customers";

export default function NewCustomerPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [sameAsShopName, setSameAsShopName] = useState(false);
  const [sameAsPrimaryPhone, setSameAsPrimaryPhone] = useState(false);

  const [form, setForm] = useState({
    name: "",
    shop_name: "",
    contact_person: "",
    phone: "",
    whatsapp: "",
    email: "",
    type: "grocery",
    billing_address: "",
    delivery_address: "",
    city: "",
    district: "",
    state: "",
    pin: "",
    lat: "",
    lng: "",
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.shop_name) {
      toast.error("Please fill in shop name, customer name, and primary phone");
      return;
    }

    setSubmitting(true);
    try {
      await createCustomer({
        ...form,
        type: form.type as any,
        lat: form.lat ? Number(form.lat) : undefined,
        lng: form.lng ? Number(form.lng) : undefined,
      });
      toast.success(`Customer "${form.name}" created and synced to Supabase!`);
      router.push("/customers");
    } catch (err: any) {
      toast.error(err?.message || "Failed to create customer");
    } finally {
      setSubmitting(false);
    }
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    toast.info("Requesting GPS coordinates...");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((prev) => ({
          ...prev,
          lat: pos.coords.latitude.toFixed(6),
          lng: pos.coords.longitude.toFixed(6),
        }));
        toast.success("Current location captured!");
      },
      (err) => {
        toast.error("Could not capture GPS location: " + err.message);
      }
    );
  };

  return (
    <div className="min-h-screen">
      <TopHeader
        title="Add New Customer"
        subtitle="Onboard a retail store or commercial cleaning account"
      />

      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-4xl mx-auto">
        <div>
          <Link
            href="/customers"
            className="inline-flex items-center gap-1.5 min-h-[44px] text-xs font-semibold text-neutral-600 hover:text-black transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Cancel and back to customers</span>
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="bg-white/55 backdrop-blur-xl rounded-[28px] p-6 sm:p-8 border border-white/65 shadow-none space-y-6">
          <div className="border-b border-white/40 pb-4">
            <h2 className="text-base font-normal text-neutral-900">Store Profile & Identity</h2>
            <p className="text-xs font-light text-neutral-500 mt-0.5">Primary shop identifiers and business category</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-light text-neutral-600 mb-1.5">
                Shop / Establishment Name *
              </label>
              <input
                type="text"
                value={form.shop_name}
                onChange={(e) => {
                  const val = e.target.value;
                  setForm((prev) => ({
                    ...prev,
                    shop_name: val,
                    ...(sameAsShopName ? { name: val } : {}),
                  }));
                }}
                placeholder="e.g. Shreeji Provision Store"
                required
                className="w-full h-10 px-4 text-xs bg-white/65 backdrop-blur-md rounded-full border border-white/70 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#E0FE52]"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-light text-neutral-600">
                  Account / Billing Name *
                </label>
                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sameAsShopName}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setSameAsShopName(checked);
                      if (checked) {
                        setForm((prev) => ({ ...prev, name: prev.shop_name }));
                      }
                    }}
                    className="w-3.5 h-3.5 rounded text-neutral-900 focus:ring-[#E0FE52] accent-neutral-900 cursor-pointer"
                  />
                  <span className="text-[11px] font-light text-neutral-600">Same as shop name</span>
                </label>
              </div>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Enter shop or company name"
                required
                className="w-full h-10 px-4 text-xs bg-white/65 backdrop-blur-md rounded-full border border-white/70 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#E0FE52]"
              />
            </div>

            <div>
              <label className="block text-xs font-light text-neutral-600 mb-1.5">
                Contact Person Name
              </label>
              <input
                type="text"
                value={form.contact_person}
                onChange={(e) => setForm({ ...form, contact_person: e.target.value })}
                placeholder="e.g. Haresh Bhai (Store Manager)"
                className="w-full h-10 px-4 text-xs bg-white/65 backdrop-blur-md rounded-full border border-white/70 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#E0FE52]"
              />
            </div>

            <div>
              <label className="block text-xs font-light text-neutral-600 mb-1.5">
                Customer Type
              </label>
              <StyledSelect
                aria-label="Customer Type"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full h-10 pl-4 text-xs bg-white/65 backdrop-blur-md rounded-full border border-white/70 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#E0FE52]"
              >
                <option value="grocery">Grocery / Provision Store</option>
                <option value="hotel">Hotel / Restaurant</option>
                <option value="office">Corporate Office</option>
                <option value="pg">PG / Hostel / School</option>
                <option value="mall">Mall / Commercial Complex</option>
                <option value="other">Other Outlet</option>
              </StyledSelect>
            </div>
          </div>

          <div className="border-b border-white/40 pb-4 pt-4">
            <h2 className="text-base font-normal text-neutral-900">Communication & Contact</h2>
            <p className="text-xs font-light text-neutral-500 mt-0.5">Phone numbers for WhatsApp ordering and payment reminders</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-light text-neutral-600 mb-1.5">
                Primary Phone *
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => {
                  const val = e.target.value;
                  setForm((prev) => ({
                    ...prev,
                    phone: val,
                    ...(sameAsPrimaryPhone ? { whatsapp: val } : {}),
                  }));
                }}
                placeholder="+91 98250 11223"
                required
                className="w-full h-10 px-4 text-xs bg-white/65 backdrop-blur-md rounded-full border border-white/70 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#E0FE52]"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-light text-neutral-600">
                  WhatsApp Number
                </label>
                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sameAsPrimaryPhone}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setSameAsPrimaryPhone(checked);
                      if (checked) {
                        setForm((prev) => ({ ...prev, whatsapp: prev.phone }));
                      }
                    }}
                    className="w-3.5 h-3.5 rounded text-neutral-900 focus:ring-[#E0FE52] accent-neutral-900 cursor-pointer"
                  />
                  <span className="text-[11px] font-light text-neutral-600">Same as primary</span>
                </label>
              </div>
              <input
                type="tel"
                value={form.whatsapp}
                onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                placeholder="+91 98250 11223"
                className="w-full h-10 px-4 text-xs bg-white/65 backdrop-blur-md rounded-full border border-white/70 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#E0FE52]"
              />
            </div>

            <div>
              <label className="block text-xs font-light text-neutral-600 mb-1.5">
                Email Address (Optional)
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="store@domain.com"
                className="w-full h-10 px-4 text-xs bg-white/65 backdrop-blur-md rounded-full border border-white/70 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#E0FE52]"
              />
            </div>
          </div>

          <div className="border-b border-white/40 pb-4 pt-4">
            <h2 className="text-base font-normal text-neutral-900">Address & Map Location</h2>
            <p className="text-xs font-light text-neutral-500 mt-0.5">Used for delivery routes and salesperson visit mapping</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-light text-neutral-600 mb-1.5">
                Delivery Address
              </label>
              <textarea
                value={form.delivery_address}
                onChange={(e) => setForm({ ...form, delivery_address: e.target.value })}
                rows={2}
                placeholder="Shop No, Building, Road, Landmark..."
                className="w-full p-3.5 text-xs bg-white/65 backdrop-blur-md rounded-2xl border border-white/70 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#E0FE52]"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-light text-neutral-600 mb-1.5">
                  City
                </label>
                <input
                  type="text"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  className="w-full h-10 px-4 text-xs bg-white/65 backdrop-blur-md rounded-full border border-white/70 text-neutral-900"
                />
              </div>

              <div>
                <label className="block text-xs font-light text-neutral-600 mb-1.5">
                  District
                </label>
                <input
                  type="text"
                  value={form.district}
                  onChange={(e) => setForm({ ...form, district: e.target.value })}
                  className="w-full h-10 px-4 text-xs bg-white/65 backdrop-blur-md rounded-full border border-white/70 text-neutral-900"
                />
              </div>

              <div>
                <label className="block text-xs font-light text-neutral-600 mb-1.5">
                  State
                </label>
                <input
                  type="text"
                  value={form.state}
                  onChange={(e) => setForm({ ...form, state: e.target.value })}
                  className="w-full h-10 px-4 text-xs bg-white/65 backdrop-blur-md rounded-full border border-white/70 text-neutral-900"
                />
              </div>

              <div>
                <label className="block text-xs font-light text-neutral-600 mb-1.5">
                  PIN Code
                </label>
                <input
                  type="text"
                  value={form.pin}
                  onChange={(e) => setForm({ ...form, pin: e.target.value })}
                  className="w-full h-10 px-4 text-xs bg-white/65 backdrop-blur-md rounded-full border border-white/70 text-neutral-900"
                />
              </div>
            </div>

            {/* GPS Coordinates Capture */}
            <div className="p-4 rounded-2xl bg-white/50 border border-white/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-normal text-neutral-900 block">GPS Coordinates for Store Map</span>
                <span className="text-[11px] font-light text-neutral-500">
                  Latitude: {form.lat || "Not captured"} • Longitude: {form.lng || "Not captured"}
                </span>
              </div>
              <button
                type="button"
                onClick={handleGetCurrentLocation}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-black text-white text-xs font-light shadow-sm hover:scale-105 active:scale-95 transition-all shrink-0 cursor-pointer"
              >
                <MapPin className="w-3.5 h-3.5 text-[#E0FE52]" />
                <span>Capture GPS</span>
              </button>
            </div>

            {/* Google Maps Pin Location Preview */}
            {form.lat && form.lng ? (
              <div className="rounded-2xl overflow-hidden border border-white/70 h-48 bg-neutral-100 relative">
                <iframe
                  title="Google Maps Location Preview"
                  src={`https://www.google.com/maps?q=${form.lat},${form.lng}&z=14&output=embed`}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-black/15 h-32 bg-white/30 flex items-center justify-center text-xs text-neutral-500 font-light">
                Click Capture GPS to preview the store pin on the map
              </div>
            )}
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto px-8 h-11 rounded-full bg-black text-white text-xs sm:text-sm font-normal flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-md disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-4 h-4 text-[#E0FE52]" />
              <span>{submitting ? "Saving..." : "Save Customer Record"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

