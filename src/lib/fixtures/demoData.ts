/**
 * TAZQOR Test & Verification Fixtures
 * Edge-case fixtures flagged with is_demo: true for local UI testing and verification.
 */

export interface DemoFixture {
  is_demo: boolean;
  long_name: string;
  gujarati_name: string;
  hindi_name: string;
  extreme_value: number;
  zero_value: number;
  negative_value: number;
  decimal_value: number;
  boundary_date_fy_end: string;
  boundary_date_fy_start: string;
  order_statuses: Array<"confirmed" | "processing" | "dispatched" | "delivered" | "cancelled">;
  invoice_statuses: Array<"paid" | "partial" | "unpaid" | "overdue" | "draft" | "cancelled">;
  payment_statuses: Array<"completed" | "pending" | "failed">;
}

export const DEMO_FIXTURES: DemoFixture = {
  is_demo: true,
  long_name: "ShreejiEnterpriseSuperMegaWholesaleDistributionAndLogisticsHubUnlimitedCorporateBranchOffice",
  gujarati_name: "શ્રીજી એન્ટરપ્રાઇઝ પ્રોવિઝન સ્ટોર્સ (અમદાવાદ)",
  hindi_name: "राजेश जनरल स्टोर एंड ट्रेडिंग कंपनी (सूरत)",
  extreme_value: 999999999.99, // ₹99,99,99,999.99
  zero_value: 0.0,
  negative_value: -1500.0,
  decimal_value: 12.35,
  boundary_date_fy_end: "2026-03-31",
  boundary_date_fy_start: "2026-04-01",
  order_statuses: ["confirmed", "processing", "dispatched", "delivered", "cancelled"],
  invoice_statuses: ["paid", "partial", "unpaid", "overdue", "draft", "cancelled"],
  payment_statuses: ["completed", "pending", "failed"],
};

