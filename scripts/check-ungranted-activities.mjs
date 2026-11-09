// The mirror of role-cards-coverage: is there an activity that NO card grants? Such an activity is drawn for Admin only
// (the perms.isAdmin short-circuit in can.ts), so no one else can reach it and no one-card login can test it.
// Grants are resolved the way the app does (bundleOfCards over every card, includes followed, job cards included),
// never by grepping cards.ts: maintenance.photos has no literal in cards.ts and is granted through jobs.ts.
// A deliberate Admin-only activity is a dated record in docs/ungranted-activities-allowlist.json. Admin is not a finding.
// The verdict is scripts/lib/ungranted-allowlist.mjs, shared with the live-database check `activities-grantable`
// (node scripts/check-production.mjs activities-grantable), so the two answer the same question the same way.
//
//   node scripts/check-ungranted-activities.mjs
//   (for the activity split, #i7qkz: run this and confirm social.library is not listed)
import { loadCards } from "./lib/load-cards.mjs";
import { compareToAllowlist } from "./lib/ungranted-allowlist.mjs";
import { exitWith } from "./lib/exit.mjs";

const { CARD_KEYS, ACTIVITIES, bundleOfCards } = await loadCards();
const granted = bundleOfCards(CARD_KEYS); // activity -> highest level any card gives

const gaps = [];
for (const a of ACTIVITIES) {
  const have = granted.get(a.key); // undefined | "read" | "edit"
  const levels = a.kind === "yesno" ? ["edit"] : ["read", "edit"];
  for (const lvl of levels) {
    const ok = lvl === "read" ? have !== undefined : have === "edit";
    if (!ok) gaps.push(`${a.key}@${lvl}`);
  }
}

const v = compareToAllowlist(gaps, ACTIVITIES.map((a) => a.key));
for (const l of v.unruled) console.log(`UNRULED ${l}`);
for (const l of v.fails) console.log(`FAIL ${l}`);
if (!v.fails.length) console.log(`ok   no new gap: ${v.summary} (listed above, for the planner); ${CARD_KEYS.length} cards`);
await exitWith(v.fails.length ? 1 : 0);
