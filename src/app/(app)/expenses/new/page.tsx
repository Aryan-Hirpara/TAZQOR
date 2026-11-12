"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { TopHeader } from "@/components/layout/TopHeader";
import { ExpenseForm } from "@/components/expenses/ExpenseForm";

export default function NewExpensePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen pb-12">
      <TopHeader
        title="Add Business Expense"
        subtitle="Log operational expenses, payer details, and optional bill receipts"
      />

      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-3xl mx-auto">
        <div>
          <Link
            href="/expenses"
            className="inline-flex items-center gap-1.5 min-h-[44px] text-xs font-semibold text-neutral-600 hover:text-black transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Cancel and back to expenses</span>
          </Link>
        </div>

        <div className="bg-white/55 backdrop-blur-xl rounded-[28px] p-6 sm:p-8 border border-white/65 shadow-none space-y-6">
          <div className="border-b border-white/40 pb-3">
            <h2 className="text-base font-normal text-neutral-900">Expense Details</h2>
            <p className="text-xs font-light text-neutral-500">
              Enter the expense name, who paid, payment method, and optional image/PDF bill
            </p>
          </div>

          <ExpenseForm
            mode="create"
            onCancel={() => router.push("/expenses")}
            onSuccess={() => {
              toast.success("Expense recorded and synced to Supabase!");
              router.push("/expenses");
            }}
          />
        </div>
      </div>
    </div>
  );
}
