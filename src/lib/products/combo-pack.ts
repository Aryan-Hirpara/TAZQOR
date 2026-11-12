export const COMBO_PACK_CATEGORY_NAME = "Combo Pack";
export const COMBO_PACK_CATEGORY_DESCRIPTION =
  "Permanent category for multi-product combo bundles";
export const COMBO_RECIPE_PREFIX = "combo-recipe:v1:";

export interface ComboRecipeItem {
  variant_id: string;
  quantity: number;
}

export interface StockDeductionRequirement {
  invoiceItemId: string;
  targetVariantId: string;
  quantity: number;
  isComboComponent: boolean;
}

export function isComboPackCategoryName(name: string | null | undefined): boolean {
  return (name || "").trim().toLowerCase() === COMBO_PACK_CATEGORY_NAME.toLowerCase();
}

export interface ComboSlotInput {
  variantId: string;
  productName: string;
  packSize: string;
  costPrice: number;
  currentStock: number;
  quantity: number;
}

export interface ComboCalculationResult {
  packSizeLabel: string;
  componentsSummary: string;
  totalCostPrice: number;
  maxBuildableCombos: number | null;
}

interface ParsedMeasure {
  dimension: "volume" | "mass";
  baseValue: number; // ml for volume, g for mass
}

function parsePackMeasure(raw: string): ParsedMeasure | null {
  const s = (raw || "").trim().toLowerCase();
  const match = s.match(/^(\d+(?:\.\d+)?)\s*(ml|l|ltr|litre|litres|liter|liters|g|gm|gms|gram|grams|kg|kgs)$/i);
  if (!match) return null;

  const num = Number(match[1]);
  const unit = match[2].toLowerCase();
  if (!Number.isFinite(num) || num <= 0) return null;

  if (unit === "ml") return { dimension: "volume", baseValue: num };
  if (["l", "ltr", "litre", "litres", "liter", "liters"].includes(unit)) {
    return { dimension: "volume", baseValue: num * 1000 };
  }
  if (["g", "gm", "gms", "gram", "grams"].includes(unit)) {
    return { dimension: "mass", baseValue: num };
  }
  if (["kg", "kgs"].includes(unit)) {
    return { dimension: "mass", baseValue: num * 1000 };
  }
  return null;
}

function formatTotalMeasure(dimension: "volume" | "mass", totalBase: number): string {
  const rounded = Number(totalBase.toFixed(2));
  if (dimension === "volume") {
    if (rounded >= 1000) {
      return `${Number((rounded / 1000).toFixed(2))} L`;
    }
    return `${rounded} ml`;
  }
  if (rounded >= 1000) {
    return `${Number((rounded / 1000).toFixed(2))} kg`;
  }
  return `${rounded} g`;
}

/**
 * Computes combo pack size label, component breakdown summary, total cost price,
 * and max buildable combo units from selected product variants.
 */
export function calculateComboPackSummary(
  items: ComboSlotInput[]
): ComboCalculationResult {
  const validItems = items.filter((it) => it.variantId && it.quantity > 0);
  if (validItems.length === 0) {
    return {
      packSizeLabel: "",
      componentsSummary: "",
      totalCostPrice: 0,
      maxBuildableCombos: null,
    };
  }

  const totalCostPrice = Number(
    validItems
      .reduce((sum, it) => sum + (Number(it.costPrice) || 0) * it.quantity, 0)
      .toFixed(2)
  );

  const totalUnitsCount = validItems.reduce((sum, it) => sum + it.quantity, 0);

  // Aggregate usage per variant to compute accurate max buildable combo count
  const variantNeeds = new Map<string, { needed: number; stock: number }>();
  for (const it of validItems) {
    const prev = variantNeeds.get(it.variantId);
    if (prev) {
      prev.needed += it.quantity;
    } else {
      variantNeeds.set(it.variantId, {
        needed: it.quantity,
        stock: Math.max(0, Number(it.currentStock) || 0),
      });
    }
  }
  let maxBuildable = Infinity;
  for (const { needed, stock } of variantNeeds.values()) {
    maxBuildable = Math.min(maxBuildable, Math.floor(stock / needed));
  }

  const componentsSummary = validItems
    .map((it) => {
      const sizeText = it.packSize ? ` (${it.packSize})` : "";
      return `${it.quantity}× ${it.productName}${sizeText}`;
    })
    .join(" + ");

  const sizeParts = validItems.map((it) => {
    const label = it.packSize || "1 unit";
    return it.quantity > 1 ? `${it.quantity}×${label}` : label;
  });

  // Check if all selected items share the same convertible physical dimension (all volume or all mass)
  const parsedMeasures = validItems.map((it) => ({
    measure: parsePackMeasure(it.packSize),
    qty: it.quantity,
  }));
  const firstDim = parsedMeasures[0]?.measure?.dimension;
  const allSameDimension =
    Boolean(firstDim) &&
    parsedMeasures.every((p) => p.measure !== null && p.measure.dimension === firstDim);

  let packSizeLabel: string;
  if (allSameDimension && firstDim) {
    const totalBase = parsedMeasures.reduce(
      (sum, p) => sum + (p.measure?.baseValue || 0) * p.qty,
      0
    );
    packSizeLabel = `${formatTotalMeasure(firstDim, totalBase)} (${totalUnitsCount} items)`;
  } else {
    const joined = sizeParts.join(" + ");
    packSizeLabel =
      joined.length <= 42
        ? `${totalUnitsCount} items (${joined})`
        : `Combo Pack (${totalUnitsCount} items)`;
  }

  return {
    packSizeLabel,
    componentsSummary,
    totalCostPrice,
    maxBuildableCombos: Number.isFinite(maxBuildable) ? maxBuildable : 0,
  };
}

/**
 * Aggregates duplicate component variant IDs and serializes a combo recipe string
 * for persistence alongside relational combo_pack_items rows.
 */
export function encodeComboRecipe(items: ComboRecipeItem[]): string {
  const merged = new Map<string, number>();
  for (const item of items) {
    const vid = (item.variant_id || "").trim();
    const qty = Math.max(0, Math.floor(Number(item.quantity) || 0));
    if (!vid || qty <= 0) continue;
    merged.set(vid, (merged.get(vid) || 0) + qty);
  }
  const normalized: ComboRecipeItem[] = Array.from(merged.entries()).map(
    ([variant_id, quantity]) => ({ variant_id, quantity })
  );
  return `${COMBO_RECIPE_PREFIX}${JSON.stringify(normalized)}`;
}

/**
 * Parses a stored combo recipe string back into validated component items.
 */
export function parseComboRecipe(raw: string | null | undefined): ComboRecipeItem[] | null {
  if (!raw || !raw.startsWith(COMBO_RECIPE_PREFIX)) return null;
  try {
    const parsed = JSON.parse(raw.slice(COMBO_RECIPE_PREFIX.length));
    if (!Array.isArray(parsed)) return null;
    const valid: ComboRecipeItem[] = [];
    for (const row of parsed) {
      if (
        row &&
        typeof row.variant_id === "string" &&
        row.variant_id.trim() !== "" &&
        Number.isFinite(Number(row.quantity)) &&
        Number(row.quantity) > 0
      ) {
        valid.push({
          variant_id: row.variant_id.trim(),
          quantity: Math.floor(Number(row.quantity)),
        });
      }
    }
    return valid.length > 0 ? valid : null;
  } catch {
    return null;
  }
}

/**
 * Dynamically derives how many complete combo packs can be built from live component stock.
 */
export function computeComboAvailableStock(
  recipe: ComboRecipeItem[],
  getVariantStock: (variantId: string) => number
): number {
  if (!recipe || recipe.length === 0) return 0;
  let minBuildable = Infinity;
  for (const comp of recipe) {
    const qtyPerCombo = Math.max(1, Number(comp.quantity) || 1);
    const available = Math.max(0, Number(getVariantStock(comp.variant_id)) || 0);
    minBuildable = Math.min(minBuildable, Math.floor(available / qtyPerCombo));
  }
  return Number.isFinite(minBuildable) ? minBuildable : 0;
}

/**
 * Expands invoice lines (single items or combo packs) into concrete inventory variant deductions.
 */
export function expandComboStockDeductions(
  lines: Array<{ itemId: string; variantId: string; quantity: number }>,
  recipeByVariantId: Map<string, ComboRecipeItem[]>
): StockDeductionRequirement[] {
  const result: StockDeductionRequirement[] = [];
  for (const line of lines) {
    const lineQty = Math.max(0, Number(line.quantity) || 0);
    if (lineQty <= 0) continue;

    const recipe = recipeByVariantId.get(line.variantId);
    if (recipe && recipe.length > 0) {
      for (const comp of recipe) {
        result.push({
          invoiceItemId: line.itemId,
          targetVariantId: comp.variant_id,
          quantity: Number((lineQty * comp.quantity).toFixed(3)),
          isComboComponent: true,
        });
      }
    } else {
      result.push({
        invoiceItemId: line.itemId,
        targetVariantId: line.variantId,
        quantity: Number(lineQty.toFixed(3)),
        isComboComponent: false,
      });
    }
  }
  return result;
}

