import { chromium } from "playwright";
import path from "path";

const ARTIFACT_DIR = "/Users/aryanhirpara/.gemini/antigravity/brain/aee92c92-b08f-4d73-a23c-2eab803b6a56";

async function verify() {
  console.log("Starting visual and font consistency verification...");
  const browser = await chromium.launch({ headless: true });

  const sessionObj = {
    userId: "00000000-0000-0000-0000-000000000001",
    email: "owner@tazqor.com",
    businessId: "00000000-0000-0000-0000-000000000001",
    fullName: "TAZQOR Owner",
    role: "admin",
  };
  const sessionCookieVal = Buffer.from(JSON.stringify(sessionObj)).toString("base64");

  // 1. Desktop Context
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  await context.addCookies([
    {
      name: "tazqor_session",
      value: sessionCookieVal,
      domain: "localhost",
      path: "/",
    },
  ]);

  const page = await context.newPage();
  const consoleErrors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      consoleErrors.push(msg.text());
    }
  });

  const routes = ["/dashboard", "/visits", "/orders", "/reports"];

  for (const route of routes) {
    console.log(`Navigating to http://localhost:3000${route}...`);
    await page.goto(`http://localhost:3000${route}`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1500);

    const safeName = route.replace("/", "");
    const shotPath = path.join(ARTIFACT_DIR, `unified_${safeName}_desktop.png`);
    await page.screenshot({ path: shotPath });
    console.log(`Saved screenshot for ${route}: ${shotPath}`);

    // Inspect computed font properties of first KPI card
    const cardInfo = await page.evaluate(() => {
      const card = document.querySelector(".grid > div");
      if (!card) return null;
      const numElem = card.querySelector(".text-2xl, .text-3xl, [class*='font-semibold']");
      if (!numElem) return null;
      const style = window.getComputedStyle(numElem);
      return {
        text: numElem.textContent?.trim(),
        fontFamily: style.fontFamily,
        fontWeight: style.fontWeight,
        fontSize: style.fontSize,
      };
    });
    console.log(`Route ${route} KPI computed font:`, cardInfo);
  }

  // 2. Mobile Context (Samsung Galaxy 360x800)
  const mobileContext = await browser.newContext({
    viewport: { width: 360, height: 800 },
    userAgent: "Mozilla/5.0 (Linux; Android 13; SM-S908B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Mobile Safari/537.36",
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
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
  mobilePage.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(`[Mobile] ${msg.text()}`);
  });

  for (const route of ["/visits", "/orders", "/reports"]) {
    console.log(`Mobile navigating to http://localhost:3000${route}...`);
    await mobilePage.goto(`http://localhost:3000${route}`, { waitUntil: "domcontentloaded" });
    await mobilePage.waitForTimeout(1500);

    const safeName = route.replace("/", "");
    const mobileShotPath = path.join(ARTIFACT_DIR, `unified_${safeName}_mobile.png`);
    await mobilePage.screenshot({ path: mobileShotPath });
    console.log(`Saved mobile screenshot for ${route}: ${mobileShotPath}`);
  }

  console.log("Console errors encountered during verification:", consoleErrors);
  await browser.close();
}

verify().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
