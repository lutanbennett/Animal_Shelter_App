# Feature test plan

## Header

| | |
|---|---|
| Feature | Staff app chrome hidden on every `/th` public address |
| Backlog item | `docs/backlog.md` → `#thchr` |
| Branch / worktree | `claude/th-platform-chrome` @ `C:\Development\Animal_Shelter_th-platform-chrome` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3010` |
| PR | opened after this commit |
| Tested by / date | Claude, 2026-11-27 |
| Carries a migration? | no |
| Tested at SHA | 09e0abd43 |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs) — `src/app/PublicPathGate.tsx`, `src/lib/public-paths.ts` (+ test), `src/lib/releases.ts`
- [x] Cards affected identified (the cards whose behaviour changes; who holds them today is labelled context only), plus whether admin and the signed-out public are affected — no card; layout only, any signed-in login on a `/th` page; signed-out never saw the chrome
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised — the other three prefix lists and the language control (#ptlng)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends with one line of the shape `gates: typecheck=<N> lint=<N> test=<N> build=<N>` — **four gates, each `<N>` that gate's own exit code, and every `<N>` is `0`.**

```
=== gates: typecheck exited 0 after 48s
=== gates: lint exited 0 after 146s
=== gates: test exited 0 after 36s
=== gates: build exited 0 after 138s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number — n/a: no migration
- [ ] status reviewed — n/a: no migration
- [ ] dry-run reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] Re-runnable — n/a: no migration
- [ ] Existing rows — n/a: no migration
- [ ] Constraints harness — n/a: no migration
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end — headless Chrome signed in (management): before the fix staff chrome on `/th`, `/th/adopt`, `/th/donate`, `/th/platform/about`; after, none; `/residents` still has it
- [ ] Data persists — n/a: nothing is saved
- [ ] Create / edit / delete — n/a: nothing is saved
- [ ] Empty state — n/a: no list
- [ ] Invalid input — n/a: no input; unknown `/th/x` covered by unit test
- [x] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — `/th`, `/th/`, `/th/platform/shelters` (thPathRest null), `/thing`, `/theme`, `/thx/adopt` in unit tests

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a: layout only, no access change | — | — |
| management (role login, context only) | `/th/*` public pages | no staff chrome | pass |
| signed out | `/th/*` | no staff chrome (unchanged) | not re-run |

- [ ] Every login above tested — n/a: the change grants or denies nothing; one signed-in login shows the gate
- [ ] A login that should not have access is blocked server-side — n/a: no access change

## 5. Cross-cutting

- [ ] Nav entry — n/a: no nav change
- [ ] Manual updated — n/a: nothing a manual topic describes
- [ ] Translatable strings — n/a: no new strings
- [ ] Mobile viewport — n/a: removes chrome only, no new layout
- [ ] Browser console clean — n/a: not read after the fix; dev log showed no gate error after the fix commit
- [ ] Network clean — n/a: not read; no requests changed

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked) — `/residents` keeps chrome, `/adopt`, `/platform/about` without
- [x] Any shared file touched checked from a second, unrelated page — `/residents` loaded after the change
- [x] Nothing merged from `main` during `sync` was broken by this branch — sync was already up to date

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch**
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-11-27-th-addresses-hide-staff-chrome.md`
- [ ] `README.md` still accurate — n/a: README does not describe the gate
- [x] **Release notes.** Would a shelter user notice this change? Yes: line added to `unreleased`
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.**

## 8. Pre-production gate

- [ ] Tested SHA is tip of main — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager
- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on test — deferred: release manager
- [ ] Timezone — n/a: no time logic
- [ ] Boundary both edges — n/a: no threshold
- [ ] Evidence unedited — n/a: no deploy evidence in this plan
- [ ] Public pages re-checked after purge — deferred: release manager
- [ ] deploy line read — deferred: release manager
- [ ] strip-baked-env seen — deferred: release manager
- [ ] New secret — n/a: none
- [ ] Migration and code — n/a: no migration
- [ ] prod dry-run — n/a: no migration
- [ ] backup — n/a: no migration
- [ ] Apply plan — n/a: no migration
- [ ] Rollback position — deferred: release manager

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | high | First commit swapped the import but not the condition (ReferenceError in dev) | fixed in the next commit, before push of PR |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Lutan's own report: CooperJaidee page → ไทย, signed in, no left-hand menu | product host, after deploy |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-27

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — pending: Lutan to repeat his report after deploy

Manual verification by: pending: Lutan to repeat his report after deploy

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: linked from the PR body instead
- [ ] Handed to the production release manager — pending: release manager at the next release

Result: pass

Release manager acknowledgement: pending: release manager
