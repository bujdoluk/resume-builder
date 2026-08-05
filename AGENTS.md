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
- **Testing**: Vitest + Testing Library (`@testing-library/react`, `@testing-library/dom`, `@testing-library/jest-dom`, `@testing-library/user-event`) + `jsdom` for units (not Jest); Playwright (`@playwright/test`) for E2E
- **Linting**: ESLint 9 flat config (`eslint-config-next` core-web-vitals + typescript rules)
- **Formatting**: none configured — no Prettier in this repo
- **Package Manager**: `npm` (repo has `package-lock.json`; no pnpm/yarn lockfiles)

## 📂 Project Structure

```
.
├── app/                            # App Router — pages + API route handlers
│   ├── (app)/                      # Authenticated/app-shell routes (group, not part of the URL)
│   │   ├── app/                    # /app — resume builder editor
│   │   ├── cover-letter/           # /cover-letter — cover letter builder editor
│   │   ├── my-resumes/             # /my-resumes — saved resumes list
│   │   ├── my-cover-letters/       # /my-cover-letters — saved cover letters list
│   │   ├── templates/              # /templates — template gallery
│   │   └── layout.tsx
│   ├── api/
│   │   ├── account/{delete,export}/route.ts
│   │   ├── admin/config-health/route.ts     # admin-only: which optional integrations are configured (booleans only)
│   │   ├── ai-rewrite/route.ts              # Groq — "Rewrite with AI" button
│   │   ├── ats-coherence/route.ts           # Groq — ATS Checker's "Check Coherence" button
│   │   ├── blog/route.ts                    # admin-only blog post creation
│   │   ├── cron/cleanup-anonymous-users/route.ts
│   │   ├── send-email/route.ts              # Resend — email export (pdf/docx/txt)
│   │   └── stripe/{cancel,checkout,webhook}/route.ts
│   ├── account/ auth/callback/ billing/ blog/[slug]/ login/
│   │   privacy/ reset-password/ support/ terms/
│   ├── error.tsx global-error.tsx not-found.tsx   # error boundaries
│   └── layout.tsx page.tsx globals.css robots.ts sitemap.ts
├── components/
│   ├── resumes/                    # ResumeBuilder.tsx (state), Resume.tsx (desktop canvas)
│   │   ├── desktop-templates/      # 5 templates: Basic, Modern, Minimal, Elegant, Classic
│   │   └── mobile-templates/       # matching mobile variant per template
│   ├── cover-letter/                # same pattern, 2 templates: Basic, Modern
│   │   ├── desktop-templates/
│   │   └── mobile-templates/
│   ├── pdf/                        # @react-pdf/renderer templates, one per resume/cover-letter template
│   ├── navbar/                     # customization dropdowns, AuthButton.tsx
│   ├── landing-page/                # LandingPage.tsx, PricingSection.tsx
│   ├── AppState.tsx                 # shared builder state context (template/color/font/section order/...)
│   ├── AtsCheckerDialog.tsx, AiRewriteButton.tsx        # shared across both builders
│   ├── DownloadButton.tsx, EmailButton.tsx, PrintButton.tsx, ExportFormatMenu.tsx
│   ├── SaveResumeDialog.tsx, ConfirmDialog.tsx, PreviewModal.tsx (+ ScaleToFit.tsx)
│   ├── Sortable.tsx, Sidebar.tsx, SortableColumnHeader.tsx, TableFillerRows.tsx
│   ├── Toast.tsx, CookieConsent.tsx, ConsentedAnalytics.tsx, TawkChat.tsx   # global providers, mounted in app/layout.tsx
│   ├── AccountPage.tsx, BillingPage.tsx, LoginPage.tsx, ResetPasswordPage.tsx,
│   │   SupportPage.tsx, BlogPageContent.tsx, BlogPostContent.tsx, AddBlogPostDialog.tsx
│   └── useIsAdmin.ts, useHasMounted.ts, useModernZoneLayout.ts, useResumeFormHandlers.ts   # shared hooks
├── lib/
│   ├── resumeData.ts / coverLetterData.ts        # data types + empty-state constants
│   ├── templates.ts / coverLetterTemplates.ts    # template ID registries
│   ├── atsChecker/                 # checkResumeFormat.ts / checkCoverLetterFormat.ts (format checklists),
│   │                                # matchKeywords.ts (deterministic score), checkCoherence.ts (Groq, server-only)
│   ├── aiRewrite/rewriteText.ts    # Groq — "Rewrite with AI"
│   ├── pdf/ docx/ text/            # the 3 export renderers per document type (PDF/@react-pdf, DOCX/`docx`, plain text)
│   ├── email/                      # Resend-backed senders (sendPdfEmail/sendDocxEmail/sendTextEmail/sendWelcomeEmail),
│   │                                # lazily instantiated like stripe.ts/groq.ts
│   ├── supabase/                   # client.ts/server.ts (browser/RSC clients), serviceRole.ts (server-only, bypasses RLS),
│   │                                # proxy.ts (session refresh), session.ts (anonymous sessions), resumes.ts/coverLetters.ts/
│   │                                # subscriptions.ts/blogPosts.ts (typed table wrappers), auth.ts, invisibleCaptcha.ts, rememberMe.ts
│   ├── i18n/locales/               # 13 locale JSON files: en, sk, cs, de, pl, pt, ru, es, it, fr, sv, nb, nl
│   ├── apiErrors.ts / apiResponse.ts   # localized, status-coded error/toast system (server / client halves)
│   ├── rateLimit.ts                # Upstash-backed sliding-window limiter, fails open if unconfigured
│   ├── securityHeaders.ts          # CSP/security-header construction — kept out of next.config.ts so it's unit-testable
│   ├── configHealth.ts             # boolean-only report of which optional integrations are configured
│   ├── stripe.ts / groq.ts / hcaptcha.ts   # lazily-instantiated third-party clients, all fail gracefully if unconfigured
│   └── constants.ts                # shared numeric constants (HTTP status codes, rate limits, retention windows, ...)
├── __tests__/                      # Vitest, mirrors the source tree (30 files as of this writing)
│   ├── app/api/                    # every API route: account, admin, ai-rewrite, ats-coherence, blog, cron, send-email, stripe
│   ├── components/                 # ResumeBuilder.tsx, CoverLetterBuilder.tsx — full-form fill-and-save flows
│   └── lib/                        # atsChecker, docx, i18n, pdf, supabase, text — plus color, rateLimit, securityHeaders,
│                                    # configHealth, apiErrors as standalone module tests
├── e2e/                            # Playwright, real-browser user-journey flows (not wired into CI — see Testing Practices)
├── supabase/migrations/            # 8 numbered SQL migrations, applied manually (no linked CLI project)
├── scripts/                        # one-off Node scripts: set-admin.mjs, setup-stripe.mjs
├── public/
├── proxy.ts                        # Next.js "Proxy" (formerly middleware) — refreshes Supabase session on every request
├── instrumentation.ts / instrumentation-client.ts   # Sentry init (server / client)
├── next.config.ts                  # security headers/CSP (delegates to lib/securityHeaders.ts), Sentry wrapping
├── vitest.config.mts / playwright.config.ts
├── eslint.config.mjs
├── vercel.json                     # cron job schedule
├── resume-builder.code-workspace   # shared VS Code workspace: recommended extensions + editor settings
├── .github/workflows/              # dev.yml, prod.yml — typecheck, lint, npm audit, test (prod.yml also builds)
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

- **Unit testing**: Vitest + Testing Library (`@testing-library/react`, `@testing-library/dom`, `@testing-library/jest-dom`, `@testing-library/user-event`), config in `vitest.config.mts`, jsdom environment, `vite-tsconfig-paths` for `@/*` aliases
  - Command: `npm test` (watch) / `npm run test:run` (single run, used by CI)
  - Tests live under `__tests__/`, mirroring the source tree (e.g. `__tests__/lib/color.test.ts` tests `lib/color.ts`)
  - Coverage is broad on the critical path: every `app/api/**/route.ts` handler, the Supabase save/load mapping layer (`lib/supabase/resumes.ts`/`coverLetters.ts`/`subscriptions.ts`), PDF/DOCX/plain-text export generation, the ATS format-check scoring, rate limiting, i18n locale key parity, and CSP/security-header construction — plus two full-form component tests (`ResumeBuilder`/`CoverLetterBuilder`) that fill every field and exercise the real save flow. Not covered: `proxy.ts`/session-refresh middleware, and most UI beyond the two builders (templates, account/billing pages, blog admin UI) — those remain a manual/E2E concern
  - No mocking library (e.g. MSW) is set up; API route tests mock their immediate dependencies directly via `vi.mock` (Supabase client wrappers, Stripe, Groq, rate limiting) and exercise the real Web APIs (`Request`/`Response`) end to end
  - Component tests scope queries to a single pane with `within()` — `ResumeBuilder`/`CoverLetterBuilder` render a mobile *and* desktop pane simultaneously in jsdom since Tailwind's responsive classes don't apply without real CSS, so unscoped queries throw on duplicate matches
- **End-to-end testing**: Playwright (`@playwright/test`), config in `playwright.config.ts` — real user-journey flows (navigation across pages, form filling, saves), not component-level testing
  - Command: `npm run test:e2e` (headless) / `npm run test:e2e:headed` (visible browser window, useful for watching/debugging a flow)
  - Tests live under `e2e/` (`anonymous-resume-flow.spec.ts`, `anonymous-cover-letter-flow.spec.ts`), separate from the Vitest `__tests__/` tree since these represent flows, not source-file-mirrored units
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
- Admin-only routes (`/api/blog`, `/api/admin/config-health`) gate on `user.app_metadata?.role === "admin"` — never `user_metadata`, which a regular user can self-modify. Grant it via `scripts/set-admin.mjs`, never by hand
- Cron endpoints (`app/api/cron/**`) require a `CRON_SECRET` bearer token and fail closed
- Optional integrations (rate limiting, hCaptcha, Groq, Stripe, Sentry) fail *open* by design when unconfigured, so local dev works without every third-party account set up — but that means a missing env var in production is silent, not an error. `GET /api/admin/config-health` (admin-only) reports which of these are actually configured as booleans, never secret values — check it after any env var change in production
- CI (`.github/workflows/dev.yml`/`prod.yml`) runs `npm audit --audit-level=high` after `npm ci`, gating on high/critical dependency vulnerabilities only (low/moderate are too common/often-unfixable in transitive deps to gate on)
- `next.config.ts` sets CSP + security headers (HSTS, X-Frame-Options, etc.) via `lib/securityHeaders.ts` — when adding a new third-party script/API, update the relevant CSP directive there or things silently break (WASM, fonts, and analytics have all hit this). `'unsafe-eval'` in `script-src` must never appear outside `isDev` — this is asserted in `__tests__/lib/securityHeaders.test.ts`
- Never expose `SUPABASE_SERVICE_ROLE_KEY` to the browser; only use `lib/supabase/serviceRole.ts` in server-only contexts

## 🔍 Documentation & Onboarding

- Keep `README.md` up to date — it documents setup, available scripts, migrations, and the testing approach
- SQL migrations in `supabase/migrations/` are numbered sequentially; keep the README's migration count in sync when adding one
