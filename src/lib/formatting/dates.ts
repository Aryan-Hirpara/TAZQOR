/**
 * Date and time formatting helpers for TAZQOR.
 * Standard en-IN formatting with Asia/Kolkata timezone.
 */

/**
 * Formats a date into "15 Feb 2026" (en-IN).
 */
export function formatDate(date: Date | string | number | null | undefined): string {
  if (!date) return "—";

  // Handle simple YYYY-MM-DD strings directly to avoid UTC timezone day shifts
  if (typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date.trim())) {
    const [y, m, d] = date.trim().split("-").map(Number);
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const day = String(d).padStart(2, "0");
    const month = months[m - 1] || "";
    return `${day} ${month} ${y}`;
  }

  const d = typeof date === "object" ? date : new Date(date);
  if (isNaN(d.getTime())) return "—";

  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
}

/**
 * Formats a date and time into "15 Feb 2026, 04:30 PM" (Asia/Kolkata).
 */
export function formatDateTime(date: Date | string | number | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "object" ? date : new Date(date);
  if (isNaN(d.getTime())) return "—";

  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(d);
}

