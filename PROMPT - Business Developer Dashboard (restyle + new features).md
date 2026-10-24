<!--
HƯỚNG DẪN DÙNG (cho bạn, không phải cho AI):
1. Mở AI/IDE ở thư mục `main` (hoặc đính kèm cả thư mục `main`).
2. Dán TOÀN BỘ nội dung từ dòng "# ROLE & GOAL" trở xuống làm prompt đầu tiên.
3. Kèm 2 ảnh style tham khảo (banner MoMo + màn "Giao dịch thành công") nếu AI nhận được ảnh.
4. Prompt viết bằng tiếng Anh vì code và UI của dự án là tiếng Anh.
-->

# ROLE & GOAL

You are a senior front-end engineer + product designer. You are working inside the folder `main` of the OctaP project: a **React 19 + TypeScript + Vite + Tailwind 4 + daisyUI 5** prototype ("the demo website") that runs entirely in the browser with fake data.

**Your mission (the whole assignment):**

1. **Restyle the whole Merchant / Business dashboard** (all 8 existing pages + the shared layout + the sign-in page) with the visual style described in section 6.
2. **Design and build the missing "business developer" screens** that the product spec (SRS) requires but the demo does not have yet (sandbox, mock transaction suite, real-time API logs, webhooks, billing, key lifecycle, etc. — section 7).
3. Keep everything **portable** so it can later be moved into the real repository `octap-web` (`apps/business`) — section 3 and 9.

Work in the codebase, make real changes, run it, and verify it. Start by writing a short plan (max ~30 lines), then implement without waiting for my approval unless you are truly blocked. If something is ambiguous, pick the most reasonable option, **write the assumption down** in your final report (section 12), and continue.

---

# 1. THE TASK I WAS GIVEN (Linear ticket, verbatim intent)

> **[Web] restyle the demo website for business developer's dashboard & place the result in octap-web**
> Acceptance criteria:
> - [ ] basing on the below images for style reference *(two MoMo screenshots — see section 6)*
> - [ ] create sub-issues that relate to business developer's dashboard *(one sub-issue per screen/feature; a note says each screen will have 3 estimates)*
>
> Labels: Front-end, UI/UX. Project: "OctaP Front-end". Related: "[Web] Initialize React project for the web interface" (already done — it created the empty `apps/business` app in `octap-web`).

**How I interpret it:** "the demo website" = this `main` prototype. "business developer's dashboard" = the logged-in portal for a partnered business (merchant) and its developers — in the prototype this is everything under `/merchant/*`. I want **all** of it restyled **plus** the missing developer-facing screens from the SRS. My own deliverable also includes a list of screens/features that can become Linear sub-issues (section 12).

---

# 2. PRODUCT CONTEXT (what OctaP is — read once, it explains the screens)

- **OctaP / OctaPoint** is an enterprise **Credit-as-a-Service (CaaS) loyalty platform on the Sui blockchain**. Businesses ("tenants" / "partners" / "merchants", e.g. *Lotus Mart*, *Phố Cà Phê*) run their own **tenant-isolated loyalty point token** (e.g. `LTM`) without handling blockchain complexity. Customers earn points at checkout and redeem them for vouchers. Every mint/burn is anchored on-chain, which makes the ledger fraud-proof and auditable. End users log in with a phone number (**zkLogin**), and gas fees are **sponsored** by OctaP (no crypto wallet needed).
- **Hard product limits (never contradict them in UI copy):** LI-1 points are isolated per merchant (no cross-merchant exchange, no P2P transfer); LI-2 points can never be cashed out; LI-3 the end-user apps are only integration references/test harnesses.
- **Actors (SRS):** Administrator (platform operator); **Partnered Business Owner** (campaigns, rewards, members, billing, team); **Partnered Business Developer** (API keys, SDK, sandbox, logs, webhooks, MCP, billing); Cashier/Viewer (limited merchant roles); End User.
- **Three portals** in the prototype: public landing (`/`), **Merchant/Business dashboard (`/merchant/*`) ← YOUR SCOPE**, Admin console (`/admin/*`), plus a phone-sized End-User wallet (`/wallet`).
- Key domain rules you must respect in logic and copy: monthly **mint cap** per plan; points earned = floor(bill ÷ 10,000 × earn rate) + at most one campaign bonus; **Idempotency-Key** on every business operation; amounts are non-negative integers; secret keys are shown **once**; every sensitive action is audited; RBAC by merchant role (viewer < cashier < manager < owner).

---

# 3. REPOSITORY MAP

You only see `main`. For context, the surrounding workspace is:

| Path | What it is | Relevance |
|---|---|---|
| `main/` | **The demo website you work in** (merchant + admin + wallet + landing, all mocked) | ✅ your workspace |
| `lotus-mart-loyalty/` | Separate React site for Lotus Mart *members* (consumer side) | ❌ unrelated, no shared code |
| `lotus_mart_mobile/` | Separate Flutter consumer app | ❌ unrelated |
| `STYLEGUIDE.html` (also copied in `main/`) | "OctaP Design System" reference | ✅ read it |
| `octap-web/` (outside this workspace) | **The real monorepo**: `apps/landing` (done), `apps/business` (**empty — final home of your result**), `apps/admin` (empty), `packages/shared` (shared daisyUI theme/tokens) | 🎯 future destination |

Because the result will be ported into `octap-web/apps/business`, follow these portability rules:
- Put new business-portal code under `src/app/merchant/**` (pages) and keep reusable pieces in `src/components/**`. Do **not** spread business-portal logic into `admin`, `wallet` or `landing`.
- `octap-web` conventions you should anticipate: Prettier `semi: true, singleQuote: true, printWidth: 100` (this prototype uses double quotes — new files may use either, but be consistent inside a file); shared theme lives in `packages/shared/src/styles/{theme,tokens,utilities}.css` with the **same palette** as this prototype's `src/theme.css` (daisyUI theme name `octap`); React Compiler is enabled in `apps/business`; the real app will get a real API later, so **keep all data access behind `services/` + `queries/`** (never call `localStorage`/mock DB from components).
- Keep styling in **design tokens** (CSS variables / daisyUI theme), not scattered hex values, so the style can move into `packages/shared` as-is.

---

# 4. CURRENT STATE OF `main` (facts — verify by reading the code)

**Read first:** `main/README.md`, `main/.docs/SCOPE.md` (product scope FE-01…FE-05, LI-1…LI-3), `main/STYLEGUIDE.html`, `src/theme.css`, `src/index.css`, `src/app/router.tsx`.

## 4.1 Stack & tooling
React 19, TypeScript ~6 (`erasableSyntaxOnly`, `verbatimModuleSyntax`, `noUnusedLocals/Parameters` → **no enums/namespaces/parameter properties; use `import type`**), Vite 8, Tailwind 4 (`@tailwindcss/vite`), **daisyUI 5**, `@base-ui/react` (headless primitives: Dialog, Tabs, Form, Field, Checkbox…), `@tanstack/react-query` v5, `@tanstack/react-table` v9, `react-router` v8, `phosphor-react` icons, `clsx` + `tailwind-merge` (`utils/cn.ts`). Scripts: `npm run dev` (port 5173), `npm run build` (= `tsc -b && vite build`), `npm run lint`.

## 4.2 Structure
```
src/
  app/            router.tsx, guards.tsx, landing/, auth/, merchant/ (layout index.tsx + pages/), admin/, wallet/
  components/     layout/ (PortalLayout, SidePanel, MainToolbar), shared/ (Button, Controls, Display, DataTable, Modal, Select, Toaster, table.ts), charts/ (AreaChart, BarChart, Donut, Sparkline), dev/MockApiConsole.tsx
  services/       merchant.service.ts, admin.service.ts, wallet.service.ts, auth.service.ts, session.ts, core/ (ledger, analytics, staff), mock/ (db.ts, http.ts, seed.ts, random.ts)
  queries/        react-query hooks (merchant.ts, admin.ts, wallet.ts, useSession.ts, client.ts)
  types/domain.ts all domain types
  utils/          cn, format (fmtCompact, fmtVnd, fmtDate, fmtRelative, toTitle…), errors, toast, constants
```

## 4.3 The pseudo-backend (important)
- Every service call goes through `simulate("METHOD /path", handler)` in `services/mock/http.ts`: adds latency, can inject failures, runs a handler against an in-memory DB, deep-clones the result, and logs the call (shown in the **Mock API** drawer, `components/dev/MockApiConsole.tsx`).
- Handlers throw `ApiError(status, code, message, fieldErrors?)` like a real server; forms read `fieldErrorsOf(error)` / `formErrorOf(error)` from `utils/errors.ts`.
- DB = `services/mock/db.ts` persisted to `localStorage` key `octap.mockdb`. **If you change the seed shape, bump `DB_VERSION` in `services/mock/seed.ts`** or old stored data will break. `resetDb()` exists (button in the Mock API drawer).
- Session = `services/session.ts` (`octap.session` in localStorage). RBAC helpers: `requireMerchant(minRole)`, `hasMerchantRole(role, min)`.
- Existing merchant endpoints (`merchant.service.ts`): `getTenant, updateTenant, getOverview, list/create/update/delete Campaign + setCampaignStatus, listRewards/createReward/setRewardStatus/restockReward, listMembers/getMember/adjustMemberPoints, listTransactions, quote, issuePoints, listApiKeys/createApiKey/revokeApiKey, updateMcp, listTeam/inviteTeammate/updateTeammate`.

## 4.4 Accounts for testing
Password for all demo accounts: `octap123`. `owner@lotusmart.vn` (Merchant Owner, tenant Lotus Mart, Enterprise plan, token LTM), `cashier@lotusmart.vn` (limited), `manager@phocaphe.vn` (Manager, Phố Cà Phê, Growth plan), `admin@octap.io` (Platform admin). Wallet OTP: `123456`.

## 4.5 Current design tokens (daisyUI theme, `src/theme.css` + `src/index.css`)
primary `#9f0261` (magenta), secondary `#002b49` (navy), accent `#33bbf6`, success `#88c057`, warning `#f39c12`, error `#d9383a`, info `#33bbf6`, base `#ffffff/#fafafa/#eaeaea`, ground `#faf7f9`, ink `#17111a`. Radii: box 0.7rem, field/selector 0.4rem. Fonts: Figtree (body), Archivo (display), Space Mono (mono). Light + a dark theme block exists.

## 4.6 Current screens in the Business dashboard (ALL must be restyled)

Layout (`PortalLayout`): top bar with logo "OctaP | {Tenant name}", global member search, **Mock API** button; left side panel with nav + tenant chip ("Lotus Points · LTM · Enterprise plan") + user card + **Log-out**. Nav (Developers only for manager+): Dashboard, Issue points, Campaigns, Rewards, Members, Transactions, Developers, Settings.

| # | Route | Page | What exists today |
|---|---|---|---|
| 0 | `/login` | Sign-in | Email + password, "Forgot password?" dialog, 4 demo-account quick-fill buttons (Platform admin, Merchant owner, cashier, manager), left marketing pillars (tenant-isolated points, fraud-proof ledger, zero Web3 friction) |
| 1 | `/merchant` | Dashboard | Range tabs 7/30/90d; 4 KPI cards with sparklines (Revenue from members, LTM issued, LTM redeemed, New members); **Points flow** area chart; **Treasury** card (outstanding liability, minted this month vs cap, member tier mix donut); **Live campaigns** list (ROI, budget bar); **Latest transactions** list; "Issue points" button |
| 2 | `/merchant/pos` | Issue points | "Checkout" card: member phone, channel select, bill amount + quick-amount chips, **Points preview** (base + campaign bonus = total), "Award points" button; right: success result panel (+N LTM, new balance, Tx digest, checkpoint, sponsored gas) and **Equivalent SDK call** code card |
| 3 | `/merchant/campaigns` | Campaigns | 4 stat cards (live campaigns, points issued, attributed revenue, blended ROI); search + tabs All/Running/Scheduled/Drafts/Ended; table (Campaign, Status, Budget bar, Participants, Revenue, ROI, Window) + row menu (Edit, Pause, End now, Delete draft); **New campaign** dialog (name, description, mechanic multiplier/spend threshold/signup bonus/fixed bonus, multiplier or bonus points, min bill, points budget, cost per point with max-cost hint, start/end, "Publish immediately" switch); confirm dialogs |
| 4 | `/merchant/rewards` | Rewards | Tabs All/Live/In review/Inactive; reward cards (title, description, cost in LTM, "worth …₫", redeemed/left progress, expiry, status Active/Paused/Pending Review/Expired, Pause/Resume/Restock); **New reward** dialog (title, description, category, point cost, face value + ₫/point hint, stock, expires on, LI-1/LI-2 notice, "Submit for review"); Restock dialog |
| 5 | `/merchant/members` | Members | Search; table (member, tier, balance, lifetime earned, redeemed, joined, last active), pagination; **member dialog** (4 stats, tier, zkLogin address, adjust points ± with required audited reason, history table with Sui tx digests, vouchers) |
| 6 | `/merchant/transactions` | Transactions | Filters (member/digest search, type, channel), ledger table (time, type, member, points, detail, channel, status, Sui tx with copy/explorer link, gas), pagination |
| 7 | `/merchant/developers` | Developers (manager+) | 3 tabs: **API keys** (table: name, masked key + live/test badge, scopes chips, usage 30d, last used, status Active/Revoked, Revoke; **Create key** dialog: name, environment Test/Live, 6 scopes; **Save your secret key** dialog shown once with copy + warning; **Revoke** confirm) · **SDK quickstart** (4 code cards: Install, Initialise, Earn at checkout, Redeem with zkLogin consent; copy buttons) · **MCP server** (enable switch, 6 tool switches with read/write badges, connect-an-agent JSON, "n of 6 tools exposed"; owner-only; plan-gated) |
| 8 | `/merchant/settings` | Settings | **Loyalty program** form (point display name, token symbol read-only, base earn rate, brand color, contact email/phone, Save); **Plan & limits** (plan, monthly mint cap bar, treasury object, Move package; note "plan and cap changes are handled by OctaP operators"); **Team** table (member, role dropdown, status Active/Invited, last sign-in, Disable) + **Invite a teammate** dialog (email, role Owner/Manager/Cashier/Viewer with descriptions) |

Shared building blocks to reuse/upgrade rather than duplicate: `PageHeader, Card, StatCard, StatusBadge, EmptyState, ErrorState, LoadingBlock, Skeleton, UsageBar, TierBadge` (Display.tsx); `FormField, TextInput, Switch, Segmented, CopyButton, ChainRef` (Controls.tsx); `Select`, `Modal`, `ConfirmDialog`, `DataTable` (TanStack), `Toaster`/`notify`, charts (`AreaChart, BarChart, Donut, Sparkline`).

## 4.7 What is NOT built yet (the gap — see section 7)
Sandbox / isolated testing, Mock Transaction Suite, real-time API/SDK logs (only a dev drawer exists), webhook endpoints, key rotation + editing scopes, a developer overview/health page, **billing** (plan selection, payment method, invoices), usage-vs-quota views, report export, organization change requests (business info / sub-domain). Also `Transactions` has no export.

---

# 5. OUTPUT QUALITY BAR

- Looks like a **polished product**, not a template: consistent spacing, hierarchy, empty/loading/error states on every data view, skeletons, inline validation messages, success toasts, confirm dialogs for destructive actions.
- **Responsive** (≥1280 desktop primary; tablet 768 works; phones degrade gracefully — side panel becomes a drawer), **accessible** (AA contrast — check pink-on-yellow; visible focus rings; labels on all inputs; keyboard-operable dialogs/tabs; icons have text or aria-labels; respects `prefers-reduced-motion`).
- UI copy in **English** (like the existing UI). Numbers/dates via existing `utils/format`. Money in VND with `₫`, points as integers with thousands separators.
- No dead buttons: every button/link you add must do something against the mock services, or be visibly disabled with a reason.

---

# 6. VISUAL STYLE TO APPLY (reference = two MoMo screenshots attached to the ticket)

Use MoMo's *visual language as inspiration only*. **Do not copy MoMo's logo, photos, wording, or brand assets.** OctaP's primary magenta `#9f0261` is already close to MoMo's pink, so brand continuity is easy.

What the references show (describe-and-apply):
1. **Banner / hero blocks:** soft **butter-yellow ground** with a subtle striped/ticket-like border; very bold near-black headline, with **one accent phrase in a pink handwritten/script italic** ("kết nối" style); a lighter grey sub-line; a row of **3 rounded-square icon chips** (thin outline icons: plane / SIM / globe) in a white bordered strip; a framed illustration on the right with a **pink frame and ticket-notch cut edges**.
2. **Result/receipt screen ("Giao dịch thành công"):** page header with a **pink→white gradient**; a white **receipt card** with **perforated notches on both sides** and **dashed separators**; a big green **check-in-circle**; the amount in large bold; a light **blue outlined info banner**; label-left / value-right rows with pink link-style values (transaction id); a small **green "completed in 1.4s ⚡" chip**; bottom actions = one **outlined pink pill button + one filled pink pill button**; below it, compact **widget cards** (game card, "spending management" card with a soft blue gradient and a small outlined CTA).
3. General feel: friendly, warm, rounded (16–24px radii), airy spacing, bold type, one strong brand color + warm neutrals, soft shadows, playful but trustworthy.

**Translate that into tokens + patterns (you decide exact values, document them):**
- Surfaces: warm ground (butter-yellow tint for hero/banner zones, near-white elsewhere), white cards, radius 16–20px, 1px warm-grey borders, soft layered shadow. Keep the `primary #9f0261`; add tints (`primary-50/100`), a **butter/cream** token, and a **pink-wash gradient** token.
- Buttons: **pill** (fully rounded) — primary filled pink, secondary outlined pink, quiet text button; sizes sm/md/lg; loading spinner state; consistent disabled state.
- Typography: keep Figtree/Archivo; add **one script/handwritten accent font that supports Vietnamese diacritics** (e.g. Caveat, Dancing Script, or Pacifico) used **sparingly** — a single accent word in page titles/hero cards/empty states only. Never for body text or data.
- Components to create/upgrade: **PageHeader with optional banner variant** (butter background + icon-chip strip + accent word + illustration slot built from CSS/SVG, no external images); **Receipt card** (notches via CSS mask/radial-gradient, dashed dividers) — use it for: Issue-points success panel, API secret-key dialog, Mock-transaction result, Invoice detail; **Info banner** (blue outline), **Success chip** (green ⚡ "completed in Xs"), **Icon chip** (rounded square, thin outline icon, tinted background), **Stat card** variants, **Status pills**, **Segmented control**, **Tabs** (pill style), table styling (airy rows, sticky header, hover), **empty-state illustrations** (simple inline SVG).
- Charts: restyle `AreaChart/BarChart/Donut/Sparkline` to the new palette (pink primary, soft yellow/blue secondaries) with rounded line caps and soft gradients.
- Motion: subtle (150–250ms) hover/press/enter transitions; number count-up optional; no heavy animation.
- Dark mode exists in the theme file; keep it working (or consciously keep light-only and say so in the report). Do not leave it broken.

**Scope of restyle:** the entire `/merchant/*` portal + layout + `/login`. Changing global tokens will cascade into `/admin`, `/wallet`, `/` — **do not break them**; quickly smoke-test them. Restyling those three is *not* required.

---

# 7. FEATURES TO ADD (gap list, with design specs)

Navigation idea (adjust if you find better; keep role rules): group the sidebar into **Overview · Loyalty** (Issue points, Campaigns, Rewards, Members, Transactions) **· Developers** (Overview, API keys, Webhooks, API logs, Sandbox & mock transactions, SDK & MCP) **· Billing · Settings**. Add an **environment switcher (Test | Live)** in the top bar for the Developers section; Test mode shows a persistent "Test mode — no real points move" banner.

Role rules: Developers section → **manager+** (as today); writes (create/rotate/revoke keys, webhooks CRUD, MCP toggles, plan/payment changes) → **owner** unless noted; managers can view and run sandbox tests. Billing → **owner** edit, **manager** read-only, others hidden. Enforce in **both** nav visibility and mock handlers (`requireMerchant`).

For **every** feature below provide: loading skeleton, empty state, error state with retry, validation messages, toasts, confirm dialogs for destructive actions, and mock service + query hooks + types.

## P0 — must ship

### 7.1 Developer overview ("Technical management", SRS use case 58)
- Route `/merchant/developers` (index). Header banner variant with accent word and icon chips (key, webhook, terminal).
- **Stat cards (period 7/30/90d):** API calls, success rate, p95 latency, active keys, webhook delivery success.
- **Usage vs plan quota** meters (API calls, webhook endpoints, mint cap, MCP) using `UsageBar`.
- **Getting-started checklist** (stateful): ① Create a test key ② Run a mock transaction ③ Register a webhook ④ View it in API logs ⑤ Create a live key ("Go live"). Each item deep-links; completed items get a green check.
- **Service status** list (REST API, Webhooks, MCP server) with status pills and latency (reuse Admin Metrics concept).

### 7.2 Sandbox & isolated testing (use cases 51, 52)
- Environment switcher Test/Live (see above). In **Test**: data comes from a separate **sandbox dataset** (own members, balances, rewards, campaigns) isolated from live data; test keys only.
- **Sandbox page** (`/merchant/developers/sandbox`): sandbox members table (phone, balance, tier), **Add test member** dialog (phone, starting balance), **Reset sandbox** (confirm dialog; restores seed), explainer card ("Test keys never touch real balances"), link to Mock transactions.
- Live mode must never show sandbox rows and vice-versa. Keys: `env: "test" | "live"` already exists — use it to route requests.

### 7.3 Mock Transaction Suite (use case 53)
- Route `/merchant/developers/sandbox/transactions` (or a tab inside Sandbox). Two-column layout.
- **Left — Scenario builder:** scenario select (*Earn points, Redeem reward, Adjust points, Expire points*), **preset chips** (*Happy path, Insufficient balance, Duplicate Idempotency-Key, Mint cap reached, Tenant suspended, Network timeout, Invalid scope*), fields (test key select showing scopes, member phone, bill amount **or** reward select, channel SDK/POS/MCP, **Idempotency-Key** auto-generated with a regenerate icon), buttons **Run** (primary pill) and **Run ×10** (burst), **Reset form**.
- **Right — Result (receipt card):** status chip (Success/Failed), HTTP status, latency, error code + human message for failures, points awarded / balance after, fake Sui digest (`ChainRef`), collapsible **Request / Response JSON** with copy, **Equivalent SDK call** code; **"completed in X s ⚡"** chip.
- **Run history** (last 20): scenario, status, latency, time, **Re-run**, **Open in logs**.
- Scenario semantics must match the real engine rules: scope check → idempotency (same key returns the *original* response with `idempotent_replay: true`, no second transaction) → mint cap → balance/stock → suspended tenant. Reuse `core/ledger.ts` logic where possible; run against the **sandbox dataset**.
- Every run appends to **API logs** (7.4) and fires matching **webhook deliveries** (7.5).

### 7.4 Real-time API / SDK logs (use case 55)
- Route `/merchant/developers/logs`. Replace the "dev drawer only" experience with a first-class page (keep the Mock API drawer for prototype tooling).
- **Toolbar:** **Live** toggle (pulsing dot; Pause/Resume), environment, method chips (GET/POST/PUT/DELETE), status-class chips (2xx/4xx/5xx), key select, channel (REST/SDK/MCP), search (path, idempotency key, request id), time range, **Clear**, **Export JSON/CSV**.
- **Table (virtual-ish, newest first):** time, method, path, status (colored pill), latency, key prefix + env badge, channel, idempotency key (truncated + copy). Auto-append new rows while Live is on (mock stream: seeded history + a timer that appends realistic entries; also appends for every mutation the user performs in the app).
- **Row → right-side drawer:** request id, timestamp, masked headers (`Authorization: Bearer ocp_test_…`), request body, response body, error code/message, linked tx digest, linked webhook deliveries; **Replay in sandbox** button (opens the Mock Transaction Suite pre-filled; disabled for live).
- Max retained rows (e.g. 500), empty state ("No requests yet — run a mock transaction"), a rate-limit/5xx highlight.

### 7.5 Webhook endpoints (use case 56; entity *Webhook Endpoint*)
- Route `/merchant/developers/webhooks` (list) and detail drawer/page.
- **List:** URL (truncated), description, env badge, subscribed-events count, 24h success rate (small bar), last delivery (time + status), status (Active/Disabled/Failing), row actions (Send test event, Disable/Enable, Delete). **Add endpoint** button (owner).
- **Add/Edit endpoint dialog:** URL (must be `https://`; `localhost` allowed only in Test), description, environment, **event multi-select grouped** — Points (`points.earned`, `points.redeemed`, `points.expired`), Members (`member.created`, `member.tier_changed`), Campaigns (`campaign.started`, `campaign.ended`), Keys (`api_key.created`, `api_key.revoked`), Billing (`invoice.paid`, `invoice.failed`) — with "Select all" per group; Save. After creating: **signing secret** (`whsec_…`) shown **once** in a receipt-style dialog with copy + warning (same pattern as API secret key).
- **Detail:** tabs **Overview** (config, secret fingerprint, **Rotate secret** with confirm), **Deliveries** (table: event, time, HTTP status, attempts, duration, next retry; expandable payload + response; **Retry** for failed ones; filter by status), **Settings** (Disable/Enable, Delete with typed confirmation).
- **Send test event:** choose an event type → creates a delivery to the endpoint (mock result succeeds/fails based on URL pattern, e.g. URLs containing `fail` return 500) → toast + appears in Deliveries and API logs.
- Show the retry policy text ("up to 5 attempts, exponential back-off") and a small signature-verification code snippet (HMAC SHA-256 header `OctaP-Signature`).
- Plan limit on endpoints (e.g. Starter 2, Growth 5, Enterprise 20) with a friendly "upgrade" message.

### 7.6 Billing (use cases 59–62; entities *Subscription, Billing Plan, Invoice, Payment Method*; BR-11)
Route group `/merchant/billing` with tabs **Plan & usage · Payment method · Invoices**.
- **Plan & usage:** current-plan card (name, monthly price in ₫, status Active/Past due/Canceled, next renewal date), usage meters (points minted vs mint cap, API calls vs quota, webhook endpoints, team seats, MCP access yes/no), buttons **Change plan** and **Cancel subscription** (confirm; reverts at period end).
- **Choose billing plan** (modal or full page): **3 plan cards** — Starter / Growth / Enterprise — with price (monthly/yearly toggle, yearly shows saving), included mint cap (Starter ≈ 400K, Growth ≈ 1.5M, Enterprise ≈ 5M pts/month — matches the seed), API quota, webhook endpoints, MCP access (Growth+), support level; current plan marked; **recommended** badge; selecting shows a **summary + proration note**; **Confirm** requires owner. Block downgrade when current usage exceeds the target plan (error message explaining why). Invent plausible demo prices and label them "demo pricing".
- **Payment method:** the card on file (brand, •••• last4, expiry, billing email) in a card-style visual; **Add / Update payment method** dialog (cardholder name, card number with Luhn check + brand detection + spacing mask, expiry MM/YY validation, CVC, billing email, optional tax code); **Make default**; **Remove** (blocked if it's the only method on an active paid subscription). **Never store/echo full card numbers** — only brand + last4; show a "test cards only" hint.
- **Invoices:** table (Invoice #, period, amount, status Paid/Open/Failed/Void, due date, payment method), filters (status, year), pagination; row → **Invoice detail** in a **receipt card** (line items: plan fee, API overage, etc., tax, total, payment method) with **Download PDF** (client-side print-friendly view is fine) and, for failed invoices, **Retry payment**. A **warning banner** on the Billing page and a small badge in the sidebar when an invoice is Open/Failed.
- Reconcile with Settings: the Settings "Plan & limits" card currently says plan/cap changes are handled by operators. Update the copy to link to Billing for plan changes, and note that **Admin can still override the mint cap** on the admin partner page. Mention this decision in your report.

## P1 — should ship

### 7.7 API key lifecycle upgrades (use case 54; entity *API Credential* + *API Scope*)
- Row actions on `API keys`: **Edit scopes** (dialog with the 6 scopes, each with description and the endpoints it unlocks), **Rotate key** (generates a new secret shown once; the old secret keeps working for a 24h grace period — show a "Rotating" status and countdown), **Revoke** (existing).
- Add per-key **usage sparkline**, **environment filter**, **last used IP/country** (mock), and a collapsible **Scope reference table** (scope → endpoints → example).
- Toasts: reuse MSG17 style wording ("API credential rotated/revoked successfully.").

### 7.8 Transactions & reports (use case 72)
- Transactions page: add **date range** filter and **Export CSV** (current filters). 
- New **Reports** page (`/merchant/reports`): choose type (*Transaction reconciliation, Points liability, Campaign ROI*), date range, format (CSV/PDF-print), **Generate** → appears in a "Recent reports" list with status (Generating/Ready) and download. Everything generated client-side from mock data.

### 7.9 Notifications / activity center
- Bell icon in the top bar → popover with the latest developer-relevant events (failed webhook, invoice due, key about to expire, mint cap > 80%). Mark all read.

## P2 — nice to have
### 7.10 Organization change requests (use cases 63–71; entity *Organization Change Request*; BR-13)
- In Settings: **Business information** card (legal name, tax code, address) and **Sub-domain** card (e.g. `lotusmart.octap.io`, with availability check). Changes create a **change request** with status *Pending → Approved/Rejected* (banner + history list); changes only take effect once approved (BR-13). Add the matching minimal approve/reject action in the Admin partner detail (mock only) so the flow is testable end-to-end.

---

# 8. DATA MODEL ADDITIONS (suggested; keep names consistent with `types/domain.ts`)

Add types + seed data + services + react-query hooks for: `SandboxMember`, `ApiRequestLog { id, ts, env, method, path, status, latencyMs, keyId, keyPrefix, channel, idempotencyKey, requestBody, responseBody, errorCode, txDigest, webhookDeliveryIds }`, `MockRun { id, scenario, status, latencyMs, ts, request, response }`, `WebhookEndpoint { id, tenantId, url, description, env, events[], status, secretFingerprint, createdAt }`, `WebhookDelivery { id, endpointId, event, ts, status, httpStatus, attempts, durationMs, nextRetryAt, payload, response }`, `BillingPlan`, `Subscription`, `Invoice`, `PaymentMethod { brand, last4, expMonth, expYear, isDefault }`, `ReportJob`, `OrgChangeRequest`, `Notification`. Extend `ApiKey` with `rotatingUntil?`, `lastUsedIp?`. Add new service files rather than bloating `merchant.service.ts` (e.g. `developer.service.ts`, `billing.service.ts`), each using `simulate(...)` and `requireMerchant(min)`. **Bump `DB_VERSION`.**

---

# 9. IMPLEMENTATION PLAN (follow this order)

1. **Recon (no code):** read the docs/files listed in section 4, run `npm install && npm run dev`, click through every page with each demo account, note issues. Run `npm run build && npm run lint` to record the baseline (fix nothing unrelated).
2. **Design foundation:** update tokens in `theme.css`/`index.css` (colors, radii, shadows, fonts incl. accent script font, gradients); upgrade shared components (`Button`, `Card`, `PageHeader` banner variant, `StatCard`, `StatusBadge`, `Modal`, `Controls`, `DataTable`, `EmptyState`, `Toaster`, charts) + new `ReceiptCard`, `InfoBanner`, `IconChip`, `SuccessChip`. Create a small internal **component gallery** route (e.g. `/dev/kit`, dev-only) to eyeball variants.
3. **Layout:** restyle `PortalLayout / SidePanel / MainToolbar`; grouped nav; env switcher; notifications bell; responsive drawer.
4. **Restyle existing pages** in this order: Login → Dashboard → Issue points → Campaigns → Rewards → Members → Transactions → Settings → Developers (current tabs).
5. **Build P0 features** in order: 7.1 overview → 7.2 sandbox dataset → 7.3 mock suite → 7.4 logs (they depend on each other) → 7.5 webhooks → 7.6 billing.
6. **Build P1**, then **P2** if time allows.
7. **Hardening:** loading/empty/error states, keyboard & screen-reader pass, responsive pass, dark-mode check, smoke-test `/admin`, `/wallet`, `/`.
8. **Quality gates:** `npm run build` and `npm run lint` must pass with no new warnings; no `any` without justification; no unused code.
9. **Portability notes** (section 12) for moving into `octap-web/apps/business`.

Technical gotchas: no enums/namespaces; `import type` for types; keep components free of storage/mock access; one query-key factory per domain like `merchantKeys`; invalidate relevant queries after mutations; keep `src/app/router.tsx` the single place for routes; guard routes with `RequireRole`/role checks **and** the mock handlers.

---

# 10. CONSTRAINTS

- Do **not** introduce a real backend, real payment processing, real card storage, or real network calls (only the existing mock layer).
- Do **not** modify `lotus-mart-loyalty`, `lotus_mart_mobile`, or anything outside `main`.
- Do **not** break existing flows, demo accounts, or the `/admin`, `/wallet`, `/` portals.
- Do **not** add heavy dependencies; prefer what is installed. If you truly need one (e.g. a form/date library), justify it and list it in the report so it can be added to `octap-web`.
- Do **not** use MoMo's brand assets, text, or photography. Do not use remote images (inline SVG/CSS only).
- Respect product limits LI-1/LI-2/LI-3 in all copy.

---

# 11. ACCEPTANCE / TEST FLOWS (I will run these)

Sign in at `/login` (password `octap123`).

**A. Style & layout (owner@lotusmart.vn):** every one of `/merchant`, `/pos`, `/campaigns`, `/rewards`, `/members`, `/transactions`, `/developers/*`, `/billing`, `/settings`, `/login` follows the new style consistently; hover/focus/disabled/loading/empty/error states exist; resize to tablet width works; side panel collapses to a drawer.

**B. Existing flows still work:** issue points to `0901234567` (520.000 ₫) → success receipt; create & pause & end a campaign; list a reward then restock; adjust a member's points (reason required); filter transactions; invite a teammate; edit loyalty settings.

**C. Developers (owner):**
1. Overview shows stats and the checklist (all unchecked on a fresh DB).
2. Create a **Test** key (scopes `points:earn`, `balances:read`) → secret shown once → checklist step 1 ticks.
3. Sandbox: reset, add a test member `0911111111` with 1,000 balance.
4. Mock suite: run **Happy path** earn → success + digest; run it again with the **same Idempotency-Key** → `idempotent_replay: true`, no balance change; run **Insufficient balance** redeem → failure message; run **Mint cap reached**, **Tenant suspended**, **Invalid scope** (key without `points:redeem`) → correct errors. History lists all runs.
5. Logs: all runs appear (Live on); filter 4xx; open a row → drawer with request/response; **Replay in sandbox** pre-fills the suite; Pause stops new rows; Clear empties; Export works.
6. Webhooks: add endpoint `https://example.com/hook` subscribed to `points.earned` → secret shown once; run an earn → a delivery appears (200); add endpoint `https://example.com/fail` → deliveries fail, **Retry** works, endpoint becomes **Failing** after repeated failures; rotate secret; disable; delete (typed confirmation).
7. Keys: edit scopes, **rotate** (grace period state), **revoke**; revoked key's mock calls return 401 and show in logs.
8. Live mode never shows sandbox data.

**D. Billing (owner):** view plan & usage; open **Choose plan**, try downgrade Enterprise → Starter (blocked with usage message), upgrade a Growth tenant (`manager@phocaphe.vn`'s tenant — switch accounts) to Enterprise (owner needed; confirm manager is read-only); add/update a card (Luhn-invalid number rejected, expired date rejected, only last4 displayed); invoices table with filters; open an invoice receipt; failed invoice → **Retry payment** → becomes Paid; warning banner/badge disappears.

**E. RBAC:** `cashier@lotusmart.vn` sees no Developers/Billing; `manager@phocaphe.vn` sees Developers (read + sandbox runs) and Billing (read-only) but cannot create keys/webhooks/change plan/toggle MCP; hitting forbidden actions via the mock layer returns a friendly 403 message.

**F. Regression:** `/admin` (try Partners, Vouchers, Audit — note the new `apikey.rotate`/`webhook.*`/`billing.*` events should appear in System Audit), `/wallet` (OTP `123456`), and `/` still load and look sane.

**G. Quality:** `npm run build` ✅, `npm run lint` ✅, no console errors in the flows above.

---

# 12. WHAT TO DELIVER (final report format)

1. The working code in `main` (no stray debug code).
2. A markdown file **`main/.docs/BUSINESS_DASHBOARD_RESTYLE.md`** containing:
   - **Design decisions:** final tokens (colors, radii, shadows, fonts), component inventory (new/changed), patterns (receipt card, banner header…), dark-mode status.
   - **Screen inventory table:** route → purpose → role access → states covered → new/restyled — so it can be turned into **Linear sub-issues** (one per row). Suggest 3 sizing estimates per screen (e.g. *design / implement / QA* in points).
   - **Data/service changes:** new types, services, query hooks, `DB_VERSION` bump.
   - **Portability checklist for `octap-web/apps/business`:** list of files to copy, dependencies to add to `apps/business/package.json`, tokens to move into `packages/shared/src/styles`, Prettier differences (single quotes), React-Compiler compatibility notes, router differences if any.
   - **Assumptions & open questions** (e.g. billing vs. operator-managed plan changes; interpretation of "business developer's dashboard"; demo prices).
   - **Known gaps** and what you did not finish.
3. In chat: a concise summary, the exact commands to run it, and the test-flow results (pass/fail per flow in section 11).

Begin now with step 1 (recon) and give me your short plan.
