# Feature test plan — planner handover `438`

## Header

| | |
|---|---|
| Feature | Planner handover edition `438`, plus **three durable facts promoted into the skill**. Sixteen streams since `429`, the counter's first time past nine in one chat |
| Backlog item | `docs/backlog.md` → n/a: not a backlog item. The handover is the skill's step 8, due at nine streams since the last edition; `.plan-day.md` records the counter |
| Branch / worktree | `claude/planner-handover-438` @ `C:\Development\Animal_Shelter_planner-handover-438` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3010` — **not started; this PR has no runtime surface** |
| PR | **deliberately not opened at this commit — see section 1** |
| Tested by / date | Claude Opus 5 (Daily Planner session) / 2026-10-28 |
| Carries a migration? | **no** |
| Tested at SHA | `b55b831c`, the handover commit on this branch |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what was asked for — `docs/planner-handover.md` is replaced with edition `438`, a delta over `429` covering the thirteen streams after it, and **three facts are promoted into the skill** rather than recopied into the handover, as the skill's rule 2 requires
- [x] Files/areas touched listed — **two files only**: `docs/planner-handover.md` (rewritten, 140 lines) and `.claude/skills/plan-day/SKILL.md` (**+3 lines, −0**, three insertion points: the band table, step 3's item-reading bullets, and the never-block-paid-usage section). No route, no component, no `worker/`, no migration, nothing under `src/`
- [x] Roles affected identified — **none.** Neither file is read at runtime by anyone: the handover is read by the next planner chat, the skill by `/plan-day`. No access changes, and no role key or name is introduced by either
- [x] Anything explicitly **out of scope** written down — **(a) the walkthrough re-pass per-step rate is deliberately NOT promoted**, reversing what `429` asked for: it has now moved three times and the single-number version is disproven twice (11,223 on a reconciliation pass, 7,365 today), so the handover promotes the *axis* in prose and leaves the number unpromoted. **(b) The `0.40.9` release is the release manager's** — nothing here touches `src/lib/releases.ts`, the cut, the deploy or the record. **(c) The 141 "not established" fault-log rows are named as the next round's work, not settled here.** **(d) This PR is NOT opened yet**, at the release manager's request: keeping the cut-to-deploy window empty removes the "which SHA did the Worker build from" question that cost `0.40.8` real time

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (`Already up to date`, then pushed)
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 test=0 build=0`. Paste its closing `gates:` lines below exactly as printed:

```
=== gates: typecheck — npm run typecheck
=== gates: typecheck exited 0 after 13s
=== gates: lint — npm run lint
=== gates: lint exited 0 after 142s
=== gates: test — npm test
=== gates: test exited 0 after 16s
=== gates: build — npm run build
=== gates: build exited 0 after 59s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly after the change — n/a: no migration, no table read
- [ ] **Constraints and defaults exercised against real rows** — n/a: no migration
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager — n/a: no migration. **Production's three pending files (`0276`, `0277`, `0278`) belong to `0.40.9` and are the release manager's, not this PR's**

## 4. Functional checks

- [ ] Happy path works end to end — n/a: two documents, no runtime path
- [ ] Data persists — n/a: no data is written
- [ ] Create / edit / delete all exercised — n/a: no CRUD surface
- [ ] Empty state renders sensibly — n/a: nothing renders
- [ ] Invalid input is rejected with a readable message — n/a: no input
- [ ] Boundary cases checked — n/a: no input

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | neither file at runtime | n/a | n/a: documents, not pages |
| management | neither file at runtime | n/a | n/a: documents, not pages |
| staff | n/a — role retired (`0173`) | n/a | n/a |
| doctor | neither file at runtime | n/a | n/a: documents, not pages |
| volunteer | neither file at runtime | n/a | n/a: documents, not pages |
| signed out | neither file at runtime | n/a | n/a: documents, not pages |

- [ ] Every role above tested — n/a: neither file is served to any role; there is nothing for a role to reach
- [ ] A role that should not have access is blocked server-side — n/a: no route is added or changed

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change
- [ ] Manual updated — n/a: nothing a shelter user does changes
- [ ] Translatable strings go through the translation path — n/a: no user-facing string
- [ ] Mobile viewport (375px) — n/a: nothing renders
- [ ] Browser console clean — n/a: no page loaded
- [ ] Network clean — n/a: no page loaded

## 6. Regression

- [x] The pages nearest the change still work — n/a in the page sense, so the equivalent was done: **`node scripts/gates.mjs` passes all four**, which is what proves a `.claude/` and `docs/` change broke no build
- [x] Any shared file touched checked from a second, unrelated page — **`.claude/skills/plan-day/SKILL.md` IS the shared file here, and it was verified by reading it back after the edit**: three `PROMOTED FROM HANDOVER ``438``` markers present, each at its intended anchor, and the file's **CRLF line endings preserved** (the skill records that this file is CRLF while `docs/planner-handover.md` is LF, and that multi-line anchors fail unless normalised first — the edit script normalised, matched, then restored CRLF, and asserted each anchor occurred **exactly once** before changing anything)
- [x] Nothing merged from `main` during `sync` was broken by this branch — `sync` reported `Already up to date`, so nothing came in

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** — n/a: not a backlog item; the handover is the skill's step 8
- [ ] Non-obvious design choices added as a new file in `docs/decisions/` — n/a: the handover **is** the record, and the three promotions carry their reasoning and their readings inline in the skill
- [x] `README.md` still accurate — unchanged by this PR, and it does not describe either file
- [ ] **Release notes.** — n/a: a handover and a planner skill; no shelter user can see either
- [x] Commit messages say why, not just what — the commit says what was promoted, and **why the re-pass rate was deliberately not promoted**, which is the one reversal in this edition
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** Every figure in the handover was read with `get_usage` against the session id it names, with `context.session` checked against the id passed; the band verdicts are those figures against the bands recorded in `.plan-day.md` before the streams ran. **Three claims in this edition are explicitly marked as NOT measured:** the read-first/drive-second band row has **one** reading and says so, the re-pass axis is reasoning over ten readings rather than a new measurement, and the `pending: a person` trend is quoted from the release manager rather than counted here

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: the release manager, for `0.40.9`. This PR is held until that cut merges and ships in a later release
- [ ] Deployed SHA matches the tested SHA — deferred: the release manager

### On the deployed build

- [ ] Deployed to test — deferred: the release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: the release manager. **Neither file has a deployed surface to smoke-test**
- [ ] **Timezone-sensitive behaviour proved** — n/a: no date logic; the dates in both documents are prose
- [ ] **For a boundary or banding change, the assertions cover both edges** — n/a: the "bands" here are token estimates in a planning document, not code thresholds; nothing computes from them
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** — the `gates:` block in section 2 is the full closing output of the run, regenerated and captured to a file rather than retyped from a terminal tail. **An earlier run of the same gates was piped through `tail`, which buffered it and showed nothing for three minutes; that output was discarded rather than reconstructed**
- [ ] Public pages re-checked after a cache purge — n/a: no public page changes

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref matches production — deferred: the release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: the release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration and no code
- [ ] `--env production --dry-run` run and clean — n/a: no migration
- [ ] Production backup fresh for a destructive migration — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position stated, **including what it does not cover** — reverting this commit restores `429` and removes the three skill promotions. **It covers everything this PR does**, because both files are read by humans and by `/plan-day`, never at runtime: there is no deployed artefact, no schema and no cache to reconcile. Nothing else depends on either file

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | An earlier gates run was piped through `tail`, so it buffered and printed nothing for ~3 minutes, which read exactly like a dead background job | fixed — re-run unpiped and captured to a file; the handover records "a background agent that dies gives you silence" as the shape to avoid |
| 2 | low | `git` warns `LF will be replaced by CRLF` on `docs/planner-handover.md`, whose previous editions are LF | accepted — the repo's own normalisation decides what is committed, as it did for every prior edition; no content difference |
| 3 | medium | The edition carried **"`0276` is not on production." STILL TRUE** forward. All three (`0276`, `0277`, `0278`) were applied at 2026-10-28T04:56:38Z, a minute after `0.40.9` merged, so the line was stale within the hour of being written | fixed — corrected on this branch with the apply time and the live card position. **The line's own "re-read `--status --env production`; never quote this" is what caught it**, so the convention worked as designed |
| 4 | medium | The edition inherited `429`'s claim that **both `0275`'s and `0276`'s release notes were owed**. Only `0276`'s was: the backlog records #1024 writing `0275`'s, and it shipped in `0.40.9` as the "Settings → Security can give people roles again" line | fixed — corrected on this branch. Writing it off would have lost a note that already exists |
| 5 | low | A first draft of the correction implied that Management reaching Medical photos through Book clinic visits was probably unintended | fixed — `0276` note 2 records it deliberately ("that is what 'includes' means and is recorded, not widened"), so the wording was softened to a Settings question rather than a fault |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Nothing | — |

**Empty on purpose.** Neither file has a surface a person could look at: no page, no control, no string a shelter user reads. The one thing a person *could* judge — whether edition `438` is useful to the next planner — is only answerable by that next planner reading it, which is the document's own purpose rather than a verification step.

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude Opus 5 (Daily Planner session)  Date: 2026-10-28

### Manual verification

Manual verification by: n/a: no surface for a person to look at — neither file renders, and **Left for manual verification** above is empty on purpose

Result: pass
