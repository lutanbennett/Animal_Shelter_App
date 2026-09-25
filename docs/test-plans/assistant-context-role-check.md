# Feature test plan

## Header

| | |
|---|---|
| Feature | `fetchAssistantContext()` checks the caller's role before loading; `/assistant` skips the load for roles that can't use it |
| Backlog item | `docs/backlog.md` → "`fetchAssistantContext()` has no role check of its own." |
| Branch / worktree | `claude/assistant-context-role-check` @ `C:\Development\Animal_Shelter_assistant-context-role-check` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3007` |
| PR | https://github.com/lutanbennett/Animal_Shelter_App/pull/120 |
| Tested by / date | Claude, 2026-09-25 (browser pane signed out; no account signed in) |
| Carries a migration? | no |
| Tested at SHA | `bb8b613` (fix `c0e78bf` + sync of `origin/main`); this plan is committed on top |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — `fetchAssistantContext` returns an empty context with `t.assistant.notAuthorized` unless `canUseAssistant(role)`, following `assistantLookup`'s shape, and `/assistant` skips the load for the same roles (the item's second question, answered yes in `docs/decisions.md`)
- [x] Files/areas touched listed — `src/lib/assistant/data.ts` (`loadAssistantContext` takes the role; new `loadAssistantRole`, `emptyAssistantContext`), `src/app/assistant/actions.ts` (the gate), `src/app/assistant/page.tsx` (skip the load), docs. No `worker/`, no migration, no UI component or string changed
- [x] Roles affected identified — vet (and any role-less signed-in user) now gets an empty context from the action; admin, management, staff and volunteer get the same context as before; signed-out callers get the empty context too, where before RLS gave them empty lists anyway
- [x] Anything explicitly **out of scope** written down — the wider Assistant work (backlog items 97–101). `recordAssistantTurn` is left without its own role check on purpose: 0070 gives vet no insert policy on `assistant_actions`, so RLS already refuses it (recorded in `docs/decisions.md`)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (merge `bb8b613`: `docs/test-plans/cut-release-0-4-0.md`, `package.json`, `src/lib/releases.ts`)
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Paste its closing `gates:` lines below exactly as printed. They are the evidence, and running the script again regenerates them

```
=== gates: build exited 0 after 341s

gates: typecheck=0 lint=0 build=0
```

- [x] CI green on the PR (runs the same three) — PR #120 at `6d7dada`: `check` pass (1m38s), `migration-numbers` pass, `test-plan` pass

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: no migration
- [ ] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — n/a: no migration. A rolled-back harness *was* run to size the gap, see section 4
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager (which file, which project, when) — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end — the refusal path, which is this change's happy path: the server action (id `00ce2e92…`, read from the dev client bundle) was POSTed directly with `Next-Action`, signed out, to the public paths `/login` and `/`. Both answered 200 with `{"residents":[],"zones":[],"enclosures":[],"vets":[],"role":null,"canWrite":false,"error":"Your account can't use the assistant."}`, before and after the sync. The allowed path (a role that *can* use it still gets its rows) is not driven: no account was signed in. It is in the manual list
- [ ] Data persists — reload the page and the change is still there — n/a: nothing is written
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: the feature has no create/edit/delete
- [ ] Empty state renders sensibly (no rows yet) — n/a: no list added; the empty context is what the panel and page already receive when RLS returns nothing
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: the action takes no input
- [x] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — the no-role case (`role: null`, signed out) is the gate's edge and is the one driven above. The size of the gap for a real vet was measured on dev in a rolled-back harness run as the live vet user (`set local role authenticated` + their `sub`): `role=vet residents=81 vets=5 enclosures=69 zones=16`. Anon reading the same tables through PostgREST got `42501 permission denied` on all four, so signed-out callers were never exposed

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | panel, `/assistant`, the action | full context, as before | not signed in as; `canUseAssistant('admin')` is true, so the code path is `loadAssistantContext` with the role passed in. Left for manual verification |
| management | same as admin | same as admin | not signed in as; same gate |
| staff | same as admin | same as admin | not signed in as; same gate |
| vet | nothing assistant | action returns the empty context + `notAuthorized`; `/assistant` shows only the "can't use" note and loads nothing | not signed in as (needs the vet account's password). Same branch as the signed-out case that was driven: `canUseAssistant` is false for both. Left for manual verification |
| volunteer | panel, `/assistant` (lookups only) | full context, read-only subtitle | not signed in as; same gate as admin |
| signed out | the action only, via a public path | empty context + `notAuthorized` | **pass** — driven, see Happy path |

- [ ] Every role above tested — n/a: only the signed-out caller could be driven; signing in as any role needs that account's password. The four allowed roles and vet go through the same `canUseAssistant` check, and the vet and allowed-role cases are in the manual list
- [x] A role that should not have access is blocked server-side (hitting the URL directly fails) — the action itself was called directly, not through any UI, by a caller `canUseAssistant` refuses (signed out), and returned no rows

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — appears for the right roles, no dead links — n/a: no nav change
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: nothing a user does or sees changed
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: no string added; the existing `t.assistant.notAuthorized` is reused
- [ ] Mobile viewport (375px) — no overflow, controls reachable — n/a: no layout change
- [x] Browser console clean — no errors or React warnings — `read_console_messages` errors-only empty after the calls
- [x] Network clean — no unexpected 4xx/5xx on the feature's pages — both direct action calls returned 200

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked) — `/login` loaded and served the action; `/assistant` signed out still redirects to `/login`. `/assistant` and the header panel for a signed-in role are compiled by the build but not loaded; they are in the manual list
- [ ] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — n/a: `src/lib/assistant/data.ts` is the only shared lib touched, and its only callers are the two changed here (`grep` for `loadAssistantContext`); `AppHeader.tsx` imports only `canUseAssistant`, which is unchanged
- [x] Nothing merged from `main` during `sync` was broken by this branch — the merge touched only release notes, the version and a release test plan; gates ran on the merged tree

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead)
- [x] Non-obvious design choices appended to `docs/decisions.md`, dated
- [ ] `README.md` still accurate — n/a: README does not describe the assistant's role checks
- [ ] **Release notes.** — n/a: no shelter user would notice. The four roles that use the assistant get the same context as before, and a vet's `/assistant` page renders exactly as it did (the note and the read-only subtitle); only a direct call to the server action, which no screen makes for a vet, answers differently
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** — the 81/5/69/16 counts are the harness output; "anon can read none of those tables" is the four `42501` responses; "a signed-out caller can reach it by posting to `/login`" is the driven call; "RLS already refuses `recordAssistantTurn` for a vet" is read from 0070's policies (no vet insert policy), not driven

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: nothing here derives a date
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary** — n/a: a role set membership check, no threshold or banding
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited.** — deferred: release manager
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — deferred: release manager

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: no new secret or env var

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — n/a: no migration
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position stated, **including what it does not cover** — `npx wrangler rollback --env production` restores the unchecked action; there is no schema or data change to revert

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | medium | Before this change, a vet calling `fetchAssistantContext` directly got 81 residents, 5 vets, 69 enclosures and 16 zones (dev counts) | fixed |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Signed in as a **vet**, in the browser console run the snippet in the PR description (POST to `/` with `Next-Action: 00ce2e924c1a82332fdf954fb04c8fad7b70cf5d99`): the reply has `"residents":[]` and `"error":"Your account can't use the assistant."`. Then open `/assistant`: only the "can't use" note | `http://localhost:3007` |
| 2 | Signed in as **admin, staff or volunteer**: the header's Assistant panel opens and "Where is Butter?" is answered, and `/assistant` works the same — the allowed path still loads its rows | `http://localhost:3007/assistant` |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (Opus 5.5)  Date: 2026-09-25

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: not yet — two items await Lutan

Manual verification by: pending: vet direct call returns empty context; allowed role still loads the assistant

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR description summarises it and links `docs/test-plans/assistant-context-role-check.md`, which is in the PR
- [ ] Handed to the production release manager — n/a: not yet — handed over with the PR once it merges

Result: pass
