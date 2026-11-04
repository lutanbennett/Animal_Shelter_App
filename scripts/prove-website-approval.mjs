/**
 * Proves the split 0315_website_approval.sql makes: proposing a website change is not publishing one.
 *
 *   node scripts/prove-website-approval.mjs      # test (dev) project
 *
 *   1  a login holding ONLY propose_website can propose a draft, and the live page is unchanged
 *   2  that login cannot approve or discard it (42501)
 *   3  a login holding NO card cannot propose, and cannot read the drafts
 *   4  a login holding ONLY approve_website sees the draft, approves it, and the live page now has it
 * The page's title is restored and every login and role is deleted in the finally block.
 */
import { randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { exitWith } from "./lib/exit.mjs";
import { loadEnv, parseEnvArg } from "./lib/env.mjs";
import { giveCards } from "./lib/user-role.mjs";

const { name: envName } = parseEnvArg(process.argv.slice(2));
const env = loadEnv(envName);
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const service = createClient(url, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
let failed = 0;
const pass = (n, m) => console.log(`ok   ${n}  ${m}`);
const fail = (n, m) => { failed++; console.log(`FAIL ${n}  ${m}`); };
const refused = (n, what, error) => (error && error.code === "42501" ? pass(n, `${what} is refused with 42501`) : fail(n, `${what}: ${error ? error.code + " " + error.message : "ALLOWED"}`));

async function loginHolding(cards) {
  const email = `prove-website-approval-${randomBytes(4).toString("hex")}@example.invalid`;
  const password = randomBytes(24).toString("base64url");
  const { data: made, error } = await service.auth.admin.createUser({ email, password, email_confirm: true });
  if (error) throw new Error(error.message);
  const { error: cardError, cleanup } = cards.length ? await giveCards(service, made.user.id, cards) : { cleanup: async () => {} };
  const remove = async () => { await service.auth.admin.deleteUser(made.user.id); await cleanup(); };
  if (cardError) { await remove(); throw new Error(cardError.message); }
  const anon = createClient(url, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false } });
  const { data: signed, error: signError } = await anon.auth.signInWithPassword({ email, password });
  if (signError) { await remove(); throw new Error(signError.message); }
  const client = createClient(url, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false }, global: { headers: { authorization: `Bearer ${signed.session.access_token}` } } });
  return { client, remove };
}

const { data: page } = await service.from("site_pages").select("slug,title").limit(1).single();
if (!page) { console.log("no site_pages row to prove against"); await exitWith(2); }
const marker = `${page.title} (0315 proof ${randomBytes(2).toString("hex")})`;
const who = [];
try {
  const proposer = await loginHolding(["propose_website"]); who.push(proposer);
  const nobody = await loginHolding([]); who.push(nobody);
  const approver = await loginHolding(["approve_website"]); who.push(approver);

  const { data: id, error: pErr } = await proposer.client.rpc("propose_website_draft", { p_target: "site_pages", p_row_key: page.slug, p_patch: { title: marker } });
  const { data: live } = await service.from("site_pages").select("title").eq("slug", page.slug).single();
  if (pErr || !id) fail(1, `propose failed: ${pErr?.message}`);
  else if (live.title !== page.title) fail(1, "the live page changed on a proposal");
  else pass(1, "propose_website alone drafts, and the live page is unchanged");

  refused(2, "approve_website_draft for a propose-only login", (await proposer.client.rpc("approve_website_draft", { p_id: id })).error);
  refused("2b", "discard_website_draft for a propose-only login", (await proposer.client.rpc("discard_website_draft", { p_id: id })).error);

  refused(3, "propose_website_draft for a no-card login", (await nobody.client.rpc("propose_website_draft", { p_target: "site_pages", p_row_key: page.slug, p_patch: { title: "x" } })).error);
  const { data: seen } = await nobody.client.from("website_drafts").select("id");
  seen?.length ? fail("3b", "a no-card login can read drafts") : pass("3b", "a no-card login reads no drafts");

  const { data: visible } = await approver.client.from("website_drafts").select("id");
  const { data: ok, error: aErr } = await approver.client.rpc("approve_website_draft", { p_id: id });
  const { data: after } = await service.from("site_pages").select("title").eq("slug", page.slug).single();
  if (!visible?.some((d) => d.id === id)) fail(4, "approver cannot see the draft");
  else if (aErr || ok !== true || after.title !== marker) fail(4, `approve did not publish: ${aErr?.message} ${after?.title}`);
  else pass(4, "approve_website alone sees the draft and publishing it changes the live page");
} catch (e) {
  fail("setup", e.message);
} finally {
  await service.from("site_pages").update({ title: page.title }).eq("slug", page.slug);
  await service.from("website_drafts").delete().eq("row_key", page.slug);
  for (const w of who) await w.remove();
}
console.log(failed ? `${failed} FAILED` : "all passed");
await exitWith(failed ? 1 : 0);
