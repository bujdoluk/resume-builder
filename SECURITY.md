# Security Policy

## Reporting a Vulnerability

If you believe you've found a security vulnerability in QuickResumeBuilder.online, please report it privately rather than opening a public GitHub issue.

**Email:** support@quickresumebuilder.online — include a description of the issue, steps to reproduce, and its potential impact. Please give us a reasonable amount of time to investigate and fix the issue before disclosing it publicly.

We aim to acknowledge reports within 3 business days and to keep you updated as the issue is investigated and resolved.

## Scope

In scope:
- The production application at [quickresumebuilder.online](https://quickresumebuilder.online) and its subdomains.
- The code in this repository.

Out of scope:
- Third-party services we integrate with (Supabase, Stripe, Resend, Sentry, Upstash, hCaptcha, Groq, Tawk.to) — please report those directly to the respective vendor.
- Denial-of-service, spam, or social-engineering reports.
- Findings that require physical access to a user's device or a compromised account/credentials the reporter doesn't own.

## Supported Versions

This project deploys continuously from the `main` branch — there is only ever one supported version, the one currently live in production. Fixes are not backported to tagged releases; see `CHANGELOG.md` for what shipped when.

## Existing Safeguards

Some context on what's already in place, so reports can focus on gaps rather than known controls:
- Security headers (CSP, HSTS, X-Frame-Options, and friends) — `lib/securityHeaders.ts`, applied via `next.config.ts`.
- Row Level Security (RLS) policies enforce free-tier limits and data access server-side, not just in the client.
- Admin-only routes require both an `app_metadata.role` claim and a completed TOTP 2FA challenge (`lib/adminAuth.ts`) — a compromised password alone doesn't reach them.
- Rate limiting on abuse-prone endpoints (email export, AI features, shared-link PDF generation) via Upstash Redis.
- Dependency vulnerabilities are scanned on every push/PR (`npm audit --audit-level=high` in CI), and error tracking runs through Sentry.

## Disclosure

We follow coordinated disclosure: please don't share details of a suspected vulnerability publicly until we've had a chance to address it. We're happy to credit reporters (with permission) once a fix ships.
