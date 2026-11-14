import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedRouteDb } from "@/lib/supabase/route-db";
import {
  getTodayIsoDate,
  parseInvoicePaymentInput,
  roundMoney,
  settleInvoiceWithPayment,
} from "@/lib/invoices/payment-settlement";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthenticatedRouteDb();
    if (!auth.ok) {
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: auth.status }
      );
    }

    const { id: invoiceId } = await context.params;
    const body = await request.json().catch(() => ({}));
    const businessId = auth.session.businessId;

    const [{ data: invoice, error: invErr }, { data: outRow, error: outErr }] =
      await Promise.all([
        auth.db
          .from("invoices")
          .select("id, business_id, customer_id, status, invoice_number, invoice_date, grand_total")
          .eq("id", invoiceId)
          .eq("business_id", businessId)
          .maybeSingle(),
        auth.db
          .from("v_invoice_outstanding")
          .select("invoice_id, amount_paid, outstanding")
          .eq("invoice_id", invoiceId)
          .eq("business_id", businessId)
          .maybeSingle(),
      ]);

    if (invErr || outErr) {
      return NextResponse.json(
        { success: false, error: (invErr || outErr)?.message || "Could not load invoice." },
        { status: 400 }
      );
    }

    if (!invoice) {
      return NextResponse.json(
        { success: false, error: "Invoice not found." },
        { status: 404 }
      );
    }

    if (invoice.status !== "finalized") {
      return NextResponse.json(
        {
          success: false,
          error:
            invoice.status === "draft"
              ? "Finalize this draft invoice before recording payment."
              : "Cancelled invoices cannot receive payments.",
        },
        { status: 400 }
      );
    }

    const currentOutstanding = roundMoney(
      outRow ? Number(outRow.outstanding) : Number(invoice.grand_total)
    );
    const currentPaid = roundMoney(outRow ? Number(outRow.amount_paid) : 0);

    if (currentOutstanding <= 0) {
      return NextResponse.json({
        success: true,
        already_paid: true,
        invoice_id: invoice.id,
        invoice_number: invoice.invoice_number,
        paid_amount: currentPaid,
        outstanding: 0,
      });
    }

    const parsed = parseInvoicePaymentInput(body, {
      defaultDate: getTodayIsoDate(),
      maxAmount: currentOutstanding,
      requirePositiveWhenPresent: true,
    });

    if (parsed.error || !parsed.payment) {
      return NextResponse.json(
        { success: false, error: parsed.error || "Invalid payment details." },
        { status: 400 }
      );
    }

    const settlement = await settleInvoiceWithPayment({
      db: auth.db,
      businessId,
      invoiceId: invoice.id,
      customerId: invoice.customer_id,
      payment: parsed.payment,
    });

    if (!settlement.ok) {
      return NextResponse.json(
        { success: false, error: settlement.error || "Could not record payment." },
        { status: 400 }
      );
    }

    const { data: updatedOut } = await auth.db
      .from("v_invoice_outstanding")
      .select("amount_paid, outstanding")
      .eq("invoice_id", invoice.id)
      .eq("business_id", businessId)
      .maybeSingle();

    const paidAmount = roundMoney(
      updatedOut ? Number(updatedOut.amount_paid) : currentPaid + settlement.amount
    );
    const outstanding = roundMoney(
      updatedOut
        ? Number(updatedOut.outstanding)
        : Math.max(0, currentOutstanding - settlement.amount)
    );

    // Trigger real-time mobile push notification
    (async () => {
      try {
        const { data: custRow } = await auth.db
          .from("customers")
          .select("name, shop_name")
          .eq("id", invoice.customer_id)
          .maybeSingle();
        const custName = custRow?.shop_name || custRow?.name || "Customer";
        const { sendPushToAllDevices } = await import("@/lib/notifications/push");
        const { formatINR } = await import("@/lib/formatting/currency");
        const isSettled = outstanding <= 0;
        await sendPushToAllDevices(auth.db, businessId, {
          title: `💰 Payment: ${custName} (${formatINR(settlement.amount)})`,
          body: `${formatINR(settlement.amount)} received for Bill ${invoice.invoice_number} • ${isSettled ? "Settled in Full" : `${formatINR(outstanding)} remaining`}`,
          url: `/invoices/${invoice.id}`,
          tag: `payment-${settlement.paymentId}`,
        });
      } catch (e) {
        console.warn("Payment push notification error:", e);
      }
    })();

    return NextResponse.json({
      success: true,
      invoice_id: invoice.id,
      invoice_number: invoice.invoice_number,
      payment_id: settlement.paymentId,
      amount_recorded: settlement.amount,
      paid_amount: paidAmount,
      outstanding,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Payment error";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

