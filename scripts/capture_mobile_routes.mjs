import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const OUT_DIR = path.resolve(process.cwd(), "ui-audit/mobile");
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

const ROUTES = [
  { name: "dashboard", path: "/dashboard" },
  { name: "customers", path: "/customers" },
  { name: "orders", path: "/orders" },
  { name: "invoices", path: "/invoices" },
  { name: "reports", path: "/reports" },
];

async function capture() {
  console.log("Launching Chromium for Mobile Captures at 390x844...");
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15",
  });

  const page = await context.newPage();

  // 1. Capture Light Mode
  for (const route of ROUTES) {
    console.log(`Capturing Light: ${route.name}...`);
    await page.goto(`http://localhost:3000${route.path}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(600);
    await page.screenshot({
      path: path.join(OUT_DIR, `mobile_${route.name}_light.png`),
      fullPage: false,
    });
  }

  // 2. Capture More Launcher open
  console.log("Capturing More Launcher Sheet...");
  await page.goto("http://localhost:3000/dashboard", { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  await page.locator('button[aria-label="More navigation and actions"]').click();
  await page.waitForSelector('[role="dialog"]');
  await page.waitForTimeout(400);
  await page.screenshot({
    path: path.join(OUT_DIR, "mobile_more_launcher_light.png"),
    fullPage: false,
  });

  // 3. Toggle Dark Mode and capture More Launcher Dark
  await page.locator('button[aria-label="Toggle theme"]').click();
  await page.waitForTimeout(400);
  await page.screenshot({
    path: path.join(OUT_DIR, "mobile_more_launcher_dark.png"),
    fullPage: false,
  });

  // Close sheet
  await page.locator('button[aria-label="Close menu"]').click();
  await page.waitForTimeout(400);

  // 4. Capture Dark Mode Routes
  for (const route of ROUTES) {
    console.log(`Capturing Dark: ${route.name}...`);
    await page.goto(`http://localhost:3000${route.path}`, { waitUntil: "networkidle" });
    // Ensure dark mode is active
    await page.evaluate(() => document.documentElement.classList.add("dark"));
    await page.waitForTimeout(600);
    await page.screenshot({
      path: path.join(OUT_DIR, `mobile_${route.name}_dark.png`),
      fullPage: false,
    });
  }

  console.log("All mobile captures completed successfully in", OUT_DIR);
  await browser.close();
}

capture().catch((err) => {
  console.error("Capture failed:", err);
  process.exit(1);
});
