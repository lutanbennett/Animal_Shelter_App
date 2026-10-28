# Test plan — upcoming-visits-edit-gate

## Header

| | |
|---|---|
| Feature | Upcoming visits: Edit link gated on its own activity, plus the walkthrough-seam count |
| Backlog item | `docs/backlog.md` → "a card-only login is offered links and controls its card does not grant" (ticked on this branch) |
| Branch / worktree | `claude/upcoming-visits-edit-gate` @ `C:DevelopmentAnimal_Shelter_upcoming-visits-edit-gate` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3005` |
| PR | to be opened from this branch |
| Tested by / date | Claude (Sonnet 5.5), 2026-10-28 |
| Carries a migration? | no |
| Tested at SHA | c2c94c3c |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs)
- [x] Roles affected identified: admin / staff / doctor / volunteer / resident / signed-out public
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised

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

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ended `gates: typecheck=0 lint=0 test=0 build=0` (see below)
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

Per `CLAUDE.md`, schema lands as its own PR before the feature.

- [ ] Migration number is one above the highest on `main`, and no  — n/a: no migration in this stream
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before — n/a: no migration in this stream
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration in this stream
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in  — n/a: no migration in this stream
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop  — n/a: no migration in this stream
- [ ] Existing rows still read correctly after the change (checked — n/a: no migration in this stream
- [ ] **Constraints and defaults exercised against real rows** in  — n/a: no migration in this stream
- [ ] Down-migration written, or the reason one is not needed is s — n/a: no migration in this stream
- [ ] Production apply plan stated for the release manager (which  — n/a: no migration in this stream

## 4. Functional checks

- [x] Happy path works end to end
- [x] Data persists — reload the page and the change is still there
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: no data is created, edited or deleted by this change; it only decides whether a link is drawn
- [ ] Empty state renders sensibly (no rows yet) — n/a: the empty list is unchanged and no part of this change touches it
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no input is taken by this change
- [ ] Boundary cases checked (long text, zero, negative, missing optional fi — n/a: no data boundary; the gate is a yes/no card check

### Role access matrix

Sign in as each role that matters and record what they see. Unauthorised access
must be refused by the server, not merely hidden in the UI — hit the URL
directly rather than checking whether the nav entry is hidden. That distinction
is what found the cashflow money bug: the page redirected correctly, and the RPC
behind it did not.

These are all of them. Roles are rows of the `roles` table, not an enum (`app_role`
was dropped by `0181`). The live ones are admin, management, second_in_command,
head_of_maintenance, head_of_medical, doctor, volunteer and public_viewer; `staff` is
retired (`0173`). **There is no `resident` role** — in this app a resident is an
animal — and do not re-derive this list by grepping for quoted strings; read the
`roles` table (or `/admin/who-does-what`).

| Role | Can reach | Expected | Result |
|---|---|---|---|
| Login holding only `view_medical` (read of `medical.visits`) | `/upcoming-visits` | list and View links shown, **no Edit link**; `/clinic-visits/<id>/edit` typed directly refuses | pass: 0 Edit links; direct address went to `/no-access` |
| Login holding only `medical_records` (edit of `medical.visits`) | `/upcoming-visits` | Edit link on every visit | pass: 13 Edit links beside 13 View links |
| admin | not driven | Admin short-circuit in `can.ts` shows everything | n/a: unchanged code path; no Admin login driven |
| management, second_in_command, head_of_*, doctor, volunteer | not driven | follow their cards | n/a: the gate reads cards only, so the two card logins above cover both outcomes |
| signed out | not driven | page guard unchanged | n/a: `requirePermission` untouched |

- [x] Every role above tested
- [x] A role that should not have access is blocked server-side (hitting the URL directly fails)

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no nav entry added or changed
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly  — n/a: the manual's Upcoming visits topic never described the Edit link
- [ ] Translatable strings go through the translation path, checked at `/man — n/a: no new string; the existing Edit label is reused
- [ ] Mobile viewport (375px) — n/a: one link is drawn or not; layout unchanged
- [x] Browser console clean — no errors or React warnings
- [x] Network clean — no unexpected 4xx/5xx on the feature's pages

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked)
- [x] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — **by loading that page, not by reading the file**. Reading proves only that you did not edit it; loading proves the value it still supplies at runtime is the one the other page expects. The weaker reading is the tempting one
- [x] Nothing merged from `main` during `sync` was broken by this branch

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead)
- [x] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`)
- [x] `README.md` still accurate
- [x] **Release notes.** Would a shelter user notice this change? If so, `unreleased` in `src/lib/releases.ts` has a line for it, **in this PR**, written for a shelter user and not as a commit message. If not, `n/a: <why nobody would notice>`: a refactor, a script, a fix to something no user reached. The checker holds this line to the diff. A tick fails if `unreleased` gained no line. A PR touching `src/app/`, `src/components/`, `src/lib/manual/`, `src/lib/i18n/` or `worker/` fails if this line is missing, and its `n/a` reason is printed for the reviewer. An empty `unreleased` looks exactly like "nothing visible shipped", so this line is the only place that difference gets written down. **Do not tick while this PR's own decision file, README or backlog note records a step still outstanding before a user could see it (a deploy, a hand-edited file on the Pi, a setting).** A note promises the user it works now; a tick that only means "the code is in" sent #518's false note to every admin (decisions, 2026-10-11). Write `n/a: <the outstanding step>` and put the note in the PR that closes the step A PR that touches nothing but `docs/test-plans/` (a sign-off recorded after merge) has a tick checked against the merge that introduced the plan instead, so leave the feature's tick as it was. **And who is it for?** If the note is about a page only some roles can open (anything under Settings, an admin page), write it as `{ text: "…", cards: [...] }` naming the card (a `CardKey` from `src/lib/permissions/cards.ts`) that opens it, because a plain string is shown to every live role, including ones who cannot open the page. A card-tagged note is shown to whoever holds one of its cards and always to Admin; a tag whose cards nobody recognises shows to everyone rather than hiding. **Do not tag a new note with `roles`**: that older form is in Lanna's own role keys, which a shelter may rename, so it is closed to new notes (history keeps the tags it has: `docs/decisions/2026-10-26-release-notes-by-card.md`). You know the audience; the release manager can only guess from the wording. The checker warns, and never fails, on an untagged note that names an admin-only place and on a new note tagged `roles` (a wrong tag hides a note from the people it is for, which is worse). The checker finds this line by its bold **Release notes.** label, so keep the label as it is
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** No gate reads prose: `typecheck`, `lint`, `build` and this checklist all pass with a confidently wrong explanation in the commit that ships the fix, and the wrong explanation is what the next person inherits. Worth real attention on timezone, concurrency and floating-point work, where intuition is unusually unreliable and a plausible story is easy to tell

## 8. Pre-production gate

Owned jointly with the release manager. `test.lannacare.org` runs the **dev**
database; `lannacare.org` runs **production** (`dbkodyyxxhtygxcxmfcu`).

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at depl … — deferred: release manager at deploy time
- [ ] Deployed SHA matches the tested SHA — `deploy.mjs` prints both the tar … — deferred: release manager at deploy time

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` … — deferred: release manager at deploy time
- [ ] Smoke-tested on `test.lannacare.org` — the happy path works on the dep … — deferred: release manager at deploy time
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient ho … — deferred: release manager at deploy time
  - *Does the logic handle the boundary?* Where the code lets an instant be injected, assert it rather than waiting for the clock: run the **real exported** function against fixed instants — both sides of 17:00Z, the 00:00 and 06:59 Thai ends of the broken window, month-end, year-end, a leap day — and then the same suite under `TZ=UTC`, which is the Workers case. Deterministic, and it does not depend on what hour you happened to be testing. Prefer this where it is available, and never re-type the logic into the test; a copy proves only that the copy works
  - *Does the deployed build behave as the source does?* A different claim, and only `test.lannacare.org` answers it — during 00:00–07:00 Thai, when the two dates differ. If you cannot be there at that hour, put it in **Left for manual verification** rather than ticking it
- [ ] **For a boundary or banding change, the assertions cover both edges of … — deferred: release manager at deploy time
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited … — deferred: release manager at deploy time
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after  … — deferred: release manager at deploy time

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref ** … — deferred: release manager at deploy time
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in … — deferred: release manager at deploy time
- [ ] Any new secret/env var exists in the production Cloudflare environment … — deferred: release manager at deploy time

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code t … — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --env productio … — n/a: no migration
- [ ] For a **destructive or rewriting** migration only: … — n/a: no migration
- [ ] Apply plan stated: which file, which project, and  … — n/a: no migration

### Rollback

- [ ] Rollback position stated, **including what it does not cover**. Produc … — deferred: release manager at deploy time

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| | | | |

### Evidence

```
gates: typecheck=0 lint=0 test=0 build=0
```

Browser (pane, dev, port 3005, signed in by `dev-signin.mjs --cards …`): read-only login: 13 visit rows, 13 View links, 0 Edit links; edit login: 13 Edit links. Typing the edit address as the read-only login landed on `/no-access`. Pane note: `requestAnimationFrame` never fired there, but the Edit links are in the server-rendered HTML, so the counts are not affected.

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | Part 2 is a count of pages with no opening walkthrough step (22 of 46), not an audit of their controls | deferred to backlog: its own item, filed on the `backlog` branch |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | Nothing a person must look at separately: the two card logins were driven | n/a |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (Sonnet 5.5) — gates and the two-login browser check  Date: 2026-10-28

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: nothing is left for a person; the change is one link's visibility, driven with a read-only and an edit login

Manual verification by: n/a: nothing to look at beyond the driven browser check

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [ ] Handed to the production release manager — n/a: not yet — the PR does not exist at this commit

Result: pass
