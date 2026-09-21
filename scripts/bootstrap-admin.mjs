// Create the first admin login in an environment that has none yet.
//
//   node scripts/bootstrap-admin.mjs --env production someone@gmail.com
//
// Logins are admin-provisioned (docs/decisions.md): the auth callback signs
// out any account without a user_roles row, and only an admin can add one
// through /admin/security. A fresh database therefore needs one admin seeded
// from outside — this does exactly what the "Create login" form does, with
// the service role: an email-confirmed user flagged to change the temporary
// password on first sign-in, plus the admin role. Signing in with a Google
// account of the same address links to it automatically, so the temporary
// password need never be used. Refuses to run if any user_roles row exists.
import { randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { loadEnv, parseEnvArg, projectRef } from "./lib/env.mjs";

const { name: envName, rest } = parseEnvArg(process.argv.slice(2));
const email = rest.find((a) => a.includes("@"));
if (!email) {
  console.error("bootstrap-admin: give the admin's email address.");
  process.exit(2);
}
const env = loadEnv(envName);
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { count, error: countError } = await admin
  .from("user_roles")
  .select("*", { count: "exact", head: true });
if (countError) throw countError;
if (count > 0) {
  console.error(`bootstrap-admin: ${envName} (${projectRef(env)}) already has ${count} role(s); use /admin/security.`);
  process.exit(1);
}

const temporaryPassword = randomBytes(12).toString("base64url");
const { data, error } = await admin.auth.admin.createUser({
  email,
  password: temporaryPassword,
  email_confirm: true,
  app_metadata: { must_change_password: true },
});
if (error) throw error;

const { error: roleError } = await admin.from("user_roles").insert({ user_id: data.user.id, role: "admin" });
if (roleError) {
  await admin.auth.admin.deleteUser(data.user.id);
  throw roleError;
}

console.log(`bootstrap-admin: ${email} is admin on ${envName} (${projectRef(env)}).`);
console.log("Sign in with Google using that address, or with the temporary password (shown once):");
console.log(`  ${temporaryPassword}`);
