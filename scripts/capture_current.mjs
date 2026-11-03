import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const currentDir = path.resolve("ui-audit/current");
if (!fs.existsSync(currentDir)) {
  fs.mkdirSync(currentDir, { recursive: true });
}

const desktopRoutes = [
  { name: "dashboard", path: "/dashboard" },
  { name: "customers", path: "/customers" },
  { name: "products", path: "/products" },
  { name: "inventory", path: "/inventory" },
  { name: "orders", path: "/orders" },
  { name: "invoices", path: "/invoices" },
  { name: "payments", path: "/payments" },
  { name: "map", path: "/map" },
  { name: "visits", path: "/visits" },
  { name: "expenses", path: "/expenses" },
  { name: "reports", path: "/reports" },
  { name: "settings", path: "/settings" },
  { name: "login", path: "/login" },
];

const mobileRoutes = [
  { name: "mobile_dashboard", path: "/dashboard" },
  { name: "mobile_reports", path: "/reports" },
  { name: "mobile_orders", path: "/orders" },
  { name: "mobile_customers", path: "/customers" },
  { name: "mobile_invoices", path: "/invoices" },
];

async function main() {
  console.log("Launching Chromium...");
  const browser = await chromium.launch({ headless: true });

  // 1. Desktop captures (1659 x 1105)
  console.log("Capturing Desktop routes at 1659x1105...");
  const desktopContext = await browser.newContext({
    viewport: { width: 1659, height: 1105 },
    deviceScaleFactor: 1,
  });
  const desktopPage = await desktopContext.newPage();

  for (const route of desktopRoutes) {
    const url = `http://localhost:3000${route.path}`;
    try {
      await desktopPage.goto(url, { waitUntil: "networkidle", timeout: 15000 });
      await desktopPage.waitForTimeout(500); // Wait for animations
      const filePath = path.join(currentDir, `desktop_${route.name}.png`);
      await desktopPage.screenshot({ path: filePath, fullPage: false });
      console.log(`Saved: desktop_${route.name}.png`);
    } catch (err) {
      console.error(`Failed ${route.name}:`, err.message);
    }
  }
  await desktopContext.close();

  // 2. Mobile captures (390 x 844)
  console.log("Capturing Mobile routes at 390x844...");
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  const mobilePage = await mobileContext.newPage();

  for (const route of mobileRoutes) {
    const url = `http://localhost:3000${route.path}`;
    try {
      await mobilePage.goto(url, { waitUntil: "networkidle", timeout: 15000 });
      await mobilePage.waitForTimeout(500);
      const filePath = path.join(currentDir, `${route.name}.png`);
      await mobilePage.screenshot({ path: filePath, fullPage: false });
      console.log(`Saved: ${route.name}.png`);
    } catch (err) {
      console.error(`Failed ${route.name}:`, err.message);
    }
  }
  await mobileContext.close();

  await browser.close();
  console.log("All captures completed successfully.");
}

main().catch(console.error);

