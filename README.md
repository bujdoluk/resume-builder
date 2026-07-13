# QuickResumeBuilder.online

A free, in-browser resume builder built with Next.js. Fill in your details, see a live preview, and export straight to PDF — no account or sign-up required.

## Features

- **Four templates** — Basic, Modern, Minimal, and Elegant, switchable from the templates gallery (`/templates`).
- **Live drag-and-drop editing** — reorder fields, sections, and repeatable entries (work experience, education, skills, etc.) directly on the resume canvas, with a separate touch-friendly editing form on mobile widths (powered by [dnd-kit](https://dndkit.com/)).
- **Completion tracking** — a step list scrolls you to each section and a radial progress indicator shows what percentage of your resume (personal info + every section's fields) is filled in.
- **Customization sidebar** — accent colours, typography (font family), font size (small/medium/large), and which fields/sections are visible.
- **PDF export** — download the finished resume as a PDF, or open a full-page preview first.
- **13 languages** — the entire UI (not just the resume content) can be translated on the fly via a language switcher in the navbar, powered by [i18next](https://www.i18next.com/)/react-i18next.
- **Save & manage resumes** — save multiple resumes to a Supabase-backed anonymous account (no login screen) and rename, duplicate, edit, or delete them from `/my-resumes`.

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

- `app/` — Next.js App Router pages: `/` (marketing landing page), `/app` (the resume editor), `/templates` (template gallery), `/my-resumes` (saved resumes list).
- `components/` — `Home.tsx` (editor page orchestration), `Resume.tsx` (the desktop drag-and-drop editing canvas), `Sidebar.tsx` (customization panel), `Sortable.tsx` (drag-and-drop primitives), `desktop-templates/`/`mobile-templates/`/`pdf/` (per-template read-only, mobile-editing-form, and PDF renderers), and shared UI.
- `lib/` — resume data types (`resumeData.ts`), template registry (`templates.ts`), font/colour/font-size options, the i18n setup (`lib/i18n/`), Supabase helpers (`lib/supabase/`), and PDF rendering helpers (`lib/pdf/`).

## Available Scripts

- `npm run dev` — start the development server (Turbopack).
- `npm run build` — build for production.
- `npm run start` — run the production build.
- `npm run lint` — run ESLint.

## Learn More

This project uses Next.js 16, React 19, Tailwind CSS v4, and daisyUI 5. See [Next.js Documentation](https://nextjs.org/docs) for framework-level details.
