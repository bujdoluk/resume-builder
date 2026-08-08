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
- **PDF export**: `@react-pdf/renderer` (server-side generation); **client-side PDF preview**: `pdfjs-dist` (canvas rendering on the public shared-link page — not `<embed>`, for mobile-browser compatibility); **DOCX export**: `docx`
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
│   │   ├── health/route.ts                  # public: liveness check for uptime monitors, no auth
│   │   ├── send-email/route.ts              # Resend — email export (pdf/docx/txt)
│   │   └── stripe/{cancel,checkout,webhook}/route.ts
│   ├── account/ auth/callback/ billing/ blog/[slug]/ login/
│   │   privacy/ reset-password/ support/ terms/
│   ├── shared/{resume,cover-letter}/[token]/          # public, unauthenticated shareable-link view
│   │   ├── page.tsx                # Server Component: looks up the token, renders SharedDocumentView
│   │   └── pdf/route.tsx           # streams the PDF via @react-pdf/renderer, rate-limited by IP
│   ├── error.tsx global-error.tsx not-found.tsx   # error boundaries
│   └── layout.tsx page.tsx globals.css robots.ts sitemap.ts
├── components/                     # grouped into one feature folder per concern; a handful of
│   │                                # app-wide primitives (state, icons, generic dialogs) stay at the root
│   ├── resumes/                    # ResumeBuilder.tsx (state), Resume.tsx (desktop canvas),
│   │   │                            # useModernZoneLayout.ts/useResumeFormHandlers.ts (resume-template-only hooks)
│   │   ├── desktop-templates/      # 5 templates: Basic, Modern, Minimal, Elegant, Classic
│   │   └── mobile-templates/       # matching mobile variant per template
│   ├── cover-letter/                # same pattern, 2 templates: Basic, Modern
│   │   ├── desktop-templates/
│   │   └── mobile-templates/
│   ├── pdf/                        # @react-pdf/renderer templates, one per resume/cover-letter template
│   ├── navbar/                     # customization dropdowns, AuthButton.tsx
│   ├── landing-page/                # LandingPage.tsx, PricingSection.tsx
│   ├── ai-tools/                    # AtsCheckerDialog.tsx, AiRewriteButton.tsx — shared across both builders
│   ├── share/                      # ShareDialog.tsx (create/revoke a shareable link, both builders),
│   │   │                            # SharedDocumentView.tsx (public /shared/* page: renders the PDF client-side
│   │   │                            # via pdfjs-dist canvas, not <embed>, for mobile-browser compatibility, plus a download link)
│   ├── preview/                    # PreviewModal.tsx + ScaleToFit.tsx (its scaling helper, no other consumer)
│   ├── sidebar/                    # Sidebar.tsx (app-shell nav) + CompletionSteps.tsx (the step tracker it renders)
│   ├── exports/                    # DownloadButton.tsx, EmailButton.tsx, PrintButton.tsx, ExportFormatMenu.tsx
│   ├── cookies/                    # CookieConsent.tsx, ConsentedAnalytics.tsx — global providers, mounted in app/layout.tsx
│   ├── auth/                       # LoginPage.tsx (incl. the post-login 2FA step-up code prompt), ResetPasswordPage.tsx
│   ├── account/                    # AccountPage.tsx (incl. admin-only 2FA (TOTP) enrollment/disable section),
│   │   │                            # BillingPage.tsx, SupportPage.tsx
│   ├── blog/                       # BlogPageContent.tsx, BlogPostContent.tsx, AddBlogPostDialog.tsx
│   ├── theme/                      # ThemeToggle.tsx
│   ├── hcaptcha/                   # InvisibleCaptcha.tsx (client component; lib/hcaptcha.ts holds the server-side client)
│   ├── languages/                  # LanguageSelect.tsx
│   ├── AppState.tsx                 # shared builder state context (template/color/font/section order/...)
│   ├── Toast.tsx, TawkChat.tsx      # global providers, mounted in app/layout.tsx
│   ├── SaveResumeDialog.tsx, ConfirmDialog.tsx   # generic dialogs reused well beyond one feature
│   ├── Sortable.tsx, SortableColumnHeader.tsx, TableFillerRows.tsx
│   ├── Navbar.tsx, TemplateThumbnail.tsx, Icons.tsx, AutoResizeTextarea.tsx
│   └── useIsAdmin.ts, useHasMounted.ts   # shared hooks used across multiple feature folders
├── lib/
│   ├── resumeData.ts / coverLetterData.ts        # Zod schemas (ResumeData/CoverLetterData types + empty-state
│   │                                # constants derived via z.infer/schema.parse({})), schema-version scaffold
│   │                                # (parseStoredResumeData/stampResumeData, see lib/schemaVersion.ts)
│   ├── schemaVersion.ts            # createVersionedCodec() — versioning scaffold for a jsonb blob's stored
│   │                                # shape, shared by resumeData.ts/coverLetterData.ts
│   ├── templates.ts / coverLetterTemplates.ts    # template ID registries
│   ├── atsChecker/                 # checkResumeFormat.ts / checkCoverLetterFormat.ts (format checklists),
│   │                                # matchKeywords.ts (deterministic score), checkCoherence.ts (Groq, server-only)
│   ├── aiRewrite/rewriteText.ts    # Groq — "Rewrite with AI"
│   ├── adminAuth.ts                # requireAdmin() — shared server-side gate (role + aal2 2FA) for admin routes
│   ├── shareLink.ts                # isShareLinkActive() — expiry check for shareable-link tokens
│   ├── apiValidation.ts            # validateBody() — runs a Zod schema, maps a failure straight to the ApiErrorKey
│   │                                # set as that field's schema message (see lib/validation/*)
│   ├── validation/                 # one Zod schema file per app/api/**/route.ts POST body that needs one
│   ├── pdf/ docx/ text/            # the 3 export renderers per document type (PDF/@react-pdf, DOCX/`docx`, plain text)
│   │   │                            # pdf/streamToBuffer.ts drains @react-pdf/renderer's stream for the shared-link routes
│   ├── email/                      # Resend-backed senders (sendPdfEmail/sendDocxEmail/sendTextEmail/sendWelcomeEmail),
│   │                                # lazily instantiated like stripe.ts/groq.ts
│   ├── supabase/                   # client.ts/server.ts (browser/RSC clients), serviceRole.ts (server-only, bypasses RLS),
│   │                                # proxy.ts (session refresh), session.ts (anonymous sessions), resumes.ts/coverLetters.ts
│   │                                # (typed table wrappers, incl. share-token issuing/lookup), subscriptions.ts, blogPosts.ts,
│   │                                # auth.ts (incl. TOTP enroll/verify/step-up), invisibleCaptcha.ts, rememberMe.ts
│   ├── i18n/locales/               # 13 locale JSON files: en, sk, cs, de, pl, pt, ru, es, it, fr, sv, nb, nl
│   ├── i18n/i18n.ts                # React-bound i18next instance, used app-wide
│   ├── i18n/i18nCore.ts            # React-free i18next instance — for the 4 PDF templates, which are reachable from
│   │                                # Route Handlers where i18n.ts can't be imported (kept in sync via AppState.tsx)
│   ├── apiErrors.ts / apiResponse.ts   # localized, status-coded error/toast system (server / client halves)
│   ├── rateLimit.ts                # Upstash-backed sliding-window limiter, fails open if unconfigured
│   ├── securityHeaders.ts          # CSP/security-header construction — kept out of next.config.ts so it's unit-testable
│   ├── configHealth.ts             # boolean-only report of which optional integrations are configured
│   ├── stripe.ts / groq.ts / hcaptcha.ts   # lazily-instantiated third-party clients, all fail gracefully if unconfigured
│   └── constants.ts                # shared numeric constants (HTTP status codes, rate limits, retention windows, ...)
├── __tests__/                      # Vitest, mirrors the source tree (40 files as of this writing)
│   ├── app/api/                    # every API route: account, admin, ai-rewrite, ats-coherence, blog, cron, send-email, stripe
│   ├── app/shared/                 # the two shared-link PDF routes (rate limit, 404 on missing/expired token, valid PDF)
│   ├── components/                 # ResumeBuilder.tsx, CoverLetterBuilder.tsx — full-form fill-and-save flows
│   └── lib/                        # atsChecker, docx, i18n, pdf, supabase (incl. share-token/MFA), text — plus adminAuth,
│                                    # shareLink, color, rateLimit, securityHeaders, configHealth, apiErrors, apiValidation,
│                                    # resumeData, coverLetterData, fields, schemaVersion as standalone tests
├── e2e/                            # Playwright, real-browser user-journey flows, wired into CI (.github/workflows/e2e.yml)
├── supabase/migrations/            # 11 numbered SQL migrations, applied manually (no linked CLI project)
├── scripts/                        # set-admin.mjs, reset-admin-mfa.mjs (2FA recovery), setup-stripe.mjs,
│                                    # copy-pdf-worker.mjs (runs on every install via postinstall)
├── public/                         # incl. pdf.worker.min.mjs (gitignored, generated by copy-pdf-worker.mjs)
├── proxy.ts                        # Next.js "Proxy" (formerly middleware) — refreshes Supabase session on every request
├── instrumentation.ts / instrumentation-client.ts   # Sentry init (server / client)
├── next.config.ts                  # security headers/CSP (delegates to lib/securityHeaders.ts), Sentry wrapping
├── vitest.config.mts / playwright.config.ts
├── eslint.config.mjs
├── vercel.json                     # cron job schedule
├── resume-builder.code-workspace   # shared VS Code workspace: recommended extensions + editor settings
├── .github/workflows/              # dev.yml, prod.yml — typecheck, lint, npm audit, test (prod.yml also builds);
│                                    # e2e.yml — Playwright, on push/PR to main; release.yml — release-please, on push to main;
│                                    # db-types-check.yml — fails if lib/supabase/database.types.ts has drifted from the
│                                    # live schema (push/PR touching migrations or that file, plus a weekly cron to catch
│                                    # Dashboard-only schema changes); needs the SUPABASE_ACCESS_TOKEN repo secret
└── package.json
```

## 📦 Installation Notes

- Tailwind v4 is wired through `postcss.config.mjs` + `@tailwindcss/postcss`; theme/plugins are declared in CSS (`app/globals.css`), not a JS/TS config file
- daisyUI is registered as a CSS plugin (`@plugin "daisyui";`) — theme colors are oklch-based, which complicates naive `getComputedStyle` color extraction (canvas pixel read-back is the reliable workaround)
- Supabase clients are split by context: `lib/supabase/client.ts` (browser), `server.ts` (RSC/route handlers, cookie-based session), `serviceRole.ts` (service-role, server-only, bypasses RLS), `proxy.ts` (session refresh in `proxy.ts`) — all three are typed `SupabaseClient<Database>` (`lib/supabase/database.types.ts`)
- **Keeping the DB schema and app-level types consistent** — three layers, don't skip one when adding a column/field:
  1. **Postgres columns ⇄ TS types**: `lib/supabase/database.types.ts` is real `supabase gen types typescript` output (`npm run db:types`), not hand-written — regenerate it after every new migration rather than hand-editing, or every `Tables<"resumes">`-typed read/write silently falls out of sync with reality. Generating needs a one-time-per-machine `npx supabase login` (personal access token, separate from `supabase link` — this repo still has no linked CLI project, see the migrations note above, so login only enables `gen types`, not `db push`/`db pull`). If login genuinely isn't available, hand-deriving the file from `supabase/migrations/*.sql` (matching the same `Database`/`Tables`/`Json` shape) is the documented fallback, but treat the generated version as authoritative once you have it. `.github/workflows/db-types-check.yml` backstops this in CI — regenerates the file and fails the build if it differs from what's committed, catching both a forgotten regen after a migration and a schema change made directly in the Dashboard.
  2. **A `jsonb` column's actual shape**: `jsonb` columns (`resumes.data`, `cover_letters.data`, `resumes.section_order`/`visible_fields`/`modern_section_zones`) are typed `Json` in `database.types.ts` — Postgres enforces nothing about their contents, so that's all a generated type could ever say. `lib/resumeData.ts`/`coverLetterData.ts` hold the real Zod schemas (`resumeDataSchema`/`coverLetterDataSchema`, plus `sectionOrderSchema`/`visibleFieldsSchema`/`modernSectionZonesSchema`); `ResumeData`/`WorkEntry`/etc. are `z.infer`'d from them rather than hand-declared, and `emptyResumeData`/`emptyCoverLetterData` are `schema.parse({})` rather than a separately-maintained literal. Every field schema carries a `.catch(default)` (fresh `crypto.randomUUID()` for `id` fields, `""`/`[]` otherwise) so a corrupted or partially-shaped stored value degrades field-by-field instead of the whole read either throwing or falling back to nothing.
  3. **Schema evolution over time**: a `jsonb` value, once written, is frozen in whatever shape it had at write time — Postgres never migrates it for you. `lib/schemaVersion.ts`'s `createVersionedCodec()` stamps a `__schemaVersion` onto data on write (`stampResumeData`/`stampCoverLetterData`) and walks a `migrations` registry keyed by "version being upgraded from" on read, before the Zod schema ever sees it (`parseStoredResumeData`/`parseStoredCoverLetterData` in `lib/resumeData.ts`/`coverLetterData.ts` — this is the one path that should turn a stored `data` value back into a trustworthy `ResumeData`/`CoverLetterData`, not a manual spread-merge). A missing migration step isn't fatal — the per-field `.catch()` defaults are the fallback safety net either way. Add a migration entry (never mutate or remove an existing one) whenever a breaking change is made to the stored shape; there's nothing registered yet since this is the first version.
  - `template_id`/`font`/`font_size` on `resumes` are deliberately left as plain casts, not schema-validated like the above — they're flat text columns (no jsonb nesting), and validating them would need a value import from `lib/templates.ts`, which pulls in every template's React component tree. `lib/supabase/resumes.ts` is reachable from the public shared-link PDF route handler (see the PDF/`i18nCore` note above), so that import isn't worth it for 3 columns that only affect cosmetic rendering, not data integrity.

## ⚙️ Dev Commands

- **Dev server**: `npm run dev`
- **Build**: `npm run build`
- **Start**: `npm run start`
- **Lint**: `npm run lint`
- **Type check**: `npx tsc --noEmit -p .`
- **Generate route types**: `npx next typegen` (fast, no full build — matches what CI runs before typecheck)
- **Generate Supabase DB types**: `npm run db:types` (needs `npx supabase login` once per machine first — see "Keeping the DB schema and app-level types consistent" above)
- **Test (watch)**: `npm test`
- **Test (single run, what CI uses)**: `npm run test:run`
- **Test (with coverage)**: `npm run test:coverage`

## 🚀 Releases

- Deployment is already automatic (Vercel deploys every push to `main`) — releasing is purely about generating a changelog and tagging what's live, not shipping.
- **Default flow**: `.github/workflows/release.yml` runs `release-please` on every push to `main`. It reads commit messages, maintains a single standing "chore: release X.Y.Z" PR with the changelog + version bump, and only cuts the actual git tag + GitHub Release when that PR is merged. Config: `release-config.json` / `.release-manifest.json` (renamed from the tool's `release-please-config.json`/`.release-please-manifest.json` defaults — see the `config-file`/`manifest-file` inputs in the workflow if either needs touching).
- **This depends on commit messages staying [Conventional Commits](https://www.conventionalcommits.org)-formatted** (`feat:`, `fix:`, `refactor:`, `ci:`, `test:`, `style:`, `chore:`, `docs:`) — release-please's version bump and changelog derive directly from these prefixes. This repo already has a strong track record here (see the git commit guidance elsewhere in this file); don't break it.
- **Manual fallback** (Action down, or a release needed immediately):
  ```bash
  git checkout main && git pull
  git log $(git describe --tags --abbrev=0)..HEAD --oneline   # review what's new, pick a bump
  npm version patch   # or minor / major
  git push && git push --tags
  gh release create $(git describe --tags --abbrev=0) --generate-notes
  ```
  Then update `.release-manifest.json` to match and commit it, or the next automated run works off a stale baseline.

## 🧠 Claude Code Usage

- Run `claude` in the root of the repo
- Before using any Next.js API you're unsure of, check `node_modules/next/dist/docs/` first — this version has real, undocumented-to-you behavior differences (e.g. `proxy.ts` replacing `middleware.ts`)
- Compact with `claude /compact`
- Use `claude /permissions` to review/whitelist safe tools

## 🧪 Testing Practices

- **Unit testing**: Vitest + Testing Library (`@testing-library/react`, `@testing-library/dom`, `@testing-library/jest-dom`, `@testing-library/user-event`), config in `vitest.config.mts`, jsdom environment, `vite-tsconfig-paths` for `@/*` aliases
  - Command: `npm test` (watch) / `npm run test:run` (single run, used by CI) / `npm run test:coverage` (single run + v8 coverage report; not gated in CI — this repo deliberately doesn't chase 100%)
  - Tests live under `__tests__/`, mirroring the source tree (e.g. `__tests__/lib/color.test.ts` tests `lib/color.ts`)
  - Coverage is broad on the critical path: every `app/api/**/route.ts` handler including the public shared-link PDF routes, the shared `requireAdmin()` role+2FA gate (`lib/adminAuth.ts`), the Supabase save/load mapping layer (`lib/supabase/resumes.ts`/`coverLetters.ts`/`subscriptions.ts`, incl. share-token issuing/expiry), PDF/DOCX/plain-text export generation, the ATS format-check scoring, rate limiting, i18n locale key parity, and CSP/security-header construction — plus two full-form component tests (`ResumeBuilder`/`CoverLetterBuilder`) that fill every field and exercise the real save flow. Not covered: `proxy.ts`/session-refresh middleware, and most UI beyond the two builders (templates, account/billing pages, blog admin UI, the 2FA enrollment UI, the login step-up flow) — those remain a manual/E2E concern
  - No mocking library (e.g. MSW) is set up; API route tests mock their immediate dependencies directly via `vi.mock` (Supabase client wrappers, Stripe, Groq, rate limiting) and exercise the real Web APIs (`Request`/`Response`) end to end
  - Component tests scope queries to a single pane with `within()` — `ResumeBuilder`/`CoverLetterBuilder` render a mobile *and* desktop pane simultaneously in jsdom since Tailwind's responsive classes don't apply without real CSS, so unscoped queries throw on duplicate matches
- **End-to-end testing**: Playwright (`@playwright/test`), config in `playwright.config.ts` — real user-journey flows (navigation across pages, form filling, saves), not component-level testing
  - Command: `npm run test:e2e` (headless) / `npm run test:e2e:headed` (visible browser window, useful for watching/debugging a flow)
  - Tests live under `e2e/` (`anonymous-resume-flow.spec.ts`, `anonymous-cover-letter-flow.spec.ts`), separate from the Vitest `__tests__/` tree since these represent flows, not source-file-mirrored units
  - `webServer` in the config auto-starts `npm run dev` against `http://localhost:3000` if nothing is already listening there — no need to manually start the dev server first
  - Wired into CI via `.github/workflows/e2e.yml`, on push/PR to `main` — reuses the same Supabase project as production (the anonymous test accounts each run creates are exactly what the retention cron cleans up), Chromium is cached keyed on `package-lock.json`, and a trace artifact is uploaded on failure
  - Browser binaries are a one-time local setup: `npx playwright install chromium`

## 🧱 Component & Styling Guidelines

- No component library — build with daisyUI component classes (`btn`, `card`, `dialog`, `rating`, etc.) + Tailwind utilities
- Prefer daisyUI semantic color tokens (`bg-primary`, `text-base-content`, etc.) over hardcoded hex so light/dark mode keeps working
- Desktop templates live in `components/resumes/desktop-templates/`, mobile variants in `components/resumes/mobile-templates/`, PDF variants in `components/pdf/` — a change to shared resume fields (e.g. language levels, star ratings) usually needs updating all three families
- `@react-pdf/renderer` components run outside the normal React provider tree (rendered via `pdf(<Component/>).toBlob()`), so they can't rely on `useTranslation()`/React context — import the i18n singleton directly. The 4 PDF templates specifically import `@/lib/i18n/i18nCore` (a separate, React-free i18next instance), not `@/lib/i18n/i18n` — they're reachable from Route Handlers (the shared-link PDF routes), which bundle through Next's RSC-vendored restricted React lacking `createContext`, so importing anything that touches `initReactI18next` at import time breaks the build. `i18nCore` is kept in sync with the app-wide instance via `AppState.tsx`'s language-change effect.

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

- Validate all inputs in API routes (`app/api/**/route.ts`) with a Zod schema in `lib/validation/` (message on each field set to the exact `ApiErrorKey` to return), parsed via `validateBody()` from `lib/apiValidation.ts`; use `errorResponse()` from `lib/apiErrors.ts` for localized error responses. Routes with no request body (`GET`, or auth/header-only `POST`s like the cron and account-delete routes) don't need a schema. Byte-size checks on decoded attachments (e.g. `send-email`'s base64 payloads) stay outside the schema — they're a business rule on the decoded buffer, not the input shape
- Free-tier limits are enforced server-side via Supabase RLS policies, not just client-side checks
- Admin-only routes (`/api/blog`, `/api/admin/config-health`) gate through `lib/adminAuth.ts`'s `requireAdmin()`, which requires both `user.app_metadata?.role === "admin"` (never `user_metadata`, which a regular user can self-modify — grant the role via `scripts/set-admin.mjs`, never by hand) AND a completed TOTP 2FA challenge this session (`aal2`, checked via Supabase Auth MFA's `getAuthenticatorAssuranceLevel()`) — a compromised password alone doesn't reach these routes. Enrolled from `/account`; login (password or Google) prompts for the code whenever a verified factor exists. Lost-device recovery: `scripts/reset-admin-mfa.mjs` (service role, doesn't touch the role claim)
- Cron endpoints (`app/api/cron/**`) require a `CRON_SECRET` bearer token and fail closed
- Optional integrations (rate limiting, hCaptcha, Groq, Stripe, Sentry) fail *open* by design when unconfigured, so local dev works without every third-party account set up — but that means a missing env var in production is silent, not an error. `GET /api/admin/config-health` (admin-only) reports which of these are actually configured as booleans, never secret values — check it after any env var change in production
- CI (`.github/workflows/dev.yml`/`prod.yml`) runs `npm audit --audit-level=high` after `npm ci`, gating on high/critical dependency vulnerabilities only (low/moderate are too common/often-unfixable in transitive deps to gate on)
- `next.config.ts` sets CSP + security headers (HSTS, X-Frame-Options, etc.) via `lib/securityHeaders.ts` — when adding a new third-party script/API, update the relevant CSP directive there or things silently break (WASM, fonts, and analytics have all hit this). `'unsafe-eval'` in `script-src` must never appear outside `isDev` — this is asserted in `__tests__/lib/securityHeaders.test.ts`
- Never expose `SUPABASE_SERVICE_ROLE_KEY` to the browser; only use `lib/supabase/serviceRole.ts` in server-only contexts

## 🔍 Documentation & Onboarding

- Keep `README.md` up to date — it documents setup, available scripts, migrations, and the testing approach
- SQL migrations in `supabase/migrations/` are numbered sequentially; keep the README's migration count in sync when adding one
