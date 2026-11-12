# All fourteen ungranted activities ruled — 2026-11-12

Lutan ruled the fourteen activities that no card grants, one at a time, in the dedicated session he
asked for on 2026-11-09 (*"I think for these we need a dedicated session to go through each one
individually."*). Backlog `#c4vn7`; the evidence behind each question is
`docs/unruled-activities-walkthrough.md`, one sheet per activity.

**This PR records nine of the fourteen and nothing else.** The other five are ruled too, but applying
them needs a migration — see *What is deliberately not in this PR*.

## The shape of his answers, which is the thing worth knowing

**He answered Admin-only to nine of the fourteen, including every outward-facing one**, and the single
card he granted is a read-only report. Put plainly: when a decision was *"could the public end up
seeing this?"* he kept it with Admin every time; when it was *"is this just reading figures someone
already sees?"* he gave it a card.

| Ruling | Count | Activities |
|---|---|---|
| Admin-only on purpose | **9** | `appeal.medical_photo`, `projects.photos`, `projects.publish`, `reports.cashflow`, `stock.diets`, `stock.medications` (all 2026-11-12) · `photos.resident_publish`, `stock.correct`, `system.status` (2026-11-09) |
| Nothing behind it; remove the unused edit setting | **4** | `photos.resident_medical`, `reports.expenses`, `resident.who_and_where`, `roles.view` |
| A card | **1** | `stock.usage` → the existing `food_forecast` and `medicine_forecast` cards |

**Four of the six ruled on 2026-11-12 needed no build at all** — `projects.publish`,
`reports.cashflow`, `stock.diets` and `stock.medications` are already Admin-only in practice, so the
ruling records the current behaviour rather than changing it.

## Why three of them were asked on 2026-11-09 and still showed as unruled today

**Because a ruling that is given and not written into the allow-list does not exist.** His answers on
`photos.resident_publish`, `stock.correct` and `system.status` were recorded only in the text of
backlog item `#av8rq`. Three days later `activities-grantable` still printed all three as UNRULED, the
planner handover said they were settled, and the two disagreed — which is exactly the *"false block is
silent"* fault `CLAUDE.md` describes under *Answering a decision on a backlog item*.

**Two things in this PR exist to stop it recurring:**

1. The nine are in `adminOnlyOnPurpose` with his words quoted, dated to **when he said them**
   (2026-11-09 for three, 2026-11-12 for six) rather than to when they were filed.
2. **`scripts/lib/ungranted-allowlist.mjs` no longer says "no ruling yet" about a decision already
   given.** A `foundNotRuled` record carrying `ruled` and `by` now prints
   `RULED <date> by <who>, waiting on the build — do not re-ask`. The record **stays** in
   `foundNotRuled`, because the gap is real until the build lands; what changes is that the check
   stops inviting the question a fourth time.

## Two findings from the sheets, and what happened to each

**The count box on Diets and Medications: a mismatch his ruling made MOOT, not fixed.** Both pages
draw the stock count box for anyone holding the list's **edit**, while the database demands
`stock.correct`, which he ruled Admin-only. A card carrying either list's edit would therefore have
shown a box the database refused every time — a breach of his own rule that a control is drawn only
when the login's cards allow the action. **Because he ruled `stock.diets` and `stock.medications`
Admin-only as well, only Admin ever sees that box and only Admin can correct a count, so nothing is
offered and then refused today.** Recorded on both allow-list entries as moot rather than fixed: **it
returns the day either list's edit goes onto a card**, and whoever makes that change owns it.

**Controls hidden silently: found, not fixed, and not this PR's work.** Several of these controls are
correctly hidden but with no explanation. A login holding `project_folders` opens a folder, sees the
photos, and is given no Add button and no bin icon and no message. The stock pages open read-only the
same way. Hiding is right (`CLAUDE.md`: *a button is shown only if the login's cards let it do that
action*); saying nothing is a courtesy gap. **The appeal photo chooser is the model that does it
properly** — it draws the tickbox disabled and says *"You can see these photos but only someone
allowed to show medical photos can choose them."* Noted on the `projects.photos` and
`appeal.medical_photo` records for whoever picks it up.

## What `appeal.medical_photo` settles

Migration `0216` wrote that the activity is *"narrower than `appeal.run`. Editing an appeal and
publishing a wound photo are different powers."* His earlier remark had leaned towards folding it into
the manage-appeal card, which would have contradicted that. **Asked directly, with both options and
the tension named, he chose Admin-only** — stricter than either, and consistent with `0216`'s intent.
That conflict is closed.

## What is deliberately not in this PR

**The other five rulings, because they need a migration and another branch already carries one.** The
repo allows only one in-flight branch to carry a migration at a time, and on 2026-11-12
`claude/refusal-keys-group-7` held one. So:

- **`stock.usage` → a card grant.** `src/lib/permissions/cards.ts` (both forecast bundles) plus a
  `card_grants` migration, since grants live in the database as well as in code.
- **Four edit levels removed from the catalogue.** `src/lib/permissions/catalogue.ts` plus a
  `permission_activities` migration.

**A trap for whoever builds those:** `compareToAllowlist` **fails on a record whose gap is gone**. So
`stock.usage` must be **deleted from the allow-list in the same change that grants it**, and each of
the four must be deleted in the same change that removes its level. Moving any of them to
`adminOnlyOnPurpose` would be wrong — they are not Admin-only rulings.

## Measured

`node scripts/check-ungranted-activities.mjs` — exit **0**:
`85 catalogue activities; 14 Admin-only on purpose, 5 UNRULED; 56 cards`, with all five UNRULED lines
now reading `RULED 2026-11-12 by Lutan, waiting on the build`. Before this PR: 5 Admin-only on
purpose, 14 UNRULED.

**Not measured on production.** This PR changes no grant and no card, so the live card tables are
untouched; `activities-grantable` on production reads the same allow-list and will report the same 14
and 5 without any database change.

## Analysis is by card here, as the rule requires

No ruling above names a role, and none depends on who holds a card today. Each answers *"may this
activity be reached by a card at all, or only by Admin?"*, which stays true when the card assignments
are rebuilt. The one place roles would have come in — who currently holds `project_folders` or the
forecast cards — is irrelevant to the question and is not recorded.
