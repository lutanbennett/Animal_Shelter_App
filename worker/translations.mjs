// Machine-drafted translations: the cron half. Every run (the same 15-minute
// trigger as the status alerts) it takes a few `translations` rows that are
// `pending`, has an engine (worker/translate-engines.mjs) write the other
// language, and saves the result as a DRAFT for a manager to check.
//
// What it will and will not do — the safety model, in one place:
//
//  - It only ever writes `status = 'draft'`. That literal is in `saveDraft`
//    and nowhere else; nothing here can produce 'approved', which is what the
//    public views show, so a bug in this file can put a bad draft in the
//    manager's queue but never on the website.
//  - Every write is conditional on the row still being `pending` and still
//    having the `updated_at` it was read with. A manager who typed a
//    translation, or staff who edited the source, in the meantime changed
//    one of those (the 0056 trigger bumps updated_at), so the write matches
//    nothing and the machine's text is dropped. It never overwrites a human.
//  - Volume is bounded three ways: BATCH rows per run, MAX_PER_RUN failures
//    before the run stops, and DAILY_REVIEWED machine drafts a day for the
//    `reviewed` tier, so a backlog reaches the managers ~20 a day, not all at
//    once. All three are vars (TRANSLATE_BATCH, TRANSLATE_REVIEWED_DAILY).
//  - A row the model fails on does not spin — see `recordFailure`.
//
// No schema changes: the failure memory lives in `engine` on the still-pending
// row ("mt-retry:<attempts>:<hash of the source>"), which nothing else reads
// while the row is pending.
//
// Talks to Supabase REST with the service-role key (a Wrangler secret,
// SUPABASE_SERVICE_ROLE_KEY — the same one scheduled alerts and release mail
// already use) against SUPABASE_URL (a plain var). That key bypasses RLS, so
// this file touches only `translations` and `translatable_fields`.

import { OutputRejected, pickEngine, translate } from "./translate-engines.mjs";

export const DEFAULT_BATCH = 2; // rows per run: 2 × 96 runs = 192 a day at most
export const DEFAULT_REVIEWED_DAILY = 20; // machine drafts a day for the manager-checked tier
export const MAX_ATTEMPTS = 3; // then the row is left for a manager to write
export const BACKOFF_MINUTES = [30, 180]; // wait after the 1st and 2nd failure
const WINDOW = 50; // pending rows looked at per run, oldest-changed first
const MARKER = "mt-retry";

const intVar = (value, fallback) => {
  const n = Number.parseInt(value ?? "", 10);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
};

/** A short fingerprint of the source, so a failure count does not outlive an edit to it. */
export async function fingerprint(text) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(digest).slice(0, 4)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** `{ attempts, hash }` from a failure marker in `engine`, else attempts 0. */
export function readMarker(engine) {
  const m = new RegExp(`^${MARKER}:(\\d+):([0-9a-f]+)$`).exec(engine ?? "");
  return m ? { attempts: Number(m[1]), hash: m[2] } : { attempts: 0, hash: null };
}

/** Failures that still count: only those recorded against this exact source. */
export function attemptsFor(row, hash) {
  const marker = readMarker(row.engine);
  return marker.hash === hash ? marker.attempts : 0;
}

/** Is this row worth trying now? False once given up, or while backing off. */
export function eligible(row, hash, nowMs) {
  const attempts = attemptsFor(row, hash);
  if (attempts >= MAX_ATTEMPTS) return false;
  if (attempts === 0) return true;
  const wait = BACKOFF_MINUTES[Math.min(attempts, BACKOFF_MINUTES.length) - 1] * 60_000;
  return nowMs - Date.parse(row.updated_at) >= wait;
}

function rest(env, fetchImpl) {
  const base = `${env.SUPABASE_URL.replace(/\/$/, "")}/rest/v1`;
  const headers = {
    apikey: env.SUPABASE_SERVICE_ROLE_KEY,
    authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
  };
  return async (path, init = {}) => {
    const response = await fetchImpl(`${base}/${path}`, {
      ...init,
      headers: { ...headers, ...(init.body ? { "content-type": "application/json" } : {}), ...init.headers },
    });
    if (!response.ok) throw new Error(`supabase ${init.method ?? "GET"} ${path.split("?")[0]} → ${response.status}`);
    return response.status === 204 ? null : response.json();
  };
}

/** PATCH one row, only while it is still the pending row we read. Returns whether it matched. */
async function patchPending(api, row, body) {
  const filter = `id=eq.${row.id}&status=eq.pending&updated_at=eq.${encodeURIComponent(row.updated_at)}`;
  const rows = await api(`translations?${filter}&select=id`, {
    method: "PATCH",
    headers: { prefer: "return=representation" },
    body: JSON.stringify(body),
  });
  return rows.length > 0;
}

/** The only place a machine result is saved. The status is a literal on purpose. */
function saveDraft(api, row, text, engineLabel, nowIso) {
  return patchPending(api, row, {
    text,
    engine: engineLabel,
    status: "draft",
    updated_at: nowIso,
  });
}

/**
 * Count the failure against this source. Three strikes (30 min, then 3 h,
 * apart) and the row is left alone: still pending, still in the manager's
 * queue to write by hand as before, no longer retried. Editing the source
 * changes the fingerprint, which gives it a fresh three. A row that fails
 * every run forever costs quota and log noise for nothing; one that is left
 * alone costs a manager the same as it did before this worker existed.
 */
async function recordFailure(api, row, hash, attempts, nowIso) {
  return patchPending(api, row, {
    engine: `${MARKER}:${attempts + 1}:${hash}`,
    updated_at: nowIso,
  });
}

/**
 * One cron run. Returns a summary (also logged). Never throws for a row or an
 * engine problem — the status alerts share this trigger and must still run —
 * only a bad configuration or an unreachable database surfaces as `error`.
 */
export async function runTranslations(env, { fetchImpl = fetch, now = Date.now(), log = console.log } = {}) {
  const summary = { drafted: 0, failed: 0, skipped: 0, note: null };
  try {
    if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
      summary.note = "SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not set; not running";
      return summary;
    }
    const picked = pickEngine(env);
    if (!picked.engine) {
      summary.note = `not running: ${picked.reason}`;
      return summary;
    }

    const api = rest(env, fetchImpl);
    const nowIso = new Date(now).toISOString();
    const batch = intVar(env.TRANSLATE_BATCH, DEFAULT_BATCH);
    const dailyReviewed = intVar(env.TRANSLATE_REVIEWED_DAILY, DEFAULT_REVIEWED_DAILY);

    const fields = await api("translatable_fields?select=table_name,column_name,tier");
    const tierOf = new Map(fields.map((f) => [`${f.table_name}.${f.column_name}`, f.tier]));

    // Machine drafts already handed to managers in the last 24 hours (a human's
    // work is engine 'human' and does not count).
    const since = new Date(now - 24 * 3_600_000).toISOString();
    const recent = await api(
      `translations?select=table_name,column_name&status=eq.draft&engine=neq.human&updated_at=gte.${encodeURIComponent(since)}&limit=1000`,
    );
    let reviewedLeft = Math.max(
      0,
      dailyReviewed - recent.filter((r) => tierOf.get(`${r.table_name}.${r.column_name}`) === "reviewed").length,
    );

    const pending = await api(
      "translations?select=id,table_name,column_name,source_lang,target_lang,source_text,engine,updated_at" +
        `&status=eq.pending&order=updated_at.asc&limit=${WINDOW}`,
    );

    let done = 0;
    for (const row of pending) {
      if (done >= batch) break;
      const tier = tierOf.get(`${row.table_name}.${row.column_name}`);
      if (!tier) continue; // not a field this worker knows how to treat
      if (tier === "reviewed" && reviewedLeft === 0) {
        summary.skipped += 1;
        continue;
      }
      const hash = await fingerprint(row.source_text);
      if (!eligible(row, hash, now)) {
        summary.skipped += 1;
        continue;
      }

      done += 1;
      const request = { text: row.source_text, from: row.source_lang, to: row.target_lang, tier };
      let text;
      let engineDown = false;
      try {
        text = await translate(env, picked, request, fetchImpl);
      } catch (err) {
        // An engine that throws (quota, outage) is likely to throw for the next
        // row too: count this one, then stop the run rather than burn the batch.
        // A model that merely wrote something unusable is that row's problem alone.
        engineDown = !(err instanceof OutputRejected);
        log(`translations: ${row.table_name}.${row.column_name} ${row.id}: ${err?.message ?? err}`);
      }

      if (text !== undefined) {
        if (await saveDraft(api, row, text, picked.label, nowIso)) {
          summary.drafted += 1;
          if (tier === "reviewed") reviewedLeft -= 1;
        } else {
          summary.skipped += 1; // edited or written by a person while we worked
        }
        continue;
      }
      summary.failed += 1;
      await recordFailure(api, row, hash, attemptsFor(row, hash), nowIso);
      if (engineDown) {
        summary.note = "engine error; stopped this run early";
        break;
      }
    }
  } catch (err) {
    summary.note = `error: ${err?.message ?? err}`;
    console.error(`translations: ${summary.note}`);
    return summary;
  }
  log(`translations: drafted ${summary.drafted}, failed ${summary.failed}, skipped ${summary.skipped}${summary.note ? ` (${summary.note})` : ""}`);
  return summary;
}
