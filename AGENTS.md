<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## 🛠️ Development Environment

- **Language**: TypeScript (`^5`)
- **Framework**: Next.js 16 (App Router) — see the warning above; this is a modified/future version, not the Next.js in your training data
- **Runtime/UI**: React 19
- **Styling**: Tailwind CSS v4 + daisyUI 5 (config lives in `app/globals.css` via `@import "tailwindcss"` / `@plugin "daisyui"` — there is no `tailwind.config.ts`)
- **Component Library**: none — hand-rolled components styled with daisyUI classes + Tailwind utilities (no shadcn/ui)
- **Data layer**: Supabase (`@supabase/supabase-js`, `@supabase/ssr`) — no React Query/SWR; data is fetched directly via typed Supabase client wrappers in `lib/supabase/`
- **Auth**: Supabase Auth, including anonymous sign-in (`signInAnonymously`) for guest resume-building
- **Payments**: Stripe (`stripe`), with webhook signature verification
- **AI**: Groq SDK (`groq-sdk`) for ATS coherence checks and AI-assisted rewriting
- **PDF export**: `@react-pdf/renderer`; **DOCX export**: `docx`
- **Email**: Resend (`resend`)
- **Captcha**: hCaptcha (`@hcaptcha/react-hcaptcha`)
- **Error tracking**: Sentry (`@sentry/nextjs`)
- **Rate limiting**: Upstash Redis + `@upstash/ratelimit`
- **i18n**: `i18next` + `react-i18next`, 13 locales
- **Testing**: Vitest + Testing Library (`@testing-library/react`, `@testing-library/dom`, `@testing-library/jest-dom`) + `jsdom` for units (not Jest); Playwright (`@playwright/test`) for E2E
- **Linting**: ESLint 9 flat config (`eslint-config-next` core-web-vitals + typescript rules)
- **Formatting**: none configured — no Prettier in this repo
- **Package Manager**: `npm` (repo has `package-lock.json`; no pnpm/yarn lockfiles)

## 📂 Project Structure

```
.
├── app/                      # App Router
│   ├── (app)/                # Authenticated/app shell routes (builder, my-resumes, etc.)
│   ├── api/                  # Route handlers (account, ai-rewrite, ats-coherence, blog, cron, resume, send-email, stripe)
│   ├── account/ auth/ billing/ blog/ login/ privacy/ reset-password/ support/ terms/
├── components/                # UI components, incl. cover-letter/, landing-page/, navbar/, pdf/, resumes/
├── lib/                       # Business logic, Supabase/Stripe/Groq clients, i18n, PDF/DOCX builders
│   ├── i18n/locales/          # 13 locale JSON files
│   ├── supabase/              # client.ts, server.ts, serviceRole.ts, proxy.ts, auth.ts, resumes.ts, ...
│   ├── pdf/ docx/ aiRewrite/ atsChecker/ resumeImport/ email/ text/
├── __tests__/                 # Vitest tests, mirroring the source tree
├── supabase/migrations/       # Numbered SQL migrations
├── scripts/                   # One-off Node scripts (set-admin.mjs, setup-stripe.mjs)
├── public/
├── proxy.ts                   # Next.js "Proxy" (formerly middleware) — refreshes Supabase session
├── next.config.ts             # Security headers/CSP, Sentry wrapping
├── vitest.config.mts
├── eslint.config.mjs
├── vercel.json                # Cron job schedule
├── .github/workflows/         # dev.yml (typecheck/lint/test), prod.yml (+ build)
└── package.json
```

## 📦 Installation Notes

- Tailwind v4 is wired through `postcss.config.mjs` + `@tailwindcss/postcss`; theme/plugins are declared in CSS (`app/globals.css`), not a JS/TS config file
- daisyUI is registered as a CSS plugin (`@plugin "daisyui";`) — theme colors are oklch-based, which complicates naive `getComputedStyle` color extraction (canvas pixel read-back is the reliable workaround)
- Supabase clients are split by context: `lib/supabase/client.ts` (browser), `server.ts` (RSC/route handlers, cookie-based session), `serviceRole.ts` (service-role, server-only, bypasses RLS), `proxy.ts` (session refresh in `proxy.ts`)

## ⚙️ Dev Commands

- **Dev server**: `npm run dev`
- **Build**: `npm run build`
- **Start**: `npm run start`
- **Lint**: `npm run lint`
- **Type check**: `npx tsc --noEmit -p .`
- **Generate route types**: `npx next typegen` (fast, no full build — matches what CI runs before typecheck)
- **Test (watch)**: `npm test`
- **Test (single run, what CI uses)**: `npm run test:run`

## 🧠 Claude Code Usage

- Run `claude` in the root of the repo
- Before using any Next.js API you're unsure of, check `node_modules/next/dist/docs/` first — this version has real, undocumented-to-you behavior differences (e.g. `proxy.ts` replacing `middleware.ts`)
- Compact with `claude /compact`
- Use `claude /permissions` to review/whitelist safe tools

## 🧪 Testing Practices

- **Unit testing**: Vitest + Testing Library (`@testing-library/react`, `@testing-library/dom`, `@testing-library/jest-dom`), config in `vitest.config.mts`, jsdom environment, `vite-tsconfig-paths` for `@/*` aliases
  - Command: `npm test` (watch) / `npm run test:run` (single run, used by CI)
  - Tests live under `__tests__/`, mirroring the source tree (e.g. `__tests__/lib/color.test.ts` tests `lib/color.ts`)
  - Coverage is intentionally partial — focused on pure, high-value logic (ATS keyword scoring, color-contrast math, API error localization) rather than full-app coverage
  - No mocking library (e.g. MSW) is set up; existing tests exercise real Web APIs (`Request`/`Response`) directly where possible
- **End-to-end testing**: Playwright (`@playwright/test`), config in `playwright.config.ts` — real user-journey flows (navigation across pages, form filling, saves), not component-level testing
  - Command: `npm run test:e2e` (headless) / `npm run test:e2e:headed` (visible browser window, useful for watching/debugging a flow)
  - Tests live under `e2e/` (e.g. `e2e/anonymous-resume-flow.spec.ts`), separate from the Vitest `__tests__/` tree since these represent flows, not source-file-mirrored units
  - `webServer` in the config auto-starts `npm run dev` against `http://localhost:3000` if nothing is already listening there — no need to manually start the dev server first
  - Not wired into CI yet (`.github/workflows/*.yml` only run the Vitest suite) — running E2E tests is currently a local/manual step
  - Browser binaries are a one-time local setup: `npx playwright install chromium`

## 🧱 Component & Styling Guidelines

- No component library — build with daisyUI component classes (`btn`, `card`, `dialog`, `rating`, etc.) + Tailwind utilities
- Prefer daisyUI semantic color tokens (`bg-primary`, `text-base-content`, etc.) over hardcoded hex so light/dark mode keeps working
- Desktop templates live in `components/resumes/desktop-templates/`, mobile variants in `components/resumes/mobile-templates/`, PDF variants in `components/pdf/` — a change to shared resume fields (e.g. language levels, star ratings) usually needs updating all three families
- `@react-pdf/renderer` components run outside the normal React provider tree (rendered via `pdf(<Component/>).toBlob()`), so they can't rely on `useTranslation()`/React context — import the i18n singleton directly (`import i18n from "@/lib/i18n/i18n"`, then `i18n.t(...)`)

## 🌍 Internationalization

- All user-facing strings go through `t()` from `react-i18next`; never hardcode UI copy
- Every new string needs real (not machine-copied) translations across all 13 files in `lib/i18n/locales/*.json`: `en`, `sk`, `cs`, `de`, `pl`, `pt`, `ru`, `es`, `it`, `fr`, `sv`, `nb`, `nl`
- Resume *content* structure (section headers like "Work Experience") is currently rendered in fixed English regardless of app locale — this is an existing, deliberate scope boundary, not a bug; only app/builder chrome (and enum-like values such as language proficiency levels) are localized

## 📝 Code Style Standards

- Functional React components with typed props interfaces
- Avoid `any`; prefer precise types or `unknown` with narrowing
- Co-locate small helpers near their usage; extract to `lib/` when shared across components
- Group imports: framework (`react`/`next`) → third-party libraries → local (`@/...`)
- No inline code comments unless explaining a non-obvious *why* (a workaround, a subtle invariant) — not restating *what* the code does

## 🔐 Security

- Validate all inputs in API routes (`app/api/**/route.ts`); use `errorResponse()` from `lib/apiErrors.ts` for localized error responses
- Free-tier limits are enforced server-side via Supabase RLS policies, not just client-side checks
- Cron endpoints (`app/api/cron/**`) require a `CRON_SECRET` bearer token and fail closed
- `next.config.ts` sets CSP + security headers (HSTS, X-Frame-Options, etc.) — when adding a new third-party script/API, update the relevant CSP directive there or things silently break (WASM, fonts, and analytics have all hit this)
- Never expose `SUPABASE_SERVICE_ROLE_KEY` to the browser; only use `lib/supabase/serviceRole.ts` in server-only contexts

## 🔍 Documentation & Onboarding

- Keep `README.md` up to date — it documents setup, available scripts, migrations, and the testing approach
- SQL migrations in `supabase/migrations/` are numbered sequentially; keep the README's migration count in sync when adding one
