"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Users,
  Search,
  Plus,
  Phone,
  MessageCircle,
  Mail,
  MapPin,
  ChevronRight,
  Store,
  Building2,
  Hotel,
  Briefcase,
  Home,
  RefreshCw,
  AlertCircle,
  Trash2,
} from "lucide-react";
import { TopHeader } from "@/components/layout/TopHeader";
import { formatINR } from "@/lib/formatting/currency";
import { getCustomers, deleteCustomer, Customer } from "@/lib/services/customers";
import { FitNumber } from "@/components/ui/FitNumber";
import { StyledSelect } from "@/components/ui/StyledSelect";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { toast } from "sonner";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("active");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<Customer | null>(null);
  const [archiving, setArchiving] = useState(false);
  const [archiveError, setArchiveError] = useState<string | null>(null);

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

  const handleConfirmArchive = async () => {
    if (!archiveTarget) return;
    setArchiving(true);
    setArchiveError(null);
    const res = await deleteCustomer(archiveTarget.id);
    if (!res.success) {
      setArchiveError(res.error || "Failed to archive customer");
      setArchiving(false);
      return;
    }
    toast.success(`Customer "${archiveTarget.shop_name || archiveTarget.name}" archived`);
    setArchiveTarget(null);
    setArchiving(false);
    await load();
  };

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
          <div className="bg-white/55 backdrop-blur-xl border border-white/65 rounded-[24px] p-4 sm:p-6 shadow-none">
            <span className="text-[11px] sm:text-xs font-light text-neutral-500 block">
              Total customers
            </span>
            {loading ? (
              <div className="h-8 w-16 bg-neutral-200/60 rounded-lg animate-pulse mt-1" />
            ) : (
              <div className="text-2xl sm:text-3xl font-semibold text-neutral-950 mt-1 tracking-tight">
                {customers.length}
              </div>
            )}
            <p className="text-[10px] sm:text-[11px] font-light text-neutral-500 mt-0.5 truncate">
              Registered retail outlets
            </p>
          </div>

          {/* Card 2: Active accounts */}
          <div className="bg-white/55 backdrop-blur-xl border border-white/65 rounded-[24px] p-4 sm:p-6 shadow-none">
            <span className="text-[11px] sm:text-xs font-light text-neutral-500 block">
              Active accounts
            </span>
            {loading ? (
              <div className="h-8 w-16 bg-neutral-200/60 rounded-lg animate-pulse mt-1" />
            ) : (
              <div className="text-2xl sm:text-3xl font-semibold text-neutral-900 mt-1 tracking-tight flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#D7FF00] inline-block shrink-0" />
                <span>{customers.filter((c) => c.status === "active").length}</span>
              </div>
            )}
            <p className="text-[10px] sm:text-[11px] font-light text-neutral-500 mt-0.5 truncate">
              Ordering regularly
            </p>
          </div>

          {/* Card 3: Total outstanding balance (Spans full width on 2-col mobile) */}
          <div className="col-span-2 sm:col-span-1 bg-white/55 backdrop-blur-xl border border-white/65 rounded-[24px] p-4 sm:p-6 shadow-none">
            <span className="text-[11px] sm:text-xs font-light text-neutral-500 block">
              Total outstanding balance
            </span>
            {loading ? (
              <div className="h-8 w-28 bg-neutral-200/60 rounded-lg animate-pulse mt-1" />
            ) : (
              <div className="mt-1">
                <FitNumber
                  value={totalOutstanding}
                  maxFontSize={26}
                  className="tracking-tight text-neutral-900 font-semibold"
                />
              </div>
            )}
            <p className="text-[10px] sm:text-[11px] font-light text-neutral-500 mt-0.5">
              Pending collection across stores
            </p>
          </div>
        </div>

        {/* Filters & Actions Bar */}
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1 max-w-2xl min-w-0">
            {/* Search Input with visible search icon & short placeholder */}
            <div className="relative flex-1 min-w-0 sm:min-w-[180px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 z-10 pointer-events-none" />
              <input
                type="search"
                aria-label="Search customer shops"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search shops"
                className="w-full h-10 pl-10 pr-4 text-xs bg-white/65 backdrop-blur-md rounded-full border border-white/70 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#D7FF00] shadow-none transition-all"
              />
            </div>

            {/* Custom styled selects that never clip */}
            <StyledSelect
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              aria-label="Filter customers by type"
              wrapperClassName="w-full sm:w-44 shrink-0"
              className="h-10 py-0 pl-3.5 text-xs bg-white/65 backdrop-blur-md rounded-full border border-white/70 text-neutral-700 font-light focus:outline-none focus:ring-2 focus:ring-[#D7FF00]"
            >
              <option value="all">All types</option>
              <option value="grocery">Grocery / Store</option>
              <option value="hotel">Hotel / Restaurant</option>
              <option value="office">Corporate Office</option>
              <option value="pg">PG / Hostel</option>
              <option value="other">Single Customer / Other</option>
            </StyledSelect>

            <StyledSelect
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              aria-label="Filter customers by status"
              wrapperClassName="w-full sm:w-36 shrink-0"
              className="h-10 py-0 pl-3.5 text-xs bg-white/65 backdrop-blur-md rounded-full border border-white/70 text-neutral-700 font-light focus:outline-none focus:ring-2 focus:ring-[#D7FF00]"
            >
              <option value="active">Active</option>
              <option value="archived">Archived</option>
            </StyledSelect>
          </div>

          <Link
            href="/customers/new"
            className="flex items-center justify-center gap-2 h-10 px-5 rounded-full bg-black text-white text-xs sm:text-sm font-normal shadow-none hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#D7FF00]" />
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
                className="bg-white/40 backdrop-blur-xl rounded-[24px] p-5 border border-white/60 space-y-3 animate-pulse"
              >
                <div className="flex justify-between items-center">
                  <div className="h-4 w-36 bg-neutral-200 rounded" />
                  <div className="h-5 w-16 bg-neutral-200 rounded-full" />
                </div>
                <div className="h-3 w-48 bg-neutral-200 rounded" />
                <div className="flex justify-between pt-2">
                  <div className="h-4 w-20 bg-neutral-200 rounded" />
                  <div className="h-4 w-24 bg-neutral-200 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          /* Error State with Retry Button */
          <div className="bg-white/55 backdrop-blur-xl rounded-[28px] p-8 sm:p-12 text-center border border-rose-200/50 space-y-3">
            <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
            <h3 className="text-base font-normal text-neutral-900">Unable to Load Customers</h3>
            <p className="text-xs font-light text-neutral-500 max-w-sm mx-auto">
              {error}
            </p>
            <button
              type="button"
              onClick={load}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-black text-white text-xs font-normal hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          </div>
        ) : customers.length === 0 ? (
          /* Friendly Empty State */
          <div className="bg-white/55 backdrop-blur-xl rounded-[28px] p-8 sm:p-12 text-center border border-white/65 space-y-3">
            <Users className="w-10 h-10 text-neutral-300 mx-auto" />
            <h3 className="text-base font-normal text-neutral-900">No Customers Found</h3>
            <p className="text-xs font-light text-neutral-500 max-w-sm mx-auto">
              No customer records match your filter criteria. Try clearing search or add a new customer.
            </p>
            <Link
              href="/customers/new"
              className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-black text-white text-xs font-normal"
            >
              <Plus className="w-3.5 h-3.5 text-[#D7FF00]" />
              <span>Add First Customer</span>
            </Link>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block bg-white/55 backdrop-blur-xl rounded-[28px] border border-white/65 table-wrapper shadow-none">
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
                              {c.shop_name === c.name && c.type === "other" ? "Single Customer" : c.shop_name}
                              {c.customer_code ? (
                                <>
                                  {" • "}
                                  <span className="tabular-nums font-normal">{c.customer_code}</span>
                                </>
                              ) : null}
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
                            <span className="tabular-nums">{c.phone}</span>
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
                            <span className="font-semibold text-neutral-950 flex items-center justify-end gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-[#DB9595]" />
                              <span>{formatINR(c.outstanding)}</span>
                            </span>
                          ) : (
                            <span className="font-light text-neutral-800 flex items-center justify-end gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-[#D7FF00]" />
                              <span>Paid in full</span>
                            </span>
                          )}
                        </td>

                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <a
                              href={`tel:${c.phone.replace(/\s+/g, "")}`}
                              title="Call Store"
                              className="w-8 h-8 rounded-full bg-white/70 hover:bg-black hover:text-white flex items-center justify-center text-neutral-700 transition-all border border-white/80"
                            >
                              <Phone className="w-3.5 h-3.5" />
                            </a>
                            <a
                              href={`https://wa.me/${(c.whatsapp || c.phone || "").replace(/[^0-9]/g, "")}?text=${encodeURIComponent(`Hello ${c.contact_person || c.shop_name}, greetings from TAZQOR!`)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="WhatsApp Message"
                              className="w-8 h-8 rounded-full bg-emerald-50 hover:bg-emerald-600 hover:text-white flex items-center justify-center text-emerald-700 transition-all border border-emerald-200/60"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                            </a>
                            {c.email && (
                              <a
                                href={`mailto:${c.email}?subject=${encodeURIComponent(`Business - ${c.shop_name || c.name}`)}`}
                                title="Send Email"
                                className="w-8 h-8 rounded-full bg-blue-50 hover:bg-blue-600 hover:text-white flex items-center justify-center text-blue-700 transition-all border border-blue-200/60"
                              >
                                <Mail className="w-3.5 h-3.5" />
                              </a>
                            )}
                            {c.status !== "archived" && (
                              <button
                                type="button"
                                onClick={() => {
                                  setArchiveError(null);
                                  setArchiveTarget(c);
                                }}
                                title="Archive Customer"
                                aria-label={`Archive ${c.shop_name || c.name}`}
                                className="w-8 h-8 rounded-full bg-rose-50 hover:bg-rose-600 hover:text-white flex items-center justify-center text-rose-600 transition-all border border-rose-200/60 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <Link
                              href={`/customers/${c.id}`}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/60 text-neutral-800 text-xs font-light hover:bg-black hover:text-white border border-white/70 transition-all shadow-none ml-1"
                            >
                              <span>Profile</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </Link>
                          </div>
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
                    className="bg-white/55 backdrop-blur-xl rounded-[24px] p-4 border border-white/65 shadow-none space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span className="text-[10px] tabular-nums font-normal text-neutral-500 block mb-0.5">
                          {c.customer_code}
                        </span>
                        <h4 className="text-sm font-semibold text-neutral-900 truncate">
                          {c.name}
                        </h4>
                        <p className="text-xs font-light text-neutral-500 truncate">
                          {c.shop_name}
                        </p>
                      </div>

                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-light bg-white/80 text-neutral-700 capitalize border border-white/70 shrink-0">
                        <TypeIcon className="w-3 h-3 text-neutral-500" />
                        {c.type}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1 border-t border-white/40">
                      <div className="flex items-center gap-1.5 text-neutral-600 font-light truncate">
                        <MapPin className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                        <span className="truncate">{c.city}</span>
                      </div>

                      <div>
                        {c.outstanding > 0 ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-white/80 text-neutral-900 border border-white/70">
                            <span className="w-2 h-2 rounded-full bg-[#DB9595]" />
                            <span>{formatINR(c.outstanding)} due</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-light bg-white/80 text-neutral-800 border border-white/70">
                            <span className="w-2 h-2 rounded-full bg-[#D7FF00]" />
                            <span>Paid in full</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-white/30">
                      <div className="flex items-center gap-1.5">
                        <a
                          href={`tel:${c.phone.replace(/\s+/g, "")}`}
                          className="w-9 h-9 rounded-full bg-white/70 flex items-center justify-center text-neutral-800 border border-white/80 active:scale-95"
                          title="Call"
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </a>
                        <a
                          href={`https://wa.me/${(c.whatsapp || c.phone || "").replace(/[^0-9]/g, "")}?text=${encodeURIComponent(`Hello ${c.contact_person || c.shop_name}, greetings from TAZQOR!`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200/60 active:scale-95"
                          title="WhatsApp"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </a>
                        {c.email && (
                          <a
                            href={`mailto:${c.email}?subject=${encodeURIComponent(`Business - ${c.shop_name || c.name}`)}`}
                            className="w-9 h-9 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-200/60 active:scale-95"
                            title="Mail"
                          >
                            <Mail className="w-3.5 h-3.5" />
                          </a>
                        )}
                        {c.status !== "archived" && (
                          <button
                            type="button"
                            onClick={() => {
                              setArchiveError(null);
                              setArchiveTarget(c);
                            }}
                            className="w-9 h-9 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-200/60 active:scale-95 cursor-pointer"
                            title="Archive Customer"
                            aria-label={`Archive ${c.shop_name || c.name}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <Link
                        href={`/customers/${c.id}`}
                        className="inline-flex items-center justify-center gap-1 px-4 min-h-[44px] rounded-full bg-black text-white text-xs font-normal hover:scale-105 active:scale-95 transition-all shadow-none"
                      >
                        <span>Profile</span>
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

      <ConfirmDialog
        open={Boolean(archiveTarget)}
        title={`Archive "${archiveTarget?.shop_name || archiveTarget?.name || "customer"}"?`}
        description="Archived customers are hidden from active customer lists and new order/invoice dropdowns while preserving historical invoices and ledger statements."
        confirmLabel="Archive Customer"
        tone="danger"
        loading={archiving}
        error={archiveError}
        onConfirm={handleConfirmArchive}
        onClose={() => {
          setArchiveTarget(null);
          setArchiveError(null);
        }}
      />
    </div>
  );
}
