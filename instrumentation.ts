// Only catches errors Next.js itself catches. Swallowed errors need their own captureException.
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
