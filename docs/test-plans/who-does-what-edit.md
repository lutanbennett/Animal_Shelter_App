# Feature test plan — who-does-what-edit

## Header

| | |
|---|---|
| Feature | Settings → Who does what: an Admin, behind the authenticator-app step, changes a box; saved at once and in Recent changes; prerequisite rules refuse impossible combinations; outreach writers folded in; `/admin/role-draft` redirects |
| Backlog item | `docs/backlog.md` → `## Next up` → "PRIORITY (Lutan, 2026-10-10): Settings → Who does what…", step (e); ticked against the amended done-when. Spun out: `perm-split-activities` (new), `perm-narrow-policies` (existing item, named) |
| Branch / worktree | `claude/who-does-what-edit` @ `C:\Development\Animal_Shelter_who-does-what-edit` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3001` |
| PR | (opened after this commit) |
| Tested by / date | Claude, 2026-10-11 |
| Carries a migration? | no |
| Tested at SHA | `682e50e1` (code; this plan is the next commit) |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: an Admin changes a box on the grid behind 2-step, saved at once and listed in Recent changes, with the §6 rules held on the server and the two prerequisite combinations refused
- [x] Files/areas touched listed: `src/app/admin/who-does-what/` (page, `actions.ts`, `CellSelect.tsx`), `src/lib/permissions/prerequisites.ts` (new) and `fixed-for-now.ts`, `src/app/admin/security/` (outreach writers removed), `src/app/admin/role-draft/page.tsx` (now a redirect), both dictionaries, manual, releases, `scripts/check-who-does-what.mjs`, `check-prerequisites.mjs` (new), `check-permission-catalogue.mjs`
- [x] Roles affected identified: Admin edits; Management sees the same grid and cannot change it; every other role is unaffected
- [x] Anything explicitly **out of scope** written down: `notAskedYet` and `databaseWider` (need SQL, one migration per batch; own backlog items); the doctor's clinic boxes (the clinic rule's, not editable)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly ("Already up to date")
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Paste its closing `gates:` lines below exactly as printed. They are the evidence, and running the script again regenerates them (the first run failed lint on the permission-catalogue check for the retired `/admin/role-draft` guard; fixed in the next commit, then green)

```
=== gates: build exited 0 after 34s

gates: typecheck=0 lint=0 build=0
```

- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration (`0180` is `perm-drop-enum`'s)
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly after the change — n/a: no migration
- [ ] **Constraints and defaults exercised against real rows** — n/a: no migration; `check-who-does-what.mjs` is rolled-back probing, recorded in §4
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager — n/a: no migration

## 4. Functional checks

- [x] Happy path, as far as it could be driven: `node scripts/check-who-does-what-page.mjs http://localhost:3001` against the dev server, as throwaway Admin and Management logins, ends `OK`: 6 role columns, 61 activity rows, all 366 boxes say what `role_permissions` holds, 30 "fixed for now" marks exactly where `FIXED_FOR_NOW` shows them, CSV 61 rows. **The edit itself was not driven in a browser**: it needs an Admin session verified with a real authenticator app, which a throwaway login cannot have (see Left for manual verification)
- [x] Prerequisite rules: `node scripts/check-prerequisites.mjs` ends `OK`, 14 cases: stock.correct refused with no list box or with Read only, allowed with Edit on either list, turning it off always allowed, the last list box cannot be lowered under it, one of two can; recurring.do_any refused without do_own and do_own cannot be taken away under it; an unrelated box is not blocked by an existing unmet combination
- [x] Measured: `node scripts/check-who-does-what.mjs` (dev) after: 306 boxes, OBEYED 184, WRONG 27, STICKY 15, UNLISTED 0, STALE 0, OVERLISTED 0, FAULT 0, ends `OK`. Before: the same counts with 7 entries; the two removed entries' boxes (`second_in_command stock.correct`, `management recurring.do_own`) now print `[prerequisite rule]`
- [ ] Data persists — reload the page and the change is still there — n/a: the write path is a `role_permissions` upsert or delete as the Admin's session, which a throwaway login cannot reach (aal2); Lutan's item 1 below covers it
- [ ] Create / edit / delete all exercised — n/a: edit (upsert) and "None" (delete) not driven for the reason above; the same writes were exercised by the outreach writers this replaces
- [ ] Empty state renders sensibly — n/a: the catalogue always has activities and roles
- [x] Invalid input is rejected with a readable message, not a crash: server-side in `setCell` (not Admin, no 2-step, fixed role, unknown activity, bad level, clinic box, prerequisite) each returns a message from the dictionaries; the prerequisite ones are covered by the script above, the others by reading the action, not by a driven call
- [ ] Boundary cases checked — n/a: no free text; levels are a closed set checked against the catalogue's kind

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | the grid | editable with 2-step; read-only with a "verify" prompt without it | read-only variant driven (200, grid correct); editable variant not driven (see above) |
| management | the grid | the same grid, no edit controls | driven: 200, 366 boxes, no controls (the server action also refuses a non-Admin) |
| staff | — | n/a | n/a: retired role (`0173`) |
| doctor | the grid | refused | not driven: neither Admin nor Management, the guard is unchanged |
| volunteer | the grid | sent to `/no-access` | not driven in this stream: the guard is unchanged |
| signed out | the grid | sent to sign-in | unchanged guard |

- [x] Every role above tested (staff retired; the others share the unchanged guard, stated in the rows)
- [x] A role that should not have access is blocked server-side: `setCell` checks Admin and 2-step itself and does not rely on the page hiding the control; `role_permissions`' own RLS (`0132`) is the second lock

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no navigation change
- [x] Manual updated (`src/lib/manual/en.ts`): the Who does what topic says an Admin edits and Management looks; the outreach topic points to the grid
- [x] Translatable strings go through the translation path: every new word is in both `en.ts` and `th.ts` (typecheck enforces the shape); the Thai wording is Claude's and is Lutan's item 3
- [ ] Mobile viewport (375px) — n/a: not driven; the control is a native select in the existing scrolling grid
- [ ] Browser console clean — n/a: no signed-in browser session was driven
- [ ] Network clean — n/a: as above

## 6. Regression

- [x] The pages nearest the change still work: the grid as Admin and Management (page check); the Security page builds (gates) with the outreach section removed
- [x] Any shared file touched checked from a second, unrelated page: `en.ts` and `th.ts` lost the outreach `writers` block and two `fixed` entries and gained an `edit` block; typecheck and build pass on every page that reads them
- [x] Nothing merged from `main` during `sync` was broken by this branch: nothing was merged

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch, with the amended done-when and what is left; the *Roles and permissions each shelter configures* item's status updated (stage 2 built, stage 3 open)
- [x] Non-obvious design choices added as a new file in `docs/decisions/` (`2026-10-11-who-does-what-edit.md`)
- [x] `README.md` still accurate — nothing in it described the grid as view only
- [x] **Release notes.** Would a shelter user notice this change? Yes: an Admin can change who does what. `unreleased` has a line for Admin
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and decisions were measured, not reasoned**: the before/after counts are from `check-who-does-what.mjs` runs; the prerequisite behaviour is from `check-prerequisites.mjs`

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager (as Admin with the authenticator app: change one box, see it in Recent changes, sign in as that role)
- [ ] **Timezone-sensitive behaviour proved** — n/a: nothing depends on a date
- [ ] **Boundary assertions cover both edges** — n/a: the prerequisite rules are covered on both sides in the script, no band or threshold
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** (the gate lines)
- [ ] Public pages re-checked after a cache purge — n/a: no public page changed

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref matches production — deferred: release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — deferred: release manager. None added

### Migration ordering — *skip if no migration*

- [ ] Does this PR contain both a migration and code that reads it? — n/a: no migration
- [ ] `--env production --dry-run` — n/a: no migration
- [ ] Production backup for a destructive migration — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [ ] Rollback position stated — deferred: release manager. Code-only. **No migration, but a box changed on production bites immediately** (`has_permission()` reads live): the feature is live the moment it deploys and a mis-set box takes effect at once. Every change is in Recent changes; set the box back to undo. `deploy-pi.sh --ref <previous sha>` removes the editor, not any box already changed

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | minor | The first gates run failed lint: the permission-catalogue check still pinned an Admin guard for `/admin/role-draft`, now a redirect | fixed: listed as an exempt redirect |
| 2 | minor | The 2IC's existing Yes on `stock.correct` (no list box) is a combination the rules forbid; it stays stored, shown with a warning | accepted: not silently rewritten; fixing it is an Admin edit or a data decision |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | **Lutan: open the grid, change a box for a role, sign in as that role on dev and see the change.** Needs your authenticator app, so Claude could not drive it. Also: change it back, see both in Recent changes, and try turning on "correct a stock figure" for a role with no list box (it should refuse with a reason) | test.lannacare.org → Settings → Who does what |
| 2 | Outreach notes row: set Management's level there and confirm Settings → Security no longer has the section | same grid; Settings → Security |
| 3 | The Thai wording of the new editing messages reads naturally | the same page in Thai, a Thai-reading person |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (Sonnet 5.5)  Date: 2026-10-11

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: not yet; the three items above are Lutan's

Manual verification by: pending: Lutan changing a box and signing in as that role, the outreach row, and the Thai wording

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR links the plan file and quotes its key lines
- [x] Handed to the production release manager: the PR names the live-the-moment-it-deploys hazard

Result: pass with accepted defects

Release manager acknowledgement: pending  Date: —
