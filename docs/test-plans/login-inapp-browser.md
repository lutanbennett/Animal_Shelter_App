# Feature test plan

## Header

| | |
|---|---|
| Feature | Login page hides Google and explains inside in-app browsers |
| Backlog item | `docs/backlog.md` → #tbsxw |
| Branch / worktree | `claude/login-inapp-browser` @ `C:\Development\Animal_Shelter_login-inapp-browser` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3006` |
| PR | see GitHub |
| Tested by / date | Claude / 2026-11-11 |
| Carries a migration? | no |
| Tested at SHA | 73b88f05 |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: in an in-app browser, /login and /login/request hide the Google button and show a not-a-fault notice naming Chrome
- [x] Files/areas touched: `src/app/login/{page,LoginForm}.tsx`, `src/app/login/request/page.tsx`, `src/lib/auth/in-app-browser.ts` (+test), both dictionaries, `releases.ts`
- [x] Cards affected: none, the login page is pre-sign-in; admin and the signed-out public see the page
- [x] Out of scope: Supabase redirect allow lists, `intent://` open-in-browser link, production/UAT allow lists

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — origin/main merged in cleanly
- [x] `node scripts/gates.mjs` ends with one line of the shape `gates: typecheck=<N> lint=<N> test=<N> build=<N>`:

```
=== gates: typecheck exited 0 after 222s
=== gates: lint exited 0 after 786s
=== gates: test exited 0 after 94s
=== gates: build exited 0 after 500s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `--status` reviewed — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration
- [ ] Constraints exercised — n/a: no migration
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end: fetched /login with a Messenger agent (notice, no Google button, password form present) and a desktop Chrome agent (Google button, no notice)
- [ ] Data persists — n/a: nothing is stored
- [ ] Create / edit / delete — n/a: no data
- [ ] Empty state — n/a: no list
- [ ] Invalid input — n/a: no input added
- [x] Boundary cases: 12 user-agent table tests, including missing agent and a lookalike string

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| signed out | /login, /login/request | notice in in-app browsers, button elsewhere | as expected |

- [ ] Every login above tested — n/a: only the signed-out page changes
- [ ] A login that should not have access is blocked — n/a: public page, no access change

## 5. Cross-cutting

- [ ] Nav entry — n/a: no nav change
- [ ] Manual updated — n/a: sign-in page wording only
- [x] Translatable strings go through the dictionaries (`login.inApp`, en and th)
- [ ] Mobile viewport — pending: notice not seen on screen at 375px (pane cannot set a user agent)
- [ ] Browser console clean — pending: not viewed with the notice showing
- [ ] Network clean — n/a: server-rendered change, no new requests

## 6. Regression

- [x] Nearest pages: /login with a normal agent still renders the Google button and password form
- [ ] Shared file touched — n/a: dictionaries only gained keys
- [x] Nothing merged from `main` during `sync` was broken by this branch

## 7. Documentation

- [x] Backlog item #tbsxw ticked on this branch
- [x] Decision file `docs/decisions/2026-11-11-login-inapp-browser.md`
- [ ] README — n/a: no README content affected
- [x] **Release notes.** `unreleased` gained a plain line for everyone signed out
- [x] Commit messages say why
- [x] Claims were measured: detection verified by fetching with real agent strings and by unit tests

## 8. Pre-production gate

- [ ] Tested SHA recorded — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager
- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on test — deferred: release manager
- [ ] Timezone-sensitive behaviour — n/a: no dates
- [ ] Boundary/banding assertions — n/a: no thresholds
- [ ] Evidence is the tool's actual output — n/a: gates output pasted unedited above
- [ ] Public pages re-checked — n/a: /login is not an edge-cached public page
- [ ] Deploy target line read — deferred: release manager
- [ ] strip-baked-env seen — deferred: release manager
- [ ] New secret/env var — n/a: none added
- [ ] Migration and code together — n/a: no migration
- [ ] Prod dry-run — n/a: no migration
- [ ] Backup — n/a: no migration
- [ ] Apply plan — n/a: no migration
- [ ] Rollback position — deferred: release manager (code-only; redeploy previous SHA)

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| | | none | |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Open /login from a link inside LINE and inside Messenger: no Google button, the notice reads in English and Thai, email and password sign in works | Real phone |

## Sign-off

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-11

- [ ] The manual list above is empty, or every item in it was checked by a person — pending: real LINE and Messenger check

Manual verification by: pending: real-device check in LINE and Messenger

Result: pass

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: not yet
- [ ] Handed to the production release manager — n/a: not yet
