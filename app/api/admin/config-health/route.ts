
import { requireAdmin } from "@/lib/adminAuth";
import { getConfigHealth } from "@/lib/configHealth";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const auth = await requireAdmin(supabase, request);
  if (auth instanceof Response) return auth;

  return Response.json(getConfigHealth());
}
