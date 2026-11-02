# TAZQOR Business Manager — Antigravity Master Build Prompt (v3)

> **Purpose:** Build a complete, production-minded, mobile-first business management application for TAZQOR, a cleaning-products business.
> **One rule above all:** one responsive Next.js + TypeScript PWA, one codebase, one database. No separate React Native / mobile app.
> **v3 changes vs v2:** adds an agent operating protocol, a *Locked Business Rules* section that resolves every ambiguity (stock timing, batch allocation, rounding, financial year, invoice numbering, balances), a concrete database/RPC/RLS design, security & privacy section, known technical pitfalls (₹ glyph in PDFs, Leaflet in Next.js, PWA caching of private data), exit criteria per phase, and an assumptions list for the owner to confirm.

---

## 0. How you must operate (agent protocol)

You are a senior full-stack engineer, product designer, database architect, and QA engineer working inside the **existing project workspace**.

1. **Inspect first.** Read the full project tree, `package.json`, lockfile, config, env files, and existing source. Preserve working code; never overwrite features you have not understood.
2. **Inspect every design reference.** The owner supplied `refrence` (sic) with screenshots. If already extracted, use that folder. If not, extract a *copy* into `design-references/` (never modify the originals). View every image at full size. If no images can be found, say so explicitly, use the provisional tokens in §5, and mark them `/* PROVISIONAL */` so they are easy to replace.
3. **Plan briefly, then build.** Write a short plan to `docs/PROGRESS.md`, then implement. Never stop at a plan, mockup, or static dashboard.
4. **Work in verifiable stages** (see §16). After each phase run the quality gate:
   `pnpm typecheck && pnpm lint && pnpm test && pnpm build` (use the project's package manager if it already has one). Fix failures before moving on.
5. **Keep `docs/PROGRESS.md` current:** phase status, decisions taken, open issues, how each acceptance item was verified. Commit at the end of every phase with a clear message.
6. **Do not ask the owner to repeat information in this brief.** If a credential or external service is missing, build the integration against environment variables, document setup, and never invent credentials, GSTIN, HSN codes, tax rates, or business identity data.
7. **Be honest in reporting.** Never claim something works unless you ran it. List anything unverified or incomplete in the final report.
8. **Use current stable versions** of every library, and verify compatibility with the installed Next.js version before adopting it (PWA plugin, PDF library, Leaflet, shadcn/ui, Tailwind). Pin exact versions in the lockfile.

Screenshots are *design guidance* for an original TAZQOR product. Do not copy third-party logos, names, or proprietary artwork.

---

## 1. Product objective

Build **TAZQOR Business Manager**, a private operations app for a cleaning-products business. The owner manages:

- Customers / retail shops, contacts, and locations
- Products, categories, pack sizes
- Inventory, batches, stock movements
- Customer orders
- GST and non-GST billing
- Payments and outstanding balances
- Customer visits and follow-ups
- Business expenses
- Sales, inventory, and financial reports
- Business settings and data export

**Primary use:** phone, during shop visits, calls, order taking, and payment collection. **Secondary:** laptop with a rich dashboard.

### Core principles

- One app, one codebase, one shared database; same functionality and business rules on every screen size.
- Mobile-first, not a squeezed desktop page. Navigation and layout differ per viewport; data and capabilities do not.
- Initial user model: **one owner/admin**. Model the data so roles can be added later; do not build multi-tenant machinery.
- Fast daily workflows, clear financial figures, accurate records, data integrity.
- Never show fake analytics as real. Empty states are fine; demo data must be labelled and kept out of production.

---

## 2. Locked technology choices (do not substitute)

| Area | Choice |
|---|---|
| Language | TypeScript (strict mode) |
| Framework | Next.js App Router, React; prefer Server Components, Client Components only for interactivity |
| Styling / UI | Tailwind CSS, shadcn/ui, Lucide React, Inter (unless the references establish another font) |
| Charts / tables | Recharts, TanStack Table |
| Forms / validation | React Hook Form + Zod (shared schemas used on client **and** server) |
| Feedback / dates | Sonner, date-fns |
| Backend | Supabase: PostgreSQL, Auth, Storage, RLS, SQL migrations |
| Maps | Leaflet + OpenStreetMap |
| PDF | `@react-pdf/renderer` (or another verified server-side library) |
| CSV | Maintained library or typed utilities |
| PWA | `manifest.webmanifest` + a maintained Next.js-compatible service-worker approach (e.g. Serwist; verify it works with the installed Next version; avoid unmaintained plugins) |
| Quality | ESLint, `tsc`, Vitest (unit), Playwright (E2E + responsive) |
| Hosting | Vercel (app) + Supabase (database/backend) |

**Forbidden:** React Native, Expo, Flutter, Express, NestJS, MongoDB, Firebase, MySQL, any second database, any separate mobile codebase.

### Architecture rules

- Server Actions or Route Handlers for mutations and integrations; every one starts with an authenticated-session check and Zod validation.
- Business logic lives in `lib/` domain modules and Postgres functions — **never** inside visual components.
- Multi-step financial/inventory operations run as **Postgres functions (RPC) in a single transaction**, called from server code (see §7.3).
- Use the official Supabase SSR pattern for Next.js (cookie-based sessions, server and browser clients kept separate).
- `SUPABASE_SERVICE_ROLE_KEY` is server-only, optional, and used only where unavoidable. Prefer user-scoped access under RLS. Never ship it to browser bundles.
- Generate DB types with `supabase gen types typescript` and use them throughout.

### Environment variables (`.env.example`, placeholders only)

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

Add clear "missing configuration" screens/errors and setup docs. Never commit real secrets.

---

## 3. Locked business rules (decisions already made — implement exactly)

These resolve ambiguities. Do not re-open them unless a rule is legally or technically impossible; if so, document why and what you did instead.

### 3.1 Money, quantities, rounding

- Money: `NUMERIC(14,2)`. Quantities: `NUMERIC(14,3)`. Tax rates: `NUMERIC(5,2)`. **No floating point for money anywhere** (use a decimal library or integer paise in TypeScript; test it).
- Tax and discounts are calculated **per line**, then summed. Invoice total is rounded to the nearest rupee when the "round off" setting is on (default on), with the difference shown as a separate **Round off** line and stored.
- Prices can be tax-**exclusive** or tax-**inclusive** (setting per business, overridable per invoice); calculations must handle both and be unit-tested with edge cases.

### 3.2 Locale, time, formats

- Currency INR with Indian digit grouping (`Intl.NumberFormat('en-IN')`, e.g. ₹1,23,456.00). Default timezone `Asia/Kolkata`, configurable; store UTC, display local.
- Financial year runs **1 April – 31 March** (configurable start month). Default phone country code `+91` (configurable). All UI strings should be i18n-ready (centralized), English only for now.

### 3.3 Inventory

- Inventory is **ledger-based**: current stock = sum of `stock_movements`. No stored mutable quantity columns, no direct edits.
- Movement types: `purchase_in`, `sale_out`, `sales_return_in`, `purchase_return_out`, `damage_out`, `expiry_out`, `adjustment_in`, `adjustment_out`, `opening_stock`. Each has reason, timestamp, actor, and a reference to its source document/line.
- **Stock is issued when an invoice is finalized** (GST or non-GST). Draft/confirmed orders do **not** move stock. Confirmed orders may show an informational "committed" quantity (derived, not a movement). Cancelling a finalized invoice creates reversing `sales_return_in` movements.
- Batch selection for issue: **FEFO** (earliest expiry first, then FIFO by receipt date) by default, with manual override. Batch allocations per invoice line are stored (`invoice_item_batches`) so cost and traceability are exact.
- **Negative stock is not allowed** by default; enforced in the database function, not just the UI. (Setting may allow it with a loud warning.)
- Idempotency: a unique constraint on `(source_type, source_line_id, movement_type)` prevents double-issue.

### 3.4 Orders vs invoices

- Order status (`draft → confirmed → processing → dispatched → delivered`, or `cancelled`) is **separate from** payment status and invoice status. Paid ≠ delivered.
- An order converts to an invoice **without re-entering lines**; the invoice references the order and lines are copied once, then snapshotted.
- An order can be fully/partially invoiced; track invoiced quantity per order line.

### 3.5 Invoices and GST

- Two document modes: **GST tax invoice** and **Non-GST bill of supply / receipt**, each with its own numbering series and PDF template.
- **GST mode is disabled** until the owner has completed business/tax settings (legal name, GSTIN format-validated, state, address, registration status) **and explicitly confirmed eligibility**. Show a setup banner when incomplete.
- Non-GST documents must **never** show GSTIN, "Tax Invoice" wording, or tax amounts.
- Never hardcode tax rates, HSN/SAC codes, or legal wording. Tax rates live in `tax_rates` with effective dates; HSN is an optional product field entered by the owner.
- Intra-state supply → CGST + SGST split; inter-state → IGST, based on business state vs place of supply. Show the split on the invoice.
- **Numbering:** configurable format, default `{PREFIX}/{FY}/{SEQ}` (e.g. `INV/2026-27/0001`), separate sequences per mode and financial year, generated by a database function using a row-locked counter (safe under concurrency, gap-free for finalized invoices).
- Lifecycle: `draft → finalized → (cancelled | credited)`. **Finalized invoices are immutable** (enforced by DB trigger, not only UI). Corrections via cancellation or **credit/debit notes**. Lines store **snapshots** of business, customer, product name, SKU, HSN, price, quantity, discount, and tax at finalization time.

### 3.6 Payments and balances

- `payments` (money received) and `payment_allocations` (money applied to invoices) are separate tables. One payment can be split across many invoices; an invoice can receive many payments.
- Constraints: allocations ≤ payment amount; allocations ≤ invoice outstanding; enforced in the database function.
- **Outstanding = finalized invoice total − allocated payments − applied credit notes.** Unallocated payment amount = customer **advance**, shown separately. Never double count.
- Balances are **computed** (SQL views/functions), never stored as editable columns. **Overdue** = due date passed and outstanding > 0.
- Payment creation and invoice finalization require a client-generated **idempotency key** (unique in DB) so double-taps/retries never duplicate.

### 3.7 Reporting definitions (display these definitions in the UI)

- **Sales / revenue** = finalized invoice totals (excluding cancelled), before/after tax as labelled.
- **Collections** = payments received in the period.
- **Receivables** = outstanding invoice balances.
- **Expenses** = recorded expenses.
- **Gross margin** only where reliable cost data exists (from batch costs on invoice lines); otherwise show "Insufficient cost data". Never call revenue "profit".

### 3.8 Archiving

Customers and products referenced by financial records are **archived/deactivated, never hard-deleted**. Draft documents may be deleted. All important changes are recorded in `audit_logs`.

---

## 4. Product areas and pages

Every page needs: loading skeleton, empty state, error state, success feedback, validation, confirmation for destructive actions, accessible labels, a clear title and primary action, desktop breadcrumbs where useful. No dead buttons, dead links, placeholder charts, fake submissions, or lorem ipsum.

### 4.1 `/login` (and forgot-password)
TAZQOR wordmark, email + password, show/hide, session persistence, password reset flow, clear errors, protected routes, sign-out. **No public sign-up** (disable in Supabase; document first-admin creation). Add basic brute-force protection (Supabase rate limits + generic error messages).

### 4.2 `/dashboard`
Greeting, current date, search/quick-action, notifications, profile menu, **date-range filter**.
- **KPIs:** total sales (period), today's sales, total customers, outstanding receivables, total orders, monthly revenue.
- **Widgets:** sales performance, revenue trend, top-selling products, recent orders, recent invoices, payment collection summary, receivables, monthly target progress (only if a target is configured), low-stock alerts, upcoming follow-ups.
- Every KPI drills down to source records. All figures from real DB aggregates; never fabricate percentage changes (show "—" when no prior-period data).

### 4.3 `/customers` and `/customers/[id]`
- **List:** counts (total/active/recent); search by name, shop, phone, city, area, code; filters (type, city, status, outstanding); add/edit/archive; desktop table + mobile cards; pagination or incremental loading.
- **Fields:** shop/customer name, contact person, primary phone, WhatsApp (optional), email (optional), type (grocery, hotel, mall, office, PG, school, other), billing address, delivery address, city, district, state, PIN, GPS lat/lng (optional), notes, status, created date, customer code. Store no unnecessary personal data.
- **Detail:** contacts, call/WhatsApp/directions actions, total purchases, total paid, outstanding, advance, order/invoice/payment/visit history, notes/follow-ups, ledger tab. **Quick actions:** create order, create bill, record payment, record visit, edit.

### 4.4 `/products`, `/products/new`, `/products/[id]`, `/categories`
Catalogue with search/category filter/status; SKU, name, description, category, **variants/pack sizes** (250 mL, 500 mL, 1 L … without duplicating products), cost price, selling price, tax config, HSN (optional), reorder level, optional image, active/inactive. Example categories (not pre-filled stock/prices): Hand Wash, Dish Wash, Floor Cleaner, Toilet Cleaner, Bathroom Cleaner, Glass Cleaner, Car Wash.

### 4.5 `/inventory`
Stock by product/variant, stock value (where cost exists), low/out-of-stock, batch-wise stock, receive stock (supplier/reference), sales issue (via invoices), returns, damaged/expired adjustments, movement history; filters by product, batch, type, date. Batch fields: number, variant, manufacturing date, expiry/best-before, quantity received, quantity remaining (derived), cost, supplier/reference, notes.

### 4.6 `/orders`
List with order number, customer, date, items, totals, order/payment/delivery status; search/filters; create/view/update; create from customer profile; convert to invoice; stock availability check at creation (warning, not a movement).

### 4.7 `/invoices`, `/invoices/new`, `/invoices/[id]`
Pick or create customer, choose mode, add items, price/discount, tax from configured rates, place of supply, invoice/due dates, terms, notes, **preview → save draft → finalize → PDF → print/download/share**. Finalization (one DB transaction): validate → number → snapshot → stock issue → receivable. PDF must be professional, print-friendly, branded from settings, and **embed a font containing the ₹ glyph (U+20B9)** (default PDF fonts lack it; Inter/Noto Sans work). Generate PDFs from server-verified data only.

### 4.8 `/payments`, `/ledger`, customer ledger
Record payment (customer, amount, date, method: cash/UPI/bank transfer/cheque/other, reference, notes), allocate to one or many invoices or leave as advance, receipt generation, payment history, customer ledger, outstanding and overdue views.

### 4.9 `/map`
Leaflet + OpenStreetMap markers; search; filters (city, type, status); popup with name, contact, link; external directions; add/update coordinates; **list-view fallback**. Respect OSM tile usage policy and attribution; no bulk geocoding assumptions; request location permission only when the user triggers a location feature, with an explanation. Load Leaflet client-side only (dynamic import, `ssr: false`) and configure marker icons explicitly (the default icons break under bundlers).

### 4.10 `/visits`
Today / upcoming / completed / missed; calendar or list; customer, date/time, outcome, notes, next follow-up, optional GPS check-in (only record coordinates the browser actually returned with permission), follow-up reminders.

### 4.11 `/reports`
Daily/weekly/monthly sales; by product, customer, city; revenue trend; collections; outstanding/overdue; inventory & movement; product performance; expenses; margin (only with reliable cost). Date range, filters, charts + summary cards, **CSV export (Excel-compatible, UTF-8 with BOM)**, print-friendly/PDF where useful. Show the definitions from §3.7.

### 4.12 `/expenses`
Add/edit expense: date, category, amount, payment method, vendor (optional), description, optional receipt attachment (private storage). Default categories: raw materials, packaging, transport, marketing, utilities, rent, maintenance, miscellaneous; custom categories allowed. List, filters, summaries.

### 4.13 `/settings`
Business profile, logo/branding, address/contact, GST configuration & eligibility confirmation, invoice settings/numbering/FY, tax rates (with effective dates), categories, payment methods, low-stock thresholds, round-off and tax-inclusive defaults, notification preferences, account/security, data export (full CSV/JSON export) and backup guidance. **Do not prefill any private identifiers**; all identity fields are editable and start empty.

### 4.14 Global search and quick actions
Debounced, scoped search across customer name, phone, city/area, invoice number, order number, product name/SKU (command palette on desktop, easy access on mobile). Quick actions: add customer, create order, create bill, record payment, record visit, add expense — each opens a real working form.

---

## 5. Design system

Derive the real palette, spacing, typography, card style, chart style and navigation from the screenshots. Initial clues: off-white page surfaces, neon lime-yellow highlights, black/charcoal cards, blue/lavender-blue gradient feature surfaces, white cards, bold KPI numbers, rounded corners, subtle borders, restrained shadows, compact polished navigation.

**Provisional fallback tokens (only if references are unavailable — replace with measured values):** background `#F5F5F0`, surface `#FFFFFF`, charcoal `#15171A`, lime accent `#C6F432`, blue gradient `#6C7BFF → #A9B8FF`, border `#E5E5DF`.

Define everything as **semantic CSS variables mapped into Tailwind's theme** in one central file: accent, background, surface, dark surface, primary/secondary/muted text, border, gradient feature colour, success/warning/danger/info, radii, shadows, spacing, type scale. No scattered hard-coded colours.

Visual rules: large KPI values with clear labels; charcoal cards only for top-priority metrics; lime for key actions/selection/progress; gradients sparingly (hero/featured analytics); no heavy glassmorphism, shadows, or gratuitous animation; accessible contrast (WCAG AA), visible focus states, ≥44px touch targets, keyboard navigation, `prefers-reduced-motion` respected. Reusable components: KPI card, data table, customer card, status badge, filter bar/sheet, date range picker, form field, empty state, confirm dialog.

---

## 6. Responsive behaviour

| Viewport | Behaviour |
|---|---|
| **Mobile (primary)** | Single column; bottom navigation for most-used destinations; compact top bar (title, search, profile); large touch targets; records as **cards**, not wide tables; vertical forms; filters in bottom sheets/drawers; sticky bottom actions only when they don't obscure content; charts resize and stay readable; modals/dropdowns fit small screens; **no horizontal page overflow** |
| **Tablet** | Two-column where useful; compact sidebar or rail; fluid cards/tables |
| **Laptop/desktop** | Persistent left sidebar; multi-column dashboard; sortable/filterable/paginated tables; multi-column forms and detail panels; richer charts |

Test at 360, 390, 430, 768, 1024, 1280, 1440 px. Optimize the most frequent mobile tasks to ≤3 taps: find customer, open customer, create order, create bill, record payment, record visit. Use safe-area insets for installed-PWA mode on phones with notches.

---

## 7. Database design (Supabase PostgreSQL)

Versioned SQL migrations in `supabase/migrations/`. UUID primary keys, `created_at`/`updated_at` (UTC), foreign keys, CHECK constraints (amounts ≥ 0, valid statuses), and indexes on customer name, phone, city, invoice number, order number, SKU, and common date filters.

### 7.1 Tables (at minimum)

`businesses`, `profiles`, `business_settings`, `customers`, `customer_addresses`, `customer_notes`, `categories`, `products`, `product_variants`, `tax_rates`, `suppliers`, `batches`, `stock_movements`, `orders`, `order_items`, `invoices`, `invoice_items`, `invoice_item_batches`, `invoice_number_counters`, `payments`, `payment_allocations`, `credit_notes` (+ items), `customer_visits`, `follow_ups`, `expenses`, `expense_categories`, `audit_logs`.

Add debit-note tables only if implemented. No duplicate-fact tables.

### 7.2 Business scoping and RLS

- Single `businesses` row for now; every business-owned table carries `business_id`; `profiles.business_id` links the owner.
- A `SECURITY DEFINER` helper (e.g. `current_business_id()`) returns the caller's business. **RLS enabled on every table** with explicit policies `business_id = current_business_id()` (separate SELECT/INSERT/UPDATE/DELETE policies; no blanket `USING (true)`).
- Private Storage buckets (receipts, documents, logo) with path-scoped policies (`{business_id}/...`). Signed URLs for downloads.
- Write **RLS tests** (pgTAP or scripted tests with two distinct users) proving cross-business reads/writes fail.

### 7.3 Server-side functions (single transaction each)

`finalize_invoice`, `cancel_invoice`, `create_credit_note`, `record_payment` (with allocations), `allocate_payment`, `receive_stock`, `adjust_stock`, `convert_order_to_invoice`, `next_invoice_number`. All validate ownership/business scope, enforce idempotency keys, lock the rows they depend on (`SELECT … FOR UPDATE`), and raise clear errors that the UI maps to friendly messages.

### 7.4 Views / computed data

`v_stock_on_hand` (by variant & batch), `v_invoice_outstanding`, `v_customer_balances` (purchases, paid, outstanding, advance), `v_overdue_invoices`, plus report aggregates. No stored, manually-updated balance columns.

### 7.5 Triggers and integrity

Immutability trigger on finalized invoices/lines; `updated_at` trigger; audit-log triggers on customers, products, invoices, payments, stock adjustments, settings; prevent deleting rows referenced by financial records.

### 7.6 Seed data

`supabase/seed.sql` for **local development only**, every row flagged `is_demo = true` and clearly named; production migrations contain no business data other than default expense categories and payment methods.

---

## 8. Security and privacy

- Every Server Action / Route Handler: verify session → validate with Zod → verify business ownership → execute. Never rely on hidden UI.
- Secure headers (CSP, `X-Content-Type-Options`, `Referrer-Policy`, frame protection) via Next config; no secrets in client bundles (verify by grepping the build output for the service-role key name/value).
- Validate file uploads (type, size limit, randomized path); private buckets only.
- Sanitize anything rendered into PDFs/CSV (guard against CSV formula injection: prefix cells starting with `= + - @`).
- Encode WhatsApp/phone links safely; only render when a valid number exists. WhatsApp links use `https://wa.me/<number>?text=<encoded>` (no API integration).
- Minimize personal data; document data retention and export; audit log is append-only.

---

## 9. Key workflows (implement and E2E-test all)

**A. Add customer** — Customers → Add → name/contact/phone/type/address → optional location → save → appears in list (and map if coordinates) → profile shows quick actions.

**B. Create order** — from customer or Orders → add items → stock availability warning → review totals → save draft/confirm. **No stock movement.**

**C. Generate bill** — select customer → choose GST/non-GST (GST gated by eligibility) → items, discounts, taxes → preview → finalize (numbering, snapshot, FEFO stock issue, receivable, in one transaction) → PDF → print/download/share. Retrying finalize returns the same invoice (idempotent).

**D. Receive payment** — select customer → amount/date/method/reference → allocate to one or more invoices or leave as advance → save → statuses and ledger update from allocations → receipt shown. Double-submit creates one payment.

**E. Record visit** — find customer → record visit (optional GPS with permission) → outcome/notes → next follow-up → appears on visits/dashboard.

**F. Review performance** — dashboard/reports → date range → accurate sales, collections, outstanding, products, expenses → drill down → export.

**G. Correct a mistake** — cancel a finalized invoice or issue a credit note → stock reversed/credited, balances recalculated, audit trail written, original document untouched.

---

## 10. PWA and offline

Manifest (name **TAZQOR Business Manager**, short name **TAZQOR**, standalone display, theme colour from verified palette), replaceable placeholder icons (incl. maskable) if no approved logo exists, installable where supported, loading/splash experience, offline fallback page, visible online/offline indicator.

**Caching rules:** cache static assets only. **Never cache authenticated API/HTML responses containing customer or financial data in the service worker.** Do not pretend operations work offline unless they truly do.

**Default scope: online-first PWA.** Disable create/finalize/pay buttons offline with a clear message. If you implement offline entry, it must queue locally with unique IDs and idempotency keys, show sync state (pending/failed/synced), never silently discard input, and never duplicate invoices/payments on reconnect. If robust sync is too large for this pass, ship online-first and document the limits.

Document Android (Chrome "Install app") and iPhone (Safari → Share → Add to Home Screen) installation.

---

## 11. UX and quality details

- Reusable components, consistent INR formatting, tap-to-call phone numbers, no buttons that do nothing.
- Forms: inline validation, preserve input on error, disable submit while pending, prevent double submission.
- Destructive/irreversible actions (finalize, cancel, archive) require confirmation that states the consequence.
- Performance targets: dashboard usable in under ~2.5 s on a mid-range phone on 4G; paginate large lists; avoid N+1 queries; add indexes backed by real query patterns.
- Accessibility: labelled inputs, ARIA for dialogs/menus, logical focus order, screen-reader-friendly charts (data table or summary alternative).

---

## 12. Suggested project structure (adapt to existing project)

```text
src/
  app/
    (auth)/login, forgot-password
    (app)/dashboard, customers, products, categories, inventory, orders,
          invoices, payments, ledger, map, visits, reports, expenses, settings
    api/
  components/ layout, navigation, dashboard, customers, products, inventory,
              orders, invoices, payments, reports, shared, ui
  lib/ supabase, auth, validations, calculations, formatting, pdf, maps, csv
  hooks/  types/  styles/
supabase/ migrations/  tests/  seed.sql
public/ icons/
design-references/
docs/ PROGRESS.md  SETUP.md  DEPLOYMENT.md
tests/ unit/  e2e/
```

---

## 13. Testing and acceptance criteria

### Unit tests (Vitest) — must exist and pass
Tax calculation (inclusive/exclusive, CGST/SGST vs IGST, discounts, round-off), invoice totals, FEFO batch allocation, payment allocation limits, outstanding/advance calculation, FY and invoice-number formatting, CSV escaping/formula-injection guard, INR formatting.

### Database tests
RLS isolation between two users; finalized-invoice immutability; negative-stock rejection; over-allocation rejection; idempotency (same key twice → one record); concurrent finalization yields unique, sequential invoice numbers.

### E2E tests (Playwright)
Workflows A–G at mobile (390×844) and desktop (1440×900); login/logout and route protection; no horizontal overflow at 360/390/430 px; PWA manifest reachable.

### Acceptance checklist
- **Visual:** tokens derived from references; persistent sidebar on desktop; compact bottom nav on mobile; all breakpoints usable; accessible contrast and focus.
- **Functional:** auth and protected routes; customer CRUD/archive; products/categories/variants; inventory ledger and batches; order lifecycle; invoice draft→finalize→PDF; GST gating works and non-GST never shows GST claims; payments/allocations/ledger reconcile; visits/follow-ups; map markers; reports on real data with filters and CSV export; expenses with receipts; global search; quick actions; PWA installable.
- **Data/security:** RLS tested; no service-role key in browser bundles; unauthorized requests rejected server-side; decimal-safe money; no duplicate invoice/payment submissions; finalized invoices immutable; constraints block invalid data.
- **Engineering:** `tsc`, lint, tests, and production build all pass; no important console errors; `.env.example` and setup docs exist.

---

## 14. Implementation phases (with exit criteria)

| Phase | Scope | Exit criteria |
|---|---|---|
| **1. Foundation** | Inspect project & references; Next.js/TS/Tailwind/shadcn setup; design tokens; Supabase clients, auth, RLS helper; responsive shell & navigation | Login works; shell renders correctly at all breakpoints; quality gate green |
| **2. Customers & products** | Customer list/forms/detail/search; products, categories, variants | CRUD + archive work; RLS tests pass for these tables |
| **3. Inventory & orders** | Ledger, batches, receive/adjust stock, orders & items | Movements only via functions; negative stock rejected; order lifecycle works |
| **4. Billing & payments** | Non-GST bill; GST guard + invoice; numbering; PDF; payments, allocations, ledger | Finalize is transactional & idempotent; immutability and balance tests pass |
| **5. Sales operations** | Map, visits/follow-ups, expenses, global search, quick actions | Workflows A, E complete; every quick action works |
| **6. Dashboard & reports** | Real KPIs, charts, reports, CSV export | Totals reconcile with source records; empty states correct |
| **7. PWA, QA, delivery** | Manifest/service worker, responsive & E2E suites, security review, docs | All §13 items verified; production build passes |

---

## 15. Final delivery requirements

Provide: (1) the working app in the existing project; (2) summary of what was implemented; (3) final route/page list; (4) schema and migration files; (5) `.env.example`; (6) instructions to create/configure Supabase and the **first admin user** (and to disable public sign-ups); (7) local run instructions; (8) Vercel + Supabase deployment instructions; (9) PWA install steps for Android/iPhone; (10) a **verification report** (what was tested and how, with results) and an honest list of limitations, unverified items, and any external credentials still needed.

---

## 16. Assumptions for the owner to confirm (the app must make each one configurable)

1. Business GST registration status and GSTIN — unknown; GST mode stays locked until set.
2. Financial year April–March; invoice prefix/format as in §3.5.
3. Prices default to tax-exclusive; round-off to nearest rupee on.
4. Stock issued at invoice finalization using FEFO; negative stock disallowed.
5. English UI only for now (strings centralized so Hindi/Gujarati can be added later).
6. Online-first PWA; offline data entry is not guaranteed.
7. Single owner login; roles (staff/salesperson) can be added later.

---

## Final instruction

Build a polished, reliable, mobile-first TAZQOR Business Manager using one Next.js + TypeScript codebase. Follow the design-reference screenshots for visual direction while creating original TAZQOR branding. Make mobile the priority and the laptop experience equally complete. Implement real data flows, database-enforced security and integrity, and accurate business calculations. Verify everything you claim. Do not stop at a static UI or a plan.
