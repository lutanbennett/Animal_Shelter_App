#!/usr/bin/env node
// exit-ok: no handles open; reads one file
/**
 * Who is each open backlog item waiting on? (#bkwai)
 *   node scripts/backlog-waiting.mjs --who lutan      his list (state lutan, or decision by:lutan)
 *   node scripts/backlog-waiting.mjs --who director
 *   node scripts/backlog-waiting.mjs --state buildable
 *   node scripts/backlog-waiting.mjs                  everything, grouped by state
 *   node scripts/backlog-waiting.mjs --stale 14       lutan/director items not re-measured for N days
 * --stale WARNS and exits 0: an item may rightly wait on a person for months.
 */
import { readFileSync } from "node:fs";
import { parseTag, openItems } from "./lib/backlog-waiting.mjs";

const args = process.argv.slice(2);
const opt = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
const who = opt("--who"), state = opt("--state"), stale = opt("--stale");
const names = JSON.parse(readFileSync("docs/backlog-names.json", "utf8"));
const rows = openItems(readFileSync("docs/backlog.md", "utf8")).map((it) => {
  const t = parseTag(it.line) || {};
  const ofWho = t.state === "decision" ? t.by : t.state;
  return { id: it.id, name: names[it.id] || "(unnamed)", state: t.state || "UNTAGGED", by: t.by, since: t.since, date: t.date, ofWho };
});
const label = (r) => `${r.state}${r.by ? ` by ${r.by}` : ""}`;
const show = (r) => `  #${r.id}  ${r.name}  [${label(r)}, since ${r.since}${r.date ? `, date ${r.date}` : ""}]`;
const today = new Date();

if (stale) {
  const days = Number(stale);
  const old = rows.filter((r) => ["lutan", "director"].includes(r.ofWho) && r.since && (today - new Date(r.since)) / 864e5 > days);
  console.log(`${old.length} lutan/director item(s) not re-measured for more than ${days} days (warning only):`);
  old.forEach((r) => console.log(show(r)));
  process.exit(0);
}
let pick = rows;
if (who) pick = rows.filter((r) => r.ofWho === who);
else if (state) pick = rows.filter((r) => r.state === state);
if (who || state) {
  console.log(`${pick.length} open item(s)${who ? ` waiting on ${who}` : ` in state ${state}`}:`);
  pick.forEach((r) => console.log(show(r)));
} else {
  for (const s of [...new Set(rows.map((r) => r.state))]) {
    const g = rows.filter((r) => r.state === s);
    console.log(`${s} (${g.length})`);
    g.forEach((r) => console.log(show(r)));
  }
}
