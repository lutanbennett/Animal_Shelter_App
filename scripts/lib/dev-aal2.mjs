// The DEV-ONLY step-up for a scripted login (#dvaal; docs/decisions/2026-11-19-dev-aal2-path.md).
//
// GoTrue alone mints the `aal: "aal2"` claim, and only after a TOTP code is verified for a factor the login owns. So this
// does what a person does with an authenticator app, from a script: enrol a factor on a disposable dev-signin login, compute
// the code from the secret GoTrue returns, verify it. Nothing in src/ or the database changes, and 0411's policies still read
// the same JWT claim they always did. It is a script helper and is imported by scripts/dev-signin.mjs only
// (scripts/check-dev-aal2-absent.mjs asserts both).
import { createHmac } from "node:crypto";

/** The dev Supabase project. The one place this ref is written for the step-up; assertDevProject refuses everything else. */
export const DEV_PROJECT_REF = "qxkmhwybjggxvsfxsxbd";
/** The only logins the step-up may touch: the ones dev-signin makes. */
export const DEV_LOGIN_PREFIX = "dev-signin-";
export const DEV_LOGIN_DOMAIN = "@example.invalid";
/** app_metadata keys the app reads (src/lib/auth/two-step.ts APPROVED_FACTOR, SETUP_OPEN_UNTIL). */
export const APPROVED_FACTOR = "two_step_factor";
export const SETUP_OPEN_UNTIL = "two_step_setup_until";

export function assertDevProject(ref) {
  if (ref !== DEV_PROJECT_REF) throw new Error(`refusing: ${ref} is not the dev project; the aal2 step-up is dev only`);
}
export function assertDevLogin(email) {
  if (!email?.startsWith(DEV_LOGIN_PREFIX) || !email.endsWith(DEV_LOGIN_DOMAIN)) {
    throw new Error(`refusing: ${email} is not a dev-signin login; the aal2 step-up touches those only`);
  }
}

const B32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
export function base32Decode(s) {
  let bits = 0, value = 0;
  const out = [];
  for (const ch of s.replace(/[\s=]+/g, "").toUpperCase()) {
    const i = B32.indexOf(ch);
    if (i < 0) throw new Error("not base32");
    value = (value << 5) | i;
    bits += 5;
    if (bits >= 8) { out.push((value >>> (bits - 8)) & 255); bits -= 8; }
  }
  return Buffer.from(out);
}

/** RFC 6238, SHA-1, 30 s, 6 digits: what every authenticator app computes. */
export function totp(secret, atMs = Date.now()) {
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(Math.floor(atMs / 30000)));
  const h = createHmac("sha1", base32Decode(secret)).update(counter).digest();
  const o = h[19] & 15;
  const n = ((h[o] & 127) << 24) | (h[o + 1] << 16) | (h[o + 2] << 8) | h[o + 3];
  return String(n % 1_000_000).padStart(6, "0");
}

/**
 * Raise the signed-in `ssr` session to aal2 for `user` on dev. `service` is the dev service-role client, `ssr` the cookie
 * client that holds the login's aal1 session; its jar ends up holding the aal2 tokens.
 */
export async function stepUpToAal2({ service, ssr, user, projectRef }) {
  assertDevProject(projectRef);
  assertDevLogin(user.email);
  // Fresh factor every time: a secret GoTrue hands out once cannot be recovered, and this login is disposable.
  const { data: listed, error: listErr } = await service.auth.admin.mfa.listFactors({ userId: user.id });
  if (listErr) throw listErr;
  for (const f of listed.factors ?? []) {
    const { error } = await service.auth.admin.mfa.deleteFactor({ id: f.id, userId: user.id });
    if (error) throw error;
  }
  const { data: enrolled, error: enrolErr } = await ssr.auth.mfa.enroll({ factorType: "totp", friendlyName: "Dev sign-in", issuer: "Lanna Animal Care (dev step-up)" });
  if (enrolErr) throw enrolErr;
  let verifyErr = null;
  // A code is good for its 30 s step; if the step turns over between computing and verifying, try the next one once.
  for (const offset of [0, 30000]) {
    const { error } = await ssr.auth.mfa.challengeAndVerify({ factorId: enrolled.id, code: totp(enrolled.totp.secret, Date.now() + offset) });
    verifyErr = error;
    if (!error) break;
  }
  if (verifyErr) throw verifyErr;
  // The app trusts a factor only if app_metadata names it (two-step.ts trustedTotpFactors); the service role writes that, as the app's own bind does.
  const { error: bindErr } = await service.auth.admin.updateUserById(user.id, { app_metadata: { [APPROVED_FACTOR]: enrolled.id, [SETUP_OPEN_UNTIL]: null } });
  if (bindErr) throw bindErr;
  return enrolled.id;
}
