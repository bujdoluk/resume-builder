export const HTTP_OK = 200;
export const HTTP_MULTIPLE_CHOICES = 300;
export const HTTP_BAD_REQUEST = 400;
export const HTTP_UNAUTHORIZED = 401;
export const HTTP_FORBIDDEN = 403;
export const HTTP_NOT_FOUND = 404;
export const HTTP_CONFLICT = 409;
export const HTTP_TOO_MANY_REQUESTS = 429;
export const HTTP_INTERNAL_SERVER_ERROR = 500;
export const HTTP_BAD_GATEWAY = 502;

export const TESTIMONIAL_PULSE_START_DELAY_MS = 3000;
export const TESTIMONIAL_PULSE_INTERVAL_MS = 7000;
export const EMAIL_SENT_DIALOG_CLOSE_DELAY_MS = 1200;
export const SAVED_INDICATOR_DURATION_MS = 1500;

// Polling for hCaptcha readiness — shared by lib/supabase/invisibleCaptcha.ts
// (queues token requests until the widget is registered) and
// components/InvisibleCaptcha.tsx (waits for the widget itself to report
// ready before calling execute()).
export const CAPTCHA_POLL_INTERVAL_MS = 100;
export const CAPTCHA_POLL_ATTEMPTS = 20;

// Delay before retrying an anonymous sign-in once after a captcha failure
// (see lib/supabase/session.ts).
export const CAPTCHA_RETRY_DELAY_MS = 750;

// app/api/send-email/route.ts request validation limits.
export const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;
export const MAX_TEXT_LENGTH = 500_000;

// components/SaveResumeDialog.tsx — shared by both the resume and cover
// letter builders.
export const MAX_SAVED_ITEM_NAME_LENGTH = 100;

// lib/supabase/blogPosts.ts — max attempts to find a free slug by
// appending "-2", "-3", etc. before giving up.
export const MAX_SLUG_ATTEMPTS = 20;

// lib/supabase/resumes.ts / lib/supabase/coverLetters.ts pagination sizes.
export const RESUMES_PAGE_SIZE = 12;
export const COVER_LETTERS_PAGE_SIZE = 12;

// lib/supabase/subscriptions.ts — how many saved items the free plan allows.
export const FREE_TIER_LIMITS = {
  resumes: 2,
  coverLetters: 2,
};

// Rate limits enforced via lib/rateLimit.ts (Upstash Redis; routes fail
// open — no blocking — if Upstash isn't configured, same as local dev
// without Stripe/Resend/hCaptcha). `send-email` is keyed by IP (the route
// has no auth requirement); the rest are keyed by user id.
export const RATE_LIMIT_SEND_EMAIL_REQUESTS = 5;
export const RATE_LIMIT_SEND_EMAIL_WINDOW = "10 m";
export const RATE_LIMIT_ACCOUNT_EXPORT_REQUESTS = 10;
export const RATE_LIMIT_ACCOUNT_EXPORT_WINDOW = "1 h";
export const RATE_LIMIT_ACCOUNT_DELETE_REQUESTS = 5;
export const RATE_LIMIT_ACCOUNT_DELETE_WINDOW = "1 h";
export const RATE_LIMIT_STRIPE_CHECKOUT_REQUESTS = 10;
export const RATE_LIMIT_STRIPE_CHECKOUT_WINDOW = "1 h";
export const RATE_LIMIT_STRIPE_CANCEL_REQUESTS = 10;
export const RATE_LIMIT_STRIPE_CANCEL_WINDOW = "1 h";
