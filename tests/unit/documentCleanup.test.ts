import { describe, expect, it, vi } from "vitest";
import {
  deleteInvoiceAndRecoverStock,
  deleteOrderAndRecoverStock,
} from "@/lib/supabase/document-cleanup";

function createMockDb(options: {
  rpcResult?: { data?: any; error?: { code?: string; message: string } | null };
  invoiceRow?: any;
  orderRow?: any;
  linkedInvoices?: any[];
}) {
  const deletedTables: string[] = [];
  const db: any = {
    deletedTables,
    rpc: vi.fn(async () => options.rpcResult ?? { data: null, error: null }),
    from: vi.fn((table: string) => {
      const chain: any = {
        _op: "select",
        select: vi.fn(() => chain),
        delete: vi.fn(() => {
          chain._op = "delete";
          deletedTables.push(table);
          return chain;
        }),
        eq: vi.fn(() => chain),
        maybeSingle: vi.fn(async () => {
          if (table === "invoices") return { data: options.invoiceRow ?? null, error: null };
          if (table === "orders") return { data: options.orderRow ?? null, error: null };
          return { data: null, error: null };
        }),
        then: undefined as any,
      };
      // Allow await db.from(...).select/delete().eq()...
      chain.then = (resolve: any) => {
        if (chain._op === "select" && table === "invoices") {
          return Promise.resolve({ data: options.linkedInvoices ?? [], error: null }).then(resolve);
        }
        if (chain._op === "delete" && (table === "invoices" || table === "orders")) {
          return Promise.resolve({ data: [{ id: "deleted-1" }], error: null }).then(resolve);
        }
        return Promise.resolve({ data: [], error: null }).then(resolve);
      };
      return chain;
    }),
  };
  return db;
}

describe("document-cleanup", () => {
  it("uses atomic delete_invoice_permanently RPC when installed", async () => {
    const db = createMockDb({
      rpcResult: { data: { success: true, stock_movements_removed: 4 }, error: null },
    });

    const res = await deleteInvoiceAndRecoverStock(db, "biz-1", "inv-1");
    expect(res).toEqual({ ok: true, status: 200, stockMovementsRemoved: 4 });
    expect(db.rpc).toHaveBeenCalledWith("delete_invoice_permanently", {
      p_business_id: "biz-1",
      p_invoice_id: "inv-1",
    });
  });

  it("refuses deleting finalized/cancelled invoice cleanly without touching stock if migration RPC is not installed", async () => {
    const db = createMockDb({
      rpcResult: {
        error: {
          code: "PGRST202",
          message: "Could not find the function public.delete_invoice_permanently",
        },
      },
      invoiceRow: { id: "inv-1", status: "cancelled", invoice_number: "BILL/2026-27/0001" },
    });

    const res = await deleteInvoiceAndRecoverStock(db, "biz-1", "inv-1");
    expect(res.ok).toBe(false);
    expect(res.status).toBe(409);
    expect(res.error).toContain("20240011_allow_order_invoice_delete.sql");
    expect(db.deletedTables).toEqual([]);
  });

  it("deletes confirmed orders and restores stock when no finalized linked bill blocks deletion", async () => {
    const db = createMockDb({
      rpcResult: {
        error: {
          code: "PGRST202",
          message: "Could not find the function public.delete_order_permanently",
        },
      },
      orderRow: { id: "ord-1", order_number: "ORD-123456", status: "confirmed" },
      linkedInvoices: [],
    });

    const res = await deleteOrderAndRecoverStock(db, "biz-1", "ord-1", true);
    expect(res.ok).toBe(true);
    expect(res.status).toBe(200);
    expect(db.deletedTables).toEqual(["stock_movements", "order_items", "orders"]);
  });
});

