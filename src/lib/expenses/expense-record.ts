export const EXPENSE_PAYERS = ["Aryan", "Yug", "Other"] as const;
export type ExpensePayer = (typeof EXPENSE_PAYERS)[number];

export const EXPENSE_PAYMENT_METHODS = [
  { value: "Bank Transfer", label: "Bank Transfer (NEFT/RTGS)" },
  { value: "UPI", label: "UPI" },
  { value: "Cash", label: "Cash" },
  { value: "Cheque", label: "Cheque" },
  { value: "Other / Don't Know", label: "Other / Don't Know" },
] as const;

export const EXPENSE_BILLS_BUCKET = "expense-bills";
export const MAX_BILL_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export const ALLOWED_BILL_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "application/pdf",
] as const;

export interface ExpenseRecord {
  id: string;
  expense_name: string;
  paid_by: ExpensePayer;
  date: string;
  vendor: string;
  description: string;
  amount: number;
  payment_method: string;
  receipt_url: string | null;
  bill_file_name: string | null;
  bill_kind: "image" | "pdf" | null;
}

const FALLBACK_PREFIX_RE =
  /^\[Expense:\s*([\s\S]+?)\s*\|\s*Paid by:\s*(Aryan|Yug|Other)\](?:\r?\n([\s\S]*))?$/;

export function isValidExpensePayer(value: unknown): value is ExpensePayer {
  return typeof value === "string" && (EXPENSE_PAYERS as readonly string[]).includes(value);
}

export function isAllowedBillMimeType(mimeType: string): boolean {
  return (ALLOWED_BILL_MIME_TYPES as readonly string[]).includes(mimeType.toLowerCase());
}

export function inferBillKind(pathOrName: string | null | undefined, mimeType?: string | null): "image" | "pdf" | null {
  if (mimeType) {
    const lowerMime = mimeType.toLowerCase();
    if (lowerMime === "application/pdf") return "pdf";
    if (lowerMime.startsWith("image/")) return "image";
  }
  if (!pathOrName) return null;
  const clean = pathOrName.split("?")[0].toLowerCase();
  if (clean.endsWith(".pdf")) return "pdf";
  if (/\.(png|jpe?g|webp|gif|heic)$/.test(clean)) return "image";
  return null;
}

export function extractBillFileName(pathOrUrl: string | null | undefined): string | null {
  if (!pathOrUrl) return null;
  const segment = pathOrUrl.split("/").pop() || "";
  // Strip "<timestamp>-<8hex>-" prefix when present
  const stripped = segment.replace(/^\d{10,}-[a-f0-9]{6,12}-/i, "");
  return stripped || segment || null;
}

export function isOwnedBillPath(path: string | null | undefined, businessId: string): boolean {
  if (!path || typeof path !== "string") return false;
  if (path.includes("..") || path.startsWith("/") || path.includes("\\")) return false;
  return path.startsWith(`${businessId}/`);
}

/**
 * Encodes expense name and payer cleanly into description when the database
 * does not yet have `expense_name` and `paid_by` columns migrated.
 */
export function formatExpenseDescriptionFallback(
  expenseName: string,
  paidBy: ExpensePayer,
  notes: string | null | undefined
): string {
  const cleanName = expenseName.replace(/[\r\n]+/g, " ").trim();
  const cleanNotes = (notes || "").trim();
  const header = `[Expense: ${cleanName} | Paid by: ${paidBy}]`;
  return cleanNotes ? `${header}\n${cleanNotes}` : header;
}

export interface RawExpenseDbRow {
  id: string;
  expense_date: string;
  expense_name?: string | null;
  paid_by?: string | null;
  vendor?: string | null;
  description?: string | null;
  amount: number | string;
  payment_method?: string | null;
  receipt_url?: string | null;
}

export function parseExpenseRow(row: RawExpenseDbRow): ExpenseRecord {
  const rawDescription = row.description || "";
  const match = rawDescription.match(FALLBACK_PREFIX_RE);

  const parsedName = match ? match[1].trim() : "";
  const parsedPayer = match && isValidExpensePayer(match[2]) ? match[2] : null;
  const parsedNotes = match ? (match[3] || "").trim() : rawDescription;

  const expenseName =
    (typeof row.expense_name === "string" && row.expense_name.trim()) ||
    parsedName ||
    parsedNotes ||
    row.vendor ||
    "Business Expense";

  const paidBy: ExpensePayer = isValidExpensePayer(row.paid_by)
    ? row.paid_by
    : parsedPayer || "Other";

  const receiptUrl = row.receipt_url || null;

  return {
    id: row.id,
    expense_name: expenseName,
    paid_by: paidBy,
    date: row.expense_date,
    vendor: row.vendor || "",
    description: parsedNotes,
    amount: Number(row.amount) || 0,
    payment_method: row.payment_method || "Other / Don't Know",
    receipt_url: receiptUrl,
    bill_file_name: extractBillFileName(receiptUrl),
    bill_kind: inferBillKind(receiptUrl),
  };
}

export function isMissingColumnError(error: { code?: string; message?: string } | null | undefined): boolean {
  if (!error) return false;
  if (error.code === "PGRST204" || error.code === "42703") return true;
  const msg = (error.message || "").toLowerCase();
  return msg.includes("expense_name") || msg.includes("paid_by");
}

