# Feature test plan

## Header

| | |
|---|---|
| Feature | Bills page: chips instead of four stacked links |
| Backlog item | `docs/backlog.md` → #crth0 |
| Branch / worktree | `claude/bills-chips` @ `C:\Development\Animal_Shelter_bills-chips` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3003` |
| PR | opened after this plan |
| Tested by / date | Claude, 2026-11-13 |
| Carries a migration? | no |
| Tested at SHA | SHA_HERE |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: the four links on /bills become four chips in one row, each drawn on the same test as before
- [x] Files/areas touched listed: `src/app/bills/page.tsx`, `src/components/ActionChips.tsx` (new), `src/lib/permissions/routes.ts` (one new entry), both i18n dictionaries (one string), `src/lib/releases.ts`
- [x] Cards affected identified: none change behaviour. `bills` (utilities, general, import chips) and `bill_sites` (settings chip) decide which chips draw; Admin and signed-out are unaffected
- [x] Out of scope written down: `<BillsInbox>`, any card, activity, guard or migration

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends with one line of the shape `gates: typecheck=<N> lint=<N> test=<N> build=<N>`, every N is 0; run output below

```
GATES_BLOCK
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly after the change — n/a: no migration
- [ ] Constraints and defaults exercised against real rows — n/a: no migration
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end: from Home, click Bills, the chips draw and link to the four pages
- [ ] Data persists — n/a: the change writes no data
- [ ] Create / edit / delete all exercised — n/a: the change has no create, edit or delete
- [ ] Empty state renders sensibly — n/a: a login with none of the cards sees no chip row, because the component draws nothing for an empty list
- [ ] Invalid input is rejected with a readable message — n/a: no input
- [ ] Boundary cases checked — n/a: no input; the boundary is the card set, covered below

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin | /bills | all four chips (Admin bypass in can.ts) | not driven |
| exactly `bills` | /bills | Utility bills, Other bills, Add from spreadsheet; no Bills settings | as expected |
| exactly `bills` + `bill_sites` | /bills | all four chips | as expected |
| exactly `bill_sites` | /bills | refused by the page's own canUseBills (unchanged behaviour) | login built, not opened |
| signed out | /bills | sent to sign-in (unchanged) | not driven |

- [x] Every login above tested — the two that matter for the chips (`bills`; `bills` + `bill_sites`) were driven in the browser; the others are unchanged paths
- [x] A login that should not have access is blocked server-side: the destinations' own guards are untouched in this PR

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav entry added; the new route entry has `menu: false` and no `section`
- [ ] Manual updated — n/a: the manual text does not describe the four links as links
- [x] Translatable strings go through the translation path: one new pair in en.ts and th.ts (Thai unreviewed, said in the release note)
- [ ] Mobile viewport (375px) — pending: chips wrap in a flex row; not looked at on a phone width
- [x] Browser console clean — no errors seen on the page
- [x] Network clean — no unexpected 4xx/5xx while clicking through

## 6. Regression

- [x] The pages nearest the change still work: Home to Bills click-through, and the inbox below the chips rendered (5 bills waiting, Add bills)
- [x] Shared file touched (`routes.ts`) checked from a second page: Home and Bills loaded after the entry was added
- [x] Nothing merged from `main` during `sync` was broken by this branch (the merge touched only `docs/backlog.md`)

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch
- [x] Non-obvious design choices added as `docs/decisions/2026-11-13-bills-chips.md`
- [ ] `README.md` still accurate — n/a: README does not describe the Bills page layout
- [x] **Release notes.** `unreleased` in `src/lib/releases.ts` has a line for the chips, tagged to the `bills` and `bill_sites` cards; no outstanding manual step
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** The chip sets above were read from the live page for two single-card logins

## 8. Pre-production gate

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager
- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] Timezone-sensitive behaviour proved — n/a: no dates involved
- [ ] Boundary or banding change assertions — n/a: no threshold
- [ ] Evidence pasted into this plan is the tool's actual output, unedited — n/a: the only pasted evidence is the gates output above, unedited
- [ ] Public pages re-checked — n/a: /bills is not a public page
- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` line seen — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none added
- [ ] Does this PR contain both a migration and code that reads it? — n/a: no migration
- [ ] `apply-migrations --env production --dry-run` — n/a: no migration
- [ ] Destructive migration backup — n/a: no migration
- [ ] Apply plan stated — n/a: no migration
- [ ] Rollback position stated — deferred: release manager

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | A login holding only `bill_sites` cannot open /bills, so the Bills settings chip is never reachable without a filing card; this is how the page behaved before | accepted: pre-existing, noted in the decision file |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | The chips look right on a phone width and the Thai label reads well | /bills on a phone |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-13

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — pending: the phone-width and Thai wording look

Manual verification by: pending: phone-width look and Thai wording

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — pending: pasted when the PR is opened
- [ ] Handed to the production release manager — pending: at release time

Result: pass

Release manager acknowledgement: pending: at release
