
export interface SecurityHeadersEnv {
  isDev: boolean;
  supabaseUrl?: string;
}

export function buildContentSecurityPolicy({ isDev, supabaseUrl }: SecurityHeadersEnv): string {
  const supabaseOrigin = supabaseUrl ? new URL(supabaseUrl).origin : "https://*.supabase.co";
  const supabaseWsOrigin = supabaseOrigin.replace(/^http/, "ws");

  const cspDirectives: Record<string, string[]> = {
    "default-src": ["'self'"],
    "script-src": [
      "'self'",
      "'unsafe-inline'",
      "'wasm-unsafe-eval'",
      ...(isDev ? ["'unsafe-eval'"] : []),
      "https://embed.tawk.to",
      "https://cdn.jsdelivr.net",
      "https://*.hcaptcha.com",
      "https://va.vercel-scripts.com",
    ],
    "style-src": ["'self'", "'unsafe-inline'", "https://embed.tawk.to", "https://*.hcaptcha.com"],
    "img-src": ["'self'", "data:", "blob:", "https:"],
    "font-src": ["'self'", "data:", "https://embed.tawk.to"],
    "connect-src": [
      "'self'",
      "data:",
      supabaseOrigin,
      supabaseWsOrigin,
      "https://*.hcaptcha.com",
      "https://*.sentry.io",
      "https://*.tawk.to",
      "wss://*.tawk.to",
      "https://va.vercel-scripts.com",
      "https://vitals.vercel-insights.com",
      "https://fonts.gstatic.com",
    ],
    "frame-src": ["https://*.hcaptcha.com", "https://*.tawk.to"],
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
    "frame-ancestors": ["'self'"],
  };

  return Object.entries(cspDirectives)
    .map(([directive, sources]) => `${directive} ${sources.join(" ")}`)
    .join("; ");
}

export function buildSecurityHeaders(
  env: SecurityHeadersEnv,
): { key: string; value: string }[] {
  return [
    { key: "X-DNS-Prefetch-Control", value: "on" },
    { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
    { key: "X-Frame-Options", value: "SAMEORIGIN" },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    {
      key: "Permissions-Policy",
      value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
    },
    { key: "Content-Security-Policy", value: buildContentSecurityPolicy(env) },
  ];
}
