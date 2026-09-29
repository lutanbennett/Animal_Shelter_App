# Feature test plan — line-link-check

## Header

| | |
|---|---|
| Feature | The LINE link now follows how the id was typed: `@id` opens an Official Account, `id` a personal id, so the one Settings field works for either |
| Backlog item | `docs/backlog.md` → "Check the website's LINE link opens the shelter's LINE Official Account." |
| Branch / worktree | `claude/line-link-check` @ `C:\Development\Animal_Shelter_line-link-check` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3004` |
| PR | not yet opened |
| Tested by / date | Claude / 2026-09-29 |
| Carries a migration? | no |
| Tested at SHA | `9a9d05c` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — `lineLink()` keeps `~` for an id typed without `@` and uses `%40` for one typed with it; the item's own wording. Lutan confirmed in chat that one field is enough, so no second column
- [x] Files/areas touched listed — `src/lib/site/content.ts` (`lineLink`), both dictionaries (the Website hint), `docs/backlog.md`, one decisions file. `channels.ts` and the pages call the helper and are unchanged
- [x] Roles affected identified — signed-out public visitors (every LINE button); admin reads the hint
- [x] Anything explicitly **out of scope** written down — holding an Official Account and a personal id together (declined by Lutan); Contacts' `lineHref()`, which is for people's personal ids

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Paste its closing `gates:` lines below exactly as printed

```
=== gates: build exited 0 after 276s

gates: typecheck=0 lint=0 build=0
```

- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs` applied to dev — n/a: no migration
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly after the change — n/a: no migration; the stored value is unchanged, only the link built from it
- [ ] Constraints and defaults exercised against real rows — n/a: no migration
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end — the two URL forms reproduced in Node from the same expression: `@lannacare` gives `line.me/R/ti/p/%40lannacare`, `lannacare` gives `line.me/R/ti/p/~lannacare`
- [ ] Data persists — n/a: nothing is stored; the link is derived at render
- [ ] Create / edit / delete all exercised — n/a: no data change
- [ ] Empty state renders sensibly — n/a: an empty field still returns `null` before the new branch
- [ ] Invalid input is rejected with a readable message — n/a: the Website form's own validation is unchanged
- [x] Boundary cases checked — a pasted `https://` value is still returned as typed; `lineMessageLink()` still keys off a leading `@`, so its `oaMessage/@id` form agrees with the plain link

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | Settings → Website | sees the new hint | n/a |
| management | nothing changed | n/a | n/a |
| staff | nothing changed | n/a | n/a |
| vet | nothing changed | n/a | n/a |
| volunteer | nothing changed | n/a | n/a |
| signed out | public LINE buttons | new href | see manual list |

- [ ] Every role above tested — n/a: no access rule changed, only a URL string
- [ ] A role that should not have access is blocked server-side — n/a: no access rule changed

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change
- [ ] Manual updated — n/a: the manual does not describe how to type the LINE id; the Settings hint does
- [x] Translatable strings go through the translation path — the hint is a dictionary string, edited in both `en.ts` and `th.ts`
- [ ] Mobile viewport (375px) — n/a: the hint is one line of helper text that wraps
- [ ] Browser console clean — n/a: not run in a browser this session
- [ ] Network clean — n/a: not run in a browser this session

## 6. Regression

- [ ] The pages nearest the change still work — n/a: not loaded in a browser; typecheck and build pass and every caller goes through `lineLink()` and `lineMessageLink()`, whose signatures are unchanged
- [ ] Any shared file touched checked from a second, unrelated page — n/a: no shared UI file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch — build passes on the merged tree

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-09-29-line-link-at-sign-picks-official-account-or-personal.md`
- [x] `README.md` still accurate
- [ ] **Release notes.** n/a: Lutan does not know whether the shelter's LINE is an Official Account or a personal id, so it is not known that any visitor's link was broken; the fix makes both kinds open the right thing
- [x] Commit messages say why, not just what
- [x] Claims in commit messages and decisions were measured, not reasoned — the URL forms were printed from the same expression; what LINE does on a phone with each form is not claimed and is listed below

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] Timezone-sensitive behaviour proved — n/a: no date logic
- [ ] Boundary or banding change assertions cover both sides — n/a: no threshold or band
- [ ] Evidence pasted into this plan is the tool's actual output, unedited — n/a: the only pasted evidence is the gates output
- [ ] Public pages re-checked after a cache purge — deferred: release manager

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] Migration and code that reads it in one PR? — n/a: no migration
- [ ] `--dry-run` against production — n/a: no migration
- [ ] Destructive migration backup — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [ ] Rollback position stated — n/a: no schema; `wrangler rollback --env production` reverts it fully

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| | | none | |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | On a phone with LINE, tap the LINE button and see that it opens the shelter's account (Official Account if the id is set as `@…`, personal if without). Also confirm the Settings id is typed the way the account really is | `test.lannacare.org` footer, then Settings → Website |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-09-29

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: not yet; the phone tap is outstanding and recorded as `pending:` below

Manual verification by: pending: the phone tap in row 1 above

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet — the PR does not exist at this commit

Result: pass

Release manager acknowledgement: pending
