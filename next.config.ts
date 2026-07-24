/**
 * Next.js build/runtime configuration.
 */
import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const isDev = process.env.NODE_ENV === "development";

const supabaseOrigin = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).origin
  : "https://*.supabase.co";
const supabaseWsOrigin = supabaseOrigin.replace(/^http/, "ws");

const cspDirectives: Record<string, string[]> = {
  "default-src": ["'self'"],
  "script-src": [
    "'self'",
    "'unsafe-inline'",
    ...(isDev ? ["'unsafe-eval'"] : []),
    "https://embed.tawk.to",
    "https://*.hcaptcha.com",
  ],
  "style-src": ["'self'", "'unsafe-inline'", "https://embed.tawk.to", "https://*.hcaptcha.com"],
  "img-src": ["'self'", "data:", "blob:", "https://*.tawk.to"],
  "font-src": ["'self'", "data:", "https://embed.tawk.to"],
  "connect-src": [
    "'self'",
    supabaseOrigin,
    supabaseWsOrigin,
    "https://*.hcaptcha.com",
    "https://*.sentry.io",
    "https://*.tawk.to",
    "wss://*.tawk.to",
  ],
  "frame-src": ["https://*.hcaptcha.com", "https://*.tawk.to"],
  "object-src": ["'none'"],
  "base-uri": ["'self'"],
  "form-action": ["'self'"],
  "frame-ancestors": ["'self'"],
};

const contentSecurityPolicy = Object.entries(cspDirectives)
  .map(([directive, sources]) => `${directive} ${sources.join(" ")}`)
  .join("; ");

const securityHeaders = [
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
];

const nextConfig: NextConfig = {
  allowedDevOrigins: ["dev.quickresumebuilder.online"],

  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
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
