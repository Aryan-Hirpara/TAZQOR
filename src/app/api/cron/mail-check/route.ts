// src/app/api/cron/mail-check/route.ts
// Vercel Cron: runs every 30 min — checks for new emails, pushes notification if any

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { sendPushToAllDevices } from "@/lib/notifications/push";
import { fetchGmailInbox } from "@/lib/mail/gmail";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BUSINESS_ID = "00000000-0000-0000-0000-000000000001";
const WINDOW_MINUTES = 32; // check emails in last 32 min

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.MAIL_USER || !process.env.MAIL_PASS) {
    return NextResponse.json({ success: true, reason: "Mail not configured" });
  }

  const db = createAdminClient();
  if (!db) return NextResponse.json({ error: "No admin client" }, { status: 500 });

  try {
    const result = await fetchGmailInbox(10);
    if (!result.connected || !result.messages) {
      return NextResponse.json({ success: true, reason: "Could not fetch inbox" });
    }

    const cutoff = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000);
    const newMails = result.messages.filter((m) => {
      if (!m.date) return false;
      return new Date(m.date) >= cutoff;
    });

    if (newMails.length === 0) {
      return NextResponse.json({ success: true, sent: 0, reason: "No new emails" });
    }

    const first = newMails[0];
    const fromName = first.fromName || first.fromEmail || "Unknown sender";
    const subject = first.subject || "(No subject)";

    let title = "";
    let body = "";
    if (newMails.length === 1) {
      title = `📧 New Email: ${fromName}`;
      body = subject.length > 80 ? subject.substring(0, 77) + "…" : subject;
    } else {
      title = `📧 ${newMails.length} New Emails`;
      body = `From: ${fromName}${newMails.length > 1 ? ` +${newMails.length - 1} more` : ""} • ${subject}`;
    }

    const pushResult = await sendPushToAllDevices(db, BUSINESS_ID, {
      title,
      body,
      url: "/mail",
      tag: "new-mail",
    });

    return NextResponse.json({ success: true, ...pushResult, newMailCount: newMails.length });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message }, { status: 500 });
  }
}

