# Feature test plan — record-0-38-0

## Header

| | |
|---|---|
| Feature | The `0.38.0` release record (a `## 0.38.0` section added to `docs/releases/2026-10-20.md`, which already holds `0.37.2`) and the rewritten `docs/release-handover.md` for whoever runs the next release |
| Backlog item | `docs/backlog.md` → none — a release record closes no backlog item |
| Branch / worktree | `claude/record-0-38-0` @ `C:\Development\Animal_Shelter_record-0-38-0` |
| PR | **#776 — guessed before opening and re-read afterwards.** The record PR's number has now been predicted correctly for six releases running |
| Dev server | not driven — documentation only |
| Tested by / date | Claude (production release manager session) / 2026-10-20 |
| Carries a migration? | no |
| Tested at SHA | the tip of this branch |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — write down what `0.38.0` actually did, and rewrite the handover so the next release does not re-derive it
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs) — `docs/releases/2026-10-20.md` (appended), `docs/release-handover.md` (rewritten), and this plan. **No `src/`, no `worker/`, no migration, no script.** Nothing in this PR executes anywhere
- [x] Roles affected identified — none. No shelter user can reach any of it; both files are internal documents read by Claude sessions and by Lutan
- [x] Anything explicitly **out of scope** written down — **this PR is not a gate.** `0.38.0` is deployed, verified and live on all four targets; this describes a release that has already shipped. It is merged by Claude as soon as CI is green, and it must never be presented to Lutan as something awaiting his say-so (`CLAUDE.md`, "Release PRs merge without asking")

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — the worktree was created from `origin/main` at `8d385e10`, the release SHA, which was the tip
- [x] `node scripts/gates.mjs` ends `typecheck=0 lint=0 test=0 build=0` — pasted below unedited

```
=== gates: build exited 0 after 118s

gates: typecheck=0 lint=0 test=0 build=0
```
- [ ] CI green on the PR (runs the same three) — `n/a: not yet — the PR does not exist at this commit.` Filled in from `gh run list` once it does, with the run's `headSha` matched against this branch's HEAD rather than read off the PR bar's cache

## 3. Schema and data — *skip if no migration*

`n/a: no migration in this PR, and none in this release that is not already applied and recorded.` Production finished the release at `233 applied, 0 pending`, `No drift: production matches origin/main`; dev at `233 of 233`, `No drift: test matches origin/main`. Both read by name after the deploy, not inferred from the apply's own output.

## 4. Functional checks

Two markdown documents. There is no behaviour to drive.

- [x] Happy path works end to end — both files render as markdown and the appended section is a sibling heading rather than nested inside `0.37.2`'s: `grep -n '^# '` returns line 1 (`0.37.2`) and line 297 (`0.38.0`), so that day's file now holds two records as 2026-10-02's holds four
- [x] Data persists — `n/a: nothing is written at runtime.` Persistence is the commit
- [ ] Create / edit / delete all exercised — `n/a: a record is appended once; there is no create/edit/delete surface`
- [x] Empty state renders sensibly — `n/a: neither document has an empty state.` The handover is a full rewrite rather than a partial one, so there is no half-updated edition to read
- [x] Invalid input is rejected with a readable message, not a crash — `n/a: no input path.` The one mechanical check that applies is `check-test-plan.mjs` over this plan, which is run below
- [x] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — **every figure in the record was checked against the tool output it came from rather than retyped from memory**: the release SHA `8d385e10`, `233 applied / 0 pending`, `13` stripped env vars on both environments, the Server Actions keys `cbd55beae8d8` and `ecc41837fc0b`, the compile times 51s and 50s, the cache sizes 1.8 GB / 1.2 GB / 876 GB free, the six note lengths, the per-role note counts, and the `98670` vs `98698` byte disagreement

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| every signed-in role | nothing in this PR | no change — these files are not served by the app | no route, component, policy or view touched |
| signed out | nothing in this PR | no change | as above |

- [x] Every role above tested — tested at the level this change operates at: nothing in the diff is reachable from the app, asserted by the diff touching only `docs/`
- [x] A role that should not have access is blocked server-side — `n/a: nothing here is served`

## 5. Cross-cutting

- [x] Nav entry correct (`src/app/NavLinks.tsx`) — `n/a: not touched`
- [x] Manual updated (`src/lib/manual/en.ts`) — `n/a: not touched`
- [x] Translatable strings go through the translation path — `n/a: internal English documents, not shipped text`
- [x] Mobile viewport (375px) — `n/a: no markup or styles in this diff`
- [x] Browser console clean — `n/a: nothing in this diff reaches a browser`
- [x] Network clean — `n/a: no request path changed`

## 6. Regression

- [x] The pages nearest the change still work — `n/a: there are no pages.` The gates still pass on the branch, which is the only thing that could have been disturbed
- [x] Any shared file touched checked from a second, unrelated page — `n/a: neither file is imported by anything.` `docs/release-handover.md` is read by people and by sessions, not by code
- [x] Nothing merged from `main` during `sync` was broken by this branch — the full suite passes on the branch: `test=0`

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** — `n/a: a release record closes no backlog item.` **Checked the other way too**, per `CLAUDE.md`'s "tick what else your work closed": the two items this release's own findings relate to (the retention-job check and its fix) are **still genuinely open** and were deliberately left open, so ticking either would be false. The Drive-space follow-up this release identified goes on the `backlog` branch, not in this PR
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `n/a: nothing non-obvious was decided in this PR.` The release's own decisions (major rather than minor; moving #763's vet note into the cut) are recorded in the record itself with Lutan's reasoning, and the features' decisions are in their own PRs' files
- [x] `README.md` still accurate — unchanged by this PR and by the release
- [ ] **Release notes.** `n/a: an internal record and handover — no shelter user could notice either, and src/lib/releases.ts is untouched by this PR.` The release's own six notes shipped in the cut, #775
- [x] Commit messages say why, not just what
- [x] **Claims in the record were measured, not reasoned** — see §4's boundary line. **Two claims were deliberately weakened rather than guessed at**: why the mail skipped nobody this release (recorded as *"not established why, and not worth a paragraph of inference"*), and the cause of the 28-byte asset disagreement (recorded as unexplained, with the authoritative tool named). Both follow the backlog rule about not asserting what could be asked in one line

## 8. Pre-production gate

### Tested build

- [x] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — `8d385e10`, the release SHA, which this branch was cut from
- [x] Deployed SHA matches the tested SHA — **already true and verified**: all four targets report `0.38.0` @ `8d385e10` on `/api/version`, eighteen releases running of four builds from one SHA

### On the deployed build

- [x] Deployed to test — done during the release; `deploy: test → Supabase project qxkmhwybjggxvsfxsxbd (8d385e10)`
- [x] Smoke-tested on `test.lannacare.org` — done; the filled checklist is the record this PR adds
- [x] **Timezone-sensitive behaviour proved, not observed at a convenient hour** — `n/a: nothing in this diff derives "today".` The dates in both documents are literals, and the release introduced no scheduled time or time-based cutoff
- [x] **For a boundary or banding change, the assertions cover both edges** — `n/a: no boundary or banding change in this diff`
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** — the `gates:` block below is copied as printed
- [x] Public pages re-checked after a cache purge — done during the release: the purge reported `purged everything for lannacare.org (zone c596f1fe…)` and the Pi's byte-for-byte check then returned `ok … identical to the build`. `PUBLIC_SITE` is locked, so there is no anonymous page to re-check beyond the gate, which was confirmed by matching its text

### Deploy safety

- [x] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — read from Lutan's log by grepping the project ref: `deploy: production → Supabase project dbkodyyxxhtygxcxmfcu (8d385e10)`
- [x] `strip-baked-env: removed N env var(s)` seen — **13 on production and 13 on test**, matching `0.37.2`'s correction exactly
- [x] Any new secret/env var exists in the production Cloudflare environment — `n/a: this PR adds none`, and neither did the release
- [x] **The release mail went out, and it was confirmed delivered** — `deploy: release mail for 0.38.0 [UAT]: sent 1, skipped 0` in the production log, **and** the message from `releases@lannacare.org` found in the inbox with `0.38.0` in the subject and the notes rendering. **Checked as delivery, not as relay acceptance.** Test printed `[off]: sent 0, skipped 23`, correctly
- [ ] **`0227`'s retention job is actually scheduled on production** — `deferred: Lutan`. **Still open, deliberately**, and carried into the handover rather than dropped. Put to him in this release's opening message; he did not ask for the refused read to be retried, so it was not

### Migration ordering — *skip if no migration*

- [x] **Does this PR contain both a migration and code that reads it?** No — neither. The release's one ordering constraint (`0231`'s consumers arriving in #764) was satisfied by applying before deploying, and the expected `-- consumer:` warning was predicted in the cut's plan before the apply ran
- [x] For a **destructive or rewriting** migration only: a production backup exists and is fresh — `n/a: no migration in this PR.` None of the release's three was destructive. **The README restore recipe has still never been exercised** — sixteen releases unanswered, and still the cheapest item on the outstanding list
- [x] Apply plan stated — `n/a: nothing to apply`; the release's three are applied and drift-checked

### Rollback

- [x] Rollback position stated, **including what it does not cover** — this PR is reverted by reverting the commit; nothing deployed changes, because nothing here is deployed. **What a rollback of the release itself cannot undo is the mail**, which reached every admin during Lutan's deploy. That is stated in the record and is the reason the major-versus-minor call is his

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | Low (tooling, nothing shipped) | **A `cat > file <<'EOF'` heredoc large enough to hold this release's cut test plan died with `ENAMETOOLONG: name too long, uv_spawn`** — the whole document is passed as one shell argument, so a long document exceeds the spawn limit. The failure mode is unhelpful: it names a path length, not a size | **Accepted and written into the handover's "things that look alarming" list.** The fix is to use the editing tools for long documents rather than shelling them out, which is what was done. No retry loop was needed once the cause was read |

No defect is in shipped code.

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | That the record's account of `0.38.0` matches Lutan's experience of it — in particular that **two touches** is what it felt like from his side | `docs/releases/2026-10-20.md`, the `0.38.0` section |
| 2 | **Video playback on a real iPhone and a real Android.** Carried from the cut's plan because it is the release's one substantive gap: the note promises a video "plays right on the page" and nobody has watched it do so on a handset | A resident's Photos section on `lannacare.org`, on a real phone |

## Sign-off

- [x] All of the above either ticked or `n/a: <reason>`

Automated checks by: Claude Opus 5  Date: 2026-10-20

Manual verification by: n/a: documentation of a release that has already shipped and been verified; there is nothing in this PR for a person to look at beyond reviewing the wording, and the two items above belong to the release rather than to this diff

Result: pass
