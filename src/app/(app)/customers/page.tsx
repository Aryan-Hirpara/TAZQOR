"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  Search,
  Plus,
  Phone,
  MapPin,
  ChevronRight,
  Store,
  Building2,
  Hotel,
  Briefcase,
  Home,
} from "lucide-react";
import { TopHeader } from "@/components/layout/TopHeader";
import { formatINR } from "@/lib/formatting/currency";
import { getCustomers, Customer } from "@/lib/services/customers";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("active");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const data = await getCustomers({
        search,
        type: selectedType,
        status: selectedStatus,
      });
      setCustomers(data);
      setLoading(false);
    }
    load();
  }, [search, selectedType, selectedStatus]);

  const totalOutstanding = customers.reduce((sum, c) => sum + (c.outstanding || 0), 0);

  const typeIcons: Record<string, typeof Store> = {
    grocery: Store,
    hotel: Hotel,
    office: Building2,
    pg: Home,
    mall: Briefcase,
    school: Building2,
    other: Store,
  };

  return (
    <div className="min-h-screen pb-12">
      <TopHeader title="Customers" />

      <div className="space-y-6 pt-2">
        {/* Top Summary Bar - Frosted Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="bg-white/55 backdrop-blur-xl border border-white/65 rounded-[24px] p-6 shadow-sm">
            <span className="text-xs font-light text-neutral-500 block">
              Total customers
            </span>
            <div className="text-3xl font-normal text-neutral-950 mt-1 tracking-tight">
              {customers.length}
            </div>
            <p className="text-[11px] font-light text-neutral-500 mt-0.5">Across registered store outlets</p>
          </div>

          <div className="bg-white/55 backdrop-blur-xl border border-white/65 rounded-[24px] p-6 shadow-sm">
            <span className="text-xs font-light text-neutral-500 block">
              Active accounts
            </span>
            <div className="text-3xl font-normal text-emerald-600 mt-1 tracking-tight">
              {customers.filter((c) => c.status === "active").length}
            </div>
            <p className="text-[11px] font-light text-neutral-500 mt-0.5">Ordering regularly</p>
          </div>

          <div className="bg-white/55 backdrop-blur-xl border border-white/65 rounded-[24px] p-6 shadow-sm">
            <span className="text-xs font-light text-neutral-500 block">
              Total outstanding balance
            </span>
            <div className="text-3xl font-normal text-rose-600 mt-1 tracking-tight">
              {formatINR(totalOutstanding)}
            </div>
            <p className="text-[11px] font-light text-neutral-500 mt-0.5">Pending collection across stores</p>
          </div>
        </div>

        {/* Filters & Actions Bar */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="flex flex-1 items-center gap-2 max-w-lg">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search shops, contact persons, phones, cities..."
                className="w-full h-10 pl-10 pr-4 text-xs bg-white/65 backdrop-blur-md rounded-full border border-white/70 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#E0FE52] shadow-sm transition-all"
              />
            </div>

            {/* Type Filter */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="h-10 px-3.5 text-xs bg-white/65 backdrop-blur-md rounded-full border border-white/70 text-neutral-700 font-light focus:outline-none focus:ring-2 focus:ring-[#E0FE52] shadow-sm"
            >
              <option value="all">All types</option>
              <option value="grocery">Grocery / Store</option>
              <option value="hotel">Hotel / Restaurant</option>
              <option value="office">Corporate Office</option>
              <option value="pg">PG / Hostel</option>
              <option value="other">Other</option>
            </select>
          </div>

          <Link
            href="/customers/new"
            className="flex items-center justify-center gap-2 h-10 px-5 rounded-full bg-black text-white text-xs sm:text-sm font-normal shadow-md hover:scale-105 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4 text-[#E0FE52]" />
            <span>Add Customer</span>
          </Link>
        </div>

        {/* Customer List: Desktop Table + Mobile Cards */}
        {loading ? (
          <div className="bg-white/55 backdrop-blur-xl rounded-[28px] p-12 text-center border border-white/65">
            <p className="text-sm font-light text-neutral-500">Loading customers...</p>
          </div>
        ) : customers.length === 0 ? (
          <div className="bg-white/55 backdrop-blur-xl rounded-[28px] p-12 text-center border border-white/65 space-y-3">
            <Users className="w-10 h-10 text-neutral-300 mx-auto" />
            <h3 className="text-base font-normal text-neutral-900">No Customers Found</h3>
            <p className="text-xs font-light text-neutral-500 max-w-sm mx-auto">
              No customer records match your filter criteria. Try clearing search or add a new customer.
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block bg-white/55 backdrop-blur-xl rounded-[28px] border border-white/65 overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs">
                <thead className="bg-white/40 border-b border-white/60 text-neutral-500 font-normal">
                  <tr>
                    <th className="py-4 px-6">Shop & Customer</th>
                    <th className="py-4 px-4">Type</th>
                    <th className="py-4 px-4">Contact</th>
                    <th className="py-4 px-4">Location</th>
                    <th className="py-4 px-4 text-right">Total Invoiced</th>
                    <th className="py-4 px-4 text-right">Outstanding</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/50">
                  {customers.map((c) => {
                    const TypeIcon = typeIcons[c.type] || Store;
                    return (
                      <tr key={c.id} className="hover:bg-white/40 transition-colors">
                        <td className="py-4 px-6">
                          <Link href={`/customers/${c.id}`} className="group">
                            <div className="font-normal text-neutral-900 group-hover:text-black group-hover:underline text-sm">
                              {c.name}
                            </div>
                            <div className="text-[11px] font-light text-neutral-500 mt-0.5">
                              {c.shop_name} • <span className="font-mono">{c.customer_code}</span>
                            </div>
                          </Link>
                        </td>

                        <td className="py-4 px-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-light bg-white/60 text-neutral-700 capitalize border border-white/70">
                            <TypeIcon className="w-3.5 h-3.5 text-neutral-500" />
                            {c.type}
                          </span>
                        </td>

                        <td className="py-4 px-4">
                          <div className="text-neutral-900 font-light">{c.contact_person || "—"}</div>
                          <a
                            href={`tel:${c.phone.replace(/\s+/g, "")}`}
                            className="text-[11px] text-neutral-600 hover:text-black flex items-center gap-1 mt-0.5 font-light"
                          >
                            <Phone className="w-3 h-3 text-neutral-400" />
                            {c.phone}
                          </a>
                        </td>

                        <td className="py-4 px-4">
                          <div className="text-neutral-900 font-light flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-neutral-400" />
                            {c.city}
                          </div>
                          <div className="text-[11px] text-neutral-400 font-light">{c.district || c.state}</div>
                        </td>

                        <td className="py-4 px-4 text-right font-light text-neutral-800">
                          {formatINR(c.total_invoiced)}
                        </td>

                        <td className="py-4 px-4 text-right">
                          {c.outstanding > 0 ? (
                            <span className="font-normal text-rose-600">
                              {formatINR(c.outstanding)}
                            </span>
                          ) : (
                            <span className="font-light text-emerald-600">Paid in full</span>
                          )}
                        </td>

                        <td className="py-4 px-6 text-right">
                          <Link
                            href={`/customers/${c.id}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/60 text-neutral-800 text-xs font-light hover:bg-black hover:text-white border border-white/70 transition-all shadow-sm"
                          >
                            <span>Profile</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="md:hidden space-y-3">
              {customers.map((c) => {
                const TypeIcon = typeIcons[c.type] || Store;
                return (
                  <div
                    key={c.id}
                    className="bg-white/55 backdrop-blur-xl rounded-[24px] p-5 border border-white/65 shadow-sm space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-mono text-neutral-400 block mb-0.5">
                          {c.customer_code}
                        </span>
                        <h4 className="text-sm font-normal text-neutral-900">{c.name}</h4>
                        <p className="text-xs font-light text-neutral-500">{c.shop_name}</p>
                      </div>

                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-light bg-white/60 text-neutral-700 border border-white/70 capitalize">
                        <TypeIcon className="w-3 h-3 text-neutral-500" />
                        {c.type}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-2 border-t border-white/50">
                      <div>
                        <span className="text-[10px] font-light text-neutral-400 block">Outstanding</span>
                        <span className={c.outstanding > 0 ? "font-normal text-rose-600" : "font-light text-emerald-600"}>
                          {c.outstanding > 0 ? formatINR(c.outstanding) : "Paid"}
                        </span>
                      </div>

                      <Link
                        href={`/customers/${c.id}`}
                        className="px-3 py-1 rounded-full bg-black text-white text-xs font-light flex items-center gap-1 shadow-sm"
                      >
                        <span>View</span>
                        <ChevronRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
