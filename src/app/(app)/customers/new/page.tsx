"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, MapPin, Save, Store, User } from "lucide-react";
import { toast } from "sonner";
import { TopHeader } from "@/components/layout/TopHeader";
import { StyledSelect } from "@/components/ui/StyledSelect";
import { createCustomer } from "@/lib/services/customers";

type CustomerAccountMode = "wholesaler" | "single";

export default function NewCustomerPage() {
  const router = useRouter();
  const uid = useId();

  const [accountMode, setAccountMode] = useState<CustomerAccountMode>("wholesaler");
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

  const switchAccountMode = (nextMode: CustomerAccountMode) => {
    setAccountMode(nextMode);
    if (nextMode === "single") {
      setForm((prev) => ({
        ...prev,
        type: "other",
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        type: prev.type === "other" ? "grocery" : prev.type,
      }));
    }
  };

  const handleWholesalerTypeChange = (value: string) => {
    if (value === "single_customer") {
      switchAccountMode("single");
      return;
    }
    setForm((prev) => ({ ...prev, type: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = form.name.trim();
    const trimmedShop = form.shop_name.trim();
    const trimmedPhone = form.phone.trim();

    if (accountMode === "wholesaler") {
      if (!trimmedShop || !trimmedName || !trimmedPhone) {
        toast.error("Please fill in shop name, billing name, and primary phone");
        return;
      }
    } else if (!trimmedName || !trimmedPhone) {
      toast.error("Please fill in customer full name and primary phone");
      return;
    }

    setSubmitting(true);
    try {
      await createCustomer({
        name: trimmedName,
        shop_name: accountMode === "wholesaler" ? trimmedShop : "",
        contact_person: accountMode === "wholesaler" ? form.contact_person.trim() : "",
        phone: trimmedPhone,
        whatsapp: form.whatsapp.trim(),
        email: form.email.trim(),
        type: (accountMode === "single" ? "other" : form.type) as any,
        billing_address: form.billing_address.trim(),
        delivery_address: form.delivery_address.trim(),
        city: form.city.trim(),
        district: form.district.trim(),
        state: form.state.trim(),
        pin: form.pin.trim(),
        lat: form.lat ? Number(form.lat) : undefined,
        lng: form.lng ? Number(form.lng) : undefined,
        notes: form.notes.trim(),
      });
      toast.success(
        accountMode === "single"
          ? `Single customer "${trimmedName}" saved to Supabase!`
          : `Shop / Wholesaler "${trimmedShop || trimmedName}" saved to Supabase!`
      );
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
    <div className="min-h-screen pb-28 sm:pb-12">
      <TopHeader
        title="Add New Customer"
        subtitle={
          accountMode === "single"
            ? "Onboard an individual or walk-in retail customer"
            : "Onboard a shop, hotel, wholesaler or commercial account"
        }
      />

      <div className="p-4 sm:p-6 lg:p-8 space-y-5 max-w-4xl mx-auto">
        <div>
          <Link
            href="/customers"
            className="inline-flex items-center gap-1.5 min-h-[44px] text-xs font-semibold text-neutral-600 hover:text-black transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Cancel and back to customers</span>
          </Link>
        </div>

        {/* Two-Option Account Mode Selector */}
        <fieldset className="bg-white/65 backdrop-blur-xl rounded-[24px] p-2 border border-black/10">
          <legend className="sr-only">Select customer account mode</legend>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <label
              htmlFor={`${uid}-mode-wholesaler`}
              className={`relative flex items-center gap-3.5 rounded-[18px] px-4 py-3 cursor-pointer ${
                accountMode === "wholesaler"
                  ? "bg-black text-white shadow-sm"
                  : "bg-white/85 text-neutral-800 border border-black/10 hover:bg-white"
              }`}
            >
              <input
                id={`${uid}-mode-wholesaler`}
                type="radio"
                name="customer_mode"
                value="wholesaler"
                checked={accountMode === "wholesaler"}
                onChange={() => switchAccountMode("wholesaler")}
                className="sr-only"
              />
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                  accountMode === "wholesaler"
                    ? "bg-[#E0FE52] text-black"
                    : "bg-neutral-100 text-neutral-700 border border-black/10"
                }`}
              >
                <Store className="w-4 h-4" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <div className="text-xs sm:text-sm font-medium leading-tight">
                  Shop / Wholesaler
                </div>
                <div
                  className={`text-[11px] font-light mt-0.5 truncate ${
                    accountMode === "wholesaler" ? "text-neutral-300" : "text-neutral-500"
                  }`}
                >
                  Stores, hotels, wholesalers & commercial outlets
                </div>
              </div>
            </label>

            <label
              htmlFor={`${uid}-mode-single`}
              className={`relative flex items-center gap-3.5 rounded-[18px] px-4 py-3 cursor-pointer ${
                accountMode === "single"
                  ? "bg-black text-white shadow-sm"
                  : "bg-white/85 text-neutral-800 border border-black/10 hover:bg-white"
              }`}
            >
              <input
                id={`${uid}-mode-single`}
                type="radio"
                name="customer_mode"
                value="single"
                checked={accountMode === "single"}
                onChange={() => switchAccountMode("single")}
                className="sr-only"
              />
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                  accountMode === "single"
                    ? "bg-[#E0FE52] text-black"
                    : "bg-neutral-100 text-neutral-700 border border-black/10"
                }`}
              >
                <User className="w-4 h-4" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <div className="text-xs sm:text-sm font-medium leading-tight">
                  Single Customer
                </div>
                <div
                  className={`text-[11px] font-light mt-0.5 truncate ${
                    accountMode === "single" ? "text-neutral-300" : "text-neutral-500"
                  }`}
                >
                  Individual, home delivery or walk-in buyer
                </div>
              </div>
            </label>
          </div>
        </fieldset>

        <form
          onSubmit={handleSubmit}
          className="bg-white/65 backdrop-blur-xl rounded-[28px] p-6 sm:p-8 border border-black/10 shadow-none space-y-6"
        >
          {accountMode === "wholesaler" ? (
            <>
              <div className="border-b border-white/40 pb-4">
                <h2 className="text-base font-normal text-neutral-900">Store Profile & Identity</h2>
                <p className="text-xs font-light text-neutral-500 mt-0.5">
                  Primary shop identifiers and wholesaler / business category
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="min-w-0">
                  <label
                    htmlFor={`${uid}-shop-name`}
                    className="block text-xs font-light text-neutral-600 mb-1.5"
                  >
                    Shop / Establishment Name <span aria-hidden="true">*</span>
                  </label>
                  <input
                    id={`${uid}-shop-name`}
                    name="shop_name"
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
                    className="w-full h-10 px-4 text-base sm:text-xs bg-white/85 backdrop-blur-md rounded-full border border-black/10 text-neutral-900 placeholder-neutral-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E0FE52]"
                  />
                </div>

                <div className="min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <label
                      htmlFor={`${uid}-billing-name`}
                      className="block text-xs font-light text-neutral-600"
                    >
                      Account / Billing Name <span aria-hidden="true">*</span>
                    </label>
                    <label className="inline-flex items-center gap-1.5 cursor-pointer shrink-0">
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
                      <span className="text-[11px] font-light text-neutral-600">
                        Same as shop name
                      </span>
                    </label>
                  </div>
                  <input
                    id={`${uid}-billing-name`}
                    name="name"
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Enter shop or company name"
                    required
                    className="w-full h-10 px-4 text-base sm:text-xs bg-white/85 backdrop-blur-md rounded-full border border-black/10 text-neutral-900 placeholder-neutral-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E0FE52]"
                  />
                </div>

                <div className="min-w-0">
                  <label
                    htmlFor={`${uid}-contact-person`}
                    className="block text-xs font-light text-neutral-600 mb-1.5"
                  >
                    Contact Person Name
                  </label>
                  <input
                    id={`${uid}-contact-person`}
                    name="contact_person"
                    type="text"
                    value={form.contact_person}
                    onChange={(e) => setForm({ ...form, contact_person: e.target.value })}
                    placeholder="e.g. Haresh Bhai (Store Manager)"
                    className="w-full h-10 px-4 text-base sm:text-xs bg-white/85 backdrop-blur-md rounded-full border border-black/10 text-neutral-900 placeholder-neutral-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E0FE52]"
                  />
                </div>

                <div className="min-w-0">
                  <label
                    htmlFor={`${uid}-customer-type`}
                    className="block text-xs font-light text-neutral-600 mb-1.5"
                  >
                    Customer Type
                  </label>
                  <StyledSelect
                    id={`${uid}-customer-type`}
                    aria-label="Customer Type"
                    value={form.type}
                    onChange={(e) => handleWholesalerTypeChange(e.target.value)}
                    className="w-full h-10 py-0 pl-4 text-base sm:text-xs bg-white/65 backdrop-blur-md rounded-full border border-white/70 text-neutral-900 font-normal focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E0FE52]"
                  >
                    <option value="grocery">Grocery / Provision Store</option>
                    <option value="hotel">Hotel / Restaurant</option>
                    <option value="office">Corporate Office</option>
                    <option value="pg">PG / Hostel / School</option>
                    <option value="mall">Mall / Commercial Complex</option>
                    <option value="other">Wholesaler / Other Outlet</option>
                    <option value="single_customer">Single Customer / Individual →</option>
                  </StyledSelect>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="border-b border-white/40 pb-4">
                <h2 className="text-base font-normal text-neutral-900">Single Customer Details</h2>
                <p className="text-xs font-light text-neutral-500 mt-0.5">
                  Direct retail buyer profile without store or wholesaler business fields
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2 min-w-0">
                  <label
                    htmlFor={`${uid}-single-name`}
                    className="block text-xs font-light text-neutral-600 mb-1.5"
                  >
                    Customer Full Name <span aria-hidden="true">*</span>
                  </label>
                  <input
                    id={`${uid}-single-name`}
                    name="name"
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Rohan Patel"
                    required
                    className="w-full h-10 px-4 text-base sm:text-xs bg-white/85 backdrop-blur-md rounded-full border border-black/10 text-neutral-900 placeholder-neutral-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E0FE52]"
                  />
                </div>
              </div>
            </>
          )}

          {/* Shared Communication & Contact Section */}
          <div className="border-b border-white/40 pb-4 pt-2">
            <h2 className="text-base font-normal text-neutral-900">Communication & Contact</h2>
            <p className="text-xs font-light text-neutral-500 mt-0.5">
              Phone numbers for WhatsApp ordering and payment reminders
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="min-w-0">
              <label
                htmlFor={`${uid}-phone`}
                className="block text-xs font-light text-neutral-600 mb-1.5"
              >
                Primary Phone <span aria-hidden="true">*</span>
              </label>
              <input
                id={`${uid}-phone`}
                name="phone"
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
                className="w-full h-10 px-4 text-base sm:text-xs bg-white/85 backdrop-blur-md rounded-full border border-black/10 text-neutral-900 placeholder-neutral-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E0FE52]"
              />
            </div>

            <div className="min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <label
                  htmlFor={`${uid}-whatsapp`}
                  className="block text-xs font-light text-neutral-600"
                >
                  WhatsApp Number
                </label>
                <label className="inline-flex items-center gap-1.5 cursor-pointer shrink-0">
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
                id={`${uid}-whatsapp`}
                name="whatsapp"
                type="tel"
                value={form.whatsapp}
                onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                placeholder="+91 98250 11223"
                className="w-full h-10 px-4 text-base sm:text-xs bg-white/85 backdrop-blur-md rounded-full border border-black/10 text-neutral-900 placeholder-neutral-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E0FE52]"
              />
            </div>

            <div className="min-w-0">
              <label
                htmlFor={`${uid}-email`}
                className="block text-xs font-light text-neutral-600 mb-1.5"
              >
                Email Address (Optional)
              </label>
              <input
                id={`${uid}-email`}
                name="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder={accountMode === "single" ? "customer@email.com" : "store@domain.com"}
                className="w-full h-10 px-4 text-base sm:text-xs bg-white/85 backdrop-blur-md rounded-full border border-black/10 text-neutral-900 placeholder-neutral-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E0FE52]"
              />
            </div>
          </div>

          {/* Shared Address & Map Location */}
          <div className="border-b border-white/40 pb-4 pt-2">
            <h2 className="text-base font-normal text-neutral-900">Address & Map Location</h2>
            <p className="text-xs font-light text-neutral-500 mt-0.5">
              {accountMode === "single"
                ? "Home or drop-off location for deliveries"
                : "Used for delivery routes and salesperson visit mapping"}
            </p>
          </div>

          <div className="space-y-4">
            <div className="min-w-0">
              <label
                htmlFor={`${uid}-address`}
                className="block text-xs font-light text-neutral-600 mb-1.5"
              >
                Delivery Address
              </label>
              <textarea
                id={`${uid}-address`}
                name="delivery_address"
                value={form.delivery_address}
                onChange={(e) => setForm({ ...form, delivery_address: e.target.value })}
                rows={2}
                placeholder={
                  accountMode === "single"
                    ? "House / Flat No., Society, Road, Landmark..."
                    : "Shop No, Building, Road, Landmark..."
                }
                className="w-full p-3.5 text-base sm:text-xs bg-white/85 backdrop-blur-md rounded-2xl border border-black/10 text-neutral-900 placeholder-neutral-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E0FE52]"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="min-w-0">
                <label
                  htmlFor={`${uid}-city`}
                  className="block text-xs font-light text-neutral-600 mb-1.5"
                >
                  City
                </label>
                <input
                  id={`${uid}-city`}
                  name="city"
                  type="text"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  className="w-full h-10 px-4 text-base sm:text-xs bg-white/85 backdrop-blur-md rounded-full border border-black/10 text-neutral-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E0FE52]"
                />
              </div>

              <div className="min-w-0">
                <label
                  htmlFor={`${uid}-district`}
                  className="block text-xs font-light text-neutral-600 mb-1.5"
                >
                  District
                </label>
                <input
                  id={`${uid}-district`}
                  name="district"
                  type="text"
                  value={form.district}
                  onChange={(e) => setForm({ ...form, district: e.target.value })}
                  className="w-full h-10 px-4 text-base sm:text-xs bg-white/85 backdrop-blur-md rounded-full border border-black/10 text-neutral-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E0FE52]"
                />
              </div>

              <div className="min-w-0">
                <label
                  htmlFor={`${uid}-state`}
                  className="block text-xs font-light text-neutral-600 mb-1.5"
                >
                  State
                </label>
                <input
                  id={`${uid}-state`}
                  name="state"
                  type="text"
                  value={form.state}
                  onChange={(e) => setForm({ ...form, state: e.target.value })}
                  className="w-full h-10 px-4 text-base sm:text-xs bg-white/85 backdrop-blur-md rounded-full border border-black/10 text-neutral-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E0FE52]"
                />
              </div>

              <div className="min-w-0">
                <label
                  htmlFor={`${uid}-pin`}
                  className="block text-xs font-light text-neutral-600 mb-1.5"
                >
                  PIN Code
                </label>
                <input
                  id={`${uid}-pin`}
                  name="pin"
                  type="text"
                  inputMode="numeric"
                  value={form.pin}
                  onChange={(e) => setForm({ ...form, pin: e.target.value })}
                  className="w-full h-10 px-4 text-base sm:text-xs bg-white/85 backdrop-blur-md rounded-full border border-black/10 text-neutral-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E0FE52]"
                />
              </div>
            </div>

            <div className="min-w-0">
              <label
                htmlFor={`${uid}-notes`}
                className="block text-xs font-light text-neutral-600 mb-1.5"
              >
                Notes (Optional)
              </label>
              <textarea
                id={`${uid}-notes`}
                name="notes"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={2}
                placeholder={
                  accountMode === "single"
                    ? "Preferred pack sizes, delivery timing, or notes..."
                    : "Wholesale credit terms, delivery slot, or account notes..."
                }
                className="w-full p-3.5 text-base sm:text-xs bg-white/85 backdrop-blur-md rounded-2xl border border-black/10 text-neutral-900 placeholder-neutral-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E0FE52]"
              />
            </div>

            {/* GPS Coordinates Capture */}
            <div className="p-4 rounded-2xl bg-white/50 border border-white/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-normal text-neutral-900 block">
                  {accountMode === "single"
                    ? "GPS Coordinates for Delivery Pin"
                    : "GPS Coordinates for Store Map"}
                </span>
                <span className="text-[11px] font-light text-neutral-500">
                  Latitude: {form.lat || "Not captured"} • Longitude: {form.lng || "Not captured"}
                </span>
              </div>
              <button
                type="button"
                onClick={handleGetCurrentLocation}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-black text-white text-xs font-light shadow-sm hover:scale-105 active:scale-95 transition-all shrink-0 cursor-pointer"
              >
                <MapPin className="w-3.5 h-3.5 text-[#E0FE52]" aria-hidden="true" />
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
              <div className="rounded-2xl border border-dashed border-black/15 h-28 bg-white/30 flex items-center justify-center text-xs text-neutral-500 font-light px-4 text-center">
                {accountMode === "single"
                  ? "Click Capture GPS to preview the delivery pin on the map"
                  : "Click Capture GPS to preview the store pin on the map"}
              </div>
            )}
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto px-8 h-11 rounded-full bg-black text-white text-xs sm:text-sm font-normal flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-md disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-4 h-4 text-[#E0FE52]" aria-hidden="true" />
              <span>
                {submitting
                  ? "Saving..."
                  : accountMode === "single"
                  ? "Save Single Customer"
                  : "Save Shop / Wholesaler"}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
