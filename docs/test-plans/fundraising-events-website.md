# Feature test plan — fundraising events on the public website

The public half of `#2zi2j`: the events page and its registration, reading the
`public_fundraising_events` and `public_fundraising_event_photos` views that `0314`
built.

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
with no completed `docs/test-plans/fundraising-events-website.md` fails. Small changes are not
exempt — they are simply fast, because most lines are honestly `n/a`. Writing the
`n/a` reason *is* the check; that is what says someone looked at everything rather
than at the happy path.

Run `node scripts/check-test-plan.mjs` locally before pushing to see what CI will say.

The `test-plan` CI job reports **red without blocking the merge**, and **that is
permanent** — decided by Lutan on 2026-10-20: *"we will NOT make this mandatory
it stays as advisory"* (`docs/decisions/2026-10-20-test-plan-stays-advisory.md`).
It is a deliberate soft gate, not an oversight and not a trial. **Treat a red
`test-plan` as a stop anyway:** the script goes red only when a plan is genuinely
wrong, so a red one is always someone's mistake to fix.
It will **not** become a required check. Earlier wording here said it would
"once we know the checklist is working", which read as a decision still pending
and got him asked for an answer he had already given.
The completed checklist is also pasted into the PR and read by the production
release manager before `npm run deploy:prod`.

---

## Header

| | |
|---|---|
| Feature | Fundraising events on the public website: `/events` and `/events/[id]` |
| Backlog item | `docs/backlog.md` → #2zi2j (ticked: both halves now built) |
| Branch / worktree | `claude/fundraising-events-website` @ `C:\Development\Animal_Shelter_fundraising-events-website` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3009` |
| PR | pending: the number is known once the PR is open |
| Tested by / date | Claude, 2026-11-04 |
| Carries a migration? | no |
| Tested at SHA | efca2dc6 |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — One sentence: the public Events pages `/events` and `/events/[id]`, reading only the two 0314 views; matches the second half of #2zi2j.
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs) — `src/app/events/**`, `src/lib/events/public.ts`, `src/lib/public-paths.ts`, `src/lib/public-pages.ts`, `src/app/sitemap.ts`, `src/app/admin/website/PageCards.tsx`, both dictionaries, manual, `releases.ts`, backlog, decision file. No migration, no `worker/`.
- [x] Cards affected identified (the cards whose behaviour changes; who holds them today is labelled context only), plus whether admin and the signed-out public … — None changed. The page is public. `events.run` (card `run_fundraising_events`) is who adds events, unchanged.
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised — Staff screens (#1282), `/photos/approve` (website-approval-portal), any SQL, a `page:events` hide key (needs a migration, filed in the decision file).

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

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly — `origin/main` merged; one backlog.md conflict (a new #yacd2 item) resolved by keeping both items.
- [x] `node scripts/gates.mjs` ends with one line of the shape `gates: typecheck=<N> lint=<N> test=<N> build=<N>` — **four gates, each `<N>` that gate's own exit … — gates: typecheck=0 lint=0 test=0 build=0
- [ ] CI green on the PR (runs the same four gates, among its other checks). **This one cannot be true in the commit that creates the PR**, so write it `n/a: not … — deferred: the merging stream, by reading the run for the head commit before `gh pr merge`

## 3. Schema and data — *skip if no migration*

Per `CLAUDE.md`, schema lands as its own PR before the feature.

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration; 0314 came with #1282
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration in this PR; 0314 is already applied on dev
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: no migration
- [ ] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — the `do $$ … $$` block CLAUDE.md describes under "Database … — n/a: no migration
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager (which file, which project, when) — n/a: no migration in this PR; 0314 is on dev and not on production, and `scripts/deploy.mjs` refuses a production deploy until it is applied, so the release carries it before this page is served

## 4. Functional checks

- [x] Happy path works end to end — Signed out on dev (port 3009): `/events` lists the published event and the test event; the detail page shows its title, date and one photo.
- [ ] Data persists — reload the page and the change is still there — n/a: the page reads live from the views and stores nothing
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: no write surface; events are made on the staff screens (#1282)
- [x] Empty state renders sensibly (no rows yet) — The page has a no-upcoming-events message with a Donate link (copy in `publicEvents.noneUpcoming`); the past section is omitted when empty.
- [x] Invalid input is rejected with a readable message, not a crash — A malformed or unknown event id returns the Not found page (`loadPublicEvent` checks the id shape before querying).
- [x] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — Draft and cancelled events and an unapproved photo are absent from anon reads and from the rendered page (see the proof in the PR body); a multi-day event shows a date range.

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
| signed out | `/events`, `/events/[id]` | readable on an unlocked site; draft and cancelled events and unapproved photos absent | driven: pages rendered, anon REST filtering proved |
| admin | same | the same public page (no staff chrome) | n/a — the pages carry no card logic and read two anon views |

- [x] Every login above tested — Signed out and admin-free: the page has no card logic, so the matrix has one meaningful row.
- [ ] A login that should not have access is blocked server-side (hitting the URL directly fails) — n/a: the pages are public; what is withheld (drafts, cancelled, unapproved photos, the base tables) is refused by the views and grants, proved with anon REST

## 5. Cross-cutting

- [x] Nav entry correct (`src/app/NavLinks.tsx`) — appears for the right cards, no dead links — Events is in the public header's Get involved group and the footer via `PUBLIC_PAGES`; not in `NavLinks.tsx` (staff app).
- [x] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — Topic `running-a-fundraising-event` added to `src/lib/manual/en.ts`.
- [x] Translatable strings go through the translation path, checked at `/management/translations` — Page chrome is in both dictionaries (`publicEvents`); event prose is read with `localizedField` from the view's `translations`. Thai is unreviewed.
- [x] Mobile viewport (375px) — no overflow, controls reachable — At 375px the detail page has no horizontal overflow (scrollWidth 375). The pane does not paint lazy images while hidden, so the photo itself was confirmed by fetching its proxy URL: 200 image/png signed out.
- [x] Browser console clean — no errors or React warnings — No errors except the dev server HMR websocket noise, which is the preview pane and not the app.
- [x] Network clean — no unexpected 4xx/5xx on the feature's pages — The event photo and logo come through /api/photos and /lca-logo with 200; no 4xx/5xx.

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked) — Home, `/campaigns`, `/our-work` still render signed out (header and footer carry the new entry).
- [x] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — **by loading that page, not by reading the … — `public-pages.ts`, `public-paths.ts` and `sitemap.ts` are shared: the sitemap still lists the other pages; `PageCards.tsx` draws no Hide button for Events.
- [x] Nothing merged from `main` during `sync` was broken by this branch — The merge touched only `docs/backlog.md`; gates run on the merged tip.

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead) — #2zi2j ticked and its title rewritten so it no longer says a public page is outstanding.
- [x] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`) — `docs/decisions/2026-11-04-fundraising-events-website.md`.
- [ ] `README.md` still accurate — n/a: README does not list public pages
- [x] **Release notes.** Would a shelter user notice this change? If so, `unreleased` in `src/lib/releases.ts` has a line for it, **in this PR**, written for a … — `unreleased` gained a line. 0314 is not on production, but `deploy.mjs` refuses a production deploy until every migration is applied, so the migration is not an outstanding step for a user reading the note.
- [x] Commit messages say why, not just what — Yes.
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** No gate reads prose: `typecheck`, `lint`, `build` and this checklist all … — The boundary and filtering claims were measured against the dev database, not reasoned (commands in the PR body).

## 8. Pre-production gate

Owned jointly with the release manager. `test.lannacare.org` runs the **dev**
database; `lannacare.org` runs **production** (`dbkodyyxxhtygxcxmfcu`).

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: the release manager, at deploy time
- [ ] Deployed SHA matches the tested SHA — `deploy.mjs` prints both the target project and the short SHA; read that line, do not assume it — deferred: the release manager, at deploy time

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: the release manager
- [ ] Smoke-tested on `test.lannacare.org` — the happy path works on the deployed Workers build, not just `next dev` — deferred: the release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** Workers run in UTC wherever they are, so anything deriving "today" is wrong for … — n/a: the only date logic is Coming up versus Past by `todayIso()`, the shelter-zone helper the campaigns page already uses
  - *Does the logic handle the boundary?* Where the code lets an instant be injected, assert it rather than waiting for the clock: run the **real exported** function against fixed instants — both sides of 17:00Z, the 00:00 and 06:59 Thai ends of the broken window, month-end, year-end, a leap day — and then the same suite under `TZ=UTC`, which is the Workers case. Deterministic, and it does not depend on what hour you happened to be testing. Prefer this where it is available, and never re-type the logic into the test; a copy proves only that the copy works
  - *Does the deployed build behave as the source does?* A different claim, and only `test.lannacare.org` answers it — during 00:00–07:00 Thai, when the two dates differ. If you cannot be there at that hour, put it in **Left for manual verification** rather than ticking it
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary — not only the case the bug report named.** A … — n/a: no banding; the upcoming/past split is a single comparison
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited.** A hand-maintained table of results is prose about a measurement rather than the … — n/a: no tool output is pasted into this plan
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — anonymous GETs are edge-cached per data centre, so … — deferred: the release manager, after the deploy and a cache wait

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production**. `scripts/lib/env.mjs` resolves shell over … — deferred: the release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — without it the bundle still carries a snapshot of `.env.local`, … — deferred: the release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: no new secret or env var

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** If yes, the production apply must happen *before* the deploy, and that ordering is written … — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — it executes the real DDL inside `begin…rollback` against production's actual … — deferred: the release manager, for 0314, which this page needs
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh. (Additive nullable columns do not need this gate. Note the … — n/a: no migration
- [ ] Apply plan stated: which file, which project, and whether it runs before or after the deploy — deferred: the release manager; 0314 must be applied to production before or with the deploy

### Rollback

- [x] Rollback position stated, **including what it does not cover**. Production is served by the Pi, so the rollback is `./scripts/pi/deploy-pi.sh --ref <sha>` … — Revert this PR; nothing in the database depends on it. The views and tables from 0314 are untouched.

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
| 1 | Look at `/events` on a real phone, in English and Thai, once 0314 is on production and an event is published | `lannacare.org/events` after release |

## Sign-off

Two signatures, because they certify different things and neither covers the
other. A sign-off line that does not correspond to someone having actually
looked is worse than no sign-off, because it turns an unknown into a false
assurance.

### Automated and scripted checks

Gates, scripts, server-side behaviour, and any browser check that was actually
driven rather than assumed. Signed by whoever ran them — Claude may sign this.

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed — Run, not assumed: anon REST boundary, filtering with real rows, rendered pages, sitemap.
- [x] Nothing is ticked that was not actually executed — Yes.

Automated checks by: Claude  Date: 2026-11-04

### Manual verification

The items in **Left for manual verification** above. Signed by the person who
looked. Claude never signs this line on someone else's behalf, unless that person
has looked and explicitly asks in chat; the line then says so explicitly, naming
them and recording that the line was written at their request.
Three valid states:

- A person's name, then two or more spaces, then `Date:` and the date — a person
  looked. The date is required here.
- `n/a: <reason>` — there was nothing to look at.
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

- [x] The manual list above is empty, or every item in it was checked by a person. **If the list is empty, whoever filled the plan may tick this** and write `n/a: … — The list below has one item and it is open; see Pending.

Manual verification by: pending: a person looking at /events on a phone after release

### Result

- [x] Open defects are either fixed or explicitly accepted above — No defects found.
- [x] Checklist pasted into the PR — Pasted.
- [ ] Handed to the production release manager — n/a: the handover happens at the release cut, after this PR merges

Result: pass

Release manager acknowledgement: pending: the next release cut
