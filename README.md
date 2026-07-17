# QuickResumeBuilder.com

A free, in-browser resume and cover letter builder built with Next.js. Fill in your details, see a live preview, and export straight to PDF — no account or sign-up required, though logging in lets you sync your saved resumes and cover letters across devices.

## Features

### Resume Builder
- **Five templates** — Basic, Modern, Minimal, Elegant, and Classic, switchable from the templates gallery (`/templates`).
- **Live drag-and-drop editing** — reorder fields, sections, and repeatable entries (work experience, education, skills, etc.) directly on the resume canvas, with a separate touch-friendly editing form on mobile widths (powered by [dnd-kit](https://dndkit.com/)).
- **Completion tracking** — a step list scrolls you to each section and a radial progress indicator shows what percentage of your resume (personal info + every section's fields) is filled in.
- **Save & manage resumes** — save multiple resumes to a Supabase-backed account and rename, duplicate, or edit them from `/my-resumes`, which paginates (10 per page), lets you sort by name, created date, or updated date, and bulk-deletes via row checkboxes.

### Cover Letter Builder
- **Two templates** — Basic (a plain single-column letter) and Modern (an accent-colored sidebar, defaulting to sender info, beside a white main column — sections are draggable between the two zones, mirroring the resume's Modern template).
- **Five draggable sections** — sender info, recipient info, date, subject, and letter body, each independently reorderable and with its own draggable fields, on both desktop and a separate mobile editing form.
- **Completion tracking** — the same step-list-plus-progress pattern as the resume builder, scoped to the cover letter's sections.
- **Save & manage cover letters** — save multiple cover letters and rename, duplicate, or edit them from `/my-cover-letters`, with the same pagination, sorting, and bulk-delete as `/my-resumes`.

### Shared across both builders
- **Customization navbar** — accent colours, typography (font family), font size (small/medium/large), and which fields/sections are visible.
- **PDF export** — download the finished document as a PDF, print it, or open a full-page preview first.
- **Email export** — send the finished PDF straight to any email address via [Resend](https://resend.com), as an alternative to downloading it (see `RESEND_API_KEY`/`RESEND_FROM_EMAIL` in Getting Started below).
- **13 languages** — the entire UI (not just your content) can be translated on the fly via a language switcher in the navbar, powered by [i18next](https://www.i18next.com/)/react-i18next.

### Accounts & Authentication
- **Anonymous by default** — a silent Supabase anonymous session is created on first save, so resumes/cover letters can be saved with no sign-up.
- **Email/password or Google login** (`/login`, linked from the "Log In" button in the navbar) — signing up with email/password converts the anonymous session into a real account in place, carrying over already-saved resumes/cover letters (Google sign-up starts a fresh account instead, since Supabase can't link a Google identity that's already tied to a different existing account — see `lib/supabase/auth.ts`).
- **Password reset** — "Forgot password?" on the login page emails a reset link (`/reset-password`) via `supabase.auth.resetPasswordForEmail`.

### Marketing site
- **Landing page** (`/`) — hero section, a highlight grid of the features above, and a daisyUI carousel of user testimonials (3 visible at once on desktop, Prev/Next buttons scroll by one card).
- **Blog** (`/blog`) — placeholder page linked from the navbar, ready for future posts.

## Getting Started

Copy the environment template and fill in your Supabase project's credentials, plus a [Resend](https://resend.com) API key if you want the Email export feature to actually send mail (`RESEND_FROM_EMAIL` falls back to Resend's shared sandbox address until you verify your own domain):

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

## Project Structure

- `app/` — Next.js App Router pages: `/` (marketing landing page), `/blog` (placeholder blog page), `/login` (login/signup), `/reset-password` (set a new password), `/auth/callback` (route handler completing OAuth/email-link redirects via `exchangeCodeForSession`), `/app` (resume editor), `/templates` (template gallery), `/my-resumes` (saved resumes list), `/cover-letter` (cover letter editor), `/my-cover-letters` (saved cover letters list), `/api/send-email` (route handler behind the Email export button, relays a client-generated PDF through Resend).
- `components/`
  - `resumes/` — `ResumeBuilder.tsx` (page orchestration: state, persistence, mobile/desktop switching), `Resume.tsx` (the desktop drag-and-drop editing canvas), `desktop-templates/`/`mobile-templates/` (per-template read-only and mobile-editing-form components).
  - `cover-letter/` — similar shape to `resumes/`: `CoverLetterBuilder.tsx` (page orchestration), `CoverLetter.tsx` (thin desktop wrapper), `desktop-templates/`/`mobile-templates/` (per-template read-only and mobile-editing-form components, including `CoverLetterModernMobileTemplate.tsx`'s stacked colored-block layout). `CoverLetterFormFields.tsx` owns the actual field/section markup and layout for every template × both view modes in one place (a level of sharing the resume side doesn't attempt, since each resume mobile template still defines its own fields independently) — `CoverLetter.tsx` and the mobile templates are just thin wrappers that lock in `mobile`/a `templateId` and forward the rest.
  - `pdf/` — per-template `@react-pdf/renderer` components, used by the shared, generic `DownloadButton.tsx` and `EmailButton.tsx` (both accept any PDF template component + its props; `EmailButton.tsx` generates the same client-side PDF and posts it to `/api/send-email`).
  - `navbar/` — the Templates/Features/Colours/Typography/Font Size dropdowns shown on both editors, plus `AuthButton.tsx` (the navbar's "Log In" link / logged-in email+logout dropdown).
  - `LoginPage.tsx`/`ResetPasswordPage.tsx` — the client-side content behind `/login` and `/reset-password` (each page's `page.tsx` is a thin server wrapper that just adds SEO metadata).
  - Shared UI: `PreviewModal.tsx`, `DownloadButton.tsx`/`EmailButton.tsx` (generic, accept any template component + props), `Sidebar.tsx`, `Sortable.tsx` (drag-and-drop primitives, including the `SortableZones`/`SortableZone` pair both Modern templates use for sidebar/main dragging), `PrintButton.tsx`, `SaveResumeDialog.tsx`, `SortableColumnHeader.tsx`/`TableFillerRows.tsx` (the sortable-column headers and height-matching filler rows shared by `/my-resumes` and `/my-cover-letters`' paginated tables), `BlogPageContent.tsx`, and other primitives reused by both builders.
- `lib/` — resume data types (`resumeData.ts`) and cover letter data types (`coverLetterData.ts`), template registries (`templates.ts`, `coverLetterTemplates.ts`) and their PDF counterparts (`lib/pdf/templates.ts`, `lib/pdf/coverLetterTemplates.ts`), font/colour/font-size options, the i18n setup (`lib/i18n/`), PDF rendering helpers (`lib/pdf/`), and Supabase helpers (`lib/supabase/`):
  - `client.ts`/`server.ts`/`proxy.ts` — browser/server/middleware Supabase client factories.
  - `session.ts` — `ensureUserId`, the silent anonymous-session helper used throughout the app.
  - `auth.ts` — login/signup/Google/password-reset actions, each explicitly passing a `redirectTo` derived from the caller's own origin rather than relying on Supabase's dashboard-configured Site URL default (see the file's top comment for why).
  - `resumes.ts`/`coverLetters.ts` — pagination/sorting/CRUD helpers, including `listResumes`/`listCoverLetters`.

## Available Scripts

- `npm run dev` — start the development server (Turbopack).
- `npm run build` — build for production.
- `npm run start` — run the production build.
- `npm run lint` — run ESLint.

## Learn More

This project uses Next.js 16, React 19, Tailwind CSS v4, and daisyUI 5. See [Next.js Documentation](https://nextjs.org/docs) for framework-level details.
