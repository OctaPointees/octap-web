# OctaP Web

Source code for the OctaP websites, organised as an npm-workspaces monorepo (React 19 + TypeScript + Vite + Tailwind CSS v4).

| App | Path | Dev URL | Status |
| --- | --- | --- | --- |
| Landing page (V4b Magenta Pulse) | `apps/landing` | http://localhost:3000 | Implemented |
| Business / Partner Dashboard + Developer Console | `apps/business` | http://localhost:4000 | Implemented (prototype, mock data) |
| Admin Dashboard | `apps/admin` | http://localhost:5000 | Implemented (mock services) |
| Shared styles and utilities | `packages/shared`, `packages/services` | – | Theme tokens only |

Everything runs on mock data. Partner names, quotes, milestones, transactions and API keys are fictional.

## Getting started

```bash
npm install
npm run dev        # landing (3000) + business (4000) together
```

Other scripts (run from the repo root):

| Command | What it does |
| --- | --- |
| `npm run dev:landing` / `dev:business` / `dev:admin` | Run a single app |
| `npm run build` | Type-check and build every workspace |
| `npm run lint` | Lint every workspace |

`clean-install.ps1` removes every `node_modules` folder (Windows PowerShell) for a fresh install.

### Linking the two apps

The landing page sends visitors to the business login, and the login's "Back to octap.com" link returns to the landing page. Both URLs default to the local dev servers and can be overridden per app (see each `.env.example`):

| App | Variable | Default |
| --- | --- | --- |
| `apps/landing` | `VITE_BUSINESS_URL` | `http://localhost:4000/login` |
| `apps/business` | `VITE_LANDING_URL` | `http://localhost:3000/` |
| `apps/business` | `VITE_DEMO_MODE` | on; set to `false` to hide the demo-account block on the login page |

## Manual test flow

Start `npm run dev` first.

### 1. Landing to login
1. Open http://localhost:3000.
2. Click **Sign in** or **Get started** in the header (or **Get started** at the bottom). You land on http://localhost:4000/login.
3. On the login page click **Back to octap.com** (top left) to return to the landing page.

### 2. Sign in
Quick path: click the **Owner** demo card (email and password are filled in and focus jumps to **Sign in**), then click **Sign in**. After the spinner you are redirected to `/dashboard`.

Demo password for every account is `octap123`.

| Check | How | Expected |
| --- | --- | --- |
| Wrong password | `owner@lotusmart.vn` with a wrong password | "Incorrect email or password." banner |
| Lockout | Fail 5 times in a row | "Too many attempts…" banner, Sign in disabled |
| Disabled button | Leave email or password empty | Sign in is disabled |
| Show / hide password | Click the eye icon | Password toggles visibility |
| Caps Lock | Type in the password field with Caps Lock on | "Caps Lock is on" warning |
| Platform admin | Pick **Platform admin**, then Sign in | Pill switches to ADMIN, lands on `/admin` (info page only) |
| Google | **Continue with Google** | "Choose organization" step; pick one and **Continue** to reach the dashboard |
| Phone | **Sign in with phone number**, enter 9+ digits, **Send code**, enter `123456` | Dashboard. Any other code shows an error. **Resend code** unlocks after 30 s |

### 3. Dashboard
1. Click the arrow on the sidebar edge to collapse it; hover an icon for its tooltip.
2. Click **Test** (top right) to show the "Test mode" strip, **Live** to hide it.
3. Scroll down and click a row in **Latest transactions**: a detail drawer slides in (close with Esc, the X button, or by clicking outside).
4. Issue points, Campaigns, Rewards, Members, Transactions and Settings have no pages yet, so those sidebar items do nothing.

### 4. Enter the Developer Console (video transition)
1. Click **Developers** in the sidebar. `public/videos/octap_to_dev_short.mp4` plays full screen for about one second, then `/developers/overview` appears.
2. Browse the seven sections: Overview, API keys, Sandbox, Mock transactions, Logs, Webhooks, MCP.
3. **API keys** → **Create API key** opens a modal. **Cancel** or X closes it; **Close** is enabled once "I've stored this secret" is ticked.
4. **Mock transactions** → **Run scenario** shows the running state, then returns to idle after about 4.5 s.
5. Use the arrow on the dark sidebar to collapse it to an icon rail.

### 5. Back to the Dashboard (circle-wipe animation)
Click **Back to Dashboard** (top left of the dark sidebar). A magenta circle grows from the button, the OctaP mark pulses, the circle closes to the centre and the dashboard cards animate in.

### Good to know
- The session lives in `sessionStorage`: opening `/dashboard` or `/developers/*` while signed out redirects to `/login`, and closing the tab ends the session.
- The video only plays when you go Dashboard → Developers; loading `/developers/*` directly skips it.
- Fonts and icon sets (Google Fonts, Remix Icon, Tabler Icons) load from CDNs, so icons need an internet connection.
- The cashier role lands on the dashboard because the "Issue points" page does not exist yet.

## Project structure

```
apps/
  landing/    Landing page; one component per section in src/sections
  business/   Partner Dashboard
    public/videos/        Transition clip (Dashboard → Developers)
    src/auth.ts           Demo accounts and sessionStorage helpers
    src/components/       Transition provider (video and circle wipe)
    src/pages/login       Sign-in, phone/OTP and organization steps
    src/pages/dashboard   Light dashboard and transaction drawer
    src/pages/developers  Dark Developer Console (7 routes)
    src/styles/           One scoped stylesheet per theme (login, light, dev)
  admin/      Standalone admin portal with local mock services and regression tests
packages/
  shared/     Shared theme tokens (daisyUI `octap` theme)
  services/   Placeholder
sources/      Design references and specs (git-ignored)
```

`apps/landing` and `apps/business` import the shared brand foundation from `packages/shared/src/styles/brand.css`. Their `src/styles/theme.css` files register scoped colors with Tailwind v4; the developer console retains a dark palette. These apps do not load daisyUI component styles. The business stylesheets are scoped under `.theme-login`, `.theme-light` and `.theme-dev` so class names such as `.card` do not collide.

## Coding conventions

See [DISCLAIMER.md](./DISCLAIMER.md) for coding styles, including the Tailwind CSS v4 rules. Landing and business components use registered color utilities and spacing-scale classes. Keep new theme values in `src/styles/theme.css` or the shared brand foundation; reserve inline styles for data-driven values and bespoke chart/illustration layouts. Both portals support reduced motion, and the business dialogs use native modal focus handling.
