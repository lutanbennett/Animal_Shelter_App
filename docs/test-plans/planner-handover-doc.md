# Feature test plan

## Header

| | |
|---|---|
| Feature | `docs/planner-handover.md`, and a nine-workstream prompt in `/plan-day` telling the planner to update the handover and then start a fresh chat |
| Backlog item | none — Lutan's request in chat, 2026-10-08 (batch 78 of `.plan-day.md`) |
| Branch / worktree | `claude/planner-handover-doc` @ `C:\Development\Animal_Shelter_planner-handover-doc` |
| Dev server | not started — documentation and a skill file only |
| PR | opened from this branch |
| Tested by / date | Claude / 2026-10-08 |
| Carries a migration? | no |
| Tested at SHA | `5090d175` on `c827c8a9` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what was asked for — a planner handover modelled on the release handover, plus a prompt at nine workstreams to update it first and then start a fresh chat
- [x] Files/areas touched listed — `docs/planner-handover.md` (new), `.claude/skills/plan-day/SKILL.md` (11 lines added), `docs/decisions/2026-10-08-planner-handover-counter.md` (new), this plan
- [x] Roles affected identified — none; no role reads these files in the app
- [x] Anything explicitly **out of scope** written down — the live `.plan-day.md` is not edited by this PR (gitignored, and held by the Daily Planner session); the planner adds the counter line on its next run

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly ("Already up to date")
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Closing lines as printed:

```
=== gates: build exited 0 after 177s

gates: typecheck=0 lint=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration in this PR
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: nothing to apply; it was run only to verify the handover's dev figure (165 applied, 0 pending)
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration in this PR
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: no migration in this PR
- [ ] File is re-runnable — n/a: no migration in this PR
- [ ] Existing rows still read correctly after the change — n/a: no schema or data touched
- [ ] **Constraints and defaults exercised against real rows** — n/a: no migration in this PR
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration in this PR
- [ ] Production apply plan stated for the release manager — n/a: no migration in this PR

## 4. Functional checks

- [ ] Happy path works end to end — n/a: documentation only, no runtime behaviour; the prompt fires on a later `/plan-day` run once the counter reaches nine
- [ ] Data persists — n/a: no runtime data
- [ ] Create / edit / delete all exercised — n/a: no CRUD surface
- [ ] Empty state renders sensibly — n/a: no surface
- [ ] Invalid input is rejected with a readable message — n/a: no input
- [ ] Boundary cases checked — n/a: no input

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | nothing new | `docs/` and `.claude/` are not served | n/a — no app surface |
| management | nothing new | as above | n/a — no app surface |
| staff | nothing new | as above | n/a — no app surface |
| vet | nothing new | as above | n/a — no app surface |
| volunteer | nothing new | as above | n/a — no app surface |
| signed out | nothing new | as above | n/a — no app surface |

- [ ] Every role above tested — n/a: no route renders these files
- [ ] A role that should not have access is blocked server-side — n/a: no access rule in this PR

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: not touched
- [ ] Manual updated (`src/lib/manual/en.ts`) — n/a: an internal process document, no manual topic
- [ ] Translatable strings go through the translation path — n/a: no user-facing string
- [ ] Mobile viewport (375px) — n/a: no layout
- [ ] Browser console clean — n/a: no page
- [ ] Network clean — n/a: no page

## 6. Regression

- [ ] The pages nearest the change still work — n/a: no page changed
- [ ] Any shared file touched checked from a second, unrelated page — n/a: no shared app file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch — sync was already up to date and the build passed

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** — n/a: no backlog item exists; this was a request in chat
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-10-08-planner-handover-counter.md`
- [x] `README.md` still accurate — it does not list the handover documents
- [ ] **Release notes.** — n/a: a planning document and a skill prompt, nothing a shelter user can see
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** Every figure in the handover's table was re-read from a command at writing time (`git log`, `apply-migrations.mjs --status`, `gh pr list`, `worktree.mjs list`, a count of open backlog items); the token figures were counted from `.plan-day.md`'s tables, which corrected the brief's draft (17 measured + 1 unmeasured, not 18; two of the last ten were over estimate). Production's migration position is cited from `docs/release-handover.md`, not re-read, and the file says so

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — n/a: nothing deploys; docs and a skill file are not part of the build output
- [ ] Deployed SHA matches the tested SHA — n/a: nothing deploys

### On the deployed build

- [ ] Deployed to test — n/a: nothing to deploy
- [ ] Smoke-tested on `test.lannacare.org` — n/a: no app change
- [ ] **Timezone-sensitive behaviour proved** — n/a: no time logic
- [ ] **Boundary or banding change covered at both edges** — n/a: no code; the nine-workstream threshold is a prose instruction to the planner
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited** — n/a: the only pasted output is the gates block in section 2, copied as printed
- [ ] Public pages re-checked after a cache purge — n/a: no public page touched

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — n/a: nothing deploys
- [ ] `strip-baked-env` seen in the deploy output — n/a: nothing deploys
- [ ] Any new secret/env var exists in production — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] Does this PR contain both a migration and code that reads it — n/a: no migration
- [ ] `--env production --dry-run` run and clean — n/a: no migration
- [ ] Production backup for a destructive migration — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [ ] Rollback position stated — n/a: reverting the PR restores the previous skill and removes the handover; nothing runtime to roll back

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| — | — | none | — |

## Left for manual verification

Empty: nothing here has a screen. The prompt is proven only when a real
`/plan-day` run reaches nine workstreams, which is the planner's own job.

| # | What to check | Where |
|---|---|---|
| — | none | — |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (planner-handover-doc session)  Date: 2026-10-08

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person

Manual verification by: n/a: documentation and a skill prompt only, nothing on a screen for a person to look at

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR links this file rather than pasting it
- [ ] Handed to the production release manager — n/a: nothing in this PR deploys

Result: pass

Release manager acknowledgement: n/a: nothing in this PR deploys
