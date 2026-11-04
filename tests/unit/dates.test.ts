import { describe, it, expect } from "vitest";
import { formatDate, formatDateTime } from "@/lib/formatting/dates";

describe("Date Formatting (en-IN & Asia/Kolkata)", () => {
  it("formats ISO date string 2026-02-15 to 15 Feb 2026", () => {
    expect(formatDate("2026-02-15")).toBe("15 Feb 2026");
  });

  it("formats Date object in Asia/Kolkata", () => {
    const d = new Date("2026-02-15T10:30:00Z");
    expect(formatDate(d)).toBe("15 Feb 2026");
  });

  it("handles null and undefined gracefully", () => {
    expect(formatDate(null)).toBe("—");
    expect(formatDate(undefined)).toBe("—");
  });
});

