"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Sparkles, MapPin, Phone, Building2 } from "lucide-react";
import { toast } from "sonner";
import { TopHeader } from "@/components/layout/TopHeader";

export default function NewCustomerPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

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
    city: "Ahmedabad",
    district: "Ahmedabad",
    state: "Gujarat",
    pin: "380015",
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
      // Simulate save
      await new Promise((r) => setTimeout(r, 600));
      toast.success(`Customer "${form.name}" created successfully!`);
      router.push("/customers");
    } catch {
      toast.error("Failed to create customer");
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
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-black transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Cancel and back to customers</span>
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E5E4EE] shadow-sm space-y-6">
          <div className="border-b border-gray-100 pb-4">
            <h2 className="text-lg font-bold text-gray-900">Store Profile & Identity</h2>
            <p className="text-xs text-gray-500 mt-0.5">Primary shop identifiers and business category</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Shop / Establishment Name *
              </label>
              <input
                type="text"
                value={form.shop_name}
                onChange={(e) => setForm({ ...form, shop_name: e.target.value })}
                placeholder="e.g. Shreeji Provision Store"
                required
                className="w-full h-11 px-4 text-xs bg-[#F9F8FD] rounded-xl border border-[#E5E4EE] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#D4F732]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Account / Billing Name *
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Shreeji Supermarket"
                required
                className="w-full h-11 px-4 text-xs bg-[#F9F8FD] rounded-xl border border-[#E5E4EE] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#D4F732]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Contact Person Name
              </label>
              <input
                type="text"
                value={form.contact_person}
                onChange={(e) => setForm({ ...form, contact_person: e.target.value })}
                placeholder="e.g. Haresh Bhai (Store Manager)"
                className="w-full h-11 px-4 text-xs bg-[#F9F8FD] rounded-xl border border-[#E5E4EE] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#D4F732]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Customer Type
              </label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full h-11 px-3 text-xs bg-[#F9F8FD] rounded-xl border border-[#E5E4EE] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#D4F732]"
              >
                <option value="grocery">Grocery / Provision Store</option>
                <option value="hotel">Hotel / Restaurant</option>
                <option value="office">Corporate Office</option>
                <option value="pg">PG / Hostel / School</option>
                <option value="mall">Mall / Commercial Complex</option>
                <option value="other">Other Outlet</option>
              </select>
            </div>
          </div>

          <div className="border-b border-gray-100 pb-4 pt-4">
            <h2 className="text-lg font-bold text-gray-900">Communication & Contact</h2>
            <p className="text-xs text-gray-500 mt-0.5">Phone numbers for WhatsApp ordering and payment reminders</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Primary Phone *
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+91 98250 11223"
                required
                className="w-full h-11 px-4 text-xs bg-[#F9F8FD] rounded-xl border border-[#E5E4EE] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#D4F732]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                WhatsApp Number
              </label>
              <input
                type="tel"
                value={form.whatsapp}
                onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                placeholder="+91 98250 11223"
                className="w-full h-11 px-4 text-xs bg-[#F9F8FD] rounded-xl border border-[#E5E4EE] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#D4F732]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Email Address (Optional)
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="store@domain.com"
                className="w-full h-11 px-4 text-xs bg-[#F9F8FD] rounded-xl border border-[#E5E4EE] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#D4F732]"
              />
            </div>
          </div>

          <div className="border-b border-gray-100 pb-4 pt-4">
            <h2 className="text-lg font-bold text-gray-900">Address & Map Location</h2>
            <p className="text-xs text-gray-500 mt-0.5">Used for delivery routes and salesperson visit mapping</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Delivery Address
              </label>
              <textarea
                value={form.delivery_address}
                onChange={(e) => setForm({ ...form, delivery_address: e.target.value })}
                rows={2}
                placeholder="Shop No, Building, Road, Landmark..."
                className="w-full p-3 text-xs bg-[#F9F8FD] rounded-xl border border-[#E5E4EE] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#D4F732]"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  City
                </label>
                <input
                  type="text"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  className="w-full h-11 px-3 text-xs bg-[#F9F8FD] rounded-xl border border-[#E5E4EE]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  District
                </label>
                <input
                  type="text"
                  value={form.district}
                  onChange={(e) => setForm({ ...form, district: e.target.value })}
                  className="w-full h-11 px-3 text-xs bg-[#F9F8FD] rounded-xl border border-[#E5E4EE]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  State
                </label>
                <input
                  type="text"
                  value={form.state}
                  onChange={(e) => setForm({ ...form, state: e.target.value })}
                  className="w-full h-11 px-3 text-xs bg-[#F9F8FD] rounded-xl border border-[#E5E4EE]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  PIN Code
                </label>
                <input
                  type="text"
                  value={form.pin}
                  onChange={(e) => setForm({ ...form, pin: e.target.value })}
                  className="w-full h-11 px-3 text-xs bg-[#F9F8FD] rounded-xl border border-[#E5E4EE]"
                />
              </div>
            </div>

            {/* GPS Coordinates Capture */}
            <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-blue-900 block">GPS Coordinates for Store Map</span>
                <span className="text-[11px] text-blue-700">
                  Latitude: {form.lat || "Not set"} • Longitude: {form.lng || "Not set"}
                </span>
              </div>
              <button
                type="button"
                onClick={handleGetCurrentLocation}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-blue-600 text-white text-xs font-bold shadow-sm hover:bg-blue-700 transition-all shrink-0"
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>Capture GPS</span>
              </button>
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto px-8 h-12 rounded-full bg-[#0A0A0A] text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 hover:bg-black/90 active:scale-95 transition-all shadow-md disabled:opacity-50"
            >
              <Save className="w-4 h-4 text-[#D4F732]" />
              <span>{submitting ? "Saving..." : "Save Customer Record"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

