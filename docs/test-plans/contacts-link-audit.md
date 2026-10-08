# Feature test plan — contacts-link-audit

## Header

| | |
|---|---|
| Feature | Part (4) of the maps item: a read-only script listing every contact and Shelter Friend whose map link is wrong, in plain words |
| Backlog item | `docs/backlog.md` → **Maps on contacts and Shelter Friends: fix the 404 …** (left open, status note added) |
| Branch / worktree | `claude/contacts-link-audit` @ `C:\Development\Animal_Shelter_contacts-link-audit` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3003` (started; contact hub needs a sign-in, see below) |
| PR | opened from this commit |
| Tested by / date | Claude / 2026-10-08 |
| Carries a migration? | no |
| Tested at SHA | `e5e97dcd` (after sync with `origin/main`, already up to date) |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — `scripts/audit-contact-map-links.mjs` lists contacts (Shelter Friends included) whose address is a link to no place, words with no link, or a link with words after it, with what to do; it changes nothing
- [x] Files/areas touched listed — new `scripts/audit-contact-map-links.mjs`; new `src/lib/contacts/short-link.ts` (the short-link follower, moved out of `map-preview.ts`); `src/lib/contacts/map-preview.ts` now calls it; `README.md`, `docs/backlog.md` (status note), `docs/decisions/2026-10-08-contact-map-link-audit.md`, this plan
- [x] Roles affected identified — none: no screen changed. `map-preview.ts` behaves as before for the contact hub, contacts list and public Shelter Friends (same requests, same result; only the code's location moved)
- [x] Anything explicitly **out of scope** written down — storing a pin (parts 1/2, `contacts-address-map-schema`), the contact pages (#461), the website map link (part 5, done in #461). The production run is Lutan's to ask for

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly ("Already up to date")
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`:

```
=== gates: build exited 0 after 293s

gates: typecheck=0 lint=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `--status` reviewed — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] Re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration; the script only SELECTs
- [ ] Constraints exercised in a rollback harness — n/a: no migration
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end — `node scripts/audit-contact-map-links.mjs` on dev, exit 0. Its closing line: `Summary: dead 2, plaintext 2, trailing 0, unchecked 0, fine 2.` (6 live contacts with an address, 0 archived; 2 short links checked, 2 lookups). The 2 "dead" are `https://www.google.com` and `https://www.google.com.au` (not map links); the 2 "plaintext" are written addresses, one a Shelter Friend shown on the public website
- [ ] Data persists — n/a: the script writes nothing; there is no `--apply`
- [ ] Create / edit / delete — n/a: read-only script
- [x] Empty state renders sensibly — each of the four groups prints its heading with `: 0` when empty (dev run: `trailing 0`, `unchecked 0`)
- [x] Production run, at Lutan's request in chat, from the main checkout (`node ../Animal_Shelter_contacts-link-audit/scripts/audit-contact-map-links.mjs --env production`), exit 0:

```
Contact map check — production (dbkodyyxxhtygxcxmfcu), 2026-10-08
2 live contacts have an address (1 archived ones skipped). 2 are fine. 2 short links checked with Google, 2 lookups.
...
Summary: dead 0, plaintext 0, trailing 0, unchecked 0, fine 2.
```

  (the four empty group headings omitted as `...`; "archived ones" since reworded to "archived")
- [x] Invalid input is rejected with a readable message — `--env nonsense` stops with `--env must be one of test, uat, production` (env.mjs); a database error prints `Could not read contacts from <env>` and sets exit 1, no stack trace
- [x] Boundary cases checked — every case the item names, run through the script's own `judge()` against live Google:

```
maps.app.goo.gl (working)    -> fine
maps.app.goo.gl + ?g_st      -> fine
maps.app.goo.gl + text       -> trailing | The link works, but there are words after it in the same box. The app opens only the link and ignores the words.
made-up maps.app.goo.gl      -> dead | This link no longer opens a place in Google Maps. The app shows no map for this contact.
made-up goo.gl/maps          -> dead | This link no longer opens a place in Google Maps. The app shows no map for this contact.
dead goo.gl/maps + text      -> dead | This link no longer opens a place in Google Maps. The app is showing Google's guess from the words after the link instead.
full Maps URL                -> fine
?q= coords URL               -> fine
not a map link               -> dead | This link is not a Google Maps place. The app shows no map for this contact.
Plus Code                    -> fine
typed coords                 -> fine
Thai address                 -> plaintext | This is written as words, not a map link. The map shows Google's guess from the words, which in Thailand is often the wrong place.
link mid-text                -> plaintext | There is a link here, but not at the start, so the app can't use it. The map shows Google's guess from the words, which in Thailand is often the wrong place.
```

  and Google unreachable (fetch made to throw) → `unchecked`

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a — a local script | no change | n/a |
| management | n/a | no change | n/a |
| staff | n/a | no change | n/a |
| vet | n/a | no change | n/a |
| volunteer | n/a | no change | n/a |
| signed out | n/a | no change | n/a |

- [ ] Every role above tested — n/a: no screen or permission changed; the script runs locally with the Supabase access token
- [ ] A role that should not have access is blocked server-side — n/a: nothing new is reachable from the app

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change
- [ ] Manual updated — n/a: a developer script, not something a shelter user runs; the paste-a-link guidance shipped in #461
- [ ] Translatable strings — n/a: no app strings added
- [ ] Mobile viewport — n/a: no UI
- [ ] Browser console clean — n/a: no UI
- [ ] Network clean — n/a: no UI

## 6. Regression

- [x] The pages nearest the change still work — the moved follower is the same code path the script exercised: both dev `maps.app.goo.gl` links (Lutan Bennett, Sylvia and Estella) resolve to a place through `followShortLink()`; `map-preview.ts` only adds `.then((r) => r.target)`, and typecheck and build pass. The contact hub itself needs a sign-in, so looking at it is in the manual list below
- [ ] Shared file checked from a second page — n/a: no shared UI file touched; `contacts.ts` unchanged
- [x] Nothing merged from `main` during `sync` was broken — nothing was merged (already up to date)

## 7. Documentation

- [ ] Backlog item ticked — n/a: the maps item stays open (parts 1/2 remain); a status note records part (4) and the dev count. No other open item is closed by this: the separate Address / Map link item is fed by the "words after a link" group but still open
- [x] Non-obvious design choices added — `docs/decisions/2026-10-08-contact-map-link-audit.md` (one shared link-follower; Plus Codes and coordinates pass; friends reported as their contact)
- [x] `README.md` still accurate — the script added to the `scripts/` list
- [ ] **Release notes.** n/a: a script, nothing a shelter user can see
- [x] Commit messages say why, not just what
- [x] Claims were measured, not reasoned — the counts and every case above are pasted from runs

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] Timezone-sensitive behaviour — n/a: nothing derives a date (the report's date line is informational)
- [ ] Boundary assertions cover both sides — n/a: no threshold or band; the outcome cases are listed in §4
- [x] Evidence pasted is the tool's actual output, unedited — the gates lines, the dev summary line and the case table are pasted from the runs as printed; the production excerpt marks its one cut (`...`, four empty headings)
- [ ] Public pages re-checked after a cache purge — n/a: no public page changed

### Deploy safety

- [ ] Production ref read on deploy — deferred: release manager
- [ ] `strip-baked-env` seen — deferred: release manager
- [ ] New secret/env var — n/a: none

### Migration ordering — *skip if no migration*

- [ ] Migration and reading code in one PR — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Backup for destructive migration — n/a: no migration
- [ ] Apply plan — n/a: no migration

### Rollback

- [ ] Rollback position stated — n/a: the script is never deployed; the `map-preview.ts` move is covered by an ordinary Pi rollback, with no schema involved

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | minor | First draft called `https://www.google.com` "no longer opens a place" — it never was one | fixed: "This link is not a Google Maps place" |
| 2 | minor | First draft listed Plus Codes and typed coordinates as Google's guess | fixed: they pass, being exact (decision file) |
| 3 | minor | Node's "module type not specified" warning printed above the report | fixed: suppressed in the script |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | A contact with a `maps.app.goo.gl` link still shows its map thumbnail and opens the right place when tapped (the follower moved files) | `test.lannacare.org/contacts/<id>` after deploy, signed in |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-08

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: the list is not empty; awaiting Lutan

Manual verification by: pending: one contact map checked on the deployed build

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet — after merge

Result: pass
