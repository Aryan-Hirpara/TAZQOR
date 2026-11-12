import { describe, it, expect } from "vitest";
import {
  buildBaseProductSku,
  buildVariantSku,
  buildVariantSkusForProduct,
  deriveProductCode,
  deriveScentCode,
  deriveSizeCode,
  extractBatchPrefix,
  formatBatchNumber,
  formatOrderNumber,
  formatYearMonthCode,
} from "@/lib/identifiers/codes";

describe("TAZQOR Standardized Identifiers", () => {
  describe("Product & Size & Scent Codecs", () => {
    it("maps standard TAZQOR product names to canonical product codes", () => {
      expect(deriveProductCode("Dish wash ( lemon )")).toBe("DW");
      expect(deriveProductCode("Liquid soap ( lavender )")).toBe("LS");
      expect(deriveProductCode("White Phenyl ( kapur )")).toBe("WP");
      expect(deriveProductCode("Floor Cleaner")).toBe("FC");
      expect(deriveProductCode("Toilet cleaner")).toBe("TC");
    });

    it("derives crisp acronyms for custom product names", () => {
      expect(deriveProductCode("Glass Cleaner")).toBe("GC");
      expect(deriveProductCode("Fabric Softener")).toBe("FS");
      expect(deriveProductCode("Surface Disinfectant")).toBe("SD");
      expect(deriveProductCode("Home Starter Bundle", { isCombo: true })).toBe("HSB");
    });

    it("normalizes pack sizes into compact codes", () => {
      expect(deriveSizeCode("250ml")).toBe("250M");
      expect(deriveSizeCode("250 ml")).toBe("250M");
      expect(deriveSizeCode("500 ml")).toBe("500M");
      expect(deriveSizeCode("1L")).toBe("1L");
      expect(deriveSizeCode("1 L")).toBe("1L");
      expect(deriveSizeCode("5 Litre")).toBe("5L");
      expect(deriveSizeCode("500g")).toBe("500G");
      expect(deriveSizeCode("1 kg")).toBe("1KG");
    });

    it("builds standard permanent TQR-[PROD]-[SIZE] SKUs", () => {
      expect(buildBaseProductSku("Dish wash ( lemon )")).toBe("TQR-DW");
      expect(buildVariantSku({ productName: "Dish wash ( lemon )", packSize: "250ml" })).toBe("TQR-DW-250M");
      expect(buildVariantSku({ productName: "Liquid soap ( lavender )", packSize: "250 ml" })).toBe("TQR-LS-250M");
      expect(buildVariantSku({ productName: "White Phenyl ( kapur )", packSize: "1 L" })).toBe("TQR-WP-1L");
      expect(buildVariantSku({ productName: "Floor Cleaner", packSize: "1L" })).toBe("TQR-FC-1L");
      expect(buildVariantSku({ productName: "Toilet cleaner", packSize: "500ml" })).toBe("TQR-TC-500M");
    });

    it("includes [SCENT] when variants share a size or collide with existing SKUs", () => {
      const skus = buildVariantSkusForProduct({
        productName: "Dish wash",
        variants: [
          { pack_size: "250ml", name: "Lemon" },
          { pack_size: "250ml", name: "Green Apple" },
          { pack_size: "500ml", name: "500ml" },
        ],
      });
      expect(skus).toEqual(["TQR-DW-LEM-250M", "TQR-DW-GAP-250M", "TQR-DW-500M"]);

      const catalogCollision = buildVariantSkusForProduct({
        productName: "Dish wash ( orange )",
        variants: [{ pack_size: "250ml", name: "250ml" }],
        existingCatalogSkus: new Set(["TQR-DW-250M"]),
      });
      expect(catalogCollision).toEqual(["TQR-DW-ORA-250M"]);
      expect(deriveScentCode("Rose")).toBe("ROS");
    });
  });

  describe("Stock Batch Number Formatting", () => {
    it("formats YYMM from YYYY-MM-DD dates and formats STK-[PROD]-[SIZE]-[YYMM]-[XX]", () => {
      const ym = formatYearMonthCode("2026-11-12");
      expect(ym).toBe("2611");

      const prefixFromCanonical = extractBatchPrefix({
        variantSku: "TQR-DW-250M",
        productName: "Dish wash ( lemon )",
        packSize: "250ml",
      });
      expect(prefixFromCanonical).toBe("DW-250M");
      expect(formatBatchNumber({ prefix: prefixFromCanonical, yearMonth: ym, sequence: 1 })).toBe("STK-DW-250M-2611-01");
      expect(formatBatchNumber({ prefix: prefixFromCanonical, yearMonth: ym, sequence: 12 })).toBe("STK-DW-250M-2611-12");
    });

    it("derives clean STK-[PROD]-[SIZE] even for historical TQR-00x legacy variants", () => {
      const prefixFromLegacy = extractBatchPrefix({
        variantSku: "TQR-001-250ml",
        productName: "Dish wash ( lemon )",
        packSize: "250ml",
      });
      expect(prefixFromLegacy).toBe("DW-250M");
      expect(formatBatchNumber({ prefix: prefixFromLegacy, yearMonth: "2611", sequence: 1 })).toBe("STK-DW-250M-2611-01");
    });

    it("resets sequence naturally across month boundaries", () => {
      const nov = formatYearMonthCode("2026-11-30");
      const dec = formatYearMonthCode("2026-12-01");
      expect(formatBatchNumber({ prefix: "TC-500M", yearMonth: nov, sequence: 5 })).toBe("STK-TC-500M-2611-05");
      expect(formatBatchNumber({ prefix: "TC-500M", yearMonth: dec, sequence: 1 })).toBe("STK-TC-500M-2612-01");
    });
  });

  describe("Customer Order Number Formatting", () => {
    it("formats ORD-[YYMM]-[XXXX] with 4-digit zero padding", () => {
      expect(formatOrderNumber("2611", 1)).toBe("ORD-2611-0001");
      expect(formatOrderNumber("2611", 42)).toBe("ORD-2611-0042");
      expect(formatOrderNumber("2612", 1)).toBe("ORD-2612-0001");
    });
  });
});

