import { NextResponse } from "next/server";
import { getAuthenticatedRouteDb } from "@/lib/supabase/route-db";
import {
  formatExpenseDescriptionFallback,
  isMissingColumnError,
  isOwnedBillPath,
  isValidExpensePayer,
  parseExpenseRow,
  type RawExpenseDbRow,
} from "@/lib/expenses/expense-record";

export async function GET() {
  try {
    const auth = await getAuthenticatedRouteDb();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { data, error } = await auth.db
      .from("expenses")
      .select("*")
      .eq("business_id", auth.session.businessId)
      .order("expense_date", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const expenses = ((data || []) as RawExpenseDbRow[]).map(parseExpenseRow);
    return NextResponse.json({ expenses });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load expenses" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const auth = await getAuthenticatedRouteDb();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = (await request.json()) as Record<string, unknown>;
    const expenseName = typeof body.expense_name === "string" ? body.expense_name.trim() : "";
    const paidBy = body.paid_by;
    const amount = Number(body.amount);
    const expenseDate =
      typeof body.expense_date === "string" && body.expense_date.trim()
        ? body.expense_date.trim()
        : new Date().toISOString().split("T")[0];
    const paymentMethod =
      typeof body.payment_method === "string" && body.payment_method.trim()
        ? body.payment_method.trim()
        : "Other / Don't Know";
    const vendor = typeof body.vendor === "string" ? body.vendor.trim() || null : null;
    const notes = typeof body.description === "string" ? body.description.trim() || null : null;
    const receiptUrlRaw = typeof body.receipt_url === "string" ? body.receipt_url.trim() || null : null;

    if (!expenseName) {
      return NextResponse.json({ error: "Expense name is required." }, { status: 400 });
    }
    if (!isValidExpensePayer(paidBy)) {
      return NextResponse.json(
        { error: "Who paid this expense is required (Aryan, Yug, or Other)." },
        { status: 400 }
      );
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        { error: "Expense amount must be greater than zero." },
        { status: 400 }
      );
    }
    if (receiptUrlRaw && !isOwnedBillPath(receiptUrlRaw, auth.session.businessId)) {
      return NextResponse.json({ error: "Invalid expense bill attachment path." }, { status: 400 });
    }

    const basePayload = {
      business_id: auth.session.businessId,
      category_id: null,
      amount,
      expense_date: expenseDate,
      payment_method: paymentMethod,
      vendor,
      receipt_url: receiptUrlRaw,
    };

    let { data, error } = await auth.db
      .from("expenses")
      .insert({
        ...basePayload,
        expense_name: expenseName,
        paid_by: paidBy,
        description: notes,
      })
      .select("*")
      .single();

    if (error && isMissingColumnError(error)) {
      const retry = await auth.db
        .from("expenses")
        .insert({
          ...basePayload,
          description: formatExpenseDescriptionFallback(expenseName, paidBy, notes),
        })
        .select("*")
        .single();
      data = retry.data;
      error = retry.error;
    }

    if (error || !data) {
      return NextResponse.json(
        { error: error?.message || "Failed to record expense" },
        { status: 500 }
      );
    }

    return NextResponse.json({ expense: parseExpenseRow(data as RawExpenseDbRow) }, { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to record expense" },
      { status: 500 }
    );
  }
}

