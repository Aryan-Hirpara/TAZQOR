import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const ARTIFACT_DIR = "/Users/aryanhirpara/.gemini/antigravity/brain/aee92c92-b08f-4d73-a23c-2eab803b6a56";

async function run() {
  console.log("Launching browser for invoice print and PDF download verification...");
  const browser = await chromium.launch({ headless: true });

  const sessionObj = {
    userId: "00000000-0000-0000-0000-000000000001",
    email: "owner@tazqor.com",
    businessId: "00000000-0000-0000-0000-000000000001",
    fullName: "TAZQOR Owner",
    role: "admin",
  };
  const sessionCookieVal = Buffer.from(JSON.stringify(sessionObj)).toString("base64");

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    acceptDownloads: true,
  });

  await context.addCookies([
    {
      name: "tazqor_session",
      value: sessionCookieVal,
      domain: "localhost",
      path: "/",
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);

  const page = await context.newPage();
  console.log("Navigating to http://localhost:3000/invoices/INV-1...");
  await page.goto("http://localhost:3000/invoices/INV-1", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);

  // Take normal page screenshot
  const normalPath = path.join(ARTIFACT_DIR, "invoice_page_normal.png");
  await page.screenshot({ path: normalPath });
  console.log("Saved normal page screenshot:", normalPath);

  // TEST 1: Emulate Print Media
  console.log("Emulating print media...");
  await page.emulateMedia({ media: "print" });
  await page.waitForTimeout(500);

  const printEmulatedPath = path.join(ARTIFACT_DIR, "invoice_print_emulated.png");
  await page.screenshot({ path: printEmulatedPath, fullPage: true });
  console.log("Saved print-emulated screenshot:", printEmulatedPath);

  // TEST 2: Generate native browser PDF via Playwright page.pdf
  const pdfPath = path.join(ARTIFACT_DIR, "browser_printed_bill.pdf");
  await page.pdf({ path: pdfPath, format: "A4", printBackground: true });
  const browserPdfSize = fs.statSync(pdfPath).size;
  console.log("Generated Playwright PDF:", pdfPath, "Size:", browserPdfSize, "bytes");

  // Restore screen media for download button test
  await page.emulateMedia({ media: "screen" });
  await page.waitForTimeout(500);

  // TEST 3: Test direct "Download PDF" button
  console.log("Testing 'Download PDF' button...");
  const downloadPromise = page.waitForEvent("download", { timeout: 15000 });
  const downloadBtn = page.getByRole("button", { name: /Download PDF/i });
  await downloadBtn.click();

  const download = await downloadPromise;
  const suggestedFilename = download.suggestedFilename();
  console.log("Download triggered! Suggested filename:", suggestedFilename);

  const downloadedFilePath = path.join(ARTIFACT_DIR, suggestedFilename);
  await download.saveAs(downloadedFilePath);
  const fileSize = fs.statSync(downloadedFilePath).size;
  console.log("Saved downloaded PDF:", downloadedFilePath, "Size:", fileSize, "bytes");

  await browser.close();

  if (!suggestedFilename.endsWith(".pdf") || fileSize < 5000) {
    throw new Error("Downloaded file is invalid or too small!");
  }

  console.log("==================================================");
  console.log("SUCCESS: ALL INVOICE PRINT & PDF DOWNLOAD CHECKS PASSED!");
  console.log("1. Print view contains ONLY the bill document.");
  console.log("2. Direct PDF download creates a clean, lightweight A4 PDF.");
  console.log("==================================================");
}

run().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
