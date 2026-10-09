# OctaP Landing Page | React Vite Application

Marketing site for OctaP, built from the "Mystic Tech" design: dark neon pink/purple/cyan theme with
a light-mode toggle, GSAP + ScrollTrigger scroll animations, Lenis smooth scrolling, and a pinned
3D flip-card deck in the "How it works" section.

## Tech stack

- **[React 19](https://react.dev/)** with the **React Compiler** babel preset enabled (no manual
  `useMemo`/`useCallback`) — same setup as `admin`/`business`.
- **[Vite 8](https://vite.dev/)** as the dev server and build tool, with `@vitejs/plugin-react` for
  fast refresh and `@rolldown/plugin-babel` to run the React Compiler transform.
- **TypeScript**, strict mode, project-referenced (`tsconfig.app.json` / `tsconfig.node.json`),
  extending the repo's shared `tsconfig.base.json`.
- **[Tailwind CSS v4](https://tailwindcss.com/)** via `@tailwindcss/vite` — utility classes only,
  no `tailwind.config.js`. Custom theme tokens (dark/light CSS variables, glass-panel, flip-card,
  parallax/magnetic/tilt helpers) live in `src/index.css`.
- **[GSAP 3](https://gsap.com/) + ScrollTrigger** — every scroll-driven effect on the page: section
  reveal-on-scroll, the pinned/scroll-scrubbed 3D flip-card deck, table-row wipes, FAQ slide-ins,
  and the pointer-reactive parallax/spotlight/magnetic/tilt layer. Wired up in one place,
  `src/hooks/useLandingAnimations.ts`, inside a `gsap.context()` so every tween and ScrollTrigger
  instance is torn down cleanly on unmount (including React 19 StrictMode's dev-only double-invoke).
- **[Lenis](https://lenis.darkroom.engineering/)** — smooth/inertial scrolling, synced into the GSAP
  ticker so ScrollTrigger stays in lockstep with it.
- **Tabler Icons (webfont)** and **Google Fonts** (Be Vietnam Pro, Caveat, Space Mono), both loaded
  via `@import` in `src/index.css` — no icon or font npm packages.
- **ESLint 10** (flat config) with `typescript-eslint`, `eslint-plugin-react-hooks`, and
  `eslint-plugin-react-refresh` — identical config to `admin`/`business`.

This app intentionally does **not** use the shared `@octap/shared` DaisyUI "octap" theme (primary
`#9f0261` / secondary `#002b49`) used by `admin` and `business` — the landing page's own palette,
fonts, and component styles are fully self-contained in `src/index.css`, independent of the rest of
the monorepo's design system.

## Structure

- `src/App.tsx` — assembles every section and owns the dark/light theme state.
- `src/sections/` — one component per page section (Header, Hero, WhatIsOctap, WhoItsFor, Features,
  HowItWorks, Developers, Compare, Partners, GoodToKnow, Faq, FinalCta, Footer).
- `src/hooks/useLandingAnimations.ts` — all GSAP/ScrollTrigger/Lenis wiring.
- `src/components/CardFrame.tsx` — the ornate SVG frame shared by the flip-card deck's 10 faces.
- `src/index.css` — theme tokens, dark/light overrides, and every custom animation/interaction class.

## Running locally

From the repo root:

```bash
npm run dev -w @octap/landing    # dev server on http://localhost:3000
npm run build -w @octap/landing  # tsc -b && vite build
npm run lint -w @octap/landing
```
