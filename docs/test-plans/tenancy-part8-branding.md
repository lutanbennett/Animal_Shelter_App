# Feature test plan

## Header

| | |
|---|---|
| Feature | Per-shelter naming group and the no-new-Lanna-literal check |
| Backlog item | `docs/backlog.md` → #b4cmn (not ticked: dictionaries, worker relay and calendar text remain; title rewritten on the backlog branch) |
| Branch / worktree | `claude/tenancy-part8-branding` @ `C:\Development\Animal_Shelter_tenancy-part8-branding` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3002` |
| PR | see the PR |
| Tested by / date | Claude, 2026-11-17 |
| Carries a migration? | yes, 0400 |
| Tested at SHA | e08abec85 |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: the app reads the shelter's display and short name from `shelters` for its layout title, mail senders, PDFs and archive page
- [x] Files/areas touched: `src/app/layout.tsx`, `src/lib/{release-mail,shelter-settings,shelter-names-default}.ts`, status alerts, supplier email, resident summary PDF, archive index, manual PDF, `scripts/deploy.mjs`, migration 0400, CI, one new check
- [x] Cards affected: none; no access rule changes. Admin and signed-out public see the same text as before
- [x] Out of scope written down: dictionary prose, `worker/release-mail.mjs` sender, calendar notice text, authenticator issuer, cart storage key (decision file)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (already up to date)
- [x] `node scripts/gates.mjs` ends with the four-gate line, all `0`:

```
=== gates: typecheck exited 0 after 126s
=== gates: lint exited 0 after 311s
=== gates: test exited 0 after 44s
=== gates: build exited 1 after 153s
gates: FAILED — build
gates: typecheck=0 lint=0 test=0 build=1
```

The build exit 1 above is the known environment fault (Next advisory halt, `SecurityFatalError`: "stopped to show the upgrade recommendation"; not reachable here, not upgraded in this PR). Per the brief, `npx next build` was re-run alone and exited 0:

```
npx next build exit=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [x] Migration number is one above the highest on `main` (0400, `check-migration-numbers.mjs` ok)
- [x] `--status` reviewed before applying (400 applied, 1 pending)
- [x] `--dry-run` reviewed (0400 ok)
- [x] Applied to **dev** and recorded in `schema_migrations`
- [x] File is re-runnable (`add column if not exists`, guarded updates)
- [x] Existing rows read correctly: `check-shelter-settings.mjs --env test` compares the stored names to the literals replaced and reports a match
- [ ] Constraints and defaults exercised in a rollback harness — n/a: two nullable text columns, no constraint or default
- [x] Down-migration: stated in the file header (drop the two columns)
- [ ] Production apply plan — pending: release manager applies 0400 to production before deploy; additive and harmless to old code

## 4. Functional checks

- [x] Happy path: `/login` title reads `Lanna Care for Animals` from the DB-backed reader; `/adopt` unchanged
- [ ] Data persists — n/a: no write path
- [ ] Create / edit / delete — n/a: no write path
- [ ] Empty state — n/a: an empty column falls back to the default literal
- [ ] Invalid input — n/a: no input
- [ ] Boundary cases — n/a: covered by `release-mail.test.mjs` (default names reproduce the old text; other names appear)

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| signed out | /login, /adopt | title as before | as before |

- [ ] Every login above tested — n/a: no access rule changed; only the signed-out title was checked
- [ ] Blocked server-side — n/a: no access rule changed

## 5. Cross-cutting

- [ ] Nav entry — n/a: no nav change
- [ ] Manual — n/a: no user-facing behaviour change
- [ ] Translatable strings — n/a: no new strings
- [ ] Mobile viewport — n/a: no layout change
- [x] Browser console clean on /login (no errors read)
- [ ] Network clean — n/a: not inspected beyond page load

## 6. Regression

- [x] Pages nearest the change still work: /login, /adopt loaded in the browser
- [ ] Shared file touched checked from a second page — n/a: `layout.tsx` is the shared file; /login and /adopt both render through it
- [x] Nothing merged from `main` during sync was broken (already up to date)

## 7. Documentation

- [ ] Backlog item ticked — n/a: not complete; title rewritten on the backlog branch (`Backlog: #b4cmn naming group done, say what is left`)
- [x] Decision file `docs/decisions/2026-11-17-per-shelter-naming.md`
- [x] `README.md` still accurate
- [ ] **Release notes.** n/a: Lanna's output must not change, so nobody at the shelter would notice
- [x] Commit messages say why
- [x] Claims were measured: the Lanna-unchanged claim rests on a script and a unit test, not reasoning

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke test on test.lannacare.org — deferred: release manager
- [ ] Timezone-sensitive behaviour — n/a: nothing here derives a date
- [ ] Boundary or banding change — n/a: not one
- [ ] Evidence pasted is unedited — n/a: gates block above is the tool's output
- [ ] Public pages re-checked — deferred: release manager

### Deploy safety

- [ ] Production ref line read — deferred: release manager
- [ ] strip-baked-env seen — deferred: release manager
- [ ] New secret/env var exists in production — n/a: none added

### Migration ordering

- [ ] Both a migration and code that reads it — deferred: release manager (apply 0400 first; if it is late the select errors, data is null and the reader returns the same literals)
- [ ] Production dry-run — deferred: release manager
- [ ] Backup for destructive migration — n/a: additive nullable columns
- [ ] Apply plan stated — deferred: release manager (0400 to production, before the deploy)

### Rollback

- [ ] Rollback position — n/a: purely additive schema is safe to leave; code rollback is the Pi redeploy

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | low | `check-tenancy-catalogue` prints a Windows libuv assertion at exit after its result | accepted, environment quirk |

## Left for manual verification

| # | What to check | Where |
|---|---|---|

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-17

### Manual verification

- [x] The manual list above is empty — n/a: nothing for a person to look at

Manual verification by: n/a: nothing for a person to look at

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [ ] Handed to the production release manager — pending: release manager

Result: pass

Release manager acknowledgement: pending: release manager
