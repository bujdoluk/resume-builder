#!/usr/bin/env node
/**
 * Grants the admin role (gates the "Add Blog" form on /blog) to a user by
 * email, via app_metadata.role — the only authorization-safe metadata
 * field, since regular users cannot self-modify app_metadata (unlike
 * user_metadata). Requires SUPABASE_SERVICE_ROLE_KEY in .env.local.
 *
 * Usage: node scripts/set-admin.mjs someone@example.com
 *
 * Note: app_metadata only lands in a user's session JWT at token
 * issue/refresh time. If they're already logged in, they must log out and
 * back in before the new role appears — both the "Add Blog" button and the
 * blog_posts insert policy will otherwise keep seeing the old claim.
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
  console.error("Usage: node scripts/set-admin.mjs <email>");
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

const { error } = await supabase.auth.admin.updateUserById(user.id, {
  app_metadata: { ...user.app_metadata, role: "admin" },
});
if (error) {
  console.error(error.message);
  process.exit(1);
}

console.log(`Granted admin role to ${email} (${user.id}).`);
console.log("They must log out and back in (or wait for their session to auto-refresh) before the new role takes effect.");
