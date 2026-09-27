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
//
//   node scripts/bootstrap-admin.mjs --env production --reset-2step someone@gmail.com
//
// The last-resort recovery for Settings → Security's 2-step verification
// (docs/decisions.md, 2026-09-27): removes that login's authenticator app,
// so the next time they open Security they set one up again. The normal
// route is another admin's "Reset" in the 2-step column; this is for when
// no admin can pass 2-step — the only admin lost their phone. Runs whatever
// roles exist, and changes nothing but the factors.
import { randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { loadEnv, parseEnvArg, projectRef } from "./lib/env.mjs";

const { name: envName, rest } = parseEnvArg(process.argv.slice(2));
const email = rest.find((a) => a.includes("@"));
const resetTwoStep = rest.includes("--reset-2step");
if (!email) {
  console.error("bootstrap-admin: give the admin's email address.");
  process.exit(2);
}
const env = loadEnv(envName);
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

/** --reset-2step: remove the login's authenticator app(s). Returns the exit code. */
async function resetFactors() {
  let user = null;
  for (let page = 1; !user; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    user = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase()) ?? null;
    if (data.users.length < 200) break;
  }
  if (!user) {
    console.error(`bootstrap-admin: no login for ${email} on ${envName} (${projectRef(env)}).`);
    return 1;
  }
  const { data, error } = await admin.auth.admin.mfa.listFactors({ userId: user.id });
  if (error) throw error;
  const factors = data.factors.filter((f) => f.factor_type === "totp");
  for (const factor of factors) {
    const { error: deleteError } = await admin.auth.admin.mfa.deleteFactor({ id: factor.id, userId: user.id });
    if (deleteError) throw deleteError;
  }
  console.log(
    factors.length
      ? `bootstrap-admin: removed ${factors.length} authenticator app(s) from ${email} on ${envName} (${projectRef(env)}). They set one up again the next time they open Security.`
      : `bootstrap-admin: ${email} on ${envName} (${projectRef(env)}) has no authenticator app; nothing to reset.`,
  );
  return 0;
}

/** The first admin in an empty environment. Returns the exit code. */
async function bootstrap() {
  const { count, error: countError } = await admin
    .from("user_roles")
    .select("*", { count: "exact", head: true });
  if (countError) throw countError;
  if (count > 0) {
    console.error(`bootstrap-admin: ${envName} (${projectRef(env)}) already has ${count} role(s); use /admin/security.`);
    return 1;
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
  return 0;
}

// exitCode, not exit(): exiting straight after fetch trips a libuv assertion on Windows.
process.exitCode = resetTwoStep ? await resetFactors() : await bootstrap();
