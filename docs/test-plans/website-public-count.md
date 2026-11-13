# Feature test plan

## Header

| | |
|---|---|
| Feature | Website settings: animals in care beside animals shown on the website |
| Backlog item | `docs/backlog.md` → `#tu9v2` |
| Branch / worktree | `claude/website-public-count` @ `C:\Development\Animal_Shelter_website-public-count` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3001` |
| PR | pending: number assigned when opened |
| Tested by / date | Claude, 2026-11-13 |
| Carries a migration? | no |
| Tested at SHA | ef3a000a8 |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: a card on the Website settings Home tab showing animals in care, animals shown on the website, and the gap
- [x] Files/areas touched listed: `src/app/admin/website/page.tsx`, new `PublicCount.tsx`, both dictionaries, `src/lib/releases.ts`, decision, backlog tick
- [x] Cards affected identified: draws only where `resident.record` at read is held (e.g. `view_residents`) together with `website`; admin unaffected, signed-out public unaffected
- [x] Anything explicitly **out of scope** written down: no migration, no public page change, no publishing of residents

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (already up to date)
- [x] `node scripts/gates.mjs` ends with the four-gate line, all `0`:

```
=== gates: typecheck exited 0 after 153s
=== gates: lint exited 0 after 236s
=== gates: test exited 0 after 58s
=== gates: build exited 0 after 379s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `apply-migrations.mjs --status` reviewed — n/a: no migration
- [ ] `apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration
- [ ] Constraints and defaults exercised — n/a: no migration
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end: login with `website`+`view_residents` sees 13 in care, 2 shown, 11 not shown
- [ ] Data persists — n/a: read-only display, nothing is saved
- [ ] Create / edit / delete — n/a: read-only display
- [ ] Empty state renders sensibly — n/a: zero renders as 0, no list involved
- [ ] Invalid input — n/a: no input
- [ ] Boundary cases — n/a: gap is clamped at 0 in `PublicCount.tsx`; not exercised with live data

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin | Website page | counts drawn (isAdmin short-circuit) | not run: pending Lutan |
| `website` + `view_residents` | Website page | counts drawn | 13 / 2 / 11 shown |
| exactly `website` | Website page | page without the counts card | card absent, Impact figures present |
| signed out | Website page | redirected | not run: page guard unchanged |

- [ ] Every login above tested — pending: admin and signed-out not driven
- [x] A login that should not have the counts does not get them: the counts are not even queried (gated before the read); the page itself is unchanged

## 5. Cross-cutting

- [ ] Nav entry — n/a: no new route
- [ ] Manual updated — n/a: one read-only figure card on an existing screen
- [x] Translatable strings go through the dictionaries (en and th); Thai not checked by a Thai speaker, said in the release note
- [ ] Mobile viewport — pending: grid is one column below `sm`, not looked at
- [ ] Browser console clean — pending: not read
- [ ] Network clean — pending: not read

## 6. Regression

- [x] The pages nearest the change still work: the Home tab's Impact figures render for the `website`-only login
- [ ] Shared file touched checked from a second page — n/a: `page.tsx` is this page's own; `releases.ts` and dictionaries only gained entries
- [x] Nothing merged from `main` during `sync` was broken by this branch (nothing merged)

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch
- [x] Non-obvious design choices added: `docs/decisions/2026-11-13-website-public-count.md`
- [ ] `README.md` still accurate — n/a: not mentioned there
- [x] **Release notes.** `unreleased` has a line, tagged `view_residents`
- [x] Commit messages say why, not just what
- [x] Claims in commit messages were measured, not reasoned: the `public_resident_cards` overcount is stated from 0350's own header; the browser reading is real

## 8. Pre-production gate

- [ ] Deployed build checked — deferred: release manager
- [ ] Production apply done — n/a: no migration

## Defects

None found.

Automated checks by: Claude  Date: 2026-11-13
Manual verification by: pending: Lutan to look at the Website page with a login that can read residents  Date: pending

Result: pass
