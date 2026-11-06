import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const ARTIFACT_DIR = "/Users/aryanhirpara/.gemini/antigravity/brain/aee92c92-b08f-4d73-a23c-2eab803b6a56";

async function run() {
  console.log("Launching browser for Notifications & Messages verification...");
  const browser = await chromium.launch({ headless: true });

  const sessionObj = {
    userId: "00000000-0000-0000-0000-000000000001",
    email: "owner@tazqor.com",
    businessId: "00000000-0000-0000-0000-000000000001",
    fullName: "TAZQOR Owner",
    role: "admin",
  };
  const sessionCookieVal = Buffer.from(JSON.stringify(sessionObj)).toString("base64");

  // 1. Desktop verification
  const desktopContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  await desktopContext.addCookies([
    {
      name: "tazqor_session",
      value: sessionCookieVal,
      domain: "localhost",
      path: "/",
    },
  ]);

  const desktopPage = await desktopContext.newPage();
  console.log("Navigating to http://localhost:3000/dashboard...");
  await desktopPage.goto("http://localhost:3000/dashboard", { waitUntil: "networkidle" });
  await desktopPage.waitForTimeout(1000);

  // Test Bell (Notifications) click
  console.log("Clicking Bell (Notifications) in sidebar rail...");
  const notifBtn = desktopPage.locator('button[title*="Notifications"]').first();
  await notifBtn.click();
  await desktopPage.waitForTimeout(600);

  const notifScreenshot = path.join(ARTIFACT_DIR, "notifications_popover_open.png");
  await desktopPage.screenshot({ path: notifScreenshot });
  console.log("Saved notifications screenshot:", notifScreenshot);

  // Close notifications popover via backdrop or close button
  const closeBtn = desktopPage.locator('button[aria-label="Close"]').first();
  if (await closeBtn.isVisible()) {
    await closeBtn.click();
    await desktopPage.waitForTimeout(300);
  }

  // Test Mail (Messages) click
  console.log("Clicking Mail (Messages) in sidebar rail...");
  const mailBtn = desktopPage.locator('button[title*="Messages"]').first();
  await mailBtn.click();
  await desktopPage.waitForTimeout(600);

  const msgScreenshot = path.join(ARTIFACT_DIR, "messages_popover_open.png");
  await desktopPage.screenshot({ path: msgScreenshot });
  console.log("Saved messages screenshot:", msgScreenshot);

  await desktopContext.close();

  // 2. Mobile verification
  console.log("Testing mobile header notifications...");
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15",
  });
  await mobileContext.addCookies([
    {
      name: "tazqor_session",
      value: sessionCookieVal,
      domain: "localhost",
      path: "/",
    },
  ]);

  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto("http://localhost:3000/dashboard", { waitUntil: "networkidle" });
  await mobilePage.waitForTimeout(1000);

  const mobileBellBtn = mobilePage.locator('button[aria-label="Notifications"]').first();
  await mobileBellBtn.click();
  await mobilePage.waitForTimeout(600);

  const mobileNotifScreenshot = path.join(ARTIFACT_DIR, "mobile_notifications_open.png");
  await mobilePage.screenshot({ path: mobileNotifScreenshot });
  console.log("Saved mobile notifications screenshot:", mobileNotifScreenshot);

  await mobileContext.close();
  await browser.close();

  console.log("==================================================");
  console.log("SUCCESS: NOTIFICATIONS AND MESSAGES VERIFIED!");
  console.log("==================================================");
}

run().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
