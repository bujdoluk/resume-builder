
export interface ConfigHealth {
  rateLimit: boolean;
  captcha: boolean;
  ai: boolean;
  email: boolean;
  sentry: boolean;
  cron: boolean;
  stripe: {
    secretKey: boolean;
    webhookSecret: boolean;
    monthlyPriceId: boolean;
    annualPriceId: boolean;
  };
  supabase: {
    serviceRoleKey: boolean;
  };
}

// Reports only whether each optional integration's env vars are present —
// never the values themselves. Several of these fail open at runtime rather
// than erroring when unconfigured (rate limiting, captcha, AI features), by
// design, so a misconfigured production deployment wouldn't otherwise
// surface anywhere until the missing protection is actually exploited.
export function getConfigHealth(
  env: Record<string, string | undefined> = process.env,
): ConfigHealth {
  return {
    rateLimit: Boolean(env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN),
    captcha: Boolean(env.HCAPTCHA_SECRET_KEY),
    ai: Boolean(env.GROQ_API_KEY),
    email: Boolean(env.RESEND_API_KEY),
    sentry: Boolean(env.NEXT_PUBLIC_SENTRY_DSN),
    cron: Boolean(env.CRON_SECRET),
    stripe: {
      secretKey: Boolean(env.STRIPE_SECRET_KEY),
      webhookSecret: Boolean(env.STRIPE_WEBHOOK_SECRET),
      monthlyPriceId: Boolean(env.STRIPE_PRICE_ID_MONTHLY),
      annualPriceId: Boolean(env.STRIPE_PRICE_ID_ANNUAL),
    },
    supabase: {
      serviceRoleKey: Boolean(env.SUPABASE_SERVICE_ROLE_KEY),
    },
  };
}
