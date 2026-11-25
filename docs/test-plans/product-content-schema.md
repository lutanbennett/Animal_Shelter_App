# Feature test plan


---

## Header

| | |
|---|---|
| Feature | Product page content storage: the schema half of the console for the cooperjaidee.org pages |
| Backlog item | `docs/backlog.md` → #pcmsx (half: schema; the console surface is the next stream) |
| Branch / worktree | `claude/product-content-schema` @ `C:\Development\Animal_Shelter_product-content-schema` |
| Dev server | not started: nothing in the app reads the new objects yet |
| PR | pending: opened after this commit |
| Tested by / date | Claude, 2026-11-25 |
| Carries a migration\? | yes: 0441, 0442 |
| Tested at SHA | 9d3f6a5a2 |

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
- [x] `node scripts/gates.mjs` ends with one line of the shape `gates: typecheck=<N> lint=<N> test=<N> build=<N>` — …

```
=== gates: typecheck — npm run typecheck
=== gates: typecheck exited 0 after 63s
=== gates: lint — npm run lint
=== gates: lint exited 0 after 189s
=== gates: test — npm test
=== gates: test exited 0 after 30s
=== gates: build — npm run build
=== gates: build exited 0 after 162s
gates: typecheck=0 lint=0 test=0 build=0
```
- [ ] CI green on the PR (runs the same four gates, among its other checks). **This one cannot be true in … — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

Per `CLAUDE.md`, schema lands as its own PR before the feature.

- [x] Migration number is one above the highest on `main`, and no other in-flight branch carries one
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations`
- [x] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`)
- [ ] Existing rows still read correctly after the change (checked against real dev data)… — n/a: the tables are new; no existing row is touched
- [x] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — the `do $$ … $$` block CLAUDE.md describes under "Database migrations", whose `raise exception` assertions surface as errors. Say what was asserted, not merely that it ran: typically that checks reject invalid values, that `null` means "not set" rather than zero, that values round-trip at full precision, and that nothing was silently back-filled. This is usually the most valuable single thing done to a migration, and it signs under **Automated checks** — it is scripted and repeatable, not a person looking at a screen
- [x] Down-migration written, or the reason one is not needed is stated
- [x] Production apply plan stated for the release manager (which file, which project, when)

## 4. Functional checks

- [x] Happy path works end to end
- [x] Data persists — reload the page and the change is still there
- [x] Create / edit / delete all exercised (whichever the feature has)
- [ ] Empty state renders sensibly (no rows yet)… — n/a: no page reads the table yet; the reader returns an empty map for an empty page (unit-tested)
- [x] Invalid input is rejected with a readable message, not a crash
- [x] Boundary cases checked (long text, zero, negative, missing optional fields, dates)

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
| signed out (anon, claims role=anon) | `public_platform_content` | reads all 330 rows, with and without a shelter header; refused on the base table and on the write function | pass (harness) |
| a signed-in login that is not a product administrator, aal2 | the write and delete functions, the table | refused (42501) on all three | pass (harness) |
| a product administrator at aal1 | the write function | refused for the second step | pass (harness) |
| a product administrator at aal2 | the write function | writes; a later write without `drive_file_id` keeps the photo; a malformed page name is rejected | pass (harness) |
| admin | no card governs this: the product administrator list is outside the card system | n/a | n/a |

- [x] Every login above tested
- [x] A login that should not have access is blocked server-side (hitting the URL directly fails)

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — appears for the right cards, no dead links… — n/a: no page, route or nav entry
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual`… — n/a: no user-visible surface
- [ ] Translatable strings go through the translation path, checked at `/management/translations`… — n/a: no UI strings; the Thai is stored beside the English and seeded, see the decision file
- [ ] Mobile viewport (375px) — no overflow, controls reachable… — n/a: no UI surface
- [ ] Browser console clean — no errors or React warnings… — n/a: no UI surface
- [ ] Network clean — no unexpected 4xx/5xx on the feature's pages… — n/a: no UI surface; no page calls the view yet

## 6. Regression

- [ ] The pages nearest the change still work (list the ones checked)… — n/a: no page reads the new objects; is_public_drive_file and is_known_drive_file gained one branch each, proven by the harness
- [ ] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelat… — n/a: no shared app file touched; the two shared SQL functions only gained a branch
- [x] Nothing merged from `main` during `sync` was broken by this branch

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch i… — n/a: half the item: #pcmsx is deliberately not ticked; one line added to its tail naming the decision file
- [x] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`)
- [x] `README.md` still accurate
- [ ] **Release notes.** Would a shelter user notice this change, **or would an Admin or a product adminis… — n/a: nobody using the app can see storage; no page, setting or screen changed
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** No gate reads prose: `typecheck`, `lint`, `build` and this checklist all pass with a confidently wrong explanation in the commit that ships the fix, and the wrong explanation is what the next person inherits. Worth real attention on timezone, concurrency and floating-point work, where intuition is unusually unreliable and a plausible story is easy to tell

## 8. Pre-production gate

Owned jointly with the release manager. **The three hosts, as they stand since
2026-11-08:**

| Host | What it is | Database |
|---|---|---|
| `lannacareforanimals.org` | **production** | `dbkodyyxxhtygxcxmfcu` |
| `test.lannacare.org` | **test** | the **dev** project, `qxkmhwybjggxvsfxsxbd` |
| `uat.lannacare.org` | **UAT**, the customer's acceptance-test site | its own project, `fsjagxmxjosauwmxwype`, on a second Supabase account |

**`lannacare.org` is now a 301 to production and is a check of nothing.** It was
production until 2026-11-05 and UAT from then until 2026-11-08, so a plan written
from this template before today may name it as either, and both readings were
correct when written. **UAT is deployed on every release since 2026-11-08**
(`docs/release-procedure.md`, step 6), last of the three.

### Tested build

- [ ] Tested SHA recorded (section 8 check) — deferred: release manager
- [ ] Deployed SHA matches (section 8 check) — deferred: release manager

### On the deployed build

- [ ] Deployed to test (section 8 check) — deferred: release manager
- [ ] Smoke-tested on (section 8 check) — deferred: release manager
- [ ] Timezone (section 8 check) — deferred: n/a here, no date logic or threshold; release manager confirms
  - *Does the logic handle the boundary?* Where the code lets an instant be injected, assert it rather than waiting for the clock: run the **real exported** function against fixed instants — both sides of 17:00Z, the 00:00 and 06:59 Thai ends of the broken window, month-end, year-end, a leap day — and then the same suite under `TZ=UTC`, which is the Workers case. Deterministic, and it does not depend on what hour you happened to be testing. Prefer this where it is available, and never re-type the logic into the test; a copy proves only that the copy works
  - *Does the deployed build behave as the source does?* A different claim, and only `test.lannacare.org` answers it — during 00:00–07:00 Thai, when the two dates differ. If you cannot be there at that hour, put it in **Left for manual verification** rather than ticking it
- [ ] For a boundary (section 8 check) — deferred: n/a here, no date logic or threshold; release manager confirms
- [ ] Evidence pasted (section 8 check) — deferred: release manager
- [ ] Public pages (section 8 check) — deferred: release manager

### Deploy safety

- [ ] deploy: production (section 8 check) — deferred: release manager
- [ ] strip-baked-env (section 8 check) — deferred: release manager
- [ ] Any new secret (section 8 check) — deferred: release manager

### Migration ordering — *skip if no migration*

- [ ] Does this PR contain both (section 8 check) — deferred: release manager
- [ ] node scripts/apply-migrations.mjs --env production --dry-run (section 8 check) — deferred: release manager (0442 reports FAILED in a dry run because it needs 0441 committed first; a real apply is correct)
- [ ] For a destructive (section 8 check) — deferred: release manager
- [ ] Apply plan stated (section 8 check) — deferred: release manager: 0441_platform_content.sql then 0442_platform_content_seed.sql to production dbkodyyxxhtygxcxmfcu, either side of the deploy, both additive

### Rollback

- [ ] Rollback position stated (section 8 check) — deferred: release manager: additive schema is safe to leave; the two edited functions are restored by re-running 0429

## Defects found

None open. Two found and fixed in the PR: `check-view-owners` refused a postgres-owned view (now owned by `rls_definer` with one role-limited policy), and `check-migration-grants` wanted write privileges revoked on the new view (done).

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
| 1 | Nothing: no screen exists yet; the console stream will have one | n/a |

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

Automated checks by: Claude  Date: 2026-11-25

### Manual verification


A red `test-plan` that says what it is waiting for is a red people act on. An
illegible one is a red people learn to ignore.

- [x] The manual list above is empty, or every item in it was checked by a person. **If the list is empty, whoever filled the plan may tick this** and write `n/a: <reason>` on the signature below — there is nothing for a person to look at, so nothing is being signed for. If the list is not empty, only the person who looked may tick it

Manual verification by: n/a: no surface a person could look at; the harness is the proof

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — pending: after the PR is opened
- [ ] Handed to the production release manager — pending: at the release cut

Result: pass

Release manager acknowledgement: pending: at the release cut
