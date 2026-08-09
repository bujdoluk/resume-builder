
import { describe, expect, it } from "vitest";
import { buildContentSecurityPolicy, buildSecurityHeaders } from "@/lib/securityHeaders";

function parseCsp(csp: string): Record<string, string[]> {
  return Object.fromEntries(
    csp.split("; ").map((directive) => {
      const [name, ...sources] = directive.split(" ");
      return [name, sources];
    }),
  );
}

describe("buildContentSecurityPolicy", () => {
  it("never includes 'unsafe-eval' in production (isDev: false)", () => {
    const csp = parseCsp(buildContentSecurityPolicy({ isDev: false }));

    expect(csp["script-src"]).not.toContain("'unsafe-eval'");
  });

  it("includes 'unsafe-eval' only in development", () => {
    const csp = parseCsp(buildContentSecurityPolicy({ isDev: true }));

    expect(csp["script-src"]).toContain("'unsafe-eval'");
  });

  it("allows jsdelivr, which Tawk.to's widget bundle loads its emoji-picker library from", () => {
    const csp = parseCsp(buildContentSecurityPolicy({ isDev: false }));

    expect(csp["script-src"]).toContain("https://cdn.jsdelivr.net");
  });

  it("falls back to a wildcard Supabase origin when no URL is configured", () => {
    const csp = parseCsp(buildContentSecurityPolicy({ isDev: false }));

    expect(csp["connect-src"]).toContain("https://*.supabase.co");
  });

  it("derives the exact Supabase HTTP and WebSocket origins from the configured URL", () => {
    const csp = parseCsp(
      buildContentSecurityPolicy({
        isDev: false,
        supabaseUrl: "https://xyzcompany.supabase.co/rest/v1",
      }),
    );

    expect(csp["connect-src"]).toContain("https://xyzcompany.supabase.co");
    expect(csp["connect-src"]).toContain("wss://xyzcompany.supabase.co");
  });

  it("always includes the baseline lockdown directives", () => {
    const csp = parseCsp(buildContentSecurityPolicy({ isDev: false }));

    expect(csp["default-src"]).toEqual(["'self'"]);
    expect(csp["object-src"]).toEqual(["'none'"]);
    expect(csp["base-uri"]).toEqual(["'self'"]);
    expect(csp["form-action"]).toEqual(["'self'"]);
    expect(csp["frame-ancestors"]).toEqual(["'self'"]);
  });
});

describe("buildSecurityHeaders", () => {
  it("returns every expected security header", () => {
    const headers = buildSecurityHeaders({ isDev: false });
    const keys = headers.map((header) => header.key);

    expect(keys).toEqual([
      "X-DNS-Prefetch-Control",
      "Strict-Transport-Security",
      "X-Frame-Options",
      "X-Content-Type-Options",
      "Referrer-Policy",
      "Permissions-Policy",
      "Content-Security-Policy",
    ]);
  });

  it("enables HSTS with preload and includeSubDomains", () => {
    const headers = buildSecurityHeaders({ isDev: false });
    const hsts = headers.find((header) => header.key === "Strict-Transport-Security");

    expect(hsts?.value).toBe("max-age=63072000; includeSubDomains; preload");
  });

  it("embeds a Content-Security-Policy consistent with buildContentSecurityPolicy", () => {
    const env = { isDev: false, supabaseUrl: "https://xyzcompany.supabase.co" };
    const headers = buildSecurityHeaders(env);
    const csp = headers.find((header) => header.key === "Content-Security-Policy");

    expect(csp?.value).toBe(buildContentSecurityPolicy(env));
  });
});
