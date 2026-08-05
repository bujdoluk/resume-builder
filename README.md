# QuickResumeBuilder.online

**Live:** [www.quickresumebuilder.online](https://www.quickresumebuilder.online)

A free, in-browser resume and cover letter builder built with Next.js. Fill in your details, see a live preview, and export to PDF, Word, or plain text — no account required, though logging in syncs your saved documents across devices.

|                                                    |                                                            |                                                              |
| -------------------------------------------------- | ---------------------------------------------------------- | ------------------------------------------------------------ |
| ![Landing page](public/images/landing-page.webp)     | ![Resume editor](public/images/resume-builder-editor.webp)  | ![Template picker](public/images/template-feature-open.webp)  |
| Landing page                                        | Resume builder editor                                      | Template picker                                               |

## Features

### Resume Builder
- **Five templates** — Basic, Modern, Minimal, Elegant, Classic (`/templates`).
- **Live drag-and-drop editing** — reorder fields, sections, and repeatable entries, with a touch-friendly mobile form (via [dnd-kit](https://dndkit.com/)).
- **Completion tracking** — a step list plus a radial progress indicator.
- **Save & manage** — 2 resumes free, unlimited on Pro/Annual, from `/my-resumes` (sortable, paginated, bulk-delete).
- **New Resume** resets the canvas without losing your template/colour/font choices.

### Cover Letter Builder
- **Two templates** — Basic and Modern (draggable sidebar/main sections, mirroring the resume Modern template).
- **Five draggable sections** — sender, recipient, date, subject, body.
- **Completion tracking** and **save & manage**, same pattern as the Resume Builder, via `/my-cover-letters`.

### Shared across both builders
- **Customization navbar** — accent colour, font, font size, field/section visibility.
- **Custom field** — one arbitrary value (e.g. Nationality, Driver's License) under a renameable section heading, reflected in the step tracker.
- **Export to PDF, Word, or plain text**, plus print and full-page preview.
- **Email export** — sends the exported file via [Resend](https://resend.com), hCaptcha-protected.
- **13 languages**, switchable on the fly (i18next).
- **ATS Checker** — a "Check ATS Score" button opens a format-parseability checklist, an optional keyword-match score against a pasted job description (deterministic, no LLM), and an optional AI coherence check (via Groq) that flags placeholder/gibberish content the deterministic checks can't catch. All scores are heuristic guides, not guarantees of real ATS behavior.

### Accounts & Authentication
- **Anonymous by default** — a silent Supabase session on first save, no sign-up needed.
- **Email/password or Google login** (`/login`) — email signup carries over your anonymous data; Google signup starts a fresh account.
- **Remember me** — unchecked, downgrades the session to browser-only.
- **Password reset** via `/reset-password`.
- **hCaptcha** on login, signup, and password reset.
- **Account page** (`/account`) — profile info, full data export, account deletion.

### Subscriptions & Billing
- **Free** ($0, 2 resumes + 2 cover letters), **Pro** ($19.99/mo), **Annual** ($167.99/yr) — Pro/Annual unlock the same unlimited saves, modeled in Stripe as one Product with two Prices.
- **Stripe Checkout** upgrade flow; requires a real (non-anonymous) account.
- **Free-tier limit prompt** — an upgrade dialog instead of a hard error, everywhere a save could happen.
- **Self-service billing** (`/billing`) — view plan, cancel/resume anytime.
- **Webhook-driven state** — the Stripe webhook is the only writer of subscription data, and sends a one-time welcome email on first subscribe.

### Support
- **Support page** (`/support`) — support email plus a live-chat button.
- **Tawk.to** widget, site-wide, opt-in via cookie consent.

### Privacy & feedback
- **Cookie consent** banner — necessary / analytics / support-chat categories.
- **Privacy Policy & Terms of Service** pages.
- **Toast notifications** — colour-coded by HTTP status (yellow 4xx, red 5xx), localized.

### Marketing site
- **Landing page** (`/`) — hero, feature grid, pricing table, testimonials.
- **Blog** (`/blog`) — Supabase-backed, admin-only posting, public reading.

### Role-based authorization
- **Admin role** via a JWT `app_metadata.role` claim, enforced at the database level (RLS), not just hidden in the UI. Gates both blog post creation and the config-health endpoint below.

### Security & monitoring
- **Security headers** — CSP, HSTS, X-Frame-Options, and friends, built in `lib/securityHeaders.ts` (unit-tested) and applied in `next.config.ts`, scoped to the exact third-party origins the app loads (Supabase, hCaptcha, Tawk.to, Sentry).
- **Error monitoring** — Sentry, opt-in via `NEXT_PUBLIC_SENTRY_DSN`.
- **Config health check** (`/api/admin/config-health`, admin-only) — reports which optional integrations (rate limiting, hCaptcha, Groq, Stripe, Resend, Sentry) are actually configured, as booleans only, never secret values. Several of these fail open by design when unconfigured (see below), so this is the way to notice a missing production env var before it's discovered via abuse.
- **Dependency vulnerability scanning** — `npm audit --audit-level=high` runs in CI on every push/PR, failing the build on high/critical vulnerabilities.
- **Automatic cleanup of abandoned anonymous accounts** — a daily cron job deletes anonymous sessions (and their resumes/cover letters) that were never converted into a real account after 7 days, matching the retention policy in the Privacy Policy.

## Getting Started

Requires Node.js `>=24.19.0` (pinned in `.nvmrc`/`package.json`'s `engines` — run `nvm use` if you use nvm).

```bash
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Fill in your Supabase credentials at minimum — everything else below (Resend, Stripe, Tawk.to, hCaptcha, Upstash, Groq) is optional and fails gracefully when unset, so you can add it incrementally.

**Editor setup (optional):** open `resume-builder.code-workspace` in VS Code (**File → Open Workspace from File…**) for the project's recommended extensions and shared editor settings (2-space/LF/trim-whitespace to match `.editorconfig`, ESLint fix-on-save, the workspace's own pinned TypeScript version).

### Auth setup (Supabase Dashboard)
- **Google sign-in** — create an OAuth client in [Google Cloud Console](https://console.cloud.google.com/auth/clients/create), add the Client ID/Secret under **Authentication → Providers → Google**, and enable **manual linking** there too.
- **Redirect URLs** — under **Authentication → URL Configuration**, add both your local (`http://localhost:3000/auth/callback`) and production callback URLs, and set **Site URL** to your production domain.
- **Email delivery** — Supabase's built-in email is dev-only/rate-limited. For real emails, point custom SMTP (**Authentication → Emails → SMTP Settings**) at `smtp.resend.com` using your `RESEND_API_KEY`.

### Database setup (Supabase SQL Editor)
Run every file under `supabase/migrations/` in order (`0001`–`0008`) — there's no linked CLI project, so this isn't automatic. Then set `SUPABASE_SERVICE_ROLE_KEY` (Project Settings → API) — never expose this to the browser.

### Billing setup (Stripe)
1. Set `STRIPE_SECRET_KEY` in `.env.local`.
2. Run `node scripts/setup-stripe.mjs` — creates the Pro Product/Prices and prints `STRIPE_PRICE_ID_MONTHLY`/`STRIPE_PRICE_ID_ANNUAL`.
3. Run the [Stripe CLI](https://stripe.com/docs/stripe-cli) locally (`stripe listen --forward-to localhost:3000/api/stripe/webhook`) or add a production webhook endpoint listening for `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted` — either way, set `STRIPE_WEBHOOK_SECRET`.
4. Add all Stripe vars in your host's environment settings too (e.g. Vercel project settings), not just `.env.local`.

### Support (Tawk.to)
Sign up at [tawk.to](https://www.tawk.to), create a property, and set `NEXT_PUBLIC_TAWKTO_PROPERTY_ID`/`NEXT_PUBLIC_TAWKTO_WIDGET_ID` from the embed snippet's URL.

### Error monitoring (Sentry)
Create a project at [sentry.io](https://sentry.io), set `NEXT_PUBLIC_SENTRY_DSN` to enable client/server error reporting, and `SENTRY_ORG`/`SENTRY_PROJECT`/`SENTRY_AUTH_TOKEN` to also upload source maps at build time. Unset = Sentry is never initialized, matching every other optional integration here.

### Blog admin setup
1. Run migration `0006` (see Database setup).
2. `node scripts/set-admin.mjs you@example.com` to grant yourself the admin role.
3. Log out and back in — the role only lands in your session on login/refresh.

### Bot protection (hCaptcha)
1. Sign up at [hCaptcha](https://www.hcaptcha.com), add your domain(s), and grab the **Site Key**/**Secret Key**.
2. Set `NEXT_PUBLIC_HCAPTCHA_SITE_KEY`.
3. In **Supabase Dashboard → Authentication → Attack Protection**, enable CAPTCHA protection with the same **Secret Key**.
4. Also set `HCAPTCHA_SECRET_KEY` — required separately because `/api/send-email` verifies it directly rather than through Supabase.

### Rate limiting (Upstash Redis)
Guards `/api/send-email`, `/api/account/export`/`delete`, `/api/stripe/checkout`/`cancel`, and the Groq-backed `/api/ats-coherence`/`/api/ai-rewrite` against abuse. Create a free database at [Upstash](https://upstash.com) and set `UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN`. Unset = no limiting, not an error.

### AI features (Groq)
Powers the ATS Checker's optional "Check Coherence" button and the "Rewrite with AI" button on resume/cover letter text fields. Sign up at [console.groq.com](https://console.groq.com) and set `GROQ_API_KEY`. Unset shows a clear "not configured" message instead of failing silently. Note: Groq's free tier (30 req/min, 14,400/day) is shared across your whole app, not per-user — fine for occasional use, worth watching under real traffic.

### Scheduled cleanup (Cron)
A daily [Vercel Cron Job](https://vercel.com/docs/cron-jobs) (configured in `vercel.json`) calls `/api/cron/cleanup-anonymous-users` to delete anonymous accounts older than `ANONYMOUS_ACCOUNT_RETENTION_DAYS` (`lib/constants.ts`, currently 7 days) that were never converted into a real account. Generate a random secret and set it as `CRON_SECRET` in your Vercel project's environment variables — Vercel then calls the endpoint on schedule and attaches it automatically as an `Authorization: Bearer` header, which the route requires (unlike this app's other optional integrations, it fails closed, not open, if unset — an unauthenticated request to this endpoint is rejected outright rather than silently skipped).

## Project Structure

- **`app/`** — Next.js App Router pages and API routes. Notable routes: `/app` (resume editor), `/cover-letter` (editor), `/my-resumes`/`/my-cover-letters` (saved lists), `/templates` (gallery), `/account`/`/billing`/`/support` (account pages), `/blog`, `/login`, `/reset-password`, `/privacy`/`/terms`. API routes mirror the features above (`/api/send-email`, `/api/stripe/*`, `/api/account/*`, `/api/ats-coherence`, `/api/ai-rewrite`, `/api/blog`, `/api/admin/config-health`, `/api/cron/*`).
- **`components/`**
  - `resumes/`, `cover-letter/` — builder pages, editing canvases, and per-template `desktop-templates/`/`mobile-templates/`.
  - `pdf/` — `@react-pdf/renderer` templates, used by `DownloadButton.tsx`/`EmailButton.tsx`.
  - `navbar/` — customization dropdowns and `AuthButton.tsx`.
  - `landing-page/` — `LandingPage.tsx`, `PricingSection.tsx`.
  - `AtsCheckerDialog.tsx` — shared report dialog for both builders; scoring logic lives in `lib/atsChecker/`.
  - `Toast.tsx`, `CookieConsent.tsx`/`ConsentedAnalytics.tsx` — global providers mounted in `app/layout.tsx`.
  - Shared UI: `PreviewModal.tsx` (+ `ScaleToFit.tsx`), `SaveResumeDialog.tsx`, `ConfirmDialog.tsx`, `Sortable.tsx`, `Sidebar.tsx`, and other primitives reused by both builders.
- **`lib/`**
  - `resumeData.ts`/`coverLetterData.ts` — data types; `templates.ts`/`coverLetterTemplates.ts` — template registries.
  - `atsChecker/` — `checkResumeFormat.ts`/`checkCoverLetterFormat.ts` (format checklists), `matchKeywords.ts` (keyword matching), `checkCoherence.ts` (Groq call, server-only).
  - `apiResponse.ts`/`apiErrors.ts` — client/server halves of the localized, status-coded error/toast system.
  - `rateLimit.ts` — Upstash-backed rate limiter, fails open if unconfigured.
  - `securityHeaders.ts` — CSP/security-header construction, imported by `next.config.ts`; kept as a separate module specifically so it's unit-testable.
  - `configHealth.ts` — boolean-only report of which optional integrations are configured, backing `/api/admin/config-health`.
  - `constants.ts` — shared numeric constants (status codes, limits, timings).
  - `supabase/` — `client.ts`/`server.ts`/`proxy.ts` (client factories), `session.ts` (anonymous sessions), `invisibleCaptcha.ts`/`hcaptcha.ts`, `auth.ts`, `resumes.ts`/`coverLetters.ts`, `subscriptions.ts`, `blogPosts.ts`.
  - `email/` — Resend-backed senders, lazily instantiated like `stripe.ts`.
  - `text/`, `docx/`, `pdf/` — the three non-editor export renderers per document type.
- **`__tests__/`** — Vitest tests, mirroring the source tree (see Testing below).
- **`scripts/`** — `setup-stripe.mjs`, `set-admin.mjs` (one-time setup scripts, see Getting Started above).
- **`resume-builder.code-workspace`** — shared VS Code workspace file: recommended extensions + editor settings matching `.editorconfig`. Open via **File → Open Workspace from File…**.
- **`supabase/migrations/`** — numbered SQL migrations, applied manually.

## Testing
Unit tests use [Vitest](https://vitest.dev), set up per the [official Next.js guide](https://nextjs.org/docs/app/guides/testing/vitest). Test files live under `__tests__/`, mirroring the source tree (e.g. `__tests__/lib/color.test.ts` tests `lib/color.ts`). `npm test` runs in watch mode; `npm run test:run` runs once (what CI uses).

Coverage focuses on the critical path rather than chasing 100%: every `app/api/**/route.ts` handler (auth/anonymous/rate-limit guards, Stripe billing, admin authorization, input validation), the Supabase save/load mapping layer, PDF/DOCX/plain-text export generation, the ATS Checker's format-check scoring, rate limiting, i18n locale key parity, and CSP/security-header construction — plus two full-form component tests (`ResumeBuilder`/`CoverLetterBuilder`) that fill every field and exercise the real save flow end to end. Not covered: the session-refresh proxy (`proxy.ts`), and most UI beyond the two builders (templates gallery, account/billing pages, blog admin UI) — those remain a manual/E2E concern.

End-to-end tests use [Playwright](https://playwright.dev) and live under `e2e/` — `anonymous-resume-flow.spec.ts` and `anonymous-cover-letter-flow.spec.ts` each drive a full anonymous-user journey (landing page or direct navigation → builder → fill every section → save → assert the saved-document URL). `npm run test:e2e` runs headless and auto-starts the dev server on `http://localhost:3000` if it isn't already running; `npm run test:e2e:headed` runs the same tests in a visible browser window so you can watch each step. First-time setup needs the browser binary once: `npx playwright install chromium`.

## Updating Dependencies
This repo pins **exact** versions for `dependencies` (no `^`/`~`) so installs are reproducible — `npm outdated`/`npm update` behave differently here than in a typically `^`-ranged project (`npm update` only moves a package within its declared range, so an exact-pinned package needs its `package.json` entry edited directly). A handful of foundational `devDependencies` (`@types/node`, `@types/react`, `@types/react-dom`, `eslint`, `tailwindcss`, `@tailwindcss/postcss`, `typescript`) intentionally use a bare major-version string instead (e.g. `"24"` not `"24.9.2"`) so they auto-pick-up patch/minor releases on a plain `npm install`, but still require an explicit edit to cross a major version.

**Node.js version** is pinned via `"engines"` in `package.json` and `.nvmrc` — both must stay in sync with what `.github/workflows/dev.yml`/`prod.yml` run (`actions/setup-node` `node-version`) and with the Node.js version configured in the Vercel project settings (Dashboard → Settings → Node.js Version), since that last one isn't visible from the repo.

**Recommended process for future updates** (don't big-bang everything at once):
1. Run `npm outdated` and split the results into two buckets: patch/minor bumps (low risk) and major-version bumps (real breaking-change risk).
2. Update the patch/minor batch together — edit exact-pinned versions directly in `package.json`, then run `npm install` once (this also refreshes the bare-major-pinned packages to their latest compatible patch).
3. Handle each major-version bump as its own separate pass with its own research (read the package's own changelog/release notes — see the note below) and its own verification cycle, not bundled with the safe batch.
4. After each stage, run the full verification checklist: `npx next typegen`, `npx tsc --noEmit -p .`, `npm run lint`, `npm run test:run`, `npm run test:e2e`, then a manual smoke check (start the dev server, load the landing page and builder, watch for console errors).
5. If the Node.js version itself changes, update `engines` in `package.json`, `.nvmrc`, and both GitHub Actions workflows together, and flag the Vercel project settings for a manual update.

**Deferred major-version bumps** (available but not yet done — each needs its own pass per the process above):
- `typescript` 5 → 7 (skips a full major generation; expect newly-enforced strictness across the codebase)
- `eslint` 9 → 10 (flat config should mostly carry over, but `eslint-config-next` and any other plugins need a compatibility check first)
- `apexcharts` 5 → 6 (check whether `react-apexcharts` needs a matching bump; used for chart rendering, so needs a visual check, not just a type check)

**This repo specifically**: because this is a modified/future version of Next.js and its ecosystem (see the warning at the top of `AGENTS.md`), don't assume standard upstream upgrade behavior even for a minor-version bump — check `node_modules/<package>/dist/docs` or the package's own CHANGELOG first. This isn't theoretical: this session alone found real, undocumented-to-training-data differences (CSP/proxy handling, and `next dev` auto-regenerating part of `AGENTS.md` on Next.js 16.3+).

## Available Scripts
- `npm run dev` — start the dev server (Turbopack).
- `npm run build` — production build.
- `npm run start` — run the production build.
- `npm run lint` — ESLint.
- `npm test` / `npm run test:run` — Vitest, watch mode / single run.
- `npm run test:e2e` / `npm run test:e2e:headed` — Playwright, headless / visible browser.

## Learn More
Built with Next.js 16, React 19, Tailwind CSS v4, and daisyUI 5. See the [Next.js Documentation](https://nextjs.org/docs) for framework details.
