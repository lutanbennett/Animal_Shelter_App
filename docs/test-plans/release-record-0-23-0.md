# Feature test plan — release-record-0-23-0

## Header

| | |
|---|---|
| Feature | The `0.23.0` release record (`docs/releases/2026-10-09.md`) and the rewritten handover for whoever runs the next one (`docs/release-handover.md`) |
| Backlog item | none — §8 of `docs/release-procedure.md` ("Record it"), plus the handover's own rule that it is rewritten each release |
| Branch / worktree | `claude/record-0-23-0` @ `C:\Development\Animal_Shelter_record-0-23-0` |
| Dev server | not started — two documentation files, nothing on a screen |
| PR | opened from this branch |
| Tested by / date | Claude (release manager session) / 2026-10-09 |
| Carries a migration? | no |
| Tested at SHA | `7928bd7a` — the release this record is about |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what was asked for — two documentation files: the durable record of what `0.23.0` actually did, and the short-lived handover that replaces `0.22.0`'s
- [x] Files/areas touched listed — `docs/releases/2026-10-09.md` (new) and `docs/release-handover.md` (rewritten in full). No code, no migration, no `src/`
- [x] Roles affected identified — none. Neither file is served by the app; both are read in the repo
- [x] Anything explicitly **out of scope** written down — (a) the seventeen `pending:` feature plans, which keep their own signatures and are listed, not copied; (b) the four production-only checks the record names as owed; (c) `docs/release-procedure.md`, the runbook, which this release gave no reason to change

**The risk in a release record is that it is wrong, not that it breaks anything.**
A record nobody can trust is worse than none, because it is the first artifact
anyone reaches for when something has gone wrong. So every figure in it is
either pasted tool output or a value read back from the thing it describes —
listed in §4.

**Both files are rewritten wholesale rather than edited**, the handover by its
own instruction. The previous handover is not lost: it is in git, and the
durable half of it — what `0.22.0` did — lives in `docs/releases/2026-10-08.md`,
which this PR does not touch.

## 2. Automated gates

- [ ] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly — n/a: the worktree was created from `origin/main` at `7928bd7a`, the release commit, and nothing had landed since
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Pasted exactly as printed:

```
=== gates: build exited 0 after 238s

gates: typecheck=0 lint=0 build=0
```

- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit. Ticked in a follow-up commit once the run is actually green, never pre-ticked

## 3. Schema and data

- [ ] Any migration in this PR — n/a: none. The release's seven are `0165` to `0171`, applied to production during the release and recorded in the file this PR adds

## 4. Functional checks

A record's "functional check" is whether each claim in it is true. Every figure
was taken from the tool that produced it, not retyped from memory:

- [x] Happy path works end to end — each claim traced to its source: the release SHA to `git log` and to `/api/version`; both Worker version IDs to their own deploy logs; `171 applied, 0 pending` and both `No drift` lines to `apply-migrations.mjs`; the mail's delivery time, recipient and subject to the message in the inbox; the edge-cache block to the browser's own three fetches; the sixteen cut assertions to the verification script's output
- [x] Data persists — the files are committed; `git show` is their persistence
- [ ] Create / edit / delete all exercised — n/a: no screen, no records
- [ ] Empty state renders sensibly — n/a: not a rendered surface
- [ ] Invalid input is rejected with a readable message — n/a: no input
- [x] Boundary cases checked — the two counts most easily got wrong were re-derived rather than carried: **24 PRs** from `release-prs.mjs 7b7341df HEAD` (exit 0, read directly and not through a pipe), and **24 test plans** from `git diff --name-only 7b7341df 7928bd7a -- docs/test-plans/`, so every PR in the range has one. The signature split (`pending=17 n/a=6 signed=1`) was counted from the files, not estimated

**One figure was corrected rather than carried.** The cut PR's description says
"fifteen of 22 plans pending", which was true when it was written; #490 and the
cut's own plan then brought it to **seventeen of 24**. The record and the
handover both say seventeen, and this line is why they differ from the PR body.

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| all roles | neither file | unchanged — documentation is not served by the app | pass — no route, no permission, no nav entry touched |

- [x] Every role above tested — as the question it is: `grep` confirms neither path is referenced by `src/`, so no role's experience can change
- [ ] A role that should not have access is blocked server-side — n/a: nothing is served

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: not touched
- [ ] Manual updated (`src/lib/manual/en.ts`) — n/a: not touched. The release record is for whoever runs releases, not a shelter user
- [ ] Translatable strings go through the translation path — n/a: repo documentation is English, as every other record is
- [ ] Mobile viewport (375px) — n/a: not a rendered surface
- [ ] Browser console clean — n/a: not a rendered surface
- [ ] Network clean — n/a: no request path changed

## 6. Regression

- [x] The pages nearest the change still work — the build compiles `src/` and passed; neither file is imported by anything
- [x] Any shared file touched checked from a second, unrelated page — `docs/release-handover.md` is the one file here that others read. Its three readers are human, and the two that point at it — `docs/release-procedure.md` §0 and `CLAUDE.md` — were re-read to confirm the rewritten file still answers what they send a reader there for: where things stand, what is in flight, and what not to re-derive
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing was merged in

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` — n/a: a release record is not a backlog item
- [ ] Non-obvious design choices added as a new file in `docs/decisions/` — n/a: no design choice here. The one judgement in the release — accepting the `0170` window — was Lutan's, made in chat before the cut, and is recorded in the record itself with its reasoning, which is where a release decision belongs
- [x] `README.md` still accurate — unchanged; it names no version and does not link either file
- [ ] **Release notes.** Would a shelter user notice this change? — n/a: two documentation files read only by whoever runs a release. Nobody using the app can see either
- [x] Commit messages say why, not just what — the record commit says what the record is for and which claims are measured rather than remembered
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** This is the whole of §4 for this PR: a release record is nothing but claims, and the measurement discipline is the feature

## 8. Pre-production gate

### Tested build

- [x] Tested SHA recorded in the header — `7928bd7a`, the release this documents
- [ ] Deployed SHA matches the tested SHA — n/a: this PR ships no code and is not deployed. `0.23.0` went out at `7928bd7a` before it was written

### On the deployed build

- [ ] Deployed to test — n/a: documentation only. The release it records was deployed to test at `7928bd7a`, which the record states
- [ ] Smoke-tested on `test.lannacare.org` — n/a: nothing in this PR reaches a browser
- [ ] Timezone-sensitive behaviour proved — n/a: the file's dates are literal strings. The times quoted are UTC and labelled `Z`, taken from the deploy log and the mail header rather than computed
- [ ] For a boundary or banding change — n/a: no boundary in this PR
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** — the gates block below, and every quoted block in the record itself
- [ ] Public pages re-checked after a cache purge — n/a: no public page changed. The edge-cache check that *was* run belongs to the release and is in the record

### Deploy safety

- [ ] Project ref and `strip-baked-env` lines read — n/a: this PR ships no code and runs no deploy. Both lines were read during the release itself and are quoted in the record
- [ ] Any new secret or env var exists in production — n/a: none added

### Migration ordering

- [ ] Migration ordering — n/a: no migration in this PR

### Rollback

- [x] Rollback position stated, **including what it does not cover** — `git revert` of this PR, which removes a record and restores the previous handover. It covers nothing operational: `0.23.0` is already live at `7928bd7a`, and reverting this PR would not change a single deployed byte. That is the point of recording a release in its own PR after the deploy

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | low | The cut PR's description says fifteen of 22 plans are `pending:`; the true figure at the release SHA is **seventeen of 24**, because #490 merged and the cut's own plan was added after that sentence was written | **fixed in the record and the handover**, both of which say seventeen, and explained in §4 so the difference is not read as a contradiction. The PR body is left as written — it was true when written, and editing a merged description would hide the change rather than record it |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | That the record matches Lutan's own experience of the release — particularly the `0170` window section, since the decision described there was his | `docs/releases/2026-10-09.md` |
| 2 | That the handover tells the next release manager what they actually need, and that nothing important was dropped when it was rewritten wholesale | `docs/release-handover.md` |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (release manager session)  Date: 2026-10-09

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: the list is not empty and only the person who looks may tick this line, so it stays unticked; the signature below names what is outstanding

Manual verification by: pending: Lutan reading the record, in particular whether the `0170` window section matches the decision he actually made, and the rewritten handover

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager — this session is the release manager

Result: pass with accepted defects
