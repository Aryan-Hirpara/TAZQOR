import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { testGmailCredentials } from "@/lib/mail/gmail";

export async function POST(request: NextRequest) {
  try {
    const { email = "tazqor@gmail.com", appPassword } = await request.json();

    if (!appPassword || typeof appPassword !== "string" || appPassword.trim().length < 8) {
      return NextResponse.json(
        { error: "Please provide a valid 16-character Google App Password." },
        { status: 400 }
      );
    }

    const cleanPass = appPassword.replace(/\s+/g, "");

    // 1. Test credentials against Gmail IMAP server
    const testResult = await testGmailCredentials(email.trim(), cleanPass);

    if (!testResult.success) {
      return NextResponse.json(
        {
          error:
            testResult.error ||
            "Authentication failed. Please verify 2-Step Verification is active and you generated an App Password from https://myaccount.google.com/apppasswords",
        },
        { status: 401 }
      );
    }

    // 2. Update process.env in running instance
    process.env.MAIL_USER = email.trim();
    process.env.MAIL_PASS = cleanPass;

    // 3. Persist to .env.local file
    try {
      const envPath = path.resolve(process.cwd(), ".env.local");
      let content = "";
      if (fs.existsSync(envPath)) {
        content = fs.readFileSync(envPath, "utf-8");
      }

      // Replace existing or append
      if (content.includes("MAIL_USER=")) {
        content = content.replace(/MAIL_USER=.*/g, `MAIL_USER="${email.trim()}"`);
      } else {
        content += `\nMAIL_USER="${email.trim()}"`;
      }

      if (content.includes("MAIL_PASS=")) {
        content = content.replace(/MAIL_PASS=.*/g, `MAIL_PASS="${cleanPass}"`);
      } else {
        content += `\nMAIL_PASS="${cleanPass}"`;
      }

      fs.writeFileSync(envPath, content.trim() + "\n", "utf-8");
    } catch (saveErr) {
      console.warn("Could not save to .env.local:", saveErr);
    }

    return NextResponse.json({
      success: true,
      message: `Successfully connected to ${email.trim()}! Live inbox is now active.`,
    });
  } catch (err: any) {
    console.error("Connect error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to connect mailbox" },
      { status: 500 }
    );
  }
}

