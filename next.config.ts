/**
 * Next.js build/runtime configuration.
 */
import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";
import { buildSecurityHeaders } from "./lib/securityHeaders";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["dev.quickresumebuilder.online"],

  async headers() {
    return [
      {
        source: "/:path*",
        headers: buildSecurityHeaders({
          isDev: process.env.NODE_ENV === "development",
          supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
        }),
      },
    ];
  },
};

export default process.env.NEXT_PUBLIC_SENTRY_DSN
  ? withSentryConfig(nextConfig, {
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
      silent: true,
      widenClientFileUpload: true,
    })
  : nextConfig;
