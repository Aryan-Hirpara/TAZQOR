"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Receipt, Save, Upload } from "lucide-react";
import { toast } from "sonner";
import { TopHeader } from "@/components/layout/TopHeader";

export default function NewExpensePage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const [date, setDate] = useState("2026-02-16");
  const [category, setCategory] = useState("Raw Materials");
  const [amount, setAmount] = useState<number>(0);
  const [vendor, setVendor] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Bank Transfer");
  const [description, setDescription] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      toast.error("Expense amount must be greater than zero");
      return;
    }

    setSubmitting(true);
    try {
      await new Promise((r) => setTimeout(r, 600));
      toast.success("Expense recorded successfully!");
      router.push("/expenses");
    } catch {
      toast.error("Failed to record expense");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen">
      <TopHeader
        title="Add Business Expense"
        subtitle="Log production costs, packaging bills, logistics or utilities"
      />

      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-3xl mx-auto">
        <div>
          <Link
            href="/expenses"
            className="inline-flex items-center gap-1.5 min-h-[44px] text-xs font-semibold text-neutral-600 hover:text-black transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Cancel and back to expenses</span>
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E5E4EE] shadow-sm space-y-6">
          <div className="border-b border-gray-100 pb-3">
            <h2 className="text-base font-bold text-gray-900">Expense Details</h2>
            <p className="text-xs text-gray-500">Record operational costs with category tagging</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="expense-category" className="block text-xs font-bold text-gray-700 mb-1.5">
                Expense Category *
              </label>
              <select
                id="expense-category"
                aria-label="Expense Category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-11 px-3 text-xs bg-[#F9F8FD] rounded-xl border border-[#E5E4EE]"
              >
                <option value="Raw Materials">Raw Materials</option>
                <option value="Packaging">Packaging</option>
                <option value="Transport & Fuel">Transport & Fuel</option>
                <option value="Marketing & Samples">Marketing & Samples</option>
                <option value="Rent & Maintenance">Rent & Maintenance</option>
                <option value="Utilities">Utilities (Electricity, Water)</option>
                <option value="Miscellaneous">Miscellaneous</option>
              </select>
            </div>

            <div>
              <label htmlFor="expense-amount" className="block text-xs font-bold text-gray-700 mb-1.5">
                Expense Amount (₹) *
              </label>
              <input
                id="expense-amount"
                aria-label="Expense Amount"
                type="number"
                step="0.01"
                min="1"
                value={amount || ""}
                onChange={(e) => setAmount(Number(e.target.value))}
                placeholder="0.00"
                required
                className="w-full h-11 px-4 text-xs font-bold text-gray-900 bg-[#F9F8FD] rounded-xl border border-[#E5E4EE] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#D4F732]"
              />
            </div>

            <div>
              <label htmlFor="expense-date" className="block text-xs font-bold text-gray-700 mb-1.5">
                Expense Date *
              </label>
              <input
                id="expense-date"
                aria-label="Expense Date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full h-11 px-3 text-xs bg-[#F9F8FD] rounded-xl border border-[#E5E4EE]"
              />
            </div>

            <div>
              <label htmlFor="expense-payment-method" className="block text-xs font-bold text-gray-700 mb-1.5">
                Payment Method
              </label>
              <select
                id="expense-payment-method"
                aria-label="Payment Method"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full h-11 px-3 text-xs bg-[#F9F8FD] rounded-xl border border-[#E5E4EE]"
              >
                <option value="Bank Transfer">Bank Transfer (NEFT/RTGS)</option>
                <option value="UPI">UPI (GPay / PhonePe)</option>
                <option value="Cash">Cash</option>
                <option value="Cheque">Cheque</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="expense-vendor" className="block text-xs font-bold text-gray-700 mb-1.5">
                Vendor / Supplier Name
              </label>
              <input
                id="expense-vendor"
                aria-label="Vendor or Supplier Name"
                type="text"
                value={vendor}
                onChange={(e) => setVendor(e.target.value)}
                placeholder="e.g. Gujarat Chemical Corp"
                className="w-full h-11 px-4 text-xs bg-[#F9F8FD] rounded-xl border border-[#E5E4EE]"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Expense Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="What was purchased or serviced?"
                className="w-full p-3 text-xs bg-[#F9F8FD] rounded-xl border border-[#E5E4EE]"
              />
            </div>
          </div>

          <div className="pt-2 text-right">
            <button
              type="submit"
              disabled={submitting}
              className="px-8 h-12 rounded-full bg-[#0A0A0A] text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 hover:bg-black/90 active:scale-95 transition-all shadow-md disabled:opacity-50 inline-flex"
            >
              <Save className="w-4 h-4 text-[#D4F732]" />
              <span>{submitting ? "Saving..." : "Record Expense"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

