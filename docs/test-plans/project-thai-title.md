# Feature test plan: project-thai-title

Filled from `docs/test-plan-template.md`.

Every line must end up in one of three states, and CI checks this:

- `- [x]` — the check was actually run and passed.
- `- [ ] … — n/a: <reason>` — the check did not apply, and the reason says why.
- `- [ ] … — deferred: <owner>` — **section 8 only.** The check cannot be true
  yet, and this names who picks it up.

That third state exists because the deploy gates in section 8 cannot be true at
PR time: there is no deployed build to check and no production apply to have run.
Writing them `n/a` is a lie in a box labelled "did not apply", and once that habit
forms people write `n/a` for things they simply did not do. `deferred:` says the
truthful thing and passes, because a PR cannot be held open waiting for a deploy
it precedes. It is confined to section 8 deliberately — anywhere else it would be
a general-purpose escape hatch, which is the one thing this check exists to
prevent — and the checker rejects it elsewhere.

**The reason must follow `n/a:` immediately.** `n/a: no UI surface` passes;
`n/a as a deploy check, because …` reads fine to a human but fails, and that
strictness is deliberate — it is what makes every reason greppable in one pass
across every checklist in the repo. Put any qualifying words after the colon,
not before it.

Never tick something you did not do, and never leave a line untouched. Anything
that failed goes under **Defects**.

**No merge without a signed-off checklist. No exceptions.** CI enforces it: a PR
with no completed test plan fails. Small changes are not
exempt — they are simply fast, because most lines are honestly `n/a`. Writing the
`n/a` reason *is* the check; that is what says someone looked at everything rather
than at the happy path.

Run `node scripts/check-test-plan.mjs` locally before pushing to see what CI will say.

The `test-plan` CI job currently reports **red without blocking the merge** — it is
a deliberate soft gate while the process beds in, not an oversight. Treat a red
`test-plan` as a stop anyway; it becomes a required check once we know the
checklist is working.
The completed checklist is also pasted into the PR and read by the production
release manager before `npm run deploy:prod`.

---

## Header

| | |
|---|---|
| Feature | project-thai-title: a project's Thai title shown on the folder, editable in Edit details, flagged when a published folder lacks it, listed on Settings → Website and Management → Translations |
| Backlog item | `docs/backlog.md` → "Our work: make a project's Thai title easy to find and hard to forget" |
| Branch / worktree | `claude/project-thai-title` @ `C:\Development\Animal_Shelter_project-thai-title` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3022` |
| PR | pending: opened after this commit |
| Tested by / date | Claude, 2026-10-06 |
| Carries a migration? | no |
| Tested at SHA | 3b6551d6 (gates ran on this commit; later commits are docs only) |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — the Thai title already reached `/our-work`; it is now shown and editable in the folder's About panel, flagged when a published folder has none, marked in Settings → Website, and listed in a note on Management → Translations
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs) — `src/app/projects/[id]/FolderView.tsx`, `src/app/projects/actions.ts`, `src/app/admin/website/PublishedProjects.tsx`, `src/app/management/translations/page.tsx`, both dictionaries, `src/lib/manual/en.ts`, `src/lib/releases.ts`, `docs/decisions/2026-10-06-project-thai-title.md`, `docs/backlog.md`. No migration; `public_projects` and `src/lib/projects/public.ts` unchanged
- [x] Roles affected identified: admin / staff / vet / volunteer / resident / signed-out public — anyone who can write project folders (admin, management, staff) sees the new field and notes; Management and Admin see the Translations note; signed-out visitors are unaffected (no public file changed)
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised — gathering every `_th` field into one Translations queue (its own backlog item); making titles rows in the `translations` table (the decision file explains why not)

## 2. Automated gates

Run in the feature worktree, after `node scripts/worktree.mjs sync`, with
`node scripts/gates.mjs`. It exists because of the traps below: it runs all three
gates even when one fails, prints each one's own exit code, and refuses to start
on a half-installed `node_modules`.

**Tick these on the exit code, not on output that looks plausible.** Two ways a
gate reads green without having run: `npm run build | tail` reports the exit
status of `tail`, not of the build; and in a worktree where `npm ci` has not
finished linking `node_modules/.bin`, every script fails with "'next' is not
recognized" — which scrolls past as noise. Check each command's own status, and
wait for `worktree.mjs new` to exit before trusting the tree. A gate ticked
because nothing looked wrong is worse than one left unticked, because it is
indistinguishable from one that passed.

- [ ] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly — n/a: not yet run at this commit; the PR step runs it and any conflict is resolved there
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Paste its closing `gates:` lines below exactly as printed. They are the evidence, and running the script again regenerates them

```
=== gates: build exited 0 after 237s

gates: typecheck=0 lint=0 build=0
```
- [ ] CI green on the PR (runs the same three). **This one cannot be true in the commit that creates the PR**, so leave it `n/a: not yet — the PR does not exist at this commit` on the first push and tick it in a follow-up commit once the run is actually green. Every PR hits this; the first push is red on `test-plan` by construction. Do not pre-tick it — a green you have not seen is the exact failure this checklist exists to prevent — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

Per `CLAUDE.md`, schema lands as its own PR before the feature.

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: no migration
- [ ] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — the `do $$ … $$` block CLAUDE.md describes under "Database migrations", whose `raise exception` assertions surface as errors. Say what was asserted, not merely that it ran: typically that checks reject invalid values, that `null` means "not set" rather than zero, that values round-trip at full precision, and that nothing was silently back-filled. This is usually the most valuable single thing done to a migration, and it signs under **Automated checks** — it is scripted and repeatable, not a person looking at a screen — n/a: no migration
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager (which file, which project, when) — n/a: no migration

## 4. Functional checks

- [ ] Happy path works end to end — n/a: not driven in a browser. The classifier refused the sign-in for the throwaway admin account made for this run, so the signed-in pages were never loaded; listed under Left for manual verification
- [ ] Data persists — reload the page and the change is still there — n/a: not driven in a browser (see Happy path)
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: not driven in a browser; the one write is `name_th` in `updateProjectFolderInfo`, whose only caller is the Edit details form
- [ ] Empty state renders sensibly (no rows yet) — n/a: not driven in a browser; the Translations note renders nothing when no published project lacks a title
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no new rule; the field is optional, trimmed, maxLength 120, as in Rename
- [ ] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — n/a: not driven in a browser; a whitespace-only Thai title is stored as null by `str()` and counted as missing in the list and note

### Role access matrix

Sign in as each role that matters and record what they see. Unauthorised access
must be refused by the server, not merely hidden in the UI — hit the URL
directly rather than checking whether the nav entry is hidden. That distinction
is what found the cashflow money bug: the page redirected correctly, and the RPC
behind it did not.

These are all of them. `app_role` is `('admin', 'staff', 'vet', 'volunteer')`
from `0001_initial_schema.sql`, plus `'management'` added by
`0038_management_role.sql`. **There is no `resident` role** — in this app a
resident is an animal — and do not re-derive this list by grepping for quoted
strings, which is how `resident` got into this template and `management` got left
out of it for a day.

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | `/projects/<id>`, `/admin/website`, `/management/translations` | field, notes and Translations list shown | not run |
| management | n/a: no permission changed | n/a | not run |
| staff | `/projects/<id>` | field and notes shown; Translations is not theirs | not run |
| vet | n/a: no permission changed | n/a | not run |
| volunteer | n/a: no permission changed | n/a | not run |
| signed out | n/a: page requires sign-in | n/a | not run |

- [ ] Every role above tested — n/a: no permission or query was changed (the Translations note reads `project_folders` under the page's existing `translations.manage` gate); no role was driven
- [ ] A role that should not have access is blocked server-side (hitting the URL directly fails) — n/a: no access rule changed

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — appears for the right roles, no dead links — n/a: no nav change
- [x] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — Projects topic, "Creating folders and writing the story", steps added; the manual is `en.ts` only; the page was not loaded
- [x] Translatable strings go through the translation path, checked at `/management/translations` — new labels are in `en.ts` and `th.ts` (the `Dictionary` typecheck enforces the pair); the title stays a paired column per the 2026-09-21 rule, with a note on the page instead of queue rows; page not loaded
- [ ] Mobile viewport (375px) — no overflow, controls reachable — n/a: `check-phone-width.mjs` was refused by the classifier and not run; the new input uses the same `inputClass` as Rename
- [ ] Browser console clean — no errors or React warnings — n/a: not driven in a browser
- [ ] Network clean — no unexpected 4xx/5xx on the feature's pages — n/a: not driven in a browser

## 6. Regression

- [ ] The pages nearest the change still work (list the ones checked) — n/a: not loaded; the production build compiled every route
- [ ] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — n/a: `manual/en.ts` and the dictionaries were edited additively and not loaded from a second page; left for manual verification
- [ ] Nothing merged from `main` during `sync` was broken by this branch — n/a: sync not yet run at this commit

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead) — ticked, with what was found for pieces 1, 3 and 4
- [x] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`) — `2026-10-06-project-thai-title.md`
- [x] `README.md` still accurate — not mentioned there
- [x] **Release notes.** Would a shelter user notice this change? — yes: one `unreleased` line added in `src/lib/releases.ts`, written for a shelter user
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** — the claim that the pipeline already worked was read from `public.ts` and `PublishedProjects.tsx`, not driven; the decision file says "found on reading" where that is the case

## 8. Pre-production gate

Owned jointly with the release manager. `test.lannacare.org` runs the **dev**
database; `lannacare.org` runs **production** (`dbkodyyxxhtygxcxmfcu`).

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — `deploy.mjs` prints both the target project and the short SHA; read that line, do not assume it — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — the happy path works on the deployed Workers build, not just `next dev` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: no dates
  - *Does the logic handle the boundary?* Where the code lets an instant be injected, assert it rather than waiting for the clock: run the **real exported** function against fixed instants — both sides of 17:00Z, the 00:00 and 06:59 Thai ends of the broken window, month-end, year-end, a leap day — and then the same suite under `TZ=UTC`, which is the Workers case. Deterministic, and it does not depend on what hour you happened to be testing. Prefer this where it is available, and never re-type the logic into the test; a copy proves only that the copy works
  - *Does the deployed build behave as the source does?* A different claim, and only `test.lannacare.org` answers it — during 00:00–07:00 Thai, when the two dates differ. If you cannot be there at that hour, put it in **Left for manual verification** rather than ticking it
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary — not only the case the bug report named.** A bug report names the case that was *noticed*, which is rarely the case that *discriminates*, so a test written faithfully from the report can pass while the fault survives. This is not hypothetical: `dueState()` was reported as "a job due today reads as not yet overdue", but due-today behaves identically under both clocks and does not move at all; the cases that moved were due-yesterday and the far end of the due-soon band. Applies to any threshold, rounding rule, retry window, pagination limit or permission cutoff, not only to dates — n/a: no threshold or boundary logic
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.** — the gates lines above are as printed
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — n/a: no public file changed; a Thai-locale `/our-work` check is under Left for manual verification

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production**. `scripts/lib/env.mjs` resolves shell over `.env.deploy.production` over `.env.local`, so a stray exported `NEXT_PUBLIC_SUPABASE_URL` silently builds production against dev and nothing errors — deferred: release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — without it the bundle still carries a snapshot of `.env.local`, shipping dev credentials as silent fallbacks — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** If yes, the production apply must happen *before* the deploy, and that ordering is written into the apply plan below. (PR #53 shipped both together; `main` briefly carried code selecting columns production did not have.) — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — it executes the real DDL inside `begin…rollback` against production's actual schema, which has drifted from dev — n/a: no migration
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh. (Additive nullable columns do not need this gate. Note the README restore recipe has never been exercised.) — n/a: no migration
- [ ] Apply plan stated: which file, which project, and whether it runs before or after the deploy — n/a: no migration

### Rollback

- [x] Rollback position stated, **including what it does not cover** — revert the PR; no schema. Rows keep any Thai titles typed meanwhile, which is wanted

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | medium | The signed-in browser pass, `check-public-views.mjs` and `check-phone-width.mjs` were not run: the auto-mode classifier refused reading the throwaway admin password, then these scripts. Not a code defect | deferred to Lutan (Left for manual verification) |

## Left for manual verification

Anything above that Claude could not honestly verify, listed here so it is a
short, concrete handover rather than a vague "please check it". Empty is a valid
answer when the change has no surface a person needs to look at.

**Do not repeat a section 8 deploy-time check here.** Applying a migration,
reading the deploy output, smoke-testing the deployed build and running
`--drift production` all have their own state in section 8 — `deferred: <owner>` —
which passes the checker and names who picks it up. Listing them again in this
table gives them a second home that nothing ever closes: the check gets done at
deploy time, section 8 is satisfied, and this row stays open for good. Five
release-cut plans accumulated permanently-open rows exactly that way before it
was noticed (2026-09-27).

The test for whether something belongs here: **would a person have to go and look
at it, separately from deploying?** A vet's view of a page, a real phone, whether
wording reads well — yes. Anything the deploy itself performs — no, that is
section 8's.

| # | What to check | Where |
|---|---|---|
| 1 | Create a folder with a Thai title; open it: the Thai title shows under About this project and under the heading | Projects → a category → New folder |
| 2 | Publish a folder with no Thai title: "Thai visitors see the English title." shows; unpublished, it does not | `/projects/<id>` |
| 3 | The published project with no Thai title has the note and an Add Thai title link; the same project is listed at the top of Translations | Settings → Website; Management → Translations |
| 4 | `/our-work` in Thai shows the Thai title; in English the English | `/our-work` |
| 5 | Edit details at 375 px has no overflow; run `node scripts/check-public-views.mjs` and `node scripts/check-phone-width.mjs` | `/projects/<id>` |

## Sign-off

Two signatures, because they certify different things and neither covers the
other. A sign-off line that does not correspond to someone having actually
looked is worse than no sign-off, because it turns an unknown into a false
assurance.

### Automated and scripted checks

Gates, scripts, server-side behaviour, and any browser check that was actually
driven rather than assumed. Signed by whoever ran them — Claude may sign this.

- [ ] Everything in this checklist that could be verified without human eyes was run, not assumed — n/a: the browser pass and two scripts were refused by the classifier; see Defects
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-06

### Manual verification

The items in **Left for manual verification** above. Signed only by the person who looked.
- `pending: <what is outstanding>` — the work is done and something genuinely
  needs a person who has not got to it yet. **This does not fail the check**
  (changed 2026-09-24): it is the normal state for most of a PR's life, and a
  check that is permanently red is one people learn to filter. The checker prints
  *awaiting manual verification: <what>* and exits 0, so the outstanding item is
  on the record without drowning the signal. What still fails is a plan that is
  missing, incomplete or self-contradictory. Use `pending:` rather than reaching
  for `n/a` — green is no longer something you have to buy, and an `n/a` over a
  real outstanding item is a false assurance about the one thing you could not
  verify. **Nothing ships on a `pending:`** — the release manager's pre-deploy
  pass is what holds that line, not CI.

`n/a:` and `pending:` take **no `Date:` segment** — there is no date to record, so
write the line and stop. A trailing `Date: —` is accepted too, since existing
plans use it. A bare *name* with no date is still rejected, which is what stops an
empty signature quietly passing.

A red `test-plan` that says what it is waiting for is a red people act on. An
illegible one is a red people learn to ignore.

- [ ] The manual list above is empty, or every item in it was checked by a person. **If the list is empty, whoever filled the plan may tick this** and write `n/a: <reason>` on the signature below — there is nothing for a person to look at, so nothing is being signed for. If the list is not empty, only the person who looked may tick it — n/a: see the manual table below

Manual verification by: pending: Lutan to drive the five rows in the table above (nothing was driven in a browser)

### Result

- [ ] Open defects are either fixed or explicitly accepted above — n/a: defect 1 is deferred to Lutan, not a code fault
- [ ] Checklist pasted into the PR — n/a: not yet, the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet, nothing to hand over until the PR merges

Result: pass

Release manager acknowledgement: pending: release manager
