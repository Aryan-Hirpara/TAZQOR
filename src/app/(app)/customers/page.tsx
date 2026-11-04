"use client";

import { useState, useEffect, useCallback } from "react";
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
  RefreshCw,
  AlertCircle,
  ChevronDown,
} from "lucide-react";
import { TopHeader } from "@/components/layout/TopHeader";
import { formatINR } from "@/lib/formatting/currency";
import { formatDate } from "@/lib/formatting/dates";
import { getCustomers, Customer } from "@/lib/services/customers";
import { FitNumber } from "@/components/ui/FitNumber";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("active");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    // 10-second timeout handling per spec
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Request timed out after 10s. Please retry.")), 10000)
    );

    try {
      const fetchPromise = getCustomers({
        search,
        type: selectedType,
        status: selectedStatus,
      });

      const data = await Promise.race([fetchPromise, timeoutPromise]);
      setCustomers(data);
    } catch (err: any) {
      setError(err?.message || "Failed to load customers. Please check connection and retry.");
    } finally {
      setLoading(false);
    }
  }, [search, selectedType, selectedStatus]);

  useEffect(() => {
    load();
  }, [load]);

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
      <TopHeader title="Customers" subtitle="Retail Clients & Credit" />

      <div className="space-y-4 sm:space-y-6 pt-2">
        {/* Top Summary Bar - Compact 2-column cards on mobile, 3-column on desktop */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-5">
          {/* Card 1: Total customers */}
          <div className="bg-white/55 dark:bg-[#242422]/80 backdrop-blur-xl border border-white/65 dark:border-white/10 rounded-[24px] p-4 sm:p-6 shadow-none">
            <span className="text-[11px] sm:text-xs font-light text-neutral-500 dark:text-neutral-400 block">
              Total customers
            </span>
            {loading ? (
              <div className="h-8 w-16 bg-neutral-200/60 dark:bg-neutral-700/60 rounded-lg animate-pulse mt-1" />
            ) : (
              <div className="text-2xl sm:text-3xl font-semibold text-neutral-950 dark:text-white mt-1 tracking-tight">
                {customers.length}
              </div>
            )}
            <p className="text-[10px] sm:text-[11px] font-light text-neutral-500 dark:text-neutral-400 mt-0.5 truncate">
              Registered retail outlets
            </p>
          </div>

          {/* Card 2: Active accounts */}
          <div className="bg-white/55 dark:bg-[#242422]/80 backdrop-blur-xl border border-white/65 dark:border-white/10 rounded-[24px] p-4 sm:p-6 shadow-none">
            <span className="text-[11px] sm:text-xs font-light text-neutral-500 dark:text-neutral-400 block">
              Active accounts
            </span>
            {loading ? (
              <div className="h-8 w-16 bg-neutral-200/60 dark:bg-neutral-700/60 rounded-lg animate-pulse mt-1" />
            ) : (
              <div className="text-2xl sm:text-3xl font-semibold text-neutral-900 dark:text-white mt-1 tracking-tight flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#D7FF00] inline-block shrink-0" />
                <span>{customers.filter((c) => c.status === "active").length}</span>
              </div>
            )}
            <p className="text-[10px] sm:text-[11px] font-light text-neutral-500 dark:text-neutral-400 mt-0.5 truncate">
              Ordering regularly
            </p>
          </div>

          {/* Card 3: Total outstanding balance (Spans full width on 2-col mobile) */}
          <div className="col-span-2 sm:col-span-1 bg-white/55 dark:bg-[#242422]/80 backdrop-blur-xl border border-white/65 dark:border-white/10 rounded-[24px] p-4 sm:p-6 shadow-none">
            <span className="text-[11px] sm:text-xs font-light text-neutral-500 dark:text-neutral-400 block">
              Total outstanding balance
            </span>
            {loading ? (
              <div className="h-8 w-28 bg-neutral-200/60 dark:bg-neutral-700/60 rounded-lg animate-pulse mt-1" />
            ) : (
              <div className="mt-1">
                <FitNumber
                  value={totalOutstanding}
                  maxFontSize={26}
                  className="tracking-tight text-neutral-900 dark:text-white font-semibold"
                />
              </div>
            )}
            <p className="text-[10px] sm:text-[11px] font-light text-neutral-500 dark:text-neutral-400 mt-0.5">
              Pending collection across stores
            </p>
          </div>
        </div>

        {/* Filters & Actions Bar */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="flex items-center gap-2 flex-1 max-w-lg">
            {/* Search Input with visible search icon & short placeholder */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search shops"
                className="w-full h-10 pl-10 pr-4 text-xs bg-white/65 dark:bg-[#242422]/80 backdrop-blur-md rounded-full border border-white/70 dark:border-white/10 text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#D7FF00] shadow-none transition-all"
              />
            </div>

            {/* Custom styled select that never clips */}
            <div className="relative">
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="appearance-none h-10 pl-3.5 pr-8 text-xs bg-white/65 dark:bg-[#242422]/80 backdrop-blur-md rounded-full border border-white/70 dark:border-white/10 text-neutral-700 dark:text-neutral-200 font-light focus:outline-none focus:ring-2 focus:ring-[#D7FF00] shadow-none cursor-pointer"
              >
                <option value="all">All types</option>
                <option value="grocery">Grocery / Store</option>
                <option value="hotel">Hotel / Restaurant</option>
                <option value="office">Corporate Office</option>
                <option value="pg">PG / Hostel</option>
                <option value="other">Other</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-neutral-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <Link
            href="/customers/new"
            className="flex items-center justify-center gap-2 h-10 px-5 rounded-full bg-black text-white dark:bg-[#D7FF00] dark:text-black text-xs sm:text-sm font-normal shadow-none hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#D7FF00] dark:text-black" />
            <span>Add Customer</span>
          </Link>
        </div>

        {/* Customer Content Area: Loading Skeletons, Error + Retry, Empty, or List */}
        {loading ? (
          /* Skeleton Cards */
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white/40 dark:bg-[#242422]/50 backdrop-blur-xl rounded-[24px] p-5 border border-white/60 dark:border-white/10 space-y-3 animate-pulse"
              >
                <div className="flex justify-between items-center">
                  <div className="h-4 w-36 bg-neutral-200 dark:bg-neutral-700 rounded" />
                  <div className="h-5 w-16 bg-neutral-200 dark:bg-neutral-700 rounded-full" />
                </div>
                <div className="h-3 w-48 bg-neutral-200 dark:bg-neutral-700 rounded" />
                <div className="flex justify-between pt-2">
                  <div className="h-4 w-20 bg-neutral-200 dark:bg-neutral-700 rounded" />
                  <div className="h-4 w-24 bg-neutral-200 dark:bg-neutral-700 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          /* Error State with Retry Button */
          <div className="bg-white/55 dark:bg-[#242422]/80 backdrop-blur-xl rounded-[28px] p-8 sm:p-12 text-center border border-rose-200/50 dark:border-rose-900/40 space-y-3">
            <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
            <h3 className="text-base font-normal text-neutral-900 dark:text-white">Unable to Load Customers</h3>
            <p className="text-xs font-light text-neutral-500 dark:text-neutral-400 max-w-sm mx-auto">
              {error}
            </p>
            <button
              type="button"
              onClick={load}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-black text-white dark:bg-[#D7FF00] dark:text-black text-xs font-normal hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          </div>
        ) : customers.length === 0 ? (
          /* Friendly Empty State */
          <div className="bg-white/55 dark:bg-[#242422]/80 backdrop-blur-xl rounded-[28px] p-8 sm:p-12 text-center border border-white/65 dark:border-white/10 space-y-3">
            <Users className="w-10 h-10 text-neutral-300 dark:text-neutral-600 mx-auto" />
            <h3 className="text-base font-normal text-neutral-900 dark:text-white">No Customers Found</h3>
            <p className="text-xs font-light text-neutral-500 dark:text-neutral-400 max-w-sm mx-auto">
              No customer records match your filter criteria. Try clearing search or add a new customer.
            </p>
            <Link
              href="/customers/new"
              className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-black text-white dark:bg-[#D7FF00] dark:text-black text-xs font-normal"
            >
              <Plus className="w-3.5 h-3.5 text-[#D7FF00] dark:text-black" />
              <span>Add First Customer</span>
            </Link>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block bg-white/55 dark:bg-[#242422]/80 backdrop-blur-xl rounded-[28px] border border-white/65 dark:border-white/10 overflow-x-auto shadow-none">
              <table className="w-full text-left text-xs">
                <thead className="bg-white/40 dark:bg-neutral-800/40 border-b border-white/60 dark:border-white/10 text-neutral-500 dark:text-neutral-400 font-normal">
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
                <tbody className="divide-y divide-white/50 dark:divide-neutral-700/50">
                  {customers.map((c) => {
                    const TypeIcon = typeIcons[c.type] || Store;
                    return (
                      <tr key={c.id} className="hover:bg-white/40 dark:hover:bg-neutral-800/40 transition-colors">
                        <td className="py-4 px-6">
                          <Link href={`/customers/${c.id}`} className="group">
                            <div className="font-normal text-neutral-900 dark:text-white group-hover:text-black group-hover:underline text-sm">
                              {c.name}
                            </div>
                            <div className="text-[11px] font-light text-neutral-500 dark:text-neutral-400 mt-0.5">
                              {c.shop_name} • <span className="tabular-nums font-normal">{c.customer_code}</span>
                            </div>
                          </Link>
                        </td>

                        <td className="py-4 px-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-light bg-white/60 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 capitalize border border-white/70 dark:border-white/10">
                            <TypeIcon className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400" />
                            {c.type}
                          </span>
                        </td>

                        <td className="py-4 px-4">
                          <div className="text-neutral-900 dark:text-white font-light">{c.contact_person || "—"}</div>
                          <a
                            href={`tel:${c.phone.replace(/\s+/g, "")}`}
                            className="text-[11px] text-neutral-600 dark:text-neutral-400 hover:text-black flex items-center gap-1 mt-0.5 font-light"
                          >
                            <Phone className="w-3 h-3 text-neutral-400" />
                            <span className="tabular-nums">{c.phone}</span>
                          </a>
                        </td>

                        <td className="py-4 px-4">
                          <div className="text-neutral-900 dark:text-white font-light flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-neutral-400" />
                            {c.city}
                          </div>
                          <div className="text-[11px] text-neutral-400 font-light">{c.district || c.state}</div>
                        </td>

                        <td className="py-4 px-4 text-right font-light text-neutral-800 dark:text-neutral-200">
                          {formatINR(c.total_invoiced)}
                        </td>

                        <td className="py-4 px-4 text-right">
                          {c.outstanding > 0 ? (
                            <span className="font-semibold text-neutral-950 dark:text-white flex items-center justify-end gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-[#DB9595]" />
                              <span>{formatINR(c.outstanding)}</span>
                            </span>
                          ) : (
                            <span className="font-light text-neutral-800 dark:text-neutral-300 flex items-center justify-end gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-[#D7FF00]" />
                              <span>Paid in full</span>
                            </span>
                          )}
                        </td>

                        <td className="py-4 px-6 text-right">
                          <Link
                            href={`/customers/${c.id}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/60 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 text-xs font-light hover:bg-black hover:text-white dark:hover:bg-[#D7FF00] dark:hover:text-black border border-white/70 dark:border-white/10 transition-all shadow-none"
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

            {/* Mobile Cards View: compact glass cards with palette dots and tabular-nums IDs */}
            <div className="md:hidden space-y-3">
              {customers.map((c) => {
                const TypeIcon = typeIcons[c.type] || Store;
                return (
                  <div
                    key={c.id}
                    className="bg-white/55 dark:bg-[#242422]/80 backdrop-blur-xl rounded-[24px] p-4 border border-white/65 dark:border-white/10 shadow-none space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span className="text-[10px] tabular-nums font-normal text-neutral-500 dark:text-neutral-400 block mb-0.5">
                          {c.customer_code}
                        </span>
                        <h4 className="text-sm font-semibold text-neutral-900 dark:text-white truncate">
                          {c.name}
                        </h4>
                        <p className="text-xs font-light text-neutral-500 dark:text-neutral-400 truncate">
                          {c.shop_name}
                        </p>
                      </div>

                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-light bg-white/80 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 capitalize border border-white/70 dark:border-white/10 shrink-0">
                        <TypeIcon className="w-3 h-3 text-neutral-500" />
                        {c.type}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1 border-t border-white/40 dark:border-neutral-700/40">
                      <div className="flex items-center gap-1.5 text-neutral-600 dark:text-neutral-400 font-light truncate">
                        <MapPin className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                        <span className="truncate">{c.city}</span>
                      </div>

                      <div>
                        {c.outstanding > 0 ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-white/80 dark:bg-neutral-800 text-neutral-900 dark:text-white border border-white/70 dark:border-white/10">
                            <span className="w-2 h-2 rounded-full bg-[#DB9595]" />
                            <span>{formatINR(c.outstanding)} due</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-light bg-white/80 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-300 border border-white/70 dark:border-white/10">
                            <span className="w-2 h-2 rounded-full bg-[#D7FF00]" />
                            <span>Paid in full</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] font-light text-neutral-400">
                        Added {formatDate(c.created_at)}
                      </span>

                      <Link
                        href={`/customers/${c.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-black text-white dark:bg-[#D7FF00] dark:text-black text-xs font-normal hover:scale-105 active:scale-95 transition-all shadow-none"
                      >
                        <span>View</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Mobile Floating Action Button (FAB) bottom-right */}
      <Link
        href="/customers/new"
        className="md:hidden fixed right-5 bottom-24 z-30 w-12 h-12 rounded-full bg-black text-[#D7FF00] dark:bg-[#D7FF00] dark:text-black flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all"
        title="Add Customer"
        aria-label="Add Customer"
      >
        <Plus className="w-6 h-6" />
      </Link>
    </div>
  );
}
