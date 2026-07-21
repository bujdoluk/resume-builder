import { Ratelimit, type Duration } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Lazily instantiated, same reasoning as lib/stripe.ts/lib/email/resend.ts —
// a missing UPSTASH_* env var shouldn't crash the build, only make
// checkRateLimit() a no-op at runtime (so local dev works without an
// Upstash account, same as this app's other optional integrations).
let redis: Redis | null | undefined;

function getRedis(): Redis | null {
  if (redis === undefined) {
    redis =
      process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
        ? Redis.fromEnv()
        : null;
  }
  return redis;
}

const limiters = new Map<string, Ratelimit>();

function getLimiter(name: string, requests: number, window: Duration): Ratelimit | null {
  const client = getRedis();
  if (!client) return null;

  let limiter = limiters.get(name);
  if (!limiter) {
    limiter = new Ratelimit({
      redis: client,
      limiter: Ratelimit.slidingWindow(requests, window),
      prefix: `ratelimit:${name}`,
    });
    limiters.set(name, limiter);
  }
  return limiter;
}

// Returns true if the request should proceed. Fails open (returns true)
// when Upstash isn't configured, so this can be called unconditionally from
// every route without a separate "is rate limiting enabled" check.
export async function checkRateLimit(
  name: string,
  identifier: string,
  requests: number,
  window: Duration,
): Promise<boolean> {
  const limiter = getLimiter(name, requests, window);
  if (!limiter) return true;

  const { success } = await limiter.limit(identifier);
  return success;
}

// Vercel (and most reverse proxies) set x-forwarded-for to
// "client, proxy1, proxy2, ..." — the first entry is the original client.
export function getRequestIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  return forwardedFor?.split(",")[0]?.trim() || "unknown";
}
