# QuickResumeBuilder.online

A free, in-browser resume and cover letter builder built with Next.js. Fill in your details, see a live preview, and export to PDF, Word, or plain text — no account or sign-up required, though logging in lets you sync your saved resumes and cover letters across devices.

## Features

### Resume Builder
- **Five templates** — Basic, Modern, Minimal, Elegant, and Classic, switchable from the templates gallery (`/templates`).
- **Live drag-and-drop editing** — reorder fields, sections, and repeatable entries (work experience, education, skills, etc.) directly on the resume canvas, with a separate touch-friendly editing form on mobile widths (powered by [dnd-kit](https://dndkit.com/)).
- **Completion tracking** — a step list scrolls you to each section and a radial progress indicator shows what percentage of your resume (personal info + every section's fields) is filled in.
- **Save & manage resumes** — save multiple resumes (2 on the Free plan, unlimited on Pro/Annual — see Subscriptions & Billing below) to a Supabase-backed account, and rename, duplicate, or edit them from `/my-resumes`, which paginates (10 per page), lets you sort by name, created date, or updated date, and bulk-deletes via row checkboxes.
- **Start a new resume anytime** — a "New Resume" button in the editor (next to Preview) clears the canvas back to blank in place, without leaving `/app` or losing your current template/colour/font choices.

### Cover Letter Builder
- **Two templates** — Basic (a plain single-column letter) and Modern (an accent-colored sidebar, defaulting to sender info, beside a white main column — sections are draggable between the two zones, mirroring the resume's Modern template).
- **Five draggable sections** — sender info, recipient info, date, subject, and letter body, each independently reorderable and with its own draggable fields, on both desktop and a separate mobile editing form.
- **Completion tracking** — the same step-list-plus-progress pattern as the resume builder, scoped to the cover letter's sections.
- **Save & manage cover letters** — save multiple cover letters (2 on Free, unlimited on Pro/Annual) and rename, duplicate, or edit them from `/my-cover-letters`, with the same pagination, sorting, and bulk-delete as `/my-resumes`.
- **Start a new cover letter anytime** — the same "New Cover Letter" reset button as the resume editor's, next to Preview.

### Shared across both builders
- **Customization navbar** — accent colours, typography (font family), font size (small/medium/large), and which fields/sections are visible.
- **Export to PDF, Word, or plain text** — a format picker next to Download/Email lets you choose `.pdf`, `.docx`, or `.txt` before downloading (handy for ATS systems that parse plain text more reliably than PDF); print or open a full-page preview first, too.
- **Email export** — send the finished document, in whichever format is currently selected, straight to any email address via [Resend](https://resend.com), as an alternative to downloading it (see `RESEND_API_KEY`/`RESEND_FROM_EMAIL` in Getting Started below). Guarded by the same invisible hCaptcha widget used for silent anonymous sessions, verified server-side (see Bot protection below), so the route can't be used to spam arbitrary addresses.
- **13 languages** — the entire UI (not just your content) can be translated on the fly via a language switcher in the navbar, powered by [i18next](https://www.i18next.com/)/react-i18next.

### Accounts & Authentication
- **Anonymous by default** — a silent Supabase anonymous session is created on first save, so resumes/cover letters can be saved with no sign-up.
- **Email/password or Google login** (`/login`, linked from the "Log In" button in the navbar) — signing up with email/password converts the anonymous session into a real account in place, carrying over already-saved resumes/cover letters (Google sign-up starts a fresh account instead, since Supabase can't link a Google identity that's already tied to a different existing account — see `lib/supabase/auth.ts`).
- **Remember me** — unchecking it on the login form downgrades the session cookie to a browser-session-only one right after signing in, so it clears when the browser closes instead of persisting for months (see `lib/supabase/rememberMe.ts` for why this needs a manual cookie rewrite rather than a client option).
- **Password reset** — "Forgot password?" on the login page emails a reset link (`/reset-password`) via `supabase.auth.resetPasswordForEmail`.
- **Bot protection (hCaptcha)** — an hCaptcha challenge guards login, signup, and password-reset requests; only renders/is required when `NEXT_PUBLIC_HCAPTCHA_SITE_KEY` is set, so local dev works before it's configured (see Bot protection below).
- **Account page** (`/account`, linked from the navbar dropdown) — shows your email and member-since date, lets you export all your data (resumes, cover letters, subscription) as a JSON file, and delete your account entirely (cascades to every saved resume/cover letter and cancels any active subscription first).

### Subscriptions & Billing
- **Three tiers** — Free ($0, 2 saved resumes + 2 saved cover letters), Pro ($19.99/mo), and Annual ($167.99/yr, ~30% off vs. monthly) — Pro and Annual unlock the same thing (unlimited saves), just billed differently, modeled in Stripe as one Product with two Prices. Shown in a pricing section on the landing page (`/#pricing`).
- **Stripe Checkout** — upgrading redirects to Stripe's hosted Checkout page; a real (non-anonymous) account is required first, since a subscription has to attach to *something*.
- **Free-tier limit prompt** — hitting the save cap on Free pops an upgrade dialog (reusing the same `ConfirmDialog` used elsewhere) linking to `/#pricing`, instead of a hard error. Enforced consistently everywhere a new saved item could be created — Save, Duplicate, and the New Resume/New Cover Letter reset buttons all check the same limit, not just Save.
- **Self-service billing** (`/billing`, linked from the navbar dropdown) — view your current plan and cancel/resume a subscription in-app, without leaving the site. Canceling takes effect at the end of the current billing period, not immediately.
- **Webhook-driven state** — a Stripe webhook (`/api/stripe/webhook`) is the *only* place that writes subscription state to Supabase, using a service-role client that bypasses RLS; every other route just reads. It also sends a one-time welcome email (via `lib/email/sendWelcomeEmail.ts`) the first time a user subscribes — never on renewals, plan switches, or resubscribes, detected by checking whether a subscriptions row already existed before the upsert.

### Support
- **Support page** (`/support`, linked from the navbar dropdown) — shows the support email address (`lib/supportEmail.ts`) with a "Start Live Chat" button that opens the Tawk.to widget (`lib/tawkChat.ts`'s `openSupportChat`), falling back to a `mailto:` link if the widget hasn't loaded.
- **Live chat** — a [Tawk.to](https://www.tawk.to) widget embedded site-wide (see `NEXT_PUBLIC_TAWKTO_PROPERTY_ID`/`NEXT_PUBLIC_TAWKTO_WIDGET_ID` in Getting Started below); renders nothing if those env vars aren't set, so local dev works without a Tawk.to account.

### Privacy & feedback
- **Cookie consent** (`components/CookieConsent.tsx`) — a banner offering Accept All/Reject All/Customize, gating three categories: necessary (always on), analytics (Vercel Analytics/Speed Insights, see `ConsentedAnalytics.tsx`), and support chat (the Tawk.to widget). Choices persist in a cookie and can be reopened later via the footer's "Cookie Preferences" link.
- **Privacy Policy & Terms of Service** (`/privacy`, `/terms`) — linked from the footer and the cookie banner.
- **Toast notifications** (`components/Toast.tsx`) — any of this app's own API calls that fail surface a daisyUI toast, colour-coded by HTTP status: yellow for 4xx, red for 5xx (2xx/3xx responses stay silent). Messages are localized per the user's selected UI language via a request header (`lib/apiLocaleHeader.ts`), not the browser's `Accept-Language` (see `lib/apiResponse.ts` client-side and `lib/apiErrors.ts` server-side).

### Marketing site
- **Landing page** (`/`) — hero section, a highlight grid of the features above, a Free/Pro/Annual feature-comparison pricing table, and a daisyUI carousel of user testimonials (3 visible at once on desktop, Prev/Next buttons scroll by one card).
- **Blog** (`/blog`, linked from the navbar) — posts are stored in Supabase (`blog_posts` table), publicly readable by anyone but writable only by admins. Logged-in admins see an "Add Blog" button opening a form (title, subtitle, content, category badge, date, author name/avatar URL, read time); everyone else just sees the card grid. Each post gets its own Medium-style `/blog/[slug]` page. See Blog admin setup below to grant yourself the admin role.

### Role-based authorization
- **Admin role** — a single `app_metadata.role` claim (set server-side only, via `scripts/set-admin.mjs` — regular users can never grant it to themselves) gates the blog's "Add Blog" form, both client-side (hides the button, see `components/useIsAdmin.ts`) and, more importantly, at the database level: the `blog_posts` table's insert RLS policy checks the same claim directly in Postgres (`auth.jwt() -> 'app_metadata' ->> 'role'`), so it can't be bypassed by calling the API route directly.

## Getting Started

Copy the environment template and fill in your Supabase project's credentials, plus a [Resend](https://resend.com) API key if you want the Email export/welcome-email features to actually send mail (`RESEND_FROM_EMAIL` falls back to Resend's shared sandbox address until you verify your own domain). See Billing setup, Support, Blog admin setup, and Bot protection below for the Stripe, Tawk.to, and hCaptcha variables.

```bash
cp .env.example .env.local
```

Then run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Auth setup (Supabase Dashboard)

- **Google sign-in** — create an OAuth client in [Google Cloud Console](https://console.cloud.google.com/auth/clients/create) (type "Web application", authorized redirect URI `https://<project-ref>.supabase.co/auth/v1/callback`), then paste the Client ID/Secret into **Authentication → Providers → Google**. Signing up with Google while anonymous requires **manual linking** to be enabled under the same Providers page.
- **Redirect URLs** — under **Authentication → URL Configuration**, add `http://localhost:3000/auth/callback` for local dev and `https://<your-production-domain>/auth/callback` for prod (both, not just one — email confirmation/reset links use whichever origin they were sent from). Set **Site URL** to your production domain as the fallback default.
- **Email delivery** — Supabase's built-in email service is dev-only and rate-limited (a handful of emails/hour). For real signup-confirmation/password-reset emails, configure custom SMTP under **Authentication → Emails → SMTP Settings** — this project already has a Resend account wired up for the Email export feature, so pointing SMTP at `smtp.resend.com` (username `resend`, password = your `RESEND_API_KEY`) with a sender address on a Resend-verified domain reuses that same setup.

### Database setup (Supabase SQL Editor)

Run every file under `supabase/migrations/` in order (`0001` → `0006`) in **Supabase Dashboard → SQL Editor** — there's no linked CLI project here, so migrations aren't applied automatically. `0004_create_subscriptions.sql`/`0005_add_cancel_at_period_end.sql` are required for the subscriptions feature below; `0006_create_blog_posts.sql` is required for the blog (and seeds it with 6 starter posts).

Also grab your **service role key** (Project Settings → API) and set it as `SUPABASE_SERVICE_ROLE_KEY` — this is the one env var in this project that must *never* have the `NEXT_PUBLIC_` prefix or reach the browser (see `lib/supabase/serviceRole.ts`'s top comment).

### Billing setup (Stripe)

1. Set `STRIPE_SECRET_KEY` (a test-mode key to start) in `.env.local`.
2. Run `node scripts/setup-stripe.mjs` — it creates the "QuickResumeBuilder Pro" Product with monthly ($19.99) and yearly ($167.99) Prices in your Stripe account (safe to re-run; it reuses existing ones instead of duplicating), and prints `STRIPE_PRICE_ID_MONTHLY`/`STRIPE_PRICE_ID_ANNUAL` to add to `.env.local`.
3. For the webhook, either run the [Stripe CLI](https://stripe.com/docs/stripe-cli) locally (`stripe listen --forward-to localhost:3000/api/stripe/webhook`, which prints a `STRIPE_WEBHOOK_SECRET`), or add a production webhook endpoint in the Stripe Dashboard pointing at `/api/stripe/webhook`, listening for `checkout.session.completed`, `customer.subscription.updated`, and `customer.subscription.deleted`.
4. On Vercel (or wherever this deploys), add all of the above as real Environment Variables in the project settings — `.env.local` never leaves your machine, and the Stripe client is lazily instantiated (`lib/stripe.ts`) specifically so a missing key doesn't crash the build, only routes that are actually called at runtime.

### Support (Tawk.to)

Sign up free at [tawk.to](https://www.tawk.to), create a property, and grab the two IDs from the embed snippet's URL (`https://embed.tawk.to/<PROPERTY_ID>/<WIDGET_ID>`) — set them as `NEXT_PUBLIC_TAWKTO_PROPERTY_ID`/`NEXT_PUBLIC_TAWKTO_WIDGET_ID`. Optional: the widget just doesn't render if these are unset.

### Blog admin setup

1. Run `0006_create_blog_posts.sql` (see Database setup above) if you haven't already.
2. Grant yourself the admin role: `node scripts/set-admin.mjs you@example.com` (requires `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`, already set up above).
3. Log out and back in — `app_metadata` only lands in your session's JWT at login/refresh time, so the "Add Blog" button won't appear until then.

### Bot protection (hCaptcha)

1. Sign up at [hCaptcha](https://www.hcaptcha.com), create a site, add your domain(s) (and `localhost` for local dev) to its domain allowlist, and grab the **Site Key** and **Secret Key**.
2. Set the Site Key as `NEXT_PUBLIC_HCAPTCHA_SITE_KEY` — the widget on `/login` (login, signup, and password-reset forms), the invisible widget used for silent anonymous sessions, and the one guarding `/api/send-email` all only render/are required once this is set, so local dev works fine before you get to this step.
3. In **Supabase Dashboard → Authentication → Attack Protection**, enable CAPTCHA protection, select hCaptcha, and paste in the same **Secret Key** (this copy of it only ever lives in Supabase's own config, never in this codebase). Without this step, the app sends a captcha token on every auth request but Supabase won't actually require or verify it yet.
4. Also set the Secret Key as `HCAPTCHA_SECRET_KEY` in `.env.local` — unlike the auth flows above, `/api/send-email` never touches Supabase Auth, so this route verifies the token itself directly against hCaptcha's API (`lib/hcaptcha.ts`) rather than relying on Supabase to do it. Without this step, the route accepts email-send requests with no captcha check at all.

## Project Structure

- `app/` — Next.js App Router pages: `/` (marketing landing page), `/blog` + `/blog/[slug]` (Supabase-backed blog list and post pages — see Blog above), `/login` (login/signup), `/reset-password` (set a new password), `/account` (profile info, data export, delete account), `/billing` (plan, cancel/resume subscription), `/support` (support email + live chat), `/privacy`/`/terms` (Privacy Policy/Terms of Service), `/auth/callback` (route handler completing OAuth/email-link redirects via `exchangeCodeForSession`), `/app` (resume editor), `/templates` (template gallery), `/my-resumes` (saved resumes list), `/cover-letter` (cover letter editor), `/my-cover-letters` (saved cover letters list), `/api/account/export`/`delete` (data export/account deletion), `/api/send-email` (relays a client-generated PDF, Word document, or plain-text file through Resend), `/api/blog` (admin-gated, creates a blog post), `/api/stripe/checkout`/`webhook`/`cancel` (subscription routes — see Subscriptions & Billing above).
- `components/`
  - `resumes/` — `ResumeBuilder.tsx` (page orchestration: state, persistence, mobile/desktop switching), `Resume.tsx` (the desktop drag-and-drop editing canvas), `desktop-templates/`/`mobile-templates/` (per-template read-only and mobile-editing-form components).
  - `cover-letter/` — similar shape to `resumes/`: `CoverLetterBuilder.tsx` (page orchestration), `CoverLetter.tsx` (thin desktop wrapper), `desktop-templates/`/`mobile-templates/` (per-template read-only and mobile-editing-form components, including `CoverLetterModernMobileTemplate.tsx`'s stacked colored-block layout). `CoverLetterFormFields.tsx` owns the actual field/section markup and layout for every template × both view modes in one place (a level of sharing the resume side doesn't attempt, since each resume mobile template still defines its own fields independently) — `CoverLetter.tsx` and the mobile templates are just thin wrappers that lock in `mobile`/a `templateId` and forward the rest.
  - `pdf/` — per-template `@react-pdf/renderer` components, used by the shared, generic `DownloadButton.tsx` and `EmailButton.tsx` (both accept any PDF template component + its props, plus a `format` prop — PDF/Word/plain-text — and generate the matching output client-side; `EmailButton.tsx` posts the result to `/api/send-email`; see `ExportFormatMenu.tsx` for the format picker and `lib/text/`/`lib/docx/` below for the non-PDF renderers).
  - `navbar/` — the Templates/Features/Colours/Typography/Font Size dropdowns shown on both editors, plus `AuthButton.tsx` (the navbar's "Log In" link / logged-in email+logout dropdown, with a "My Account" link to `/account`).
  - `LoginPage.tsx`/`ResetPasswordPage.tsx`/`AccountPage.tsx`/`BillingPage.tsx`/`SupportPage.tsx` — the client-side content behind `/login`, `/reset-password`, `/account`, `/billing`, and `/support` (each page's `page.tsx` is a thin server wrapper that just adds SEO metadata).
  - `landing-page/` — `LandingPage.tsx` (the `/` marketing page) and `PricingSection.tsx` (the Free/Pro/Annual pricing comparison table it renders); `TawkChat.tsx` — the site-wide live chat script embed.
  - `BlogPageContent.tsx`/`BlogPostContent.tsx` — the `/blog` card grid and Medium-style `/blog/[slug]` article layout; `AddBlogPostDialog.tsx` — the admin-only "Add Blog" form; `useIsAdmin.ts` — the small hook gating that button client-side (the real enforcement is the `blog_posts` RLS policy, see Role-based authorization above).
  - `CookieConsent.tsx`/`ConsentedAnalytics.tsx` — the cookie banner/preferences context and the analytics scripts it gates (see Privacy & feedback above).
  - `Toast.tsx` — the global toast provider/hook (`useToast`) behind the colour-coded API error notifications (see Privacy & feedback above).
  - Shared UI: `PreviewModal.tsx` (with `ScaleToFit.tsx`, which shrinks the previewed document to fit the modal without a scrollbar unless it's genuinely multi-page), `DownloadButton.tsx`/`EmailButton.tsx` (generic, accept any template component + props), `Sidebar.tsx`, `Sortable.tsx` (drag-and-drop primitives, including the `SortableZones`/`SortableZone` pair both Modern templates use for sidebar/main dragging), `PrintButton.tsx`, `SaveResumeDialog.tsx`, `ConfirmDialog.tsx` (also reused for the upgrade-prompt and cancel-subscription confirmations), `SortableColumnHeader.tsx`/`TableFillerRows.tsx` (the sortable-column headers and height-matching filler rows shared by `/my-resumes` and `/my-cover-letters`' paginated tables), and other primitives reused by both builders.
- `lib/` — resume data types (`resumeData.ts`) and cover letter data types (`coverLetterData.ts`), template registries (`templates.ts`, `coverLetterTemplates.ts`) and their PDF counterparts (`lib/pdf/templates.ts`, `lib/pdf/coverLetterTemplates.ts`), font/colour/font-size options, the i18n setup (`lib/i18n/`), PDF rendering helpers (`lib/pdf/`), `exportFormat.ts` (the shared `"pdf" | "docx" | "txt"` type), `resumeContent.ts` (field/entry filtering shared by the non-PDF resume renderers below, so `.txt`/`.docx` output can't drift apart), `lib/text/` (plain-text renderers, `resumeText.ts`/`coverLetterText.ts`), `lib/docx/` (Word-document renderers, `resumeDocx.ts`/`coverLetterDocx.ts`, built with the [`docx`](https://www.npmjs.com/package/docx) package and only ever reached via dynamic `import()` at Download/Email click-time so it stays out of the initial editor bundle), `stripe.ts` (lazily-instantiated Stripe client — see Billing setup above for why), `generateId.ts` (secure-context-safe ID generator, falls back to `crypto.getRandomValues` when `crypto.randomUUID` isn't available), `constants.ts` (shared numeric constants — HTTP status codes, size/length limits, UI timing durations, pagination sizes — see Privacy & feedback above for the error-handling ones), `supportEmail.ts`/`tawkChat.ts` (the support email address and `openSupportChat` chat-widget trigger behind `/support`), email (`lib/email/`), and Supabase helpers (`lib/supabase/`):
  - `apiResponse.ts` — client-side: categorizes a `fetch` response's HTTP status into a toast colour/message via `handleApiResponse` (see Privacy & feedback above).
  - `apiErrors.ts` — server-side counterpart: `errorResponse(status, key, request)`, used by every API route to return a `{ error }` JSON body localized per the request's `X-App-Locale` header (`apiLocaleHeader.ts`) rather than hardcoded English.
  - `client.ts`/`server.ts`/`proxy.ts` — browser/server/middleware Supabase client factories.
  - `serviceRole.ts` — the RLS-bypassing client, used only by the Stripe webhook to write subscription state.
  - `session.ts` — `ensureUserId`, the silent anonymous-session helper used throughout the app.
  - `invisibleCaptcha.ts` — bridges the invisible hCaptcha widget (`components/InvisibleCaptcha.tsx`) to `ensureUserId` and `EmailButton.tsx`, its two independent consumers; queues concurrent token requests since the widget only supports one `.execute()` at a time. `lib/hcaptcha.ts` (server-side) verifies the tokens `/api/send-email` receives.
  - `auth.ts` — login/signup/Google/password-reset actions, each explicitly passing a `redirectTo` derived from the caller's own origin rather than relying on Supabase's dashboard-configured Site URL default (see the file's top comment for why), plus an optional `captchaToken` forwarded to Supabase once hCaptcha is configured (see Bot protection above).
  - `rememberMe.ts` — `forgetSessionOnBrowserClose`, the "Remember me" cookie downgrade (see Accounts & Authentication above).
  - `resumes.ts`/`coverLetters.ts` — pagination/sorting/CRUD helpers, including `listResumes`/`listCoverLetters`/`listAllResumes`/`listAllCoverLetters` (the latter two power the `/account` data export, unpaginated).
  - `subscriptions.ts` — `getSubscription`/`isPaidPlan`, the read side of the subscriptions table (writes only ever happen in the webhook; the free-tier limits themselves live in `constants.ts`'s `FREE_TIER_LIMITS`).
  - `blogPosts.ts` — `getBlogPosts`/`getBlogPostBySlug`/`createBlogPost`, the read/write side of the `blog_posts` table (see Blog above).
  - `lib/email/` — `resend.ts` (lazily-instantiated shared client, same reasoning as `stripe.ts`), `sendPdfEmail.ts`/`sendDocxEmail.ts`/`sendTextEmail.ts` (one per export format attachment) and `sendWelcomeEmail.ts` (this app's transactional emails), `escapeHtml.ts`.
- `scripts/setup-stripe.mjs` — one-time script that creates the Stripe Product/Prices for the Pro plan (see Billing setup above).
- `scripts/set-admin.mjs` — one-time script that grants the blog admin role to a user by email (see Blog admin setup above).
- `supabase/migrations/` — numbered SQL migrations, applied manually via the Supabase SQL Editor (see Database setup above).

## Available Scripts

- `npm run dev` — start the development server (Turbopack).
- `npm run build` — build for production.
- `npm run start` — run the production build.
- `npm run lint` — run ESLint.

## Learn More

This project uses Next.js 16, React 19, Tailwind CSS v4, and daisyUI 5. See [Next.js Documentation](https://nextjs.org/docs) for framework-level details.
