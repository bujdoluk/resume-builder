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
export const HTTP_SERVICE_UNAVAILABLE = 503;

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

// lib/health.ts — how long a single dependency check (DB/Redis) may run
// before /api/health treats it as down rather than hanging the response.
export const HEALTH_CHECK_TIMEOUT_MS = 3000;

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

// lib/atsChecker/ — ATS format-check/keyword-matching thresholds.
export const MIN_COVER_LETTER_BODY_LENGTH = 200;
export const KEYWORD_EXTRACTION_LIMIT = 30;

// app/api/ats-coherence/route.ts — the coherence check calls a real LLM
// (Groq) whose free tier is a shared, app-wide budget (not per-user), so
// this stays conservative rather than matching the other per-IP limits.
export const MAX_COHERENCE_CHECK_TEXT_LENGTH = 10_000;
export const RATE_LIMIT_ATS_COHERENCE_REQUESTS = 3;
export const RATE_LIMIT_ATS_COHERENCE_WINDOW = "10 m";

// app/api/ai-rewrite/route.ts — same shared-Groq-budget reasoning as the
// ats-coherence limits above.
export const MAX_AI_REWRITE_TEXT_LENGTH = 10_000;
export const RATE_LIMIT_AI_REWRITE_REQUESTS = 10;
export const RATE_LIMIT_AI_REWRITE_WINDOW = "10 m";

// app/api/import-resume/route.ts — resumes are text-heavy documents, so 5MB
// comfortably covers a real file without matching the 10MB generic
// attachment ceiling above. Extracted text is capped separately before it's
// sent to Groq (see lib/resumeImport/parseResumeText.ts for how this size
// was picked to fit the account's shared per-request Groq token budget
// alongside a generous completion-token ceiling — a real 8000 TPM limit
// was hit in testing at the previous, more generous 15,000 char cap).
export const MAX_IMPORT_FILE_BYTES = 5 * 1024 * 1024;
export const MAX_IMPORT_EXTRACTED_TEXT_LENGTH = 8_000;
export const RATE_LIMIT_IMPORT_RESUME_REQUESTS = 5;
export const RATE_LIMIT_IMPORT_RESUME_WINDOW = "10 m";

// app/api/cron/cleanup-anonymous-users/route.ts — matches the retention
// promise in app/privacy/page.tsx's "Data retention" section.
export const ANONYMOUS_ACCOUNT_RETENTION_DAYS = 7;

// app/shared/{resume,cover-letter}/[token]/pdf/route.tsx — these are public,
// unauthenticated routes (anyone with a share link, or just guessing the
// path), so they're IP-rate-limited like send-email rather than user-scoped.
export const RATE_LIMIT_SHARED_DOCUMENT_REQUESTS = 30;
export const RATE_LIMIT_SHARED_DOCUMENT_WINDOW = "10 m";

// lib/supabase/resumes.ts / coverLetters.ts — how long a generated share
// link stays valid before getResumeByShareToken/getCoverLetterByShareToken
// stop returning a match for it (same as an invalid/unknown token).
export const SHARE_LINK_EXPIRATION_DAYS = 30;

// lib/supabase/blogPosts.ts's unstable_cache-wrapped reads, tagged so
// app/api/blog/route.ts and app/api/blog/[id]/route.ts can invalidate them
// with revalidateTag() right after a successful admin write — kept as one
// shared constant so the tag used to cache and the tag used to invalidate
// can't drift apart.
export const BLOG_POSTS_CACHE_TAG = "blog-posts";
export const BLOG_POSTS_CACHE_REVALIDATE_SECONDS = 3600;

export const SUPPORT_EMAIL = "support@quickresumebuilder.online";
