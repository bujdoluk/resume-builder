# QuickResumeBuilder.online

A free, in-browser resume builder built with Next.js. Fill in your details on the left, see a live preview on the right, and export straight to PDF — no account or sign-up required.

## Features

- **Three templates** — Basic, Modern, and Minimal, switchable from the templates gallery (`/templates`).
- **Live drag-and-drop editing** — reorder fields, sections, and entries directly on the resume canvas (powered by [dnd-kit](https://dndkit.com/)).
- **Customization sidebar** — accent colours, typography (font family), font size (small/medium/large), and which fields/sections are visible.
- **PDF export** — download the finished resume as a PDF, or open a full-page preview first.
- **13 languages** — the entire UI (not just the resume content) can be translated on the fly via a language switcher in the navbar, powered by [i18next](https://www.i18next.com/)/react-i18next.
- **Supabase-backed auth scaffolding** — client/server Supabase helpers are in place under `lib/supabase/` for future account-based features.

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

- `app/` — Next.js App Router pages (`/` for the builder, `/templates` for the template gallery).
- `components/` — `Resume.tsx` (the editable canvas), `Sidebar.tsx` (customization panel), `templates/` (the three read-only/print templates), and shared UI.
- `lib/` — resume data types, template registry, font/colour/font-size options, and the i18n setup (`lib/i18n/`).

## Available Scripts

- `npm run dev` — start the development server (Turbopack).
- `npm run build` — build for production.
- `npm run start` — run the production build.
- `npm run lint` — run ESLint.

## Learn More

This project uses Next.js 16, React 19, Tailwind CSS v4, and daisyUI 5. See [Next.js Documentation](https://nextjs.org/docs) for framework-level details.
