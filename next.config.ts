/**
 * Next.js build/runtime configuration.
 */
import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  // Next.js blocks cross-origin requests to dev-only assets/endpoints
  // (including the HMR websocket) unless the origin is explicitly
  // allowed — the dev server otherwise only trusts `localhost` by
  // default. `dev.quickresumebuilder.online` is a hosts-file entry
  // pointing at 127.0.0.1, used instead of `localhost` so hCaptcha's
  // real (non-test) site key — which requires a domain with a real TLD
  // in its allowlist — works during local development too. No effect in
  // production; this option only applies to `next dev`.
  allowedDevOrigins: ["dev.quickresumebuilder.online"],
};

// Only wraps the config (source map upload, tunneling, etc.) when Sentry is
// actually configured — skipped entirely otherwise so building without a
// Sentry account behaves exactly as if this package weren't installed, same
// principle as every other optional integration here (see
// instrumentation-client.ts).
export default process.env.NEXT_PUBLIC_SENTRY_DSN
  ? withSentryConfig(nextConfig, {
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
      silent: true,
      widenClientFileUpload: true,
      // automaticVercelMonitors/disableLogger are both webpack-only and
      // explicitly unsupported under Turbopack (which this project
      // builds/dev's with) — omitted rather than "fixed" to their new
      // webpack.* locations, since those wouldn't do anything here either.
    })
  : nextConfig;
