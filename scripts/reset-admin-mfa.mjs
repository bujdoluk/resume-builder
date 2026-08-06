#!/usr/bin/env node
/**
 * Recovery script for a lost 2FA authenticator device: clears all TOTP
 * factors for a user by email via the service-role admin API, so they can
 * re-enroll from scratch. Does NOT touch app_metadata.role — admin access
 * stays intact, but /api/blog and /api/admin/config-health remain 403 until
 * the user re-enrolls (see lib/adminAuth.ts's aal2 requirement) and fully
 * logs out and back in — a silent token refresh alone won't pick this up.
 *
 * Usage: node scripts/reset-admin-mfa.mjs someone@example.com
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY in .env.local.
 */
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

function loadEnvLocal() {
  let contents;
  try {
    contents = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
  } catch {
    console.error("Could not read .env.local — copy .env.example first.");
    process.exit(1);
  }
  for (const line of contents.split("\n")) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (match) process.env[match[1]] ??= match[2];
  }
}

loadEnvLocal();

const email = process.argv[2];
if (!email) {
  console.error("Usage: node scripts/reset-admin-mfa.mjs <email>");
  process.exit(1);
}
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error("SUPABASE_SERVICE_ROLE_KEY is not set in .env.local.");
  process.exit(1);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

async function findUserByEmail(targetEmail) {
  for (let page = 1; ; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    const match = data.users.find((user) => user.email?.toLowerCase() === targetEmail.toLowerCase());
    if (match) return match;
    if (data.users.length < 1000) return null;
  }
}

const user = await findUserByEmail(email);
if (!user) {
  console.error(`No user found with email ${email}.`);
  process.exit(1);
}

const { data, error: listError } = await supabase.auth.admin.mfa.listFactors({ userId: user.id });
if (listError) {
  console.error(listError.message);
  process.exit(1);
}

if (data.factors.length === 0) {
  console.log(`${email} (${user.id}) has no enrolled MFA factors — nothing to do.`);
  process.exit(0);
}

for (const factor of data.factors) {
  const { error } = await supabase.auth.admin.mfa.deleteFactor({ id: factor.id, userId: user.id });
  if (error) {
    console.error(`Failed to remove factor ${factor.id}: ${error.message}`);
    process.exit(1);
  }
  console.log(`Removed factor ${factor.id} (${factor.factor_type}, ${factor.status}) for ${email}.`);
}

console.log("Done. They must fully log out and log back in, then re-enroll from /account before admin routes work again.");
