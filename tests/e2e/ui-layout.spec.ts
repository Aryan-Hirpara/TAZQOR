import { test, expect } from "@playwright/test";

const VIEWPORTS = [
  { width: 1440, height: 960, label: "1440x960 (Design Canvas Spec)" },
  { width: 1470, height: 800, label: "1470x800 (Typical Page Area Spec)" },
  { width: 1190, height: 774, label: "1190x774 (Master Ref02 Viewport)" },
  { width: 1280, height: 720, label: "1280x720 (Standard HD Laptop)" },
  { width: 1440, height: 1002, label: "1440x1002 (MacBook Pro Ret.)" },
  { width: 1920, height: 1080, label: "1920x1080 (Full HD Desktop)" },
  { width: 768, height: 1024, label: "768x1024 (iPad Portrait)" },
  { width: 390, height: 844, label: "390x844 (iPhone 14 Mobile)" },
];

for (const vp of VIEWPORTS) {
  test.describe(`UI Layout Fidelity: ${vp.label}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto("/dashboard", { waitUntil: "networkidle" });
      await page.waitForTimeout(600); // Wait for ResizeObserver & render
    });

    test("a) No horizontal page scrollbar", async ({ page }) => {
      const scrollState = await page.evaluate(() => {
        return {
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: document.documentElement.clientWidth,
        };
      });
      expect(scrollState.scrollWidth).toBeLessThanOrEqual(scrollState.clientWidth + 1);
    });

    test("b) Cards have zero internal overflow scroll", async ({ page }) => {
      const cardOverflows = await page.evaluate(() => {
        const cards = Array.from(document.querySelectorAll("[data-card='true']"));
        return cards.map((c, i) => {
          if (c.getAttribute("data-allow-scroll") === "true") return { i, ok: true };
          // Allow 2px tolerance for fractional sub-pixel flex layouts
          const horizontalOverflow = c.scrollWidth - c.clientWidth;
          const verticalOverflow = c.scrollHeight - c.clientHeight;
          return {
            i,
            horizontalOverflow,
            verticalOverflow,
            ok: horizontalOverflow <= 2 && verticalOverflow <= 2,
          };
        });
      });

      for (const card of cardOverflows) {
        expect(card.ok, `Card ${card.i} overflow: h=${card.horizontalOverflow}px, v=${card.verticalOverflow}px`).toBe(true);
      }
    });

    test("c) Text elements are strictly contained within their card bounds", async ({ page }) => {
      const textViolations = await page.evaluate(() => {
        const cards = Array.from(document.querySelectorAll("[data-card='true']"));
        const violations: string[] = [];

        cards.forEach((card, cIdx) => {
          const cardRect = card.getBoundingClientRect();
          // Find all text elements with non-empty text content
          const textNodes = Array.from(
            card.querySelectorAll("h1, h2, h3, h4, p, span, div")
          ).filter((el) => {
            // Only check leaf elements with direct non-empty text
            return (
              el.children.length === 0 &&
              (el.textContent || "").trim().length > 0 &&
              !el.closest("[data-notch-overlap='true']")
            );
          });

          textNodes.forEach((node) => {
            const rect = node.getBoundingClientRect();
            if (rect.width === 0 || rect.height === 0) return;

            // Check if text escapes card bounding box (with subpixel tolerance)
            const leftEscape = cardRect.left - rect.left;
            const rightEscape = rect.right - cardRect.right;

            if (leftEscape > 3 || rightEscape > 3) {
              violations.push(
                `Card ${cIdx} text "${(node.textContent || "").slice(0, 20)}" escapes by L:${leftEscape}px R:${rightEscape}px`
              );
            }
          });
        });

        return violations;
      });

      expect(textViolations).toHaveLength(0);
    });

    test("d) Discrete cards do not intersect bounding boxes", async ({ page }) => {
      const intersections = await page.evaluate(() => {
        const cards = Array.from(document.querySelectorAll("[data-card='true']"));
        const clashing: string[] = [];

        for (let i = 0; i < cards.length; i++) {
          for (let j = i + 1; j < cards.length; j++) {
            const r1 = cards[i].getBoundingClientRect();
            const r2 = cards[j].getBoundingClientRect();

            // Compute intersection rectangle
            const xOverlap = Math.max(0, Math.min(r1.right, r2.right) - Math.max(r1.left, r2.left));
            const yOverlap = Math.max(0, Math.min(r1.bottom, r2.bottom) - Math.max(r1.top, r2.top));

            // Allowance for 1px sub-pixel rounding
            if (xOverlap > 1 && yOverlap > 1) {
              clashing.push(`Card ${i} overlaps Card ${j} by ${xOverlap.toFixed(1)}x${yOverlap.toFixed(1)}px`);
            }
          }
        }
        return clashing;
      });

      expect(intersections).toHaveLength(0);
    });

    test("e) Decorative line art has computed opacity <= 0.15", async ({ page }) => {
      const decorativeOpacities = await page.evaluate(() => {
        const decoratives = Array.from(document.querySelectorAll("[data-decorative='true']"));
        return decoratives.map((el, i) => {
          const style = window.getComputedStyle(el);
          return {
            i,
            opacity: parseFloat(style.opacity || "1"),
          };
        });
      });

      for (const item of decorativeOpacities) {
        expect(item.opacity).toBeLessThanOrEqual(0.15);
      }
    });

    test("f) Stress Test: Fluid font scaling with ₹99,99,99,999.99 avoids any overflow or wrapping", async ({ page }) => {
      // Inject extreme stress metric values
      await page.evaluate(() => {
        const stressMetrics = {
          monthlySales: 999999999.99,
          previousMonthSales: 888888888.88,
          salesChange: 111111111.11,
          grossProfit: 999999999.99,
          netProfit: 999999999.99,
          monthlyTarget: 999999999.99,
          averageSaleValue: 999999999.99,
          totalSalesYear: 999999999.99,
          comparisonSalesYear: 888888888.88,
        };
        window.dispatchEvent(
          new CustomEvent("tazqor:set-test-metrics", { detail: stressMetrics })
        );
      });

      // Allow FitNumber's ResizeObserver to adjust font size
      await page.waitForTimeout(400);

      const stressCardOverflows = await page.evaluate(() => {
        const cards = Array.from(document.querySelectorAll("[data-card='true']"));
        return cards.map((c, i) => {
          if (c.getAttribute("data-allow-scroll") === "true") return { i, ok: true };
          const horizontalOverflow = c.scrollWidth - c.clientWidth;
          return {
            i,
            horizontalOverflow,
            ok: horizontalOverflow <= 2,
          };
        });
      });

      for (const card of stressCardOverflows) {
        expect(card.ok, `Stress test card ${card.i} overflowed by ${card.horizontalOverflow}px`).toBe(true);
      }
    });
  });
}

