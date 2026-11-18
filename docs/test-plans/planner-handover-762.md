# Feature test plan


---

## Header

| | |
|---|---|
| Feature | Planner handover, edition `762` |
| Backlog item | none — a planner document. `/plan-day` step 8 asks for it when the merged-stream count reaches nine; **Lutan asked for it at eight** |
| Branch / worktree | `claude/planner-handover-762` @ `C:DevelopmentAnimal_Shelter_planner-handover-762` |
| Dev server | n/a |
| PR | pending: created after this commit |
| Tested by / date | Claude / 2026-11-18 |
| Carries a migration? | no |
| Tested at SHA | `4bc5392ce` |

## 1. Scope and risk

**One sentence:** replace `docs/planner-handover.md` with edition `762`, which covers the **eight streams
merged since `761`** (#1698-#1705) and reports a figure for every one of them.

**One file changed, and nothing executable.** All changes in `docs/planner-handover.md`.

**THE ONE THING A REVIEWER SHOULD KNOW, SAID RATHER THAN HIDDEN: it is 219 lines against the ~150-line
target** Lutan set on 2026-10-20. **It was 251 and was trimmed once**, on the principle the skill states
for itself — *cite, do not copy back in* — so Part 12, the multi-tenancy audit and the production reads
now point at their backlog items (`#egq18`, `#ykefa`, `#ukncl`, `#pirow`) instead of repeating them.
**What was NOT trimmed, and why:** the cadence change, the three-times reading fault and the figures
table. **Those are the three things that stop a repeat**, and an eight-stream figures table costs about
18 lines on its own. **Predecessor `761` ran to 231 lines and said the same thing about itself**, so this
is the second consecutive edition over target — **worth the next planner's attention as a trend rather
than as one document's excess.**

**Out of scope:** no change to `docs/release-handover.md` (the other document that decision covers, and
it is the release manager's), and **no change to `SKILL.md`** — including the band-table recommendation
this edition makes, **which is deliberately a recommendation and not an edit**, because the same two rows
were already changed once today by PR #1701.

- [x] Change is described in one sentence, and it matches what `/plan-day` step 8 asked for
- [x] Files/areas touched listed — one file, `docs/planner-handover.md`
- [x] Cards affected identified — **none: a planner document.** No card, role, login or app surface is touched, so admin and the signed-out public are unaffected
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised — above

## 2. Automated gates

Run in the feature worktree, after `node scripts/worktree.mjs sync`, with
`node scripts/gates.mjs`. It runs all four gates even when one fails, prints each one's own exit code,
and refuses to start on a half-installed `node_modules`.

**Tick these on the exit code, not on output that looks plausible.** Two ways a gate reads green without
having run: `npm run build | tail` reports the exit status of `tail`, not of the build; and in a worktree
where `npm ci` has not finished linking `node_modules/.bin`, every script fails with "'next' is not
recognized" — which scrolls past as noise. **A gate ticked because nothing looked wrong is worse than one
left unticked, because it is indistinguishable from one that passed.**

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (`Already up to date`, then pushed)
- [x] `node scripts/gates.mjs` four gates, read from the output file rather than from the terminal

```
=== gates: typecheck — npm run typecheck
=== gates: typecheck exited 0 after 160s
=== gates: lint — npm run lint
=== gates: lint exited 0 after 262s
=== gates: test — npm test
=== gates: test exited 0 after 48s
=== gates: build — npm run build
=== gates: build exited 0 after 175s
gates: typecheck=0 lint=0 test=0 build=0
```

- [x] **Every figure in the edition was read from a merged PR's `stream-usage:` comment, not from a live session** — eight of them, across PRs #1698-#1705. **Durable by design:** `gh pr view <n> --json comments` answers from a merged PR whose branch and worktree are gone, which is what makes the once-a-day measurement slot safe
- [x] **The eight PRs the edition claims to cover were listed from `gh`, not from memory** — `gh pr list --state merged` filtered on `mergedAt` after `761`'s own merge, which is also how a fresh chat is told to recover the count
- [x] **Each stream's dials were compared with the `@dials` on its band before any figure was counted** — all eight match (`sonnet-5-5`/`low`). The comment prints `model=claude-sonnet-5-5` and the band says `@sonnet-5-5`; **that is the full id against the short name, not a mismatch**, and the edition says so because discarding eight valid figures over it would be the easy mistake
- [x] **#1698 is excluded on its own report (`rescoped=yes`) rather than on the planner's judgement**, and the edition says plainly that nothing in the record explains the rescope instead of inventing a reason
- [x] **The three corrections the edition claims were each verified against the file, not the item** — `--prove-red` exists at `scripts/check-tenancy-canary.mjs` lines 37-41; `scripts/connect-shelter-drive.mjs` exists; `scripts/check-no-cache-apis.mjs` does **not** exist and `scripts/check-next-cache-apis.mjs` does. **Each was an `ls` or a `grep`, which is the fault this edition's third section is about**
- [ ] CI green on the PR — pending: read on the PR's own run, against this head commit, immediately before the merge

## 3. Schema and data — *skip if no migration*

Per `CLAUDE.md`, schema lands as its own PR before the feature.

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: one markdown file; no schema
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: one markdown file; no schema
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: one markdown file; no schema
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: one markdown file; no schema
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: one markdown file; no schema
- [ ] Existing rows still read correctly after the change — n/a: one markdown file; no schema
- [ ] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — n/a: one markdown file; no schema
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: one markdown file; no schema
- [ ] Production apply plan stated for the release manager — n/a: one markdown file; no schema

## 4. Functional checks

- [ ] Happy path works end to end — n/a: a document; it has no behaviour to exercise
- [ ] Data persists — reload the page and the change is still there — n/a: a document; no app surface
- [ ] Create / edit / delete all exercised — n/a: a document; no app surface
- [ ] Empty state renders sensibly — n/a: a document; no app surface
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: a document; no input
- [ ] Boundary cases checked — n/a: a document; no input

### Role access matrix

Analyse by CARD, not by role (`CLAUDE.md`, *All analysis is by CARD, never by role*).

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| n/a | n/a | n/a | n/a |

- [ ] Every login above tested — n/a: a repository document, not an app surface. No login can reach it and none is affected
- [ ] A login that should not have access is blocked server-side — n/a: a repository document, not an app surface

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no app surface
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: the manual is for shelter users; this is a planner document
- [ ] Translatable strings go through the translation path — n/a: no user-facing string
- [ ] Mobile viewport (375px) — n/a: no app surface
- [ ] Browser console clean — n/a: no app surface
- [ ] Network clean — n/a: no app surface

## 6. Regression

- [x] The pages nearest the change still work — **n/a as a page check, but the equivalent WAS done: `main`'s copy of the document is replaced wholesale, and the four gates ran green on the result**, which is the only runtime this file has
- [ ] Any shared file touched checked from a second, unrelated page — n/a: no shared file; one document that nothing imports
- [x] Nothing merged from `main` during `sync` was broken by this branch — `sync` reported `Already up to date`, so nothing came in

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` — n/a: a planner document closes no backlog item. The items this plan's streams closed were ticked in their own PRs
- [ ] Non-obvious design choices added as a new file in `docs/decisions/` — n/a: **the handover IS the record.** Its band recommendation names its readings in the document itself, where the next planner reads it
- [x] `README.md` still accurate — it does not describe the handover
- [ ] **Release notes.** — n/a: a planner document; no shelter user would notice
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and the document were measured, not reasoned.** **This edition's third section is entirely about the opposite failure**, so it would be a poor place to commit it: every figure came from a PR comment, every file claim from an `ls` or a `grep`, the merged-PR list from `gh`, and the one inference made during the day (that a PR had merged, read off a file on disk) is written up in the document as a fault even though it happened to be correct

## 8. Pre-production gate

Owned jointly with the release manager. **The three hosts, as they stand since 2026-11-08:**

| Host | What it is | Database |
|---|---|---|
| `lannacareforanimals.org` | **production** | `dbkodyyxxhtygxcxmfcu` |
| `test.lannacare.org` | **test** | the **dev** project, `qxkmhwybjggxvsfxsxbd` |
| `uat.lannacare.org` | **UAT**, the customer's acceptance-test site | its own project, on a second Supabase account |

**`lannacare.org` is a 301 to production and is a check of nothing.**

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — n/a: no deploy; a document with no app change
- [ ] Deployed SHA matches the tested SHA — n/a: no deploy; a document with no app change

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — n/a: no deploy; a document with no app change
- [ ] Smoke-tested on `test.lannacare.org` — n/a: no deploy; a document with no app change
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour** — n/a: no logic. **One date-shaped caveat worth stating anyway: the edition's own date came from the system clock and was compared with its predecessor's, as its first-turn instructions demand of its reader**
- [ ] **For a boundary or banding change, the assertions cover both edges** — n/a: no code boundary in this PR. **But the banding content of this document is exactly a boundary claim**, and it is handled the way this line asks: the recommendation names the three readings below 143k **and** the sixteen the raised bottoms were set from, rather than only the cases that moved
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** — the gates block above is the file's contents as `gates.mjs` wrote it
- [ ] Public pages re-checked after a cache purge — n/a: no deploy; a document with no app change

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — n/a: no deploy
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen — n/a: no deploy
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: no new secret. **`SUPABASE_CANARY_TOKEN` was created today, but it is a repository secret for a GitHub workflow, not a Cloudflare environment variable, and it was created by Lutan rather than by this PR**

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: neither
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — n/a: no migration
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — n/a: no migration
- [ ] Apply plan stated — n/a: no migration. **One note for the release manager that is NOT this PR's: `0411` and `0412` reached `main` today and need applying in that order with the next release; nothing reads them, so there is no ordering risk against the deploy**

### Rollback

- [ ] Rollback position stated, **including what it does not cover** — n/a: no deploy. **The rollback for this change is `git revert`, and the edition it replaces stays in history; a wrong line in a handover is corrected by its successor rather than reverted, which is the decision of 2026-10-21 that put these on merge-on-green**

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | The edition is 219 lines against the ~150 target, after one trim from 251 | **accepted, and stated in §1 and in the PR** — the second consecutive edition over target, flagged as a trend for the next planner |

## Left for manual verification

Anything above that Claude could not honestly verify, listed here so it is a short, concrete handover
rather than a vague "please check it". Empty is a valid answer when the change has no surface a person
needs to look at.

**Do not repeat a section 8 deploy-time check here.**

| # | What to check | Where |
|---|---|---|
| | | |

## Sign-off

Two signatures, because they certify different things and neither covers the other. A sign-off line that
does not correspond to someone having actually looked is worse than no sign-off, because it turns an
unknown into a false assurance.

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-18

### Manual verification


A red `test-plan` that says what it is waiting for is a red people act on. An illegible one is a red
people learn to ignore.

- [x] The manual list above is empty; n/a below

Manual verification by: n/a: a planner document. Lutan has never reviewed a handover, and the decision of 2026-10-21 that put these on merge-on-green says why: it outranks nothing, one chat reads it, and a wrong line is corrected by its successor

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [ ] Handed to the production release manager — n/a: no deploy; a planner document only

Result: pass

Release manager acknowledgement: n/a: no release
