import { describe, expect, it } from "vitest";
import { getConfigHealth } from "@/lib/configHealth";

describe("getConfigHealth", () => {
  it("reports everything as false when no env vars are set", () => {
    expect(getConfigHealth({})).toEqual({
      rateLimit: false,
      captcha: false,
      ai: false,
      email: false,
      sentry: false,
      cron: false,
      stripe: {
        secretKey: false,
        webhookSecret: false,
        monthlyPriceId: false,
        annualPriceId: false,
      },
      supabase: { serviceRoleKey: false },
    });
  });

  it("reports everything as true when every env var is set", () => {
    expect(
      getConfigHealth({
        UPSTASH_REDIS_REST_URL: "https://example.upstash.io",
        UPSTASH_REDIS_REST_TOKEN: "token",
        HCAPTCHA_SECRET_KEY: "secret",
        GROQ_API_KEY: "key",
        RESEND_API_KEY: "key",
        NEXT_PUBLIC_SENTRY_DSN: "https://sentry.example.com/1",
        CRON_SECRET: "secret",
        STRIPE_SECRET_KEY: "sk_test",
        STRIPE_WEBHOOK_SECRET: "whsec_test",
        STRIPE_PRICE_ID_MONTHLY: "price_monthly",
        STRIPE_PRICE_ID_ANNUAL: "price_annual",
        SUPABASE_SERVICE_ROLE_KEY: "role-key",
      }),
    ).toEqual({
      rateLimit: true,
      captcha: true,
      ai: true,
      email: true,
      sentry: true,
      cron: true,
      stripe: {
        secretKey: true,
        webhookSecret: true,
        monthlyPriceId: true,
        annualPriceId: true,
      },
      supabase: { serviceRoleKey: true },
    });
  });

  it("requires both the Upstash URL and token — either alone doesn't count as rate limiting being configured", () => {
    expect(getConfigHealth({ UPSTASH_REDIS_REST_URL: "https://example.upstash.io" }).rateLimit).toBe(
      false,
    );
    expect(getConfigHealth({ UPSTASH_REDIS_REST_TOKEN: "token" }).rateLimit).toBe(false);
    expect(
      getConfigHealth({
        UPSTASH_REDIS_REST_URL: "https://example.upstash.io",
        UPSTASH_REDIS_REST_TOKEN: "token",
      }).rateLimit,
    ).toBe(true);
  });

  it("reports each Stripe requirement independently", () => {
    const health = getConfigHealth({
      STRIPE_SECRET_KEY: "sk_test",
      STRIPE_PRICE_ID_MONTHLY: "price_monthly",
      // webhookSecret and annualPriceId deliberately left unset
    });

    expect(health.stripe).toEqual({
      secretKey: true,
      webhookSecret: false,
      monthlyPriceId: true,
      annualPriceId: false,
    });
  });

  it("treats an empty string the same as unset", () => {
    expect(getConfigHealth({ GROQ_API_KEY: "" }).ai).toBe(false);
  });

  it("defaults to reading process.env when no env object is given", () => {
    const original = process.env.GROQ_API_KEY;
    try {
      process.env.GROQ_API_KEY = "test-key";
      expect(getConfigHealth().ai).toBe(true);

      delete process.env.GROQ_API_KEY;
      expect(getConfigHealth().ai).toBe(false);
    } finally {
      if (original === undefined) delete process.env.GROQ_API_KEY;
      else process.env.GROQ_API_KEY = original;
    }
  });
});
