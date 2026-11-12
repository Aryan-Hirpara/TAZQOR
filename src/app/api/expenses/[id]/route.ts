import { NextResponse } from "next/server";
import { getAuthenticatedRouteDb } from "@/lib/supabase/route-db";
import {
  EXPENSE_BILLS_BUCKET,
  formatExpenseDescriptionFallback,
  isMissingColumnError,
  isOwnedBillPath,
  isValidExpensePayer,
  parseExpenseRow,
  type RawExpenseDbRow,
} from "@/lib/expenses/expense-record";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthenticatedRouteDb();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { id } = await context.params;
    const { data: existing, error: fetchErr } = await auth.db
      .from("expenses")
      .select("id, receipt_url")
      .eq("id", id)
      .eq("business_id", auth.session.businessId)
      .maybeSingle();

    if (fetchErr) {
      return NextResponse.json({ error: fetchErr.message }, { status: 500 });
    }
    if (!existing) {
      return NextResponse.json({ error: "Expense not found." }, { status: 404 });
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
    const receiptUrlRaw =
      body.receipt_url === null
        ? null
        : typeof body.receipt_url === "string"
        ? body.receipt_url.trim() || null
        : existing.receipt_url;

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

    const baseUpdate = {
      category_id: null,
      amount,
      expense_date: expenseDate,
      payment_method: paymentMethod,
      vendor,
      receipt_url: receiptUrlRaw,
    };

    let { data, error } = await auth.db
      .from("expenses")
      .update({
        ...baseUpdate,
        expense_name: expenseName,
        paid_by: paidBy,
        description: notes,
      })
      .eq("id", id)
      .eq("business_id", auth.session.businessId)
      .select("*")
      .single();

    if (error && isMissingColumnError(error)) {
      const retry = await auth.db
        .from("expenses")
        .update({
          ...baseUpdate,
          description: formatExpenseDescriptionFallback(expenseName, paidBy, notes),
        })
        .eq("id", id)
        .eq("business_id", auth.session.businessId)
        .select("*")
        .single();
      data = retry.data;
      error = retry.error;
    }

    if (error || !data) {
      return NextResponse.json(
        { error: error?.message || "Failed to update expense" },
        { status: 500 }
      );
    }

    // Delete orphaned bill file from bucket if replaced or cleared
    const previousPath = existing.receipt_url;
    if (
      previousPath &&
      previousPath !== receiptUrlRaw &&
      isOwnedBillPath(previousPath, auth.session.businessId)
    ) {
      await auth.db.storage.from(EXPENSE_BILLS_BUCKET).remove([previousPath]);
    }

    return NextResponse.json({ expense: parseExpenseRow(data as RawExpenseDbRow) });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to update expense" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthenticatedRouteDb();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { id } = await context.params;
    const { data: existing, error: fetchErr } = await auth.db
      .from("expenses")
      .select("id, receipt_url")
      .eq("id", id)
      .eq("business_id", auth.session.businessId)
      .maybeSingle();

    if (fetchErr) {
      return NextResponse.json({ error: fetchErr.message }, { status: 500 });
    }
    if (!existing) {
      return NextResponse.json({ error: "Expense not found." }, { status: 404 });
    }

    const { error: deleteErr } = await auth.db
      .from("expenses")
      .delete()
      .eq("id", id)
      .eq("business_id", auth.session.businessId);

    if (deleteErr) {
      return NextResponse.json({ error: deleteErr.message }, { status: 500 });
    }

    if (existing.receipt_url && isOwnedBillPath(existing.receipt_url, auth.session.businessId)) {
      await auth.db.storage.from(EXPENSE_BILLS_BUCKET).remove([existing.receipt_url]);
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to delete expense" },
      { status: 500 }
    );
  }
}

