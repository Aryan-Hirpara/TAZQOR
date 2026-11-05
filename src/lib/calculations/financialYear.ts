/**
 * Financial Year calculations for TAZQOR Business Manager.
 * In India, the standard financial year runs from April 1 to March 31.
 */

export interface FinancialYearInfo {
  startYear: number;
  endYear: number;
  label: string; // e.g. "2025-26"
  startDate: Date;
  endDate: Date;
}

/**
 * Extracts year and 1-indexed month respecting Indian Standard Time (Asia/Kolkata).
 */
function getIndianYearAndMonth(date: Date | string | number): { year: number; month: number } {
  // If string is YYYY-MM-DD format (no time), parse directly to avoid timezone drift
  if (typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date.trim())) {
    const [y, m] = date.trim().split("-").map(Number);
    return { year: y, month: m };
  }

  const d = typeof date === "object" ? date : new Date(date);
  if (isNaN(d.getTime())) {
    throw new Error(`Invalid date passed: ${date}`);
  }

  // Format in Asia/Kolkata timezone
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "numeric",
  });
  const parts = formatter.formatToParts(d);
  let year = d.getFullYear();
  let month = d.getMonth() + 1;

  for (const part of parts) {
    if (part.type === "year") year = Number(part.value);
    if (part.type === "month") month = Number(part.value);
  }

  return { year, month };
}

/**
 * Returns the Indian Financial Year string (e.g. "2025-26" or "2026-27") for a given date.
 * @param date Date object, ISO string, or timestamp (defaults to current date)
 * @param startMonth Starting month of the financial year (1-indexed, default: 4 for April)
 */
export function getFinancialYear(
  date: Date | string | number = new Date(),
  startMonth: number = 4
): string {
  const { year: calendarYear, month: calendarMonth } = getIndianYearAndMonth(date);

  let startYear: number;
  let endYear: number;

  if (calendarMonth >= startMonth) {
    // Current year to next year (e.g., April 2026 to Dec 2026 -> FY 2026-27)
    startYear = calendarYear;
    endYear = calendarYear + 1;
  } else {
    // Previous year to current year (e.g., Jan 2026 to March 2026 -> FY 2025-26)
    startYear = calendarYear - 1;
    endYear = calendarYear;
  }

  const endShort = String(endYear).slice(-2);
  return `${startYear}-${endShort}`;
}

/**
 * Returns full details about the Financial Year for a given date.
 */
export function getFinancialYearInfo(
  date: Date | string | number = new Date(),
  startMonth: number = 4
): FinancialYearInfo {
  const d = typeof date === "object" ? date : new Date(date);
  const calendarYear = d.getFullYear();
  const calendarMonth = d.getMonth() + 1;

  let startYear: number;
  let endYear: number;

  if (calendarMonth >= startMonth) {
    startYear = calendarYear;
    endYear = calendarYear + 1;
  } else {
    startYear = calendarYear - 1;
    endYear = calendarYear;
  }

  const endShort = String(endYear).slice(-2);
  return {
    startYear,
    endYear,
    label: `${startYear}-${endShort}`,
    startDate: new Date(startYear, startMonth - 1, 1, 0, 0, 0, 0),
    endDate: new Date(endYear, startMonth - 1, 0, 23, 59, 59, 999),
  };
}

/**
 * Formats a sequential invoice / bill document number following the business prefix and FY:
 * e.g. "INV/2025-26/0001" or "BILL/2025-26/0001"
 */
export function formatDocumentNumber(
  prefix: string,
  sequence: number,
  date: Date | string = new Date(),
  padding: number = 4
): string {
  const fy = getFinancialYear(date);
  const seqStr = String(sequence).padStart(padding, "0");
  return `${prefix}/${fy}/${seqStr}`;
}

export function formatInvoiceNumberForFY(
  sequence: number,
  date: Date | string = new Date()
): string {
  return formatDocumentNumber("INV", sequence, date);
}
