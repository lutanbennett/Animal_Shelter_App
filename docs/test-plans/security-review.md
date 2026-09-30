# Feature test plan

Filled from `docs/test-plan-template.md`. Every line is ticked (run and passed)
or `n/a` with the reason.

---

## Header

| | |
|---|---|
| Feature | Security assessment of 2026-09-30 filed under `docs/security/` (`.docx` and `.pdf`). Documents only, no code |
| Backlog item | `docs/backlog.md` → Security (added on the `backlog` branch, 2026-09-30); this PR files the report those items cite |
| Branch / worktree | `claude/security-review` @ `C:\Development\Animal_Shelter_security-review` |
| Dev server | `node scripts/worktree.mjs dev` → not used: no code changed |
| PR | linked from the PR itself |
| Tested by / date | Claude (security-review session), 2026-09-30 |
| Carries a migration? | no |
| Tested at SHA | `d0a34ba` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: two files, the assessment report as Word and PDF, are committed so the backlog's Security items point at something in the repo
- [x] Files/areas touched listed: `docs/security/security-assessment-2026-09-30.docx`, `docs/security/security-assessment-2026-09-30.pdf`, this plan. Nothing under `src/`, `worker/`, `scripts/` or `supabase/`
- [ ] Roles affected identified — n/a: no app behaviour changes
- [x] Out of scope written down: fixing any finding (each is a backlog item), and anything the report says it could not see (dashboard settings, Cloudflare, Google). The report is a record of one review, not a promise that the code has none of the problems it does not list

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly and pushed
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Closing lines as printed:

```
=== gates: build exited 0 after 131s

gates: typecheck=0 lint=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --status` reviewed — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration
- [ ] Constraints and defaults exercised against real rows — n/a: no migration
- [ ] Down-migration written — n/a: no migration
- [ ] Production apply plan stated — n/a: no migration

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no UI surface, no code reads these files
- [ ] Data persists — n/a: no UI surface
- [ ] Create / edit / delete all exercised — n/a: no UI surface
- [ ] Empty state renders sensibly — n/a: no UI surface
- [ ] Invalid input is rejected with a readable message — n/a: no input
- [ ] Boundary cases checked — n/a: no input

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a | documents in the repo only | n/a |
| management | n/a | documents in the repo only | n/a |
| staff | n/a | documents in the repo only | n/a |
| vet | n/a | documents in the repo only | n/a |
| volunteer | n/a | documents in the repo only | n/a |
| signed out | n/a | documents in the repo only | n/a |

- [ ] Every role above tested — n/a: nothing is served; `docs/` is not part of the build
- [ ] A role that should not have access is blocked server-side — n/a: nothing is served

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI
- [ ] Manual updated — n/a: no user-facing change
- [ ] Translatable strings — n/a: no UI strings
- [ ] Mobile viewport — n/a: no UI
- [ ] Browser console clean — n/a: no UI
- [ ] Network clean — n/a: no UI

## 6. Regression

- [ ] The pages nearest the change still work — n/a: no page changed; the build in §2 passes
- [ ] Shared file checked from a second page — n/a: no shared file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch: gates pass on the merged tree

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` on this branch — n/a: the items are open work, added on the `backlog` branch (2026-09-30); nothing here completes one
- [ ] Non-obvious design choices added as a new file in `docs/decisions/` — n/a: no design choice, a report is filed as written
- [ ] `README.md` still accurate — n/a: README does not mention `docs/security/`
- [ ] **Release notes.** Would a shelter user notice this change? — n/a: two documents under `docs/`, no user-visible change
- [x] Commit messages say why, not just what
- [x] Claims in commit messages and `docs/decisions.md` were measured, not reasoned: the report's own claims were spot-checked against the code in this session (the open redirect, the missing headers, the backup script, the four Drive deletes and the contacts policies all matched); the rest were not re-checked and the PR body says so

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — n/a: `docs/` is not part of the Worker bundle; nothing deploys
- [ ] Deployed SHA matches the tested SHA — n/a: nothing deploys

### On the deployed build

- [ ] Deployed to test — n/a: nothing deploys
- [ ] Smoke-tested on `test.lannacare.org` — n/a: nothing deploys
- [ ] **Timezone-sensitive behaviour proved** — n/a: no code
- [ ] **For a boundary or banding change, the assertions cover both edges** — n/a: no code
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited** — n/a: the only evidence is the gates line in §2, pasted as printed
- [ ] Public pages re-checked after a cache purge — n/a: no public page changed

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — n/a: nothing deploys
- [ ] `strip-baked-env` seen in the deploy output — n/a: nothing deploys
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] Does this PR contain both a migration and code that reads it? — n/a: no migration
- [ ] `--env production --dry-run` run and clean — n/a: no migration
- [ ] Production backup exists and is fresh — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [ ] Rollback position stated — n/a: nothing deploys; reverting is deleting two files

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| | | none in this PR; the report's findings are in the backlog's Security section | deferred to backlog |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | | |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (security-review session)  Date: 2026-09-30

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: the list is empty; two documents, nothing for a person to look at

Manual verification by: n/a: two documents under docs/, nothing to look at

### Result

- [ ] Open defects are either fixed or explicitly accepted above — n/a: none opened
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: nothing deploys

Result: pass

Release manager acknowledgement: n/a: nothing deploys
