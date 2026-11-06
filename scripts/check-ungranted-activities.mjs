// The mirror of role-cards-coverage: is there an activity that NO card grants? Such an activity is drawn for Admin only
// (the perms.isAdmin short-circuit in can.ts), so no one else can reach it and no one-card login can test it.
// Grants are resolved the way the app does (bundleOfCards over every card, includes followed, job cards included),
// never by grepping cards.ts: maintenance.photos has no literal in cards.ts and is granted through jobs.ts.
// A deliberate Admin-only activity is a dated record in docs/ungranted-activities-allowlist.json. Admin is not a finding.
//
//   node scripts/check-ungranted-activities.mjs
//   (for the activity split, #i7qkz: run this and confirm social.library is not listed)
import { readFileSync } from "node:fs";
import { loadCards } from "./lib/load-cards.mjs";
import { exitWith } from "./lib/exit.mjs";

const { CARDS, CARD_KEYS, ACTIVITIES, bundleOfCards } = await loadCards();
const granted = bundleOfCards(CARD_KEYS); // activity -> highest level any card gives
const file = JSON.parse(readFileSync("docs/ungranted-activities-allowlist.json", "utf8"));
const allow = file.adminOnlyOnPurpose;
const unruled = file.foundNotRuled ?? [];

let failed = 0;
const fail = (m) => { failed++; console.log(`FAIL ${m}`); };
const allowed = new Set(allow.map((r) => `${r.activity}@${r.level}`));
const pending = new Set(unruled.map((r) => `${r.activity}@${r.level}`));
const known = new Set(ACTIVITIES.map((a) => a.key));
const seen = new Set();

for (const a of ACTIVITIES) {
  const have = granted.get(a.key); // undefined | "read" | "edit"
  const levels = a.kind === "yesno" ? ["edit"] : ["read", "edit"];
  for (const lvl of levels) {
    const ok = lvl === "read" ? have !== undefined : have === "edit";
    const id = `${a.key}@${lvl}`;
    if (ok) continue;
    seen.add(id);
    if (pending.has(id)) console.log(`UNRULED ${a.key} at ${lvl}: no card grants it, no ruling yet`);
    else if (!allowed.has(id)) fail(`${a.key} at ${lvl} is granted by no card (Admin only) and is not on the allow-list`);
  }
}
for (const r of [...allow, ...unruled]) {
  if (!(r.reason || r.note) || !/^\d{4}-\d{2}-\d{2}$/.test(r.ruled || r.found || "")) fail(`allow-list record ${r.activity} needs a reason and a date`);
  if (!known.has(r.activity)) fail(`allow-list names ${r.activity}, which is not in the catalogue: delete the record`);
  else if (!seen.has(`${r.activity}@${r.level}`)) fail(`allow-list names ${r.activity} at ${r.level}, which a card now grants: delete the record`);
}
if (!failed) console.log(`ok   no new gap: ${ACTIVITIES.length} catalogue activities, ${CARD_KEYS.length} cards; ${allow.length} Admin-only on purpose, ${unruled.length} UNRULED (listed above, for the planner)`);
await exitWith(failed ? 1 : 0);
