
import * as Sentry from "@sentry/nextjs";
import { createServiceRoleClient } from "@/lib/supabase/serviceRole";
import type { Json } from "@/lib/supabase/database.types";

export const AUDIT_ACTIONS = {
  BLOG_CREATE: "blog.create",
  BLOG_UPDATE: "blog.update",
  BLOG_DELETE: "blog.delete",
  ACCOUNT_DELETE: "account.delete",
  SUBSCRIPTION_CREATED: "subscription.created",
  SUBSCRIPTION_UPDATED: "subscription.updated",
  SUBSCRIPTION_CANCELED: "subscription.canceled",
} as const;
export type AuditAction = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS];

export interface AuditEventParams {
  userId: string | null;
  actorEmail: string | null;
  action: AuditAction;
  target?: string | null;
  metadata?: Record<string, unknown>;
}

export async function logAuditEvent(params: AuditEventParams): Promise<void> {
  try {
    const { error } = await createServiceRoleClient()
      .from("audit_log")
      .insert({
        user_id: params.userId,
        actor_email: params.actorEmail,
        action: params.action,
        target: params.target ?? null,
        metadata: (params.metadata ?? {}) as Json,
      });
    if (error) throw error;
  } catch (error) {
    console.error("Failed to record audit event:", error);
    Sentry.captureException(error, { tags: { auditAction: params.action } });
  }
}
