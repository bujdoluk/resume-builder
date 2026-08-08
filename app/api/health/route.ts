
import { Temporal } from "temporal-polyfill";
import { HTTP_OK, HTTP_SERVICE_UNAVAILABLE } from "@/lib/constants";
import { checkDatabase, checkRedis } from "@/lib/health";

export async function GET() {
  const [db, redis] = await Promise.all([checkDatabase(), checkRedis()]);

  let status: "ok" | "degraded" | "down" = "ok";
  if (!db.ok) status = "down";
  else if (!redis.ok) status = "degraded";

  return Response.json(
    {
      status,
      checks: { db, redis },
      timestamp: Temporal.Now.instant().toString(),
    },
    {
      status: db.ok ? HTTP_OK : HTTP_SERVICE_UNAVAILABLE,
      headers: { "Cache-Control": "no-store" },
    },
  );
}
