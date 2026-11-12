import { ImapFlow } from "imapflow";
import { simpleParser, ParsedMail } from "mailparser";
import nodemailer from "nodemailer";

export interface MailMessage {
  id: string;
  uid: number;
  subject: string;
  fromName: string;
  fromEmail: string;
  toEmail: string;
  date: string;
  snippet: string;
  htmlBody: string;
  textBody: string;
  unread: boolean;
  hasAttachments: boolean;
}

export function getMailConfig() {
  const user = process.env.MAIL_USER || "";
  const pass = process.env.MAIL_PASS || "";
  const host = process.env.MAIL_IMAP_HOST || "imap.gmail.com";
  const port = Number(process.env.MAIL_IMAP_PORT) || 993;

  return {
    user,
    pass: pass.replace(/\s+/g, ""), // Strip spaces in case 16-char app pass has spaces
    host,
    port,
    isConfigured: Boolean(user && pass && pass.length >= 8),
  };
}

/**
 * Creates an ImapFlow client configured for Gmail
 */
function createImapClient(user: string, pass: string) {
  return new ImapFlow({
    host: "imap.gmail.com",
    port: 993,
    secure: true,
    auth: {
      user,
      pass,
    },
    logger: false,
    tls: {
      rejectUnauthorized: true,
    },
    connectionTimeout: 15000,
  });
}

/**
 * Test credentials against Gmail IMAP
 */
export async function testGmailCredentials(user: string, pass: string): Promise<{ success: boolean; error?: string }> {
  const client = createImapClient(user, pass.replace(/\s+/g, ""));
  try {
    await client.connect();
    await client.logout();
    return { success: true };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || "Failed to authenticate with Gmail IMAP",
    };
  }
}

/**
 * Fetch latest messages from Gmail INBOX
 */
export async function fetchGmailInbox(limit = 15): Promise<{
  connected: boolean;
  email: string;
  messages: MailMessage[];
  unreadCount: number;
  error?: string;
}> {
  const config = getMailConfig();

  if (!config.isConfigured) {
    return {
      connected: false,
      email: config.user,
      unreadCount: 0,
      messages: [],
      error: "Google App Password not configured in MAIL_PASS",
    };
  }

  const client = createImapClient(config.user, config.pass);

  try {
    await client.connect();

    const lock = await client.getMailboxLock("INBOX");
    const messages: MailMessage[] = [];
    let unreadCount = 0;

    try {
      const mailbox = client.mailbox;
      const totalMessages = typeof mailbox === "object" && mailbox ? mailbox.exists : 0;

      if (totalMessages > 0) {
        // Fetch the newest sequence (e.g. from total - limit to total)
        const startSeq = Math.max(1, totalMessages - limit + 1);
        const seqRange = `${startSeq}:${totalMessages}`;

        for await (const msg of client.fetch(seqRange, {
          envelope: true,
          flags: true,
          source: true,
          uid: true,
        })) {
          try {
            const isUnread = Boolean(msg.flags && !msg.flags.has("\\Seen"));
            if (isUnread) unreadCount++;

            // Parse raw email source using mailparser
            let parsed: ParsedMail | null = null;
            if (msg.source) {
              parsed = await simpleParser(msg.source);
            }

            const fromObj = parsed?.from?.value?.[0] || msg.envelope?.from?.[0];
            const fromName = fromObj?.name || fromObj?.address?.split("@")[0] || "Unknown Sender";
            const fromEmail = fromObj?.address || "unknown@domain.com";

            const subject = parsed?.subject || msg.envelope?.subject || "(No Subject)";
            const rawDate = parsed?.date || msg.envelope?.date || new Date();
            const dateStr = rawDate instanceof Date ? rawDate.toISOString() : new Date(rawDate).toISOString();
            const textContent = parsed?.text || "";
            const htmlContent = (parsed?.html as string) || textContent.replace(/\n/g, "<br/>");
            const snippet = textContent.slice(0, 140).trim().replace(/\s+/g, " ");

            messages.unshift({
              id: String(msg.uid),
              uid: msg.uid,
              subject,
              fromName,
              fromEmail,
              toEmail: config.user,
              date: dateStr,
              snippet: snippet || "(No text preview)",
              htmlBody: htmlContent,
              textBody: textContent,
              unread: isUnread,
              hasAttachments: Boolean(parsed?.attachments && parsed.attachments.length > 0),
            });
          } catch (msgErr) {
            console.error("Error parsing single email:", msgErr);
          }
        }
      }
    } finally {
      lock.release();
    }

    await client.logout();

    return {
      connected: true,
      email: config.user,
      messages,
      unreadCount,
    };
  } catch (err: any) {
    console.error("Gmail IMAP error:", err);
    try {
      await client.logout();
    } catch {
      // ignore
    }

    return {
      connected: false,
      email: config.user,
      messages: [],
      unreadCount: 0,
      error: err?.message || "Failed to connect to Gmail IMAP",
    };
  }
}

export interface MailAttachment {
  filename: string;
  content: string;
  encoding?: "base64";
  contentType?: string;
}

/**
 * Send an email using Gmail SMTP
 */
export async function sendGmailMessage({
  to,
  subject,
  text,
  html,
  attachments,
}: {
  to: string;
  subject: string;
  text: string;
  html?: string;
  attachments?: MailAttachment[];
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const config = getMailConfig();

  if (!config.isConfigured) {
    return {
      success: false,
      error: "Google App Password not configured in MAIL_PASS",
    };
  }

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: config.user,
        pass: config.pass,
      },
    });

    const info = await transporter.sendMail({
      from: `"TAZQOR" <${config.user}>`,
      to,
      subject,
      text,
      html: html || text.replace(/\n/g, "<br/>"),
      attachments:
        attachments && attachments.length > 0
          ? attachments.map((att) => ({
              filename: att.filename,
              content: Buffer.from(att.content, att.encoding === "base64" ? "base64" : "utf8"),
              contentType: att.contentType || "application/pdf",
            }))
          : undefined,
    });

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (err: any) {
    console.error("Gmail SMTP send error:", err);
    return {
      success: false,
      error: err?.message || "Failed to send email via Gmail SMTP",
    };
  }
}
