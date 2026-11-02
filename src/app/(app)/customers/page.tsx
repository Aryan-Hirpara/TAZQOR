"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  Search,
  Plus,
  Phone,
  MessageCircle,
  MapPin,
  ChevronRight,
  Filter,
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
    <div className="min-h-screen">
      <TopHeader
        title="Retail & Commercial Customers"
        subtitle="Manage client shops, purchasing history and credit balances"
      />

      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
        {/* Top Summary Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-3xl p-5 border border-[#E5E4EE] shadow-sm">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Total Customers
            </span>
            <div className="text-2xl font-black text-[#0A0A0A] mt-1">
              {customers.length}
            </div>
            <p className="text-[11px] text-gray-400 mt-0.5">Across Ahmedabad & Gandhinagar</p>
          </div>

          <div className="bg-white rounded-3xl p-5 border border-[#E5E4EE] shadow-sm">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Active Accounts
            </span>
            <div className="text-2xl font-black text-emerald-600 mt-1">
              {customers.filter((c) => c.status === "active").length}
            </div>
            <p className="text-[11px] text-gray-400 mt-0.5">Ordering regularly</p>
          </div>

          <div className="bg-white rounded-3xl p-5 border border-[#E5E4EE] shadow-sm">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Total Outstanding Balance
            </span>
            <div className="text-2xl font-black text-rose-600 mt-1">
              {formatINR(totalOutstanding)}
            </div>
            <p className="text-[11px] text-gray-400 mt-0.5">Pending collection across stores</p>
          </div>
        </div>

        {/* Filters & Actions Bar */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="flex flex-1 items-center gap-2 max-w-lg">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by shop name, contact, phone, city..."
                className="w-full h-11 pl-10 pr-4 text-xs bg-white rounded-full border border-[#E5E4EE] text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#D4F732] shadow-sm transition-all"
              />
            </div>

            {/* Type Filter */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="h-11 px-3 text-xs bg-white rounded-full border border-[#E5E4EE] text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-[#D4F732] shadow-sm"
            >
              <option value="all">All Types</option>
              <option value="grocery">Grocery / Store</option>
              <option value="hotel">Hotel / Restaurant</option>
              <option value="office">Corporate Office</option>
              <option value="pg">PG / Hostel</option>
              <option value="other">Other</option>
            </select>
          </div>

          <Link
            href="/customers/new"
            className="flex items-center justify-center gap-2 h-11 px-5 rounded-full bg-[#0A0A0A] text-white text-xs sm:text-sm font-bold shadow-md hover:bg-black/90 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4 text-[#D4F732]" />
            <span>Add Customer</span>
          </Link>
        </div>

        {/* Customer List: Desktop Table + Mobile Cards */}
        {loading ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-[#E5E4EE]">
            <p className="text-sm text-gray-500">Loading customers...</p>
          </div>
        ) : customers.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-[#E5E4EE] space-y-3">
            <Users className="w-10 h-10 text-gray-300 mx-auto" />
            <h3 className="text-base font-bold text-gray-900">No Customers Found</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              No customer records match your filter criteria. Try clearing search or add a new customer.
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block bg-white rounded-3xl border border-[#E5E4EE] overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F9F8FD] border-b border-[#E5E4EE] text-gray-500 font-bold uppercase tracking-wider">
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
                <tbody className="divide-y divide-[#E5E4EE]">
                  {customers.map((c) => {
                    const TypeIcon = typeIcons[c.type] || Store;
                    return (
                      <tr key={c.id} className="hover:bg-[#F9F8FD]/60 transition-colors">
                        <td className="py-4 px-6">
                          <Link href={`/customers/${c.id}`} className="group">
                            <div className="font-bold text-gray-900 group-hover:text-black group-hover:underline text-sm">
                              {c.name}
                            </div>
                            <div className="text-[11px] text-gray-500 mt-0.5">
                              {c.shop_name} • <span className="font-mono">{c.customer_code}</span>
                            </div>
                          </Link>
                        </td>

                        <td className="py-4 px-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-700 capitalize">
                            <TypeIcon className="w-3.5 h-3.5 text-gray-500" />
                            {c.type}
                          </span>
                        </td>

                        <td className="py-4 px-4">
                          <div className="text-gray-900 font-medium">{c.contact_person || "—"}</div>
                          <a
                            href={`tel:${c.phone.replace(/\s+/g, "")}`}
                            className="text-[11px] text-blue-600 hover:underline flex items-center gap-1 mt-0.5"
                          >
                            <Phone className="w-3 h-3" />
                            {c.phone}
                          </a>
                        </td>

                        <td className="py-4 px-4">
                          <div className="text-gray-900 font-medium flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-gray-400" />
                            {c.city}
                          </div>
                          <div className="text-[11px] text-gray-400">{c.district || c.state}</div>
                        </td>

                        <td className="py-4 px-4 text-right font-medium text-gray-700">
                          {formatINR(c.total_invoiced)}
                        </td>

                        <td className="py-4 px-4 text-right">
                          {c.outstanding > 0 ? (
                            <span className="font-bold text-rose-600">
                              {formatINR(c.outstanding)}
                            </span>
                          ) : (
                            <span className="font-medium text-emerald-600">Paid in Full</span>
                          )}
                        </td>

                        <td className="py-4 px-6 text-right">
                          <Link
                            href={`/customers/${c.id}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-gray-100 text-gray-800 text-xs font-semibold hover:bg-[#0A0A0A] hover:text-white transition-all"
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
                    className="bg-white rounded-3xl p-5 border border-[#E5E4EE] shadow-sm space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-mono text-gray-400 block mb-0.5">
                          {c.customer_code}
                        </span>
                        <Link
                          href={`/customers/${c.id}`}
                          className="font-bold text-base text-gray-900"
                        >
                          {c.name}
                        </Link>
                        <p className="text-xs text-gray-500 mt-0.5">{c.shop_name}</p>
                      </div>

                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-700 capitalize">
                        <TypeIcon className="w-3 h-3" />
                        {c.type}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-2 border-t border-gray-100">
                      <div className="flex items-center gap-1 text-gray-500">
                        <MapPin className="w-3.5 h-3.5 text-gray-400" />
                        <span>{c.city}</span>
                      </div>
                      <div>
                        {c.outstanding > 0 ? (
                          <span className="font-bold text-rose-600">
                            Due: {formatINR(c.outstanding)}
                          </span>
                        ) : (
                          <span className="font-semibold text-emerald-600">Paid</span>
                        )}
                      </div>
                    </div>

                    {/* Mobile Quick Action Buttons (Call, WhatsApp, Profile) */}
                    <div className="grid grid-cols-3 gap-2 pt-2">
                      <a
                        href={`tel:${c.phone.replace(/\s+/g, "")}`}
                        className="flex items-center justify-center gap-1.5 py-2 rounded-xl bg-gray-50 text-gray-800 text-xs font-semibold border border-gray-200"
                      >
                        <Phone className="w-3.5 h-3.5 text-blue-600" />
                        <span>Call</span>
                      </a>

                      {c.whatsapp && (
                        <a
                          href={`https://wa.me/${c.whatsapp.replace(/[^0-9]/g, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-1.5 py-2 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200"
                        >
                          <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                          <span>WhatsApp</span>
                        </a>
                      )}

                      <Link
                        href={`/customers/${c.id}`}
                        className="flex items-center justify-center gap-1 py-2 rounded-xl bg-[#0A0A0A] text-white text-xs font-bold"
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
    </div>
  );
}
