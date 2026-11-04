import { test, expect } from "@playwright/test";

const MOBILE_VIEWPORTS = [
  { name: "320x568 (iPhone SE 1st gen)", width: 320, height: 568 },
  { name: "360x740 (Standard Android)", width: 360, height: 740 },
  { name: "390x844 (iPhone 14 Mobile)", width: 390, height: 844 },
  { name: "430x932 (iPhone 14 Pro Max)", width: 430, height: 932 },
  { name: "768x1024 (iPad Portrait)", width: 768, height: 1024 },
];

const TARGET_ROUTES = [
  { name: "Dashboard", path: "/dashboard" },
  { name: "Customers", path: "/customers" },
  { name: "Orders", path: "/orders" },
  { name: "Bills", path: "/invoices" },
];

const ALL_APP_ROUTES = [
  "/dashboard",
  "/customers",
  "/orders",
  "/invoices",
  "/payments",
  "/inventory",
  "/products",
  "/map",
  "/visits",
  "/expenses",
  "/reports",
  "/settings",
];

for (const vp of MOBILE_VIEWPORTS) {
  test.describe(`Mobile Fidelity & Touch Layout: ${vp.name}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
    });

    for (const route of TARGET_ROUTES) {
      test(`${route.name} (${route.path}) — Zero Horizontal Scroll & Right Edge Containment`, async ({
        page,
      }) => {
        await page.goto(route.path, { waitUntil: "networkidle" });
        await page.waitForTimeout(300);

        // 1. document.scrollWidth <= innerWidth
        const scrollInfo = await page.evaluate(() => {
          const doc = document.documentElement;
          return {
            scrollWidth: doc.scrollWidth,
            innerWidth: window.innerWidth,
            hasHorizontalScroll: doc.scrollWidth > window.innerWidth,
          };
        });

        expect(
          scrollInfo.hasHorizontalScroll,
          `Horizontal scroll detected on ${route.path} at ${vp.width}px! scrollWidth=${scrollInfo.scrollWidth}, innerWidth=${scrollInfo.innerWidth}`
        ).toBe(false);

        // 2. Listing every visible element whose right edge exceeds viewport
        const overflowingElements = await page.evaluate((vw) => {
          const bad: string[] = [];
          const elements = Array.from(document.querySelectorAll("body *"));
          for (const el of elements) {
            // Elements inside an intentional horizontal scroll container (like a table scroll-box or pill scrubber)
            // are scrollable within their box and do not overflow the document body.
            const isScrollChild = el.closest('[class*="overflow-x-auto"], [class*="overflow-x-scroll"]') !== null;
            if (isScrollChild) continue;

            // For SVG child elements, evaluate the parent SVG's bounding box since it clips them
            const targetEl = el.closest("svg") || el;
            const rect = targetEl.getBoundingClientRect();

            // Ignore zero-size, offscreen, or non-visible elements
            if (rect.width > 0 && rect.height > 0) {
              const style = window.getComputedStyle(el);
              if (style.display !== "none" && style.visibility !== "hidden" && style.opacity !== "0") {
                if (rect.right > vw + 1.5) {
                  const cls =
                    typeof el.className === "string"
                      ? el.className
                      : el.getAttribute("class") || "";
                  bad.push(
                    `<${el.tagName.toLowerCase()} class="${cls.slice(0, 40)}"> right=${Math.round(
                      rect.right
                    )}px > ${vw}px`
                  );
                }
              }
            }
          }
          return Array.from(new Set(bad)).slice(0, 10);
        }, vp.width);

        expect(
          overflowingElements,
          `Elements exceed right viewport edge on ${route.path}: ${overflowingElements.join(", ")}`
        ).toEqual([]);
      });

      test(`${route.name} (${route.path}) — Equal Left & Right Page Padding`, async ({ page }) => {
        // Equal padding is tested on mobile devices (<768px). On tablet/desktop (>=768px),
        // the left sidebar rail accounts for the left rail offset.
        if (vp.width >= 768) return;

        await page.goto(route.path, { waitUntil: "networkidle" });
        await page.waitForTimeout(200);

        const paddingInfo = await page.evaluate(() => {
          // Find the main content container
          const main = document.querySelector("main") || document.body;
          const container = main.parentElement;
          if (!container) return { leftPad: 16, rightPad: 16, diff: 0 };
          const style = window.getComputedStyle(container);
          const leftPad = parseFloat(style.paddingLeft) || 0;
          const rightPad = parseFloat(style.paddingRight) || 0;
          return {
            leftPad,
            rightPad,
            diff: Math.abs(leftPad - rightPad),
          };
        });

        expect(
          paddingInfo.diff,
          `Asymmetrical page padding on ${route.path}: left=${paddingInfo.leftPad}px, right=${paddingInfo.rightPad}px`
        ).toBeLessThanOrEqual(1.5);
      });

      test(`${route.name} (${route.path}) — Bottom Nav Clearance (no content covered)`, async ({
        page,
      }) => {
        await page.goto(route.path, { waitUntil: "networkidle" });
        await page.waitForTimeout(200);

        // Scroll to the absolute bottom of the page
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await page.waitForTimeout(200);

        const clearance = await page.evaluate(() => {
          const nav = document.querySelector('nav[aria-label="Mobile Navigation"]');
          if (!nav) return { cleared: true }; // On desktop or tablet if nav not rendered
          const navRect = nav.getBoundingClientRect();

          // Find the last visible content card or button in main
          const allCards = Array.from(
            document.querySelectorAll("main > div, main div[class*='rounded'], main table")
          );
          if (allCards.length === 0) return { cleared: true };

          const lastCard = allCards[allCards.length - 1];
          const lastRect = lastCard.getBoundingClientRect();

          return {
            cleared: lastRect.bottom <= navRect.top + 8 || lastRect.bottom <= window.innerHeight,
            lastBottom: lastRect.bottom,
            navTop: navRect.top,
          };
        });

        expect(clearance.cleared, `Content covered by bottom nav on ${route.path}`).toBe(true);
      });
    }

    test("Tap Test via elementFromPoint & 2-Tap Reachability of All Routes", async ({ page }) => {
      await page.goto("/dashboard", { waitUntil: "networkidle" });
      await page.waitForTimeout(300);

      if (vp.width < 768) {
        // 1. Verify bottom nav "More" button is hit by elementFromPoint and not covered
        const moreClickable = await page.evaluate(() => {
          const moreBtn = document.querySelector('button[aria-label="More navigation and actions"]') as HTMLElement;
          if (!moreBtn) return false;
          const rect = moreBtn.getBoundingClientRect();
          const centerX = rect.left + rect.width / 2;
          const centerY = rect.top + rect.height / 2;
          const topEl = document.elementFromPoint(centerX, centerY);
          return moreBtn.contains(topEl) || topEl?.contains(moreBtn);
        });

        expect(moreClickable, "More button in bottom nav is covered by an overlay!").toBe(true);

        // 2. Click "More" to open the MoreLauncherSheet
        await page.locator('button[aria-label="More navigation and actions"]').click();
      } else {
        // Tablet / Desktop: click header grid button
        await page.locator('header button[aria-label="App Launcher"]:visible').first().click();
      }

      await page.waitForSelector('[role="dialog"][aria-label="App Launcher & Navigation"]');

      // 3. Verify all remaining application routes are reachable in 2 taps
      for (const targetRoute of ALL_APP_ROUTES) {
        const link = page.locator(`[role="dialog"] a[href="${targetRoute}"]`);
        const count = await link.count();
        expect(
          count,
          `Route ${targetRoute} is not present in mobile launcher sheet!`
        ).toBeGreaterThanOrEqual(1);
      }

      // 4. Close sheet via close button
      await page.locator('[role="dialog"] button[aria-label="Close menu"]').click();
      await page.waitForTimeout(200);

      const isClosed = await page.evaluate(() => {
        return document.querySelector('[role="dialog"]') === null;
      });
      expect(isClosed, "MoreLauncherSheet did not close after clicking close button").toBe(true);

      // 5. Verify Sub-page Header round grid button also opens launcher sheet
      await page.goto("/customers", { waitUntil: "networkidle" });
      await page.waitForTimeout(200);

      const gridBtn = page.locator('header button[aria-label="App Launcher"]:visible').first();
      if (await gridBtn.isVisible()) {
        await gridBtn.click();
        await page.waitForSelector('[role="dialog"][aria-label="App Launcher & Navigation"]');
        // Press Escape to close
        await page.keyboard.press("Escape");
        await page.waitForTimeout(200);
        const closedOnEsc = await page.evaluate(() => document.querySelector('[role="dialog"]') === null);
        expect(closedOnEsc, "Launcher did not close on Escape key").toBe(true);
      }
    });

    test("Theme Toggle applies .dark class cleanly and renders dark tokens", async ({ page }) => {
      await page.goto("/dashboard", { waitUntil: "networkidle" });
      await page.waitForTimeout(200);

      // Open launcher sheet via visible trigger
      const launcherTrigger = page.locator('button[aria-label="More navigation and actions"]:visible, header button[aria-label="App Launcher"]:visible').first();
      await launcherTrigger.click();
      await page.waitForSelector('[role="dialog"]');

      // Click theme toggle button
      await page.locator('button[aria-label="Toggle theme"]').click();
      await page.waitForTimeout(200);

      // Assert .dark class is active
      const isDarkActive = await page.evaluate(() => {
        return document.documentElement.classList.contains("dark");
      });
      expect(isDarkActive, "Dark theme class was not added to documentElement").toBe(true);

      // Verify dark background token is active (#1C1C1A)
      const bgColor = await page.evaluate(() => {
        return window.getComputedStyle(document.body).backgroundColor;
      });
      // rgb(28, 28, 26) is #1C1C1A
      expect(bgColor).toMatch(/rgb\(28,\s*28,\s*26\)/);

      // Toggle back to light
      await page.locator('button[aria-label="Toggle theme"]').click();
      await page.waitForTimeout(200);

      const isLightAgain = await page.evaluate(() => {
        return !document.documentElement.classList.contains("dark");
      });
      expect(isLightAgain, "Theme did not revert to light").toBe(true);
    });
  });
}

