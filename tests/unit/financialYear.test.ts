import { describe, it, expect } from "vitest";
import {
  getFinancialYear,
  getFinancialYearInfo,
  formatDocumentNumber,
} from "@/lib/calculations/financialYear";

describe("Financial Year Logic (Indian Standard: April 1 - March 31)", () => {
  it("determines FY 2025-26 for February 15, 2026 (pre-April)", () => {
    // 2026-02-15 is in FY 2025-26 because Indian FY starts on April 1
    const fy = getFinancialYear("2026-02-15");
    expect(fy).toBe("2025-26");
  });

  it("determines FY 2025-26 for the last day of the fiscal cycle (March 31, 2026)", () => {
    const fy = getFinancialYear("2026-03-31T23:59:59+05:30");
    expect(fy).toBe("2025-26");
  });

  it("determines FY 2026-27 on the first day of the new fiscal cycle (April 1, 2026)", () => {
    const fy = getFinancialYear("2026-04-01T00:00:00Z");
    expect(fy).toBe("2026-27");
  });

  it("determines FY 2026-27 for mid-year dates (October 15, 2026)", () => {
    const fy = getFinancialYear("2026-10-15");
    expect(fy).toBe("2026-27");
  });

  it("determines FY 2026-27 for January 10, 2027", () => {
    const fy = getFinancialYear("2027-01-10");
    expect(fy).toBe("2026-27");
  });

  it("returns full financial year range info correctly", () => {
    const info = getFinancialYearInfo("2026-02-15");
    expect(info.startYear).toBe(2025);
    expect(info.endYear).toBe(2026);
    expect(info.label).toBe("2025-26");
    expect(info.startDate.getFullYear()).toBe(2025);
    expect(info.startDate.getMonth()).toBe(3); // April (0-indexed 3)
    expect(info.startDate.getDate()).toBe(1);
  });

  it("formats gap-free invoice document numbers according to exact FY", () => {
    expect(formatDocumentNumber("INV", 1, "2026-02-15")).toBe("INV/2025-26/0001");
    expect(formatDocumentNumber("BILL", 1, "2026-02-15")).toBe("BILL/2025-26/0001");
    expect(formatDocumentNumber("INV", 42, "2026-04-05")).toBe("INV/2026-27/0042");
  });
});
