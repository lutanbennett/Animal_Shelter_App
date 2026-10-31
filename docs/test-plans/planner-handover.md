# Feature test plan

## Header

| | |
|---|---|
| Feature | Planner handover, edition `528` |
| Backlog item | `docs/backlog.md` → none. The handover is process bookkeeping required by `.claude/skills/plan-day/SKILL.md` step 8 at nine streams since the last edition, not a backlog item |
| Branch / worktree | `claude/planner-handover-528` @ `C:\Development\Animal_Shelter_planner-handover-528` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3006` (not started — no code changed) |
| PR | see the PR this plan is pasted into |
| Tested by / date | Claude (Daily Planner session) / 2026-10-31 |
| Carries a migration? | no |
| Tested at SHA | `16959bad` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — **rewrites `docs/planner-handover.md` from edition `519` to `528`**, as the skill requires at nine streams; the one-sentence description is the commit subject
- [x] Files/areas touched listed — **`docs/planner-handover.md` only.** No routes, no `worker/`, no `supabase/migrations/`, no shared libs. `git show --stat` is one file
- [x] Affected access identified — **none, and stated by card rather than by role** (`CLAUDE.md`: roles are a transient grouping of cards, so a finding written per role would stop being true the next time the card sets are rebuilt). **No card grants access to this file and none could:** `docs/` is not served by the app, so there is no page, no route and no action to gate. Admin is outside the card system and equally unaffected
- [x] Anything explicitly **out of scope** written down — out of scope: `CLAUDE.md`, the `plan-day` skill, `docs/backlog.md` and `.plan-day.md`. The handover **outranks none of them** and says so in its own opening lines. The facts it recommends be promoted into the skill are named in it as recommendations and were deliberately **not** applied here, because editing the skill changes the behaviour of every future session and belongs in its own reviewed PR

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly and the branch pushed
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 test=0 build=0`. Paste its closing `gates:` lines below exactly as printed:

```
=== gates: build exited 0 after 157s

gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration. The highest on `main` is `0294` and `0295` is owned by the `assistant-record-card` stream this batch; this branch must not claim it
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly after the change — n/a: no migration, and this change reads and writes no database at all
- [ ] **Constraints and defaults exercised against real rows** — n/a: no migration
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration. The rollback for a document is `git revert`
- [ ] Production apply plan stated for the release manager — n/a: no migration. **Separately and for the record, because this round measured it:** production is **six** migrations behind (`0289`–`0294`), which is the release manager's work and not this PR's

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no runtime behaviour. The file's only consumer is a person or a future Claude session reading it from the repository
- [ ] Data persists — n/a: no runtime behaviour, nothing is written
- [ ] Create / edit / delete all exercised — n/a: no runtime behaviour
- [ ] Empty state renders sensibly — n/a: no runtime behaviour
- [ ] Invalid input is rejected with a readable message — n/a: no runtime behaviour, no input
- [ ] Boundary cases checked — n/a: no runtime behaviour. The one measurable property of this file is its length, checked below under section 7

### Access matrix — *by card, not by role*

| Card | Can reach | Expected | Result |
|---|---|---|---|
| any card in the catalogue | nothing | `docs/` is not served by the app, so no card can grant or deny access to it | n/a: repository document |
| no card at all | nothing | as above | n/a: repository document |
| signed out | nothing | as above | n/a: repository document |
| Admin (outside the card system) | nothing | the `perms.isAdmin` short-circuit answers before any cell is read, and there is still no route here to reach | n/a: repository document |

- [ ] Every row above tested — n/a: there is no URL for any login to reach, so there is nothing to drive. **This table is deliberately card-shaped rather than a list of roles**, per `CLAUDE.md`
- [ ] Access that should be refused is blocked server-side — n/a: no route exists to block. **The real access question for this file is that the repository is PUBLIC**, and it is answered under section 7: the document names no real person, quotes no personal data and carries no credential or token

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: not touched, no page added
- [ ] Manual updated (`src/lib/manual/en.ts`) — n/a: not touched, and deliberately so — the `assistant-manual-topic` stream owns `src/lib/manual/` this batch and was told so by name
- [ ] Translatable strings go through the translation path — n/a: a developer document, never shown to a shelter user and never translated
- [ ] Mobile viewport (375px) — n/a: no UI surface
- [ ] Browser console clean — n/a: no UI surface, no browser involved
- [ ] Network clean — n/a: no UI surface

## 6. Regression

- [x] The pages nearest the change still work — **checked by `build`, which compiled every route from a tree containing this change and exited 0.** There are no "pages nearest" a document in `docs/`
- [ ] Any shared file touched checked from a second, unrelated page — n/a: no shared file touched. The one file changed is imported by nothing — `grep -rn "planner-handover" src/ worker/` finds no reference; it is read by people, not by code
- [x] Nothing merged from `main` during `sync` was broken by this branch — `sync` merged `origin/main` in cleanly and the gates above passed afterwards, on the merged tree

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** — n/a: this closes no backlog item. The handover is required by the skill at a stream count, and `CLAUDE.md` is explicit that the two handover documents are bookkeeping rather than reviewed work. **Three items WERE filed this round**, on the `backlog` branch where they belong, not here
- [ ] Non-obvious design choices added as a new file in `docs/decisions/` — n/a: no design choices. The document's own content is the record, and the facts it recommends promoting into the skill are named in it as recommendations for the next planner rather than as decisions taken here
- [x] `README.md` still accurate — unchanged by this PR and it makes no claim about the handover's contents
- [ ] **Release notes.** — n/a: no shelter user can see a planner document; it is read only by the next planning chat
- [x] Commit messages say why, not just what — the subject names the edition's subject and the body says what the round measured and why it matters
- [x] **Claims in commit messages and the document were measured, not reasoned.** Every token figure comes from a `stream-usage:` PR comment, read from the stream's own live process and quoted as recorded: **282,381 · 324,842 · 329,978** for batch 4, with the floor derived as `tokens − messages` and reading **103,245 on all three, identically**. The production figures were taken by running the checks, not inferred: `apply-migrations.mjs --status --env production` (**six pending**) and `check-production.mjs translations-open --env production` (**83 missing, 1 out of date**), each quoted with its date. **The claims that are NOT measured are labelled as such** — the ~15–20k-per-judgement rule is stated as a first test with the instruction to read the next round's figure against it, and the empty-table mechanism is stated as **deduced from the SQL, not measured against a row count**. The length figure (**153 lines**) was taken with `wc -l` after the final edit, not estimated
- [x] **The document names no real person and carries no credential**, which matters because this repository is public. It names Lutan (the repository owner, throughout the repo already), refers to his wife only as *the Thai reader* and to the Director by role, quotes no personal data, and contains no token, key or dev session snippet

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: production release manager
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: production release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: production release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: no date, time or clock logic anywhere in this change; it is prose in a markdown file
- [ ] **For a boundary or banding change, the assertions cover both edges** — n/a: no boundary, threshold, rounding rule, retry window, pagination limit or permission cutoff is changed in code. The token bands discussed in the document are advice to a future planner, not a runtime value
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.** The `gates:` block in section 2 is copied verbatim from the run, including its elapsed time
- [ ] Public pages re-checked after a cache purge — deferred: production release manager

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: production release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: production release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: no secret, no environment variable, no configuration added or read

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration and no code
- [ ] `--env production --dry-run` run and clean — n/a: no migration
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position stated, **including what it does not cover** — `git revert` of this one commit restores edition `519` exactly, and nothing else is affected: no schema, no deployed artefact, no Worker bundle, no Pi build. **What it does not cover:** nothing at runtime. This file is read by people and imported by no code. **It also does not need a deploy to take effect** — the next planning chat reads the file from the repository. The one real consequence of reverting would be that the next planner works from `519`, whose four-overrun diagnosis this edition supersedes

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | minor | First draft measured **153 lines** against the skill's ~150 target, so **no trimming pass was opened** — the skill is explicit that a little over is fine, that the lever on length is cutting content rather than rewording, and that accuracy is never traded for the number. Recorded because four editions in a row stated a length they had not measured, and this one measured it with `wc -l` before stating it | accepted — within the stated tolerance, and opening a round-trip to save three lines is the cost the target exists to prevent |
| 2 | minor | A planner error from the previous round is reported **in the document rather than fixed here**: a brief told a stream to run `dev-signin.mjs --cards website.gallery`, which is an **activity** name where a **card key** (`website_photos`) was needed. The stream read the script's refusal, corrected it and drove the negative case properly, so nothing shipped wrong | fixed, but not in this PR — the durable fix is in all three of batch 5's briefs, which now say `--cards` takes card keys; the document records it so the next planner does not repeat it |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | nothing | — |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (Daily Planner session)  Date: 2026-10-31

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person

Manual verification by: n/a: a planner document with no UI surface, read only by the next planning chat; `CLAUDE.md` records that Lutan has never reviewed a handover and that asking him to merge one made a gate out of bookkeeping

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager — n/a as a gate, and stated for the record: this PR ships no code, so there is nothing for the release manager to deploy or verify. It merges on green CI without an approval round-trip, by `CLAUDE.md`'s rule covering the two handover documents

Result: pass with accepted defects

Release manager acknowledgement: n/a: no code ships in this PR, so there is nothing to deploy
