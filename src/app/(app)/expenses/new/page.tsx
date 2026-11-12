"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";
import { TopHeader } from "@/components/layout/TopHeader";
import { StyledSelect } from "@/components/ui/StyledSelect";
import { createClient } from "@/lib/supabase/client";

const BUSINESS_ID = "00000000-0000-0000-0000-000000000001";

interface ExpenseCategoryOption {
  id: string;
  name: string;
}

export default function NewExpensePage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [categories, setCategories] = useState<ExpenseCategoryOption[]>([]);

  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [categoryId, setCategoryId] = useState("");
  const [amount, setAmount] = useState<number | "">("");
  const [vendor, setVendor] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Bank Transfer");
  const [description, setDescription] = useState("");

  useEffect(() => {
    async function loadCategories() {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("expense_categories")
          .select("id, name")
          .or(`business_id.is.null,business_id.eq.${BUSINESS_ID}`)
          .order("name", { ascending: true });

        if (!error && data && data.length > 0) {
          setCategories(data);
          setCategoryId(data[0].id);
        }
      } catch (e) {
        console.warn("Could not load expense categories", e);
      }
    }
    loadCategories();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = Number(amount) || 0;
    if (numAmount <= 0) {
      toast.error("Expense amount must be greater than zero");
      return;
    }

    setSubmitting(true);
    try {
      const supabase = createClient();
      const selectedCatName = categories.find((c) => c.id === categoryId)?.name;
      const { error } = await supabase.from("expenses").insert({
        business_id: BUSINESS_ID,
        category_id: categoryId || null,
        amount: numAmount,
        expense_date: date || new Date().toISOString().split("T")[0],
        vendor: vendor.trim() || null,
        payment_method: paymentMethod,
        description: description.trim() || selectedCatName || "Business Expense",
      });

      if (error) throw error;

      toast.success("Expense recorded and synced to Supabase!");
      router.push("/expenses");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to record expense");
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

        <form onSubmit={handleSubmit} className="bg-white/55 backdrop-blur-xl rounded-[28px] p-6 sm:p-8 border border-white/65 shadow-none space-y-6">
          <div className="border-b border-white/40 pb-3">
            <h2 className="text-base font-normal text-neutral-900">Expense Details</h2>
            <p className="text-xs font-light text-neutral-500">Record operational costs with category tagging</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="min-w-0">
              <label htmlFor="expense-category" className="block text-xs font-light text-neutral-600 mb-1.5">
                Expense Category
              </label>
              <StyledSelect
                id="expense-category"
                aria-label="Expense Category"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full h-10 pl-4 text-xs bg-white/65 backdrop-blur-md rounded-full border border-white/70 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#E0FE52]"
              >
                {categories.length === 0 ? (
                  <option value="">General / Operational</option>
                ) : (
                  categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))
                )}
              </StyledSelect>
            </div>

            <div className="min-w-0">
              <label htmlFor="expense-amount" className="block text-xs font-light text-neutral-600 mb-1.5">
                Expense Amount (₹) *
              </label>
              <input
                id="expense-amount"
                aria-label="Expense Amount"
                type="number"
                step="0.01"
                min="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="0.00"
                required
                className="w-full h-10 px-4 text-xs font-semibold text-neutral-900 bg-white/65 backdrop-blur-md rounded-full border border-white/70 focus:outline-none focus:ring-2 focus:ring-[#E0FE52]"
              />
            </div>

            <div className="min-w-0">
              <label htmlFor="expense-date" className="block text-xs font-light text-neutral-600 mb-1.5">
                Expense Date *
              </label>
              <input
                id="expense-date"
                aria-label="Expense Date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full h-10 px-4 text-xs bg-white/65 backdrop-blur-md rounded-full border border-white/70 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#E0FE52]"
              />
            </div>

            <div className="min-w-0">
              <label htmlFor="expense-payment-method" className="block text-xs font-light text-neutral-600 mb-1.5">
                Payment Method
              </label>
              <StyledSelect
                id="expense-payment-method"
                aria-label="Payment Method"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full h-10 pl-4 text-xs bg-white/65 backdrop-blur-md rounded-full border border-white/70 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#E0FE52]"
              >
                <option value="Bank Transfer">Bank Transfer (NEFT/RTGS)</option>
                <option value="UPI">UPI</option>
                <option value="Cash">Cash</option>
                <option value="Cheque">Cheque</option>
              </StyledSelect>
            </div>

            <div className="sm:col-span-2 min-w-0">
              <label htmlFor="expense-vendor" className="block text-xs font-light text-neutral-600 mb-1.5">
                Vendor / Supplier Name
              </label>
              <input
                id="expense-vendor"
                aria-label="Vendor or Supplier Name"
                type="text"
                value={vendor}
                onChange={(e) => setVendor(e.target.value)}
                placeholder="Supplier or payee name"
                className="w-full h-10 px-4 text-xs bg-white/65 backdrop-blur-md rounded-full border border-white/70 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#E0FE52]"
              />
            </div>

            <div className="sm:col-span-2 min-w-0">
              <label className="block text-xs font-light text-neutral-600 mb-1.5">
                Expense Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="What was purchased or serviced?"
                className="w-full p-3.5 text-xs bg-white/65 backdrop-blur-md rounded-2xl border border-white/70 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#E0FE52]"
              />
            </div>
          </div>

          <div className="pt-2 text-right">
            <button
              type="submit"
              disabled={submitting}
              className="px-8 h-11 rounded-full bg-black text-white text-xs sm:text-sm font-normal flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-md disabled:opacity-50 inline-flex cursor-pointer"
            >
              <Save className="w-4 h-4 text-[#E0FE52]" />
              <span>{submitting ? "Saving..." : "Record Expense"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
