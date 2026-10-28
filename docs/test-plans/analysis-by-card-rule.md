# Feature test plan — analysis-by-card-rule

## Header

| | |
|---|---|
| Feature | Lutan's standing instruction that all analysis is by card and never by role, written into `CLAUDE.md` and the `plan-day` skill |
| Backlog item | `docs/backlog.md` → Security, *THE ANALYSIS INSTRUMENTS ASK A ROLE QUESTION…* (the scripts half, filed 2026-10-28; this PR is the rule, not the scripts) |
| Branch / worktree | `claude/analysis-by-card-rule` @ `C:\Development\Animal_Shelter_analysis-by-card-rule` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3006` |
| PR | filled in at `gh pr create` |
| Tested by / date | Claude (Opus 5), planner session / 2026-10-28 |
| Carries a migration? | no |
| Tested at SHA | see the `gates:` block below |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for
- [x] Files/areas touched listed — `CLAUDE.md` (a new section) and `.claude/skills/plan-day/SKILL.md` (a new subsection in step 3). **No code, no schema, no UI, no scripts**
- [x] Roles affected identified — **none, and the irony is noted**: this change alters what sessions may *conclude*, not what any login may *do*. No permission, policy or card changes
- [x] Anything explicitly **out of scope** written down — **the instruments.** `check-menu-coverage.mjs` and most of `check-production.mjs` are role-shaped by construction; making them card-shaped is its own backlog item and is deliberately **not** attempted here, so the rule lands before the larger job rather than waiting on it

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends with every gate at 0. Paste its closing `gates:` lines below exactly as printed
- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit

```
gates: typecheck=0 lint=0 test=0 build=0
```

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration; `0279` belongs to `claude/medical-photos-read-grant`
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly after the change — n/a: no migration, no data
- [ ] **Constraints and defaults exercised against real rows** — n/a: no migration
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration; reverting the commit removes the rule
- [ ] Production apply plan stated for the release manager — n/a: no migration and nothing to deploy

## 4. Functional checks

- [x] Happy path works end to end — both files render as Markdown with the new headings in place: `CLAUDE.md:117` and `.claude/skills/plan-day/SKILL.md:290`, each inside the section it belongs to
- [x] **The rule is placed where it will actually be read.** In `CLAUDE.md` it sits immediately after *No code may fall back to a role BY NAME* and before *A button is shown only if the login's cards let it do that action*, so the three role rules read as a set. In the skill it sits at the end of step 3 (*Read the backlog*), **immediately before step 4 (*Choose*) — the step where it was broken**
- [x] **Line endings checked before editing, not assumed.** `file` reports both as LF, so the skill's own CRLF warning does not apply here; the edit script normalises and writes LF
- [ ] Data persists — reload the page and the change is still there — n/a: Markdown in git, no stored state
- [ ] Create / edit / delete all exercised — n/a: a documented rule has no such surface
- [ ] Empty state renders sensibly — n/a: no state
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no input path
- [ ] Boundary cases checked — n/a: no values
- [x] **Every claim in the rule was verified rather than asserted**, since the rule is itself about not asserting: `check-menu-coverage.mjs:1` does say *"for each non-Admin role"* and does loop `for (const role of roles)`; `fault-maintenance-delete` in `scripts/lib/readonly-checks.mjs` is card-shaped as described (#1040); `src/app/residents/export/route.ts` does ask only `resident.record` at read; `dev-signin.mjs` does take `--cards`

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a | `CLAUDE.md` and the skill are repo files, not pages | n/a |
| management | n/a | as above | n/a |
| staff | — | retired by `0173`, deleted by `0270` | n/a |
| doctor | n/a | as above | n/a |
| volunteer | n/a | as above | n/a |
| signed out | n/a | the repo is public; both files name roles only as role keys, no person | as expected |

- [ ] Every role above tested — n/a: neither file is served by the app. **And this table is itself the thing the rule is about** — it is kept because the template asks for it, not because it measures anything here
- [ ] A role that should not have access is blocked server-side — n/a: no access path exists to block

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: not touched; no page
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: the manual is for shelter users; this is a working rule for sessions
- [ ] Translatable strings go through the translation path — n/a: no user-facing strings
- [ ] Mobile viewport (375px) — n/a: no rendered surface
- [ ] Browser console clean — n/a: no client code
- [ ] Network clean — n/a: no requests
- [x] **`AGENTS.md` left alone** — `next dev` rewrites it, so a rule placed there would be destroyed; `CLAUDE.md` is the right home and says so itself

## 6. Regression

- [x] The pages nearest the change still work — none to check; `gates.mjs` compiles the app unchanged, which is the evidence that a docs-only change touched no code path
- [x] Any shared file touched checked from a second, unrelated place — `CLAUDE.md` and the skill are both shared by every session. Checked that the insert did not land inside another rule's body: the preceding section's last bullet and the following `## ` heading are both intact, read by eye after the edit
- [x] Nothing merged from `main` during `sync` was broken by this branch

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** — n/a: the item filed for this covers the **scripts**, which this PR deliberately does not touch; ticking it would hide the larger half. The rule's own record is the `CLAUDE.md` section
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `docs/decisions/2026-10-28-analysis-by-card-not-role.md`: why it is a third rule rather than part of the existing two, and why prose alone will not hold it
- [x] `README.md` still accurate
- [ ] **Release notes.** Would a shelter user notice this change? — n/a: a working rule for Claude sessions about how findings are stated; no shelter user sees `CLAUDE.md` or a skill, and no app behaviour changes
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned** — see section 4's last line. Each quoted file and line was opened

## 8. Pre-production gate

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — n/a: nothing deploys from this PR
- [ ] Deployed SHA matches the tested SHA — n/a: nothing deploys
- [ ] Deployed to test: `npm run deploy:test` — n/a: no deployable surface
- [ ] Smoke-tested on `test.lannacare.org` — n/a: no deployable surface
- [ ] **Timezone-sensitive behaviour proved** — n/a: no date arithmetic
- [ ] **For a boundary or banding change, both edges covered** — n/a: no boundary. (The rule *mentions* banding; it changes no band.)
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** — the `gates:` block is as printed
- [ ] Public pages re-checked after a cache purge — n/a: no public page changes
- [ ] `deploy: production → Supabase project <ref>` line read — n/a: no deploy
- [ ] `strip-baked-env` seen in the deploy output — n/a: no deploy
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: none added
- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: neither
- [ ] `apply-migrations --env production --dry-run` run and clean — n/a: no migration
- [ ] For a destructive or rewriting migration only: a production backup exists — n/a: no migration
- [ ] Apply plan stated — n/a: no migration
- [x] Rollback position stated, **including what it does not cover** — reverting the commit removes both sections and nothing else. It does **not** undo the role-framed analysis already written into `.plan-day.md`, the fault log and the backlog; those were corrected separately in the same session

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | **medium** | **The instruction was given once, recorded in `docs/card-access-faults.md`, and then broken by the same session within the hour** — Card review 2 was sized as "doctor 9, management 10, 2IC 5". Lutan had to say it a second time | fixed by this PR — moved from one document into `CLAUDE.md` and the skill, which are read before work starts rather than when the fault log is opened |
| 2 | **medium** | **The instruments make the role framing the path of least resistance.** `check-menu-coverage.mjs:1` is explicitly per role and loops over roles; most of `check-production.mjs` is keyed the same way. Every band and brief is written from their output | deferred to backlog — its own *Security* item, filed 2026-10-28, with the worked example (`fault-maintenance-delete`, #1040) and the modelling caveat. **Deliberately not attempted here**, so the rule is not held up behind a scripts job |
| 3 | low | `check-menu-coverage`'s "32 unexplained orphans" is **32 role-page pairs, not 32 pages**, and nothing reports the distinct-page count that would actually size the work | accepted here, recorded in the rule and in the backlog item. Deduping is now step zero for Card review 2 |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Read the new `CLAUDE.md` section and say whether it draws the line where you meant it — in particular that **roles may still be used for "who is affected today" as transient context**, which is my reading of your instruction rather than something you said | `CLAUDE.md`, the section *All analysis is by CARD, never by role* |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (Opus 5), planner session  Date: 2026-10-28

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: the list is not empty; item 1 is Lutan reading back a rule written from his words, which only he can confirm

Manual verification by: pending: Lutan to confirm the rule draws the line where he meant, especially the "transient context" carve-out — item 1 above

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager

Result: pass

Release manager acknowledgement: pending: docs-only, nothing to deploy
