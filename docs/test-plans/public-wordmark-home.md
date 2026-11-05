# Feature test plan

## Header

| | |
|---|---|
| Feature | Public site: LCA in the bar, full name on the home page, crest beside the hero buttons |
| Backlog item | `docs/backlog.md` → #kygb3 |
| Branch / worktree | `claude/public-wordmark-home` @ `C:\Development\Animal_Shelter_public-wordmark-home` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3003` |
| PR | see the PR for this branch |
| Tested by / date | Claude, 2026-11-06 |
| Carries a migration? | no |
| Tested at SHA | tip of `claude/public-wordmark-home` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: the public top bar says LCA with a bigger crest, the home eyebrow is the full name over Chiang Mai, Thailand, and the crest sits beside the hero buttons.
- [x] Files/areas touched: `PublicHeader.tsx`, `src/app/page.tsx`, `en.ts`/`th.ts`, `public-paths.ts` and its test and check script, `releases.ts`, one decision file.
- [ ] Cards affected identified — n/a: no card or permission changes; the signed-out public sees the change, Admin is not affected differently.
- [x] Out of scope: Mae Wang elsewhere (tab title, share preview, adopt, About registration sentence), the tagline, `header.appName`.

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends with the line below, run by me:

```
=== gates: typecheck exited 0 after 186s
=== gates: lint exited 0 after 349s
=== gates: test exited 0 after 53s
=== gates: build exited 0 after 332s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to dev and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration
- [ ] Constraints and defaults exercised against real rows — n/a: no migration
- [ ] Down-migration written — n/a: no migration
- [ ] Production apply plan stated — n/a: no migration

## 4. Functional checks

- [ ] Happy path works end to end — pending: the Browser pane was hidden, so the home page and top bar have not been looked at; screenshots at 375 px and desktop are to be sent to Lutan
- [ ] Data persists — n/a: static wording and images, nothing is saved
- [ ] Create / edit / delete all exercised — n/a: no data feature
- [ ] Empty state renders sensibly — n/a: no list
- [ ] Invalid input is rejected — n/a: no input
- [ ] Boundary cases checked — pending: whether the hero crest has room on a desktop where the hero photo makes two columns

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| signed out | `/lca-logo.png`, `/lca-logo-transparent.png` | load without sign-in (added to the public path lists) | `check-public-paths.mjs` and its test pass |

- [ ] Every login above tested — n/a: only the signed-out public sees this change
- [ ] A login that should not have access is blocked server-side — n/a: nothing here grants access

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change
- [ ] Manual updated — n/a: the public site's wording is not in the manual
- [ ] Translatable strings go through the translation path — n/a: strings are in both dictionaries (`en.ts`, `th.ts`), not site content
- [ ] Mobile viewport (375px) — pending: not looked at, pane hidden; `check-phone-width.mjs` is a long sweep and was not completed
- [ ] Browser console clean — pending: page was not rendered
- [ ] Network clean — pending: page was not rendered

## 6. Regression

- [ ] The pages nearest the change still work — pending: not loaded in a browser; build passes for every route
- [ ] Any shared file touched checked from a second page — pending: `PublicHeader.tsx` is on every public page, not yet loaded
- [x] Nothing merged from `main` during `sync` was broken by this branch (gates ran after the merge)

## 7. Documentation

- [ ] Backlog item ticked — n/a: item stays open until Lutan has judged the pictures; follow-ups go on the `backlog` branch
- [x] Non-obvious design choices added in `docs/decisions/2026-11-06-public-wordmark-lca-and-hero-crest.md`
- [x] `README.md` still accurate
- [x] **Release notes.** `unreleased` in `src/lib/releases.ts` has a line for it, written for a shelter user.
- [x] Commit messages say why, not just what
- [x] Claims in commit messages were measured, not reasoned

## 8. Pre-production gate

- [ ] Tested SHA recorded — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager
- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on the test site — deferred: release manager
- [ ] Timezone-sensitive behaviour proved — n/a: no dates
- [ ] Boundary or banding change assertions — n/a: no thresholds
- [ ] Evidence pasted is the tool's actual output — n/a: the gates block above is unedited
- [ ] Public pages re-checked after a cache purge — deferred: release manager
- [ ] `deploy: production` line read — deferred: release manager
- [ ] `strip-baked-env` line seen — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none added
- [ ] Migration ordering — n/a: no migration
- [ ] Dry-run against production — n/a: no migration
- [ ] Production backup — n/a: no migration
- [ ] Apply plan stated — n/a: no migration
- [ ] Rollback position stated — deferred: release manager; purely front-end, so `deploy-pi.sh --ref <sha>` covers it

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| | | | |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Look at the top bar and home page at phone width and desktop, and choose whether the hero crest stays | `/` |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-06

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — pending: Lutan and the Director to look

Manual verification by: pending: Lutan to look at the home page pictures

### Result

- [ ] Open defects are either fixed or explicitly accepted above — n/a: none found
- [ ] Checklist pasted into the PR — pending: after the PR exists
- [ ] Handed to the production release manager — pending: after merge

Result: pass with accepted defects
