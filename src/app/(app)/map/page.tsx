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
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-light transition-all ${
                viewMode === "map" ? "bg-black text-white font-normal shadow-sm" : "text-neutral-700 hover:text-black"
              }`}
            >
              <MapIcon className="w-3.5 h-3.5" />
              <span>Map View</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-light transition-all ${
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
            <div className="lg:col-span-8 bg-white/55 backdrop-blur-xl rounded-[28px] p-6 border border-white/65 shadow-sm flex flex-col justify-between min-h-[500px] relative overflow-hidden">
              {/* Map Canvas with simulated OSM Grid & real markers */}
              <div className="absolute inset-0 bg-[#E8ECEF] flex items-center justify-center">
                {/* SVG Map Background Pattern */}
                <div className="w-full h-full opacity-40 bg-[radial-gradient(#CBD5E1_1px,transparent_1px)] [background-size:16px_16px]" />

                {/* Simulated OSM Pins for Ahmedabad and Gandhinagar */}
                {mapPins.map((c, i) => {
                  const isSelected = selectedCustomer?.id === c.id;
                  // Position relative to canvas coordinates
                  const topPos = 30 + (i * 18);
                  const leftPos = 25 + (i * 20);

                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setSelectedCustomer(c)}
                      style={{ top: `${topPos}%`, left: `${leftPos}%` }}
                      className={`absolute -translate-x-1/2 -translate-y-1/2 p-2 rounded-2xl flex items-center gap-2 shadow-xl transition-all duration-300 ${
                        isSelected
                          ? "bg-[#0A0A0A] text-[#D4F732] scale-110 z-20 ring-4 ring-[#D4F732]/40"
                          : "bg-white text-gray-900 hover:scale-105 z-10"
                      }`}
                    >
                      <MapPin className="w-4 h-4 fill-current" />
                      <div className="text-left pr-1">
                        <div className="text-xs font-black leading-tight">{c.name}</div>
                        <div className="text-[10px] text-gray-400 leading-tight">{c.city}</div>
                      </div>
                    </button>
                  );
                })}

                <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-[10px] text-gray-500 font-mono shadow-sm">
                  OpenStreetMap • 4 Stores Positioned in Gujarat
                </div>
              </div>
            </div>

            {/* Selected Store Detail Card */}
            <div className="lg:col-span-4 space-y-4">
              {selectedCustomer ? (
                <div className="bg-white rounded-3xl p-6 border border-[#E5E4EE] shadow-sm space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-gray-100 text-gray-700">
                      {selectedCustomer.customer_code}
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 capitalize">
                      {selectedCustomer.type}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{selectedCustomer.name}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{selectedCustomer.shop_name}</p>
                    <p className="text-xs text-gray-700 mt-2 font-medium">
                      Contact: {selectedCustomer.contact_person}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[#F9F8FD] border border-[#E5E4EE] space-y-1 text-xs">
                    <span className="font-bold text-gray-700 block">Location Coordinates:</span>
                    <p className="text-gray-500">{selectedCustomer.delivery_address || selectedCustomer.city}</p>
                    <p className="font-mono text-[11px] text-gray-600">
                      Lat: {selectedCustomer.lat} • Lng: {selectedCustomer.lng}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-2">
                    <span className="text-gray-500">Outstanding Balance:</span>
                    <span className="font-black text-rose-600 text-sm">
                      {formatINR(selectedCustomer.outstanding)}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <a
                      href={`tel:${selectedCustomer.phone.replace(/\s+/g, "")}`}
                      className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-gray-100 text-gray-800 text-xs font-bold hover:bg-gray-200 transition-all"
                    >
                      <Phone className="w-3.5 h-3.5 text-blue-600" />
                      <span>Call</span>
                    </a>

                    {selectedCustomer.lat && selectedCustomer.lng && (
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${selectedCustomer.lat},${selectedCustomer.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-all"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Directions</span>
                      </a>
                    )}
                  </div>

                  <Link
                    href={`/customers/${selectedCustomer.id}`}
                    className="block w-full py-2.5 rounded-xl bg-[#0A0A0A] text-white text-xs font-bold text-center hover:bg-black/80 transition-all"
                  >
                    View Full Account Profile
                  </Link>
                </div>
              ) : (
                <div className="bg-white rounded-3xl p-8 text-center text-xs text-gray-500 border border-[#E5E4EE]">
                  Select a store pin to view details
                </div>
              )}
            </div>
          </div>
        ) : (
          /* List Fallback Mode */
          <div className="bg-white rounded-3xl border border-[#E5E4EE] overflow-hidden shadow-sm">
            <div className="divide-y divide-gray-100">
              {customers.map((c) => (
                <div key={c.id} className="p-5 flex items-center justify-between gap-4 hover:bg-gray-50/60">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-gray-900">{c.name}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 font-semibold capitalize">
                        {c.type}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{c.shop_name} • {c.city}, {c.state}</p>
                    {c.lat && c.lng && (
                      <p className="text-[11px] font-mono text-gray-400 mt-1">
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

