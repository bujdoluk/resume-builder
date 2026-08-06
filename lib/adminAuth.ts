import type { SupabaseClient, User } from "@supabase/supabase-js";
import { errorResponse } from "@/lib/apiErrors";
import { HTTP_FORBIDDEN } from "@/lib/constants";

export async function requireAdmin(
  supabase: SupabaseClient,
  request: Request,
): Promise<User | Response> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.is_anonymous || user.app_metadata?.role !== "admin") {
    return errorResponse(HTTP_FORBIDDEN, "adminLoginRequired", request);
  }

  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal?.currentLevel !== "aal2") {
    return errorResponse(HTTP_FORBIDDEN, "mfaRequired", request);
  }

  return user;
}
