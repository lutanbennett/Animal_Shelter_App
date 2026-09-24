# Feature test plan

## Header

| | |
|---|---|
| Feature | The assistant uses the shared `NOT_DECEASED` filter instead of its own literal copy |
| Backlog item | `docs/backlog.md` → Completed → Quick wins → "The assistant still carries its own copy of the "not deceased" filter" |
| Branch / worktree | `claude/assistant-deceased-filter` @ `C:\Development\Animal_Shelter_assistant-deceased-filter` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3008` |
| PR | [#81](https://github.com/lutanbennett/Animal_Shelter_App/pull/81) |
| Tested by / date | Claude (assistant-deceased-filter session), 2026-09-24 |
| Carries a migration? | no |
| Tested at SHA | the working tree committed as the feature commit on `claude/assistant-deceased-filter`, synced to `2f2ca39` (`main` at #77/#78) |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: `loadAssistantContext()` in `src/lib/assistant/data.ts` now calls `.or(NOT_DECEASED)` imported from `src/lib/residents/status.ts` instead of repeating the expression as a string literal. The item named `src/app/assistant/page.tsx`; the query has since moved into `data.ts`, which is where it was changed
- [x] Files/areas touched: `src/lib/assistant/data.ts` (one import, one substitution); `docs/backlog.md`; this plan. No `worker/`, no migration
- [x] Roles affected: whoever can open `/assistant` (admin, management, staff, volunteer) — behaviour intended identical
- [x] Out of scope: the other places that compare against `"Deceased"` (`src/app/residents/[id]/*`, `src/lib/management/report.ts`, `src/lib/placements/*`, …). Those are status comparisons in JS, not copies of this PostgREST expression; `grep -rn "neq.Deceased" src worker` finds no other copy after this change, so nothing was filed

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` (`2f2ca39`) merged in cleanly and pushed, before the change
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`:

```
=== gates: build exited 0 after 253s

gates: typecheck=0 lint=0 build=0
```

- [x] CI green on the PR — `check` and `test-plan` both pass on #81 at `1710ac3`

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `apply-migrations.mjs --status` reviewed — n/a: no migration
- [ ] `apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration
- [ ] Constraints and defaults exercised in a rollback harness — n/a: no migration
- [ ] Down-migration written — n/a: no migration
- [ ] Production apply plan stated — n/a: no migration

## 4. Functional checks

Driven in the in-app browser against `next dev` on :3008 (dev database), signed in, UI in Thai.

- [x] Happy path works end to end: `/assistant` loads; "Angsumalin อยู่ไหน" answered "Angsumalin (อังสุมารีน) อยู่ที่ ยังไม่ระบุกรง" with the R-0055 card, so living residents are still loaded
- [ ] Data persists — n/a: read-only change to which residents the assistant loads; nothing is written
- [ ] Create / edit / delete all exercised — n/a: no write path changed; the writes act on the same resident list, now filtered by the shared constant
- [ ] Empty state renders sensibly — n/a: the list is not empty in dev and the empty case is unchanged code
- [ ] Invalid input is rejected with a readable message — n/a: no new input
- [x] Boundary cases checked: Canyon (R-0015) is Deceased in dev (listed under `/residents?all=1` as เสียชีวิตแล้ว). "Canyon อยู่ไหน" and "R-0015 อยู่ไหน" both answered "หมายถึงตัวไหน? …" — the deceased resident is not matched by name or by code. The null-status half of the expression is the shared constant's, unchanged

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a: no change to access | unchanged | n/a |
| management | n/a: no change to access | unchanged | n/a |
| staff | n/a: no change to access | unchanged | n/a |
| vet | n/a: no change to access | unchanged | n/a |
| volunteer | n/a: no change to access | unchanged | n/a |
| signed out | n/a: no change to access | unchanged | n/a |

- [ ] Every role above tested — n/a: no route, action, RPC or policy changed; the same query runs through the same client
- [ ] A role that should not have access is blocked server-side — n/a: no access surface changed

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change
- [ ] Manual updated — n/a: behaviour is unchanged, so the assistant topic stays accurate
- [ ] Translatable strings go through the translation path — n/a: no strings added
- [ ] Mobile viewport (375px) — n/a: no layout change
- [x] Browser console clean — no errors during the assistant runs above
- [ ] Network clean — n/a: not inspected separately; each question got its answer, which is the only request the change affects

## 6. Regression

- [x] Nearest pages checked: `/assistant` (above) and `/residents`, which uses the same constant — 75 rows, none deceased, Canyon absent
- [x] Shared file `src/lib/residents/status.ts` not edited; its other consumer `/residents` checked by loading it, above
- [x] Nothing merged from `main` during `sync` was broken by this branch — gates green on the merged tree

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch and moved to Completed → Quick wins
- [ ] Non-obvious design choices appended to `docs/decisions.md` — n/a: no design choice; the constant and why it spells out the null case are already documented in `status.ts`
- [ ] `README.md` still accurate — n/a: the README does not describe the assistant's resident query
- [ ] **Release notes.** n/a: nobody would notice — the assistant sends the identical PostgREST filter it sent before; only where the string is defined changed
- [x] Commit messages say why, not just what
- [x] Claims in commit messages were measured, not reasoned: "the only literal copy" is the result of `grep -rn "neq.Deceased" src worker`; the behaviour claims are the browser answers quoted above

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: production release manager
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager

### On the deployed build

- [ ] Deployed to test — deferred: production release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: production release manager
- [ ] Timezone-sensitive behaviour proved — n/a: no date logic changed
- [ ] Boundary or banding change covered on both edges — n/a: no threshold changed
- [ ] Evidence pasted into this plan is the tool's actual output, unedited — n/a: the only pasted tool output is the `gates:` lines, copied as printed; the rest is browser text quoted inline
- [ ] Public pages re-checked after a cache purge — n/a: no public page changed

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: production release manager
- [ ] `strip-baked-env` line seen in the deploy output — deferred: production release manager
- [ ] Any new secret/env var exists in production — n/a: no new secret or env var

### Migration ordering — *skip if no migration*

- [ ] Does this PR contain both a migration and code that reads it? — n/a: no migration
- [ ] `apply-migrations.mjs --env production --dry-run` — n/a: no migration
- [ ] Production backup fresh — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position stated: `npx wrangler rollback --env production` restores the previous Worker; no schema or data involved

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| — | — | none | — |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| — | nothing — the change has no visible surface; the behaviour was driven in the browser above | — |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (assistant-deceased-filter session)  Date: 2026-09-24

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person — the list is empty

Manual verification by: n/a: no user-visible change; the filter string sent is identical and was exercised in the browser

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist in the PR: this file in the PR's diff, summarised in its description
- [ ] Handed to the production release manager — n/a: not yet — handed over once the PR is open

Result: pass

Release manager acknowledgement: pending
