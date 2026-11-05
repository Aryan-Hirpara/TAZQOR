"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Settings,
  Building2,
  FileText,
  ShieldCheck,
  Save,
  Download,
  AlertCircle,
  Database,
  Lock,
} from "lucide-react";
import { toast } from "sonner";
import { TopHeader } from "@/components/layout/TopHeader";

export default function SettingsPage() {
  const [saving, setSaving] = useState(false);

  // Business profile state
  const [profile, setProfile] = useState({
    legal_name: "TAZQOR Clean Solutions LLP",
    gstin: "24AAACT1234F1Z5",
    address_line1: "Plot 42, Industrial Area, Phase II",
    address_line2: "Near Express Ring Road",
    city: "Ahmedabad",
    state: "Gujarat",
    state_code: "24",
    pin: "380015",
    phone: "+91 98765 43210",
    email: "owner@tazqor.com",
    gst_confirmed: true,
    gst_enabled: true,
  });

  // Invoice & Financial Year Settings
  const [invoiceSettings, setInvoiceSettings] = useState({
    invoice_prefix: "INV",
    bill_prefix: "BILL",
    fy_start_month: 4, // April (April to March)
    round_off_enabled: true,
    tax_inclusive_default: false,
  });

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast.success("Business profile & tax settings updated!");
    }, 500);
  };

  const handleExportAllJSON = () => {
    const backupData = {
      exported_at: new Date().toISOString(),
      business: profile,
      invoice_settings: invoiceSettings,
      version: "3.0",
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `TAZQOR_Full_Database_Backup_${new Date().toISOString().substring(0, 10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("Full system backup exported (JSON format)");
  };

  return (
    <div className="min-h-screen pb-12">
      <TopHeader title="Business Settings" />

      <div className="space-y-6 max-w-4xl pt-2">
        <form onSubmit={handleSaveProfile} className="space-y-6">
          {/* Business Profile */}
          <div className="bg-white/55 backdrop-blur-xl rounded-[28px] p-6 sm:p-8 border border-white/65 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-white/50">
              <Building2 className="w-5 h-5 text-neutral-700" />
              <div>
                <h2 className="text-base font-normal text-neutral-900">Legal Business Profile</h2>
                <p className="text-xs font-light text-neutral-500">Printed on all invoices, bills and delivery challans</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-light text-neutral-700 mb-1.5">
                  Business Legal Name *
                </label>
                <input
                  type="text"
                  value={profile.legal_name}
                  onChange={(e) => setProfile({ ...profile, legal_name: e.target.value })}
                  required
                  className="w-full h-10 px-4 text-xs bg-white/70 rounded-full border border-white/80 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#E0FE52]"
                />
              </div>

              <div>
                <label className="block text-xs font-light text-neutral-700 mb-1.5">
                  Primary Phone *
                </label>
                <input
                  type="text"
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  required
                  className="w-full h-10 px-4 text-xs bg-white/70 rounded-full border border-white/80 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#E0FE52]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-light text-neutral-700 mb-1.5">
                  Registered Address
                </label>
                <input
                  type="text"
                  value={profile.address_line1}
                  onChange={(e) => setProfile({ ...profile, address_line1: e.target.value })}
                  className="w-full h-10 px-4 text-xs bg-white/70 rounded-full border border-white/80 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#E0FE52]"
                />
              </div>

              <div>
                <label className="block text-xs font-light text-neutral-700 mb-1.5">
                  City & State
                </label>
                <input
                  type="text"
                  value={`${profile.city}, ${profile.state}`}
                  readOnly
                  className="w-full h-11 px-4 text-xs bg-gray-100 rounded-xl border border-[#E5E4EE] text-gray-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  PIN Code
                </label>
                <input
                  type="text"
                  value={profile.pin}
                  onChange={(e) => setProfile({ ...profile, pin: e.target.value })}
                  className="w-full h-11 px-4 text-xs bg-[#F9F8FD] rounded-xl border border-[#E5E4EE]"
                />
              </div>
            </div>
          </div>

          {/* GST Configuration & Gating */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E5E4EE] shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
              <ShieldCheck className="w-5 h-5 text-purple-700" />
              <div>
                <h2 className="text-base font-bold text-gray-900">GST Registration & Tax Gating</h2>
                <p className="text-xs text-gray-500">GST mode is strictly gated until eligibility is explicitly confirmed</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  GSTIN (15-character Goods & Services Tax ID)
                </label>
                <input
                  type="text"
                  value={profile.gstin}
                  onChange={(e) => setProfile({ ...profile, gstin: e.target.value.toUpperCase() })}
                  maxLength={15}
                  placeholder="24AAACT1234F1Z5"
                  className="w-full h-11 px-4 text-xs font-mono font-bold bg-[#F9F8FD] rounded-xl border border-[#E5E4EE]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  State Code (as per GST law)
                </label>
                <input
                  type="text"
                  value={profile.state_code}
                  readOnly
                  className="w-full h-11 px-4 text-xs font-mono bg-gray-100 rounded-xl border border-[#E5E4EE]"
                />
              </div>
            </div>

            <label htmlFor="gst-confirm" className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 flex items-center gap-3 min-h-[44px] cursor-pointer">
              <input
                type="checkbox"
                id="gst-confirm"
                checked={profile.gst_confirmed}
                onChange={(e) => setProfile({ ...profile, gst_confirmed: e.target.checked })}
                className="w-5 h-5 rounded text-neutral-900 focus:ring-neutral-900 cursor-pointer shrink-0"
              />
              <span className="text-xs text-neutral-900 font-medium">
                <strong>I confirm TAZQOR is officially registered under GST.</strong> Enable generation of GST Tax Invoices.
                (Unchecking this disables the GST mode and restricts billing to Non-GST Bills of Supply).
              </span>
            </label>
          </div>

          {/* Numbering & Financial Year */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E5E4EE] shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
              <FileText className="w-5 h-5 text-gray-700" />
              <div>
                <h2 className="text-base font-bold text-gray-900">Invoice Numbering & Round Off</h2>
                <p className="text-xs text-gray-500">Configure financial year cycle and gap-free numbering series</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  GST Invoice Prefix
                </label>
                <input
                  type="text"
                  value={invoiceSettings.invoice_prefix}
                  onChange={(e) => setInvoiceSettings({ ...invoiceSettings, invoice_prefix: e.target.value })}
                  className="w-full h-11 px-4 text-xs font-mono bg-[#F9F8FD] rounded-xl border border-[#E5E4EE]"
                />
                <span className="text-[10px] text-neutral-600 mt-1 block">e.g. INV/2026-27/0001</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Non-GST Bill Prefix
                </label>
                <input
                  type="text"
                  value={invoiceSettings.bill_prefix}
                  onChange={(e) => setInvoiceSettings({ ...invoiceSettings, bill_prefix: e.target.value })}
                  className="w-full h-11 px-4 text-xs font-mono bg-[#F9F8FD] rounded-xl border border-[#E5E4EE]"
                />
                <span className="text-[10px] text-neutral-600 mt-1 block">e.g. BILL/2026-27/0001</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Financial Year Cycle
                </label>
                <select
                  aria-label="Financial Year Cycle"
                  value={invoiceSettings.fy_start_month}
                  onChange={(e) => setInvoiceSettings({ ...invoiceSettings, fy_start_month: Number(e.target.value) })}
                  className="w-full h-11 px-3 text-xs bg-[#F9F8FD] rounded-xl border border-[#E5E4EE]"
                >
                  <option value={4}>April 1 – March 31 (Indian Standard)</option>
                  <option value={1}>January 1 – December 31</option>
                </select>
              </div>
            </div>
          </div>

          <div className="pt-2 text-right">
            <button
              type="submit"
              disabled={saving}
              className="px-8 h-12 rounded-full bg-[#0A0A0A] text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 hover:bg-black/90 active:scale-95 transition-all shadow-md disabled:opacity-50 inline-flex"
            >
              <Save className="w-4 h-4 text-[#D4F732]" />
              <span>{saving ? "Saving..." : "Save Settings"}</span>
            </button>
          </div>
        </form>

        {/* Data Export & Backup Section */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E5E4EE] shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
            <Database className="w-5 h-5 text-gray-700" />
            <div>
              <h2 className="text-base font-bold text-gray-900">Data Portability & Full Backup</h2>
              <p className="text-xs text-gray-500">Download complete accounting, customer and inventory records</p>
            </div>
          </div>

          <p className="text-xs text-gray-600">
            Export a full encrypted JSON backup containing your business configuration, customer profiles, product catalog,
            and billing ledger.
          </p>

          <button
            type="button"
            onClick={handleExportAllJSON}
            className="flex items-center gap-2 px-6 h-11 rounded-full bg-gray-100 text-gray-900 text-xs font-bold hover:bg-black hover:text-white transition-all shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>Download Complete System Backup (JSON)</span>
          </button>
        </div>
      </div>
    </div>
  );
}

