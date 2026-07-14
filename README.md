# QuickResumeBuilder.online

A free, in-browser resume and cover letter builder built with Next.js. Fill in your details, see a live preview, and export straight to PDF — no account or sign-up required.

## Features

### Resume Builder
- **Five templates** — Basic, Modern, Minimal, Elegant, and Classic, switchable from the templates gallery (`/templates`).
- **Live drag-and-drop editing** — reorder fields, sections, and repeatable entries (work experience, education, skills, etc.) directly on the resume canvas, with a separate touch-friendly editing form on mobile widths (powered by [dnd-kit](https://dndkit.com/)).
- **Completion tracking** — a step list scrolls you to each section and a radial progress indicator shows what percentage of your resume (personal info + every section's fields) is filled in.
- **Save & manage resumes** — save multiple resumes to a Supabase-backed anonymous account (no login screen) and rename, duplicate, edit, or delete them from `/my-resumes`.

### Cover Letter Builder
- **Two templates** — Basic (a plain single-column letter) and Modern (an accent-colored sidebar, defaulting to sender info, beside a white main column — sections are draggable between the two zones, mirroring the resume's Modern template).
- **Five draggable sections** — sender info, recipient info, date, subject, and letter body, each independently reorderable and with its own draggable fields, on both desktop and a separate mobile editing form.
- **Completion tracking** — the same step-list-plus-progress pattern as the resume builder, scoped to the cover letter's sections.
- **Save & manage cover letters** — save multiple cover letters and rename, duplicate, edit, or delete them from `/my-cover-letters`.

### Shared across both builders
- **Customization navbar** — accent colours, typography (font family), font size (small/medium/large), and which fields/sections are visible.
- **PDF export** — download the finished document as a PDF, print it, or open a full-page preview first.
- **13 languages** — the entire UI (not just your content) can be translated on the fly via a language switcher in the navbar, powered by [i18next](https://www.i18next.com/)/react-i18next.

## Getting Started

Copy the environment template and fill in your Supabase project's credentials:

```bash
cp .env.example .env.local
```

Then run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

- `app/` — Next.js App Router pages: `/` (marketing landing page), `/app` (resume editor), `/templates` (template gallery), `/my-resumes` (saved resumes list), `/cover-letter` (cover letter editor), `/my-cover-letters` (saved cover letters list).
- `components/`
  - `resumes/` — `ResumeBuilder.tsx` (page orchestration: state, persistence, mobile/desktop switching), `Resume.tsx` (the desktop drag-and-drop editing canvas), `desktop-templates/`/`mobile-templates/` (per-template read-only and mobile-editing-form components).
  - `cover-letter/` — similar shape to `resumes/`: `CoverLetterBuilder.tsx` (page orchestration), `CoverLetter.tsx` (thin desktop wrapper), `desktop-templates/`/`mobile-templates/` (per-template read-only and mobile-editing-form components, including `CoverLetterModernMobileTemplate.tsx`'s stacked colored-block layout). `CoverLetterFormFields.tsx` owns the actual field/section markup and layout for every template × both view modes in one place (a level of sharing the resume side doesn't attempt, since each resume mobile template still defines its own fields independently) — `CoverLetter.tsx` and the mobile templates are just thin wrappers that lock in `mobile`/a `templateId` and forward the rest.
  - `pdf/` — per-template `@react-pdf/renderer` components, used by the shared, generic `DownloadButton.tsx` (accepts any PDF template component + its props).
  - `navbar/` — the Templates/Features/Colours/Typography/Font Size dropdowns shown on both editors.
  - Shared UI: `PreviewModal.tsx` and `DownloadButton.tsx` (generic, accept any template component + props), `Sidebar.tsx`, `Sortable.tsx` (drag-and-drop primitives, including the `SortableZones`/`SortableZone` pair both Modern templates use for sidebar/main dragging), `PrintButton.tsx`, `SaveResumeDialog.tsx`, and other primitives reused by both builders.
- `lib/` — resume data types (`resumeData.ts`) and cover letter data types (`coverLetterData.ts`), template registries (`templates.ts`, `coverLetterTemplates.ts`) and their PDF counterparts (`lib/pdf/templates.ts`, `lib/pdf/coverLetterTemplates.ts`), font/colour/font-size options, the i18n setup (`lib/i18n/`), Supabase helpers (`lib/supabase/`), and PDF rendering helpers (`lib/pdf/`).

## Available Scripts

- `npm run dev` — start the development server (Turbopack).
- `npm run build` — build for production.
- `npm run start` — run the production build.
- `npm run lint` — run ESLint.

## Learn More

This project uses Next.js 16, React 19, Tailwind CSS v4, and daisyUI 5. See [Next.js Documentation](https://nextjs.org/docs) for framework-level details.
