# TAZQOR UI Fidelity Audit & Measurement Specification

**Document Version:** 1.0.0  
**Generated Date:** November 3, 2026  
**Status:** Audit Completed (Steps 1–4) — Execution Commencing (Step 5)  

---

## 1. Reference Inventory & Route Mapping (Step 1)

All 14 reference assets located in `design-references/` and `refrence/` were surveyed, dimensioned, cropped, and analyzed down to pixel-level coordinates.

| ID | Filename | Dimensions | Aspect Ratio | App Route / Viewport Role | Description & Key UI Elements |
|---|---|---|---|---|---|
| **REF-01** | `Screenshot 2026-11-01 at 4.51.25 PM.png` | 1586 × 1200 | 1.32 : 1 | Desktop Mockup Overview | Perspective 3D showcase of the primary desktop dashboard canvas. |
| **REF-02** | `Screenshot 2026-11-01 at 4.51.31 PM.png` | 1744 × 1214 | 1.44 : 1 | `/dashboard` (Master Desktop Canvas) | **Ground-Truth Unskewed Master Desktop Canvas** (Active viewport: 1659 × 1105 px). Full dashboard layout with icon rail, frameless header, hero month card, target bar, dual-spline sales chart, top-right particle charts, order cards, and gross/net profit cards. |
| **REF-03** | `Screenshot 2026-11-01 at 4.51.40 PM.png` | 1644 × 1226 | 1.34 : 1 | Desktop Perspective Angle 1 | Close-up perspective angle of top-right charts and orders column. |
| **REF-04** | `Screenshot 2026-11-01 at 4.51.46 PM.png` | 1442 × 1140 | 1.26 : 1 | Desktop Perspective Angle 2 | Angled close-up focusing on target progress bar and line chart. |
| **REF-05** | `Screenshot 2026-11-01 at 4.51.52 PM.png` | 1618 × 1218 | 1.33 : 1 | Desktop Perspective Angle 3 | High-angle perspective view of full desktop shell. |
| **REF-06** | `Screenshot 2026-11-01 at 4.51.59 PM.png` | 1650 × 1258 | 1.31 : 1 | Desktop Perspective Angle 4 | Tilted perspective view showing depth of frosted glass layers. |
| **REF-07** | `Screenshot 2026-11-01 at 4.52.05 PM.png` | 1630 × 1254 | 1.30 : 1 | Desktop Perspective Angle 5 | Low-angle perspective view focusing on the Gross & Net profit cards. |
| **REF-08** | `Screenshot 2026-11-01 at 4.52.11 PM.png` | 1634 × 1212 | 1.35 : 1 | Desktop Perspective Angle 6 | Angled overview showing floating sidebar rail and top navigation. |
| **REF-09** | `Screenshot 2026-11-01 at 4.52.20 PM.png` | 600 × 456 | 1.32 : 1 | Mobile Dashboard Top (`/dashboard`) | Dark-mode header mobile layout with gradient greeting, sales card, and electric lime target bar. |
| **REF-10** | `Screenshot 2026-11-01 at 4.52.34 PM.png` | 596 × 436 | 1.37 : 1 | Mobile Metrics / Quick Cards | Mobile view showing condensed quick metric cards, daily performance, and pill buttons. |
| **REF-11** | `Screenshot 2026-11-01 at 4.52.45 PM.png` | 610 × 452 | 1.35 : 1 | Mobile Navigation & Action Sheet | Mobile view displaying floating pill action buttons and bottom navigation rail. |
| **REF-12** | `Screenshot 2026-11-01 at 4.52.49 PM.png` | 448 × 326 | 1.37 : 1 | Mobile Charts View (`/reports`) | Mobile presentation of sales line chart and particle bar metrics. |
| **REF-13** | `Screenshot 2026-11-01 at 4.52.53 PM.png` | 432 × 320 | 1.35 : 1 | Mobile Orders / Activity List | Mobile cards for recent transfer, purchase orders, and sales activity. |
| **REF-14** | `Screenshot 2026-11-01 at 4.52.58 PM.png` | 418 × 322 | 1.30 : 1 | Mobile Summary & Profit | Mobile cards for profit margin, breakdown, and quick actions. |

### Extension to Pages Without Direct Reference Images
The remaining application pages (`/customers`, `/products`, `/inventory`, `/orders`, `/invoices`, `/payments`, `/map`, `/visits`, `/expenses`, `/settings`, `/login`) inherit and extend the identical visual design system:
1. **Canvas Background**: Continuous soft lavender-to-sage/mint diagonal gradient.
2. **Card Substrate**: Frosted glass panels (`rgba(255, 255, 255, 0.58)` + `backdrop-filter: blur(24px)` + `border: 1px solid rgba(255, 255, 255, 0.65)` + `rounded-[28px]`).
3. **Typography**: Light-weight sans (`font-light` / `font-normal`), sentence-case section labels, italic accents in headings, dark charcoal primary text.
4. **Interactive Accents**: Electric lime (`#E0FE52`) for primary calls-to-action, active indicators, and status highlights; solid black (`#000000`) for primary buttons and active navigation pills.

---

## 2. Quantitative Measurements & Exact Values (Step 2)

Measured directly from the unskewed master canvas (`1659 × 1105 px`) using Python PIL & NumPy sampling scripts:

### A. Color Palette & Gradients
- **Page Background Gradient**:
  - CSS: `linear-gradient(135deg, #dbd5e4 0%, #d8d5de 35%, #d1ced7 70%, #d6d9cf 100%)`
  - Top-left stop: `#dbd5e4` (soft lavender/pink-tinted grey)
  - Mid-center stop: `#d8d5de` / `#d1ced7`
  - Bottom-right stop: `#d6d9cf` (soft pale mint/sage grey)
- **Frosted Glass Cards**:
  - Fill: `rgba(255, 255, 255, 0.55)` to `rgba(255, 255, 255, 0.65)`
  - Backdrop Blur: `24px` (`backdrop-blur-xl`)
  - Border: `1px solid rgba(255, 255, 255, 0.65)`
  - Shadow: `0 12px 32px -4px rgba(0, 0, 0, 0.04), 0 4px 12px -2px rgba(0, 0, 0, 0.02)`
- **Electric Lime Accent**:
  - Hex: `#E0FE52` (RGB `224, 254, 82`)
  - Alternative highlights / active hover: `#D7F171` / `#D9F944`
- **Charcoal / Black**:
  - Deep Black: `#000000` (Used for active nav pill, net profit card, primary buttons)
  - Dark Charcoal: `#1E211C` / `#161718`
- **Text Hierarchy**:
  - Primary text: `#111113` (Sentence-case, font-light or font-normal)
  - Secondary text: `#5A5964` / `#6E6D7A`
  - Muted text: `#8A8996` / `#9CA3AF`
- **Card-Specific Fills**:
  - Gross Profit Card: `#E0FE52` (Electric Lime) with concentric white vector line rings (`opacity: 0.35`).
  - Net Profit Card: `#000000` with concentric grey/translucent rings and concave cutout notch.
  - Active Month Top Cap: `#E0FE52` on `#000000` active pill bar.

### B. Layout Geometry, Radii, & Spacing
- **Master Desktop Dimensions**: `1659 px` width × `1105 px` height.
- **Sidebar Rail**:
  - Width: `72 px` (centered in an `84 px` column).
  - Floating items: `44 × 44 px` circular icon buttons (`rounded-full`).
  - Active item: Solid black circle (`bg-black text-white shadow-md`).
  - Inactive item: Frosted circular button (`bg-white/50 hover:bg-white/80 text-neutral-800`).
  - Badges: `8 × 8 px` solid red dot indicators on Mail and Notification bells.
  - User Avatar: `44 × 44 px` circle at rail bottom.
- **Top Navigation Bar**:
  - Height: `76 px`, frameless and transparent.
  - Left: Logo icon (`36 × 36 px`) + "TAZQOR" brand wordmark.
  - Center: Segmented floating pill group (`Today`, `This Week`, `This Month`, `Reports`).
    - Active pill: `bg-black text-white px-5 py-2 rounded-full font-normal text-sm`.
    - Inactive pills: `bg-transparent text-neutral-600 hover:text-black px-4 py-2 text-sm`.
  - Right: "All Outlets" dropdown pill (`bg-white/60 px-4 py-2 rounded-full text-sm font-light border border-white/70`) + `40 × 40 px` black circular 3×3 grid icon button.
- **Card Corner Radii**:
  - Main feature cards (Hero, Line Chart, Top Right): `rounded-[28px]` (`border-radius: 28px`).
  - Order & Profit cards: `rounded-[24px]` (`border-radius: 24px`).
  - Pill badges & Buttons: `rounded-full`.
  - Knob handles: `rounded-full` (`24 × 24 px` white circle with 3 vertical micro-dots).
- **Grid Structure**:
  - Two primary macro-columns:
    - Left Column (`w-[62%]`): Hero greeting card (`h-[330px]`), Target progress bar card (`h-[100px]`), Sales Spline Chart card (`h-[400px]`).
    - Right Column (`w-[38%]`): Average Items & Sale Value card (`h-[330px]`), 3× Order cards stacked (`h-[100px]` each), Gross & Net Profit cards (`h-[180px]`).

### C. Typography Rules
- **Family**: Plus Jakarta Sans / Instrument Sans / Geist Sans (light geometric sans).
- **Weights**:
  - Headings: `font-light` (300) to `font-normal` (400). Never bold 700!
  - Greeting heading: `text-3xl font-light text-neutral-900 leading-tight`.
  - Accent Italic: The word *"here's"* in *"Hi Mike, here's what's happening in your stores"* is styled with `italic font-serif` or `italic font-light`.
  - Labels & Metrics: Sentence-case labels (e.g., "Sales this year", "Average items per sale", "Gross profit"), never uppercase tracked text.
  - Currency figures: `font-normal text-3xl tracking-tight text-neutral-900` formatted with ₹ (INR `en-IN` style).

### D. Chart Patterns & Visual Motifs
1. **Hatched / Striped Pattern Fills**:
   - 45-degree diagonal stripes (`patternUnits="userSpaceOnUse" width="8" height="8"` with `stroke="currentColor" strokeWidth="1.5"`).
   - Used in: Inactive upper sections of the 6 month pill bars, the target bar remainder track, and the tops of daily sale value bars.
2. **Dotted Particle Distribution Chart**:
   - Dotted vertical bar columns displaying discrete particle dots.
   - Month tags below with pill badge values (`11.4`, `8.1`, `2.1`, `7.3`, `12.5`).
3. **Daily Pill-Bar Chart**:
   - Pill-shaped vertical bars (`rounded-full`) with upper diagonal hatched stripes.
   - Negative value bars extending below the baseline for anomaly/return days.
4. **Dual Spline Curve**:
   - Top primary curve: Solid Electric Lime (`stroke="#E0FE52" strokeWidth="3"`).
   - Bottom comparison curve: Dashed Slate/Grey (`stroke="#94A3B8" strokeWidth="2" strokeDasharray="4 4"`).
   - Active hover cursor: Vertical guide line with two floating tooltip pills (one dark pill with lime metric, one light pill with comparison metric).
   - Scrubber track: Horizontal timeline track with `< jul >` black active month pill.
5. **Gross Profit Circular Notch & Net Profit Concave Cutout**:
   - Gross profit card has a circular cutout in the top-right corner holding a circular black `↗` button.
   - Net profit card has a corresponding concave notch and concentric circular ring artwork.

---

## 3. Current App State & Captured Routes (Step 3)

Automated Playwright captures saved in `ui-audit/current/`:

| Device / Viewport | Route | Filename | Status |
|---|---|---|---|
| Desktop (1659 × 1105) | `/dashboard` | `desktop_dashboard.png` | Captured (291 KB) |
| Desktop (1659 × 1105) | `/customers` | `desktop_customers.png` | Captured (139 KB) |
| Desktop (1659 × 1105) | `/products` | `desktop_products.png` | Captured (182 KB) |
| Desktop (1659 × 1105) | `/inventory` | `desktop_inventory.png` | Captured (140 KB) |
| Desktop (1659 × 1105) | `/orders` | `desktop_orders.png` | Captured (115 KB) |
| Desktop (1659 × 1105) | `/invoices` | `desktop_invoices.png` | Captured (135 KB) |
| Desktop (1659 × 1105) | `/payments` | `desktop_payments.png` | Captured (134 KB) |
| Desktop (1659 × 1105) | `/map` | `desktop_map.png` | Captured (112 KB) |
| Desktop (1659 × 1105) | `/visits` | `desktop_visits.png` | Captured (144 KB) |
| Desktop (1659 × 1105) | `/expenses` | `desktop_expenses.png` | Captured (125 KB) |
| Desktop (1659 × 1105) | `/reports` | `desktop_reports.png` | Captured (174 KB) |
| Desktop (1659 × 1105) | `/settings` | `desktop_settings.png` | Captured (134 KB) |
| Desktop (1659 × 1105) | `/login` | `desktop_login.png` | Captured (37 KB) |
| Mobile (390 × 844) | `/dashboard` | `mobile_dashboard.png` | Captured (310 KB) |
| Mobile (390 × 844) | `/reports` | `mobile_reports.png` | Captured (147 KB) |
| Mobile (390 × 844) | `/orders` | `mobile_orders.png` | Captured (142 KB) |
| Mobile (390 × 844) | `/customers` | `mobile_customers.png` | Captured (133 KB) |
| Mobile (390 × 844) | `/invoices` | `mobile_invoices.png` | Captured (141 KB) |

---

## 4. Component-by-Component Difference & Mismatch Audit (Step 4)

Side-by-side visual diffs generated in `ui-audit/compare/`:
- `desktop_dashboard_compare.png` (Overall Dashboard Mismatch: **59.89%**)
- `mobile_dashboard_compare.png`
- Component diffs: `component_topbar.png` (19.2%), `component_sidebar.png` (55.5%), `component_hero.png` (21.4%), `component_target.png` (63.2%), `component_line_chart.png` (76.1%), `component_top_right.png` (43.3%), `component_orders.png` (85.6%), `component_profit.png` (99.0%).

### Detailed Component Checklist

| Component / Area | Reference Target Specification | Current Implementation State | Audit Status | Severity |
|---|---|---|---|---|
| **Page Background** | 135deg gradient (`#dbd5e4` to `#d6d9cf`) | Flat neutral grey/white (`#F8FAFC`) | **MISMATCH** | **Critical** |
| **Navigation Shell (Sidebar)** | Slim floating circular icon rail (`w-11` round buttons, active = solid black circle, bottom badges + avatar) | Traditional rectangular full-height white sidebar with text labels | **MISMATCH** | **Critical** |
| **Top Navigation Bar** | Frameless transparent header with centered segmented pill tabs (`Today`, `This Week`, `This Month`, `Reports`), `All Outlets` pill, black 3×3 grid button | White navbar with big bold title, search input box, date dropdown, and separate tabs | **MISMATCH** | **Critical** |
| **Card Materiality** | Frosted translucent glass (`rgba(255,255,255,0.58)` + `backdrop-blur-xl` + `rounded-[28px]`, no opaque borders) | Opaque white cards (`#FFFFFF`) with 1px gray borders and `rounded-xl` (12px) | **MISMATCH** | **Critical** |
| **Typography & Tone** | Light geometric sans (`font-light`), sentence-case labels, italic word accent in greeting | Bold/semibold fonts (`font-bold`), uppercase tracked labels, no italic accents | **MISMATCH** | **High** |
| **Hero Greeting Card** | Light greeting with italic accent, 6 hatched pill month bars with active black/lime pill, sales stat + comparison | Generic KPI cards with standard bold text and solid bars | **MISMATCH** | **Critical** |
| **Sales Target Bar** | Electric lime progress fill with draggable-style knob handle (3 dots) and diagonal hatched remainder | Standard shadcn Progress bar (solid blue/lime fill, empty grey track, no knob) | **MISMATCH** | **Critical** |
| **Top-Right Charts** | "Average Items per Sale" dotted particle chart + "Average Sale Value" daily pill bars with hatched tops | Generic line and bar charts with standard axes | **MISMATCH** | **Critical** |
| **Main Sales Chart** | Dual spline curves (lime solid + grey dashed) with floating black/lime tooltip pills and month scrubber track | Standard Recharts line chart with generic tooltip box | **MISMATCH** | **Critical** |
| **Orders Column** | 3 stacked frosted cards ("Transfer", "Purchase Orders", "Purchase Orders") with top-right circular arrow buttons (`↗`) | Generic table widget or missing transfer order cards | **MISMATCH** | **Critical** |
| **Gross & Net Profit Cards** | Electric Lime card with concentric line art + circular notch button; Black Net Profit card with concave notch and concentric rings | Generic rectangular cards or missing cutouts | **MISMATCH** | **Critical** |
| **Accent Lime Hex** | Electric Lime `#E0FE52` (RGB 224, 254, 82) | Muted green/lime `#84CC16` / `#65A30D` | **MISMATCH** | **High** |
| **Button Overlap Bug** | Quick Action button cleanly positioned without collisions | Circular "N" button overlaps and clips Quick Action text | **MISMATCH** | **High** |
| **Data Integrity** | Live aggregated database calculations with ₹ (INR `en-IN` format) and honest empty states | Some static fallback numbers resembling reference placeholder text | **MISMATCH** | **High** |

---

## 5. Implementation Execution Plan (Step 5)

Now proceeding straight into Step 5 in accordance with the specified sequence:

1. **Phase 5.1 — Global Tokens & Design System**:
   - Configure global CSS gradient background, frosted glass variables, electric lime `#E0FE52`, radii (`rounded-[28px]`, `rounded-[24px]`), and light geometric typography in `src/app/globals.css` and Tailwind config.
2. **Phase 5.2 — App Shell Overhaul**:
   - Refactor `src/components/layout/Sidebar.tsx` into the floating circular icon rail with black circle active item, badges, and circular avatar.
   - Refactor `src/components/layout/TopHeader.tsx` into the frameless transparent header with centered segmented pill tabs and "All Outlets" filter.
   - Update `src/components/layout/BottomNav.tsx` for mobile viewports.
3. **Phase 5.3 — Custom SVG Pattern & Chart Components**:
   - Build `src/components/charts/DottedParticleChart.tsx` (Average Items per Sale).
   - Build `src/components/charts/DailyPillBarChart.tsx` (Average Sale Value with hatched tops & negative bars).
   - Build `src/components/charts/SalesSplineChart.tsx` (Dual spline curves, tooltip pills, month scrubber).
   - Build `src/components/dashboard/TargetProgressBar.tsx` (Electric lime fill, knob with 3 dots, diagonal hatched remainder).
   - Build `src/components/dashboard/ProfitCards.tsx` (Gross Profit lime card with concentric circles and circular notch + Net Profit black card with concave notch).
   - Build `src/components/dashboard/HeroMonthBars.tsx` (6 month bars with diagonal hatched sections and black/lime active pill).
4. **Phase 5.4 — Master Dashboard Overhaul (`/dashboard`)**:
   - Assemble the exact two-column macro-grid matching the master reference canvas.
   - Bind all components to live Supabase aggregations with fallback zeroes and INR `en-IN` formatting.
   - Fix button overlap bug.
5. **Phase 5.5 — Child Pages Harmonization**:
   - Apply matching frosted card styling, large radii, sentence-case typography, and electric lime accents across `/customers`, `/products`, `/inventory`, `/orders`, `/invoices`, `/payments`, `/map`, `/visits`, `/expenses`, `/reports`, `/settings`.
6. **Phase 5.6 — Re-capture, Diff Verification, & Quality Gate**:
   - Re-run Playwright captures and verify pixel diff is reduced below acceptable threshold.
   - Ensure all tests, typechecks, and builds pass cleanly.
