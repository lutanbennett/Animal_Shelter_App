# Feature test plan

## Header

| | |
|---|---|
| Feature | Recurring jobs: only offer people who can actually do the job |
| Backlog item | `docs/backlog.md` → "Recurring jobs: only offer people who can actually do the job" (Lutan, 2026-09-27, Pass 1) |
| Branch / worktree | `claude/recurring-jobs-eligible-assignees` @ `C:\Development\Animal_Shelter_recurring-jobs-eligible-assignees` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3012` |
| PR | #181 |
| Tested by / date | Claude (recurring-jobs-eligible-assignees session), 2026-09-27, signed in as the dev test user (admin) in the browser pane |
| Carries a migration? | no |
| Tested at SHA | the commit "Vets are never given a recurring job" (re-tested after Lutan's ruling, on top of `8e41c7c`); `sync` found `main` already merged |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — vets are never given a recurring job (Lutan's ruling in the session: a vet's work comes from vet appointments), and other roles only jobs on pages they can do the work on; the picker filters, save and Hand over refuse, and jobs already with such a person are flagged on Management → Recurring jobs and lose their link on that person's My tasks
- [x] Files/areas touched listed — new `src/lib/recurring-jobs/eligibility.ts` and `scripts/check-recurring-job-eligibility.mjs`; `src/app/management/recurring-jobs/` (actions, page, form, view); `src/lib/my-tasks/recurring.ts` and `src/app/my/page.tsx`; `src/lib/recurring-jobs/rule.ts` (a type only); en/th dictionaries; `src/lib/manual/en.ts`; `src/lib/releases.ts`; `docs/decisions.md`, `docs/backlog.md`. No `worker/`, no migration
- [x] Roles affected identified — admin and management (the Recurring jobs page, the only writers); vets, no longer assignable at all; staff and volunteers, narrowed by page
- [x] Anything explicitly **out of scope** written down — taking recurring jobs out of a vet's menu and shaping the vet's world around appointments (its own backlog item, with a draft user story); route guards (the vet-scope-navigation stream); a shared capability helper for both streams (follow-up, named in the PR); a database-level check (0095 is unchanged, so a direct table write skips the check — the display half is what catches that)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly ("Already up to date.")
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Paste its closing `gates:` lines below exactly as printed. They are the evidence, and running the script again regenerates them

```
=== gates: typecheck exited 0 after 25s
=== gates: lint exited 0 after 68s
=== gates: build exited 0 after 139s
gates: typecheck=0 lint=0 build=0
```

- [x] CI green on the PR (runs the same three). — #181 at `68d6330` (after merging `main`): check, test-plan and migration-numbers all SUCCESS

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration
- [x] Existing rows still read correctly after the change (checked against real dev data) — dev queried read-only first: nine assignee rows across five jobs; two active jobs are with a vet — "Stocktake of medication" (`/stocktake`, the Pass 0 case) and "Order medicine for the week" (no link) — and both are flagged ("2 jobs are with someone whose role can't be given them…"); no other job is
- [ ] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — n/a: no schema, constraint or default changed
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end — the form lists only eligible roles for the chosen screen and updates as the screen changes: Maintenance narrows to Admin, Management, Staff with a line saying so. No vet is listed for any screen, including none: `medphotos-vet` is absent from the picker and from Hand over's To list, and the form says "Vets aren't listed: their work comes from their vet appointments…"
- [x] Data persists — reload the page and the change is still there — the Hand over cover appeared under Handed to someone else after the action's refresh, and Give back removed it; the page reloaded with the flag still on the untouched job
- [x] Create / edit / delete all exercised (whichever the feature has) — edit: saving "Order medicine for the week" (no link) with the vet still ticked is refused ("Lutan Bennett can't be given this job: vets aren't given recurring jobs, and other roles only jobs on pages they can open. Choose someone else, or change the link."), nothing written, the vet listed as "Lutan Bennett — Vet (can't be given this job — untick to take them off)"; the Pass 0 job was refused the same way before the ruling; Hand over (dates) exercised both ways; create uses the same form and filter; delete is unchanged by this PR
- [x] Empty state renders sensibly (no rows yet) — with no screen chosen the "only roles that…" line is hidden and everyone is listed (observed). The banner's absent state was not seen, because dev keeps the one misassigned job as the fixture; it renders only on `misassigned > 0`, beside the unchanged stranded banner
- [x] Invalid input is rejected with a readable message, not a crash — the save refusal above, and Hand over's per-item "Some couldn't be handed over: Stocktake of medication, 2026-09-27: medphotos-vet@example.test can't open /stocktake, where this job is done. …" while the other date went through ("Handed over 1 date.") — before the ruling, then given back. After it a vet can't be chosen in To at all; the server check is the same call
- [x] Boundary cases checked — `scripts/check-recurring-job-eligibility.mjs`, 28 cases on the real exported functions: a vet on stocktake, no link, `/residents` and a vaccination form (all refused); query string (`/stocktake?tab=diets`), fragment, trailing slash, a detail page under a prefix (`/maintenance/<id>`), longest prefix (`/management/…`), a lookalike prefix (`/stocktakes` is not `/stocktake`), no link, empty link, no role, `public_viewer`, an unknown role. Output: `Every case held.`

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | Management → Recurring jobs; can be given any job | sees the flags, the filtered picker, the refusals | as expected — driven as the dev test user (admin) |
| management | same page as admin | same as admin | not signed in as; the page and actions use the same `requireManagementUser` / `assertManagementRole` as before, unchanged. Left for manual verification |
| staff | My tasks; offered for everything but `/management`, `/admin` | as stated | not signed in as; offered/refused per `rolesForJob`, proved by the script (E1–E16) |
| vet | My tasks; never offered a recurring job | an already-assigned job shows without a link and says to ask management | offering proved in the browser (neither vet listed; the one already on two jobs flagged and refused on save); the vet's own My tasks view **not** seen — no vet credentials. Left for manual verification |
| volunteer | My tasks; offered for stocktake, not maintenance | as stated | not signed in as; script E1, E3 |
| signed out | nothing new | redirected to `/login` as before | as expected — `/management/recurring-jobs` signed out went to `/login?next=…` |

- [ ] Every role above tested — n/a: only admin was signed in as; the others are proved by the script for who is offered, and the vet's own view is in the manual list
- [x] A role that should not have access is blocked server-side (hitting the URL directly fails) — the picker filter is backed by `saveRecurringJob` and `handOverRecurringJobs` refusing on the server, observed by saving with the ineligible vet still ticked; no page access changed

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no nav change
- [x] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — who is offered, never vets (Setting up recurring jobs); the red flag and how to clear it (same topic); vets aren't given recurring jobs, and what a mis-given job looks like on My tasks (Doing your recurring jobs). Found at `/manual` before the ruling; the rewording since is text only and the build passed
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: that page queues database content (0056); the new strings are dictionary entries, added to both `en.ts` and `th.ts`, and the Thai banner was seen rendering on the page
- [x] Mobile viewport (375px) — no overflow, controls reachable — banner and flagged card at 375×812; `scrollWidth <= innerWidth` true
- [x] Browser console clean — no errors or React warnings — no console errors across the recurring-jobs page, `/my` and `/manual`
- [ ] Network clean — no unexpected 4xx/5xx on the feature's pages — n/a: not inspected request by request; every action returned its expected result and the page rendered without a load error

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked) — Management → Recurring jobs (list, edit form, Hand over, Give back, Handed to someone else, Recently done); `/my` (renders; the admin has no recurring jobs of their own)
- [x] Any shared file touched checked from a second, unrelated page — `src/lib/manual/en.ts` by loading `/manual`; the en/th dictionaries by loading the recurring-jobs page in Thai and `/my` in English
- [x] Nothing merged from `main` during `sync` was broken by this branch — sync found nothing to merge; gates run after it

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** — ticked with a done note
- [x] Non-obvious design choices appended to `docs/decisions.md`, dated — 2026-09-27, "Who can do a recurring job is derived from its link, not stored"
- [x] `README.md` still accurate — README does not describe recurring-job assignment
- [x] **Release notes.** Would a shelter user notice this change? If so, `unreleased` in `src/lib/releases.ts` has a line for it, **in this PR**, written for a shelter user and not as a commit message. — one line: who is offered for which kind of job, and what an already-misassigned job looks like on both pages
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** — the dev row count and the one bad row come from the read-only query in this session; the refusals, the one-date hand-over and the filtered lists were observed in the browser; the role lists per path are the script's output

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: nothing here derives a date; Hand over's date range is unchanged
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary — not only the case the bug report named.** — n/a: not a band; the permission cutoff is covered both ways per path (roles in and out) by the script, beyond the stocktake case the report named
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.** — the gates block and the refusal sentences are copied from the run output
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — deferred: release manager

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production**. — deferred: release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: no new secret or env var

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — n/a: no migration
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh. — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position stated, **including what it does not cover**. — code only: `npx wrangler rollback --env production` restores the unfiltered picker completely; this PR writes no data and changes no schema. Anything assigned while it was live stays assigned, which is harmless under the old code

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | The two Hand over lists showed names only, so the dev admin and vet — both "Lutan Bennett" — were indistinguishable, and role is now what decides who can take a job | fixed — both lists now show the role |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Signed in as the vet who has two recurring jobs on dev: both of their jobs show on My tasks with "your role isn't given this job — ask management to reassign it", titles not links, and Skip still works | `/my` as `lutan.bennett1@…` (vet) on :3012 or `test.lannacare.org` |
| 2 | The Thai wording of the new sentences reads naturally (banner, card line, form hint and flag, save refusal, My tasks note) | Management → Recurring jobs and My tasks in ไทย |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-09-27

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: the list is not empty and nobody has looked yet

Manual verification by: pending: the vet's My tasks view of the flagged stocktake, and the Thai wording

### Result

- [x] Open defects are either fixed or explicitly accepted above — the one defect is fixed
- [x] Checklist pasted into the PR — in #181’s description
- [ ] Handed to the production release manager — n/a: not yet — handed over when a release is cut

Result: pass

Release manager acknowledgement: pending
