# Feature test plan — record-0-34-0

## Header

| | |
|---|---|
| Feature | The `0.34.0` release record: append `## 0.34.0` to `docs/releases/2026-10-16.md` and rewrite `docs/release-handover.md` for the next release manager |
| Backlog item | `docs/backlog.md` → none — a release record closes no backlog item. (One item was *raised* during this release, on the `backlog` branch, for the gate-script exit-code defect; that is not this PR) |
| Branch / worktree | `claude/record-0-34-0` @ `C:\Development\Animal_Shelter_record-0-34-0` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3016` (not started — this PR has no runtime surface; see §4) |
| PR | #679 — the plan first guessed #678, which another stream took in the interval; corrected rather than left standing |
| Tested by / date | Claude (production release manager session) / 2026-10-16 |
| Carries a migration? | no |
| Tested at SHA | the tip of this branch, cut from `598c2e56` — the deployed release SHA |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — append the `0.34.0` record to the dated release file and rewrite the handover, which is the established shape of a record PR (#668 changed exactly these three paths)
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs) — `docs/releases/2026-10-16.md`, `docs/release-handover.md` and this plan. **No code, no route, no `worker/`, no migration, no shared lib.** Nothing in this PR can affect the running app
- [x] Roles affected identified: admin / staff / doctor / volunteer / resident / signed-out public — **none.** These are repository documents; no role can reach them from the app, signed in or out
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised — three things. (a) **This PR is not a gate.** `0.34.0` is deployed and verified; the record describes a release that already shipped, and per `CLAUDE.md` it is merged without asking rather than presented for approval. (b) The seven `pending:` manual verifications across the release's feature plans are **recorded** here, not closed — they stay with their own plans and signatures. (c) The vet calendar question is recorded as unresolved for the second release running rather than settled, because the read that would settle it is refused as a production read and that refusal was not worked around

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly, bringing the cut (`package.json` reads `0.34.0`), and pushed. Run **before** anything was written in the worktree, which is the step the handover reminds you about
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Paste its closing `gates:` lines below exactly as printed

```
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR (runs the same three). `n/a: not yet — the PR does not exist at this commit`
- [x] `node scripts/check-test-plan.mjs` — `ok` on this file before the PR was opened, so the first CI run had a complete checklist to validate rather than failing on `test-plan` by construction

## 3. Schema and data — *skip if no migration*

`n/a: no migration in this PR.` The release's three (`0210`, `0211`, `0212`) merged in their own PRs (#667, #669, #673) and were applied to production as a release step; production reads `213 applied, 0 pending` and `No drift`.

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — `n/a: no migration`. Recorded for the next release: the next free number is `0213`, and no unmerged branch carries anything above `0212`
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — `n/a: no migration in this PR` (done as a release step: `210 applied, 3 pending` before, `213 applied, 0 pending` after)
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — `n/a: no migration in this PR` (done as a release step: all three `ok`, exit 0)
- [ ] Applied to **dev** and recorded in `schema_migrations` — `n/a: no migration in this PR`
- [ ] File is re-runnable — `n/a: no migration`
- [ ] Existing rows still read correctly after the change — `n/a: no migration`
- [ ] **Constraints and defaults exercised against real rows** — `n/a: no migration`
- [ ] Down-migration written, or the reason one is not needed is stated — `n/a: no migration in this PR`. Recorded in the record itself: **`0212` has no down-migration and that is a real rollback gap**, mitigated by verifying its precondition on production before the apply and its effect after
- [ ] Production apply plan stated for the release manager — `n/a: no migration in this PR`; the release's apply is already done and recorded

## 4. Functional checks

This PR adds prose to two Markdown files. There is no behaviour to drive, and no dev server was started, because nothing in the diff executes.

- [x] Happy path works end to end — the two documents are the deliverable, and what is checked is that they say true things. Every factual claim in the record was taken from a command's actual output pasted at the time, not written from memory: the deploy lines from `deploy-0.34.0.log` (nulls stripped), the migration lines from the apply run, the key fingerprints from both Worker deploys and both Pi builds, the four `/api/version` and `/api/releases/current` responses, and the mail's arrival from the inbox
- [x] Data persists — reload the page and the change is still there — `n/a: no runtime state.` Persistence here is the commit
- [ ] Create / edit / delete all exercised — `n/a: no such surface`
- [x] Empty state renders sensibly (no rows yet) — the relevant empty state is `unreleased`, which is now empty on `main` and is the normal state between releases; `check-release-guards.mjs` asserts that is not a problem
- [ ] Invalid input is rejected with a readable message, not a crash — `n/a: no input`
- [x] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — the one boundary that applies to a dated record file: **two releases now share `2026-10-16.md`**, and the convention is chronological rather than newest-first. Checked against `2026-10-10.md` (`0.24.0` then `0.25.0`) and `2026-10-15.md` (`0.31.0`, `0.32.0`, `0.32.1`) before appending, rather than assumed. The file now reads `## 0.33.0` then `## 0.34.0`

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | nothing in this diff | repository documents are not served to any role | unchanged — no route, middleware or policy in the diff |
| management | nothing in this diff | as above | unchanged |
| staff | nothing in this diff | as above | unchanged |
| doctor | nothing in this diff | as above | unchanged |
| volunteer | nothing in this diff | as above | unchanged |
| signed out | nothing in this diff | as above | unchanged |

- [x] Every role above tested — tested at the level the change operates at: the diff contains no file any role can reach. `docs/` is not served by the app
- [x] A role that should not have access is blocked server-side (hitting the URL directly fails) — `n/a: these files have no URL.` No route, middleware or policy file is in the diff

## 5. Cross-cutting

- [x] Nav entry correct (`src/app/NavLinks.tsx`) — `n/a: not touched`
- [x] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — `n/a: not touched.` A release record is for whoever runs the next release, not for shelter users; the manual is unaffected
- [x] Translatable strings go through the translation path — `n/a: no user-facing strings in this diff`
- [x] Mobile viewport (375px) — `n/a: no markup or styles in this diff`
- [x] Browser console clean — `n/a: nothing in this diff runs in a browser`
- [x] Network clean — no unexpected 4xx/5xx — `n/a: no request path changed`

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked) — `n/a: no page is near this change.` The nearest consumers are human: the next release manager reading the handover, and anyone auditing what shipped
- [x] Any shared file touched checked from a second, unrelated page — `n/a: no shared file is touched.` `docs/release-handover.md` is rewritten wholesale each release by design and nothing imports it; `docs/releases/2026-10-16.md` is appended to and nothing imports it either. **`scripts/check-test-plan.mjs` does read `docs/releases/`** — it rejects a release record filed under `docs/test-plans/` so a release record cannot satisfy a feature PR's gate — and it was run on this branch and returned `ok`, which exercises that path
- [x] Nothing merged from `main` during `sync` was broken by this branch — `sync` brought the cut and the full suite passes: `test=0`, 132 tests, 0 failures

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** — `n/a: a release record closes no backlog item.` One item was *raised* during this release and it went on the `backlog` branch (`e7d21d5d`), which is where follow-ups belong, not in this PR
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `n/a: nothing non-obvious was decided here.` The record *reports* decisions rather than making them: the version call and the accepted money risk are Lutan's and are recorded as his; the build order already has its own decision file. The one thing this PR changes for the future — making the pending-items decision an explicit question in the opening round — is a handover rule, and the handover is the right home for it because it is release-process guidance that is rewritten and re-examined every release
- [x] `README.md` still accurate — unchanged by this PR
- [ ] **Release notes.** `n/a: two repository documents for the release manager; no shelter user can reach either, and nothing about the running app changed in this PR.` The four notes a user *will* notice went out in the cut (#677) and are live
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** This is the line that matters most for a record, because a record is almost entirely prose and no gate reads prose. Three specific guards were applied: every output quoted is pasted from the run rather than retyped; **two of the previous handover's warnings are withdrawn or corrected on the evidence of this release** (`release-prs.mjs` exiting 0, and the record-PR orphan that was matched rather than orphaned) rather than repeated because they were written down; and the one number already given to Lutan that later changed — six pending manual items, then seven once #670 was folded in — is corrected explicitly in the record instead of being quietly updated

## 8. Pre-production gate

### Tested build

- [x] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — this branch is cut from `598c2e56`, which **is** the deployed release SHA on all four builds
- [x] Deployed SHA matches the tested SHA — `n/a for this PR, which deploys nothing`, and **already established for the release it describes**: `deploy: production → Supabase project dbkodyyxxhtygxcxmfcu (598c2e56)` was read from Lutan's log, and both Pis were pinned with `--ref 598c2e56`

### On the deployed build

- [x] Deployed to test — `n/a: this PR is not deployed.` A record PR merges after the release is live; the release it describes was deployed to test (`0.34.0` on both test surfaces) before this plan was written
- [x] Smoke-tested on `test.lannacare.org` — `n/a: nothing in this PR reaches a browser.` The release's own pass is recorded in `docs/releases/2026-10-16.md` under *During the deploy*, including what it could **not** cover
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** `n/a: nothing in this diff derives "today".` The dates in both documents are literal strings
- [ ] **For a boundary or banding change, the assertions cover both edges.** `n/a: no boundary or banding change`
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** — the `gates:` line above is as printed, including the `test=0` the template's expected line does not mention
- [ ] Public pages re-checked after a cache purge or a 10-minute wait — `n/a: PUBLIC_SITE is locked, so there is no cached public page to re-check and the edge-cache check is vacuous.` Re-confirmed during the release: `200`, `Cache-Control: private, no-cache, no-store`, `x-lanna-cache: MISS`

### Deploy safety

- [x] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — read during the release from Lutan's log: `dbkodyyxxhtygxcxmfcu (598c2e56)`. Nothing in this PR deploys
- [x] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — `removed 13 env var(s)` on both Worker builds
- [x] Any new secret/env var exists in the production Cloudflare environment — `n/a: this PR adds none`

### Migration ordering — *skip if no migration*

- [x] **Does this PR contain both a migration and code that reads it?** No — it contains neither
- [ ] `--env production --dry-run` run and clean — `n/a: no migration in this PR` (the release's was clean, all three `ok`, exit 0)
- [x] For a **destructive or rewriting** migration only: a production backup exists and is fresh — `n/a: no migration in this PR`, and satisfied for the release: `lannacare-production-2026-10-15T2000Z.dump.age`, 1,184,430 bytes, 03:00 today, listed over SSH. It is the same dump `0.33.0` used, because both releases fall on one day, and it predates this release's migrations — the right direction for a rollback
- [x] Apply plan stated — `n/a: no migration in this PR`

### Rollback

- [x] Rollback position stated, **including what it does not cover** — for **this PR**, reverting the commit removes two documents and changes nothing a user or the app can reach, so the rollback is total and free. For **the release it describes**, the position is stated in full in the record: code is reversible by rebuilding the Pi at `--ref 83ff5a86`; `0210` and `0211` are safe to leave; **`0212` has no down-migration** and the admin mail cannot be recalled. Writing "rollback available" without those two exceptions would have been false

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| — | — | No defect in this PR. The two defects of the **release** — the gate script that exits 127 after printing a correct verdict, and the pending-items decision delivered as information rather than a question — are recorded in `docs/releases/2026-10-16.md` under *Defects and avoidable costs* | the first is filed on the `backlog` branch with its fix; the second is written into the handover as a rule for the next release |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | **Whether the handover reads usefully to whoever runs the next release.** This is the only thing in this PR a person can usefully check and it cannot be automated: the document's whole purpose is to be read cold by the next release manager, and its value is in what it stops them re-deriving. The specific things worth a second opinion: whether withdrawing the `release-prs.mjs` warning after one clean run is too early, and whether the new exit-code section is placed prominently enough to be read before a production apply rather than after | `docs/release-handover.md` |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-16

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person. The list is **not** empty, so only the person who looked may tick this, and it is left unticked

Manual verification by: pending: whether the handover reads usefully cold to the next release manager (row 1 above). Nothing here blocks the merge — this PR is not a gate, and the release it records is already deployed and verified

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager — this session is the production release manager, and `docs/release-handover.md` in this PR **is** the handover

Result: pass with accepted defects
