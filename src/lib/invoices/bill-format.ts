export const DEFAULT_INVOICE_TERMS: readonly string[] = [
  "Unopened and unused products in original sealed packaging may be returned or replaced within 7 days of the invoice date.",
  "Products that are opened, unsealed, tampered with, or partially used will not be accepted for return, replacement, or refund.",
  "Original invoice copy and matching batch details must be presented at the time of any return or replacement request.",
  "Please verify item quantities and packaging upon delivery; any shortage or transit damage must be reported within 24 hours.",
  "All disputes, if any, are subject to Junagadh, Gujarat jurisdiction only.",
];

export interface RawCustomerAddressInput {
  name?: string | null;
  shop_name?: string | null;
  contact_person?: string | null;
  delivery_address?: string | null;
  billing_address?: string | null;
  city?: string | null;
  district?: string | null;
  state?: string | null;
  pin?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  customer_code?: string | null;
  gstin?: string | null;
  email?: string | null;
}

export interface FormattedBillCustomer {
  displayName: string;
  attnContact: string;
  streetLine: string;
  regionLine: string;
  phone: string;
  email: string;
  gstin: string;
}

function cleanSegment(val: string | null | undefined): string {
  return (val || "")
    .replace(/\s*,\s*/g, ", ")
    .replace(/\s+/g, " ")
    .replace(/^[,\s]+|[,\s]+$/g, "")
    .trim();
}

function toTitleCaseToken(token: string): string {
  if (!token) return "";
  if (/^\d+$/.test(token)) return token;
  if (/^[A-Z0-9&.-]{2,5}$/.test(token)) return token;
  return token.charAt(0).toUpperCase() + token.slice(1);
}

/**
 * Formats customer identity & address for bills without duplicating customer name or city/district.
 */
export function formatBillCustomerBlock(cust: RawCustomerAddressInput): FormattedBillCustomer {
  const shopName = cleanSegment(cust.shop_name);
  const personName = cleanSegment(cust.name);
  const contactPerson = cleanSegment(cust.contact_person);

  const displayName = shopName || personName || "Customer";

  // Show Attn only if a separate contact person exists and differs from the primary display name
  let attnContact = "";
  const candidateAttn = contactPerson || (shopName && personName ? personName : "");
  if (candidateAttn && candidateAttn.toLowerCase() !== displayName.toLowerCase()) {
    attnContact = candidateAttn;
  }

  const rawAddress = cleanSegment(cust.delivery_address) || cleanSegment(cust.billing_address);
  const city = cleanSegment(cust.city);
  const district = cleanSegment(cust.district);
  const state = cleanSegment(cust.state);
  const pin = cleanSegment(cust.pin);

  // Deduplicate city/district/state/pin tokens out of freeform address so locality isn't repeated 3x
  const regionCompareSet = new Set(
    [city, district, state, pin].filter(Boolean).map((s) => s.toLowerCase())
  );

  const rawTokens = rawAddress
    .split(",")
    .map((part) => cleanSegment(part))
    .filter(Boolean);

  const streetTokens: string[] = [];
  const seenStreet = new Set<string>();
  for (const token of rawTokens) {
    const key = token.toLowerCase();
    if (seenStreet.has(key)) continue;
    // Strip trailing/redundant city/district/state/pin tokens that will be shown cleanly on the region line
    if (regionCompareSet.has(key)) continue;
    seenStreet.add(key);
    streetTokens.push(toTitleCaseToken(token));
  }

  const streetLine = streetTokens.join(", ");

  const regionParts: string[] = [];
  const seenRegion = new Set<string>();
  for (const part of [city, district, state]) {
    if (!part) continue;
    const key = part.toLowerCase();
    if (seenRegion.has(key)) continue;
    seenRegion.add(key);
    regionParts.push(toTitleCaseToken(part));
  }

  let regionLine = regionParts.join(", ");
  if (pin) {
    regionLine = regionLine ? `${regionLine} - ${pin}` : pin;
  }

  return {
    displayName,
    attnContact,
    streetLine,
    regionLine,
    phone: cleanSegment(cust.phone || cust.whatsapp),
    email: cleanSegment(cust.email),
    gstin: cleanSegment(cust.gstin || cust.customer_code),
  };
}

/**
 * Formats business address into concise clean lines without trailing comma gaps.
 */
export function formatBusinessAddressLines(biz: {
  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  state?: string | null;
  pin?: string | null;
}): { streetLine: string; regionLine: string } {
  const streetParts = [cleanSegment(biz.address_line1), cleanSegment(biz.address_line2)].filter(Boolean);
  const regionParts: string[] = [];
  const seen = new Set<string>();
  for (const p of [cleanSegment(biz.city), cleanSegment(biz.state)]) {
    if (!p) continue;
    const key = p.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    regionParts.push(p);
  }
  const pin = cleanSegment(biz.pin);
  let regionLine = regionParts.join(", ");
  if (pin) regionLine = regionLine ? `${regionLine} - ${pin}` : pin;
  return {
    streetLine: streetParts.join(", "),
    regionLine,
  };
}

const ONES = [
  "",
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
  "Ten",
  "Eleven",
  "Twelve",
  "Thirteen",
  "Fourteen",
  "Fifteen",
  "Sixteen",
  "Seventeen",
  "Eighteen",
  "Nineteen",
];

const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

function twoDigitsToWords(n: number): string {
  if (n < 20) return ONES[n];
  const t = Math.floor(n / 10);
  const o = n % 10;
  return o > 0 ? `${TENS[t]} ${ONES[o]}` : TENS[t];
}

function threeDigitsToWords(n: number): string {
  const h = Math.floor(n / 100);
  const rest = n % 100;
  const parts: string[] = [];
  if (h > 0) parts.push(`${ONES[h]} Hundred`);
  if (rest > 0) parts.push(twoDigitsToWords(rest));
  return parts.join(" ");
}

function wholeNumberToIndianWords(num: number): string {
  if (num === 0) return "Zero";
  let rem = Math.floor(Math.abs(num));
  const parts: string[] = [];

  const crore = Math.floor(rem / 10_000_000);
  rem %= 10_000_000;
  if (crore > 0) parts.push(`${wholeNumberToIndianWords(crore)} Crore`);

  const lakh = Math.floor(rem / 100_000);
  rem %= 100_000;
  if (lakh > 0) parts.push(`${twoDigitsToWords(lakh)} Lakh`);

  const thousand = Math.floor(rem / 1_000);
  rem %= 1_000;
  if (thousand > 0) parts.push(`${twoDigitsToWords(thousand)} Thousand`);

  if (rem > 0) parts.push(threeDigitsToWords(rem));
  return parts.join(" ").trim();
}

/**
 * Converts a monetary amount into Indian Rupee words (e.g. "Indian Rupees Four Hundred Only").
 */
export function toIndianCurrencyWords(amount: number): string {
  const safe = Math.max(0, Number(amount) || 0);
  const rupees = Math.floor(safe);
  const paise = Math.round((safe - rupees) * 100);
  const adjustedRupees = paise >= 100 ? rupees + 1 : rupees;
  const adjustedPaise = paise >= 100 ? 0 : paise;

  const rupeeWords = wholeNumberToIndianWords(adjustedRupees);
  if (adjustedPaise > 0) {
    return `Indian Rupees ${rupeeWords} and ${twoDigitsToWords(adjustedPaise)} Paise Only`;
  }
  return `Indian Rupees ${rupeeWords} Only`;
}

/**
 * Normalizes a phone string into digits for WhatsApp wa.me deep linking (defaults 10-digit Indian numbers to +91).
 */
export function normalizeWhatsAppDigits(phone: string | null | undefined): string {
  const digits = (phone || "").replace(/\D/g, "");
  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 11 && digits.startsWith("0")) return `91${digits.slice(1)}`;
  return digits;
}

/**
 * Splits a comma-separated batch summary into crisp individual batch codes for wrapped display.
 */
export function splitBatchCodes(batchText: string | null | undefined): string[] {
  const raw = (batchText || "").trim();
  if (!raw || raw === "—") return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s && s !== "—");
}

const INDIAN_STATE_CODES: Record<string, string> = {
  "jammu and kashmir": "01",
  "jammu & kashmir": "01",
  "himachal pradesh": "02",
  "punjab": "03",
  "chandigarh": "04",
  "uttarakhand": "05",
  "haryana": "06",
  "delhi": "07",
  "nct of delhi": "07",
  "rajasthan": "08",
  "uttar pradesh": "09",
  "bihar": "10",
  "sikkim": "11",
  "arunachal pradesh": "12",
  "nagaland": "13",
  "manipur": "14",
  "mizoram": "15",
  "tripura": "16",
  "meghalaya": "17",
  "assam": "18",
  "west bengal": "19",
  "jharkhand": "20",
  "odisha": "21",
  "orissa": "21",
  "chhattisgarh": "22",
  "madhya pradesh": "23",
  "gujarat": "24",
  "dadra and nagar haveli and daman and diu": "26",
  "daman and diu": "26",
  "maharashtra": "27",
  "andhra pradesh": "37",
  "karnataka": "29",
  "goa": "30",
  "lakshadweep": "31",
  "kerala": "32",
  "tamil nadu": "33",
  "puducherry": "34",
  "pondicherry": "34",
  "andaman and nicobar islands": "35",
  "telangana": "36",
  "ladakh": "38",
};

/**
 * Formats an Indian Place of Supply with its standard 2-digit GST/state code (e.g. "Gujarat (24)").
 */
export function formatPlaceOfSupplyWithCode(
  placeOfSupply: string | null | undefined,
  explicitStateCode?: string | null
): string {
  const clean = cleanSegment(placeOfSupply);
  if (!clean || clean === "—") return "—";
  if (/\(\d{2}\)\s*$/.test(clean)) return clean;

  const trimmedCode = cleanSegment(explicitStateCode);
  const codeFromMap = INDIAN_STATE_CODES[clean.toLowerCase()];
  const code = /^\d{2}$/.test(trimmedCode) ? trimmedCode : codeFromMap;

  return code ? `${clean} (${code})` : clean;
}

