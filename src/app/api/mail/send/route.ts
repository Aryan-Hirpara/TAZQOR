import { NextRequest, NextResponse } from "next/server";
import { sendGmailMessage, getMailConfig, MailAttachment } from "@/lib/mail/gmail";

const MAX_ATTACHMENT_BASE64_LENGTH = 14 * 1024 * 1024; // ~10 MB binary cap

function parseAttachments(raw: unknown): {
  attachments?: MailAttachment[];
  error?: string;
} {
  if (raw == null) return {};
  if (!Array.isArray(raw)) {
    return { error: "attachments must be an array." };
  }

  const parsed: MailAttachment[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") {
      return { error: "Invalid attachment object." };
    }
    const rec = item as Record<string, unknown>;
    const filename =
      typeof rec.filename === "string" && rec.filename.trim()
        ? rec.filename.trim().replace(/[/\\]/g, "_")
        : "";
    const content = typeof rec.content === "string" ? rec.content.trim() : "";
    if (!filename || !content) {
      return { error: "Each attachment requires a filename and content." };
    }
    if (content.length > MAX_ATTACHMENT_BASE64_LENGTH) {
      return { error: `Attachment ${filename} exceeds maximum size limit.` };
    }
    parsed.push({
      filename,
      content,
      encoding: "base64",
      contentType:
        typeof rec.contentType === "string" && rec.contentType.trim()
          ? rec.contentType.trim()
          : "application/pdf",
    });
  }
  return { attachments: parsed };
}

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

    const parsedAtt = parseAttachments(body.attachments);
    if (parsedAtt.error) {
      return NextResponse.json({ error: parsedAtt.error }, { status: 400 });
    }

    const config = getMailConfig();
    const attachmentCount = parsedAtt.attachments?.length || 0;

    if (!config.isConfigured) {
      // In preview mode when App Password is not yet saved, simulate success
      return NextResponse.json({
        success: true,
        isSimulated: true,
        attachmentsIncluded: attachmentCount,
        message: `Simulated: Email${attachmentCount > 0 ? ` with ${attachmentCount} PDF attachment` : ""} to ${to} queued. (Add MAIL_USER & Google App Password in .env.local to send live emails via Gmail SMTP).`,
      });
    }

    const result = await sendGmailMessage({
      to,
      subject,
      text: text || "",
      html,
      attachments: parsedAtt.attachments,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
      attachmentsIncluded: attachmentCount,
      message: `Email${attachmentCount > 0 ? " with PDF attached" : ""} sent from ${config.user} to ${to}!`,
    });
  } catch (err: any) {
    console.error("Error sending mail:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to send email" },
      { status: 500 }
    );
  }
}

