"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  MapPin,
  Phone,
  MessageCircle,
  ExternalLink,
  Store,
  Hotel,
  Building2,
  Home,
  Layers,
  Search,
  List,
  Map as MapIcon,
  ChevronRight,
} from "lucide-react";
import { TopHeader } from "@/components/layout/TopHeader";
import { formatINR } from "@/lib/formatting/currency";
import { getCustomers, Customer } from "@/lib/services/customers";

export default function StoreMapPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [viewMode, setViewMode] = useState<"map" | "list">("map");
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  useEffect(() => {
    async function load() {
      const data = await getCustomers({ search, type: selectedType });
      setCustomers(data);
      if (data.length > 0 && !selectedCustomer) {
        setSelectedCustomer(data[0]);
      }
    }
    load();
  }, [search, selectedType]);

  const mapPins = customers.filter((c) => c.lat && c.lng);

  return (
    <div className="min-h-screen pb-12">
      <TopHeader title="Store Map" />

      <div className="space-y-6 pt-2">
        {/* Controls Bar */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="flex flex-1 items-center gap-2 max-w-lg">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search shops or city..."
                className="w-full h-10 pl-10 pr-4 text-xs bg-white/65 backdrop-blur-md rounded-full border border-white/70 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#E0FE52] shadow-sm transition-all"
              />
            </div>

            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              aria-label="Filter stores by type"
              className="h-10 px-3.5 text-xs bg-white/65 backdrop-blur-md rounded-full border border-white/70 text-neutral-700 font-light focus:outline-none focus:ring-2 focus:ring-[#E0FE52] shadow-sm"
            >
              <option value="all">All Types</option>
              <option value="grocery">Grocery</option>
              <option value="hotel">Hotel</option>
              <option value="office">Office</option>
              <option value="pg">PG</option>
            </select>
          </div>

          {/* Map vs List Toggle */}
          <div className="flex items-center gap-1.5 p-1 bg-white/55 backdrop-blur-md rounded-full border border-white/70 shadow-sm">
            <button
              type="button"
              onClick={() => setViewMode("map")}
              className={`flex items-center justify-center gap-1.5 px-4 min-h-[44px] rounded-full text-xs font-light transition-all cursor-pointer ${
                viewMode === "map" ? "bg-black text-white font-normal shadow-sm" : "text-neutral-700 hover:text-black"
              }`}
            >
              <MapIcon className="w-3.5 h-3.5" />
              <span>Map View</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`flex items-center justify-center gap-1.5 px-4 min-h-[44px] rounded-full text-xs font-light transition-all cursor-pointer ${
                viewMode === "list" ? "bg-black text-white font-normal shadow-sm" : "text-neutral-700 hover:text-black"
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>List Fallback</span>
            </button>
          </div>
        </div>

        {/* View Mode: Map + Interactive Sidebar */}
        {viewMode === "map" ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Interactive Map Canvas Container */}
            <div className="lg:col-span-8 bg-white/55 backdrop-blur-xl rounded-[28px] border border-white/65 shadow-sm flex flex-col justify-between min-h-[520px] relative overflow-hidden">
              {/* Real Google Map iframe */}
              <div className="absolute inset-0 bg-[#E8ECEF]">
                <iframe
                  title="Google Maps Gujarat Stores"
                  src={`https://www.google.com/maps?q=${selectedCustomer?.lat || 23.0225},${selectedCustomer?.lng || 72.5714}&z=13&output=embed`}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="w-full h-full"
                />

                {/* Store Selector Strip overlaid on Map */}
                <div className="absolute top-4 left-4 right-4 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none pointer-events-auto">
                  {mapPins.map((c) => {
                    const isSelected = selectedCustomer?.id === c.id;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setSelectedCustomer(c)}
                        className={`px-3.5 py-1.5 rounded-full flex items-center gap-2 shadow-md transition-all shrink-0 cursor-pointer text-xs ${
                          isSelected
                            ? "bg-black text-[#E0FE52] font-normal scale-105"
                            : "bg-white/95 backdrop-blur-md text-neutral-800 font-light hover:bg-white"
                        }`}
                      >
                        <MapPin className="w-3.5 h-3.5 fill-current" />
                        <span>{c.shop_name || c.name}</span>
                        <span className="text-[10px] opacity-70">({c.city})</span>
                      </button>
                    );
                  })}
                </div>

                <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm px-3.5 py-1.5 rounded-full text-[10px] text-neutral-700 font-mono shadow-sm border border-white/80 pointer-events-none">
                  Google Maps • {mapPins.length} Stores in Gujarat Live
                </div>
              </div>
            </div>

            {/* Selected Store Detail Card */}
            <div className="lg:col-span-4 space-y-4">
              {selectedCustomer ? (
                <div className="bg-white/55 backdrop-blur-xl rounded-[28px] p-6 border border-white/65 shadow-none space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-white/60">
                    <span className="text-xs font-mono font-normal px-2.5 py-0.5 rounded-full bg-white/70 border border-white/80 text-neutral-700">
                      {selectedCustomer.customer_code}
                    </span>
                    <span className="text-xs font-normal px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-800 capitalize">
                      {selectedCustomer.type}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-normal text-neutral-900">{selectedCustomer.name}</h3>
                    <p className="text-xs text-neutral-500 font-light mt-0.5">{selectedCustomer.shop_name}</p>
                    <p className="text-xs text-neutral-700 mt-2 font-light">
                      Contact: {selectedCustomer.contact_person}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-white/60 border border-white/70 space-y-1 text-xs">
                    <span className="font-normal text-neutral-800 block">Location Coordinates:</span>
                    <p className="text-neutral-500 font-light">{selectedCustomer.delivery_address || selectedCustomer.city}</p>
                    <p className="font-mono text-[11px] text-neutral-600">
                      Lat: {selectedCustomer.lat} • Lng: {selectedCustomer.lng}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-2">
                    <span className="text-neutral-500 font-light">Outstanding Balance:</span>
                    <span className="font-semibold text-rose-600 text-sm">
                      {formatINR(selectedCustomer.outstanding)}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <a
                      href={`tel:${selectedCustomer.phone.replace(/\s+/g, "")}`}
                      className="flex items-center justify-center gap-1.5 py-2.5 rounded-full bg-white/70 border border-white/80 text-neutral-800 text-xs font-normal hover:bg-white transition-all"
                    >
                      <Phone className="w-3.5 h-3.5 text-blue-600" />
                      <span>Call</span>
                    </a>

                    {selectedCustomer.lat && selectedCustomer.lng && (
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${selectedCustomer.lat},${selectedCustomer.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-1.5 py-2.5 rounded-full bg-black text-white text-xs font-normal hover:bg-neutral-800 transition-all"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Directions</span>
                      </a>
                    )}
                  </div>

                  <Link
                    href={`/customers/${selectedCustomer.id}`}
                    className="block w-full py-2.5 rounded-full bg-black text-white text-xs font-normal text-center hover:bg-neutral-800 transition-all"
                  >
                    View Full Account Profile
                  </Link>
                </div>
              ) : (
                <div className="bg-white/55 backdrop-blur-xl rounded-[28px] p-8 text-center text-xs text-neutral-500 font-light border border-white/65 shadow-none">
                  Select a store pin to view details
                </div>
              )}
            </div>
          </div>
        ) : (
          /* List Fallback Mode */
          <div className="bg-white/55 backdrop-blur-xl rounded-[28px] border border-white/65 overflow-hidden shadow-none">
            <div className="divide-y divide-white/40">
              {customers.map((c) => (
                <div key={c.id} className="p-5 flex items-center justify-between gap-4 hover:bg-white/40 transition-colors">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-normal text-neutral-900">{c.name}</span>
                      <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-white/80 border border-white/80 font-normal text-neutral-700 capitalize">
                        {c.type}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{c.shop_name} • {c.city}, {c.state}</p>
                    {c.lat && c.lng && (
                      <p className="text-[11px] font-mono text-neutral-600 mt-1">
                        GPS: {c.lat}, {c.lng}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {c.lat && c.lng && (
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${c.lat},${c.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100"
                        title="Directions"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                    <Link
                      href={`/customers/${c.id}`}
                      className="px-3.5 py-1.5 rounded-full bg-gray-100 text-gray-800 text-xs font-bold hover:bg-black hover:text-white transition-all"
                    >
                      Profile
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

