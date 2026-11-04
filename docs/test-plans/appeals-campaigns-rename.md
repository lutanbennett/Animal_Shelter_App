# Feature test plan — appeals-campaigns-rename

## Header

| | |
|---|---|
| Feature | Appeals are now called Campaigns and Desexing is now called Sterilisation in every word a person reads, and the three public/staff addresses moved with them |
| Backlog item | `docs/backlog.md` → **RENAME THE WORDS "APPEALS" TO "CAMPAIGNS" AND "DESEXING" TO "STERILISATION"** (`#2dj7q`, ticked) |
| Branch / worktree | `claude/appeals-campaigns-rename` @ `C:\Development\Animal_Shelter_appeals-campaigns-rename` |
| Dev server | `http://localhost:3002` |
| PR | pending: number is known when the PR is opened |
| Tested by / date | Claude / 2026-11-04 |
| Carries a migration? | no |
| Tested at SHA | `bc2bbe3e` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — words changed, identifiers and card keys left, addresses moved with a permanent redirect from the two old public ones
- [x] Files/areas touched listed — `src/lib/i18n/dictionaries/{en,th}.ts`, `src/lib/manual/en.ts`, folders under `src/app/` (`campaigns`, `management/campaigns`, `management/sterilisation-drives`, `services/sterilisation`), `public-paths.ts`, `public-pages.ts`, `sitemap.ts`, `routes.ts`, `write-requests.ts`, `permissions/cards.ts` (one `opens`), `next.config.ts` (redirects), three check scripts, `releases.ts`
- [x] Cards affected identified — `appeal.run`, `appeal.medical_photo` and `run_appeals` (words only, keys unchanged); `run_fundraising_events` now opens `/management/campaigns`. Admin and the signed-out public see the new words and addresses
- [x] Out of scope written down — table, column and card-key names, the `page:appeals`/`page:desexing` hide keys, `src/lib/appeals|desexing` folders, published release notes, developer-facing error text

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (fast-forward)
- [x] `node scripts/gates.mjs`, run in the background to a file and read:

```
=== gates: typecheck exited 0 after 119s
=== gates: lint exited 0 after 326s
=== gates: test exited 0 after 76s
=== gates: build exited 0 after 417s

gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number one above the highest on `main` — n/a: no migration
- [ ] `--status` reviewed — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no schema touched
- [ ] Constraints and defaults exercised — n/a: no migration
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end — signed in as admin on dev, fetched `/management`, `/management/campaigns`, `/management/campaigns/new`, `/management/sterilisation-drives`, `/campaigns` and `/services/sterilisation`: all 200 with the new words; counts of "appeal" and "desex" in the rendered text were 0 except one dev-data campaign titled `walk-run_appeals`
- [ ] Data persists — n/a: no data written; the words are static
- [ ] Create / edit / delete all exercised — n/a: no behaviour changed; the actions were only re-addressed
- [ ] Empty state renders sensibly — n/a: unchanged
- [ ] Invalid input is rejected — n/a: unchanged
- [ ] Boundary cases checked — n/a: unchanged

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin | new staff addresses; old public addresses | pages load; `/appeals`, `/appeals/x`, `/services/desexing` answer a redirect | pass (the redirects were seen as redirects from the page) |
| exactly `appeal.run` | not driven | no access rule changed | n/a: guards are unchanged and the permission-catalogue check ran in the test gate |
| signed out | `/campaigns`, `/services/sterilisation` | public | n/a: not driven signed out; both are covered by `PUBLIC_PAGE_PREFIXES` and `public-paths.test.mjs` passed |

- [x] Every login above tested — admin driven; the other rows are n/a with reasons above
- [ ] A login that should not have access is blocked server-side — n/a: no rule changed, guards are still `requirePermission("appeal.run")` and `website.content`

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: nav labels come from the renamed dictionary entries and link to the moved addresses; seen on `/management`
- [x] Manual updated and reads correctly — `src/lib/manual/en.ts` 25 strings; topic ids kept as anchors
- [ ] Translatable strings go through the translation path — n/a: no new strings, existing ones reworded
- [ ] Mobile viewport (375px) — n/a: wording only, a few letters longer or shorter
- [ ] Browser console clean — n/a: pages were fetched, not hydrated; no code path changed
- [ ] Network clean — n/a: as above

## 6. Regression

- [x] The pages nearest the change still work — the six pages above load
- [x] Shared files touched (`manual/en.ts`, dictionaries, `public-paths.ts`) checked from unrelated pages — `/management` and `/campaigns` load through them
- [x] Nothing merged from `main` during `sync` was broken — sync was a docs-only fast-forward

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch
- [x] Decision file `docs/decisions/2026-11-04-appeals-campaigns-rename.md`
- [x] `README.md` still accurate — it does not name these pages
- [x] **Release notes.** `unreleased` gained a line telling users the two names changed and that old public links redirect
- [x] Commit messages say why
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned** — the string counts come from the script output; the "no hard-coded label" claim from a grep of `src/` and `worker/`

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager, including that `/appeals` and `/services/desexing` redirect on the deployed Workers build
- [ ] Timezone-sensitive behaviour — n/a: nothing derives a date
- [ ] Boundary or banding change — n/a: no threshold
- [ ] Evidence pasted is the tool output, unedited — deferred: release manager for deploy output; the gates output above is unedited
- [ ] Public pages re-checked after a cache purge — deferred: release manager; `/campaigns` and `/services/sterilisation` are new cache keys

### Deploy safety

- [ ] `deploy: production → Supabase project` line read — deferred: release manager
- [ ] `strip-baked-env` seen — deferred: release manager
- [ ] New secret/env var — n/a: none

### Migration ordering — *skip if no migration*

- [ ] Both a migration and code that reads it? — n/a: no migration
- [ ] `--env production --dry-run` — n/a: no migration
- [ ] Destructive migration backup — n/a: no migration
- [ ] Apply plan — n/a: no migration

### Rollback

- [x] Rollback position stated — `./scripts/pi/deploy-pi.sh --ref <sha>` restores the old words and addresses; nothing in the database changed, so nothing else needs reverting. Links to the new addresses shared after the release would 404 on rollback

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | The rename script skipped two strings in a ternary because they sit before a colon ("Move 1 gift to the appeal") | fixed by hand; a grep of the dictionary shows no user-facing "appeal" left |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | The Thai wording reads naturally; Thai sterilisation stays as it was | `/campaigns` and `/management/campaigns` in Thai |
| 2 | The adoption profile still tells an adopter what it means: "Sterilised (spayed / neutered)" | resident edit form |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-04

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: nobody has looked yet, see the pending signature below

Manual verification by: pending: Thai wording and the adoption profile wording need a person to read them

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR body links the file
- [ ] Handed to the production release manager — n/a: handed over through the release's PR list

Result: pass

Release manager acknowledgement: n/a: not yet released
