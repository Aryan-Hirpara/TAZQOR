/**
 * TAZQOR Complete Website & Mobile App Screenshot Generator
 * Captures high-resolution retina screenshots across all routes for:
 *   1. Web / Desktop view (1440x960 reference canvas + full page)
 *   2. Mobile Application view (390x844 iPhone standard + full page)
 *   3. Mobile interactive states (More Launcher drawer sheet)
 * Generates an interactive gallery viewer in screenshots/index.html
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");

const SCREENSHOTS_DIR = path.join(ROOT_DIR, "screenshots");
const DESKTOP_DIR = path.join(SCREENSHOTS_DIR, "desktop");
const DESKTOP_FULL_DIR = path.join(SCREENSHOTS_DIR, "desktop-full");
const MOBILE_DIR = path.join(SCREENSHOTS_DIR, "mobile");
const MOBILE_FULL_DIR = path.join(SCREENSHOTS_DIR, "mobile-full");

// Ensure output directories exist
[SCREENSHOTS_DIR, DESKTOP_DIR, DESKTOP_FULL_DIR, MOBILE_DIR, MOBILE_FULL_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

const ROUTES = [
  { id: "01", name: "dashboard", title: "Dashboard & Analytics Overview", path: "/dashboard" },
  { id: "02", name: "customers", title: "Customers Directory", path: "/customers" },
  { id: "03", name: "customer_detail", title: "Customer Detail (Shreeji Supermarket)", path: "/customers/c1-shreeji" },
  { id: "04", name: "customer_new", title: "Add New Customer", path: "/customers/new" },
  { id: "05", name: "orders", title: "Orders Management", path: "/orders" },
  { id: "06", name: "order_new", title: "Create New Order", path: "/orders/new" },
  { id: "07", name: "invoices", title: "Invoices & Bills of Supply", path: "/invoices" },
  { id: "08", name: "invoice_detail", title: "Tax Invoice Detail View", path: "/invoices/inv-1" },
  { id: "09", name: "invoice_new", title: "Create GST Tax Invoice", path: "/invoices/new" },
  { id: "10", name: "payments", title: "Payment Collections & Receipts", path: "/payments" },
  { id: "11", name: "payment_new", title: "Record Payment Collection", path: "/payments/new" },
  { id: "12", name: "inventory", title: "Stock & Inventory Batches", path: "/inventory" },
  { id: "13", name: "products", title: "Products & SKU Catalog", path: "/products" },
  { id: "14", name: "product_new", title: "Add New Product", path: "/products/new" },
  { id: "15", name: "categories", title: "Product Categories", path: "/categories" },
  { id: "16", name: "map", title: "Gujarat Territory & Store Map", path: "/map" },
  { id: "17", name: "visits", title: "Field Visits Tracker", path: "/visits" },
  { id: "18", name: "visit_new", title: "Schedule Field Visit", path: "/visits/new" },
  { id: "19", name: "expenses", title: "Operating Expenses", path: "/expenses" },
  { id: "20", name: "expense_new", title: "Record Operating Expense", path: "/expenses/new" },
  { id: "21", name: "reports", title: "Reports & Sales Analysis", path: "/reports" },
  { id: "22", name: "settings", title: "Business Profile & GST Settings", path: "/settings" },
  { id: "23", name: "login", title: "Authentication & Sign In", path: "/login" },
  { id: "24", name: "offline", title: "Offline Fallback Screen", path: "/offline" },
];

async function runScreenshotPipeline() {
  console.log("=============================================================");
  console.log("📸 TAZQOR Complete Website & Mobile App Screenshot Generator");
  console.log("=============================================================");
  console.log(`Target URL:     ${BASE_URL}`);
  console.log(`Output Folder:  ${SCREENSHOTS_DIR}`);
  console.log(`Total Routes:   ${ROUTES.length}`);
  console.log("-------------------------------------------------------------\n");

  const browser = await chromium.launch({ headless: true });

  // 1. Desktop Browser Context (1440x960 Retina 2x)
  console.log("🖥️  [1/3] CAPTURING DESKTOP / WEB VIEWS (1440x960 @2x)...");
  const desktopContext = await browser.newContext({
    viewport: { width: 1440, height: 960 },
    deviceScaleFactor: 2,
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  });
  const desktopPage = await desktopContext.newPage();

  for (const r of ROUTES) {
    const url = `${BASE_URL}${r.path}`;
    process.stdout.write(`  [Desktop] ${r.id} - ${r.title} (${r.path}) ... `);
    try {
      await desktopPage.goto(url, { waitUntil: "networkidle", timeout: 15000 });
      await desktopPage.waitForTimeout(300);

      const fileName = `${r.id}_${r.name}.png`;
      // Standard viewport screenshot
      await desktopPage.screenshot({
        path: path.join(DESKTOP_DIR, fileName),
        fullPage: false,
      });

      // Full scrollable page screenshot
      await desktopPage.screenshot({
        path: path.join(DESKTOP_FULL_DIR, fileName),
        fullPage: true,
      });
      console.log("✓ saved");
    } catch (err) {
      console.log(`✗ error: ${err.message}`);
    }
  }
  await desktopContext.close();

  // 2. Mobile Browser Context (iPhone 390x844 Retina 2x Touch)
  console.log("\n📱 [2/3] CAPTURING MOBILE APPLICATION VIEWS (390x844 @2x Touch)...");
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1",
  });
  const mobilePage = await mobileContext.newPage();

  for (const r of ROUTES) {
    const url = `${BASE_URL}${r.path}`;
    process.stdout.write(`  [Mobile]  ${r.id} - ${r.title} (${r.path}) ... `);
    try {
      await mobilePage.goto(url, { waitUntil: "networkidle", timeout: 15000 });
      await mobilePage.waitForTimeout(300);

      const fileName = `${r.id}_${r.name}.png`;
      // Viewport screenshot (what user sees on mobile screen)
      await mobilePage.screenshot({
        path: path.join(MOBILE_DIR, fileName),
        fullPage: false,
      });

      // Full scrollable page screenshot
      await mobilePage.screenshot({
        path: path.join(MOBILE_FULL_DIR, fileName),
        fullPage: true,
      });
      console.log("✓ saved");
    } catch (err) {
      console.log(`✗ error: ${err.message}`);
    }
  }

  // 3. Mobile Special States (More Launcher Drawer Sheet)
  console.log("\n✨ [3/3] CAPTURING MOBILE INTERACTIVE OVERLAYS...");
  try {
    process.stdout.write("  [Mobile]  25 - More Navigation Launcher Drawer ... ");
    await mobilePage.goto(`${BASE_URL}/dashboard`, { waitUntil: "networkidle" });
    await mobilePage.waitForTimeout(300);
    const moreBtn = mobilePage.locator('button[aria-label="More navigation and actions"]');
    if (await moreBtn.isVisible()) {
      await moreBtn.click();
      await mobilePage.waitForSelector('[role="dialog"]', { timeout: 4000 });
      await mobilePage.waitForTimeout(300);

      await mobilePage.screenshot({
        path: path.join(MOBILE_DIR, "25_mobile_more_drawer.png"),
        fullPage: false,
      });
      console.log("✓ saved");
    } else {
      console.log("⚠️ button not found");
    }
  } catch (err) {
    console.log(`✗ error: ${err.message}`);
  }

  await mobileContext.close();
  await browser.close();

  // 4. Generate Interactive HTML Gallery
  console.log("\n📑 GENERATING HTML GALLERY (screenshots/index.html)...");
  generateHtmlGallery();

  console.log("\n=============================================================");
  console.log("🎉 ALL SCREENSHOTS SUCCESSFULLY GENERATED!");
  console.log(`📁 Directory: ${SCREENSHOTS_DIR}`);
  console.log("   ├── desktop/      (1440x960 Web viewport screenshots)");
  console.log("   ├── desktop-full/ (Complete scrollable web screenshots)");
  console.log("   ├── mobile/       (390x844 Mobile app viewport screenshots)");
  console.log("   ├── mobile-full/  (Complete scrollable mobile app screenshots)");
  console.log("   └── index.html    (Interactive viewer & comparison gallery)");
  console.log("=============================================================\n");
}

function generateHtmlGallery() {
  const allRoutes = [
    ...ROUTES,
    { id: "25", name: "mobile_more_drawer", title: "Mobile More Navigation Drawer", path: "/dashboard (Drawer Open)" },
  ];

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TAZQOR • Complete Website & Mobile App Screenshots</title>
  <style>
    :root {
      --bg: #F4F2F8;
      --card-bg: rgba(255, 255, 255, 0.85);
      --border: rgba(0, 0, 0, 0.08);
      --text: #111827;
      --text-muted: #6B7280;
      --lime: #D7FF00;
      --dark: #121212;
      --radius: 18px;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    body { background: var(--bg); color: var(--text); padding: 32px 24px; }
    header { max-width: 1400px; margin: 0 auto 32px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px; }
    .brand { display: flex; align-items: center; gap: 12px; }
    .logo-badge { background: #000; color: var(--lime); font-weight: 800; font-size: 18px; padding: 6px 14px; border-radius: 9999px; letter-spacing: -0.5px; }
    h1 { font-size: 24px; font-weight: 700; color: #111; }
    .stats { display: flex; gap: 12px; }
    .stat-pill { background: #fff; border: 1px solid var(--border); padding: 8px 16px; border-radius: 9999px; font-size: 13px; font-weight: 600; }
    
    .view-toggles { display: flex; gap: 8px; max-width: 1400px; margin: 0 auto 24px; }
    .toggle-btn { background: #fff; border: 1px solid var(--border); padding: 8px 18px; border-radius: 9999px; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
    .toggle-btn.active { background: #000; color: #fff; border-color: #000; }

    .grid { max-width: 1400px; margin: 0 auto; display: grid; grid-template-columns: repeat(auto-fill, minmax(420px, 1fr)); gap: 24px; }
    .card { background: var(--card-bg); backdrop-filter: blur(20px); border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.04); display: flex; flex-col; transition: transform 0.2s; }
    .card:hover { transform: translateY(-2px); }
    .card-header { padding: 16px 20px; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; }
    .card-title { font-size: 15px; font-weight: 700; color: #111; }
    .card-route { font-size: 11px; font-family: monospace; color: var(--text-muted); background: rgba(0,0,0,0.05); padding: 2px 8px; border-radius: 6px; }
    
    .media-container { padding: 16px; display: flex; gap: 16px; background: rgba(0,0,0,0.02); }
    .preview-box { flex: 1; display: flex; flex-direction: column; align-items: center; }
    .preview-label { font-size: 11px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; margin-bottom: 8px; letter-spacing: 0.5px; }
    .preview-img-wrap { width: 100%; border-radius: 12px; overflow: hidden; border: 1px solid rgba(0,0,0,0.08); background: #fff; cursor: zoom-in; box-shadow: 0 2px 10px rgba(0,0,0,0.05); }
    .preview-img-wrap img { width: 100%; height: auto; display: block; object-fit: contain; }

    /* Modal for zoom */
    .modal { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.85); backdrop-filter: blur(10px); z-index: 999; justify-content: center; align-items: center; padding: 24px; }
    .modal.active { display: flex; }
    .modal img { max-width: 90vw; max-height: 90vh; border-radius: 16px; box-shadow: 0 10px 40px rgba(0,0,0,0.5); object-fit: contain; }
  </style>
</head>
<body>
  <header>
    <div class="brand">
      <div class="logo-badge">TAZQOR</div>
      <div>
        <h1>Visual Inventory & Screenshots</h1>
        <p style="font-size: 13px; color: var(--text-muted);">Complete visual gallery for Desktop Web & Mobile App</p>
      </div>
    </div>
    <div class="stats">
      <div class="stat-pill">🖥️ 24 Web Screens</div>
      <div class="stat-pill">📱 25 Mobile Screens</div>
      <div class="stat-pill">✨ High-DPI Retina (2x)</div>
    </div>
  </header>

  <div class="view-toggles">
    <button class="toggle-btn active" onclick="filterView('both')">Compare Both (Desktop + Mobile)</button>
    <button class="toggle-btn" onclick="filterView('desktop')">Desktop Web Only</button>
    <button class="toggle-btn" onclick="filterView('mobile')">Mobile App Only</button>
  </div>

  <div class="grid">
    ${allRoutes
      .map(
        (r) => `
    <div class="card" id="card-${r.name}">
      <div class="card-header">
        <div>
          <span style="font-size: 12px; font-weight: 800; color: #6366F1; margin-right: 6px;">#${r.id}</span>
          <span class="card-title">${r.title}</span>
        </div>
        <span class="card-route">${r.path}</span>
      </div>
      <div class="media-container">
        <div class="preview-box box-desktop">
          <div class="preview-label">🖥️ Desktop Web (1440x960)</div>
          <div class="preview-img-wrap" onclick="openZoom('desktop/${r.id}_${r.name}.png')">
            <img src="desktop/${r.id}_${r.name}.png" alt="Desktop ${r.title}" loading="lazy" onerror="this.parentElement.innerHTML='<span style=\\'padding:40px;font-size:12px;color:#999;display:block;text-align:center;\\'>N/A for Mobile Drawer</span>'"/>
          </div>
        </div>
        <div class="preview-box box-mobile" style="max-width: 170px;">
          <div class="preview-label">📱 Mobile App</div>
          <div class="preview-img-wrap" onclick="openZoom('mobile/${r.id}_${r.name}.png')">
            <img src="mobile/${r.id}_${r.name}.png" alt="Mobile ${r.title}" loading="lazy" />
          </div>
        </div>
      </div>
    </div>`
      )
      .join("")}
  </div>

  <div id="zoomModal" class="modal" onclick="this.classList.remove('active')">
    <img id="zoomImg" src="" alt="Zoomed view" />
  </div>

  <script>
    function openZoom(src) {
      document.getElementById('zoomImg').src = src;
      document.getElementById('zoomModal').classList.add('active');
    }
    function filterView(type) {
      document.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
      event.target.classList.add('active');
      const deskBoxes = document.querySelectorAll('.box-desktop');
      const mobBoxes = document.querySelectorAll('.box-mobile');
      if (type === 'both') {
        deskBoxes.forEach(b => b.style.display = 'flex');
        mobBoxes.forEach(b => b.style.display = 'flex');
      } else if (type === 'desktop') {
        deskBoxes.forEach(b => b.style.display = 'flex');
        mobBoxes.forEach(b => b.style.display = 'none');
      } else if (type === 'mobile') {
        deskBoxes.forEach(b => b.style.display = 'none');
        mobBoxes.forEach(b => b.style.display = 'flex');
      }
    }
  </script>
</body>
</html>`;

  fs.writeFileSync(path.join(SCREENSHOTS_DIR, "index.html"), html, "utf8");
}

runScreenshotPipeline().catch((err) => {
  console.error("Fatal error during screenshot execution:", err);
  process.exit(1);
});

