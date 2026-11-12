import { describe, expect, it } from "vitest";
import {
  calculateComboPackSummary,
  COMBO_PACK_CATEGORY_NAME,
  computeComboAvailableStock,
  encodeComboRecipe,
  expandComboStockDeductions,
  isComboPackCategoryName,
  parseComboRecipe,
} from "@/lib/products/combo-pack";

describe("combo-pack helpers", () => {
  it("recognizes permanent Combo Pack category name case-insensitively", () => {
    expect(isComboPackCategoryName(COMBO_PACK_CATEGORY_NAME)).toBe(true);
    expect(isComboPackCategoryName("  combo pack ")).toBe(true);
    expect(isComboPackCategoryName("Dish Wash")).toBe(false);
    expect(isComboPackCategoryName(null)).toBe(false);
  });

  it("auto-calculates combined volume pack size, total cost price, and buildable stock", () => {
    const res = calculateComboPackSummary([
      {
        variantId: "v1",
        productName: "Dish Wash",
        packSize: "250ml",
        costPrice: 22.5,
        currentStock: 20,
        quantity: 1,
      },
      {
        variantId: "v2",
        productName: "Floor Cleaner",
        packSize: "1L",
        costPrice: 65,
        currentStock: 10,
        quantity: 1,
      },
      {
        variantId: "v3",
        productName: "Liquid Soap",
        packSize: "500 ml",
        costPrice: 40.25,
        currentStock: 15,
        quantity: 2,
      },
    ]);

    // 250 + 1000 + 2*500 = 2250 ml = 2.25 L across 4 items
    expect(res.packSizeLabel).toBe("2.25 L (4 items)");
    // 22.5 + 65 + 2*40.25 = 168
    expect(res.totalCostPrice).toBe(168);
    // 2x of v3 with stock 15 limits combos to floor(15/2) = 7
    expect(res.maxBuildableCombos).toBe(7);
    expect(res.componentsSummary).toContain("1× Dish Wash (250ml)");
    expect(res.componentsSummary).toContain("2× Liquid Soap (500 ml)");
  });

  it("handles mixed or non-metric pack sizes cleanly", () => {
    const res = calculateComboPackSummary([
      {
        variantId: "v1",
        productName: "Scrub Pad",
        packSize: "5 pcs",
        costPrice: 30,
        currentStock: 12,
        quantity: 1,
      },
      {
        variantId: "v2",
        productName: "Dish Wash",
        packSize: "500ml",
        costPrice: 45,
        currentStock: 8,
        quantity: 1,
      },
    ]);

    expect(res.packSizeLabel).toBe("2 items (5 pcs + 500ml)");
    expect(res.totalCostPrice).toBe(75);
    expect(res.maxBuildableCombos).toBe(8);
  });

  it("aggregates duplicate variant selections for max buildable stock", () => {
    const res = calculateComboPackSummary([
      {
        variantId: "v1",
        productName: "Dish Wash",
        packSize: "250ml",
        costPrice: 20,
        currentStock: 5,
        quantity: 1,
      },
      {
        variantId: "v1",
        productName: "Dish Wash",
        packSize: "250ml",
        costPrice: 20,
        currentStock: 5,
        quantity: 1,
      },
    ]);

    // 2 total needed from stock 5 => max 2 combos
    expect(res.maxBuildableCombos).toBe(2);
    expect(res.totalCostPrice).toBe(40);
  });

  it("encodes, parses, and computes live buildable stock from combo recipes", () => {
    const encoded = encodeComboRecipe([
      { variant_id: "v1", quantity: 1 },
      { variant_id: "v1", quantity: 1 },
      { variant_id: "v2", quantity: 1 },
      { variant_id: "v3", quantity: 2 },
      { variant_id: "v4", quantity: 1 },
    ]);

    const parsed = parseComboRecipe(encoded);
    expect(parsed).toEqual([
      { variant_id: "v1", quantity: 2 },
      { variant_id: "v2", quantity: 1 },
      { variant_id: "v3", quantity: 2 },
      { variant_id: "v4", quantity: 1 },
    ]);
    expect(parseComboRecipe("https://example.com/photo.png")).toBeNull();

    const stockMap: Record<string, number> = {
      v1: 11, // floor(11/2) = 5
      v2: 8,  // floor(8/1)  = 8
      v3: 9,  // floor(9/2)  = 4 <- bottleneck
      v4: 20, // floor(20/1) = 20
    };
    expect(computeComboAvailableStock(parsed!, (id) => stockMap[id] ?? 0)).toBe(4);
  });

  it("expands billed combo pack quantities into constituent component deductions", () => {
    const recipeMap = new Map([
      [
        "combo-1",
        [
          { variant_id: "v1", quantity: 1 },
          { variant_id: "v2", quantity: 1 },
          { variant_id: "v3", quantity: 2 },
          { variant_id: "v4", quantity: 1 },
        ],
      ],
    ]);

    const reqs = expandComboStockDeductions(
      [
        { itemId: "line-1", variantId: "combo-1", quantity: 3 },
        { itemId: "line-2", variantId: "v5", quantity: 2 },
      ],
      recipeMap
    );

    expect(reqs).toEqual([
      { invoiceItemId: "line-1", targetVariantId: "v1", quantity: 3, isComboComponent: true },
      { invoiceItemId: "line-1", targetVariantId: "v2", quantity: 3, isComboComponent: true },
      { invoiceItemId: "line-1", targetVariantId: "v3", quantity: 6, isComboComponent: true },
      { invoiceItemId: "line-1", targetVariantId: "v4", quantity: 3, isComboComponent: true },
      { invoiceItemId: "line-2", targetVariantId: "v5", quantity: 2, isComboComponent: false },
    ]);
  });
});

