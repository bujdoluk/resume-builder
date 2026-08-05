
import { errorResponse } from "@/lib/apiErrors";
import { HTTP_FORBIDDEN } from "@/lib/constants";
import { getConfigHealth } from "@/lib/configHealth";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.is_anonymous || user.app_metadata?.role !== "admin") {
    return errorResponse(HTTP_FORBIDDEN, "adminLoginRequired", request);
  }

  return Response.json(getConfigHealth());
}
