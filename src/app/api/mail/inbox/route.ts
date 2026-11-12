import { NextResponse } from "next/server";
import { fetchGmailInbox, getMailConfig } from "@/lib/mail/gmail";

export async function GET() {
  const config = getMailConfig();

  if (!config.isConfigured) {
    return NextResponse.json({
      connected: false,
      configured: false,
      isLive: false,
      email: config.user || "",
      messages: [],
      unreadCount: 0,
      requiresAppPassword: true,
      hint: "Connect a Google App Password to sync live business emails.",
    });
  }

  const result = await fetchGmailInbox(20);

  if (!result.connected) {
    return NextResponse.json({
      connected: false,
      configured: true,
      isLive: false,
      email: config.user || "",
      messages: [],
      unreadCount: 0,
      requiresAppPassword: true,
      error: result.error,
    });
  }

  return NextResponse.json({
    connected: true,
    configured: true,
    isLive: true,
    email: result.email,
    messages: result.messages,
    unreadCount: result.unreadCount,
  });
}
