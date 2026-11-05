# Feature test plan


---

## Header

| | |
|---|---|
| Feature | Full manual PDF prebuilt at deploy; /manual/pdf kept off the Worker |
| Backlog item | `docs/backlog.md` → Error 1102 on the full manual PDF (`#jxagg`, on the backlog branch) |
| Branch / worktree | `claude/<feature>` @ `C:\Development\Animal_Shelter_<feature>` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:<.port>` |
| PR | pending |
| Tested by / date | Claude / 2026-11-05 |
| Carries a migration? | no |
| Tested at SHA | `013ae9e6` |

## 1. Scope and risk

- [x] Change is described: /manual/pdf is Pi-only (never rendered by the Worker) and the full manual is served from PDFs built at deploy, one per language
- [x] Files/areas touched: `worker/origin.mjs` (+test), `src/lib/pi-only-paths.ts`, `src/lib/manual/prebuilt.ts`, `src/app/manual/pdf/route.ts`, `scripts/build-manual-pdf.mjs`, `scripts/manual-pdf-entry.tsx`, `scripts/pi/deploy-pi.sh`, `.gitignore`
- [x] Cards affected: none change; the route keeps its sign-in check. Admin still gets the whole manual; the signed-out public is refused as before
- [x] Out of scope written down: shrinking the screenshots (size, not speed; stale until the re-take) and prebuilding the `images=0` copy; see the decision file

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

- [x] `node scripts/worktree.mjs sync` run before the gates; nothing to merge
- [x] `node scripts/gates.mjs` ends with one line of the shape below, every gate 0:
```
=== gates: typecheck exited 0 after 184s
=== gates: lint exited 0 after 242s
=== gates: test exited 0 after 19s
=== gates: build exited 0 after 389s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

Per `CLAUDE.md`, schema lands as its own PR before the feature.

- [ ] Migration number is one above the highest on `main`, and no other in-flight bran — n/a: no migration in this PR
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration in this PR
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration in this PR
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration in this PR
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration in this PR
- [ ] Existing rows still read correctly after the change (checked against real dev da — n/a: no migration in this PR
- [ ] **Constraints and defaults exercised against real rows** in a `begin; … rollback — n/a: no migration in this PR
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration in this PR
- [ ] Production apply plan stated for the release manager (which file, which project, — n/a: no migration in this PR

## 4. Functional checks

- [x] Happy path works end to end: real `npm run build` + `next start` on :3005, signed in as Admin; `/manual/pdf?view=all` returned 200, 9,032,698 B in 2.0 s (was 33.0 s live)
- [ ] Data persists — n/a: nothing is saved; the file is read from disk
- [ ] Create / edit / delete all exercised — n/a: read-only route
- [x] Empty state: moved `.manual-pdf/` away, `/manual/pdf?view=all` answered 503 with the plain message, not a live render; restored
- [x] Invalid input is rejected with a readable message: the missing-file case above; the locale is stripped to letters before use in a file name
- [x] Boundary cases checked: `?view=all&images=0` still renders live (200, 395,659 B, 30.9 s, Pi-only now); Thai cookie served `th.pdf` (9,053,985 B, 0.9 s)

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
| admin | `/manual/pdf?view=all` | 200, the prebuilt file, 2.0 s | pass |
| signed out | `/manual/pdf?view=all` | refused | pass (307 to login) |

- [x] Every login above tested: admin and signed out
- [x] A login that should not have access is blocked server-side: signed-out request answered 307 (to login) on the built server

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no navigation change
- [ ] Manual updated — n/a: manual text unchanged; only how its PDF is produced
- [ ] Translatable strings — n/a: the 503 text is an operator message in English
- [ ] Mobile viewport — n/a: no screen changed
- [ ] Browser console clean — n/a: no page changed; server log read, no errors
- [ ] Network clean — n/a: only the route's own responses were requested, listed above

## 6. Regression

- [x] The pages nearest the change still work: the full-manual and text-only paths driven above; the personalised path is unchanged code
- [ ] Any shared file touched — n/a: NavLinks.tsx and manual/en.ts not touched
- [ ] Nothing merged from `main` during `sync` was broken by this branch — n/a: sync merged nothing

## 7. Documentation

- [ ] Backlog item ticked — n/a: the item (`#jxagg`) is on the backlog branch, not yet in `main`; ticked there after merge
- [x] Non-obvious design choices added: `docs/decisions/2026-11-05-manual-pdf-prebuilt.md`
- [ ] `README.md` still accurate — n/a: it does not describe the manual PDF
- [ ] **Release notes.** — n/a: the `unreleased` line is true only once the Pi is deployed (Lutan's step), so it is not ticked as live; the line is in this PR as the brief asked
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** The 2.0 s, 30.9 s and 9 MB figures are from the runs above; the 33 s before is the brief's measurement

## 8. Pre-production gate

Owned jointly with the release manager. `test.lannacare.org` runs the **dev**
database; `lannacare.org` runs **production** (`dbkodyyxxhtygxcxmfcu`).

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: Lutan at the Pi deploy and release
- [ ] Deployed SHA matches the tested SHA — deferred: Lutan at the Pi deploy and release

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: Lutan at the Pi deploy and release
- [ ] Smoke-tested on `test.lannacare.org` — deferred: Lutan at the Pi deploy and release
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** Workers run in — deferred: Lutan at the Pi deploy and release
  - *Does the logic handle the boundary?* Where the code lets an instant be injected, assert it rather than waiting for the clock: run the **real exported** function against fixed instants — both sides of 17:00Z, the 00:00 and 06:59 Thai ends of the broken window, month-end, year-end, a leap day — and then the same suite under `TZ=UTC`, which is the Workers case. Deterministic, and it does not depend on what hour you happened to be testing. Prefer this where it is available, and never re-type the logic into the test; a copy proves only that the copy works
  - *Does the deployed build behave as the source does?* A different claim, and only `test.lannacare.org` answers it — during 00:00–07:00 Thai, when the two dates differ. If you cannot be there at that hour, put it in **Left for manual verification** rather than ticking it
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both s — deferred: Lutan at the Pi deploy and release
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited.** A hand-maintaine — deferred: Lutan at the Pi deploy and release
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 1 — deferred: Lutan at the Pi deploy and release

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: Lutan at the Pi deploy and release
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: Lutan at the Pi deploy and release
- [ ] Any new secret/env var exists in the production Cloudflare environment — deferred: Lutan at the Pi deploy and release

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** If yes, the production a — deferred: Lutan at the Pi deploy and release
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: Lutan at the Pi deploy and release
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — deferred: Lutan at the Pi deploy and release
- [ ] Apply plan stated: which file, which project, and whether it runs before or after the depl — deferred: Lutan at the Pi deploy and release

### Rollback

- [ ] Rollback position stated, **including what it does not cover**. Production is served by th — deferred: Lutan at the Pi deploy and release

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | note | Build took 52 s (en) and 46 s (th) here with the machine busy; the first Pi build time is not measured | accepted |

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

Automated checks by: Claude  Date: 2026-11-05

### Manual verification


A red `test-plan` that says what it is waiting for is a red people act on. An
illegible one is a red people learn to ignore.

- [ ] The manual list above is empty — n/a: nothing for a person to look at before deploy

Manual verification by: n/a: nothing for a person to look at before the Pi deploy

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: handed over at the release cut

Result: pass

Release manager acknowledgement: pending — at the release cut
