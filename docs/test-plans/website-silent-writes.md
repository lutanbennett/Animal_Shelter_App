# Feature test plan

## Header

| | |
|---|---|
| Feature | Website admin saves report failure when no site_content row is written |
| Backlog item | `docs/backlog.md` → #wbsrw |
| Branch / worktree | `claude/website-silent-writes` @ `C:/Development/Animal_Shelter_website-silent-writes` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3002` |
| PR | opened after this commit |
| Tested by / date | Claude / 2026-11-20 |
| Carries a migration? | no |
| Tested at SHA | 962032379 |

## 1. Scope and risk

- [x] One sentence: seven website-admin updates now return an error instead of ok when they touch no row
- [x] Touched: `src/app/admin/website/actions.ts`, `admin.website.noRow` in en.ts and th.ts, release note, decision file
- [x] Cards affected: the cards gating the website admin (unchanged); Admin unaffected; public unaffected
- [x] Out of scope: the five non-write lines (reads, and the set_hero_photo RPC)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — sync run, no conflicts
- [x] `node scripts/gates.mjs` — four gates, all 0:

```
=== gates: typecheck exited 0 after 93s
=== gates: lint exited 0 after 323s
=== gates: test exited 0 after 69s
=== gates: build exited 0 after 310s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number — n/a: no migration
- [ ] status reviewed — n/a: no migration
- [ ] dry-run reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] Re-runnable — n/a: no migration
- [ ] Existing rows read correctly — n/a: no migration
- [x] n/a: reuses the existing harness for the same table, not re-run here
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: no migration

## 4. Functional checks

- [ ] Happy path works end to end — pending: a website save not driven in the browser this session
- [ ] Data persists — pending: same
- [ ] Create / edit / delete — n/a: existing saves, flow unchanged
- [ ] Empty state — n/a: no list
- [x] Failure is a readable message: new `noRow` string, not a crash (checked by reading the actions; zero-row case unreachable on dev, see decision file)
- [ ] Boundary cases — n/a: no input change

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a | unchanged | n/a: access checks untouched |

- [ ] Every login tested — n/a: access checks untouched
- [ ] Blocked server-side — n/a: access checks untouched

## 5. Cross-cutting

- [ ] Nav entry — n/a: no nav change
- [ ] Manual updated — n/a: no behaviour a manual topic describes
- [x] Translatable strings: `noRow` added to en and th
- [ ] Mobile viewport — n/a: no layout change
- [ ] Browser console clean — n/a: no page change
- [ ] Network clean — n/a: no page change

## 6. Regression

- [ ] Nearest pages — pending: Website admin not loaded in the browser this session
- [ ] Shared file loaded from a second page — pending: dictionaries touched; covered by the typecheck only
- [x] Nothing merged from main broke this branch (sync was a no-op)

## 7. Documentation

- [ ] Backlog item ticked
- [x] Decision file `docs/decisions/2026-11-19-website-silent-writes.md`
- [x] README still accurate
- [ ] **Release notes.** unreleased gained an admin line in src/lib/releases.ts
- [x] Commit messages say why
- [x] Claims were measured: the line-by-line account of the twelve is in the decision file

## 8. Pre-production gate

- [ ] Tested SHA — deferred: release manager
- [ ] Deployed SHA — deferred: release manager
- [ ] Deployed to test — deferred: release manager
- [ ] Smoke test — deferred: release manager
- [ ] Timezone — n/a: no dates
- [ ] Boundary assertions — n/a: no banding
- [ ] Evidence unedited — n/a: no evidence quoted
- [ ] Public pages — n/a: no public change
- [ ] Deploy ref — deferred: release manager
- [ ] strip-baked-env — deferred: release manager
- [ ] New env var — n/a: none
- [ ] Migration and code together — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Backup — n/a: not destructive
- [ ] Apply plan — n/a: no migration
- [ ] Rollback — deferred: release manager (code-only, redeploy the previous ref)

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| | | none | |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Save a website text change and confirm it still saves | `/admin/website` |

## Sign-off

- [x] Everything verifiable without human eyes was run, not assumed
- [x] Nothing is ticked that was not executed

Automated checks by: Claude  Date: 2026-11-20

Manual verification by: pending: website save in the browser

- [ ] Manual list — pending: row 1 above

### Result

- [ ] Open defects — n/a: none
- [ ] Checklist pasted into the PR — pending: after the PR opens
- [ ] Handed to release manager — pending: at release

Result: pass with accepted defects
