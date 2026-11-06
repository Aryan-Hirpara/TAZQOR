import { NextResponse } from "next/server";
import { fetchGmailInbox, getMailConfig } from "@/lib/mail/gmail";

// Fallback preview messages shown when App Password is not yet entered
const PREVIEW_EMAILS = [
  {
    id: "preview-1",
    uid: 101,
    subject: "Bulk Order Quotation Request: Dish Wash Gel 5 L",
    fromName: "Haresh Patel",
    fromEmail: "haresh@shreejimart.com",
    toEmail: "tazqor@gmail.com",
    date: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    snippet: "Hello TAZQOR Team, please share your best wholesale rate for 50 cases of 5 L Citrus Cleaner and Dish Wash...",
    textBody: "Hello TAZQOR Team,\n\nPlease share your best wholesale rate for 50 cases of 5 L Citrus Cleaner and Dish Wash refills. We need delivery at our Bodakdev outlet by Friday.\n\nThanks,\nHaresh Patel\nShreeji Supermarket",
    htmlBody: "<p>Hello TAZQOR Team,</p><p>Please share your best wholesale rate for 50 cases of 5 L Citrus Cleaner and Dish Wash refills. We need delivery at our Bodakdev outlet by Friday.</p><p>Thanks,<br/>Haresh Patel<br/>Shreeji Supermarket</p>",
    unread: true,
    hasAttachments: false,
  },
  {
    id: "preview-2",
    uid: 102,
    subject: "Payment Advice: ₹12,000 for Invoice INV-2025-26/0001",
    fromName: "HDFC Bank Alert",
    fromEmail: "alerts@hdfcbank.net",
    toEmail: "tazqor@gmail.com",
    date: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    snippet: "Dear Customer, INR 12,000.00 credited to your A/C 50200088991122 on 06-Nov-26 via UPI reference 6314890214.",
    textBody: "Dear Customer,\n\nINR 12,000.00 credited to your A/C 50200088991122 on 06-Nov-26 via UPI reference 6314890214 from Riddhi Mart.\n\nRegards,\nHDFC Bank",
    htmlBody: "<p>Dear Customer,</p><p><strong>INR 12,000.00</strong> credited to your A/C 50200088991122 on 06-Nov-26 via UPI reference 6314890214 from Riddhi Mart.</p><p>Regards,<br/>HDFC Bank</p>",
    unread: true,
    hasAttachments: false,
  },
  {
    id: "preview-3",
    uid: 103,
    subject: "Raw Material Delivery Dispatch Note #DC-8891",
    fromName: "Gujarat Chemical Supplies",
    fromEmail: "dispatch@gujaratchem.in",
    toEmail: "tazqor@gmail.com",
    date: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
    snippet: "Attached is the delivery challan for 20 Barrels of Sodium Laureth Sulfate (SLES) dispatched to your Phase II plant.",
    textBody: "Dear TAZQOR Manufacturing,\n\nAttached is the delivery challan for 20 Barrels of SLES dispatched to your Phase II plant via transporter Om Logistics. Expected arrival tomorrow 11 AM.\n\nSincerely,\nDispatch Dept",
    htmlBody: "<p>Dear TAZQOR Manufacturing,</p><p>Attached is the delivery challan for 20 Barrels of SLES dispatched to your Phase II plant via transporter Om Logistics. Expected arrival tomorrow 11 AM.</p><p>Sincerely,<br/>Dispatch Dept</p>",
    unread: false,
    hasAttachments: true,
  },
];

export async function GET() {
  const config = getMailConfig();

  // If App Password is not yet saved in process.env, return demo preview with prompt to add password
  if (!config.isConfigured) {
    return NextResponse.json({
      connected: false,
      isLive: false,
      email: config.user,
      messages: PREVIEW_EMAILS,
      unreadCount: PREVIEW_EMAILS.filter((m) => m.unread).length,
      requiresAppPassword: true,
      hint: "To fetch live emails from tazqor@gmail.com, enter your 16-character Google App Password.",
    });
  }

  // Try live fetch from Gmail
  const result = await fetchGmailInbox(20);

  if (!result.connected) {
    // If connection failed (e.g. invalid password or network issue), return error details with fallback
    return NextResponse.json({
      connected: false,
      isLive: false,
      email: config.user,
      messages: PREVIEW_EMAILS,
      unreadCount: PREVIEW_EMAILS.filter((m) => m.unread).length,
      requiresAppPassword: true,
      error: result.error,
    });
  }

  return NextResponse.json({
    connected: true,
    isLive: true,
    email: result.email,
    messages: result.messages,
    unreadCount: result.unreadCount,
  });
}

