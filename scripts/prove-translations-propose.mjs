#!/usr/bin/env node
/**
 * Proves the split 0296_translations_propose_activity.sql makes: proposing a Thai label and approving one
 * are two grants, and a caller that holds only the proposing one cannot publish.
 *
 *   node scripts/prove-translations-propose.mjs            # test (dev) project
 *
 * WHY A SECOND PROOF SCRIPT AND NOT MORE OF prove-label-drafts.mjs. That one runs every claim through the
 * Management API inside one `begin … rollback`, which runs as the DATABASE OWNER and sets auth.uid() with
 * request.jwt.claims. Its own header says what that cannot prove: the SQL role is never switched, so the
 * grants are read from the catalogue rather than exercised. The whole point of 0296 is a GRANT, so reading
 * it from the catalogue would be proving the thing by assuming it. This script therefore does the opposite:
 * real logins, real signInWithPassword sessions, real PostgREST calls as `authenticated`, and the refusals
 * are the ones a caller would actually get.
 *
 * WHAT IT PROVES, each as a live call rather than a statement about the schema:
 *   1  a login holding ONLY the propose_translations card can call propose_label_th and a draft appears
 *   2  the same login is refused approve_label_th with 42501 - it cannot publish its own proposal
 *   3  the same login is refused discard_label_draft with 42501 - rejecting is the reviewer's act
 *   4  a login holding the translations card can still propose, so 0296 is no regression for today's holders
 *   5  that login can discard, so the reviewer's side of the split is intact
 *   6  the service key, holding no session, is STILL refused propose_label_th with 42501 - re-measured against
 *      the new gate, because that refusal is the reason the design question in
 *      docs/decisions/2026-11-01-translations-propose-schema.md was asked at all
 *
 * WHAT IT DOES NOT DO: it never approves anything, so no Thai is published to a dev row and no live value
 * moves. It writes exactly one draft and discards it again, and both throwaway logins and their throwaway
 * roles are deleted in the finally block whatever happens. It has only run against dev: a worktree cannot
 * read production.
 */
import { randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { exitWith } from "./lib/exit.mjs";
import { loadEnv, parseEnvArg } from "./lib/env.mjs";
import { giveCards } from "./lib/user-role.mjs";

const { name: envName } = parseEnvArg(process.argv.slice(2));
const env = loadEnv(envName);
const url = env.NEXT_PUBLIC_SUPABASE_URL;
if (!url || !env.SUPABASE_SERVICE_ROLE_KEY || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.error("NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_ANON_KEY are required.");
  await exitWith(2);
}
const service = createClient(url, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

let failed = 0;
const pass = (n, m) => console.log(`ok   ${n}  ${m}`);
const fail = (n, m) => {
  failed++;
  console.log(`FAIL ${n}  ${m}`);
};
/** A refusal we want: the gate said no, with the code it promises. */
const refused = (n, what, error) => {
  if (!error) return fail(n, `${what} was ALLOWED, and it must not be`);
  if (error.code !== "42501") return fail(n, `${what} was refused with ${error.code ?? "no code"}: ${error.message}`);
  pass(n, `${what} is refused with 42501`);
};

/** A disposable login holding exactly these cards, with its own throwaway role. Deleted by remove(). */
async function loginHolding(cards) {
  const email = `prove-translations-propose-${randomBytes(4).toString("hex")}@example.invalid`;
  const password = randomBytes(24).toString("base64url");
  const { data: made, error } = await service.auth.admin.createUser({ email, password, email_confirm: true });
  if (error) throw new Error(`could not make a login: ${error.message}`);
  const { error: cardError, cleanup } = await giveCards(service, made.user.id, cards);
  const remove = async () => {
    const { error: delError } = await service.auth.admin.deleteUser(made.user.id);
    if (delError) console.error(`  could not delete ${email}: ${delError.message}`);
    await cleanup();
  };
  if (cardError) {
    await remove();
    throw new Error(`could not give ${cards.join(", ")}: ${cardError.message}`);
  }
  const anon = createClient(url, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false } });
  const { data: signed, error: signError } = await anon.auth.signInWithPassword({ email, password });
  if (signError) {
    await remove();
    throw new Error(`could not sign ${email} in: ${signError.message}`);
  }
  const client = createClient(url, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: { persistSession: false },
    global: { headers: { authorization: `Bearer ${signed.session.access_token}` } },
  });
  return { client, remove, email };
}

/** A real registered label pair with a real row behind it, so nothing below is proved against an invented id. */
async function aRealLabel() {
  const { data: pairs, error } = await service
    .from("translatable_labels")
    .select("table_name,column_name,th_column")
    .order("table_name");
  if (error) throw new Error(`could not read translatable_labels: ${error.message}`);
  for (const p of pairs) {
    const { data: rows } = await service.from(p.table_name).select("id").limit(1);
    if (rows?.length) return { ...p, row_id: String(rows[0].id) };
  }
  throw new Error("no registered label has a row behind it in this database, so nothing can be proposed against");
}

const label = await aRealLabel();
const where = { p_table: label.table_name, p_row_id: label.row_id, p_column: label.column_name };
const proposal = `พิสูจน์ 0296 ${randomBytes(3).toString("hex")}`;
console.log(`proving against ${label.table_name}.${label.column_name} row ${label.row_id}`);

const proposer = await loginHolding(["propose_translations"]);
let reviewer = null;
try {
  // -------------------------------------------------------------- 1, 2, 3: the proposing card alone
  const { data: wrote, error: proposeErr } = await proposer.client.rpc("propose_label_th", { ...where, p_text: proposal });
  if (proposeErr) fail(1, `the propose_translations card could not propose: ${proposeErr.code} ${proposeErr.message}`);
  else if (wrote !== true) fail(1, `propose_label_th returned ${JSON.stringify(wrote)} rather than true`);
  else {
    const { data: draft } = await service
      .from("label_drafts")
      .select("text_th,proposed_by")
      .match({ table_name: label.table_name, row_id: label.row_id, column_name: label.column_name })
      .maybeSingle();
    if (draft?.text_th === proposal) pass(1, "the propose_translations card alone proposes, and the draft is there");
    else fail(1, `the draft does not hold what was proposed: ${JSON.stringify(draft)}`);
  }

  const { error: approveErr } = await proposer.client.rpc("approve_label_th", where);
  refused(2, "approve_label_th for a propose-only login", approveErr);

  const { error: discardErr } = await proposer.client.rpc("discard_label_draft", where);
  refused(3, "discard_label_draft for a propose-only login", discardErr);

  // -------------------------------------------------------------- 6: the service key, still shut out
  const { error: serviceErr } = await service.rpc("propose_label_th", { ...where, p_text: proposal });
  refused(6, "propose_label_th for the service key with no session", serviceErr);

  // -------------------------------------------------------------- 4, 5: today's card is no worse off
  reviewer = await loginHolding(["translations"]);
  const { data: reWrote, error: reProposeErr } = await reviewer.client.rpc("propose_label_th", {
    ...where,
    p_text: proposal,
  });
  if (reProposeErr) fail(4, `the translations card can no longer propose: ${reProposeErr.code} ${reProposeErr.message}`);
  else if (reWrote !== true) fail(4, `propose_label_th returned ${JSON.stringify(reWrote)} rather than true`);
  else pass(4, "the translations card still proposes, so 0296 is no regression for its holders");

  const { data: threwAway, error: reDiscardErr } = await reviewer.client.rpc("discard_label_draft", where);
  if (reDiscardErr) fail(5, `the translations card could not discard: ${reDiscardErr.code} ${reDiscardErr.message}`);
  else if (threwAway !== true) fail(5, `discard_label_draft returned ${JSON.stringify(threwAway)} rather than true`);
  else pass(5, "the translations card discards, so the reviewer's side of the split is intact");
} finally {
  // Whatever happened above, the one draft this script can have left goes, then both logins and their roles.
  await service
    .from("label_drafts")
    .delete()
    .match({ table_name: label.table_name, row_id: label.row_id, column_name: label.column_name });
  await proposer.remove();
  if (reviewer) await reviewer.remove();
}

const { data: left } = await service
  .from("label_drafts")
  .select("table_name")
  .match({ table_name: label.table_name, row_id: label.row_id, column_name: label.column_name });
if (left?.length) fail(0, "a draft was left behind by this script");

console.log(
  failed
    ? `\n${failed} proof(s) failed.`
    : "\ntranslations.propose proofs: all passed, nothing kept and nothing published.",
);
await exitWith(failed ? 1 : 0);
