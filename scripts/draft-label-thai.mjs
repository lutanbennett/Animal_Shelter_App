// Propose Thai for the short labels an environment has none for — as DRAFTS that wait for a person.
//
//   node scripts/draft-label-thai.mjs                                survey dev: what has no Thai, by group
//   node scripts/draft-label-thai.mjs --env production --out x.json   survey production and write the list
//   node scripts/draft-label-thai.mjs --drafts x.json                 check a filled-in list, write nothing
//   node scripts/draft-label-thai.mjs --drafts x.json --apply --dev-login
//   node scripts/draft-label-thai.mjs --drafts x.json --apply --login --env production --confirm production
//
// Nothing is written without --apply, and --apply can only ever reach label_drafts: every write goes
// through propose_label_th() (0293), which does not read, lock or touch the row, so no label a shelter
// user reads changes and every proposal waits for someone to press Approve. approve_label_th() is a
// person's action and is not called from here, ever.
//
// WHICH LOGIN. propose_label_th() asks has_permission('translations.propose') (0296), which answers
// from auth.uid(); the service key has no uid and is refused (42501, measured 2026-11-01), so this script
// signs in as a login that holds the "Propose a Thai label" card. Give it with --login: the address and
// password are read from LABEL_DRAFT_EMAIL and LABEL_DRAFT_PASSWORD in the environment (never from the
// command line, so they stay out of the shell history). That is the same machine login the Worker uses
// (worker/translations.mjs, runLabelDrafts), and it can only PROPOSE: approving still asks
// translations.manage. There is no hand-copied --access-token any more; copying one out of DevTools was
// the procedure this replaced. docs/decisions/2026-11-01-translations-propose-app.md.
//
// WHERE THE THAI COMES FROM: not from here. No engine is reachable from a checkout — the `ai` binding
// in worker/translate-engines.mjs is a Worker runtime binding, OLLAMA_URL is unset, and there is no
// model key in .env.local — so this script does not translate. It produces the LIST (--out), takes the
// Thai back as a file (--drafts), and is the thing that lands it. The Thai can come from a Thai speaker,
// from a session with the list in hand, or from the cron once it is allowed to propose; whichever it is,
// every string is put through the engine seam's own checkOutput() before it can land, so nothing blank,
// nothing that is the English handed back, nothing in the wrong script and nothing absurdly sized can be
// proposed. Whether the Thai READS well is still for a Thai speaker — that is what the draft is for.
//
// The registered pairs are read from translatable_labels at run time and each table is then read by name,
// so this script has no hand-maintained list of labels to drift out of step with the registry (unlike
// TRANSLATION_ARMS in scripts/lib/readonly-checks.mjs, which must be literal because its SQL is one
// statement). A pair registered by a later migration is picked up with no edit here.
//
// Exit 0 = ran, nothing to flag. 1 = something was refused. 2 = could not run.
import { readFileSync, writeFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { checkOutput, cleanOutput } from "../worker/translate-engines.mjs";
import { loadEnv, parseEnvArg, projectRef } from "./lib/env.mjs";
import { exitWith } from "./lib/exit.mjs";
import { giveCards } from "./lib/user-role.mjs";

const { name: envName, rest: args } = parseEnvArg(process.argv.slice(2));
const flag = (n) => args.includes(n);
const value = (n) => {
  const i = args.indexOf(n);
  return i >= 0 ? args[i + 1] : undefined;
};

const draftsFile = value("--drafts");
const outFile = value("--out");
const apply = flag("--apply");
const devLogin = flag("--dev-login");
const useLogin = flag("--login");
const loginEmail = process.env.LABEL_DRAFT_EMAIL;
const loginPassword = process.env.LABEL_DRAFT_PASSWORD;

// A label that is "shown as typed on purpose" (optional, no Thai) is a deliberate answer, not a gap.
// It is counted apart here exactly as the Translations screen and translations-open count it, and it is
// never offered for drafting.
const STATES = ["missing", "proposed", "stale", "as_typed", "current"];

/** Prints how to call it and returns the exit code for "could not run". */
function usage(message) {
  console.error(`${message}\n`);
  console.error("  node scripts/draft-label-thai.mjs [--env test|production] [--out <file>]");
  console.error("  node scripts/draft-label-thai.mjs --drafts <file> [--apply] [--dev-login | --login]");
  return 2;
}

/** The reason this invocation cannot run, or undefined. Answered before anything is read or written. */
function refuseArgs() {
  if (apply && !draftsFile) return "--apply needs --drafts <file>: there is nothing to write without one.";
  if (apply && !devLogin && !useLogin) {
    return (
      "--apply needs a session. propose_label_th() asks has_permission('translations.propose'), which answers from\n" +
      "auth.uid(), so the service key cannot call it (measured: 42501 permission denied). Give --login, with\n" +
      "LABEL_DRAFT_EMAIL and LABEL_DRAFT_PASSWORD set to a login holding the Propose a Thai label card, or\n" +
      "--dev-login on dev to have one made and removed."
    );
  }
  if (devLogin && envName !== "test") return "--dev-login only works with --env test; it creates and deletes a login.";
  if (useLogin && (!loginEmail || !loginPassword)) return "--login needs LABEL_DRAFT_EMAIL and LABEL_DRAFT_PASSWORD in the environment; nothing was sent.";
  if (devLogin && useLogin) return "give --dev-login or --login, not both.";
  if (apply && envName === "production" && value("--confirm") !== "production") {
    return "writing drafts to production needs --confirm production as well as --apply.";
  }
  return undefined;
}

const problem = refuseArgs();
const env = problem ? {} : loadEnv(envName);
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const service = problem
  ? null
  : createClient(url, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });

// ---------------------------------------------------------------------------
// Reading what has no Thai
// ---------------------------------------------------------------------------

/**
 * Every registered label pair, row by row, with the state the Translations screen would show it in.
 * Mirrors label_translations() and the translations-open check: a blank English is not a label at all,
 * a blank Thai is `missing` unless the pair is optional, Thai written against English that has since
 * changed is `stale`, and a pair with no live Thai but a proposal waiting is `proposed`.
 */
async function survey() {
  const { data: pairs, error } = await service
    .from("translatable_labels")
    .select("table_name,column_name,th_column,label_group,optional")
    .order("table_name")
    .order("column_name");
  if (error) throw new Error(`could not read translatable_labels: ${error.message}`);

  const sources = new Map();
  for (const r of await all("label_sources", "table_name,row_id,column_name,source_text")) {
    sources.set(`${r.table_name}\u0000${r.row_id}\u0000${r.column_name}`, r.source_text);
  }
  const drafts = new Map();
  for (const r of await all("label_drafts", "table_name,row_id,column_name,text_th")) {
    drafts.set(`${r.table_name}\u0000${r.row_id}\u0000${r.column_name}`, r.text_th);
  }

  const rows = [];
  for (const p of pairs) {
    const { data, error: readError } = await service.from(p.table_name).select(`id,${p.column_name},${p.th_column}`);
    if (readError) throw new Error(`could not read ${p.table_name}.${p.column_name}: ${readError.message}`);
    for (const r of data) {
      const en = (r[p.column_name] ?? "").toString().trim();
      if (!en) continue; // nothing to translate
      const rowId = String(r.id);
      const key = `${p.table_name}\u0000${rowId}\u0000${p.column_name}`;
      const th = (r[p.th_column] ?? "").toString().trim();
      let state;
      if (!th) state = drafts.has(key) ? "proposed" : p.optional ? "as_typed" : "missing";
      else state = (sources.get(key) ?? en) !== en ? "stale" : "current";
      rows.push({ table: p.table_name, row_id: rowId, column: p.column_name, group: p.label_group, en, state });
    }
  }
  return rows;
}

/** Every row of a table, in pages, because PostgREST caps a plain select. */
async function all(table, select) {
  const out = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await service.from(table).select(select).range(from, from + 999);
    if (error) throw new Error(`could not read ${table}: ${error.message}`);
    out.push(...data);
    if (data.length < 1000) return out;
  }
}

function byGroup(rows) {
  const groups = new Map();
  for (const r of rows) {
    const g = groups.get(r.group) ?? Object.fromEntries(STATES.map((s) => [s, 0]));
    g[r.state] += 1;
    groups.set(r.group, g);
  }
  return [...groups].sort(([a], [b]) => a.localeCompare(b));
}

function report(rows) {
  const total = Object.fromEntries(STATES.map((s) => [s, rows.filter((r) => r.state === s).length]));
  console.log(
    `${total.missing} labels have no Thai and no proposal; ${total.proposed} have a proposal waiting; ` +
      `${total.stale} are out of date; ${total.as_typed} are shown as typed on purpose.`,
  );
  for (const [group, g] of byGroup(rows)) {
    if (!g.missing && !g.proposed && !g.stale) continue;
    console.log(`   ${group}: ${g.missing} with no Thai, ${g.proposed} waiting, ${g.stale} out of date`);
  }
  return total;
}

// ---------------------------------------------------------------------------
// Landing a filled-in list
// ---------------------------------------------------------------------------

/**
 * A disposable login holding EXACTLY the propose_translations card (the machine login's own shape), for --dev-login. It is deleted again in
 * the finally block whatever happens, and its throwaway role with it: this is the harness pattern in
 * scripts/lib/user-role.mjs, not a login anyone signs in with. The password is random and never printed.
 */
async function devSession() {
  const email = `draft-label-thai-${randomBytes(4).toString("hex")}@example.invalid`;
  const password = randomBytes(24).toString("base64url");
  const { data: made, error } = await service.auth.admin.createUser({ email, password, email_confirm: true });
  if (error) throw new Error(`could not make a dev login: ${error.message}`);
  const { error: cardError, cleanup } = await giveCards(service, made.user.id, ["propose_translations"]);
  // The login goes first and the throwaway role second, the order giveCards' own comment asks for.
  const remove = async () => {
    const { error: delError } = await service.auth.admin.deleteUser(made.user.id);
    if (delError) console.error(`  could not delete the dev login ${email}: ${delError.message}`);
    await cleanup();
  };
  if (cardError) {
    await remove();
    throw new Error(`could not give the dev login the propose_translations card: ${cardError.message}`);
  }
  const anon = createClient(url, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false } });
  const { data: signed, error: signError } = await anon.auth.signInWithPassword({ email, password });
  if (signError) {
    await remove();
    throw new Error(`could not sign the dev login in: ${signError.message}`);
  }
  return { token: signed.session.access_token, remove };
}

/** Sign in as the configured machine login (--login). Nothing is created or removed. */
async function loginSession() {
  const anon = createClient(url, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false } });
  const { data, error } = await anon.auth.signInWithPassword({ email: loginEmail, password: loginPassword });
  if (error) throw new Error();
  return { token: data.session.access_token, remove: async () => {} };
}

/** The proposals in the file, each checked against what the database says now and against checkOutput. */
function readDrafts(file, rows) {
  const parsed = JSON.parse(readFileSync(file, "utf8"));
  const list = Array.isArray(parsed) ? parsed : parsed.labels;
  if (!Array.isArray(list)) throw new Error(`${file} must be a JSON array, or an object with a "labels" array`);
  const index = new Map(rows.map((r) => [`${r.table}\u0000${r.row_id}\u0000${r.column}`, r]));

  const ready = [];
  const refused = [];
  for (const d of list) {
    const where = `${d.table}.${d.column} ${d.row_id}`;
    const row = index.get(`${d.table}\u0000${d.row_id}\u0000${d.column}`);
    if (!row) {
      refused.push({ where, group: "(unknown)", why: "not a registered label pair, or that row is gone" });
      continue;
    }
    if (row.state === "current" || row.state === "stale") {
      refused.push({ where, group: row.group, why: `it already has live Thai (${row.state})` });
      continue;
    }
    if (row.state === "as_typed") {
      refused.push({ where, group: row.group, why: "shown as typed on purpose: a blank Thai is the answer here" });
      continue;
    }
    let text;
    try {
      text = checkOutput(row.en, cleanOutput(d.text_th), { to: "th", tier: "machine" });
    } catch (e) {
      // checkOutput's wording speaks of "the model" because the engine seam is where it comes from;
      // the prefix says so, since the Thai in the file may equally have been typed by a person.
      refused.push({ where, group: row.group, why: `checkOutput: ${e.message}` });
      continue;
    }
    ready.push({ ...row, text, replacing: row.state === "proposed" });
  }
  return { ready, refused };
}

async function land(ready, token) {
  const authed = createClient(url, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { authorization: `Bearer ${token}` } },
  });
  const landed = [];
  const refused = [];
  for (const r of ready) {
    const { data, error } = await authed.rpc("propose_label_th", {
      p_table: r.table,
      p_row_id: r.row_id,
      p_column: r.column,
      p_text: r.text,
    });
    const where = `${r.table}.${r.column} ${r.row_id}`;
    if (error) refused.push({ where, group: r.group, why: `${error.code ?? "?"} ${error.message}` });
    else if (data === false) refused.push({ where, group: r.group, why: "propose_label_th says that row does not exist" });
    else landed.push(r);
  }
  return { landed, refused };
}

const perGroup = (list) => {
  const counts = new Map();
  for (const x of list) counts.set(x.group, (counts.get(x.group) ?? 0) + 1);
  return [...counts].sort(([a], [b]) => a.localeCompare(b));
};

// ---------------------------------------------------------------------------

async function run() {
  let code = 0;
  console.log(`${envName} (${projectRef(env)})\n`);
  const rows = await survey();
  report(rows);

  if (outFile) {
    const wanted = rows
      .filter((r) => r.state === "missing")
      .map((r) => ({ table: r.table, row_id: r.row_id, column: r.column, group: r.group, en: r.en, text_th: "" }));
    writeFileSync(outFile, `${JSON.stringify({ env: envName, taken: new Date().toISOString(), labels: wanted }, null, 2)}\n`);
    console.log(`\n${wanted.length} label(s) with no Thai written to ${outFile}. Fill in each text_th, then --drafts it back.`);
  }

  if (draftsFile) {
    const { ready, refused } = readDrafts(draftsFile, rows);
    console.log(`\n${draftsFile}: ${ready.length} ready, ${refused.length} refused.`);
    for (const [group, n] of perGroup(ready)) console.log(`   ready ${group}: ${n}`);
    for (const r of refused) console.log(`   REFUSED ${r.where} (${r.group}): ${r.why}`);
    if (refused.length) code = 1;

    if (!apply) {
      console.log(`\nDry run: nothing written. Add --apply (and a session) to propose these ${ready.length} as drafts.`);
    } else if (ready.length) {
      const session = devLogin ? await devSession() : await loginSession();
      try {
        const result = await land(ready, session.token);
        console.log(`\nProposed ${result.landed.length} draft(s); ${result.refused.length} refused.`);
        for (const [group, n] of perGroup(result.landed)) console.log(`   drafted ${group}: ${n}`);
        for (const r of result.refused) console.log(`   REFUSED ${r.where} (${r.group}): ${r.why}`);
        if (result.refused.length) code = 1;
        if (result.landed.length) {
          console.log(`\n${result.landed.length} draft(s) now wait on Management → Translations. Nothing was published.`);
        } else {
          console.log("\nNothing landed: no draft was written. Nothing was published.");
        }
      } finally {
        await session.remove();
      }
    }
  }
  return code;
}

let code = 0;
if (problem) code = usage(problem);
else {
  try {
    code = await run();
  } catch (e) {
    console.error(`could not run — ${e.message}`);
    code = 2;
  }
}
await exitWith(code);
