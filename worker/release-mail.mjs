// The two release endpoints, answered by the Worker itself — before the edge
// cache and before the Pi — because only the Worker holds the send_email
// binding (docs/decisions.md, "Release notes register").
//
//   GET  /api/releases/current  → { version } of the build this Worker runs.
//        scripts/deploy.mjs asks before deploying, so after the deploy it
//        knows which releases are new to this site and mails only those.
//
//   POST /api/releases/mail     → relays one release email to each address.
//        Bearer-authenticated with the service-role key (deploy.mjs has it
//        and so does this Worker, so no new secret). The caller supplies the
//        subject and body; the environment label and the From address come
//        from this Worker's own vars, so a mail can't claim to be from an
//        environment it wasn't sent by.
//
// The guard: nothing is sent unless RELEASE_MAIL_ENV is exactly "UAT" or
// "Production" AND the RELEASE_MAIL binding exists. The test environment
// (the dev database) sets neither, `next dev` never reaches this file, and
// the Pi forwards nothing here — so dev can't send, by construction. A
// disabled relay answers 200 with every address skipped, which deploy.mjs
// prints, so the no-op is visible rather than silent.
//
// Cloudflare only lets a free account mail *verified destination addresses*
// (Email Routing → Destination addresses). An admin who hasn't verified is
// skipped with the provider's error code; the rest still get the mail, one
// message each so no admin sees the others' addresses.

import { latestRelease } from "../src/lib/releases.ts";

const SEND_ENVIRONMENTS = new Set(["UAT", "Production"]);
const MAX_RECIPIENTS = 50;

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });

async function sha256(text) {
  return crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
}

/** Constant-time check of the bearer token against the service-role key. */
async function authorised(request, env) {
  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token || !env.SUPABASE_SERVICE_ROLE_KEY) return false;
  const [a, b] = await Promise.all([sha256(token), sha256(env.SUPABASE_SERVICE_ROLE_KEY)]);
  return crypto.subtle.timingSafeEqual(a, b);
}

async function relay(request, env) {
  if (!(await authorised(request, env))) return json({ error: "Not authorised." }, 401);

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Body must be JSON." }, 400);
  }
  const { subject, text, html, to } = body ?? {};
  const recipients = Array.isArray(to) ? [...new Set(to.filter((a) => typeof a === "string" && a.includes("@")))] : [];
  if (typeof subject !== "string" || typeof text !== "string" || typeof html !== "string" || !recipients.length) {
    return json({ error: "Need subject, text, html and a non-empty `to`." }, 400);
  }
  if (recipients.length > MAX_RECIPIENTS) return json({ error: `At most ${MAX_RECIPIENTS} recipients.` }, 400);

  const label = env.RELEASE_MAIL_ENV;
  const off = !SEND_ENVIRONMENTS.has(label)
    ? `RELEASE_MAIL_ENV is ${JSON.stringify(label ?? "")}, not UAT or Production`
    : !env.RELEASE_MAIL
      ? "no RELEASE_MAIL binding"
      : !env.RELEASE_MAIL_FROM
        ? "no RELEASE_MAIL_FROM"
        : null;
  if (off) {
    const reason = `release mail is off in this environment: ${off}`;
    console.log(`release-mail: not sent — ${reason}: ${subject}`);
    return json({ environment: label ?? null, sent: [], skipped: recipients.map((address) => ({ address, reason })) });
  }

  const sent = [];
  const skipped = [];
  for (const address of recipients) {
    try {
      await env.RELEASE_MAIL.send({
        from: { email: env.RELEASE_MAIL_FROM, name: `Lanna Care ${label}` },
        to: address,
        subject: `[${label}] ${subject}`,
        text,
        html,
      });
      sent.push(address);
    } catch (err) {
      skipped.push({ address, reason: err?.code ?? err?.message ?? String(err) });
    }
  }
  console.log(`release-mail: [${label}] ${subject} — sent ${sent.length}, skipped ${skipped.length}`);
  return json({ environment: label, sent, skipped });
}

/** A Response for the release endpoints, or null for every other request. */
export async function handleReleaseRequest(request, env) {
  const { pathname } = new URL(request.url);
  if (pathname === "/api/releases/current" && request.method === "GET") {
    return json({ version: latestRelease.version });
  }
  if (pathname === "/api/releases/mail") {
    return request.method === "POST" ? relay(request, env) : json({ error: "POST only." }, 405);
  }
  return null;
}
