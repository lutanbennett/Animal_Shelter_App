# Feature test plan

## Header

| | |
|---|---|
| Feature | The `0.43.2` release record and the release handover, plus the backlog tick the cutover closes and one README date correction: four files, written after the release was deployed and verified |
| Backlog item | `docs/backlog.md` → **`#ki6cx`, ticked in this PR** — the cutover is the one backlog item this release closes, and the runbook's step 12 puts that tick in the record PR |
| Branch / worktree | `claude/record-0-43-2` @ `C:\Development\Animal_Shelter_cut-release-0-43-2` — the cut's own worktree reused, as paperwork rule 2 requires |
| Dev server | not started — n/a: four markdown files, none served or imported by the app |
| PR | see the PR this plan is committed on |
| Tested by / date | Claude Opus 5 (production release manager session), 2026-11-05 |
| Carries a migration? | no — the release's one, `0317`, was applied before any deploy and is recorded in the file this PR adds |
| Tested at SHA | the tip of this branch. The release it describes is deployed from **three** SHAs — Pi production `066fa80d`, everything else `8ec682d1`, tested `168afb8c` — with the allow-list diff empty across every pair |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the procedure asked for — `docs/releases/2026-11-05-0-43-2.md` records what shipped and what was checked, `docs/release-handover.md` is replaced with the `0.43.2` edition, `#ki6cx` is ticked, and README's cutover paragraph is corrected
- [x] Files/areas touched listed — those four files and this plan. No code, no schema, no configuration
- [x] Cards affected identified — **none.** None of these files is read by the app; no activity, card, cell or control is touched. The release's own card change, `view_expenses`, came from `0317` and is recorded rather than made here
- [x] Anything explicitly **out of scope** written down — the four plans signed `pending:`, which belong to their own plans and signatures and are grouped rather than copied; **UAT's unpurged zone cache** and **production's stale `CLOUDFLARE_ZONE_ID`**, both carried in the record as open rather than fixed here; and the `cut-release.mjs` lockfile item, which is backlog `#jhd8s` and not a PR edit

### The one judgement in this PR, stated rather than buried

**`#ki6cx` is ticked, and the tick is narrower than the item.** The cutover happened; the item also carried the search-engine steps (which wait on a public unlock that has not happened), two step-13 leftovers, and two pieces — a new production Supabase project and the Drive copy — that were **dropped rather than done** when UAT took the dev project. `CLAUDE.md` says a partly-closed item gets a note saying which part. **The tick therefore opens with what it does not close**, so nobody reads it as more than it is.

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — n/a as a sync: the branch was created with `git checkout -b claude/record-0-43-2 origin/main` from a freshly fetched `origin/main` (`8ec682d1`), so there was nothing to merge in
- [x] `node scripts/gates.mjs` — n/a: **this is a documents-only PR**, which `scripts/check-docs-only.mjs` decides and which `ci.yml` gates every heavy job on. Running four gates on markdown would prove nothing, and paperwork rule 1 says not to touch code to make a check run
- [x] `node scripts/check-backlog-sections.mjs` — **ok, 79 open items, all above `## Completed`**, run by the pre-commit hook on the backlog edit. `check-backlog-ids` also ok: 981 items, 981 ids, all present and unique
- [ ] CI green on the PR — n/a: the PR does not exist at this commit; it is opened from it and merged on green, on its own head commit read from `gh run view --json headSha`

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration in this PR. Recorded for the next release: `0317` is the highest on `main` and **`0318` is free**
- [x] `--status` reviewed before applying — n/a as this PR's own step; the release's `--status`, `--dry-run` and apply are all recorded in the file this PR adds, including that the apply was **not** refused by the classifier this time
- [ ] `--dry-run` reviewed — n/a: no migration in this PR
- [ ] Applied to **dev** — n/a: no migration in this PR; both databases read **318 of 318** with no drift in either direction
- [ ] File is re-runnable — n/a: no migration in this PR
- [ ] Existing rows still read correctly — n/a: no migration in this PR
- [ ] Constraints and defaults exercised against real rows — n/a: no migration in this PR
- [ ] Down-migration written — n/a: no migration in this PR
- [x] Production apply plan stated — n/a as this PR's own step: `0317` was applied before any deploy. **The record also states why its byte-identical role snapshots are correct rather than suspicious**, and how that was proved positively instead

## 4. Functional checks

- [x] Happy path works end to end — the record's claims are the release's measured output, pasted rather than described; the handover is a delta against its predecessor and cites the record rather than repeating it
- [x] Data persists — all four files are committed on this branch
- [ ] Create / edit / delete all exercised — n/a: four documents, no operation to exercise
- [x] Empty state renders sensibly — n/a as a UI state; none of these files is read by the app, so there is no state to render
- [x] Invalid input is rejected with a readable message — n/a as written; the honest equivalent is that `check-test-plan.mjs --base origin/main` validates this plan and **was run before the PR was opened, and failed first**, which is recorded under Defects
- [x] Boundary cases checked — the handover is **116 lines against a stated ceiling of 150 and an aim of about 100**, counted with `wc -l` after the last edit rather than estimated
- [ ] `/releases` driven in a real browser — n/a: none of these files is served. The release's own live verification, on all three hosts, is in the record

### Role access matrix

**Not run, and deliberately.** No activity, card, cell or control changed. Reported by card rather than by role, as `CLAUDE.md` requires: none of these files sits behind any card, because none is part of the app.

| Login | Can reach | Expected | Result |
|---|---|---|---|
| Admin | none of the four files | nothing to reach — all are repository documents | n/a: no gate changed |
| any card-only login | the same | the same | n/a: no gate changed |

- [ ] Every login above tested — n/a: no activity, card or control changed
- [ ] A login that should not have access is blocked server-side — n/a: no server check changed

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav entry changed
- [ ] Manual updated — n/a: a release record is not a manual topic
- [x] Translatable strings go through the translation path — n/a: none of these files is translated or served
- [ ] Mobile viewport (375px) — n/a: no layout or component changed
- [ ] Browser console clean — n/a: no code changed
- [ ] Network clean — n/a: no request changed

## 6. Regression

- [x] The pages nearest the change still work — n/a as pages; nothing imports any of these files, so nothing can regress from them
- [x] Any shared file touched checked from a second, unrelated place — `docs/backlog.md` is the one shared file here, and it is read by every planning session; the pre-commit hooks assert both its section order and its ids, and both passed. `docs/release-handover.md` has exactly one reader, the next release manager, and says in its own opening lines that the runbook and the record outrank it
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing was merged; the branch was cut from `origin/main` at `8ec682d1`

## 7. Documentation

- [x] Backlog item ticked — **`#ki6cx`, in this PR**, with an explicit note of the four things the tick does not close
- [x] Non-obvious design choices recorded — the whole PR is that record. The four worth finding again: that a release request can silently be a domain cutover and **no check catches it**; that the Pi tunnel step cannot be Claude's; that `gates.mjs` can exit 0 with two gates red; and that a card-creating migration can leave the role snapshots byte-identical
- [x] `README.md` still accurate — **corrected in this PR.** Its cutover paragraph was already written as history but dated the cutover `2026-11-06`; it happened on the **5th**, a day early, so the date and the release it shipped in are now stated
- [ ] **Release notes.** — n/a: nobody using the app would notice a release record, a handover, a backlog tick or a README date. None of these files is served, imported or rendered, and nothing in `src/app/`, `src/components/`, `src/lib/manual/`, `src/lib/i18n/` or `worker/` is touched. The three notes this release publishes went in with the cut, #1308
- [x] Commit messages say why, not just what — one explains what the record establishes and what the tick deliberately does not close, the other why each Worker's key is stated beside its Pi's
- [x] **Claims were measured, not reasoned** — every figure in the record is pasted from a run: the four gate exit codes, the 16 cut assertions, the 16 guard assertions counted with `grep -c`, the apply and both `--status` reads, the role snapshots diffed, the deploy lines read **live from his terminal**, `wrangler deployments list` for the production Worker, the three Server Actions fingerprints read with `actions-key.mjs`, the live headers and `data-env` on all three hosts, both asset checks, the purge probe, and the inbox search that found `0.43.0` and `0.42.0` but no `0.43.2`

## 8. Pre-production gate

### Tested build

- [x] Tested SHA recorded in the header — and stated as what it is: this branch describes a release already deployed, so there is no build of this PR to test
- [x] Deployed SHA matches the tested SHA — n/a: a documents PR deploys nothing. **The release's own answer is three SHAs and identical code**, asserted with the allow-list diff on every pair including `066fa80d..8ec682d1`; the only file that differs anywhere is `docs/backlog.md`

### On the deployed build

- [x] Deployed to test — n/a as this PR's own step: the release reached test from `8ec682d1`, Worker `34e5417f`, **after** production and never beside it
- [x] Smoke-tested — n/a as this PR's own step. The release's smoke test was driven by Lutan on production and is recorded: the Google screen reads "Lanna Care for Animals", saving a setting works, uploading a photo works
- [ ] Timezone-sensitive behaviour proved — n/a: the only dates in these files are the release's own `2026-11-05` and timestamps quoted from runs, all literals
- [ ] Boundary or banding change covers both edges — n/a: not a banding change
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** — the figures quoted here are the ones in the record, themselves pasted from runs
- [x] Public pages re-checked after a cache purge — done for the release and recorded with its limit stated: production's zone was purged and its probe read `CF MISS`, **UAT's zone was not purged and is carried as open**, and `PUBLIC_SITE` stays `locked`, so there was nothing new for an anonymous visitor to see

### Deploy safety

- [x] `deploy: production → Supabase project <ref>` line read — done for the release, **live from his terminal**: `dbkodyyxxhtygxcxmfcu`, with `Next.js version : 16.4.2` matching `package.json` on every build
- [x] `strip-baked-env: removed N env var(s)` seen — **14**, each named, on all three Worker deploys
- [x] Any new secret/env var exists in the production Cloudflare environment — none added by this PR. The release's one requirement, `CLOUDFLARE_ZONE_ID_LANNACAREFORANIMALS`, was confirmed present by listing the key names of `.env.deploy.production` and then **exercised for real** by the purge

### Migration ordering — *skip if no migration*

- [ ] Both a migration and code that reads it — n/a: no migration in this PR
- [x] `--env production --dry-run` clean — n/a as this PR's own step; the release's run was **`0317 … ok`**, with four `-- consumer:` warnings in the safe direction
- [x] Backup fresh for a destructive migration — n/a: no migration in this PR, and `0317` deletes nothing. The release's real backup, taken on the Pi **after** the freeze, is named in the record
- [x] Apply plan stated — n/a as this PR's own step; the release's is recorded

### Rollback

- [x] Rollback position stated, including what it does not cover — **reverting this PR changes nothing that runs.** All four files are documents and the release they describe is already live. **The release itself is a different matter and the record says so plainly: the cutover's rollback is NOT rehearsed**, `.next.prev` is gone after the Pi deploy, and a rollback after steps 6 and 7 would also mean moving `lannacare.org` back by hand. Nothing needs it: the database never moved, and **there is no email to unsend**

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | low | **`check-test-plan.mjs --base origin/main` exited 1 on this PR's first commit** — the plan did not exist yet, because the record and handover were committed before it | **Fixed: this file.** Recorded rather than quietly corrected, because the rule is *every PR, no exemptions*, and a record PR is exactly the one where it is tempting to assume otherwise |

The release's own findings — the cutover sitting unannounced on `main`, the first cut failing the gates, the guard count read off a `tail`, the stale lockfile, the Pi's cached NXDOMAIN, UAT's unpurged zone, and the `[UAT]`-mislabelled production mail — are recorded in `docs/releases/2026-11-05-0-43-2.md` and on the cut's plan, which is where they belong.

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Nothing in this PR. The release's own outstanding items — **UAT's zone cache purge**, production's stale `CLOUDFLARE_ZONE_ID`, and the three notes reading well — are carried in the record and on the cut's plan, and the four `pending:` plans are carried on their own | `docs/releases/2026-11-05-0-43-2.md` and `docs/test-plans/cut-release-0-43-2.md` |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude Opus 5 (production release manager session)  Date: 2026-11-05

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person — n/a: four documentation files, none served or rendered, read by the next release manager and by planning sessions; the release's own manual items are carried on their own plans

Manual verification by: n/a: four documentation files, none served or rendered, read by the next release manager and by planning sessions

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR

Result: pass

Release manager acknowledgement: Claude Opus 5 (production release manager session)  Date: 2026-11-05
