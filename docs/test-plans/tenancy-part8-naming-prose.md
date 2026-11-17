# Test plan: tenancy-part8-naming-prose

## Header

| | |
|---|---|
| Feature | Part 8 slice 3: calendar notice and release relay name the shelter |
| Backlog item | `docs/backlog.md` → #b4cmn (not ticked: dictionaries handed on) |
| Branch / worktree | `claude/tenancy-part8-naming-prose` @ `C:\Development\Animal_Shelter_tenancy-part8-naming-prose` |
| Dev server | port 3008 |
| PR | see PR |
| Tested by / date | Claude, 2026-11-17 |
| Carries a migration? | no |
| Tested at SHA | 986e190db |

## 1. Scope and risk

- [x] Change is described in one sentence: the calendar admin notice reads the shelter's short name and the Worker relay's sender name comes from a deploy variable, both falling back to Lanna's text
- [x] Files touched: `src/lib/clinics/calendar-poll.ts`, `calendar-notice.ts`, `worker/release-mail.mjs`, registry, decision
- [x] Cards affected: none; admin notice mail only
- [x] Out of scope: the dictionaries (en.ts, th.ts) handed to the website/i18n part, see the decision file

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — merged cleanly
- [x] `node scripts/gates.mjs` — the first run's build halted on the known Next advisory; `npx next build` re-run exited 0
```
=== gates: typecheck exited 0 after 15s
=== gates: lint exited 0 after 262s
=== gates: test exited 0 after 60s
=== gates: build exited 1 after 128s
gates: FAILED — build
gates: typecheck=0 lint=0 test=0 build=1
```
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [ ] Migration number one above main — n/a: no migration
- [ ] `--status` reviewed — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] Re-runnable file — n/a: no migration
- [ ] Existing rows still read — n/a: no migration
- [ ] Constraints exercised — n/a: no migration
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: no migration

## 4. Functional checks

- [x] Happy path: `calendar-notice.test.mjs` proves the default footer is the old text and another shelter's name replaces it
- [ ] Data persists — n/a: nothing stored
- [ ] Create / edit / delete — n/a: no UI
- [ ] Empty state — n/a: no UI
- [ ] Invalid input — n/a: no input
- [ ] Boundary cases — n/a: no thresholds; unset sender variable falls back to "Lanna Care"

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a | n/a: no page | n/a |

- [ ] Every login tested — n/a: no page or route changed
- [ ] Blocked server-side — n/a: no access change

## 5. Cross-cutting

- [ ] Nav entry — n/a: no nav change
- [ ] Manual updated — n/a: no user-facing behaviour changed
- [ ] Translatable strings — n/a: English admin mail only
- [ ] Mobile viewport — n/a: no UI
- [ ] Browser console — n/a: no UI
- [ ] Network — n/a: no UI

## 6. Regression

- [x] The nearest code (release mail test, calendar sweep) still passes in `npm test`
- [ ] Shared file loaded from a second page — n/a: no shared UI file touched
- [x] Nothing merged from main during sync was broken (gates)

## 7. Documentation

- [ ] Backlog item ticked — n/a: #b4cmn stays open, the dictionaries went to the website/i18n part
- [x] Decision recorded in `docs/decisions/2026-11-17-per-shelter-dictionary-prose.md`
- [x] README still accurate
- [ ] **Release notes.** n/a: Lanna's output is byte-for-byte unchanged; nothing a shelter user would notice
- [x] Commit messages say why
- [x] Claims were measured: the test and both checks were run

## 8. Pre-production gate

- [ ] Tested SHA is main's tip at deploy time — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager
- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on test — deferred: release manager
- [ ] Timezone-sensitive behaviour — n/a: no dates touched
- [ ] Boundary assertions — n/a: no boundary or banding change
- [ ] Evidence is real tool output — n/a: no pasted table beyond the gates block
- [ ] Public pages re-checked — n/a: no public page changed
- [ ] Deploy target ref read — deferred: release manager
- [ ] strip-baked-env seen — deferred: release manager
- [ ] New env var in production — deferred: release manager sets RELEASE_MAIL_SENDER_NAME only to rename a shelter's relay mail; unset reads as before
- [ ] Migration with code reading it — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Destructive migration backup — n/a: no migration
- [ ] Apply plan — n/a: no migration
- [ ] Rollback — deferred: release manager; additive, no schema

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | low | Build halts on the Next advisory in the gates run; re-run exits 0 | accepted: known environment fault |

## Left for manual verification

| # | What to check | Where |
|---|---|---|

## Sign-off

- [x] Everything verifiable without human eyes was run
- [x] Nothing is ticked that was not executed

Automated checks by: Claude  Date: 2026-11-17

- [ ] The manual list is empty — n/a: nothing for a person to look at; no UI changed

Manual verification by: n/a: no UI surface changed

- [x] Open defects are fixed or accepted
- [x] Checklist pasted into the PR
- [ ] Handed to the release manager — n/a: handed at release time

Result: pass with accepted defects

Release manager acknowledgement: pending: release time
