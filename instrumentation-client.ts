/**
 * Client-side Sentry init — runs after the HTML loads but before React
 * hydrates (see Next.js's instrumentation-client.js convention). No-op
 * (never calls Sentry.init) unless NEXT_PUBLIC_SENTRY_DSN is set, so local
 * dev works without a Sentry account, matching every other optional
 * third-party integration in this app (Tawk.to, hCaptcha, Stripe).
 */
import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    // Errors are the priority here, not full tracing — a small sample is
    // enough to spot performance regressions without the volume/cost of
    // tracing every request.
    tracesSampleRate: 0.1,
  });
}

// Required by the SDK to instrument App Router client-side navigations for
// performance tracing — a safe no-op call when Sentry.init was never called
// above (unconfigured locally).
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
