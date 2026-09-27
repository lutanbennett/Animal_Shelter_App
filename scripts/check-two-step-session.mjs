// What a real Supabase Auth session reports before and after the
// authenticator-app (TOTP) step, against DEV only — the "test on dev first"
// half of the Security 2-step item (docs/decisions.md, 2026-09-27).
//
//   node scripts/check-two-step-session.mjs     (from the repo root; dev only)
//
// It makes a throwaway admin login with the service role, signs it in with a
// password through the ordinary anon client (as the app does), and prints
// what each token says:
//
//   1  after the password sign-in: aal, amr, lifetime
//   2  after enrolling and verifying a TOTP factor (codes computed here from
//      the secret, as an authenticator app does)
//   3  after a refresh-token grant — what the request proxy does when the
//      access token has expired — so whether a step-up survives it
//   4  the same admin's own JWT writing user_roles through the Data API at
//      aal1 and at aal2: 0100's policies with real GoTrue tokens, not
//      hand-built claims
//   5  after another admin (the service role) deletes the factor, as
//      "Reset 2-step" and scripts/bootstrap-admin.mjs --reset-2step do:
//      what the still-open aal2 session reports on its next refresh
//   6  what Google sign-ins on dev have actually recorded (auth.sessions and
//      auth.mfa_amr_claims), since a script cannot sign in with Google
//
// The login is deleted at the end, whatever happened. Exits 0 when every
// expectation held.
import { createHmac, randomBytes } from "node:crypto";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { createClient } from "@supabase/supabase-js";

const root = process.cwd();
const { loadEnv, projectRef } = await import(pathToFileURL(join(root, "scripts/lib/env.mjs")).href);
const env = loadEnv("test");
const ref = projectRef(env);
if (ref !== "qxkmhwybjggxvsfxsxbd") throw new Error(`refusing: ${ref} is not the dev project`);

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const service = createClient(url, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const anon = createClient(url, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

/** RFC 6238: the 6-digit code an authenticator app shows for this secret now. */
function totp(base32Secret, at = Date.now()) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = "";
  for (const c of base32Secret.replace(/=+$/, "").toUpperCase()) {
    bits += alphabet.indexOf(c).toString(2).padStart(5, "0");
  }
  const key = Buffer.from(bits.match(/.{8}/g).map((b) => parseInt(b, 2)));
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(Math.floor(at / 1000 / 30)));
  const hmac = createHmac("sha1", key).update(counter).digest();
  const offset = hmac[hmac.length - 1] & 0xf;
  const n = (hmac.readUInt32BE(offset) & 0x7fffffff) % 1_000_000;
  return String(n).padStart(6, "0");
}

const claims = (token) => JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString());
const describe = (token) => {
  const c = claims(token);
  const amr = (c.amr ?? []).map((a) => (typeof a === "string" ? a : a.method)).join("+");
  return `aal=${c.aal} amr=${amr} lifetime=${c.exp - c.iat}s session_id=${c.session_id?.slice(0, 8)}`;
};

const failures = [];
const expect = (ok, what) => {
  console.log(`  ${ok ? "ok  " : "FAIL"} ${what}`);
  if (!ok) failures.push(what);
};

const email = `harness-two-step-${randomBytes(4).toString("hex")}@example.invalid`;
const password = randomBytes(18).toString("base64url");
const { data: created, error: createError } = await service.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
});
if (createError) throw createError;
const userId = created.user.id;
const probeId = crypto.randomUUID();

try {
  const { error: roleError } = await service.from("user_roles").insert({ user_id: userId, role: "admin" });
  if (roleError) throw roleError;

  // 1 — password sign-in
  const { data: signIn, error: signInError } = await anon.auth.signInWithPassword({ email, password });
  if (signInError) throw signInError;
  let session = signIn.session;
  console.log(`1 password sign-in:      ${describe(session.access_token)}`);
  expect(claims(session.access_token).aal === "aal1", "a password session is aal1");

  // 4a — aal1 admin writes user_roles with its own JWT
  const asUser = (token) =>
    createClient(url, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { autoRefreshToken: false, persistSession: false },
    });
  {
    const { data: rows } = await asUser(session.access_token).from("user_roles").select("user_id").limit(500);
    expect((rows ?? []).length > 0, `aal1 admin still reads user_roles (${rows?.length ?? 0} rows)`);
    const { data: updated, error } = await asUser(session.access_token)
      .from("user_roles")
      .update({ archived_at: null })
      .eq("user_id", userId)
      .select();
    expect(!error && (updated ?? []).length === 0, "aal1 admin's own-JWT update of user_roles touches 0 rows");
  }

  // 2 — enrol and verify TOTP
  const { data: enrolled, error: enrolError } = await anon.auth.mfa.enroll({
    factorType: "totp",
    friendlyName: "harness",
    issuer: "Lanna Animal Care (harness)",
  });
  if (enrolError) throw enrolError;
  const secret = enrolled.totp.secret;
  console.log(`  enrolled factor ${enrolled.id.slice(0, 8)}, uri ${enrolled.totp.uri.replace(/secret=[^&]+/, "secret=…")}`);
  {
    const wrong = totp(secret) === "000000" ? "111111" : "000000";
    const { error } = await anon.auth.mfa.challengeAndVerify({ factorId: enrolled.id, code: wrong });
    expect(error?.code === "mfa_verification_failed", `a wrong code is refused (${error?.code})`);
  }
  const { data: verified, error: verifyError } = await anon.auth.mfa.challengeAndVerify({
    factorId: enrolled.id,
    code: totp(secret),
  });
  if (verifyError) throw verifyError;
  session = verified;
  console.log(`2 after TOTP verify:     ${describe(session.access_token)}`);
  expect(claims(session.access_token).aal === "aal2", "after the TOTP step the token is aal2");
  const firstSessionId = claims(session.access_token).session_id;
  expect(claims(signIn.session.access_token).session_id === firstSessionId, "the step-up keeps the same session (not a new login)");

  const { data: aalInfo } = await anon.auth.mfa.getAuthenticatorAssuranceLevel(session.access_token);
  console.log(`  getAuthenticatorAssuranceLevel: current=${aalInfo?.currentLevel} next=${aalInfo?.nextLevel}`);

  // 4b — aal2 admin writes user_roles with its own JWT
  {
    const { data: updated, error } = await asUser(session.access_token)
      .from("user_roles")
      .update({ archived_at: null })
      .eq("user_id", userId)
      .select();
    expect(!error && (updated ?? []).length === 1, "aal2 admin's own-JWT update of user_roles touches 1 row");
  }

  // 3 — refresh-token grant
  const { data: refreshed, error: refreshError } = await anon.auth.refreshSession({
    refresh_token: session.refresh_token,
  });
  if (refreshError) throw refreshError;
  session = refreshed.session;
  console.log(`3 after refresh:         ${describe(session.access_token)}`);
  expect(claims(session.access_token).aal === "aal2", "a refreshed token is still aal2");
  expect(claims(session.access_token).session_id === firstSessionId, "refresh keeps the session");

  // A fresh sign-in of the same enrolled account starts at aal1 again, with aal2 as next.
  {
    const other = createClient(url, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: again } = await other.auth.signInWithPassword({ email, password });
    const { data: lvl } = await other.auth.mfa.getAuthenticatorAssuranceLevel(again.session.access_token);
    console.log(`  new sign-in once enrolled: ${describe(again.session.access_token)} next=${lvl?.nextLevel}`);
    expect(lvl?.currentLevel === "aal1" && lvl?.nextLevel === "aal2", "a new sign-in of an enrolled account is aal1, next aal2");
  }

  // 5 — the factor removed by another admin (service role)
  const { data: listed } = await service.auth.admin.mfa.listFactors({ userId });
  console.log(`  admin listFactors: ${listed?.factors?.map((f) => `${f.factor_type}/${f.status}`).join(", ")}`);
  const { data: listedUser } = await service.auth.admin.getUserById(userId);
  console.log(`  getUserById factors: ${(listedUser?.user?.factors ?? []).map((f) => `${f.factor_type}/${f.status}`).join(", ")}`);
  const { error: deleteError } = await service.auth.admin.mfa.deleteFactor({ id: enrolled.id, userId });
  if (deleteError) throw deleteError;
  const { data: afterReset, error: afterResetError } = await anon.auth.refreshSession({
    refresh_token: session.refresh_token,
  });
  if (afterResetError) {
    console.log(`5 refresh after reset:   refused (${afterResetError.code ?? afterResetError.message})`);
  } else {
    console.log(`5 refresh after reset:   ${describe(afterReset.session.access_token)}`);
  }

  // 6 — Google sign-ins recorded on dev
  const q = `
    select s.aal::text as aal, c.authentication_method as method, count(*)::int as n,
           max(s.created_at)::text as latest
    from auth.sessions s join auth.mfa_amr_claims c on c.session_id = s.id
    group by 1, 2 order by 2, 1`;
  const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: "POST",
    headers: { Authorization: `Bearer ${env.SUPABASE_ACCESS_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query: q }),
  });
  const rows = await res.json();
  console.log("6 sessions on dev by sign-in method:");
  for (const r of rows) console.log(`    ${r.method.padEnd(10)} ${r.aal}  ${r.n} session(s), latest ${r.latest}`);
  const oauth = rows.filter((r) => r.method === "oauth");
  if (oauth.length) expect(oauth.every((r) => r.aal === "aal1"), "every Google (oauth) session on dev is aal1");
  else console.log("    (no Google sessions on dev to read)");
} finally {
  await service.from("user_roles").delete().eq("user_id", userId);
  const { error } = await service.auth.admin.deleteUser(userId);
  console.log(error ? `cleanup FAILED for ${email}: ${error.message}` : `cleaned up ${email}`);
}

console.log(failures.length ? `\n${failures.length} expectation(s) failed.` : "\nAll expectations held.");
// exitCode, not exit(): exiting straight after fetch trips a libuv assertion on Windows.
process.exitCode = failures.length ? 1 : 0;
