# Feature test plan


## Header

| | |
|
## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs)
- [x] Cards affected identified (the cards whose behaviour changes; who holds them today is labelled context only), plus whether admin and the signed-out public are affected
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised

## 2. Automated gates

Run in the feature worktree, after `node scripts/worktree.mjs sync`, with
`node scripts/gates.mjs`. It exists because of the traps below: it runs all four
gates (typecheck, lint, test, build) even when one fails, prints each one's own exit code, and refuses to start
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
- [x] `node scripts/gates.mjs` four gates, all exit 0 — closing lines:

```
=== gates: typecheck — npm run typecheck
=== gates: typecheck exited 0 after 135s
=== gates: lint — npm run lint
=== gates: lint exited 0 after 369s
=== gates: test — npm test
=== gates: test exited 0 after 51s
=== gates: build — npm run build
=== gates: build exited 0 after 495s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR (runs the same four gates, among its other checks). **This one cannot be true in the commit that creates the PR**, so write it `n/a: not yet — the PR does not exist at this commit` and **leave it there.** Changed 2026-10-20: ticking it in a follow-up commit used to be the rule, and that commit **invalidated its own evidence** — a new HEAD means a new run, so every PR in this repository paid two full CI cycles to transcribe a result GitHub already records permanently against the commit. A tick here attests to nothing a reader can check better by looking at the PR. **What must still happen, and is a merge step rather than a checklist line: before merging, read the run for your current HEAD (`gh run view <id> --json status,conclusion,headSha`) and confirm its `headSha` matches.** Merging on an older run's strength merges a commit whose CI never finished. **Do not pre-tick this line either** — a green you have not seen is the exact failure this checklist exists to prevent — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

Per `CLAUDE.md`, schema lands as its own PR before the feature.

- [ ] Migration number is one above the highest on `main`, and no  — n/a: deploy-time or schema item, not applicable at PR time (no migration)
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before — n/a: deploy-time or schema item, not applicable at PR time (no migration)
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: deploy-time or schema item, not applicable at PR time (no migration)
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in  — n/a: deploy-time or schema item, not applicable at PR time (no migration)
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop  — n/a: deploy-time or schema item, not applicable at PR time (no migration)
- [ ] Existing rows still read correctly after the change (checked — n/a: deploy-time or schema item, not applicable at PR time (no migration)
- [ ] **Constraints and defaults exercised against real rows** in  — n/a: deploy-time or schema item, not applicable at PR time (no migration)
- [ ] Down-migration written, or the reason one is not needed is s — n/a: deploy-time or schema item, not applicable at PR time (no migration)
- [ ] Production apply plan stated for the release manager (which  — n/a: deploy-time or schema item, not applicable at PR time (no migration)

## 4. Functional checks

- [x] Happy path works end to end
- [ ] Data persists — reload the page and the change is still ther — n/a: one-argument UI change, no migration, no role or deploy surface
- [ ] Create / edit / delete all exercised (whichever the feature  — n/a: one-argument UI change, no migration, no role or deploy surface
- [ ] Empty state renders sensibly (no rows yet) — n/a: one-argument UI change, no migration, no role or deploy surface
- [ ] Invalid input is rejected with a readable message, not a cra — n/a: one-argument UI change, no migration, no role or deploy surface
- [ ] Boundary cases checked (long text, zero, negative, missing o — n/a: one-argument UI change, no migration, no role or deploy surface

### Role access matrix

Sign in as each login that matters and record what they see. Unauthorised access
must be refused by the server, not merely hidden in the UI — hit the URL
directly rather than checking whether the nav entry is hidden. That distinction
is what found the cashflow money bug: the page redirected correctly, and the RPC
behind it did not.

Analyse by CARD, not by role (`CLAUDE.md`, *All analysis is by CARD, never by role*): roles are
a transient grouping of cards and get rebuilt, so a row naming one stops being true. Test a
login holding exactly the card under test (`node scripts/dev-signin.mjs --cards <card> --port <yours>`,
card keys, not activity names), plus admin (outside the card system) and signed out. Where a page
needs two cards together, put both on one row. Do not name `staff` (retired, `0173`) or `resident`
(not a role: a resident is an animal). Read card keys from `/admin/who-does-what`.

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin | | | |
| exactly `<card key>` | | | |
| exactly `<card key>` | | | |
| signed out | | | |

- [ ] Every login above tested — n/a: one-argument UI change, no migration, no role or deploy surface
- [ ] A login that should not have access is blocked server-side ( — n/a: one-argument UI change, no migration, no role or deploy surface

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — appears for the — n/a: one-argument UI change, no migration, no role or deploy surface
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads  — n/a: one-argument UI change, no migration, no role or deploy surface
- [ ] Translatable strings go through the translation path, checke — n/a: one-argument UI change, no migration, no role or deploy surface
- [ ] Mobile viewport (375px) — no overflow, controls reachable — pending: needs Lutan's phone over mobile data (the re-time is his)
- [x] Browser console clean
- [x] Network clean — no unexpected 4xx/5xx on the feature's pages

## 6. Regression

- [ ] The pages nearest the change still work (list the ones check — n/a: one-argument UI change, no migration, no role or deploy surface
- [ ] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, sha — n/a: one-argument UI change, no migration, no role or deploy surface
- [ ] Nothing merged from `main` during `sync` was broken by this  — n/a: one-argument UI change, no migration, no role or deploy surface

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead)
- [x] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`)
- [x] `README.md` still accurate
- [x] **Release notes.** Added a line to `unreleased`.
- [x] Commit messages say why, not just what
- [x] Claims were measured (bytes and request counts, not timings)

## 8. Pre-production gate

Owned jointly with the release manager. `test.lannacare.org` runs the **dev**
database; `lannacare.org` runs **production** (`dbkodyyxxhtygxcxmfcu`).

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `mai — n/a: deploy-time or schema item, not applicable at PR time (no migration)
- [ ] Deployed SHA matches the tested SHA — `deploy.mjs` prints bo — n/a: deploy-time or schema item, not applicable at PR time (no migration)

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — n/a: deploy-time or schema item, not applicable at PR time (no migration)
- [ ] Smoke-tested on `test.lannacare.org` — the happy path works  — n/a: deploy-time or schema item, not applicable at PR time (no migration)
- [ ] **Timezone-sensitive behaviour proved, not observed at a con — n/a: deploy-time or schema item, not applicable at PR time (no migration)
  - *Does the logic handle the boundary?* Where the code lets an instant be injected, assert it rather than waiting for the clock: run the **real exported** function against fixed instants — both sides of 17:00Z, the 00:00 and 06:59 Thai ends of the broken window, month-end, year-end, a leap day — and then the same suite under `TZ=UTC`, which is the Workers case. Deterministic, and it does not depend on what hour you happened to be testing. Prefer this where it is available, and never re-type the logic into the test; a copy proves only that the copy works
  - *Does the deployed build behave as the source does?* A different claim, and only `test.lannacare.org` answers it — during 00:00–07:00 Thai, when the two dates differ. If you cannot be there at that hour, put it in **Left for manual verification** rather than ticking it
- [ ] **For a boundary or banding change, the assertions cover bot — n/a: deploy-time or schema item, not applicable at PR time (no migration)
- [ ] **Evidence pasted into this plan is the tool's actual output — n/a: deploy-time or schema item, not applicable at PR time (no migration)
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-chec — n/a: deploy-time or schema item, not applicable at PR time (no migration)

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and  — n/a: deploy-time or schema item, not applicable at PR time (no migration)
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundl — n/a: deploy-time or schema item, not applicable at PR time (no migration)
- [ ] Any new secret/env var exists in the production Cloudflare e — n/a: deploy-time or schema item, not applicable at PR time (no migration)

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads  — n/a: deploy-time or schema item, not applicable at PR time (no migration)
- [ ] `node scripts/apply-migrations.mjs --env production --dry-ru — n/a: deploy-time or schema item, not applicable at PR time (no migration)
- [ ] For a **destructive or rewriting** migration only: a product — n/a: deploy-time or schema item, not applicable at PR time (no migration)
- [ ] Apply plan stated: which file, which project, and whether it — n/a: deploy-time or schema item, not applicable at PR time (no migration)

### Rollback

- [ ] Rollback position stated, **including what it does not cover — n/a: deploy-time or schema item, not applicable at PR time (no migration)

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| | | | |

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
at it, separately from deploying?** A doctor's view of a page, a real phone, whether
wording reads well — yes. Anything the deploy itself performs — no, that is
section 8's.

| # | What to check | Where |
|---|---|---|
| | | |

## Sign-off

Two signatures, because they certify different things and neither covers the
other. A sign-off line that does not correspond to someone having actually
looked is worse than no sign-off, because it turns an unknown into a false
assurance.

### Automated and scripted checks

Gates, scripts, server-side behaviour, and any browser check that was actually
driven rather than assumed. Signed by whoever ran them — Claude may sign this.

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-06

### Manual verification

- [ ] The manual list above is not empty — pending: Lutan's phone re-time

Manual verification by: pending: Lutan's phone re-time on mobile data

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [ ] Handed to the production release manager — n/a: deploy-time item, not applicable at PR time

Result: pass
