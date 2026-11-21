// What Google identity can this session SEE, and does the written record agree?
// Shared by scripts/check-google-identity.mjs and scripts/check-planner-preflight.mjs.
//
// NO SECRET VALUE IS EVER RETURNED OR PRINTED. This repository is public and the
// output is pasted into PRs. Everything reported is a key NAME or a verdict:
// absent / partial / refreshes / revoked / client-rejected / unreachable.
// Not even an account address or a client id prefix: "same account as" is decided
// in memory by comparing two Drive responses and only the identity name leaves here.
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { loadLayers, envFile, ENVIRONMENTS } from "./env.mjs";

export const IDENTITIES = {
  app: ["GOOGLE_OAUTH_CLIENT_ID", "GOOGLE_OAUTH_CLIENT_SECRET", "GOOGLE_OAUTH_REFRESH_TOKEN"],
  backup: [
    "BACKUP_GOOGLE_OAUTH_CLIENT_ID",
    "BACKUP_GOOGLE_OAUTH_CLIENT_SECRET",
    "BACKUP_GOOGLE_OAUTH_REFRESH_TOKEN",
  ],
};

const fp = (s) => createHash("sha256").update(s).digest("hex");

async function probeOnce(creds) {
  try {
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: creds[0],
        client_secret: creds[1],
        refresh_token: creds[2],
        grant_type: "refresh_token",
      }),
    });
    const body = await res.json().catch(() => ({}));
    if (res.ok && body.access_token) {
      let account = null;
      try {
        const about = await fetch("https://www.googleapis.com/drive/v3/about?fields=user(emailAddress)", {
          headers: { Authorization: `Bearer ${body.access_token}` },
        });
        const j = await about.json();
        if (about.ok && j.user?.emailAddress) account = fp(j.user.emailAddress.toLowerCase());
      } catch {}
      return { verdict: "refreshes", account };
    }
    if (body.error === "invalid_grant") return { verdict: "revoked" };
    if (body.error === "invalid_client" || body.error === "unauthorized_client") return { verdict: "client-rejected" };
    return { verdict: "unreachable", why: `HTTP ${res.status}` };
  } catch {
    return { verdict: "unreachable", why: "network" };
  }
}

/** Read what each environment holds and probe it. Returns rows of plain verdicts. */
export async function readGoogleIdentity({ envs = ENVIRONMENTS, probe = true } = {}) {
  const rows = [];
  const cache = new Map();
  for (const env of envs) {
    if (env !== "test" && !existsSync(envFile(env))) {
      rows.push({ env, identity: "*", verdict: "no-env-file", source: "-" });
      continue;
    }
    const { base, overlay, shell } = loadLayers(env);
    const merged = { ...base, ...overlay, ...shell };
    for (const [identity, keys] of Object.entries(IDENTITIES)) {
      const set = keys.filter((k) => merged[k]);
      const own = keys.every((k) => overlay[k] !== undefined);
      const source = env === "test" ? ".env.local" : own ? `${envFile(env)} (own)` : "inherited from .env.local";
      const row = { env, identity, source, keysPresent: set.length, keysNeeded: keys.length };
      if (set.length === 0) row.verdict = "absent";
      else if (set.length < keys.length) {
        row.verdict = "partial";
        row.missing = keys.filter((k) => !merged[k]);
      } else if (!probe) row.verdict = "not-probed";
      else {
        const creds = keys.map((k) => merged[k]);
        const id = fp(creds.join("\n"));
        if (!cache.has(id)) cache.set(id, await probeOnce(creds));
        Object.assign(row, cache.get(id));
      }
      rows.push(row);
    }
  }
  for (const r of rows) {
    if (!r.account) continue;
    const peer = rows.find((p) => p !== r && p.env === r.env && p.account && p.identity !== r.identity);
    if (peer) r.sameAccountAs = peer.account === r.account ? peer.identity : null;
  }
  for (const r of rows) delete r.account;
  return rows;
}

/** The written record: docs/google-identity-registry.json. */
export function readRegistry(file = "docs/google-identity-registry.json") {
  return JSON.parse(readFileSync(file, "utf8"));
}

/**
 * Compare observations with the record. A row contradicts it when its verdict differs
 * from the recorded one, in EITHER direction (a recorded "revoked" that now refreshes
 * is as stale as a recorded "refreshes" that now fails). "unreachable" and
 * "no-env-file" are unknown, never a contradiction: an offline session must not fail.
 */
export function compare(rows, registry) {
  const out = [];
  for (const r of rows) {
    if (r.identity === "*") {
      out.push({ ...r, status: "unknown", detail: `${envFile(r.env)} not on this machine` });
      continue;
    }
    const rec = registry.expected?.[r.env]?.[r.identity];
    if (!rec) {
      out.push({ ...r, status: "unrecorded", detail: "no entry in docs/google-identity-registry.json" });
    } else if (r.verdict === "unreachable") {
      out.push({ ...r, status: "unknown", detail: `could not reach Google (${r.why})` });
    } else if (r.verdict === "not-probed") {
      out.push({ ...r, status: "unknown", detail: "not probed" });
    } else if (r.verdict === rec.verdict) {
      out.push({ ...r, status: "as-recorded", detail: rec.note ?? "" });
    } else {
      out.push({
        ...r,
        status: "CONTRADICTS",
        detail: `record says ${rec.verdict}, observed ${r.verdict}${rec.backlog ? ` (record cites ${rec.backlog})` : ""}`,
      });
    }
  }
  return out;
}
