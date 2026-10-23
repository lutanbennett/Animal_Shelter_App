# Feature test plan — `0.39.5` handover: both manual items closed

## Header

| | |
|---|---|
| Feature | Record that Lutan closed both of #882's manual items on production, and record the one gap that opens |
| Backlog item | `docs/backlog.md` → none; keeping the handover true is `docs/release-procedure.md` paperwork rule 4 |
| Branch / worktree | `claude/handover-0-39-5-items-closed` @ `C:\Development\Animal_Shelter_handover-0-39-5-items-closed` (a **new** worktree — see section 2 for why no leftover was reused) |
| Dev server | not started; this PR changes two documents and no page |
| PR | filled in at the PR step |
| Tested by / date | Claude Opus 5 (production release manager session) / 2026-10-23 |
| Carries a migration? | no |
| Tested at SHA | `31f6fd3f` |

**Not a gate.** `0.39.5` is deployed and verified. This keeps the handover and the record
true, which is the one thing that stops a closed item being re-raised at Lutan weeks later
— the `assistant-retention` failure, which sat "blocked" for nine days and cost him three
answers he had already given twice.

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — both of #882's manual items are marked closed by Lutan with his words and the date, and the gap that exercising the toggle opens is recorded as **not established**; no backlog item, this is paperwork rule 4
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs) — exactly three, all documentation: `docs/release-handover.md`, `docs/releases/2026-10-23-0-39-5.md` (an "Overtaken" section appended; the original text is left standing, not rewritten) and this plan. No code of any kind
- [x] Roles affected identified — **none.** Nothing here is reachable by any role; `docs/` is not served
- [x] Anything explicitly **out of scope** written down — **the end state of production's `role_cards` is deliberately not asserted.** Lutan exercised the toggle; whether he left either card granted is unknown, and this PR says so rather than inferring it. Reading it would need the authenticator app or a script that is hard-locked to dev, and that guard was left alone

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — n/a as a merge: the worktree was created from `origin/main` at `31f6fd3f` minutes before the edit
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 test=0 build=0` — see below, unedited, all four numbers read
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

**A new worktree was made rather than a leftover reused, against paperwork rule 2's
default, and the reason is worth recording.** Both of this release's own worktrees had been
removed by another session's cleanup, correctly. `list` showed one `free` candidate,
`units-of-measure-app` — but its branch pairs with `claude/units-of-measure-schema`, which
is **HELD and active**, so it is the second half of a schema-then-app sequence waiting for
the first to land, not a leftover. `free` plus `nothing beyond main` describes a prepared
stream and a leftover identically; rebranching that folder would have broken a stream
another session is mid-way through. **The four-minute `npm ci` was the cheaper mistake.**

```
=== gates: typecheck — npm run typecheck
=== gates: typecheck exited 0 after 49s
=== gates: lint — npm run lint
=== gates: lint exited 0 after 95s
=== gates: test — npm test
=== gates: test exited 0 after 16s
=== gates: build — npm run build
=== gates: build exited 0 after 206s
gates: typecheck=0 lint=0 test=0 build=0
```

**The handover trim and this plan's own line-count figures landed after this run started.** Said plainly for the same reason as the record PR: a documents-only PR skips the heavy CI jobs, so these local gates are the only ones that run and there is no second pass to catch a late edit. Both changes are markdown, and it was checked rather than assumed that no gate reads these files — the only scripts naming `release-handover.md` or the release records are `check-docs-only.mjs` and its test, which classify paths, plus `check-assets.mjs` and `sync-home-icons.mjs`, none of which parses their content. **The result above holds for the final tree.**

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration. Next free is `0252`
- [ ] `--status` reviewed before applying — n/a: this PR applies nothing
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly after the change — n/a: this PR touches no data
- [ ] **Constraints and defaults exercised against real rows** — n/a: no migration
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated — n/a: nothing to apply

## 4. Functional checks

- [x] Happy path works end to end — the function of these documents is to be true. Both closures are **quoted verbatim** from Lutan in chat with the date, rather than paraphrased, and the unknown is labelled unknown
- [x] Data persists — n/a in the UI sense; the standing-in check is that both edits are in the diff and committed, which `git show --stat` confirms
- [ ] Create / edit / delete all exercised — n/a: a handover is rewritten per release and a record is appended to once; there is no delete path
- [ ] Empty state renders sensibly — n/a: no UI
- [x] Invalid input is rejected with a readable message, not a crash — the applicable guard is `check-test-plan.mjs`, which validates this plan; it exits 0
- [x] Boundary cases checked — the one that matters is the handover's **line ceiling**: paperwork rule 4 sets ~100 lines and treats 150 as the limit. **Measured, not estimated: 136 before this change, 145 after it, trimmed to 142.** The trim took the "Promoted out of this file" section down to three lines, which it can afford now that the lesson itself lives in `release-procedure.md` — the point of promoting it. 142 is inside the limit and honestly reported as not ~100

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| every role, and signed out | nothing in this PR | no change | neither document is served by the app |

- [ ] Every role above tested — n/a: no surface. The roles whose homes changed were tested on the deployed test build during the release and the table is in the record
- [ ] A role that should not have access is blocked server-side — n/a: no new page or permission

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: not touched
- [ ] Manual updated (`src/lib/manual/en.ts`) — n/a: not touched; a handover is not user documentation
- [ ] Translatable strings go through the translation path — n/a: no user-facing string. The Thai strings this PR *mentions* shipped in #882 and Lutan has now passed them
- [ ] Mobile viewport (375px) — n/a: no UI
- [ ] Browser console clean — n/a: no page driven
- [ ] Network clean — n/a: no page driven

## 6. Regression

- [x] The pages nearest the change still work — n/a in the UI sense. The nearest thing is the record itself, and it was **appended to rather than rewritten**, so the original text still reads as it did and the correction is visibly a correction
- [ ] Any shared file touched checked from a second, unrelated page — n/a: no shared file
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing was merged; the branch is three documents beyond `origin/main`

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** — n/a: this closes no backlog item. The release's two backlog edits went on the `backlog` branch where they belong, and a fourth note was added there afterwards about `worktree.mjs done`
- [ ] Non-obvious design choices added as a new file in `docs/decisions/` — n/a: no design choice. The judgement here — record the unknown as unknown rather than infer it — is an existing standing rule, not a new one
- [x] `README.md` still accurate — unchanged; it names no version
- [ ] **Release notes.** Would a shelter user notice this change? — n/a: nobody outside this repository reads a handover or a release record, and nothing a user sees changed. The note for what users *did* notice shipped in #883 and is live on `/releases`
- [x] Commit messages say why, not just what — the commit says which items closed, in whose words, and which gap that opens
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned** — the two closures are direct quotations; the gap is marked **not established** after being asked once and not answered, which is the sanctioned outcome rather than a guess

## 8. Pre-production gate

### Tested build

- [x] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — `31f6fd3f`. **This PR ships no build**: `0.39.5` is live at `55a23450` and nothing here changes what is served
- [x] Deployed SHA matches the tested SHA — n/a for this PR, and re-confirmed for the release: `/api/version` answers `0.39.5` @ `55a23450` on production and test

### On the deployed build

- [ ] Deployed to test — n/a: documents only; no deploy follows this PR
- [ ] Smoke-tested on `test.lannacare.org` — n/a: nothing to smoke-test; the release's own pass is recorded
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour** — n/a: no clock is read. The dates here are literal strings
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary** — n/a: no band or threshold. The line ceiling in section 4 is a budget, not a behaviour
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** — the gates block below
- [ ] Public pages re-checked after a cache purge or a 10-minute wait — n/a: `PUBLIC_SITE` is `locked`, and this PR changes nothing served

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — n/a: no deploy follows this PR; the release's line was read and is in the record
- [ ] `strip-baked-env` seen in the deploy output — n/a: no deploy follows this PR
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: neither
- [ ] `--env production --dry-run` run and clean — n/a: no migration
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — n/a: no migration, and no data is touched
- [ ] Apply plan stated — n/a: nothing to apply

### Rollback

- [x] Rollback position stated, **including what it does not cover** — reverting this PR would restore two documents and change nothing served; `0.39.5` is unaffected either way. What it does **not** cover: reverting it would put back the claim that both manual items are open, which is the false state this PR exists to remove

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | low | Nothing in this PR. One finding from the release's cleanup, after the record merged: **`worktree.mjs done` given a folder name told me a live worktree "is not a git repo any more" and offered `--force` to delete it** — the lookup matches on the branch the folder was created under, and a release routinely breaks that link, because the record step reuses a leftover worktree and rebranches it exactly as the paperwork rules instruct | **Refused rather than obeyed**, per the standing rule that a tool's suggested remedy is not advice; `git status` worked in that folder throughout. Diagnosed to `scripts/worktree.mjs:741` (`isRepo` true, `tree` null, falling into the wrong branch of the `if`) and filed on `backlog` as a fourth note on the existing tooling item, with a one-line fix |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | none — this PR changes two documents and no page, route or permission | — |

**The release's ten `pending: Lutan` production sign-in checks are not copied here.** They
belong to the record, which lists them individually. A second home is how an open item
stops being closed anywhere.

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude Opus 5 (production release manager session)  Date: 2026-10-23

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person — the list is empty, and that is a statement about **this PR**: two documents, no surface. The two items it *records* as closed were checked by **Lutan on production**, which is why they are quoted rather than signed for

Manual verification by: n/a: this PR changes two documents and no page. The closures it records are Lutan's own, quoted with the date; nothing here is signed on his behalf

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: done at the PR step, after this commit
- [ ] Handed to the production release manager — n/a: written by the release manager

Result: pass

Release manager acknowledgement: Claude Opus 5 (production release manager session)  Date: 2026-10-23
