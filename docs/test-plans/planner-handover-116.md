# Feature test plan

## Header

| | |
|---|---|
| Feature | `docs/planner-handover.md` rewritten after eleven workstreams, for the next `/plan-day` chat |
| Backlog item | `docs/backlog.md` → n/a: no backlog item. The rewrite is required by `.claude/skills/plan-day/SKILL.md` §8 at nine or more workstreams since the last one, and by `docs/decisions/2026-10-08-planner-handover-counter.md` |
| Branch / worktree | `claude/planner-handover-116` @ `C:\Development\Animal_Shelter_planner-handover-116` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3013` — not started; this PR has no runtime surface |
| PR | recorded in the follow-up commit, once it exists |
| Tested by / date | Claude (Daily Planner session) / 2026-10-13 |
| Carries a migration? | no |
| Tested at SHA | `52a76b23` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — one file, `docs/planner-handover.md`, replaced with a snapshot written at eleven workstreams; it matches the skill's §8 instruction to rewrite it in the chat that still holds the context
- [x] Files/areas touched listed — **exactly one file**: `docs/planner-handover.md`. No `src/`, no `worker/`, no `supabase/migrations/`, no scripts, no other docs
- [x] Roles affected identified: **none.** This is a note for a future Claude planning session; it is invisible to admin, management, second_in_command, head_of_maintenance, head_of_medical, doctor, volunteer, public_viewer and signed-out alike
- [x] Anything explicitly **out of scope** written down — the file deliberately does **not** re-verify the *items whose remaining condition is a person* list (it says so in the text, so the next planner checks rather than trusts), does not restate `CLAUDE.md`'s rules, and does not touch `.plan-day.md`, which is gitignored local state

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (`Already up to date`, then pushed)
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Actual closing lines, as printed:

```
=== gates: build exited 0 after 341s

gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration in this PR
- [ ] `--status` reviewed before applying — n/a: no migration in this PR
- [ ] `--dry-run` reviewed — n/a: no migration in this PR
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: no migration in this PR
- [ ] File is re-runnable — n/a: no migration in this PR
- [ ] Existing rows still read correctly after the change — n/a: no migration, and this PR reads no table
- [ ] Constraints and defaults exercised against real rows — n/a: no migration, no constraints added
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration in this PR
- [ ] Production apply plan stated for the release manager — n/a: no migration in this PR

## 4. Functional checks

- [x] Happy path works end to end — the happy path is that a fresh `/plan-day` chat reads the file and does not have to re-derive the day. Checked by reading it back whole after committing and walking the skill's own "read these first, in this order" list against it: each of the five pointers resolves (`CLAUDE.md`, `SKILL.md`, `.plan-day.md`, this file, `docs/architecture-review-2026-09-22.md`)
- [x] Data persists — read back from disk at `52a76b23` after committing
- [ ] Create / edit / delete all exercised — n/a: a Markdown document; nothing creates, edits or deletes it at runtime
- [ ] Empty state renders sensibly — n/a: no rows, no UI
- [ ] Invalid input is rejected with a readable message — n/a: no input path; nothing parses this file
- [ ] Boundary cases checked — n/a: no values or arithmetic. **The figures in it were copied from measurements, not computed here** — see §7's last line

### Role access matrix

n/a for every row: this PR touches no route, component, policy or query. Nothing a signed-in or signed-out person can reach changes. Left unfilled deliberately rather than filled with invented results.

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | nothing new | no change | n/a: no runtime surface |
| management | nothing new | no change | n/a: no runtime surface |
| staff | — | — | n/a: role retired by `0173` |
| doctor | nothing new | no change | n/a: no runtime surface |
| volunteer | nothing new | no change | n/a: no runtime surface |
| signed out | nothing new | no change | n/a: no runtime surface |

- [ ] Every role above tested — n/a: no role can reach anything this PR changes; the file is read by a Claude session, not served
- [ ] A role that should not have access is blocked server-side — n/a: nothing is served from the changed file

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: untouched, no nav entry added
- [ ] Manual updated (`src/lib/manual/en.ts`) — n/a: untouched. The manual is for shelter staff; this is a note to a planning session and answers no shelter user's question
- [ ] Translatable strings go through the translation path — n/a: no user-facing strings
- [ ] Mobile viewport (375px) — n/a: no page renders this
- [ ] Browser console clean — n/a: no page renders this
- [ ] Network clean — n/a: no requests involved

## 6. Regression

- [x] The pages nearest the change still work — `node scripts/gates.mjs` passed all gates on the branch, which is what proves the repo is unharmed; nothing imports or parses `planner-handover.md`
- [x] Any shared file touched checked from a second, unrelated page — **the file IS the shared artifact**, and its readers are the skill and future chats rather than pages. Checked the other direction: `grep -rn "planner-handover" docs/ .claude/ CLAUDE.md` — the references are `SKILL.md` §8, `docs/decisions/2026-10-08-planner-handover-counter.md` and the file's own self-references. **The filename and path are unchanged**, so every reference still resolves
- [x] Nothing merged from `main` during `sync` was broken by this branch — `sync` reported `Already up to date`; the branch is one commit on top of `main` at `e95e6bbb`

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** — n/a: this closes no backlog item. The rewrite is a standing instruction in the skill, not a backlog entry; searched `docs/backlog.md` for *handover* and found only the release handover's own items
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — **n/a is not right here, and nor is a new file:** the two decisions this chat made are already recorded, each in its own file — `docs/decisions/2026-10-13-the-finish-line-is-an-open-pr.md` (in #583) and `docs/decisions/2026-10-13-who-and-where-for-all-residents-readers.md` (in #584). **This handover cites both rather than restating them**, which is what the file is for. Ticked because the obligation is met, not waived
- [x] `README.md` still accurate — checked: it does not describe the handover's contents, so nothing in it is now wrong
- [ ] **Release notes.** — n/a: no shelter user could notice this. It is an internal note for a future Claude planning session; no page, component, dictionary, manual topic or Worker code is touched
- [x] Commit messages say why, not just what — the commit lists what the file carries that **only this chat knew**, item by item, which is the whole justification for rewriting it in this chat rather than the next one
- [x] **Claims in commit messages and decisions were measured, not reasoned.** Every load-bearing figure in the handover was read in this chat, not recalled: the six token actuals (127,677 · 129,178 · 136,307 · 121,974 · 210,290 · 230,891) from `get_usage`, with model and effort from `get_session`; the three `unmeasured` ones from `get_usage` actually returning *unavailable*, tried rather than assumed; `main` at `e95e6bbb`, 193 applied / 0 pending from `apply-migrations.mjs --status`, 94 open items from an `awk` count, three `unreleased` lines from the file; the floor's categories from the same `get_usage` payloads, including memory files at 10,463; `min-h-11 min-w-11 … md:min-h-9` read from `src/app/AccountMenu.tsx:68`; the Pi crontab and its 03:00 Tuesday run read over SSH. **Stated as a limit rather than a measurement:** that Sonnet/low is adequate — 37 streams under band is consistent with it, but the briefs improved over the same period, so the model cannot be credited, and the file says so in those words

## 8. Pre-production gate

### Tested build

- [x] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — `52a76b23` recorded; it is the branch tip. **Not yet the tip of `main`**, which is correct at PR time
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: production release manager. **This PR changes no deployable artifact** — one `docs/` file
- [ ] Smoke-tested on `test.lannacare.org` — deferred: production release manager. There is no behaviour on the deployed build to smoke-test
- [ ] Timezone-sensitive behaviour proved — n/a: no dates are computed. The file quotes fixed dates and one clock time (the Pi's 03:00 Tuesday run), all read from output rather than derived
- [ ] Boundary or banding change assertions — n/a: no threshold, rounding rule, retry window, pagination limit or permission cutoff is touched. **The token "bands" in the file are documentation of past measurements, not code**
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** — the `gates:` block in §2 is copied exactly as printed
- [ ] Public pages re-checked after a cache purge — n/a: no public page changes

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref matches production — deferred: production release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: production release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: this PR adds no secret and no env var

### Migration ordering — *skip if no migration*

- [ ] Does this PR contain both a migration and code that reads it? — n/a: no migration, and no code
- [ ] `--env production --dry-run` run and clean — n/a: no migration in this PR
- [ ] Production backup fresh for a destructive migration — n/a: no migration in this PR
- [ ] Apply plan stated — n/a: no migration in this PR

### Rollback

- [x] Rollback position stated, **including what it does not cover** — rollback is `git revert` of this one commit, which restores the 2026-10-12 handover. **What it does not cover:** nothing, in the technical sense — no schema, no deployed artifact. **What it would cost:** the eleven workstreams' findings exist nowhere else once this chat closes, so a revert loses them rather than returning to a good state. That is an argument for correcting the file rather than reverting it

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| — | — | None found | — |

## Left for manual verification

The file's job is to be *useful to the next chat*, and whether it reads that way is a judgement. Everything else here is mechanical or n/a.

**Note what is NOT listed here:** the handover's *items whose remaining condition is a person* list is carried forward unverified **on purpose**, and the file says so in its own text. Those are not this PR's handover items; listing them here would give them a second home that nothing ever closes.

| # | What to check | Where |
|---|---|---|
| 1 | That the handover reads as a usable briefing rather than a diary — in particular that the invisible-PR rule and the "do not re-argue the dials" section are findable by someone who has not read this chat | `docs/planner-handover.md`, the two sections headed *THE BIGGEST FINDING OF THE DAY* and *Answered and closed* |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (Daily Planner session)  Date: 2026-10-13

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: the list is not empty; item 1 is a judgement about whether the writing is useful, and only a reader can make it

Manual verification by: pending: that the handover reads as a usable briefing to someone who has not read this chat (item 1 above)

### Result

- [x] Open defects are either fixed or explicitly accepted above — none found
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: nothing to deploy; it reaches the release manager with whichever release carries the commit

Result: pass

Release manager acknowledgement: n/a: not yet — the release manager reads this when the release is cut
