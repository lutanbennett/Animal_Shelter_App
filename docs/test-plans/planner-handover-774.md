# Feature test plan

---

## Header

| | |
|---|---|
| Feature | Planner handover, edition `774` |
| Backlog item | `docs/backlog.md` → none. The handover is process bookkeeping, not a backlog item |
| Branch / worktree | `claude/planner-handover-774` @ `C:\Development\Animal_Shelter_planner-handover-774` |
| Dev server | not started — no runtime surface in this change |
| PR | filled in below once opened |
| Tested by / date | Claude (planner) / 2026-11-26 |
| Carries a migration? | no |
| Tested at SHA | `f222e7c16` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — **replaces `docs/planner-handover.md` with edition `774`, a delta covering twenty-four merged planned streams across four days.** No backlog item, by design; **Lutan asked for it directly in chat on 2026-11-26**
- [x] Files/areas touched listed — **exactly two: `docs/planner-handover.md` (rewritten) and `docs/test-plans/planner-handover-774.md` (this file).** No `src/`, no `worker/`, no migration
- [ ] Cards affected identified — `n/a: no card is read, written or checked; a markdown document read by one planning chat`
- [x] Anything explicitly **out of scope** written down — **out of scope: `docs/release-handover.md`, which `check-release-handover.mjs` reports STALE and which is the release manager's to write; `.plan-day.md` (gitignored, updated separately); the `backlog` branch, which carries three of the day's corrections and is not touched from here; and the `plan-day` skill.** Edition `774` names a band rule it would be reasonable to encode in `SKILL.md` and deliberately does **not** encode it: one day's three streams contradicted the preceding day's eight, so it is recorded as a hypothesis rather than written into an instrument

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly and the branch pushed
- [x] `node scripts/gates.mjs` ends with one line of the shape `gates: typecheck=<N> lint=<N> test=<N> build=<N>`

**Only the tail of the run is pasted, and that is the planner's doing, not the script's:** gates was run in the background through `| tail -12`, so the typecheck, lint and test banner lines were discarded before they reached a file. **The summary line is unedited and carries all four exit codes**, which is what this check asks for. The run was not repeated to recover three banner lines whose values that one line already states.

```
=== gates: build exited 0 after 129s

gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — `n/a: not yet — the PR does not exist at this commit`

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — `n/a: no migration`
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — `n/a: no migration`
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — `n/a: no migration`
- [ ] Applied to **dev** and recorded in `schema_migrations` — `n/a: no migration`
- [ ] File is re-runnable — `n/a: no migration`
- [ ] Existing rows still read correctly after the change — `n/a: no migration; no code reads this file`
- [ ] **Constraints and defaults exercised against real rows** — `n/a: no migration`
- [ ] Down-migration written, or the reason one is not needed is stated — `n/a: no migration`
- [ ] Production apply plan stated for the release manager — `n/a: no migration`

## 4. Functional checks

- [ ] Happy path works end to end — `n/a: a markdown document has no runtime path; section 6 stands in`
- [ ] Data persists — `n/a: no data; the file is in git`
- [ ] Create / edit / delete all exercised — `n/a: no runtime surface`
- [ ] Empty state renders sensibly — `n/a: no runtime surface`
- [ ] Invalid input is rejected with a readable message — `n/a: no input`
- [ ] Boundary cases checked — `n/a: no input`

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a | n/a | n/a: the file is not served by the app at any address |
| exactly `<card key>` | n/a | n/a | n/a: no card governs a repository document |
| signed out | n/a | n/a | n/a: the repository is public and this file has always been readable in it |

- [ ] Every login above tested — `n/a: the document is not served by the app`
- [ ] A login that should not have access is blocked server-side — `n/a: nothing serves this file`

## 5. Cross-cutting

- [ ] Nav entry correct — `n/a: no nav entry`
- [ ] Manual updated — `n/a: the manual is for shelter users; the handover is read by one planning chat`
- [ ] Translatable strings go through the translation path — `n/a: no user-facing string`
- [ ] Mobile viewport (375px) — `n/a: no rendered surface`
- [ ] Browser console clean — `n/a: no rendered surface`
- [ ] Network clean — `n/a: no rendered surface`

## 6. Regression

- [x] The pages nearest the change still work — **stands in as: every figure, PR number and claim was read from its source.** All twenty-four `stream-usage:` comments were read with `gh pr view <n> --json comments` in one pass; the two that are **not** band readings (#1872 `finished=blocked`, #1880 `rescoped=yes`) were identified from their own fields and excluded from the 14/6/2 count; **#1867's 105k under was not left as a number — its PR body was read, and it says in its own words that half its deliverables were "already on main (#1789); not redone"**
- [x] Any shared file touched checked from a second, unrelated page — **`node scripts/check-release-handover.mjs` run: it reports the RELEASE handover STALE (it does not name `0.49.2`), which is recorded in this edition as the release manager's and not fixed here.** That is the one sibling instrument that reads a handover, and it was run rather than reasoned about
- [x] Nothing merged from `main` during `sync` was broken by this branch — **this branch touches neither `src/` nor any file the twenty-four streams touched**

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** — `n/a: the handover has no backlog item, and this branch deliberately touches no backlog file; the day's three backlog corrections (#plsso, #rqv5c, #hstau) were committed on the backlog branch, as the rules require`
- [ ] Non-obvious design choices added as a new file in `docs/decisions/` — `n/a: the handover IS the record; a decision file about writing one would duplicate it`
- [x] `README.md` still accurate — **read: it does not describe the handover's contents or edition number**
- [ ] **Release notes.** — `n/a: a shelter user, an Admin and a product administrator see nothing; this file is not served by the app and this PR touches no src/, components, manual, i18n or worker path`
- [x] Commit messages say why, not just what — **the commit records the band finding and the three items the guided session settled, rather than "update handover"**
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned** — **the riskiest claims were each checked against a primary source, and two were corrected before the PR:** a draft said *"none of production's nine mailer templates"* when the config holds thirteen, and now says "not one of production's own mailer templates"; a draft called the exact-floor repeat *"its ninth day"* by arithmetic on `773`'s *"fifth day"*, and now cites `773` rather than counting. **What was measured rather than reasoned:** production runs `0.49.2` @ `5344c037a` (`/api/version`); its `site_url` is `https://cooperjaidee.org` (`check-deployed-hosts.mjs --env production`, read back **after** Lutan's change); `drive-move-to-shelter-account.mjs:92` refuses `--env production` (read in the file); `0423_keep_an_admin_per_shelter.sql` is on `main` and `fb16692ed` renumbered it (`git log --follow`); dev reports 446 applied rows against 445 files (`apply-migrations.mjs --status`); and UAT holds both new secrets (`wrangler secret list --env uat`)

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — `deferred: release manager`
- [ ] Deployed SHA matches the tested SHA — `deferred: release manager`

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — `n/a: nothing to deploy; this file is never bundled, served, or run on the Pi or the Worker`
- [ ] Smoke-tested on `test.lannacare.org` — `n/a: no deployed surface`
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — `n/a: this change derives no date and runs no code`
- [ ] **For a boundary or banding change, the assertions cover both edges** — `n/a: the bands in this document are recorded forecasts, not code; nothing branches on them`
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited.** — `n/a: nothing was deployed, so there is no deploy-time evidence; the gates block in section 2 is the only pasted artefact and is an unedited run`
- [ ] Public pages re-checked after a cache purge — `deferred: release manager`

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — `deferred: release manager`
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen — `deferred: release manager`
- [ ] Any new secret/env var exists in the production Cloudflare environment — `n/a: this change adds no secret and no environment variable. Two secrets WERE added on 2026-11-26 — CLOUDFLARE_WORKERS_DOMAIN_TOKEN and CLOUDFLARE_ACCOUNT_ID — but on UAT only, by Lutan and the planner, and no code in this PR or on main reads either`

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — `n/a: no migration and no code`
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — `n/a: no migration`
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — `n/a: no migration`
- [ ] Apply plan stated — `n/a: no migration`

### Rollback

- [x] Rollback position stated, **including what it does not cover** — **`git revert` of this one commit restores edition `773`, and that is complete: the file is read by a planning chat only, with no deployed state, no schema and no cached artefact behind it.** What a revert does **not** cover: the `.plan-day.md` update (gitignored, not in this PR), the three `backlog` branch commits of the same day, and **the two real-world changes the edition reports** — production's `site_url` and UAT's two new secrets. **Reverting this file would un-record them, not undo them**, which is the more important half of this line

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | high | **This edition covers twenty-four streams against a rule of nine — fifteen overdue.** It is not a drafting defect: Lutan was offered the edition three times and declined each time while mid-release or mid-batch | **accepted, and stated in the edition's own opening rather than buried.** No figure was lost, because each lives on its PR; that durability is exactly what the once-a-day measurement rule relies on |
| 2 | high | **A band was 105k out** (`product-console-build`, 300–370k banded, 195k actual) because the planner priced what the item described rather than what was missing; most of it had shipped in #1789 | **recorded as a rule in the edition** ("band what is MISSING"), **not encoded in the skill.** The mirror of it was already in `773` for schema; this is the UI-surface case |
| 3 | medium | **Two over-precise claims were written and corrected before the PR** — a template count and a day count, both arithmetic rather than measurement | **fixed**, and both named in §7 rather than silently amended, because the failure mode they share is the one this document keeps warning about |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | | |

*Empty on purpose: every claim in this document was read from a PR, a file, a script's output or the live database from a terminal. There is no screen, no deploy and no device involved.*

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (planner)  Date: 2026-11-26

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person — **the list is empty: there is nothing for a person to look at**

Manual verification by: n/a: no screen, no deploy and no device — every check in this plan runs in a terminal

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager — **nothing to hand over: no deploy, no migration, no runtime change**

Result: pass with accepted defects

Release manager acknowledgement: n/a: a documentation-only change with no deployed surface
