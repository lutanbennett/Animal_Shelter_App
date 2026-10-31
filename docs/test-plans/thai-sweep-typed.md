# Feature test plan

## Header

| | |
|---|---|
| Feature | Thai translation sweep, half (A): sweep Management → Translations, draft the Thai, build the production read |
| Backlog item | `docs/backlog.md` → Management → **THAI TRANSLATION SWEEP ACROSS THE APP AND THE WEBSITE** (half (A) clauses only) |
| Branch / worktree | `claude/thai-sweep-typed` @ `C:\Development\Animal_Shelter_thai-sweep-typed` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3002` |
| PR | #TBD |
| Tested by / date | Claude (Opus 5) / 2026-10-31 |
| Carries a migration? | no |
| Tested at SHA | `86ae51e0` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — swept Management → Translations on dev, proposed Thai for the 72 real untranslated labels in a document on Lutan's Desktop, and added two read-only production checks so the same count can be taken on production
- [x] Files/areas touched listed — `scripts/lib/readonly-checks.mjs` (two new entries in `CHECKS`), `docs/decisions/2026-10-31-label-translations-have-no-draft.md`, `docs/backlog.md` (strike-through only), `docs/test-plans/thai-sweep-typed.md`. No route, no component, no `worker/`, no `supabase/migrations/`, no shared lib under `src/`
- [x] Roles affected identified — **none; this PR has no role surface.** The only executable change is two entries on a CLI harness nobody signs in to. TRANSIENT CONTEXT, not a finding: the screen the sweep read is opened by the **Translations card**, and the sweep was driven by a login holding exactly that card and nothing else (`node scripts/dev-signin.mjs --cards translations --port 3002`)
- [x] Anything explicitly **out of scope** written down — half (B) (`src/lib/i18n/dictionaries/th.ts`) is a later stream and was not touched; `src/app/management/translations/` belongs to `permission-prop-shorthand` this batch and was read but not changed; bringing the twelve unlisted Thai columns onto the screen is filed as its own backlog item, not built; the production count was **not run**, because a worktree cannot read production

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (`Already up to date`)
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Closing lines exactly as printed:

```
=== gates: build exited 0 after 218s

gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration; the brief forbids one
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly after the change — n/a: no schema change; the two new checks only read, inside `begin read only`
- [ ] **Constraints and defaults exercised against real rows** — n/a: no migration. The equivalent evidence for this PR is section 4: both checks were run against real dev rows and their output matched the screen group by group
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end — `node scripts/check-production.mjs translations-open --env test` exits 0 and prints **221 missing, 2 out of date (84/0 labels, 137/2 prose); 108 labels are shown as typed on purpose**, group by group
- [x] Data persists — reload the page and the change is still there — the Translations screen was re-read after the checks ran and reports the same figures; the checks write nothing, which is the point of the harness
- [ ] Create / edit / delete all exercised — n/a: both checks are read-only by construction (one `SELECT` each, wrapped in `begin read only`, no path from argv to SQL), and this PR adds no screen
- [x] Empty state renders sensibly — `translations-unlisted` prints "Every Thai column on a base table is registered on Translations." when it finds none, and `translations-open` prints "Every registered label pair is counted."; both paths read from the `render` functions and the empty-case wording is in the code
- [x] Invalid input is rejected with a readable message, not a crash — an unknown check name is refused by `check-production.mjs` with the list of valid names (exit 2); `assertSelectOnly()` rejects anything that is not one `SELECT`, and `scripts/check-production.test.mjs` runs it over every entry including the two new ones
- [x] Boundary cases checked — the `uncovered` guard is the boundary that matters: a label registered in `translatable_labels` that the check's `UNION` arms do not name is reported by name and flags the check (`failed`), rather than quietly shrinking the count. On dev it reports "Every registered label pair is counted" against all 21 registered pairs. A database behind on migrations stops with "could not run" naming the table, which is noted in the check's own comment

### Role access matrix

TRANSIENT CONTEXT, not a finding — roles are a transient grouping of cards. **This PR has no page and no UI**, so there is nothing for a role to reach. The row that matters is card-shaped: a login holding **only the Translations card** reached the screen the sweep read.

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a — no page in this PR | n/a | n/a |
| management | n/a — no page in this PR | n/a | n/a |
| staff | retired role (`0173`) | n/a | n/a |
| doctor | n/a — no page in this PR | n/a | n/a |
| volunteer | n/a — no page in this PR | n/a | n/a |
| signed out | n/a — no page in this PR | n/a | n/a |
| *card-shaped:* a login holding only `translations` | `/management/translations` by clicking through from `/management` | the screen loads and lists its groups | loaded; counts read as 221 missing, 2 out of date |

- [x] Every role above tested — read as written: there is no role surface, and the one access path this stream exercised (the Translations card alone) is recorded in the last row
- [x] A role that should not have access is blocked server-side — unchanged and re-confirmed by reading: `label_translations()` and `set_label_th()` are `security definer` and both ask `has_permission('translations.view' / '.manage')` before returning or writing anything. That is exactly why the new production check could **not** call `label_translations()` and reads the registered tables directly instead

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no new page; `NavLinks.tsx` not touched
- [ ] Manual updated (`src/lib/manual/en.ts`) — n/a: nothing a shelter user does changed; the two additions are developer checks run from a terminal
- [x] Translatable strings go through the translation path, checked at `/management/translations` — this PR *is* that check: the screen was read on dev with a Translations-card login and its figures reconciled row for row with the database
- [ ] Mobile viewport (375px) — n/a: no UI in this PR
- [x] Browser console clean — no errors or React warnings on `/management/translations` while the sweep was driven
- [x] Network clean — no 4xx or 5xx on `/management/translations`; every request returned 200. Two RSC prefetches show `net::ERR_ABORTED` against a 200, which is Next.js cancelling its own prefetch when the navigation lands, not a failure

## 6. Regression

- [x] The pages nearest the change still work — `/management`, `/management/translations` and `/my` all loaded and rendered during the sweep
- [x] Any shared file touched checked from a second, unrelated page — by loading, not reading: `scripts/lib/readonly-checks.mjs` is shared by `check-production.mjs`, so an unrelated check was run through the same file after the edit. `node scripts/check-production.mjs schema-version --env test` printed its answer and exited 0, proving the module still loads and the harness still works for entries this PR did not touch
- [x] Nothing merged from `main` during `sync` was broken by this branch — `sync` reported `Already up to date`, so nothing came in

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** — n/a: half (A) only, by the brief's instruction. The item stays open for half (B) (`th.ts`); the half (A) clauses this stream completed are struck through on this branch and the title now says what is still open
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-10-31-label-translations-have-no-draft.md`
- [x] `README.md` still accurate — read the Environments and scripts sections; neither lists individual production checks, so nothing there went out of date
- [ ] **Release notes.** — n/a: nothing a shelter user can see has changed yet, and two manual steps are still outstanding — the 72 proposed Thai labels are unread by a Thai speaker and unwritten into the system, and the production count has not been run. A note saying the Thai is fixed would be false; the note belongs in the PR that closes those steps
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and the decision file were measured, not reasoned.** Every figure in them comes from a command whose output is in this plan: 221/2 from `check-production.mjs translations-open --env test` and from the screen independently; 84/139 from the same run; 72 proposed and 12 practice rows from the generator's own count; 12 unlisted columns from `translations-unlisted`. Nothing was inferred from the backlog item's prose

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: production release manager
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: production release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: production release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: nothing in this PR derives a date; both checks are counts of present-tense state
- [ ] **For a boundary or banding change, the assertions cover both edges** — n/a: no threshold, band or cutoff changed
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.** The `gates:` block in section 2 and the counts in section 4 are copied from the runs as printed
- [ ] Public pages re-checked after a cache purge — n/a: no public page changed

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: production release manager
- [ ] `strip-baked-env: removed N env var(s)` seen — deferred: production release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: no new variable; the checks read `SUPABASE_ACCESS_TOKEN`, which `check-production.mjs` already uses

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration
- [ ] `--env production --dry-run` run and clean — n/a: no migration
- [ ] Production backup fresh — n/a: no migration, and nothing destructive
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position stated, including what it does not cover — reverting this PR removes two read-only check entries and three documents. Nothing on either database changes, because nothing was written to either: no label Thai was saved, no translation approved, no migration applied. **What it does not cover:** the two backlog items filed on the `backlog` branch and the gap list on Lutan's Desktop are outside this PR and would stay

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | medium | A translated **label** has no draft state: `set_label_th()` publishes the Thai to every screen the moment it is pressed, so Lutan's rule "drafts … never as approved" cannot be followed for the 84 label rows. Prose can hold a draft; labels cannot | deferred to backlog (`## Management`, its own item) — it is a schema plus UI change in a directory another stream holds this batch |
| 2 | medium | Twelve `_th` columns hold Thai that Management → Translations never lists, so nobody can translate them from the one screen built for it: six on `site_content`, plus `diets`, `units`, `features`, `role_groups`, `memes` and `rounds` (`rounds` is deliberate). Every one was added after `0166`, because registering a new label is a hand step nothing enforces | deferred to backlog (`## Management`, its own item), with the check that would catch the next one — `translations-unlisted`, shipped in this PR |
| 3 | low | The Translations screen files appeal rows under the raw database table name `appeals` (28 rows on dev), because `proseGroup()` in `src/lib/translations/labels.ts` has no case for them and `GROUP_ORDER` no entry | deferred to backlog (folded into the first item above) — found, not fixed |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | **Read the 72 proposed Thai labels and correct them.** They are a computer's draft, not a Thai speaker's, and none of them has been entered into the system | `C:\Users\Leidos\OneDrive\Desktop\Thai translation gaps and draft - 2026-10-31.html` — Lutan's wife reads it; approvals are then made from Lutan's login |
| 2 | **Answer the one question in the document:** should project names carry Thai Buddhist-era years (พ.ศ. 2565) or the Gregorian numbers the English uses? | same document, the orange box at the top |
| 3 | **Run the production count**, which a worktree cannot: `node scripts/check-production.mjs translations-open --env production` and `… translations-unlisted --env production`. Both are read-only | from the main checkout, outside a worktree — the planner or the release manager |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (Opus 5)  Date: 2026-10-31

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: the list is not empty, so this is not mine to tick; only the person who looks may, and the signature below says what they are waiting on

Manual verification by: pending: the 72 drafted Thai labels are unread and unapproved, and the production count has not been run

### Result

- [x] Open defects are either fixed or explicitly accepted above — all three are deferred to the backlog with items filed, and each is named in the PR
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager

Result: pass with accepted defects

Release manager acknowledgement: pending: not yet read
