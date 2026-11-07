# Test plan: uat-on-the-pi


---

## Header

| | |
|---|---|
| Feature | uat-on-the-pi |
| Backlog item | none existed; Lutan, 2026-11-07: "yes lets point UAT at the Pi" |
| Branch / worktree | `claude/uat-on-the-pi` @ `C:DevelopmentAnimal_Shelter_uat-on-the-pi` |
| Dev server | n/a: nothing here runs in `next dev` |
| PR | this branch's PR |
| Tested by / date | Claude, 2026-11-07 |
| Carries a migration? | yes / no |
| Tested at SHA | d063cc56 (code); README and the plan itself were edited after the gates started and change no code |

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

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly — merged nothing: already up to date
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 test=0 build=0`, run by me; its closing lines exactly as printed:

```
=== gates: typecheck exited 0 after 216s
=== gates: lint exited 0 after 419s
=== gates: test exited 0 after 35s
=== gates: build exited 0 after 319s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR (runs the same four gates, among its other checks). **This one cannot be true in the commit that creates the PR**, so write it `n/a: not yet — the PR does not exist at this commit` and **leave it there.** Changed 2026-10-20: ticking it in a follow-up commit used to be the rule, and that commit **invalidated its own evidence** — a new HEAD means a new run, so every PR in this repository paid two full CI cycles to transcribe a result GitHub already records permanently against the commit. A tick here attests to nothing a reader can check better by looking at the PR. **What must still happen, and is a merge step rather than a checklist line: before merging, read the run for your current HEAD (`gh run view <id> --json status,conclusion,headSha`) and confirm its `headSha` matches.** Merging on an older run's strength merges a commit whose CI never finished. **Do not pre-tick this line either** — a green you have not seen is the exact failure this checklist exists to prevent — n/a: not yet — the PR does not exist at this commit

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

- [ ] Happy path works end to end — pending: Lutan runs setup-uat.sh on the Pi and the drill in docs/pi-hosting.md; nothing was run on the Pi
- [ ] Data persists — reload the page and the change is still there — n/a: no UI surface; Pi shell scripts, tunnel config and one Worker variable
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: no UI surface; Pi shell scripts, tunnel config and one Worker variable
- [ ] Empty state renders sensibly (no rows yet) — n/a: no UI surface; Pi shell scripts, tunnel config and one Worker variable
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no UI surface; Pi shell scripts, tunnel config and one Worker variable
- [ ] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — n/a: no UI surface; Pi shell scripts, tunnel config and one Worker variable

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

- [ ] Every login above tested — n/a: no page, card or permission changed
- [ ] A login that should not have access is blocked server-side (hitting the URL directly fails) — n/a: no page, card or permission changed

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — appears for the right cards, no dead links — n/a: no UI surface; Pi shell scripts, tunnel config and one Worker variable
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: no UI surface; Pi shell scripts, tunnel config and one Worker variable
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: no UI surface; Pi shell scripts, tunnel config and one Worker variable
- [ ] Mobile viewport (375px) — no overflow, controls reachable — n/a: no UI surface; Pi shell scripts, tunnel config and one Worker variable
- [ ] Browser console clean — no errors or React warnings — n/a: no UI surface; Pi shell scripts, tunnel config and one Worker variable
- [ ] Network clean — no unexpected 4xx/5xx on the feature's pages — n/a: no UI surface; Pi shell scripts, tunnel config and one Worker variable

## 6. Regression

- [ ] The pages nearest the change still work (list the ones checked) — n/a: no page changed; the tunnel and host pairing was checked by node scripts/check-site-hosts.mjs (all right) and node scripts/pi/check-self-update.mjs (passed)
- [ ] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — **by loading that page, not by reading the file**. Reading proves only that you did not edit it; loading proves the value it still supplies at runtime is the one the other page expects. The weaker reading is the tempting one — n/a: NavLinks.tsx, manual/en.ts and shared libs untouched
- [ ] Nothing merged from `main` during `sync` was broken by this branch — n/a: sync merged nothing

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead) — n/a: no backlog item existed for this; the Pi-side steps go on the backlog branch as a new item
- [x] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`) — docs/decisions/2026-11-07-uat-on-the-pi.md
- [x] `README.md` still accurate — the UAT paragraph that said the Pi had no lanna-care-uat service was corrected
- [ ] **Release notes.** Would a shelter user notice this change? If so, `unreleased` in `src/lib/releases.ts` has a line for it, **in this PR**, written for a shelter user and not as a commit message. If not, `n/a: <why nobody would notice>`: a refactor, a script, a fix to something no user reached. The checker holds this line to the diff. A tick fails if `unreleased` gained no line. A PR touching `src/app/`, `src/components/`, `src/lib/manual/`, `src/lib/i18n/` or `worker/` fails if this line is missing, and its `n/a` reason is printed for the reviewer. An empty `unreleased` looks exactly like "nothing visible shipped", so this line is the only place that difference gets written down. **Do not tick while this PR's own decision file, README or backlog note records a step still outstanding before a user could see it (a deploy, a hand-edited file on the Pi, a setting).** A note promises the user it works now; a tick that only means "the code is in" sent #518's false note to every admin (decisions, 2026-10-11). Write `n/a: <the outstanding step>` and put the note in the PR that closes the step A PR that touches nothing but `docs/test-plans/` (a sign-off recorded after merge) has a tick checked against the merge that introduced the plan instead, so leave the feature's tick as it was. **And who is it for?** If the note is about a page only some roles can open (anything under Settings, an admin page), write it as `{ text: "…", cards: [...] }` naming the card (a `CardKey` from `src/lib/permissions/cards.ts`) that opens it, because a plain string is shown to every live role, including ones who cannot open the page. A card-tagged note is shown to whoever holds one of its cards and always to Admin; a tag whose cards nobody recognises shows to everyone rather than hiding. **Do not tag a new note with `roles`**: that older form is in Lanna's own role keys, which a shelter may rename, so it is closed to new notes (history keeps the tags it has: `docs/decisions/2026-10-26-release-notes-by-card.md`). You know the audience; the release manager can only guess from the wording. The checker warns, and never fails, on an untagged note that names an admin-only place and on a new note tagged `roles` (a wrong tag hides a note from the people it is for, which is worse). The checker finds this line by its bold **Release notes.** label, so keep the label as it is — n/a: the Pi-side setup is still outstanding (Lutan), so no user-visible behaviour changes in this PR
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** No gate reads prose: `typecheck`, `lint`, `build` and this checklist all pass with a confidently wrong explanation in the commit that ships the fix, and the wrong explanation is what the next person inherits. Worth real attention on timezone, concurrency and floating-point work, where intuition is unusually unreliable and a plausible story is easy to tell — the Cloudflare figures were read from the dashboard and the served-by header from curl; memory headroom on the Pi is stated as unmeasured

## 8. Pre-production gate

Owned jointly with the release manager. **Since the 2026-11-05 cutover:**
`lannacareforanimals.org` is **production** (`dbkodyyxxhtygxcxmfcu`);
`test.lannacare.org` is **test** on the **dev** project (`qxkmhwybjggxvsfxsxbd`);
`lannacare.org` is **UAT**, which is moving to its own project
(`fsjagxmxjosauwmxwype`) and runs against dev until that is finished
(`docs/decisions/2026-11-06-uat-own-database.md`). **`lannacare.org` is NOT
production** — it was until 2026-11-05, and this paragraph said so for two
releases afterwards, so any plan written from this template before 2026-11-06
names the wrong hosts.

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: Lutan, at the UAT deploy
- [ ] Deployed SHA matches the tested SHA — `deploy.mjs` prints both the target project and the short SHA; read that line, do not assume it — deferred: Lutan, at the UAT deploy

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — n/a: only the uat environment changed; the test Worker is untouched
- [ ] Smoke-tested on `test.lannacare.org` — the happy path works on the deployed Workers build, not just `next dev` — n/a: only the uat environment changed; the test Worker is untouched
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** Workers run in UTC wherever they are, so anything deriving "today" is wrong for part of every day in Thailand. That is two separate claims and they need different checks: — n/a: no date, band or threshold logic
  - *Does the logic handle the boundary?* Where the code lets an instant be injected, assert it rather than waiting for the clock: run the **real exported** function against fixed instants — both sides of 17:00Z, the 00:00 and 06:59 Thai ends of the broken window, month-end, year-end, a leap day — and then the same suite under `TZ=UTC`, which is the Workers case. Deterministic, and it does not depend on what hour you happened to be testing. Prefer this where it is available, and never re-type the logic into the test; a copy proves only that the copy works
  - *Does the deployed build behave as the source does?* A different claim, and only `test.lannacare.org` answers it — during 00:00–07:00 Thai, when the two dates differ. If you cannot be there at that hour, put it in **Left for manual verification** rather than ticking it
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary — not only the case the bug report named.** A bug report names the case that was *noticed*, which is rarely the case that *discriminates*, so a test written faithfully from the report can pass while the fault survives. This is not hypothetical: `dueState()` was reported as "a job due today reads as not yet overdue", but due-today behaves identically under both clocks and does not move at all; the cases that moved were due-yesterday and the far end of the due-soon band. Applies to any threshold, rounding rule, retry window, pagination limit or permission cutoff, not only to dates — n/a: no date, band or threshold logic
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.** A hand-maintained table of results is prose about a measurement rather than the measurement, and it drifts from the run without anyone noticing — which is precisely what the evidence was there to prevent. Regenerate it; do not tidy it
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — anonymous GETs are edge-cached per data centre, so a stale page can look like a defect that isn't one, or hide one that is — n/a: UAT is locked behind sign-in and no public page changed

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production**. `scripts/lib/env.mjs` resolves shell over `.env.deploy.production` over `.env.local`, so a stray exported `NEXT_PUBLIC_SUPABASE_URL` silently builds production against dev and nothing errors — deferred: Lutan, at the UAT deploy
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — without it the bundle still carries a snapshot of `.env.local`, shipping dev credentials as silent fallbacks — deferred: Lutan, at the UAT deploy
- [ ] Any new secret/env var exists in the production Cloudflare environment — deferred: Lutan, at the UAT deploy

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** If yes, the production apply must happen *before* the deploy, and that ordering is written into the apply plan below. (PR #53 shipped both together; `main` briefly carried code selecting columns production did not have.) — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — it executes the real DDL inside `begin…rollback` against production's actual schema, which has drifted from dev — n/a: no migration
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh. (Additive nullable columns do not need this gate. Note the README restore recipe has never been exercised.) — n/a: no migration
- [ ] Apply plan stated: which file, which project, and whether it runs before or after the deploy — n/a: no migration

### Rollback

- [x] Rollback position stated, **including what it does not cover**. Production is served by the Pi, so the rollback is `./scripts/pi/deploy-pi.sh --ref <sha>` there (a rebuild); `npx wrangler rollback --env production` reverts only the Worker fallback. Neither reverts migrations. Purely additive schema is safe to leave; anything else needs its own down-migration before "rollback available" is a true statement — `node scripts/deploy.mjs --env uat --no-pi` empties ORIGIN_HOST (the documented lever) and returns UAT to rendering in its Worker; revert of the PR does the same. Covers config only, no schema changed

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | Low | The Pi-side setup has not been run; nothing in this PR is proved on a Pi | accepted: it is Lutan's, listed under manual verification |

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
| 1 | setup-uat.sh runs on the Pi and `free -m` / production's service stay healthy with three servers | the Pi |
| 2 | `curl -sI https://lannacare.org/login` says x-lanna-served-by: pi after the UAT deploy, and the stop/start drill flips it to worker and back | the Pi + dev machine |
| 3 | After a day of use, UAT's Worker Metrics show no Exceeded CPU Time Limits | Cloudflare dashboard |

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

Automated checks by: Claude  Date: 2026-11-07

### Manual verification


A red `test-plan` that says what it is waiting for is a red people act on. An
illegible one is a red people learn to ignore.

- [ ] The manual list above is empty, or every item in it was checked by a person — pending: three items are listed and need Lutan

Manual verification by: pending: Lutan's Pi setup, drill and a day's Cloudflare metrics (the three rows above)

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — pending: after the PR is opened
- [ ] Handed to the production release manager — pending: not a release cut; it rides the next release

Result: pass with accepted defects

Release manager acknowledgement: pending: not yet handed over
