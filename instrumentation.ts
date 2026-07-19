/**
 * Server/edge-runtime Sentry init, via Next.js's instrumentation.js
 * convention — `register()` runs once when a new server instance starts,
 * `onRequestError` reports errors Next.js's own request handling catches
 * (Server Components, Route Handlers, Server Actions). Both are no-ops
 * unless NEXT_PUBLIC_SENTRY_DSN is set (see instrumentation-client.ts for
 * why it's the same env var client and server share).
 *
 * This only catches errors Next.js itself catches — errors this app
 * already catches-and-swallows itself (e.g. the Stripe webhook's
 * try/catch, sendWelcomeEmail's try/catch) need their own explicit
 * Sentry.captureException call at the point they're caught, since by
 * definition they never reach here.
 */
import * as Sentry from "@sentry/nextjs";

export async function register() {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn) return;

  if (process.env.NEXT_RUNTIME === "nodejs") {
    Sentry.init({ dsn, tracesSampleRate: 0.1 });
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    Sentry.init({ dsn, tracesSampleRate: 0.1 });
  }
}

export async function onRequestError(
  ...args: Parameters<typeof Sentry.captureRequestError>
) {
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) return;
  Sentry.captureRequestError(...args);
}
