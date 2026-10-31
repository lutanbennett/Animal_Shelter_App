# Feature test plan

## Header

| | |
|---|---|
| Feature | Thai labels, schema half: register the eleven unlisted labels, and give a label a draft that waits for approval |
| Backlog item | `docs/backlog.md` → `## Management` → *the twelve Thai columns Translations cannot see* and *a translated LABEL goes live the instant it is typed* (both schema halves struck, app halves left open) |
| Branch / worktree | `claude/translations-labels-schema` @ `C:\Development\Animal_Shelter_translations-labels-schema` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3007` |
| PR | opened from this branch after this commit |
| Tested by / date | Claude (Opus 5) / 2026-10-31 |
| Carries a migration? | yes — `0293_label_drafts_and_unlisted_labels.sql` and `0294_propose_label_th_checks_the_row.sql` |
| Tested at SHA | `2cf9037b` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs)
- [x] Roles affected identified: admin / staff / doctor / volunteer / resident / signed-out public
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised

One sentence: eleven `_th` columns the Translations screen could not see are registered in
`translatable_labels`, and a Thai label can now be proposed into a new `label_drafts` table and wait there
until somebody approves it, instead of going live the instant it is typed.

Files touched: `supabase/migrations/0293_label_drafts_and_unlisted_labels.sql`,
`supabase/migrations/0294_propose_label_th_checks_the_row.sql`, `scripts/prove-label-drafts.mjs`,
`scripts/lib/readonly-checks.mjs` (eleven `UNION` arms, a declared crossing),
`docs/decisions/2026-10-31-label-drafts-and-unlisted-labels.md`, `docs/backlog.md`, this plan.
**No `src/` file and no `worker/` file.**

Who is affected, **by card and not by role** (`CLAUDE.md`: roles are a transient grouping): any login
holding **`translations.view`** or **`translations.manage`** sees eleven more labels on Management →
Translations the moment this is applied. Nobody else sees anything at all, because nothing outside that
screen reads `translatable_labels` and no `_th` column changed value. Admin sits outside the card system and
is unaffected.

Out of scope, deliberately: the whole app half (the Propose / Approve / Reject controls, the group
headings, the `proposed` status in `LabelStatus`), the `translations.propose` activity and its card,
translating the wording itself, the appeals `proseGroup()` heading, and the `fixed_outgoings.label` arm.
All of it is named in the decision file's last section.

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Paste its closing `gates:` lines below exactly as printed. They are the evidence, and running the script again regenerates them
- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit

```
=== gates: typecheck exited 0 after 86s
=== gates: lint exited 0 after 198s
=== gates: test exited 0 after 23s
=== gates: build exited 0 after 270s

gates: typecheck=0 lint=0 test=0 build=0
```

## 3. Schema and data

- [x] Migration number is one above the highest on `main`, and no other in-flight branch carries one
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations`
- [x] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`)
- [x] Existing rows still read correctly after the change (checked against real dev data)
- [x] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness
- [x] Down-migration written, or the reason one is not needed is stated
- [x] Production apply plan stated for the release manager (which file, which project, when)

**`--status`** showed `293 applied, 1 pending` with nothing missing in either direction against
`origin/main 53066ebf`.

**The first `--dry-run` refused the file** — `check constraint "translatable_labels_label_group_check" of
relation "translatable_labels" is violated by some row` — because the new allow-list was written from
`0166`'s nine groups and `0209` had added a tenth, `residents`. That is the dry-run doing its job against
real rows. Re-run clean, then applied.

**What the harness asserts** (`node scripts/prove-label-drafts.mjs`, fourteen numbered proofs, one
`begin … rollback`): that the eleven newly registered labels are in `translatable_labels` with the group
and `optional` flag the file states; that **all eleven are reported by `label_translations()`** once their
English is filled in; that `rounds` is still not registered; that **a proposed label is not the live Thai**
— the row's `_th` column is untouched and the screen reads `proposed`; that **approving publishes it**,
clears the draft and reads `current`; that `approve_label_th()` takes no text, so an approval cannot publish
something nobody reviewed; that approving nothing is refused; that a second proposal replaces the first
rather than queueing; that an empty proposal and `discard_label_draft()` both throw the proposal away and
leave the row alone; that an unregistered label is refused by both paths and a proposal for a missing row
writes nothing; that Thai published by `set_label_th()` or by a direct edit clears the spent draft; that
deleting the row takes its draft; that a proposal on a label which already has Thai leaves the live value
and status alone; and that `label_drafts` is closed (RLS on, exactly one policy and it resolves through
`has_permission()`, no insert/update/delete for `authenticated`, nothing for `anon`, the three functions
executable by `authenticated` and not by `anon`).

**The harness was verified to be capable of failing**: proof 4's assertion was inverted once and reported
`4 FAILED: proposing wrote <NULL> onto the row. A proposal must never publish.`

**It found one real defect** (D1 below), which is why there are two migration files.

**Nothing was kept**, checked afterwards rather than assumed: `label_drafts` holds 0 rows on dev and no
`PROOF` row survives in `diets`, `units`, `features`, `role_groups`, `memes` or `site_content`.

**Existing rows still read correctly:** `node scripts/check-production.mjs translations-open --env test`
runs clean and reports *"Every registered label pair is counted"* — 382 missing labels against 84 before.
The 298 new ones were reconciled row by row: `units.name` 280, `features.name` 13, `diets.name` 4,
`site_content` 1, `role_groups.name` 0, and `memes` 2 as *shown as typed*. **The 280 is dev rubbish, not a
real backlog** — the untranslated `units` rows are named `drill-mvsct7k9-84`, `drill-probe-1793205653` and
so on, written by the 2026-10-28 Pi failover drills; exactly one real untranslated unit exists on dev
(`pouch`), because `0252` shipped Thai with its seed.

**No down-migration, and the reason:** everything is additive — one new table, two new `label_group` values
in a widened allow-list, eleven registry rows, three new functions, and one existing function gaining four
columns and a status value. Nothing is dropped or rewritten, and no `_th` column changes value. Backing it
out would mean deleting rows a person may by then have proposed, which is a worse outcome than leaving
inert schema in place.

**Production apply plan for the release manager:** both files, `--env production`, in number order, as part
of the normal release apply, **before** the app half's release — never after. Nothing in `src/` reads the
draft columns yet, so applying these alone is safe and changes only what the Translations screen lists.
Production is behind by more than these two: run `node scripts/apply-migrations.mjs --status --env production`
first, because the runner applies every pending file.

## 4. Functional checks

- [x] Happy path works end to end
- [ ] Data persists — reload the page and the change is still there — n/a: no page. The happy path is three database functions, and its persistence is asserted in the harness instead (a proposal is read back, approved, and the row re-read)
- [x] Create / edit / delete all exercised (whichever the feature has)
- [x] Empty state renders sensibly (no rows yet)
- [x] Invalid input is rejected with a readable message, not a crash
- [x] Boundary cases checked (long text, zero, negative, missing optional fields, dates)

Happy path, end to end and in the harness: propose Thai for a diet that has none → the row's `name_th` is
still null and `label_translations()` reads `proposed` → approve → the row carries the Thai, the draft is
gone and the status reads `current`.

Create / edit / delete: `propose_label_th()` creates a draft, a second call to it edits that draft in place
(proof 8), and `discard_label_draft()`, an empty proposal, an approval and a row delete each remove one
(proofs 9, 5, 12).

Empty state: `discard_label_draft()` on a label with nothing waiting returns `false` rather than raising, so
the screen can tell a rejection from somebody else having got there first; `approve_label_th()` with nothing
waiting raises, because approving nothing is a caller fault (proofs 9, 7).

Invalid input: an unregistered label raises `not a translatable label: %.%`, a row id that does not exist
returns `false` without writing, and a login without the card is refused with
`translations.manage is required to …` (proofs 10, and the gate at the top of every function).

Boundaries: a blank and a whitespace-only proposal (`'   '`) are treated as a discard, not stored as an
empty Thai (`text_th` has a non-blank check, so there is no state where a draft says nothing); Thai
multi-byte text round-trips exactly (every proof compares the Thai it wrote); `role_groups.name_th` is
`not null`, the one registered pair that can never be empty, and proof 13 covers it. No numeric or date
field exists in this change.

### Role access matrix

- [ ] Every role above tested — n/a: nothing in this change is keyed to a role. Both gates are the cards `translations.view` and `translations.manage`, and `CLAUDE.md` requires the analysis to be by card
- [x] A role that should not have access is blocked server-side (hitting the URL directly fails)

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a | n/a | n/a: Admin sits outside the card system and is unchanged by this PR |
| management | n/a | n/a | n/a: analysis is by card, see below |
| staff | n/a | n/a | n/a: retired role (`0173`) |
| doctor | n/a | n/a | n/a: analysis is by card, see below |
| volunteer | n/a | n/a | n/a: analysis is by card, see below |
| signed out | `anon` | refused | **refused** — proof 14 reads the catalogue: `anon` holds no rights on `label_drafts` and cannot execute `propose_label_th`, `approve_label_th` or `discard_label_draft` |

**By card, which is what this change actually decides:**

| Card activity | Can do | Proved by |
|---|---|---|
| `translations.manage` | propose, approve, discard, and read | the gate at the top of all three functions; the harness signs in as a real login holding it |
| `translations.view` (or `translations.manage` at Read) | read `label_drafts` and see a proposal on the screen | the one policy on `label_drafts`, proof 14 |
| neither | nothing at all | `label_translations()` returns empty, the policy refuses the read, and the three functions raise `42501` |

**There is no server-side URL to hit**, because there is no route. The server-side refusal is the function
gate and the table policy, and both are asserted rather than observed.

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no route added, and no `src/` file is touched
- [ ] Manual updated (`src/lib/manual/en.ts`) — n/a: nothing a reader of the manual can see yet. The manual topic belongs with the app half's Propose and Approve buttons, and writing it now would describe buttons that do not exist
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: this change adds no user-facing string of its own. What it adds *to* that screen is eleven labels and they are data, not code strings. The two new group keys `home` and `social` have no words yet, which is named in the decision file as the app half's job
- [ ] Mobile viewport (375px) — n/a: no UI surface
- [ ] Browser console clean — n/a: no UI surface
- [ ] Network clean — n/a: no UI surface

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked)
- [x] Any shared file touched checked from a second, unrelated page — **by loading that page, not by reading the file**
- [x] Nothing merged from `main` during `sync` was broken by this branch

**The page nearest the change is Management → Translations**, and it is reached through
`src/lib/translations/labels.ts`, which calls `label_translations()` — the one existing function this PR
replaces. It was not driven in a browser, and the reason is written down rather than skipped: the built-in
browser pane does not hydrate a page loaded by its address (`CLAUDE.md`, 2026-10-28), a signed-in
`dev-signin` session is aal1, and **the screen cannot show anything new here until the app half lands** — on
the day this applies there are zero drafts, so no row can carry `proposed` or a draft column. What was
checked instead, which is the thing that could actually break it: the function's **old** ten columns are
unchanged in name, type and order, and the four new ones are appended, so the existing `LabelRow` mapping in
`labels.ts` reads exactly what it read before and extra JSON keys are ignored. Added to **Left for manual
verification** so a person confirms the screen still draws.

**The shared instrument touched is `scripts/lib/readonly-checks.mjs`**, and it was checked by *running* it,
not by reading it: `node scripts/check-production.mjs translations-open --env test` and
`node scripts/check-production.mjs translations-unlisted --env test` both run clean, and a second,
unrelated check from the same file (`translations-unlisted`) was run to prove the module still loads and
answers — it now reports exactly one unlisted column, `rounds.name_th`, which is the deliberate one.

`sync` reported `Already up to date`, so nothing came in from `main` to break.

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** — **deliberately NOT ticked.** Both items' schema halves are struck and each title is rewritten so it alone says what is still open (app-only), per `CLAUDE.md`'s rule that an item must read correctly without its last paragraph. Ticking either would hide an unbuilt screen
- [x] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`)
- [x] `README.md` still accurate
- [ ] **Release notes.** — n/a: a shelter user cannot notice this yet. Eleven more rows appear on Management → Translations for a login holding the translations cards, and the draft machinery has no button to press until the app half ships; the decision file records that app half as outstanding, so a note promising it works now would be the false note of 2026-10-11. The note belongs in the PR that draws the Propose and Approve buttons
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.**

Every number in the decision file was read from the database, not reasoned: the twelve unlisted columns from
`translations-unlisted`, the 84 → 382 missing-label change from `translations-open`, and the 280 `drill-*`
units from a read-only query naming them. The one place the file says *not established* is the production
label count, because a worktree cannot read production.

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: production release manager
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: production release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: production release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: nothing here derives a date. `proposed_at` and `recorded_at` are `now()` stamps that are displayed, never compared to a shelter day or a boundary
- [ ] **For a boundary or banding change, the assertions cover both edges of the band** — n/a: no threshold, band, window or cutoff is added or moved
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.**
- [ ] Public pages re-checked after a cache purge — n/a: no public page changes. No `_th` column changes value, and nothing public reads `label_drafts`

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: production release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: production release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: this change adds no secret and no environment variable

### Migration ordering

- [x] **Does this PR contain both a migration and code that reads it?** **No code that reads the NEW parts** — no `src/` file is touched. The one existing reader, `src/lib/translations/labels.ts`, is already deployed and already calls `label_translations()`, which is why both files declare it as their `-- consumer:`. So the apply is safe in either order, and the ordering that will matter is the reverse one: the app half must not deploy before these two are on production, which is a line in the app half's release note rather than a header here
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: production release manager
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — n/a: purely additive. One new table, a widened allow-list, eleven registry rows, three new functions, and one function gaining appended columns
- [x] Apply plan stated: which file, which project, and whether it runs before or after the deploy — both files, production, in number order, in the normal release apply and before the app half ships. §3 has the detail

### Rollback

- [x] Rollback position stated, **including what it does not cover.** The code rollback is `./scripts/pi/deploy-pi.sh --ref <sha>` on the Pi, and `npx wrangler rollback --env production` reverts only the Worker fallback. **Neither reverts a migration, and there is no down-migration here on purpose** (§3): the schema is purely additive and safe to leave applied, so "rollback available" is a true statement for the code and an explicit *not applicable* for the schema. What a rollback would NOT undo: the eleven registry rows, so the Translations screen would keep listing those labels even on an older build — which is harmless, because that screen reads them generically

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| D1 | medium | `propose_label_th()` in `0293` relied on `FOUND` after an `EXECUTE … INTO` to tell a real row from a missing one. `EXECUTE` does not report that reliably, so a proposal against a row id that does not exist returned `true` and wrote a draft nothing could ever show. Harmless to readers — `label_translations()` walks the real table — but the file's own comment claimed the opposite and the screen would have reported a save that referenced nothing | **fixed** in `0294_propose_label_th_checks_the_row.sql`, which asks how many rows match before writing anything. A second file rather than an edit because `0293` was already applied to dev and an applied migration is never edited. Found by proof 10 of the harness |
| D2 | low | Registering `units.name` puts 280 more untranslated labels on Management → Translations on dev. Established, not assumed: they are `drill-*` rows written by the 2026-10-28 Pi failover drills, and exactly one real untranslated unit exists (`pouch`) | **accepted** — dev-only test data, not a product fault, and the item asked for `units.name` to be registered. The production figure must be taken on production (`translations-open --env production`) before anyone judges the screen; listed under **Left for manual verification** |
| D3 | low | The two new group keys `home` and `social` have no heading words and no `GROUP_ORDER` entry, so they draw a raw key at the end of the screen — the same shape as the already-filed `appeals` heading | **deferred to the app half**, named in the decision file's last section and in the rewritten backlog title. `sortGroups()` widens rather than narrows, so the labels are reachable and usable on day one; only the heading is ugly |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | **Management → Translations still draws**, and the eleven new labels appear (six under *Website*, four under a raw `home` / `diets` / `units` heading, and the meme caption under a raw `social` heading). The function gained four columns and a status value, and although the existing ten are unchanged in name, type and order, nobody has looked at the page | `/management/translations` on dev, port 3007, as a login holding `translations.view` or `translations.manage`. Reach it by clicking through from another page, never by typing the address — the browser pane does not hydrate a direct load |
| 2 | **The production label count**, now that eleven pairs are registered, so the 280 dev `drill-*` units are not mistaken for a real translation backlog | `node scripts/check-production.mjs translations-open --env production`, run outside a worktree |
| 3 | **Whether `home` and `social` are the right headings for Lutan**, before the app half writes the words. `home` holds the section and doorway names; `social` holds a meme caption and nothing else yet | a question for Lutan, answered in the app half's brief rather than here |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (Opus 5)  Date: 2026-10-31

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: the list is not empty; its three rows wait for a person and only whoever looks may tick this

Manual verification by: pending: the three rows above — the Translations screen still drawing, the production label count, and whether `home` and `social` are the right headings

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager

Result: pass with accepted defects

Release manager acknowledgement: pending: not yet handed over — the PR is open and the release that carries `0293` and `0294` has not been cut
