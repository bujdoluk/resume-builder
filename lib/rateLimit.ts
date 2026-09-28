import { Ratelimit, type Duration } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Lazy so a missing UPSTASH_* var doesn't break the build.
let redis: Redis | null | undefined;

export function getRedis(): Redis | null {
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

// Fails open when Upstash isn't configured.
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

// The first x-forwarded-for entry is the original client.
export function getRequestIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  return forwardedFor?.split(",")[0]?.trim() || "unknown";
}
