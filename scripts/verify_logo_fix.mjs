import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const ARTIFACT_DIR = "/Users/aryanhirpara/.gemini/antigravity/brain/aee92c92-b08f-4d73-a23c-2eab803b6a56";

async function run() {
  const browser = await chromium.launch({ headless: true });

  const sessionObj = {
    userId: "00000000-0000-0000-0000-000000000001",
    email: "owner@tazqor.com",
    businessId: "00000000-0000-0000-0000-000000000001",
    fullName: "TAZQOR Owner",
    role: "admin",
  };
  const sessionCookieVal = Buffer.from(JSON.stringify(sessionObj)).toString("base64");

  // 1. Desktop with Dark OS theme (matching user's environment in screenshot)
  const desktopDarkContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    colorScheme: "dark", // Exactly reproduces the user's Mac OS Dark Mode!
  });
  await desktopDarkContext.addCookies([
    {
      name: "tazqor_session",
      value: sessionCookieVal,
      domain: "localhost",
      path: "/",
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);

  const desktopPage = await desktopDarkContext.newPage();
  console.log("Navigating to http://localhost:3000/dashboard (Desktop, OS Dark Scheme)...");
  await desktopPage.goto("http://localhost:3000/dashboard", { waitUntil: "networkidle" });
  await desktopPage.waitForTimeout(1000);

  const desktopScreenshotPath = path.join(ARTIFACT_DIR, "logo_fix_desktop_dark_scheme.png");
  await desktopPage.screenshot({ path: desktopScreenshotPath, fullPage: false });
  console.log("Saved desktop screenshot:", desktopScreenshotPath);

  // Close desktop context
  await desktopDarkContext.close();

  // 2. Mobile with Dark OS theme
  const mobileDarkContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148",
    colorScheme: "dark",
  });
  await mobileDarkContext.addCookies([
    {
      name: "tazqor_session",
      value: sessionCookieVal,
      domain: "localhost",
      path: "/",
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);

  const mobilePage = await mobileDarkContext.newPage();
  console.log("Navigating to http://localhost:3000/dashboard (Mobile, OS Dark Scheme)...");
  await mobilePage.goto("http://localhost:3000/dashboard", { waitUntil: "networkidle" });
  await mobilePage.waitForTimeout(1000);

  const mobileScreenshotPath = path.join(ARTIFACT_DIR, "logo_fix_mobile_dark_scheme.png");
  await mobilePage.screenshot({ path: mobileScreenshotPath, fullPage: false });
  console.log("Saved mobile screenshot:", mobileScreenshotPath);

  // 3. Login page check (Desktop)
  const loginContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    colorScheme: "dark",
  });
  const loginPage = await loginContext.newPage();
  await loginPage.goto("http://localhost:3000/login", { waitUntil: "networkidle" });
  await loginPage.waitForTimeout(500);
  const loginScreenshotPath = path.join(ARTIFACT_DIR, "logo_fix_login_dark_scheme.png");
  await loginPage.screenshot({ path: loginScreenshotPath, fullPage: false });
  console.log("Saved login screenshot:", loginScreenshotPath);

  await browser.close();
  console.log("Done capturing verification screenshots!");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
