# Feature test plan

## Header

| | |
|---|---|
| Feature | Public site speed follow-ups: 160 px header logo, WebP photos |
| Backlog item | `docs/backlog.md` → Public site, two small speed follow-ups from the SEO audit |
| Branch / worktree | `claude/public-site-speed-follow-ups` @ `C:\Development\Animal_Shelter_public-site-speed-follow-ups` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3003` |
| PR | not yet — the PR does not exist at this commit |
| Tested by / date | Claude, 2026-10-15 |
| Carries a migration? | no |
| Tested at SHA | b426ea5d |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches the item: a small header logo, and WebP sized photos for browsers that send Accept: image/webp
- [x] Files/areas touched listed: `public/lca-logo-160.jpg`, `PublicHeader.tsx`, `public-paths.ts` (+ test, check script), `api/photos/[fileId]/route.ts`, `google/drive.ts`, `photo-cache.ts`
- [x] Roles affected identified: signed-out public (and every viewer of public photos); no role logic changed
- [x] Out of scope written down: the other audit findings, robots.ts, and the three person-only steps; the archive path is deliberately unchanged

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — origin/main merged in cleanly
- [x] `node scripts/gates.mjs` closing line:

```
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — skip if no migration

- [ ] Migration number is one above the highest on main — n/a: no migration
- [ ] `--status` reviewed before applying — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration
- [ ] Constraints and defaults exercised against real rows — n/a: no migration
- [ ] Down-migration written — n/a: no migration, nothing to revert
- [ ] Production apply plan stated — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end: dev /adopt photos fetched with Accept image/webp return image/webp; with image/jpeg or no Accept return image/jpeg
- [x] Data persists — n/a-equivalent verified: the second fetch is served from cache and the format still follows Accept
- [ ] Create / edit / delete all exercised — n/a: no data is created or edited
- [ ] Empty state renders sensibly — n/a: no list; a photo with no rendition falls back to the original as before
- [ ] Invalid input is rejected — n/a: the existing invalid-size 400 is untouched; Accept is only ever a hint
- [ ] Boundary cases checked — n/a: an Accept with no webp, or no Accept, both give JPEG (checked); no ?w= is never negotiated by code

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a | no change | n/a: access rules untouched |
| management | n/a | no change | n/a: access rules untouched |
| staff | n/a | retired role | n/a: retired |
| doctor | n/a | no change | n/a: access rules untouched |
| volunteer | n/a | no change | n/a: access rules untouched |
| signed out | public photos and logo | served | checked: photos by curl with no cookie; logo path in both lists, tests and check-public-paths pass |

- [ ] Every role above tested — n/a: only the signed-out path changed; the is_public / can_see checks run before any format logic, unchanged
- [ ] A role that should not have access is blocked server-side — n/a: no access rule changed

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change
- [ ] Manual updated — n/a: nothing a user operates changed
- [ ] Translatable strings — n/a: no new strings
- [ ] Mobile viewport (375px) — n/a: the logo's displayed size is unchanged
- [ ] Browser console clean — n/a: not driven in a browser; checked with curl only
- [x] Network clean — no 4xx/5xx on the photo requests

## 6. Regression

- [x] The pages nearest the change still work: /adopt and / load on dev and their photos return 200
- [ ] Any shared file touched checked from a second page — n/a: shared files touched are the photo route and public-paths, both exercised through /adopt and the tests
- [x] Nothing merged from main during sync was broken by this branch

## 7. Documentation

- [x] Backlog item ticked in docs/backlog.md on this branch
- [x] Decision added: docs/decisions/2026-10-15-webp-photos-and-small-logo.md
- [x] README.md still accurate
- [x] **Release notes.** One line added to `unreleased` in src/lib/releases.ts about the faster public site
- [x] Commit messages say why, not just what
- [x] Claims were measured: 526,106 to 329,292 bytes over 8 photos on dev; logo 33,032 to 5,492 bytes

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of main at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on test.lannacare.org — deferred: release manager
- [ ] Timezone-sensitive behaviour proved — n/a: no date logic
- [ ] Boundary or banding change assertions — n/a: no threshold or band
- [ ] Evidence pasted is the tool's actual output — n/a: only the gates line is pasted, as printed
- [ ] Public pages re-checked after cache purge — deferred: release manager (the edge namespace moved to public-v3, so old entries are orphaned on deploy)

### Deploy safety

- [ ] deploy line read and ref matches production — deferred: release manager
- [ ] strip-baked-env line seen — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none added

### Migration ordering — skip if no migration

- [ ] Both a migration and code that reads it — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Destructive migration backup — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [ ] Rollback position stated — n/a: revert the PR and redeploy; the extra edge and disk entries are harmless and expire; no schema

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | Low | First version asked Drive for WebP via the Accept header, which Drive ignores; found by measuring, fixed by the -rw size suffix | fixed |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | A phone or Chrome loads an animal page with photos showing normally; Safari too | test.lannacare.org after deploy |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-15

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: one item awaits a person

Manual verification by: pending: someone to look at an animal page in a real browser after deploy

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet — the PR does not exist at this commit

Result: pass

Release manager acknowledgement: n/a: not yet released
