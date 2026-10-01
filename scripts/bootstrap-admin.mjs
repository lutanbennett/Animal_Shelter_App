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
// roles exist, and changes nothing but the factors (and opens set-up, below).
//
//   node scripts/bootstrap-admin.mjs --env production --allow-2step-setup someone@gmail.com
//
// Opens a first authenticator set-up for a login with no app the site
// trusts, for three days (src/lib/auth/two-step.ts). A password alone can't
// enrol an app any more — another admin presses Allow set-up on Security —
// so this is the route when there is no other admin: the only admin, never
// prompted, or whose window ran out. Also removes any app that is there but
// untrusted. Use --reset-2step instead for a login that already has one.
import { randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { loadEnv, parseEnvArg, projectRef } from "./lib/env.mjs";

const { name: envName, rest } = parseEnvArg(process.argv.slice(2));
const email = rest.find((a) => a.includes("@"));
const resetTwoStep = rest.includes("--reset-2step");
const allowSetup = rest.includes("--allow-2step-setup");
// Mirrors src/lib/auth/two-step.ts (this script runs outside the app build).
const SETUP_OPEN_UNTIL = "two_step_setup_until";
const APPROVED_FACTOR = "two_step_factor";
const RULE_STARTS_AT = "2026-10-01T00:00:00Z";
const setupWindowEnd = () => new Date(Date.now() + 3 * 86_400_000).toISOString();
if (!email) {
  console.error("bootstrap-admin: give the admin's email address.");
  process.exit(2);
}
const env = loadEnv(envName);
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

/** The login with this email, or null. */
async function findUser() {
  let user = null;
  for (let page = 1; !user; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    user = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase()) ?? null;
    if (data.users.length < 200) break;
  }
  return user;
}

/** --reset-2step: remove the login's authenticator app(s). Returns the exit code. */
async function resetFactors() {
  const user = await findUser();
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
  // The replacement needs an admin's say-so too; this is it.
  const { error: openError } = await admin.auth.admin.updateUserById(user.id, {
    app_metadata: { [APPROVED_FACTOR]: null, [SETUP_OPEN_UNTIL]: setupWindowEnd() },
  });
  if (openError) throw openError;
  console.log(
    factors.length
      ? `bootstrap-admin: removed ${factors.length} authenticator app(s) from ${email} on ${envName} (${projectRef(env)}). They set one up again the next time they open Security.`
      : `bootstrap-admin: ${email} on ${envName} (${projectRef(env)}) has no authenticator app; nothing to reset.`,
  );
  return 0;
}

/** --allow-2step-setup: open a first set-up for a login with no trusted app. Returns the exit code. */
async function allowSetup2() {
  const user = await findUser();
  if (!user) {
    console.error(`bootstrap-admin: no login for ${email} on ${envName} (${projectRef(env)}).`);
    return 1;
  }
  const { data, error } = await admin.auth.admin.mfa.listFactors({ userId: user.id });
  if (error) throw error;
  const factors = data.factors.filter((f) => f.factor_type === "totp");
  const trusted = factors.some(
    (f) => f.status === "verified" && (f.id === user.app_metadata?.[APPROVED_FACTOR] || f.created_at < RULE_STARTS_AT),
  );
  if (trusted) {
    console.error(`bootstrap-admin: ${email} already has an authenticator app; use --reset-2step to replace it.`);
    return 1;
  }
  for (const factor of factors) {
    const { error: deleteError } = await admin.auth.admin.mfa.deleteFactor({ id: factor.id, userId: user.id });
    if (deleteError) throw deleteError;
  }
  const { error: openError } = await admin.auth.admin.updateUserById(user.id, {
    app_metadata: { [APPROVED_FACTOR]: null, [SETUP_OPEN_UNTIL]: setupWindowEnd() },
  });
  if (openError) throw openError;
  console.log(
    `bootstrap-admin: authenticator set-up is open for ${email} on ${envName} (${projectRef(env)}) for three days. They open Security and set it up.`,
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
    // The first admin's set-up is open: nobody else exists to open it.
    app_metadata: { must_change_password: true, [SETUP_OPEN_UNTIL]: setupWindowEnd() },
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
process.exitCode = resetTwoStep ? await resetFactors() : allowSetup ? await allowSetup2() : await bootstrap();
