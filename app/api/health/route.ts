import { Temporal } from "temporal-polyfill";
import { HTTP_OK } from "@/lib/constants";

export async function GET() {
  return Response.json(
    { status: "ok", timestamp: Temporal.Now.instant().toString() },
    { status: HTTP_OK, headers: { "Cache-Control": "no-store" } },
  );
}
