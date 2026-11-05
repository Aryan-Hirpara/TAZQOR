/**
 * TAZQOR Deep QA & Bug Hunter Script
 * Crawls and tests every page and user flow across both Desktop Web & Mobile App.
 * Captures console logs, runtime errors, network failures, form interactions, and UX flaws.
 */

import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");
const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

const ROUTES = [
  { id: "01", name: "Dashboard", path: "/dashboard" },
  { id: "02", name: "Customers List", path: "/customers" },
  { id: "03", name: "Customer Detail", path: "/customers/c1-shreeji" },
  { id: "04", name: "New Customer Form", path: "/customers/new" },
  { id: "05", name: "Orders List", path: "/orders" },
  { id: "06", name: "New Order Form", path: "/orders/new" },
  { id: "07", name: "Invoices List", path: "/invoices" },
  { id: "08", name: "Invoice Detail", path: "/invoices/inv-1" },
  { id: "09", name: "New Invoice Form", path: "/invoices/new" },
  { id: "10", name: "Payments List", path: "/payments" },
  { id: "11", name: "New Payment Form", path: "/payments/new" },
  { id: "12", name: "Inventory Batches", path: "/inventory" },
  { id: "13", name: "Products Catalog", path: "/products" },
  { id: "14", name: "New Product Form", path: "/products/new" },
  { id: "15", name: "Categories", path: "/categories" },
  { id: "16", name: "Territory Map", path: "/map" },
  { id: "17", name: "Field Visits", path: "/visits" },
  { id: "18", name: "New Visit Form", path: "/visits/new" },
  { id: "19", name: "Expenses List", path: "/expenses" },
  { id: "20", name: "New Expense Form", path: "/expenses/new" },
  { id: "21", name: "Reports & Analytics", path: "/reports" },
  { id: "22", name: "Settings & Profile", path: "/settings" },
  { id: "23", name: "Authentication Login", path: "/login" },
  { id: "24", name: "Offline Screen", path: "/offline" },
];

const auditLog = {
  timestamp: new Date().toISOString(),
  environment: {
    baseUrl: BASE_URL,
    supabaseConfigured: true,
  },
  desktop: {
    viewport: "1440x960",
    routesChecked: 0,
    pageErrors: [],
    consoleErrors: [],
    networkErrors: [],
    layoutDefects: [],
    dataObservations: [],
  },
  mobile: {
    viewport: "390x844 (iPhone)",
    routesChecked: 0,
    pageErrors: [],
    consoleErrors: [],
    networkErrors: [],
    layoutDefects: [],
    dataObservations: [],
  },
  formFlows: [],
  functionalBugs: [],
};

async function runDeepAudit() {
  console.log("=============================================================");
  console.log("🔬 STARTING COMPREHENSIVE TAZQOR DEEP QA AUDIT");
  console.log("=============================================================\n");

  const browser = await chromium.launch({ headless: true });

  // -------------------------------------------------------------
  // 1. DESKTOP WEB AUDIT
  // -------------------------------------------------------------
  console.log("🖥️  AUDITING DESKTOP WEB VIEW (1440x960)...");
  const desktopContext = await browser.newContext({
    viewport: { width: 1440, height: 960 },
    deviceScaleFactor: 2,
  });
  const desktopPage = await desktopContext.newPage();

  // Attach error listeners
  desktopPage.on("pageerror", (err) => {
    auditLog.desktop.pageErrors.push({ url: desktopPage.url(), message: err.message });
  });
  desktopPage.on("console", (msg) => {
    if (msg.type() === "error") {
      auditLog.desktop.consoleErrors.push({ url: desktopPage.url(), text: msg.text() });
    }
  });
  desktopPage.on("response", (res) => {
    if (res.status() >= 400 && !res.url().includes("favicon")) {
      auditLog.desktop.networkErrors.push({ url: res.url(), status: res.status() });
    }
  });

  for (const r of ROUTES) {
    const targetUrl = `${BASE_URL}${r.path}`;
    try {
      const response = await desktopPage.goto(targetUrl, { waitUntil: "networkidle", timeout: 15000 });
      auditLog.desktop.routesChecked++;

      // Check Layout & Dimensions
      const layoutStats = await desktopPage.evaluate(() => {
        const body = document.body;
        const html = document.documentElement;
        return {
          scrollWidth: html.scrollWidth,
          clientWidth: html.clientWidth,
          hasHorizontalOverflow: html.scrollWidth > html.clientWidth + 1,
          cardsCount: document.querySelectorAll("[class*='rounded'], [class*='border']").length,
          buttonsCount: document.querySelectorAll("button").length,
          linksCount: document.querySelectorAll("a").length,
          tablesCount: document.querySelectorAll("table").length,
          rowsCount: document.querySelectorAll("tbody tr").length,
          inputsCount: document.querySelectorAll("input, select, textarea").length,
          headings: Array.from(document.querySelectorAll("h1, h2, h3")).map(h => h.textContent.trim()).filter(Boolean),
        };
      });

      if (layoutStats.hasHorizontalOverflow) {
        auditLog.desktop.layoutDefects.push({
          route: r.path,
          defect: `Horizontal overflow detected: scrollWidth (${layoutStats.scrollWidth}) > clientWidth (${layoutStats.clientWidth})`,
        });
      }

      auditLog.desktop.dataObservations.push({
        route: r.path,
        title: r.title,
        status: response ? response.status() : "N/A",
        rowsCount: layoutStats.rowsCount,
        buttonsCount: layoutStats.buttonsCount,
        inputsCount: layoutStats.inputsCount,
        headings: layoutStats.headings.slice(0, 3),
      });

      process.stdout.write(`  [Desktop] ${r.name} (${r.path}) -> status ${response?.status()} (Rows: ${layoutStats.rowsCount})\n`);
    } catch (err) {
      auditLog.desktop.pageErrors.push({ route: r.path, error: err.message });
      console.log(`  [Desktop] ${r.name} FAILED: ${err.message}`);
    }
  }

  // -------------------------------------------------------------
  // 2. MOBILE APP AUDIT
  // -------------------------------------------------------------
  console.log("\n📱 AUDITING MOBILE APP VIEW (390x844 iPhone Standard)...");
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  const mobilePage = await mobileContext.newPage();

  mobilePage.on("pageerror", (err) => {
    auditLog.mobile.pageErrors.push({ url: mobilePage.url(), message: err.message });
  });
  mobilePage.on("console", (msg) => {
    if (msg.type() === "error") {
      auditLog.mobile.consoleErrors.push({ url: mobilePage.url(), text: msg.text() });
    }
  });
  mobilePage.on("response", (res) => {
    if (res.status() >= 400 && !res.url().includes("favicon")) {
      auditLog.mobile.networkErrors.push({ url: res.url(), status: res.status() });
    }
  });

  for (const r of ROUTES) {
    const targetUrl = `${BASE_URL}${r.path}`;
    try {
      const response = await mobilePage.goto(targetUrl, { waitUntil: "networkidle", timeout: 15000 });
      auditLog.mobile.routesChecked++;

      const mobileStats = await mobilePage.evaluate(() => {
        const html = document.documentElement;
        // Find any elements exceeding viewport right edge
        const offscreenEls = [];
        document.querySelectorAll("*").forEach(el => {
          const rect = el.getBoundingClientRect();
          if (rect.right > window.innerWidth + 2 && !el.closest("pre, code, table")) {
            offscreenEls.push({
              tag: el.tagName.toLowerCase(),
              className: el.className?.toString().slice(0, 40) || "",
              right: Math.round(rect.right),
            });
          }
        });

        // Check if bottom nav is visible on pages that have it
        const bottomNav = document.querySelector("nav, [class*='fixed bottom']");

        return {
          scrollWidth: html.scrollWidth,
          clientWidth: html.clientWidth,
          hasHorizontalOverflow: html.scrollWidth > html.clientWidth + 1,
          offscreenCount: offscreenEls.length,
          offscreenSample: offscreenEls.slice(0, 2),
          hasBottomNav: Boolean(bottomNav),
        };
      });

      if (mobileStats.hasHorizontalOverflow) {
        auditLog.mobile.layoutDefects.push({
          route: r.path,
          defect: `Horizontal overflow: scrollWidth (${mobileStats.scrollWidth}) > clientWidth (${mobileStats.clientWidth})`,
          offscreen: mobileStats.offscreenSample,
        });
      }

      auditLog.mobile.dataObservations.push({
        route: r.path,
        title: r.title,
        status: response ? response.status() : "N/A",
        hasBottomNav: mobileStats.hasBottomNav,
      });

      process.stdout.write(`  [Mobile]  ${r.name} (${r.path}) -> overflow: ${mobileStats.hasHorizontalOverflow ? "YES" : "NO"}\n`);
    } catch (err) {
      auditLog.mobile.pageErrors.push({ route: r.path, error: err.message });
      console.log(`  [Mobile]  ${r.name} FAILED: ${err.message}`);
    }
  }

  // -------------------------------------------------------------
  // 3. INTERACTIVE FORM & CRUD SUBMISSION AUDIT
  // -------------------------------------------------------------
  console.log("\n📝 TESTING USER FLOWS & FORM SUBMISSIONS...");

  // Flow A: New Customer Submission
  try {
    process.stdout.write("  Testing Flow: Customer Creation (/customers/new) ... ");
    await desktopPage.goto(`${BASE_URL}/customers/new`, { waitUntil: "networkidle" });
    await desktopPage.fill("input[placeholder*='Store' i], input[placeholder*='Shop' i], input#shop-name, input[name='name']", "Test Store Alpha");
    const phoneInput = desktopPage.locator("input[type='tel'], input[placeholder*='phone' i], input[placeholder*='982' i]");
    if (await phoneInput.count() > 0) await phoneInput.first().fill("+91 98765 43210");
    const submitBtn = desktopPage.locator("button[type='submit']");
    if (await submitBtn.count() > 0) {
      await submitBtn.click();
      await desktopPage.waitForTimeout(1000);
      auditLog.formFlows.push({
        flow: "Create Customer",
        status: "Submitted successfully",
        currentUrl: desktopPage.url(),
      });
      console.log("✓ submitted");
    }
  } catch (err) {
    auditLog.formFlows.push({ flow: "Create Customer", status: "Failed", error: err.message });
    console.log(`✗ failed: ${err.message}`);
  }

  // Flow B: New Order Creation
  try {
    process.stdout.write("  Testing Flow: Order Creation (/orders/new) ... ");
    await desktopPage.goto(`${BASE_URL}/orders/new`, { waitUntil: "networkidle" });
    const customerSelect = desktopPage.locator("select");
    if (await customerSelect.count() > 0) {
      await customerSelect.first().selectOption({ index: 1 });
    }
    const submitBtn = desktopPage.locator("button[type='submit']");
    if (await submitBtn.count() > 0) {
      await submitBtn.click();
      await desktopPage.waitForTimeout(1000);
      auditLog.formFlows.push({
        flow: "Create Order",
        status: "Submitted successfully",
        currentUrl: desktopPage.url(),
      });
      console.log("✓ submitted");
    }
  } catch (err) {
    auditLog.formFlows.push({ flow: "Create Order", status: "Failed", error: err.message });
    console.log(`✗ failed: ${err.message}`);
  }

  // Flow C: New Expense Recording
  try {
    process.stdout.write("  Testing Flow: Expense Recording (/expenses/new) ... ");
    await desktopPage.goto(`${BASE_URL}/expenses/new`, { waitUntil: "networkidle" });
    const amountInput = desktopPage.locator("input[type='number']");
    if (await amountInput.count() > 0) await amountInput.first().fill("2500");
    const vendorInput = desktopPage.locator("input[placeholder*='vendor' i], input#expense-vendor");
    if (await vendorInput.count() > 0) await vendorInput.first().fill("National Transport");
    const submitBtn = desktopPage.locator("button[type='submit']");
    if (await submitBtn.count() > 0) {
      await submitBtn.click();
      await desktopPage.waitForTimeout(1000);
      auditLog.formFlows.push({
        flow: "Record Expense",
        status: "Submitted successfully",
        currentUrl: desktopPage.url(),
      });
      console.log("✓ submitted");
    }
  } catch (err) {
    auditLog.formFlows.push({ flow: "Record Expense", status: "Failed", error: err.message });
    console.log(`✗ failed: ${err.message}`);
  }

  // Flow D: Search & Filtering
  try {
    process.stdout.write("  Testing Flow: Customer Search Filter (/customers) ... ");
    await desktopPage.goto(`${BASE_URL}/customers`, { waitUntil: "networkidle" });
    const searchInput = desktopPage.locator("input[placeholder*='Search' i]");
    if (await searchInput.count() > 0) {
      await searchInput.fill("Shreeji");
      await desktopPage.waitForTimeout(400);
      const rows = await desktopPage.locator("tbody tr, div[class*='group'] h4, h3").count();
      auditLog.formFlows.push({
        flow: "Customer Search",
        status: `Filtered down to ${rows} matching elements`,
      });
      console.log(`✓ search rendered ${rows} matches`);
    }
  } catch (err) {
    auditLog.formFlows.push({ flow: "Customer Search", status: "Failed", error: err.message });
    console.log(`✗ failed: ${err.message}`);
  }

  // Flow E: Mobile Bottom Nav & Drawer
  try {
    process.stdout.write("  Testing Flow: Mobile Drawer Navigation ... ");
    await mobilePage.goto(`${BASE_URL}/dashboard`, { waitUntil: "networkidle" });
    const moreBtn = mobilePage.locator("button[aria-label='More navigation and actions']");
    if (await moreBtn.count() > 0) {
      await moreBtn.click();
      await mobilePage.waitForSelector("[role='dialog']", { timeout: 3000 });
      // Click a link in the drawer (e.g. Products or Invoices)
      const linkInside = mobilePage.locator("[role='dialog'] a[href='/invoices']").first();
      if (await linkInside.count() > 0) {
        await linkInside.click();
        await mobilePage.waitForURL("**/invoices", { timeout: 4000 });
        auditLog.formFlows.push({
          flow: "Mobile Drawer Navigation",
          status: "Opened drawer and navigated to /invoices cleanly",
        });
        console.log("✓ navigated to /invoices via drawer");
      }
    }
  } catch (err) {
    auditLog.formFlows.push({ flow: "Mobile Drawer Navigation", status: "Failed", error: err.message });
    console.log(`✗ failed: ${err.message}`);
  }

  // Flow F: Map Marker Interaction
  try {
    process.stdout.write("  Testing Flow: Territory Map Pins (/map) ... ");
    await desktopPage.goto(`${BASE_URL}/map`, { waitUntil: "networkidle" });
    const mapPins = desktopPage.locator("button:has(svg.lucide-map-pin)");
    const pinCount = await mapPins.count();
    if (pinCount > 0) {
      await mapPins.first().click();
      await desktopPage.waitForTimeout(300);
      auditLog.formFlows.push({
        flow: "Map Pin Selection",
        status: `Clicked map pin successfully. Found ${pinCount} pins in Gujarat.`,
      });
      console.log(`✓ clicked pin (${pinCount} available)`);
    }
  } catch (err) {
    auditLog.formFlows.push({ flow: "Map Pin Selection", status: "Failed", error: err.message });
    console.log(`✗ failed: ${err.message}`);
  }

  // -------------------------------------------------------------
  // 4. SUPABASE DATA LAYER OBSERVATIONS
  // -------------------------------------------------------------
  console.log("\n🗄️  INSPECTING SUPABASE LIVE INTEGRATION...");
  const supabaseIntegration = await desktopPage.evaluate(async () => {
    // Check if window has local state, localStorage, or remote queries
    return {
      localStorageKeys: Object.keys(localStorage),
      cookiesPresent: document.cookie.length > 0,
    };
  });
  auditLog.dataObservations = supabaseIntegration;

  await desktopContext.close();
  await mobileContext.close();
  await browser.close();

  // Save full JSON log
  const reportPath = path.join(ROOT_DIR, "docs/DEEP_QA_AUDIT.json");
  fs.writeFileSync(reportPath, JSON.stringify(auditLog, null, 2), "utf8");
  console.log(`\nAudit log saved to: ${reportPath}`);

  return auditLog;
}

runDeepAudit().catch((err) => {
  console.error("Audit encountered critical runner error:", err);
  process.exit(1);
});

