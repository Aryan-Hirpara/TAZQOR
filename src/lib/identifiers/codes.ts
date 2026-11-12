/**
 * Standardized human-readable identifier & code formatters for TAZQOR:
 *
 * 1. Product Variant SKU (permanent once created):
 *    - TQR-[PROD]-[SIZE]
 *    - TQR-[PROD]-[SCENT]-[SIZE] when multiple variants share a size
 *
 * 2. Stock Batch Number (resets monthly per variant):
 *    - STK-[PROD]-[SIZE]-[YYMM]-[XX]
 *
 * 3. Customer Order Number (resets monthly):
 *    - ORD-[YYMM]-[XXXX]
 */

const PRODUCT_CODE_RULES: Array<{ pattern: RegExp; code: string }> = [
  { pattern: /\bdish\s*wash(?:ing)?\b/i, code: "DW" },
  { pattern: /\bliquid\s*soap\b/i, code: "LS" },
  { pattern: /\bwhite\s*phenyl\b/i, code: "WP" },
  { pattern: /\bfloor\s*cleaner\b/i, code: "FC" },
  { pattern: /\btoilet\s*cleaner\b/i, code: "TC" },
  { pattern: /\bglass\s*cleaner\b/i, code: "GC" },
  { pattern: /\bhand\s*wash\b/i, code: "HW" },
  { pattern: /\bhand\s*sanitizer\b|\bsanitizer\b/i, code: "HS" },
  { pattern: /\bsurface\s*cleaner\b/i, code: "SC" },
  { pattern: /\bkitchen\s*cleaner\b/i, code: "KC" },
  { pattern: /\bliquid\s*detergent\b/i, code: "LD" },
  { pattern: /\bdetergent\b/i, code: "DT" },
  { pattern: /\bphenyl\b/i, code: "PH" },
  { pattern: /\bbleach\b/i, code: "BL" },
];

const SCENT_CODE_ALIASES: Record<string, string> = {
  lemon: "LEM",
  lavender: "LAV",
  kapur: "KAP",
  camphor: "KAP",
  rose: "ROS",
  pine: "PIN",
  neem: "NEM",
  orange: "ORA",
  lime: "LIM",
  jasmine: "JAS",
  mogra: "MOG",
  mint: "MNT",
  apple: "APL",
  greenapple: "GAP",
  sandal: "SND",
  sandalwood: "SND",
  floral: "FLR",
  fresh: "FRS",
  citrus: "CIT",
  original: "ORG",
  regular: "REG",
  classic: "CLS",
};

const STOP_WORDS = new Set([
  "the",
  "and",
  "with",
  "for",
  "of",
  "pack",
  "combo",
  "items",
  "item",
  "bottle",
  "refill",
]);

function cleanAlphaNumUpper(value: string): string {
  return value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
}

/**
 * Strips parenthetical descriptors such as "( lemon )" or "( kapur )"
 * from a product name and returns both the base product name and the descriptor.
 */
export function splitProductNameAndDescriptor(rawName: string): {
  baseName: string;
  descriptor: string;
} {
  const trimmed = (rawName || "").trim();
  const parenMatches: string[] = [];
  const baseName = trimmed
    .replace(/\(([^)]+)\)/g, (_m, inner: string) => {
      const cleaned = inner.trim();
      if (cleaned) parenMatches.push(cleaned);
      return " ";
    })
    .replace(/\s+/g, " ")
    .trim();

  return {
    baseName: baseName || trimmed,
    descriptor: parenMatches.join(" ").trim(),
  };
}

/**
 * Derives a compact uppercase product code:
 * - Standard mappings first (`Dish wash` -> `DW`, `Liquid soap` -> `LS`, `White Phenyl` -> `WP`, `Floor Cleaner` -> `FC`, `Toilet cleaner` -> `TC`)
 * - Multi-word fallback uses crisp word initials (2-4 chars)
 * - Single-word fallback uses up to 3 uppercase letters
 */
export function deriveProductCode(
  productName: string,
  options?: { isCombo?: boolean }
): string {
  const { baseName } = splitProductNameAndDescriptor(productName);
  const candidate = baseName || productName || "";

  for (const rule of PRODUCT_CODE_RULES) {
    if (rule.pattern.test(candidate)) {
      return rule.code;
    }
  }

  const tokens = candidate
    .replace(/[^a-zA-Z0-9\s-]/g, " ")
    .split(/[\s-]+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 0 && !STOP_WORDS.has(t.toLowerCase()));

  if (options?.isCombo) {
    if (tokens.length >= 2) {
      return tokens
        .map((t) => cleanAlphaNumUpper(t).slice(0, 1))
        .join("")
        .slice(0, 4) || "CMB";
    }
    if (tokens.length === 1) {
      const code = cleanAlphaNumUpper(tokens[0]).slice(0, 3);
      return code || "CMB";
    }
    return "CMB";
  }

  if (tokens.length >= 2) {
    const initials = tokens
      .map((t) => cleanAlphaNumUpper(t).slice(0, 1))
      .join("")
      .slice(0, 4);
    if (initials.length >= 2) return initials;
  }

  if (tokens.length === 1) {
    const single = cleanAlphaNumUpper(tokens[0]).slice(0, 3);
    if (single) return single;
  }

  const fallback = cleanAlphaNumUpper(candidate).slice(0, 3);
  return fallback || "PRD";
}

/**
 * Normalizes a pack size string into compact uppercase SKU segment:
 * - `250ml` / `250 ml` -> `250M`
 * - `500ml` -> `500M`
 * - `1L` / `1 L` / `1 Litre` -> `1L`
 * - `5L` -> `5L`
 * - `500g` / `500 gm` -> `500G`
 * - `1 kg` -> `1KG`
 */
export function deriveSizeCode(packSize: string): string {
  const raw = (packSize || "").trim();
  if (!raw) return "STD";

  const qtyUnit = raw.match(
    /(\d+(?:\.\d+)?)\s*(ml|l|ltr|litre|litres|liter|liters|kg|gm|gms|g|pcs|pc|pack|pk|units|unit)\b/i
  );

  if (qtyUnit) {
    const num = qtyUnit[1].replace(/\.0+$/, "");
    const unitRaw = qtyUnit[2].toLowerCase();
    if (unitRaw === "ml") return `${num}M`;
    if (["l", "ltr", "litre", "litres", "liter", "liters"].includes(unitRaw)) {
      return `${num}L`;
    }
    if (unitRaw === "kg") return `${num}KG`;
    if (["g", "gm", "gms"].includes(unitRaw)) return `${num}G`;
    if (["pc", "pcs", "pack", "pk", "unit", "units"].includes(unitRaw)) {
      return `${num}P`;
    }
  }

  const normalized = cleanAlphaNumUpper(raw).slice(0, 6);
  return normalized || "STD";
}

/**
 * Derives a compact 3-char uppercase scent/variant differentiator when
 * multiple variants share the same product + pack size.
 */
export function deriveScentCode(scentOrName: string): string {
  const raw = (scentOrName || "").trim();
  if (!raw) return "";

  const compact = raw.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (SCENT_CODE_ALIASES[compact]) {
    return SCENT_CODE_ALIASES[compact];
  }

  const words = raw
    .replace(/[^a-zA-Z0-9\s]/g, " ")
    .split(/\s+/)
    .map((w) => w.trim())
    .filter(Boolean);

  for (const w of words) {
    const lw = w.toLowerCase();
    if (SCENT_CODE_ALIASES[lw]) {
      return SCENT_CODE_ALIASES[lw];
    }
  }

  if (words.length >= 2) {
    const combo = `${cleanAlphaNumUpper(words[0]).slice(0, 2)}${cleanAlphaNumUpper(words[1]).slice(0, 1)}`;
    if (combo) return combo.slice(0, 3);
  }

  return cleanAlphaNumUpper(raw).slice(0, 3);
}

/**
 * Builds the default product-level prefix (`TQR-[PROD]`).
 */
export function buildBaseProductSku(
  productName: string,
  options?: { isCombo?: boolean }
): string {
  const prodCode = deriveProductCode(productName, options);
  return `TQR-${prodCode}`;
}

/**
 * Builds a permanent Variant SKU:
 * - Default: `TQR-[PROD]-[SIZE]`
 * - When `includeScent` is true (e.g. shared-size variants) and a non-empty scent/variant name is available:
 *   `TQR-[PROD]-[SCENT]-[SIZE]`
 */
export function buildVariantSku(input: {
  productName: string;
  packSize: string;
  scent?: string;
  isCombo?: boolean;
  includeScent?: boolean;
}): string {
  const prodCode = deriveProductCode(input.productName, {
    isCombo: input.isCombo,
  });
  const sizeCode = deriveSizeCode(input.packSize);

  if (input.isCombo) {
    return `TQR-${prodCode}-CMB-${sizeCode}`;
  }

  const { descriptor } = splitProductNameAndDescriptor(input.productName);
  const rawScent = (input.scent || descriptor || "").trim();
  const scentCode = input.includeScent ? deriveScentCode(rawScent) : "";

  if (scentCode && scentCode !== sizeCode && scentCode !== prodCode) {
    return `TQR-${prodCode}-${scentCode}-${sizeCode}`;
  }

  return `TQR-${prodCode}-${sizeCode}`;
}

/**
 * Assigns collision-free SKUs for a set of variants on the same product,
 * automatically promoting shared-size variants to `TQR-[PROD]-[SCENT]-[SIZE]`.
 */
export function buildVariantSkusForProduct(input: {
  productName: string;
  isCombo?: boolean;
  variants: Array<{ pack_size: string; name?: string; scent?: string }>;
  existingCatalogSkus?: Set<string>;
}): string[] {
  const { descriptor } = splitProductNameAndDescriptor(input.productName);
  const existing = new Set<string>(
    Array.from(input.existingCatalogSkus || []).map((s) => s.trim().toUpperCase())
  );

  // Detect sizes that appear more than once within this product
  const sizeCounts = new Map<string, number>();
  for (const v of input.variants) {
    const sizeCode = deriveSizeCode(v.pack_size);
    sizeCounts.set(sizeCode, (sizeCounts.get(sizeCode) || 0) + 1);
  }

  const used = new Set<string>(existing);
  const results: string[] = [];

  for (let i = 0; i < input.variants.length; i++) {
    const v = input.variants[i];
    const sizeCode = deriveSizeCode(v.pack_size);
    const sharedSizeInProduct = (sizeCounts.get(sizeCode) || 0) > 1;
    const inferredScent =
      v.scent?.trim() ||
      (v.name && v.name.trim().toLowerCase() !== v.pack_size.trim().toLowerCase()
        ? v.name.trim()
        : "") ||
      descriptor;

    const baseSku = buildVariantSku({
      productName: input.productName,
      packSize: v.pack_size,
      scent: inferredScent,
      isCombo: input.isCombo,
      includeScent: false,
    });

    let candidate = baseSku;
    if ((sharedSizeInProduct || used.has(candidate.toUpperCase())) && inferredScent) {
      candidate = buildVariantSku({
        productName: input.productName,
        packSize: v.pack_size,
        scent: inferredScent,
        isCombo: input.isCombo,
        includeScent: true,
      });
    }

    if (used.has(candidate.toUpperCase())) {
      let suffixNum = 2;
      while (used.has(`${candidate}-V${suffixNum}`.toUpperCase())) {
        suffixNum++;
      }
      candidate = `${candidate}-V${suffixNum}`;
    }

    used.add(candidate.toUpperCase());
    results.push(candidate);
  }

  return results;
}

/**
 * Formats a date string or Date into `YYMM` (e.g. `2026-11-12` -> `2611`).
 * Defaults to current date in `Asia/Kolkata` timezone when omitted.
 */
export function formatYearMonthCode(dateInput?: string | Date | null): string {
  if (typeof dateInput === "string" && /^\d{4}-\d{2}-\d{2}/.test(dateInput.trim())) {
    const trimmed = dateInput.trim();
    const yy = trimmed.slice(2, 4);
    const mm = trimmed.slice(5, 7);
    return `${yy}${mm}`;
  }

  if (dateInput instanceof Date && !Number.isNaN(dateInput.getTime())) {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
    }).formatToParts(dateInput);
    const year = parts.find((p) => p.type === "year")?.value || "2026";
    const month = parts.find((p) => p.type === "month")?.value || "01";
    return `${year.slice(-2)}${month}`;
  }

  const nowParts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(new Date());
  const year = nowParts.find((p) => p.type === "year")?.value || "2026";
  const month = nowParts.find((p) => p.type === "month")?.value || "01";
  return `${year.slice(-2)}${month}`;
}

/**
 * Extracts `[PROD]-[SIZE]` (or `[PROD]-[SCENT]-[SIZE]`) prefix used by
 * `STK-[PREFIX]-[YYMM]-[XX]`.
 *
 * - If the variant already carries a canonical SKU (`TQR-DW-250M`, `TQR-DW-LEM-250M`),
 *   strips the `TQR-` namespace cleanly (`DW-250M`, `DW-LEM-250M`).
 * - If the variant has a legacy numeric SKU (`TQR-001-250ml`), derives `[PROD]-[SIZE]`
 *   from `productName` and `packSize` so newly received batches still match `STK-DW-250M-2611-01`.
 */
export function extractBatchPrefix(input: {
  variantSku?: string | null;
  productName?: string | null;
  packSize?: string | null;
}): string {
  const cleanSku = (input.variantSku || "")
    .trim()
    .toUpperCase()
    .replace(/~ARC-\d+$/, "");

  const isLegacyNumericSku = /^TQR-\d+(?:-|$)/.test(cleanSku);

  if (cleanSku && !isLegacyNumericSku) {
    const stripped = cleanSku.replace(/^TQR-/, "");
    const parts = stripped.split("-").filter(Boolean);
    if (parts.length >= 2) {
      const normalizedParts = parts.map((part, idx) =>
        idx === parts.length - 1 ? deriveSizeCode(part) : part.replace(/[^A-Z0-9]/g, "")
      );
      const joined = normalizedParts.filter(Boolean).join("-");
      if (joined) return joined;
    }
  }

  const prodCode = deriveProductCode(input.productName || "Product");
  const sizeCode = deriveSizeCode(input.packSize || "STD");
  return `${prodCode}-${sizeCode}`;
}

/**
 * Formats a Stock Batch Number: `STK-[PROD]-[SIZE]-[YYMM]-[XX]`.
 */
export function formatBatchNumber(input: {
  prefix: string;
  yearMonth: string;
  sequence: number;
}): string {
  const seqStr = String(Math.max(1, Math.floor(input.sequence))).padStart(2, "0");
  return `STK-${input.prefix}-${input.yearMonth}-${seqStr}`;
}

/**
 * Formats a Customer Order Number: `ORD-[YYMM]-[XXXX]`.
 */
export function formatOrderNumber(yearMonth: string, sequence: number): string {
  const seqStr = String(Math.max(1, Math.floor(sequence))).padStart(4, "0");
  return `ORD-${yearMonth}-${seqStr}`;
}

