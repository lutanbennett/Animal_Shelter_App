# Feature test plan

| | |
|---|---|
| Feature | Planner handover edition `510`, plus three promotions into the `plan-day` skill |
| Backlog item | `docs/backlog.md` → none. The handover is a step of the `/plan-day` skill (step 8), not a backlog item |
| Branch / worktree | `claude/planner-handover-510` @ `C:\Development\Animal_Shelter_planner-handover-510` |
| Dev server | `n/a: no runtime surface — two Markdown files` |
| PR | #1121 |
| Tested by / date | Claude (Daily Planner session) / 2026-10-30 |
| Carries a migration? | no |
| Tested at SHA | `a2ee5232` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — rewrites `docs/planner-handover.md` as edition `510` (a delta over `501`) and promotes three durable facts into `.claude/skills/plan-day/SKILL.md`. No backlog item: `/plan-day` step 8 requires it at nine streams, and `.plan-day.md` recorded nine. Lutan asked for it in chat: *"yes write the handover now and merge it"*
- [x] Files/areas touched listed — exactly three: `docs/planner-handover.md` (rewritten, 139 lines), `.claude/skills/plan-day/SKILL.md` (+29 lines, three insertions, nothing deleted) and this plan. No routes, no `worker/`, no `supabase/migrations/`, no shared libs
- [ ] Roles affected identified — `n/a: no role sees either file. Both are read by Claude sessions, not served by the app`
- [x] Anything explicitly **out of scope** written down — the handover does **not** carry open item counts, migration numbers, PR numbers or release state; those are re-read from the repo every run by the skill's own rule. It also does not restate `.plan-day.md`'s measurement table. **Batch 3's three figures are deliberately absent**: it was set up at the end of the round and has merged nothing, so there is nothing to record and the next planner captures them

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — ran before gates; `origin/main` merged in and pushed
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 test=0 build=0`. Pasted below exactly as printed:

```
=== gates: build exited 0 after 192s

gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — `n/a: not yet — the PR does not exist at this commit`

## 3. Schema and data

- [ ] Migration number is one above the highest on `main` — `n/a: no migration in this PR`
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — `n/a: no migration in this PR`
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — `n/a: no migration in this PR`
- [ ] Applied to **dev** and recorded in `schema_migrations` — `n/a: no migration in this PR`
- [ ] File is re-runnable — `n/a: no migration in this PR`
- [ ] Existing rows still read correctly after the change — `n/a: no migration in this PR, and no table is read`
- [ ] **Constraints and defaults exercised against real rows** — `n/a: no migration in this PR`
- [ ] Down-migration written, or the reason one is not needed is stated — `n/a: no migration in this PR`
- [ ] Production apply plan stated for the release manager — `n/a: no migration in this PR`

## 4. Functional checks

- [x] Happy path works end to end — the happy path for a handover is that a fresh planning chat can read it and act on it. Verified by reading `docs/planner-handover.md` back after writing: it opens with what changed since `501`, carries each of that edition's five promotions as fired or held, names the next slug (`519`), and carries the never-carried-forward block
- [x] Data persists — reload the page and the change is still there — read back from disk after the write; `wc -l` reports 139 lines, and `git diff --stat` shows the two files
- [ ] Create / edit / delete all exercised — `n/a: no CRUD surface — two Markdown files`
- [ ] Empty state renders sensibly — `n/a: no rendered surface`
- [ ] Invalid input is rejected with a readable message, not a crash — `n/a: no input surface`
- [x] Boundary cases checked — the one boundary this change has is the skill's **length target** for a handover: *about 100 lines, 150 a target not a hard gate, up to about 160 is fine, ship it*. **Measured with `wc -l` after the content was written, not claimed first: 139.** Comfortably inside, so no trimming pass was opened — which is the point of the rule, since trimming passes are what the budget exists to prevent

### Role access matrix

`n/a` for every row: neither file is served by the app or reachable by any URL, so there is no access to matrix. Recorded as a table rather than deleted so the shape of the plan is comparable with its neighbours.

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | neither file | n/a — not served by the app | n/a |
| management | neither file | n/a — not served by the app | n/a |
| staff | neither file | n/a — retired role, and not served anyway | n/a |
| doctor | neither file | n/a — not served by the app | n/a |
| volunteer | neither file | n/a — not served by the app | n/a |
| signed out | neither file | n/a — not served by the app | n/a |

- [ ] Every role above tested — `n/a: neither file is served by the app, so no role can reach either`
- [ ] A role that should not have access is blocked server-side — `n/a: no route exists to hit directly`

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — `n/a: not touched, and these files have no nav entry`
- [ ] Manual updated (`src/lib/manual/en.ts`) — `n/a: the manual is for shelter staff; these two files are read by Claude sessions`
- [ ] Translatable strings go through the translation path — `n/a: no user-facing strings added`
- [ ] Mobile viewport (375px) — `n/a: no rendered surface`
- [ ] Browser console clean — `n/a: no page loads`
- [ ] Network clean — `n/a: no page loads`

## 6. Regression

- [x] The pages nearest the change still work — the nearest thing to a "page" is the skill itself, which is parsed by the harness when `/plan-day` is invoked. **Checked that the three insertions did not break its structure:** each landed inside the section it was anchored to, the fenced brief block that one of them extends still opens and closes with its ``` fences, and the new `###` heading sits at the same level as its neighbours in step 7
- [x] Any shared file touched checked from a second, unrelated page — `.claude/skills/plan-day/SKILL.md` is shared with every future planning session. **The real risk here is not a reading but the line endings:** the skill is **CRLF** and `docs/planner-handover.md` is **LF**, a trap the skill documents because it has already cost two editions. The edit script normalised to `\n`, matched, and **wrote the skill back as CRLF** (it printed `CRLF preserved: true`); verified with `git diff --stat`, which shows **29 insertions and no whole-file rewrite** — a CRLF/LF mistake would have shown every line as changed
- [x] Nothing merged from `main` during `sync` was broken by this branch — `sync` ran before gates, and gates ran clean on the merged tree

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** — `n/a: the handover has no backlog item; it is step 8 of the plan-day skill`
- [ ] Non-obvious design choices added as a new file in `docs/decisions/` — `n/a: the reasoning for each promotion is written into the skill at the point of use, and the round's reasoning IS this handover. A decision file would be a third copy`
- [x] `README.md` still accurate — unchanged by this PR and checked: it does not describe the handover documents or the skill's contents
- [ ] **Release notes.** — `n/a: a planner handover and a skill the shelter never sees; no shelter user could notice this change`
- [x] Commit messages say why, not just what — the commit names the round's subject (a PR body is a claim about the repo) and lists the three promotions with the reason each is durable, including that the band miss was my own scale column rather than a missing rule
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** Four claims in this PR are measurements, each taken rather than reasoned: the handover's **139 lines** (`wc -l`, after writing, not before); the **floor of ~102k** (batch 2's three `stream-usage` figures minus their own `Messages`: 101,932 · 102,268 · 102,366); the **six actuals and their verdicts** (read from each PR's `stream-usage` comment, not from `get_usage`); and the central finding that **`audit.ts` never got its writer** — established by reading the 50-line file, grepping it for `model` and `exchange` (no match) and running `git log -- src/lib/assistant/audit.ts`, which names `0b87dad2`, a version 1 commit. **That one is the whole subject of the edition, so it was proved three ways rather than asserted from the PR body that was wrong**

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — `deferred: production release manager`
- [ ] Deployed SHA matches the tested SHA — `deferred: production release manager`

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — `deferred: production release manager`
- [ ] Smoke-tested on `test.lannacare.org` — `deferred: production release manager`
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — `n/a: no date or time logic in either file`
- [ ] **For a boundary or banding change, the assertions cover both edges of the band** — `n/a: no runtime boundary. The one boundary here is a prose length target, measured in section 4`
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited.** — `n/a: the only pasted evidence is the gates closing lines in section 2, which are unedited`
- [ ] Public pages re-checked after a cache purge — `deferred: production release manager`

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — `deferred: production release manager`
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen — `deferred: production release manager`
- [ ] Any new secret/env var exists in the production Cloudflare environment — `n/a: this PR adds no secret or env var`

### Migration ordering

- [ ] **Does this PR contain both a migration and code that reads it?** — `n/a: no migration in this PR`
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — `n/a: no migration in this PR`
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — `n/a: no migration in this PR`
- [ ] Apply plan stated — `n/a: no migration in this PR`

### Rollback

- [x] Rollback position stated, **including what it does not cover** — both files are plain Markdown read only by Claude sessions, so rollback is `git revert` of this commit and nothing else: no deploy, no Pi rebuild, no migration, and nothing at runtime changes either way. **What it does not cover:** a planning session that has already read edition `501` and acted on it — reverting the file does not unmake the batch it planned. That is the normal state of any handover and is why the skill makes each edition correct the one before it rather than relying on revert

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | The first attempt to write `docs/planner-handover.md` used the `Write` tool directly and was refused, because the session had not read that file in this worktree. | fixed immediately, and **not a defect in the change**: the skill already prescribes the scratchpad-then-`cat` redirect for exactly this file, and that worked first time. Recorded only because the refusal looks like a failure in the transcript and is not one |
| 2 | low | The band for `assistant-llm-adapter` was wrong by 29%, the round's only miss. | **accepted, and written up as the edition's band section rather than fixed here.** The rule it broke (*reserve 250–320k for a stream with no existing piece to extend*) was already in the skill, so there is nothing to promote — the failure was not reading my own scale column. No code or document change closes that |

## Left for manual verification

**Empty, and deliberately so.** The template's test is *would a person have to go and look at it,
separately from deploying?* The only outstanding question about this PR is whether edition `501` reads
usefully to the next fresh planning chat — and **that is checked by the next `/plan-day`, which is a
Claude session, not by a person.** Neither file is served by the app or read by anyone at the shelter
(`CLAUDE.md`: a handover *"is read by one chat"*), so there is no screen, wording or device for anyone
to look at. Recorded here rather than parked as a `pending:` signature, because a `pending:` naming a
check no person will ever perform is a row nothing closes — which is exactly the permanently-open-row
fault the section above warns about.

| # | What to check | Where |
|---|---|---|
| | | |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (Daily Planner session)  Date: 2026-10-30

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person — it is empty, for the reason given above, so there is nothing being signed for

Manual verification by: n/a: nothing for a person to look at — both files are read by Claude sessions, and neither is served by the app

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager

Result: pass

Release manager acknowledgement: n/a: docs-only, nothing to deploy
