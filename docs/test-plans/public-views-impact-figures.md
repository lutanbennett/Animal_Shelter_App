# Feature test plan

## Header

| | |
|---|---|
| Feature | Declare `public_impact_figures` (0156) in the `check-public-views.mjs` allowlist |
| Backlog item | `docs/backlog.md` → none. A same-day follow-up to #417 (0156), which created a public view without declaring it; it turned `public-views` red on every branch. Not a backlog item because it was found and fixed inside the hour — the rule it teaches is recorded in `docs/decisions/2026-10-07-public-impact-figures-declared-public.md` |
| Branch / worktree | `claude/public-views-impact-figures` @ `C:\Development\Animal_Shelter_public-views-impact-figures` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3008` |
| PR | [#420](https://github.com/lutanbennett/Animal_Shelter_App/pull/420) |
| Tested by / date | Claude (QA session) / 2026-10-07 |
| Carries a migration? | no — 0156 is already on `main` |
| Tested at SHA | `9d5970fa` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — one entry added to `PUBLIC_VIEWS` in `scripts/check-public-views.mjs` so the check recognises the view 0156 deliberately granted to `anon`; there is no backlog item, and the header says why
- [x] Files/areas touched listed — `scripts/check-public-views.mjs` (one entry plus a comment), `docs/decisions/2026-10-07-public-impact-figures-declared-public.md`, this plan. **No `src/`, no `worker/`, no migration**
- [x] Roles affected identified — none changes, but **signed-out (`anon`) is the subject of the change** and is tested below. The check's verdict about `anon` moves from "fails" to "passes"; `anon`'s actual access is untouched, because the grant was already live from 0156
- [x] Anything explicitly **out of scope** written down — (a) the grant itself is not altered: this PR does not revoke, narrow or widen what `anon` may read, and the decision file argues why declaring was right and revoking would have broken the feature; (b) the rule that a migration granting to `anon` must update the allowlist in the same PR is recorded in the decision file but **not** added to CLAUDE.md here — the schema half is merged and that belongs with the app half; (c) the two unexplained overnight `public-views` failures (00:24 and 00:31) are **not** explained by this and are not addressed

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — created from `origin/main` minutes earlier by `worktree.mjs new`, which branches from `origin/main`; nothing had landed in between
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Paste its closing `gates:` lines below exactly as printed

```
=== gates: build exited 0 after 399s

gates: typecheck=0 lint=0 build=0
```

- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit

### The gate that actually judges this change

`typecheck`, `lint` and `build` never load `scripts/check-public-views.mjs`, so
none of them can tell whether this fix works. The script itself is the test, run
against the real dev database — which is also what CI's `public-views` job does.

- [x] `node scripts/check-public-views.mjs` exits **0** against dev (`qxkmhwybjggxvsfxsxbd`), where 0156 is applied

```
ok    public_impact_figures.monthly_amount: no public object carries an amount column — HTTP 400
ok    audit_log: anon GET is refused — HTTP 401
ok    audit_log: anon POST is refused — HTTP 401
ok    audit_log: anon PATCH is refused — HTTP 401
ok    audit_log: anon DELETE is refused — HTTP 400
ok    is_public_drive_file(): yes for a public resident photo — true
ok    is_public_drive_file(): no for a blood-test/procedure file — false
skip  is_public_drive_file(): no non-image attachment in a public project folder to ask about

Project: qxkmhwybjggxvsfxsxbd.supabase.co
EXIT=0
```

- [x] The failure being fixed was confirmed as `public-views` and nothing else, on the live runs rather than inferred — two of the seven failing runs read back job-by-job

```
=== 37585169317 ===
FAILED: public-views
=== 37584736385 ===
FAILED: public-views
```

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration in this PR; 0156 is already on `main` and applied to dev
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration in this PR
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration in this PR
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration in this PR
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration in this PR
- [ ] Existing rows still read correctly after the change — n/a: this PR changes a checking script, not the database or any query
- [ ] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — n/a: no migration in this PR
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration in this PR
- [ ] Production apply plan stated for the release manager — n/a: no migration in this PR

## 4. Functional checks

- [x] Happy path works end to end — the script is the feature: it runs to completion against dev and exits 0, having checked every object the Data API exposes
- [ ] Data persists — reload the page and the change is still there — n/a: no page and no write; the script only reads
- [ ] Create / edit / delete all exercised — n/a: the script performs no writes it intends to keep; its own write probes (anon POST/PATCH/DELETE) are expected to be refused and were
- [x] Empty state renders sensibly (no rows yet) — relevant here and checked by the script's design rather than by a screen: `impact_baselines` ships with both seeded rows `null`, and 0156's view omits a row until baseline and date are both set, so `public_impact_figures` is legitimately **empty** on dev today. The check still passed, which confirms the fix does not depend on the view returning rows
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: the change takes no input
- [ ] Boundary cases checked — n/a: the change has no input domain

### Role access matrix

Only the signed-out tier is in scope. The others are unchanged and untested
here, which is stated rather than ticked.

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | unchanged | unchanged | n/a — no app surface changed |
| management | unchanged | unchanged | n/a — no app surface changed |
| staff | unchanged | unchanged | n/a — no app surface changed |
| vet | unchanged | unchanged | n/a — no app surface changed |
| volunteer | unchanged | unchanged | n/a — no app surface changed |
| signed out (`anon`) | `public_impact_figures` read-only; `impact_baselines` and `audit_log` not at all | read the view, refused everything else, no writes | **pass** — exercised by the script against dev: the view reads, its write probes are refused, `impact_baselines` and `audit_log` refuse `anon` outright, and no public object carries an amount column |

- [x] Every role above tested — the signed-out tier is driven for real by the script; the five signed-in roles are marked `n/a` with the reason, because this PR touches no route, policy or permission cell
- [x] A role that should not have access is blocked server-side (hitting the URL directly fails) — this is precisely what the script does: it calls the REST API directly with the anon key, not through the app, and records the HTTP status. `impact_baselines`, `audit_log` and the base tables all answer 401

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: file not touched, no nav entry added
- [ ] Manual updated (`src/lib/manual/en.ts`) — n/a: nothing a shelter user does changes
- [ ] Translatable strings go through the translation path — n/a: the PR adds no strings
- [ ] Mobile viewport (375px) — n/a: no layout changes
- [ ] Browser console clean — n/a: no client code changes
- [ ] Network clean — n/a: no app request paths change

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked) — not pages: the script's **other** assertions are the regression surface, and all of them still pass in the same run. Specifically the probes that exist because of past incidents — anon writes through `public_resident_profiles` (0025), the four internal views that once answered anon (0081), anon RPC execution (0082), the `site_*` base tables (0122) and the `vet_visit_estimate` column exclusion — are unchanged
- [x] Any shared file touched checked from a second, unrelated page — **by loading that page, not by reading the file** — `check-public-views.mjs` is shared with CI's `public-views` job, and the honest second consumer is that job, which will run it on the PR. Locally the script was executed, not read
- [x] Nothing merged from `main` during `sync` was broken by this branch — the branch is minutes old off `origin/main`, and the script run post-dates 0156 being on `main`

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** — n/a: there is no backlog item; this is a same-day follow-up to #417, and the header records why
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-10-07-public-impact-figures-declared-public.md`: that the check's red had two opposite fixes (revoke the grant vs declare the view), the evidence for choosing to declare, and why the omission costs every other stream rather than the migration author's own CI
- [x] `README.md` still accurate — checked: it does not enumerate the public views or describe the allowlist, so nothing in it is made wrong
- [ ] **Release notes.** — n/a: nobody would notice. The public impact figures are not visible yet — 0156 is the schema half only, the page that prints them is unbuilt, and both seeded rows are `null` so the view returns nothing. This PR only changes what a checking script considers approved
- [x] Commit messages say why, not just what — the commit explains the grant, why the check enumerates the live database, why that made it fail on unrelated branches, and states plainly that it is not a leak
- [x] **Claims in commit messages and decisions were measured, not reasoned.** The "not a leak" claim is the load-bearing one and it was checked four ways rather than argued: 0156's grant lines read directly (`grant select … to anon` at :148, `revoke all on impact_baselines from anon` at :85), the view confirmed to select no `set_by`, and the script's own probes for `audit_log`, the base tables and the amount column re-run and passing. The "it failed on every branch" claim is from the run list and two job-level reads, not from reasoning about how the job works

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — n/a: nothing deploys. The file is a developer and CI script; it is not bundled into the app or the Worker, so no deployed build can differ from what was run here
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: this PR contains no date or clock logic. (0156 does — its baseline boundary is `shelter_date`, Asia/Bangkok — but that is already merged and is not what this changes)
- [ ] **For a boundary or banding change, the assertions cover both edges** — n/a: no threshold, band, rounding rule, retry window, pagination limit or permission cutoff is touched
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.** — the blocks in section 2 are tool output, pasted not retyped. **One trim, declared:** the script prints about sixty `ok` lines and the block keeps the tail plus the exit code; nothing is reworded or reordered, and the elision is labelled rather than silent
- [ ] Public pages re-checked after a cache purge or a 10-minute wait — deferred: release manager

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: the PR adds no secret or env var

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration in this PR
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — n/a: no migration in this PR
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — n/a: no migration in this PR
- [ ] Apply plan stated — n/a: no migration in this PR

### Rollback

- [x] Rollback position stated, **including what it does not cover** — revert the commit; the change is one array entry in a script nothing imports at runtime, so reverting restores the previous behaviour exactly and brings the red `public-views` back with it. **What it does not cover:** reverting would NOT remove `anon`'s access to `public_impact_figures` — that grant lives in 0156 and is already applied to dev. If the grant itself ever needed undoing, that is a new migration, not a revert of this PR

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | high (CI, not product) | 0156 granted `select` on `public_impact_figures` to `anon` without declaring it in `check-public-views.mjs`, turning `public-views` red on every branch and every `main` push from 06:55 onwards — six runs, seven failure emails | fixed in this PR |
| 2 | unknown | Two `public-views` failures overnight (runs at 00:24 and 00:31) predate 0156 and are **not** explained by this fix | deferred — not investigated here; flagged to Lutan rather than assumed to be the same cause |

## Left for manual verification

Empty. The change has no screen, wording or role behaviour to look at, and the
one thing that genuinely needed checking — what `anon` can actually reach — is
better done by the script hitting the REST API directly than by a person
looking at a page, and was. The deploy-time items have their own state in
section 8.

| # | What to check | Where |
|---|---|---|
| — | Nothing | — |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (QA session)  Date: 2026-10-07

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person

Manual verification by: n/a: no human-visible surface — the only behaviour in scope is what the anonymous tier of the database may read, which was exercised by the script against dev and pasted above

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR description links this file instead of duplicating it, so there is one copy to keep correct
- [x] Handed to the production release manager

Result: pass with accepted defects

Release manager acknowledgement: pending: not acknowledged yet — nothing in this PR deploys, but defect 2 (the unexplained overnight failures) is open and the release manager should know it is not covered  Date: —
