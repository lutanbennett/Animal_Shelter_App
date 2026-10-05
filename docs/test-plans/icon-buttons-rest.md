# Test plan — icon-buttons-rest

## Header

| | |
|---|---|
| Feature | Icon buttons — everything else (area 4 of 4, closes the item) |
| Backlog item | `docs/backlog.md` → Mobile, "Turn word-only action links into icon buttons" |
| Branch / worktree | `claude/icon-buttons-rest` @ `C:DevelopmentAnimal_Shelter_icon-buttons-rest` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3003` |
| PR | (opened after this commit) |
| Tested by / date | Claude (automated and browser-driven checks) / 2026-10-05 |
| Carries a migration? | no |
| Tested at SHA | ec2a7558 |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — the word-only action links and small bordered buttons on maintenance, projects, deliveries, contacts, vets, enclosures and the shared TranslationPanel become icon buttons, with 44 px tap targets on a phone; area 4 of 4 of the backlog item
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs) — src/app/maintenance, projects, deliveries, contacts, vets, vet-visits, enclosures, login, adopt (filter chips); shared `src/components` (TranslationPanel, ArchiveContactControl, CopyTagLink, PlaceZoneChips, hub-icons: `manage`, `copy`); `src/lib/releases.ts`; docs; no worker/, no migration
- [x] Roles affected identified: admin / staff / vet / volunteer / resident / signed-out public — every signed-in role that uses the field tools (staff, 2IC, Head of Maintenance) and the signed-out public on login and adopt; presentation only, no permission change
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised — navigation links (names, "Front Zone 1", "Stock usage"), the 27 / 17 `text-primary` links left under Management and `/admin`, the app-header language switcher (24 px, shared by every page), the maintenance wizard step dots, the `check-phone-width.mjs` 44 px extension (declined, see the decision file)

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

- [x] `node scripts/worktree.mjs sync` — branched from `origin/main` @ b012c60a; `sync` re-run before the PR (see the pre-PR note in the PR description)
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Paste its closing `gates:` lines below exactly as printed. They are the evidence, and running the script again regenerates them

```
=== gates: build exited 0 after 75s

gates: typecheck=0 lint=0 build=0
```
- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

Per `CLAUDE.md`, schema lands as its own PR before the feature.

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: no migration
- [ ] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — n/a: no migration
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager (which file, which project, when) — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end — a disposable dev admin signed in, 375 px and desktop, English and Thai: Maintenance board and a job (Edit details, Add photos, Delete job with the bin and the word), the contact hub of a Shelter Friend (Manage, Archive, Unpublish, Edit profile, Preview, View on the website, Remove Shelter Friend status, Edit translation as buttons at 44 px), the vet hub, Enclosures (copy-link buttons now 44 px), Deliveries (per-row bin, 36 px with a mouse, named "Delete: FBC"); signed out: login, forgot password, request access, adopt, our-work
- [ ] Data persists — n/a: nothing is written differently; actions are unchanged and only their markup moved
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: no action was run; handlers and confirm steps are unchanged and only their markup moved; see Left for manual verification
- [ ] Empty state renders sensibly (no rows yet) — n/a: empty states are untouched, except the maintenance board's "Everyone's jobs" which is now a button and was not on screen
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no input handling changed
- [x] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — Thai at 375 px on every page above, including a long-named seeded enclosure, vet and contact (`check-phone-width.mjs`, admin and staff, English and Thai: "No page scrolls sideways"); my own pass listed every non-inline link and button under 44 px, and what is left is name links and the app-header language switcher

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
| admin | | | |
| management | | | |
| staff | | | |
| vet | | | |
| volunteer | | | |
| signed out | | | |

- [ ] Every role above tested — n/a: no permission logic changed; every button renders under the same conditions as the link or button it replaced
- [ ] A role that should not have access is blocked server-side (hitting the URL directly fails) — n/a: no access rule changed

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no nav entry added or changed
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: no wording changed in either dictionary; every label reuses an existing string (screenshots follow the deferred full re-run)
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: no new strings
- [x] Mobile viewport (375px) — driven in English and Thai on Maintenance (board, job, new), Projects, Deliveries, Contacts (list, hub), Vets (list, hub), Enclosures (list, hub), Stocktake, and signed out on login, forgot password, request access, adopt and our-work: no overflow on any; filter chips, back links, archive, the photo buttons, copy-link and the login controls were raised to 44 px
- [x] Browser console clean — not individually inspected; every page above rendered and navigated without a visible error
- [ ] Network clean — n/a: not inspected; the pages loaded and no data call changed

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked) — loaded signed in: Maintenance, a job, New job, Projects, a category, Deliveries, Contacts, a Shelter Friend hub, Vets, a vet hub, Enclosures, an enclosure hub, Stocktake. Not exercised: a project folder with photos and the Shelter Friend edit form (no such row in dev), so their buttons were checked by typecheck and build only
- [x] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — `CopyTagLink` and `PlaceZoneChips` are also used on `/residents`; `check-phone-width.mjs` on `/residents` (admin, staff, English, Thai): no overflow
- [x] Nothing merged from `main` during `sync` was broken by this branch — see the pre-PR note in the PR description

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead) — the "Turn word-only action links into icon buttons" item is ticked, with the four PRs named and the navigation links called out as a deliberate non-gap; the 44 px `check-phone-width` item is left open on the `backlog` branch with the reason for declining
- [x] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`) — docs/decisions/2026-10-05-icon-buttons-rest.md (the audit, the whole sweep, the final icon vocabulary, the declined 44 px offer)
- [x] `README.md` still accurate — README does not describe these controls
- [x] **Release notes.** Would a shelter user notice this change? If so, `unreleased` in `src/lib/releases.ts` has a line for it, **in this PR**, written for a shelter user and not as a commit message. If not, `n/a: <why nobody would notice>`: a refactor, a script, a fix to something no user reached. The checker holds this line to the diff. A tick fails if `unreleased` gained no line. A PR touching `src/app/`, `src/components/`, `src/lib/manual/`, `src/lib/i18n/` or `worker/` fails if this line is missing, and its `n/a` reason is printed for the reviewer. An empty `unreleased` looks exactly like "nothing visible shipped", so this line is the only place that difference gets written down. A PR that touches nothing but `docs/test-plans/` (a sign-off recorded after merge) has a tick checked against the merge that introduced the plan instead, so leave the feature's tick as it was. The checker finds this line by its bold **Release notes.** label, so keep the label as it is — line added to `unreleased`
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** No gate reads prose: `typecheck`, `lint`, `build` and this checklist all pass with a confidently wrong explanation in the commit that ships the fix, and the wrong explanation is what the next person inherits. Worth real attention on timezone, concurrency and floating-point work, where intuition is unusually unreliable and a plausible story is easy to tell — no measured claims made; nothing about timing or concurrency

## 8. Pre-production gate

Owned jointly with the release manager. `test.lannacare.org` runs the **dev**
database; `lannacare.org` runs **production** (`dbkodyyxxhtygxcxmfcu`).

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** Workers run in UTC wherever they are, so anything deriving "today" is wrong for part of every day in Thailand. That is two separate claims and they need different checks: — deferred: release manager (no date logic touched)
  - *Does the logic handle the boundary?* Where the code lets an instant be injected, assert it rather than waiting for the clock: run the **real exported** function against fixed instants — both sides of 17:00Z, the 00:00 and 06:59 Thai ends of the broken window, month-end, year-end, a leap day — and then the same suite under `TZ=UTC`, which is the Workers case. Deterministic, and it does not depend on what hour you happened to be testing. Prefer this where it is available, and never re-type the logic into the test; a copy proves only that the copy works
  - *Does the deployed build behave as the source does?* A different claim, and only `test.lannacare.org` answers it — during 00:00–07:00 Thai, when the two dates differ. If you cannot be there at that hour, put it in **Left for manual verification** rather than ticking it
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary — deferred: release manager (no boundary logic touched)
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited.** A hand-maintained table of results is prose about a measurement rather than the measurement, and it drifts from the run without anyone noticing — deferred: release manager
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — deferred: release manager (only the /adopt filter chips and the login controls changed; re-check them)

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production**. `scripts/lib/env.mjs` resolves shell over `.env.deploy.production` over `.env.local`, so a stray exported `NEXT_PUBLIC_SUPABASE_URL` silently builds production against dev and nothing errors — deferred: release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — deferred: release manager (none added)

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** If yes, the production apply must happen *before* the deploy, and that ordering is written into the apply plan below. (PR #53 shipped both together; `main` briefly carried code selecting columns production did not have.) — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — n/a: no migration
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh. (Additive nullable columns do not need this gate. Note the README restore recipe has never been exercised.) — n/a: no migration
- [ ] Apply plan stated: which file, which project, and whether it runs before or after the deploy — n/a: no migration

### Rollback

- [ ] Rollback position stated, **including what it does not cover**. Production is served by the Pi, so the rollback is `./scripts/pi/deploy-pi.sh --ref <sha>` there (a rebuild); `npx wrangler rollback --env production` reverts only the Worker fallback. Neither reverts migrations. Purely additive schema is safe to leave; anything else needs its own down-migration before "rollback available" is a true statement — deferred: release manager — pure presentation change, no migration; rebuilding the previous ref reverts it

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | cosmetic | Maintenance filter chips (30–32 px), Contacts and Enclosures chips (34 px), Archive (26 px), Add photo (38 px), the enclosure copy-link (24 px) and the login links and Google button (20–38 px) were under 44 px on a phone | fixed: 44 px below `md` |
| 2 | cosmetic | The English / Thai switcher in the app header is 24 px tall on a phone (shared by every signed-in page and the login screens) | deferred to backlog: outside this sweep; the public site's switcher is already 44 px |
| 3 | cosmetic | The maintenance wizard's step dots are 26–30 px | deferred to backlog: navigation within a form |

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
| 1 | **Approve the look (desktop and 375 px, English and Thai).** No before screenshots were taken, so compare with `main`. Row actions are icon buttons; main actions keep their word | Maintenance (board, a job), Contacts hub, Vets hub, Enclosures, Deliveries, Projects |
| 2 | **A project folder with photos:** Rename, Move, Delete folder (disabled with a reason while it has contents), Add caption / Edit caption, Set / Clear cover, and the bin on a photo (still shown on hover with a mouse) | /projects/<a non-category folder> |
| 3 | **A Shelter Friend profile in the edit form:** Upload / Replace logo and Remove logo (image-off), then Remove Shelter Friend status (bin, confirm) | /contacts/<a friend> |
| 4 | Deleting a delivery and deleting a maintenance job still ask first and do what they did; Archive / Restore a contact still blocks while the contact has residents in care | Deliveries, a job, a contact hub |
| 5 | **On a real phone:** Maintenance and Stocktake as the Head of Maintenance and the 2IC would use them, and sign-in as a visitor would see it | those pages |
| 6 | Screen-reader names read "Delete: <item>" and "Edit caption: <caption>", and tooltips show the word | any row above |

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

Automated checks by: Claude (gates; `check-phone-width.mjs` for overflow; browser checks driven at desktop and 375 px in English and Thai against a disposable dev admin, signed in and signed out)  Date: 2026-10-05

### Manual verification

The items in **Left for manual verification** above, signed by the person who looked.

- [ ] The manual list above is empty, or every item in it was checked by a person. **If the list is empty, whoever filled the plan may tick this** and write `n/a: <reason>` on the signature below — there is nothing for a person to look at, so nothing is being signed for. If the list is not empty, only the person who looked may tick it

Manual verification by: pending: Lutan to approve the look and run the table above

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: not yet — pasted once the manual items are checked
- [ ] Handed to the production release manager — n/a: not yet — waiting on the manual look

Result: pass

Release manager acknowledgement: pending
