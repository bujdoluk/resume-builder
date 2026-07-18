# QuickResumeBuilder.online

A free, in-browser resume and cover letter builder built with Next.js. Fill in your details, see a live preview, and export straight to PDF — no account or sign-up required, though logging in lets you sync your saved resumes and cover letters across devices.

## Features

### Resume Builder
- **Five templates** — Basic, Modern, Minimal, Elegant, and Classic, switchable from the templates gallery (`/templates`).
- **Live drag-and-drop editing** — reorder fields, sections, and repeatable entries (work experience, education, skills, etc.) directly on the resume canvas, with a separate touch-friendly editing form on mobile widths (powered by [dnd-kit](https://dndkit.com/)).
- **Completion tracking** — a step list scrolls you to each section and a radial progress indicator shows what percentage of your resume (personal info + every section's fields) is filled in.
- **Save & manage resumes** — save multiple resumes (2 on the Free plan, unlimited on Pro/Annual — see Subscriptions & Billing below) to a Supabase-backed account, and rename, duplicate, or edit them from `/my-resumes`, which paginates (10 per page), lets you sort by name, created date, or updated date, and bulk-deletes via row checkboxes.

### Cover Letter Builder
- **Two templates** — Basic (a plain single-column letter) and Modern (an accent-colored sidebar, defaulting to sender info, beside a white main column — sections are draggable between the two zones, mirroring the resume's Modern template).
- **Five draggable sections** — sender info, recipient info, date, subject, and letter body, each independently reorderable and with its own draggable fields, on both desktop and a separate mobile editing form.
- **Completion tracking** — the same step-list-plus-progress pattern as the resume builder, scoped to the cover letter's sections.
- **Save & manage cover letters** — save multiple cover letters (2 on Free, unlimited on Pro/Annual) and rename, duplicate, or edit them from `/my-cover-letters`, with the same pagination, sorting, and bulk-delete as `/my-resumes`.

### Shared across both builders
- **Customization navbar** — accent colours, typography (font family), font size (small/medium/large), and which fields/sections are visible.
- **PDF export** — download the finished document as a PDF, print it, or open a full-page preview first.
- **Email export** — send the finished PDF straight to any email address via [Resend](https://resend.com), as an alternative to downloading it (see `RESEND_API_KEY`/`RESEND_FROM_EMAIL` in Getting Started below).
- **13 languages** — the entire UI (not just your content) can be translated on the fly via a language switcher in the navbar, powered by [i18next](https://www.i18next.com/)/react-i18next.

### Accounts & Authentication
- **Anonymous by default** — a silent Supabase anonymous session is created on first save, so resumes/cover letters can be saved with no sign-up.
- **Email/password or Google login** (`/login`, linked from the "Log In" button in the navbar) — signing up with email/password converts the anonymous session into a real account in place, carrying over already-saved resumes/cover letters (Google sign-up starts a fresh account instead, since Supabase can't link a Google identity that's already tied to a different existing account — see `lib/supabase/auth.ts`).
- **Password reset** — "Forgot password?" on the login page emails a reset link (`/reset-password`) via `supabase.auth.resetPasswordForEmail`.

### Subscriptions & Billing
- **Three tiers** — Free ($0, 2 saved resumes + 2 saved cover letters), Pro ($19.99/mo), and Annual ($167.99/yr, ~30% off vs. monthly) — Pro and Annual unlock the same thing (unlimited saves), just billed differently, modeled in Stripe as one Product with two Prices. Shown in a pricing section on the landing page (`/#pricing`).
- **Stripe Checkout** — upgrading redirects to Stripe's hosted Checkout page; a real (non-anonymous) account is required first, since a subscription has to attach to *something*.
- **Free-tier limit prompt** — hitting the save cap on Free pops an upgrade dialog (reusing the same `ConfirmDialog` used elsewhere) linking to `/#pricing`, instead of a hard error.
- **Self-service billing** (`/account`, linked from the navbar dropdown) — view your current plan and cancel/resume a subscription in-app, without leaving the site. Canceling takes effect at the end of the current billing period, not immediately.
- **Webhook-driven state** — a Stripe webhook (`/api/stripe/webhook`) is the *only* place that writes subscription state to Supabase, using a service-role client that bypasses RLS; every other route just reads.

### Support
- **Live chat** — a [Tawk.to](https://www.tawk.to) widget embedded site-wide (see `NEXT_PUBLIC_TAWKTO_PROPERTY_ID`/`NEXT_PUBLIC_TAWKTO_WIDGET_ID` in Getting Started below); renders nothing if those env vars aren't set, so local dev works without a Tawk.to account.

### Marketing site
- **Landing page** (`/`) — hero section, a highlight grid of the features above, the pricing section, and a daisyUI carousel of user testimonials (3 visible at once on desktop, Prev/Next buttons scroll by one card).
- **Blog** (`/blog`) — placeholder page linked from the navbar, ready for future posts.

## Getting Started

Copy the environment template and fill in your Supabase project's credentials, plus a [Resend](https://resend.com) API key if you want the Email export feature to actually send mail (`RESEND_FROM_EMAIL` falls back to Resend's shared sandbox address until you verify your own domain). See Billing setup and Support below for the Stripe and Tawk.to variables.

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

Run every file under `supabase/migrations/` in order (`0001` → `0005`) in **Supabase Dashboard → SQL Editor** — there's no linked CLI project here, so migrations aren't applied automatically. The last two (`0004_create_subscriptions.sql`, `0005_add_cancel_at_period_end.sql`) are required for the subscriptions feature below.

Also grab your **service role key** (Project Settings → API) and set it as `SUPABASE_SERVICE_ROLE_KEY` — this is the one env var in this project that must *never* have the `NEXT_PUBLIC_` prefix or reach the browser (see `lib/supabase/serviceRole.ts`'s top comment).

### Billing setup (Stripe)

1. Set `STRIPE_SECRET_KEY` (a test-mode key to start) in `.env.local`.
2. Run `node scripts/setup-stripe.mjs` — it creates the "QuickResumeBuilder Pro" Product with monthly ($19.99) and yearly ($167.99) Prices in your Stripe account (safe to re-run; it reuses existing ones instead of duplicating), and prints `STRIPE_PRICE_ID_MONTHLY`/`STRIPE_PRICE_ID_ANNUAL` to add to `.env.local`.
3. For the webhook, either run the [Stripe CLI](https://stripe.com/docs/stripe-cli) locally (`stripe listen --forward-to localhost:3000/api/stripe/webhook`, which prints a `STRIPE_WEBHOOK_SECRET`), or add a production webhook endpoint in the Stripe Dashboard pointing at `/api/stripe/webhook`, listening for `checkout.session.completed`, `customer.subscription.updated`, and `customer.subscription.deleted`.
4. On Vercel (or wherever this deploys), add all of the above as real Environment Variables in the project settings — `.env.local` never leaves your machine, and the Stripe client is lazily instantiated (`lib/stripe.ts`) specifically so a missing key doesn't crash the build, only routes that are actually called at runtime.

### Support (Tawk.to)

Sign up free at [tawk.to](https://www.tawk.to), create a property, and grab the two IDs from the embed snippet's URL (`https://embed.tawk.to/<PROPERTY_ID>/<WIDGET_ID>`) — set them as `NEXT_PUBLIC_TAWKTO_PROPERTY_ID`/`NEXT_PUBLIC_TAWKTO_WIDGET_ID`. Optional: the widget just doesn't render if these are unset.

## Project Structure

- `app/` — Next.js App Router pages: `/` (marketing landing page), `/blog` (placeholder blog page), `/login` (login/signup), `/reset-password` (set a new password), `/account` (view plan, cancel/resume subscription), `/auth/callback` (route handler completing OAuth/email-link redirects via `exchangeCodeForSession`), `/app` (resume editor), `/templates` (template gallery), `/my-resumes` (saved resumes list), `/cover-letter` (cover letter editor), `/my-cover-letters` (saved cover letters list), `/api/send-email` (relays a client-generated PDF through Resend), `/api/stripe/checkout`/`webhook`/`cancel` (subscription routes — see Subscriptions & Billing above).
- `components/`
  - `resumes/` — `ResumeBuilder.tsx` (page orchestration: state, persistence, mobile/desktop switching), `Resume.tsx` (the desktop drag-and-drop editing canvas), `desktop-templates/`/`mobile-templates/` (per-template read-only and mobile-editing-form components).
  - `cover-letter/` — similar shape to `resumes/`: `CoverLetterBuilder.tsx` (page orchestration), `CoverLetter.tsx` (thin desktop wrapper), `desktop-templates/`/`mobile-templates/` (per-template read-only and mobile-editing-form components, including `CoverLetterModernMobileTemplate.tsx`'s stacked colored-block layout). `CoverLetterFormFields.tsx` owns the actual field/section markup and layout for every template × both view modes in one place (a level of sharing the resume side doesn't attempt, since each resume mobile template still defines its own fields independently) — `CoverLetter.tsx` and the mobile templates are just thin wrappers that lock in `mobile`/a `templateId` and forward the rest.
  - `pdf/` — per-template `@react-pdf/renderer` components, used by the shared, generic `DownloadButton.tsx` and `EmailButton.tsx` (both accept any PDF template component + its props; `EmailButton.tsx` generates the same client-side PDF and posts it to `/api/send-email`).
  - `navbar/` — the Templates/Features/Colours/Typography/Font Size dropdowns shown on both editors, plus `AuthButton.tsx` (the navbar's "Log In" link / logged-in email+logout dropdown, with a "My Account" link to `/account`).
  - `LoginPage.tsx`/`ResetPasswordPage.tsx`/`AccountPage.tsx` — the client-side content behind `/login`, `/reset-password`, and `/account` (each page's `page.tsx` is a thin server wrapper that just adds SEO metadata).
  - `PricingSection.tsx` — the Free/Pro/Annual pricing cards rendered on the landing page; `TawkChat.tsx` — the site-wide live chat script embed.
  - Shared UI: `PreviewModal.tsx`, `DownloadButton.tsx`/`EmailButton.tsx` (generic, accept any template component + props), `Sidebar.tsx`, `Sortable.tsx` (drag-and-drop primitives, including the `SortableZones`/`SortableZone` pair both Modern templates use for sidebar/main dragging), `PrintButton.tsx`, `SaveResumeDialog.tsx`, `ConfirmDialog.tsx` (also reused for the upgrade-prompt and cancel-subscription confirmations), `SortableColumnHeader.tsx`/`TableFillerRows.tsx` (the sortable-column headers and height-matching filler rows shared by `/my-resumes` and `/my-cover-letters`' paginated tables), `BlogPageContent.tsx`, and other primitives reused by both builders.
- `lib/` — resume data types (`resumeData.ts`) and cover letter data types (`coverLetterData.ts`), template registries (`templates.ts`, `coverLetterTemplates.ts`) and their PDF counterparts (`lib/pdf/templates.ts`, `lib/pdf/coverLetterTemplates.ts`), font/colour/font-size options, the i18n setup (`lib/i18n/`), PDF rendering helpers (`lib/pdf/`), `stripe.ts` (lazily-instantiated Stripe client — see Billing setup above for why), and Supabase helpers (`lib/supabase/`):
  - `client.ts`/`server.ts`/`proxy.ts` — browser/server/middleware Supabase client factories.
  - `serviceRole.ts` — the RLS-bypassing client, used only by the Stripe webhook to write subscription state.
  - `session.ts` — `ensureUserId`, the silent anonymous-session helper used throughout the app.
  - `auth.ts` — login/signup/Google/password-reset actions, each explicitly passing a `redirectTo` derived from the caller's own origin rather than relying on Supabase's dashboard-configured Site URL default (see the file's top comment for why).
  - `resumes.ts`/`coverLetters.ts` — pagination/sorting/CRUD helpers, including `listResumes`/`listCoverLetters`.
  - `subscriptions.ts` — `getSubscription`/`isPaidPlan`/`FREE_TIER_LIMITS`, the read side of the subscriptions table (writes only ever happen in the webhook).
- `scripts/setup-stripe.mjs` — one-time script that creates the Stripe Product/Prices for the Pro plan (see Billing setup above).
- `supabase/migrations/` — numbered SQL migrations, applied manually via the Supabase SQL Editor (see Database setup above).

## Available Scripts

- `npm run dev` — start the development server (Turbopack).
- `npm run build` — build for production.
- `npm run start` — run the production build.
- `npm run lint` — run ESLint.

## Learn More

This project uses Next.js 16, React 19, Tailwind CSS v4, and daisyUI 5. See [Next.js Documentation](https://nextjs.org/docs) for framework-level details.
