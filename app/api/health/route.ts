import { HTTP_OK } from "@/lib/constants";

export async function GET() {
  return Response.json(
    { status: "ok", timestamp: new Date().toISOString() },
    { status: HTTP_OK, headers: { "Cache-Control": "no-store" } },
  );
}
