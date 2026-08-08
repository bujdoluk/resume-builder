
import { Temporal } from "temporal-polyfill";
import { HEALTH_CHECK_TIMEOUT_MS } from "@/lib/constants";
import { getRedis } from "@/lib/rateLimit";
import { createServiceRoleClient } from "@/lib/supabase/serviceRole";

export interface HealthCheckResult {
  ok: boolean;
  latencyMs: number | null;
}

function withTimeout<T>(promise: PromiseLike<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("health check timed out")), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error instanceof Error ? error : new Error(String(error)));
      },
    );
  });
}

// Confirms Postgres is actually answering, not just that the app process is
// up — a head-only count avoids pulling any row data back. This is the one
// check /api/health treats as critical: the app can't serve anything without it.
export async function checkDatabase(): Promise<HealthCheckResult> {
  const start = Temporal.Now.instant();
  try {
    const { error } = await withTimeout(
      createServiceRoleClient().from("resumes").select("id", { head: true, count: "exact" }),
      HEALTH_CHECK_TIMEOUT_MS,
    );
    return error
      ? { ok: false, latencyMs: null }
      : { ok: true, latencyMs: start.until(Temporal.Now.instant()).total("milliseconds") };
  } catch {
    return { ok: false, latencyMs: null };
  }
}

// Rate limiting already fails open when Upstash isn't configured (see
// lib/rateLimit.ts), so an unconfigured/unreachable Redis is reported as
// informational (status "degraded") rather than taking the whole check down.
export async function checkRedis(): Promise<HealthCheckResult> {
  const redis = getRedis();
  if (!redis) return { ok: true, latencyMs: null };

  const start = Temporal.Now.instant();
  try {
    await withTimeout(redis.ping(), HEALTH_CHECK_TIMEOUT_MS);
    return { ok: true, latencyMs: start.until(Temporal.Now.instant()).total("milliseconds") };
  } catch {
    return { ok: false, latencyMs: null };
  }
}
