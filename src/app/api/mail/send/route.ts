import { NextRequest, NextResponse } from "next/server";
import { sendGmailMessage, getMailConfig } from "@/lib/mail/gmail";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, subject, text, html } = body;

    if (!to || !subject || (!text && !html)) {
      return NextResponse.json(
        { error: "Recipient (to), subject, and body are required." },
        { status: 400 }
      );
    }

    const config = getMailConfig();

    if (!config.isConfigured) {
      // In preview mode when App Password is not yet saved, simulate success
      return NextResponse.json({
        success: true,
        isSimulated: true,
        message: `Simulated: Email to ${to} queued. (Add Google App Password in .env.local to send live emails via Gmail SMTP).`,
      });
    }

    const result = await sendGmailMessage({
      to,
      subject,
      text: text || "",
      html,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
      message: `Email sent successfully from ${config.user} to ${to}!`,
    });
  } catch (err: any) {
    console.error("Error sending mail:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to send email" },
      { status: 500 }
    );
  }
}
