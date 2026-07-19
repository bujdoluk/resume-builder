/**
 * Next.js build/runtime configuration.
 */
import type { NextConfig } from "next";

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

export default nextConfig;
