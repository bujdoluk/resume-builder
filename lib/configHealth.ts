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

// Presence only, never values. Several integrations fail open, so a missing var would otherwise go unnoticed.
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
