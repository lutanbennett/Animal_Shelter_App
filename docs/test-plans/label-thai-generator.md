# Feature test plan

## Header

| | |
|---|---|
| Feature | A repo script that proposes Thai for an environment's missing labels as drafts, and `translations-open` taught to count those drafts |
| Backlog item | `docs/backlog.md` → `## Management` "DRAFT THAI FOR PRODUCTION'S OWN MISSING LABELS…" and `## Security` "Teach `translations-open` about label drafts" |
| Branch / worktree | `claude/label-thai-generator` @ `C:\Development\Animal_Shelter_label-thai-generator` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3005` |
| PR | #TBD |
| Tested by / date | Claude (`claude/label-thai-generator`) / 2026-11-01 |
| Carries a migration? | no |
| Tested at SHA | `a8e539e8` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — `scripts/draft-label-thai.mjs` surveys a database's registered labels, writes the ones with no Thai to a list, and lands filled-in Thai as **drafts** through `propose_label_th()`; `translations-open` now counts and shows those drafts instead of calling them missing
- [x] Files/areas touched listed — `scripts/draft-label-thai.mjs` (new), `scripts/lib/readonly-checks.mjs`, `docs/backlog.md`, `docs/decisions/2026-11-01-label-thai-drafts-by-script.md`, this plan. No `src/`, no `worker/`, no `supabase/migrations/`
- [ ] Roles affected identified — n/a: `CLAUDE.md` forbids analysis by role, so the access question was answered by card instead, and measured. `propose_label_th()` asks `has_permission('translations.manage')`, which the `translations` card carries; a caller holding no cards is refused. See the card result under section 4
- [x] Anything explicitly **out of scope** written down — the production run (this worktree has no `.env.deploy.production`, so it cannot reach production at all), any migration, and approving or publishing any label. All three are in the decision file under "Not done here"

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (`Already up to date`)
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 test=0 build=0`

```
=== gates: build exited 0 after 157s

gates: typecheck=0 lint=0 test=0 build=0
```

The `test` gate matters more than usual here: `scripts/check-production.test.mjs` runs `assertSelectOnly()` over every entry in `readonly-checks.mjs`, so it is what proves the edited `translations-open` SQL is still one read-only `select`.

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration. `0293` and `0294` give everything needed and the brief forbade one
- [ ] `--status` reviewed before applying — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly after the change — n/a: no migration. Nothing in this PR changes schema, and the one thing it writes to the database is a row in `label_drafts`, which by `0293`'s design is beside the row and not on it
- [ ] **Constraints and defaults exercised against real rows** — n/a: no migration. The equivalent evidence for a script that writes is under section 4: 13 real proposals landed on dev and the live `features.name_th` column was counted before and after to prove it was untouched
- [ ] Down-migration written — n/a: no migration
- [ ] Production apply plan stated — n/a: no migration. The production *script* run is in the backlog item and the decision file, with its two commands

## 4. Functional checks

All against the dev database (`qxkmhwybjggxvsfxsxbd`), 2026-11-01.

- [x] Happy path works end to end — survey → `--out` list → fill in `text_th` → `--drafts` dry run → `--apply --dev-login`. 13 `features.name` proposals landed, 0 refused
- [x] Data persists — re-reading afterwards, `label home` reports `0 missing, 0 out of date, 13 waiting to be approved`, and the drafts are in `label_drafts` with their Thai
- [x] Create / edit / delete all exercised — create (13 new drafts); edit (re-ran the same file and the 13 were **replaced**, not duplicated, which is `0293`'s one-draft-per-label rule); delete is `propose_label_th` with an empty text, which the script refuses before it gets there (see the next line) because discarding a draft is a person's action on the screen, not this script's job
- [x] Empty state renders sensibly — a `--drafts` file whose proposals are all refused prints `0 ready, 4 refused` and the dry-run line, and writes nothing
- [x] Invalid input is rejected with a readable message, not a crash — four deliberately bad proposals each got their own named refusal and the script exited 1: `checkOutput: the model returned the source unchanged` (English handed back), `checkOutput: the model returned nothing` (empty), `not a registered label pair, or that row is gone` (an invented table), `checkOutput: the output is not in Thai` (a plainly English string)
- [x] Boundary cases checked — a label already carrying live Thai is refused (`it already has live Thai`); an `optional` label with no Thai is refused (`shown as typed on purpose: a blank Thai is the answer here`), which is what keeps the "shown as typed" labels out of a sweep; the survey pages `label_sources` and `label_drafts` in 1000-row pages, which is why the 282-row `units` arm reads correctly; and the argument checks refuse `--apply` with no session, `--dev-login` outside `--env test`, `--dev-login` together with `--access-token`, and `--apply --env production` without `--confirm production`

**Cross-check against the existing instrument, which is the strongest single piece of evidence here.** `node scripts/check-production.mjs translations-open --env test` and `node scripts/draft-label-thai.mjs` agree exactly, having been written independently and reading the database by different transports (Management API SQL versus PostgREST): 385 labels missing, of which 313 with nothing and 72 already waiting, and 113 shown as typed on purpose. Taken twice, because the first pair of runs disagreed by one on `as_typed` — the dev database is shared with two other live streams and a row changed between them; re-running both together agreed.

**Nothing a shelter user reads was changed, counted rather than assumed.** `features` had 0 rows with a non-null `name_th` before the run and 0 after, while 13 drafts appeared beside them. That is `propose_label_th()` doing exactly what `0293` says it does: it does not read, lock or write the row.

**Nothing was left behind.** The disposable login (`draft-label-thai-<hex>@example.invalid`, random password, never printed) and its throwaway role were counted before and after both `--apply` runs: 0 logins and the same 6 pre-existing `harness_cards_*` roles, all dated 29–30 October and none this stream's. Those six are filed on the `backlog` branch.

### Role access matrix

- [ ] Every role above tested — n/a: there is no page and no role-keyed behaviour, and `CLAUDE.md` requires the access question to be answered by **card**. The card-shaped answer was measured instead, and it is the finding that decided the whole shape of this PR:

| Caller | Cards held | Asked | Result |
|---|---|---|---|
| service-role key (the Worker's credential) | none — no session, so `auth.uid()` is null | `propose_label_th()` | **refused**, `42501 translations.manage is required to propose a Thai label` |
| service-role key | none | direct `insert into label_drafts` | **refused**, `42501 permission denied for table label_drafts` (`0293` grants it `select` only) |
| disposable login holding exactly the `translations` card | `translations` | `propose_label_th()` × 13 | **allowed**, 13 drafts written, 0 refused, no live row touched |

- [x] A role that should not have access is blocked server-side — the two refusals above are the database refusing, not the script declining: they were obtained by calling the RPC and the table directly with the service key. The script's own `--apply` guard, which refuses to run without a session, is the courtesy on top of that and was not relied on for this line

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no page and no nav entry; this PR touches no `src/`
- [ ] Manual updated — n/a: nothing a shelter user operates. The script is run from a checkout by Claude or the planner, and the manual is for shelter staff
- [ ] Translatable strings go through the translation path — n/a: the script's own output is console text for an operator, not app wording. (What it *writes* is Thai, and it writes it only as a draft through `propose_label_th()`, which is the translation path for a label)
- [ ] Mobile viewport (375px) — n/a: no page
- [ ] Browser console clean — n/a: no page
- [ ] Network clean — n/a: no page. The script's own requests were all 2xx apart from the two deliberate `42501` refusals recorded above

## 6. Regression

- [x] The pages nearest the change still work — not a page, so the nearest thing is the other instrument reading the same tables: `node scripts/check-production.mjs translations-open --env test` runs clean and still reports `Every registered label pair is counted`, and the `uncovered` list it flags on is untouched by this PR
- [x] Any shared file touched checked from a second, unrelated point — `scripts/lib/readonly-checks.mjs` is shared by every named check, so `node scripts/check-production.mjs all --env test` was not run, but the file is loaded and every entry's SQL re-validated by `scripts/check-production.test.mjs` inside the `test` gate, which passed (`test=0`). `worker/translate-engines.mjs` is imported by the new script and by the Worker: it is **imported, not modified**, and the `build` gate (`build=0`) covers the Worker's own use of it
- [x] Nothing merged from `main` during `sync` was broken by this branch — `sync` reported `Already up to date`, so nothing was merged

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** — the `## Security` `translations-open` item is ticked; the `## Management` Thai item is **not** ticked, because its production run is outstanding, and its title has been rewritten so it alone says what is left ("ONLY THE PRODUCTION RUN IS LEFT…") rather than still asking for a generator that now exists
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `docs/decisions/2026-11-01-label-thai-drafts-by-script.md`
- [x] `README.md` still accurate — read the "Environments" and scripts sections; neither describes this script's area and nothing in them has become untrue
- [ ] **Release notes.** — n/a: no production drafts have landed, so there is nothing a shelter user can see yet. The visible change is Thai appearing as *proposed* on Management → Translations, and that happens on the **production run**, which this worktree cannot do (no `.env.deploy.production`) and which the backlog item now names as the planner's. The note belongs in the PR that closes that step. The diff also touches nothing under `src/app/`, `src/components/`, `src/lib/manual/`, `src/lib/i18n/` or `worker/`
- [x] Commit messages say why, not just what — both say which measurement decided the shape, and quote the two `42501` refusals rather than describing them
- [x] **Claims in commit messages and decision files were measured, not reasoned** — the load-bearing claim of this PR is that the translation cron cannot write a label draft. It was not inferred from reading `has_permission()`: it was obtained by calling `propose_label_th()` and inserting into `label_drafts` with the service key against dev and quoting what came back. The figures (385 / 313 / 72 / 113, and 13 landed) are all copied from script output, and the production figures are quoted from the planner's own run with its date, because this worktree cannot take them

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: production release manager
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager

### On the deployed build

- [ ] Deployed to test — deferred: production release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: production release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: nothing here derives "today". The only timestamp written is `label_drafts.proposed_at`, set by `now()` in the database, and nothing branches on it
- [ ] **For a boundary or banding change, the assertions cover both edges** — n/a: no threshold, band or cutoff. The nearest thing is `checkOutput`'s length ratios, which are unchanged and imported as they are
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** — the `gates:` block and every quoted refusal and count are copied from the terminal
- [ ] Public pages re-checked after a cache purge — n/a: no public page is touched, and a draft is invisible to the public by `0293`'s design

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: production release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: production release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: no new secret or variable. The script reads only what `scripts/lib/env.mjs` already loads, and its one credential that is not in a file is the `--access-token` an operator passes on the command line, which it never prints or logs

### Migration ordering — *skip if no migration*

- [ ] Both a migration and code that reads it — n/a: no migration
- [ ] `--env production --dry-run` run and clean — n/a: no migration
- [ ] Production backup fresh — n/a: no migration, and nothing destructive. The only production write this PR enables is a row in `label_drafts`, which no live screen reads as a value
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position stated, **including what it does not cover** — nothing is deployed, so there is nothing to roll back: both files are scripts run from a checkout and neither reaches the Worker bundle or any page. **What a revert would not cover:** the 13 drafts already on dev, which stay (they are drafts, dev data is disposable, and the backlog item says the dev ones need no cleanup), and any draft a later production run lands — those are removed by a person pressing Discard on Management → Translations, or by `discard_label_draft()`, and never by reverting this PR

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | `checkOutput()`'s refusal messages speak of "the model", but the Thai in a `--drafts` file may equally have been typed by a person | fixed — the refusal line is prefixed `checkOutput:` so the wording's provenance is plain, rather than reworded, which would have made the script and the Worker disagree about the same string |
| 2 | low | `label_drafts.proposed_by` comes out **null** for anything the script lands, because the disposable login is deleted afterwards and the column is `on delete set null`. The screen will say "Proposed by someone else" | accepted — arguably correct for a machine-made proposal, and naming a proposer needs schema. Recorded in the decision file §2, and the existing `## Management` item about showing a proposer's real name already covers the general case |
| 3 | low | Six `harness_cards_*` roles from 29–30 October are sitting on the dev database, left by other harnesses that did not run `giveCards()`'s `cleanup()` | deferred to backlog — filed on the `backlog` branch. Not this stream's to delete mid-batch: removing a role another running harness is using would surface as an unexplained failure in someone else's stream |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | **Does the proposed Thai read well?** The 13 `features.name` drafts on dev are a machine's wording and no Thai speaker has read any of them. This is the whole reason they are drafts | Management → Translations on dev, group "Home screen" |
| 2 | The drafts appear on the screen as *proposed* and offer Approve / Discard. The script was verified against the database (`label_drafts` rows, the check's counts), not by driving the page | Management → Translations on dev, as a login holding the `translations` card |

Both are a person looking at a screen, separately from any deploy, so neither belongs in section 8.

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (`claude/label-thai-generator`)  Date: 2026-11-01

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: the list is not empty; both items are for a Thai speaker to tick after looking at the screen

Manual verification by: pending: whether the 13 Thai drafts on dev read well, and that they appear on Management → Translations as proposed with Approve and Discard

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [ ] Handed to the production release manager — n/a: nothing in this PR deploys, and the production script run is named as the planner's in the backlog item rather than handed over as a release step

Result: pass with accepted defects

Release manager acknowledgement: n/a: nothing deploys in this PR
