"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  FileText,
  ShieldCheck,
  Save,
  Download,
  Database,
  LogOut,
  Bell,
  Smartphone,
  Send,
} from "lucide-react";
import { toast } from "sonner";
import { TopHeader } from "@/components/layout/TopHeader";
import { StyledSelect } from "@/components/ui/StyledSelect";
import { createClient } from "@/lib/supabase/client";
import { usePushNotifications } from "@/hooks/usePushNotifications";

const BUSINESS_ID = "00000000-0000-0000-0000-000000000001";

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const { status: pushStatus, error: pushError, subscribe: subscribePush, unsubscribe: unsubscribePush } = usePushNotifications();
  const [testingPush, setTestingPush] = useState(false);

  const handleTestPush = async () => {
    setTestingPush(true);
    const toastId = toast.loading("Sending test mobile alert...");
    try {
      const res = await fetch("/api/notifications/test", { method: "POST" });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.success) {
        toast.success(data.message || "Test alert sent to your screen!", { id: toastId });
      } else {
        toast.error(data?.error || "Could not send test alert", { id: toastId });
      }
    } catch {
      toast.error("Failed to connect to notification server", { id: toastId });
    } finally {
      setTestingPush(false);
    }
  };

  // Business profile state (loaded live from Supabase business_settings)
  const [profile, setProfile] = useState({
    legal_name: "",
    gstin: "",
    address_line1: "",
    address_line2: "",
    city: "",
    state: "",
    state_code: "",
    pin: "",
    phone: "",
    email: "",
    gst_confirmed: false,
    gst_enabled: false,
  });

  // Invoice & Financial Year Settings
  const [invoiceSettings, setInvoiceSettings] = useState({
    invoice_prefix: "INV",
    bill_prefix: "BILL",
    fy_start_month: 4,
  });

  useEffect(() => {
    async function loadSettings() {
      setLoading(true);
      try {
        const supabase = createClient();
        const [{ data: settings }, { data: authData }] = await Promise.all([
          supabase
            .from("business_settings")
            .select("*")
            .eq("business_id", BUSINESS_ID)
            .maybeSingle(),
          supabase.auth.getUser(),
        ]);

        if (authData?.user?.email) {
          setUserEmail(authData.user.email);
        }

        if (settings) {
          setProfile({
            legal_name: settings.legal_name || "",
            gstin: settings.gstin || "",
            address_line1: settings.address_line1 || "",
            address_line2: settings.address_line2 || "",
            city: settings.city || "",
            state: settings.state || "",
            state_code: settings.state_code || "",
            pin: settings.pin || "",
            phone: settings.phone || "",
            email: settings.email || "",
            gst_confirmed: Boolean(settings.gst_confirmed),
            gst_enabled: Boolean(settings.gst_enabled),
          });
          setInvoiceSettings({
            invoice_prefix: settings.invoice_prefix || "INV",
            bill_prefix: settings.bill_prefix || "BILL",
            fy_start_month: Number(settings.financial_year_start_month) || 4,
          });
        }
      } catch (err) {
        console.warn("Could not load business_settings:", err);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile.legal_name.trim()) {
      toast.error("Business Legal Name is required");
      return;
    }

    const trimmedGstin = profile.gstin.trim().toUpperCase();
    const derivedStateCode =
      trimmedGstin.length >= 2 && /^\d{2}/.test(trimmedGstin)
        ? trimmedGstin.slice(0, 2)
        : profile.state_code.trim() || null;

    setSaving(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.from("business_settings").upsert(
        {
          business_id: BUSINESS_ID,
          legal_name: profile.legal_name.trim(),
          gstin: trimmedGstin || null,
          address_line1: profile.address_line1.trim() || null,
          address_line2: profile.address_line2.trim() || null,
          city: profile.city.trim() || null,
          state: profile.state.trim() || null,
          state_code: derivedStateCode,
          pin: profile.pin.trim() || null,
          phone: profile.phone.trim() || null,
          email: profile.email.trim() || null,
          gst_confirmed: profile.gst_confirmed,
          gst_enabled: profile.gst_confirmed && trimmedGstin.length === 15,
          invoice_prefix: invoiceSettings.invoice_prefix.trim() || "INV",
          bill_prefix: invoiceSettings.bill_prefix.trim() || "BILL",
          financial_year_start_month: invoiceSettings.fy_start_month,
        },
        { onConflict: "business_id" }
      );

      if (error) throw error;
      toast.success("Business profile & tax settings saved!");
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : typeof err === "object" && err !== null && "message" in err && typeof (err as { message?: unknown }).message === "string"
          ? (err as { message: string }).message
          : "Failed to save settings";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleExportAllJSON = async () => {
    try {
      const supabase = createClient();
      const [{ data: customers }, { data: products }, { data: orders }, { data: invoices }, { data: payments }] =
        await Promise.all([
          supabase.from("customers").select("*").eq("business_id", BUSINESS_ID),
          supabase.from("products").select("*, product_variants(*)").eq("business_id", BUSINESS_ID),
          supabase.from("orders").select("*, order_items(*)").eq("business_id", BUSINESS_ID),
          supabase.from("invoices").select("*, invoice_items(*)").eq("business_id", BUSINESS_ID),
          supabase.from("payments").select("*").eq("business_id", BUSINESS_ID),
        ]);

      const backupData = {
        exported_at: new Date().toISOString(),
        business: profile,
        invoice_settings: invoiceSettings,
        customers: customers || [],
        products: products || [],
        orders: orders || [],
        invoices: invoices || [],
        payments: payments || [],
      };

      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `TAZQOR_Backup_${new Date().toISOString().substring(0, 10)}.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Live database backup exported (JSON)");
    } catch {
      toast.error("Failed to export database backup");
    }
  };

  return (
    <div className="min-h-screen pb-12">
      <TopHeader title="Business Settings" />

      <div className="space-y-6 max-w-4xl pt-2">
        {loading ? (
          <div className="bg-white/55 backdrop-blur-xl rounded-[28px] p-10 text-center text-xs text-neutral-500 border border-white/65">
            Loading business settings...
          </div>
        ) : (
          <form onSubmit={handleSaveProfile} className="space-y-6">
            {/* Business Profile */}
            <div className="bg-white/55 backdrop-blur-xl rounded-[28px] p-6 sm:p-8 border border-white/65 shadow-sm space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-white/50">
                <Building2 className="w-5 h-5 text-neutral-700" />
                <div>
                  <h2 className="text-base font-normal text-neutral-900">Legal Business Profile</h2>
                  <p className="text-xs font-light text-neutral-500">Printed on all invoices, bills and receipts</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="min-w-0">
                  <label className="block text-xs font-light text-neutral-700 mb-1.5">
                    Business Legal Name *
                  </label>
                  <input
                    type="text"
                    value={profile.legal_name}
                    onChange={(e) => setProfile({ ...profile, legal_name: e.target.value })}
                    placeholder="Enter legal business name"
                    required
                    className="w-full h-10 px-4 text-xs bg-white/70 rounded-full border border-white/80 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#E0FE52]"
                  />
                </div>

                <div className="min-w-0">
                  <label className="block text-xs font-light text-neutral-700 mb-1.5">
                    Primary Phone
                  </label>
                  <input
                    type="text"
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    placeholder="Business contact number"
                    className="w-full h-10 px-4 text-xs bg-white/70 rounded-full border border-white/80 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#E0FE52]"
                  />
                </div>

                <div className="min-w-0">
                  <label className="block text-xs font-light text-neutral-700 mb-1.5">
                    Business Email
                  </label>
                  <input
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    placeholder="Billing or support email"
                    className="w-full h-10 px-4 text-xs bg-white/70 rounded-full border border-white/80 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#E0FE52]"
                  />
                </div>

                <div className="min-w-0">
                  <label className="block text-xs font-light text-neutral-700 mb-1.5">
                    PIN Code
                  </label>
                  <input
                    type="text"
                    value={profile.pin}
                    onChange={(e) => setProfile({ ...profile, pin: e.target.value })}
                    placeholder="Postal PIN code"
                    className="w-full h-10 px-4 text-xs bg-white/70 rounded-full border border-white/80 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#E0FE52]"
                  />
                </div>

                <div className="sm:col-span-2 min-w-0">
                  <label className="block text-xs font-light text-neutral-700 mb-1.5">
                    Registered Address
                  </label>
                  <input
                    type="text"
                    value={profile.address_line1}
                    onChange={(e) => setProfile({ ...profile, address_line1: e.target.value })}
                    placeholder="Street, building, or industrial estate"
                    className="w-full h-10 px-4 text-xs bg-white/70 rounded-full border border-white/80 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#E0FE52]"
                  />
                </div>

                <div className="min-w-0">
                  <label className="block text-xs font-light text-neutral-700 mb-1.5">
                    City
                  </label>
                  <input
                    type="text"
                    value={profile.city}
                    onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                    placeholder="City"
                    className="w-full h-10 px-4 text-xs bg-white/70 rounded-full border border-white/80 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#E0FE52]"
                  />
                </div>

                <div className="min-w-0">
                  <label className="block text-xs font-light text-neutral-700 mb-1.5">
                    State
                  </label>
                  <input
                    type="text"
                    value={profile.state}
                    onChange={(e) => setProfile({ ...profile, state: e.target.value })}
                    placeholder="State"
                    className="w-full h-10 px-4 text-xs bg-white/70 rounded-full border border-white/80 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#E0FE52]"
                  />
                </div>
              </div>
            </div>

            {/* GST Configuration & Gating */}
            <div className="bg-white/55 backdrop-blur-xl rounded-[28px] p-6 sm:p-8 border border-white/65 shadow-none space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-white/50">
                <ShieldCheck className="w-5 h-5 text-neutral-700" />
                <div>
                  <h2 className="text-base font-normal text-neutral-900">GST Registration & Tax Gating</h2>
                  <p className="text-xs font-light text-neutral-500">GST mode is strictly gated until eligibility is explicitly confirmed</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="min-w-0">
                  <label className="block text-xs font-light text-neutral-700 mb-1.5">
                    GSTIN (15-character Goods & Services Tax ID)
                  </label>
                  <input
                    type="text"
                    value={profile.gstin}
                    onChange={(e) => {
                      const val = e.target.value.toUpperCase();
                      setProfile({
                        ...profile,
                        gstin: val,
                        state_code: val.length >= 2 && /^\d{2}/.test(val) ? val.slice(0, 2) : profile.state_code,
                      });
                    }}
                    maxLength={15}
                    placeholder="15-character GSTIN"
                    className="w-full h-10 px-4 text-xs font-mono font-medium bg-white/70 rounded-full border border-white/80 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#E0FE52]"
                  />
                </div>

                <div className="min-w-0">
                  <label className="block text-xs font-light text-neutral-700 mb-1.5">
                    State Code (as per GST law)
                  </label>
                  <input
                    type="text"
                    value={profile.state_code}
                    onChange={(e) => setProfile({ ...profile, state_code: e.target.value })}
                    maxLength={2}
                    placeholder="e.g. 24"
                    className="w-full h-10 px-4 text-xs font-mono bg-white/70 rounded-full border border-white/80 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#E0FE52]"
                  />
                </div>
              </div>

              <label htmlFor="gst-confirm" className="p-4 rounded-2xl bg-white/50 border border-white/70 flex items-center gap-3 min-h-[44px] cursor-pointer">
                <input
                  type="checkbox"
                  id="gst-confirm"
                  checked={profile.gst_confirmed}
                  onChange={(e) => setProfile({ ...profile, gst_confirmed: e.target.checked })}
                  className="w-5 h-5 rounded text-neutral-900 focus:ring-neutral-900 cursor-pointer shrink-0"
                />
                <span className="text-xs text-neutral-900 font-light">
                  <strong className="font-medium">I confirm this business is officially registered under GST.</strong> Enable generation of GST Tax Invoices.
                  (Unchecking this restricts billing to Non-GST Bills of Supply).
                </span>
              </label>
            </div>

            {/* Numbering & Financial Year */}
            <div className="bg-white/55 backdrop-blur-xl rounded-[28px] p-6 sm:p-8 border border-white/65 shadow-none space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-white/50">
                <FileText className="w-5 h-5 text-neutral-700" />
                <div>
                  <h2 className="text-base font-normal text-neutral-900">Invoice Numbering & Financial Year</h2>
                  <p className="text-xs font-light text-neutral-500">Configure financial year cycle and gap-free numbering prefixes</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="min-w-0">
                  <label className="block text-xs font-light text-neutral-700 mb-1.5">
                    GST Invoice Prefix
                  </label>
                  <input
                    type="text"
                    value={invoiceSettings.invoice_prefix}
                    onChange={(e) => setInvoiceSettings({ ...invoiceSettings, invoice_prefix: e.target.value })}
                    className="w-full h-10 px-4 text-xs font-mono bg-white/70 rounded-full border border-white/80 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#E0FE52]"
                  />
                </div>

                <div className="min-w-0">
                  <label className="block text-xs font-light text-neutral-700 mb-1.5">
                    Non-GST Bill Prefix
                  </label>
                  <input
                    type="text"
                    value={invoiceSettings.bill_prefix}
                    onChange={(e) => setInvoiceSettings({ ...invoiceSettings, bill_prefix: e.target.value })}
                    className="w-full h-10 px-4 text-xs font-mono bg-white/70 rounded-full border border-white/80 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#E0FE52]"
                  />
                </div>

                <div className="min-w-0">
                  <label className="block text-xs font-light text-neutral-700 mb-1.5">
                    Financial Year Cycle
                  </label>
                  <StyledSelect
                    aria-label="Financial Year Cycle"
                    value={invoiceSettings.fy_start_month}
                    onChange={(e) => setInvoiceSettings({ ...invoiceSettings, fy_start_month: Number(e.target.value) })}
                    className="w-full h-10 pl-3.5 text-xs bg-white/70 rounded-full border border-white/80 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#E0FE52]"
                  >
                    <option value={4}>April 1 – March 31 (Indian Standard)</option>
                    <option value={1}>January 1 – December 31</option>
                  </StyledSelect>
                </div>
              </div>
            </div>

            <div className="pt-2 text-right">
              <button
                type="submit"
                disabled={saving}
                className="px-8 h-11 rounded-full bg-black text-white text-xs sm:text-sm font-normal flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-md disabled:opacity-50 inline-flex cursor-pointer"
              >
                <Save className="w-4 h-4 text-[#E0FE52]" />
                <span>{saving ? "Saving..." : "Save Settings"}</span>
              </button>
            </div>
          </form>
        )}

        {/* Real-time Mobile Screen Alerts & Web Push Section */}
        <div className="bg-white/55 backdrop-blur-xl rounded-[28px] p-6 sm:p-8 border border-white/65 shadow-none space-y-5">
          <div className="flex items-center justify-between gap-4 pb-3 border-b border-white/50">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-neutral-800" />
              <div>
                <h2 className="text-base font-normal text-neutral-900">Real-Time Mobile Screen Alerts</h2>
                <p className="text-xs font-light text-neutral-500">
                  Receive instant lockscreen & banner notifications for orders, stock, due bills, emails, and daily summaries
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {pushStatus === "subscribed" && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Active on this device
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-white/70 border border-white/80 space-y-2">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-neutral-700" />
                <span className="text-xs font-semibold text-neutral-900">Device Push Status</span>
              </div>
              <p className="text-xs text-neutral-600 font-light leading-relaxed">
                {pushStatus === "subscribed"
                  ? "This device is registered to receive real-time web push notifications even when the app is closed."
                  : pushStatus === "denied"
                  ? "Notifications are currently blocked by your browser permissions. Enable them in site settings."
                  : "Enable notifications to get live updates on your phone lockscreen for sales, deliveries, and stock."}
              </p>
              {pushError && <p className="text-xs text-rose-500">{pushError}</p>}

              <div className="pt-2 flex flex-wrap items-center gap-2">
                {pushStatus === "subscribed" ? (
                  <>
                    <button
                      type="button"
                      onClick={handleTestPush}
                      disabled={testingPush}
                      className="inline-flex items-center gap-1.5 px-4 h-9 rounded-full bg-black text-[#D7FF00] text-xs font-medium hover:brightness-110 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{testingPush ? "Sending..." : "Send Test Mobile Alert"}</span>
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        const ok = await unsubscribePush();
                        if (ok) toast.success("Notifications turned off for this device.");
                      }}
                      className="px-3 h-9 rounded-full bg-white border border-neutral-200 text-neutral-700 text-xs font-light hover:bg-neutral-50 transition-all cursor-pointer"
                    >
                      Turn Off
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={async () => {
                      const ok = await subscribePush();
                      if (ok) toast.success("Real-time screen notifications enabled!");
                    }}
                    className="inline-flex items-center gap-1.5 px-5 h-9 rounded-full bg-black text-[#D7FF00] text-xs font-semibold hover:brightness-110 active:scale-95 transition-all cursor-pointer"
                  >
                    <Bell className="w-3.5 h-3.5" />
                    <span>Enable Screen Alerts on this Phone</span>
                  </button>
                )}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white/70 border border-white/80 space-y-2">
              <span className="text-xs font-semibold text-neutral-900 block">Live Automated Alerts</span>
              <ul className="text-xs text-neutral-600 font-light space-y-1.5">
                <li className="flex items-center gap-1.5">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span><strong>New Orders:</strong> Instant alert with customer name, items & amount</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span><strong>Order Delivery:</strong> Confirms stock deduction & auto-created bill</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span><strong>Pending Orders:</strong> Alerts if order confirmed &gt;12h without delivery</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span><strong>Stock Alerts:</strong> Warning when inventory hits reorder level or finishes</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span><strong>Due Bills:</strong> 10:00 AM daily alert for unpaid overdue invoices</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span><strong>New Emails:</strong> Alert on incoming customer/vendor Gmail messages</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span><strong>Daily Summary:</strong> 9:30 PM recap with sales, profit & pending balance</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Data Export & Backup Section */}
        <div className="bg-white/55 backdrop-blur-xl rounded-[28px] p-6 sm:p-8 border border-white/65 shadow-none space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-white/50">
            <Database className="w-5 h-5 text-neutral-700" />
            <div>
              <h2 className="text-base font-normal text-neutral-900">Data Portability & Full Backup</h2>
              <p className="text-xs font-light text-neutral-500">Download live accounting, customer and inventory records</p>
            </div>
          </div>

          <p className="text-xs text-neutral-600 font-light">
            Export a JSON backup containing your live business configuration, customer profiles, product catalog,
            orders, invoices, and payments.
          </p>

          <button
            type="button"
            onClick={handleExportAllJSON}
            className="flex items-center gap-2 px-6 h-10 rounded-full bg-white/70 text-neutral-800 text-xs font-light border border-white/80 hover:bg-black hover:text-white transition-all shadow-sm cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Download Complete System Backup (JSON)</span>
          </button>
        </div>

        {/* Security & Account Session */}
        <div className="bg-white/55 backdrop-blur-xl rounded-[28px] p-6 sm:p-8 border border-white/65 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/40">
            <div>
              <h2 className="text-base font-semibold text-neutral-900">Security & Sign Out</h2>
              <p className="text-xs text-neutral-500 font-light">Manage your current active manager session</p>
            </div>
          </div>

          <p className="text-xs text-neutral-600 font-light">
            {userEmail ? (
              <>
                Signed in as <strong>{userEmail}</strong>.
              </>
            ) : (
              "Active workspace session."
            )}
          </p>

          <button
            type="button"
            onClick={async () => {
              try {
                await fetch("/api/auth/logout", { method: "POST" });
              } catch {}
              router.push("/login");
              router.refresh();
            }}
            className="inline-flex items-center gap-2 px-6 h-11 rounded-full bg-rose-50 text-rose-700 text-xs font-medium hover:bg-rose-100 transition-all border border-rose-200/60 cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-rose-600" />
            <span>Sign Out of Account</span>
          </button>
        </div>
      </div>
    </div>
  );
}
