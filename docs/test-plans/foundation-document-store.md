# Feature test plan

<!-- guidance:start -->
Copy this file to the feature branch as `docs/test-plans/<feature>.md`, fill the
header, and tick as you go.

Every line must end up in one of four states, and CI checks this:

- `- [x]` — the check was actually run and passed.
- `- [ ] … — n/a: <reason>` — the check did not apply, and the reason says why.
- `- [ ] … — pending: <what is outstanding>` — the check **does** apply and
  genuinely waits on somebody or something: Lutan's own upload, a deploy, a
  person to look. It passes CI and is printed as *awaiting a person*.
- `- [ ] … — deferred: <owner>` — **section 8 only.** The check cannot be true
  yet, and this names who picks it up.

`pending:` is there so the honest word is also the one that passes. Before
2026-11-05 a checklist line that truly waited on someone had nowhere to say so —
only a tick or an `n/a:` passed — so a stream either went red for telling the
truth or wrote `n/a` for something that was not n/a. The signature lines below
had accepted `pending:` all along; the checklist now does too. **Nothing ships
on a `pending:`**: it is the release manager's pre-deploy pass that resolves it,
exactly as for the signatures.

That fourth state exists because the deploy gates in section 8 cannot be true at
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
with no completed `docs/test-plans/<feature>.md` fails. Small changes are not
exempt — they are simply fast, because most lines are honestly `n/a`. Writing the
`n/a` reason *is* the check; that is what says someone looked at everything rather
than at the happy path.

**A half-written plan is not a failure.** The plan is committed early and filled
in as the work proceeds, so CI sees it unfinished on every push in between. Since
2026-11-05 the checker reports an unfilled placeholder, a missing `Result:` line
and an unsigned sign-off as *still being written* and passes, exactly as it has
passed an unsigned plan since 2026-09-24. **Red means the plan is wrong**: a line
nobody addressed at all, an `n/a:` or a `pending:` with no reason, a `deferred:`
outside section 8, a release-notes tick with no release note, `Result: fail`.

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

Text between the `guidance:start` and `guidance:end` comments is advice, not fields:
the checker does not read it for unfilled `<…>` placeholders, so leave it or delete
it. Everything outside those comments is judged.
<!-- guidance:end -->

---

## Header

| | |
|---|---|
| Feature | A store for the foundation's own papers: bylaws, certificates, minutes, statements, tax ID, bank statements and reconciliations, and (its own card) board members' ID copies |
| Backlog item | `docs/backlog.md` → `#98se8` |
| Branch / worktree | `claude/foundation-document-store` @ `C:\Development\Animal_Shelter_foundation-document-store` |
| Dev server | `http://localhost:3007` |
| PR | opened after this commit |
| Tested by / date | Claude, 2026-11-12 |
| Carries a migration? | yes: `0362_foundation_document_store.sql`, applied to dev |
| Tested at SHA | 7bcc2b4de |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — a table, a `can_see_drive_file()` case and two cards (Foundation papers, Board ID copies) with two pages and an upload; matches `#98se8`
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs) — `supabase/migrations/0362_*`, `src/app/management/foundation-papers/**`, `src/lib/foundation/papers.ts`, `src/lib/permissions/{catalogue,cards,routes}.ts`, both dictionaries, manual topics, `write-requests.ts`, card-count check; the serving route `/api/documents/[fileId]` is untouched
- [x] Cards affected identified (the cards whose behaviour changes; who holds them today is labelled context only), plus whether admin and the signed-out public are affected — new cards `foundation_papers` (activity `foundation.papers`) and `foundation_id_copies` (`foundation.id_copies`); no existing card changes. Admin sits outside the card system and sees both; the signed-out public gets nothing
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised — payroll, a read-only card, in-place replace, CSV statements, bills and the supplier withholding documents: see the decision file

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

- [x] `node scripts/worktree.mjs sync`
- [x] `node scripts/gates.mjs` ends with one line of the shape `gates: typecheck=<N> lint=<N> test=<N> build=<N>` — **four gates, each `<N>` that gate's own exit code — ran at 7bcc2b4de

```
=== gates: typecheck exited 0 after 20s
=== gates: lint exited 0 after 184s
=== gates: test exited 0 after 49s
=== gates: build exited 0 after 83s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

Per `CLAUDE.md`, schema lands as its own PR before the feature.

- [x] Migration number is one above the highest on `main`, and no other in-flight branch carries one — `check-migration-numbers.mjs` reads open PRs and says `0362` is free
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed — ok; the only warnings were consumer files not yet on main
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations`
- [x] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — `if not exists`, `or replace`, `drop policy if exists`, upserts
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: new table, and `can_see_drive_file()` only gained a `union all` branch; the other 13 branches are copied from 0324 unchanged
- [x] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — against dev through the Data API as one-card logins (fixtures only): a bank statement without a month is refused (400), with `2027-01-01` accepted; an ID copy is refused to a papers-only login (403) and a minutes row to an ID-only login (403); `can_see_drive_file()` is false for an ID copy for papers-only and neither-card logins, true for the ID-copies login
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: additive; the undo is written in the migration header (drop the branch, the table and the three row sets)
- [x] Production apply plan stated for the release manager (which file, which project, when) — apply `0362` to `dbkodyyxxhtygxcxmfcu` BEFORE deploying code that reads it, because the new pages select from `foundation_documents`; see the PR body

## 4. Functional checks

- [x] Happy path works end to end — filed a made-up PDF as a one-card login, it appeared in the list, Open returned 200 `application/pdf` `private, no-store`
- [x] Data persists — the list is read from the table after `router.refresh()`
- [ ] Create / edit / delete all exercised (whichever the feature has) — pending: Remove was exercised only by a Data API delete, not by pressing the button in the page; there is no edit by design
- [x] Empty state renders sensibly (no rows yet) — the page shows the form and "Nothing has been filed here yet." with no broken part
- [x] Invalid input is rejected with a readable message, not a crash — month, title, file and category are checked in the action with sentences; the month and no-file cases were refused at the database/Data API
- [ ] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — pending: a file over 15 MB and a non-PDF non-image file were not tried in the browser; both are checked in the action before Drive is touched

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
| admin | both pages | outside the card system, sees both | not driven: Admin short-circuits in `can()` and `has_permission()`, unchanged |
| exactly `foundation_papers` | `/management/foundation-papers` | list, form, Open, Remove; no ID copies; `/board-ids` shows no title and no form | as expected: tile on `/home`, filed and opened a made-up PDF; sees 2 rows (bank_statement, establishment) and no ID copy; `can_see_drive_file(ID copy)` false; `/api/documents/<ID copy>` 404; cannot insert an ID copy (403) |
| exactly `foundation_id_copies` | `/management/foundation-papers/board-ids` | the ID copies only; the papers page shows no title and no form | as expected: sees 1 row (board_id_copy); `can_see_drive_file` true for it, false for the bank statement; cannot insert a minutes row (403); the document route answered 502 only because the fixture id does not exist on Drive |
| exactly `approve_text` (neither card) | nothing here | no rows, no pages, no files | as expected: 0 rows, both pages show no title and no form, `/api/documents/<ID copy>` 404 |
| signed out | nothing | refused | not driven: `authenticated` is the only role granted on the table and the route asks the caller's own session |

- [x] Every login above tested
- [x] A login that should not have access is blocked server-side (hitting the URL directly fails) — pages fetched directly with each cookie; an ID copy id gives 404 from `/api/documents` to the papers-only and neither-card logins

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: reached through each card's home tile (verified on `/home`), not `NavLinks.tsx`
- [x] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — two topics, `foundation-papers` and `foundation-id-copies`; lint's cards-have-topics check passes
- [x] Translatable strings go through the translation path, checked at `/management/translations` — new `foundationPapers` section and card labels in both dictionaries; the Thai wording is Claude's and unread by a Thai reader
- [ ] Mobile viewport (375px) — pending: not looked at; the layout uses the same classes as the meme form
- [ ] Browser console clean — pending: not read; the page rendered and filed with no visible error
- [ ] Network clean — pending: not read in the pane; the server-side fetches above returned the expected statuses

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked) — `/home` showed the new tile alongside the manual links; `/management` still opens
- [ ] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — pending: `en.ts`, `th.ts`, `cards.ts` and `routes.ts` were edited and the home and Management pages loaded, but a second unrelated page was not loaded
- [x] Nothing merged from `main` during `sync` was broken by this branch — typecheck, lint, test and build all re-run after the sync

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead) — `#98se8`, both halves are built
- [x] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`) — `docs/decisions/2026-11-12-foundation-document-store.md`
- [ ] `README.md` still accurate — n/a: the README does not list pages or cards
- [ ] **Release notes.** Would a shelter user notice this change? If so, `unreleased` in `src/lib/releases.ts` has a line for it, **in this PR**, written for a shelter user and not as a commit message. If not, `n/a: <why nobody would notice>`: a refactor, a script, a fix to something no user reached. The checker holds this line to the diff. A tick fails if `unreleased` gained no line. A PR touching `src/app/`, `src/components/`, `src/lib/manual/`, `src/lib/i18n/` or `worker/` fails if this line is missing, and its `n/a` reason is printed for the reviewer. An empty `unreleased` looks exactly like "nothing visible shipped", so this line is the only place that difference gets written down. **Do not tick while this PR's own decision file, README or backlog note records a step still outstanding before a user could see it (a deploy, a hand-edited file on the Pi, a setting).** A note promises the user it works now; a tick that only means "the code is in" sent #518's false note to every admin (decisions, 2026-10-11). Write `n/a: <the outstanding step>` and put the note in the PR that closes the step A PR that touches nothing but `docs/test-plans/` (a sign-off recorded after merge) has a tick checked against the merge that introduced the plan instead, so leave the feature's tick as it was. **And who is it for?** If the note is about a page only some roles can open (anything under Settings, an admin page), write it as `{ text: "…", cards: [...] }` naming the card (a `CardKey` from `src/lib/permissions/cards.ts`) that opens it, because a plain string is shown to every live role, including ones who cannot open the page. A card-tagged note is shown to whoever holds one of its cards and always to Admin; a tag whose cards nobody recognises shows to everyone rather than hiding. **Do not tag a new note with `roles`**: that older form is in Lanna's own role keys, which a shelter may rename, so it is closed to new notes (history keeps the tags it has: `docs/decisions/2026-10-26-release-notes-by-card.md`). You know the audience; the release manager can only guess from the wording. The checker warns, and never fails, on an untagged note that names an admin-only place and on a new note tagged `roles` (a wrong tag hides a note from the people it is for, which is worse). The checker finds this line by its bold **Release notes.** label, so keep the label as it is — n/a: the production migration 0362, assigning either card in Settings, and Lutan's go on the information protection are all still outstanding, so a note would promise users it works now
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** No gate reads prose: `typecheck`, `lint`, `build` and this checklist all pass with a confidently wrong explanation in the commit that ships the fix, and the wrong explanation is what the next person inherits. Worth real attention on timezone, concurrency and floating-point work, where intuition is unusually unreliable and a plausible story is easy to tell — the isolation claims are the printed statuses of a real run

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

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** Workers run in UTC wherever they are, so anything deriving "today" is wrong for part of every day in Thailand. That is two separate claims and they need different checks: — n/a: nothing derives today's date; a month is typed by the person and stored as its first day
  - *Does the logic handle the boundary?* Where the code lets an instant be injected, assert it rather than waiting for the clock: run the **real exported** function against fixed instants — both sides of 17:00Z, the 00:00 and 06:59 Thai ends of the broken window, month-end, year-end, a leap day — and then the same suite under `TZ=UTC`, which is the Workers case. Deterministic, and it does not depend on what hour you happened to be testing. Prefer this where it is available, and never re-type the logic into the test; a copy proves only that the copy works
  - *Does the deployed build behave as the source does?* A different claim, and only `test.lannacare.org` answers it — during 00:00–07:00 Thai, when the two dates differ. If you cannot be there at that hour, put it in **Left for manual verification** rather than ticking it
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary — n/a: no threshold or band; the month check was exercised on both sides (missing and 2027-01-01)
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.** A hand-maintained table of results is prose about a measurement rather than the measurement, and it drifts from the run without anyone noticing
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — n/a: no public page is touched

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production**. `scripts/lib/env.mjs` resolves shell over `.env.deploy.production` over `.env.local`, so a stray exported `NEXT_PUBLIC_SUPABASE_URL` silently builds production against dev and nothing errors — deferred: release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: none added; the upload reads the existing `GOOGLE_DRIVE_ROOT_FOLDER_ID`

### Migration ordering — *skip if no migration*

- [x] **Does this PR contain both a migration and code that reads it?** If yes, the production apply must happen *before* the deploy, and that ordering is written into the apply plan below. (PR #53 shipped both together; `main` briefly carried code selecting columns production did not have.) — yes: the production apply must happen before the deploy
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: release manager (a worktree cannot read production)
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh. (Additive nullable columns do not need this gate. The README restore recipe **has** been exercised three times — n/a: additive, creates a table and replaces a function body
- [x] Apply plan stated: which file, which project, and whether it runs before or after the deploy — file `0362`, project `dbkodyyxxhtygxcxmfcu`, before the deploy

### Rollback

- [x] Rollback position stated, **including what it does not cover**. Production is served by the Pi, so the rollback is `./scripts/pi/deploy-pi.sh --ref <sha>` there (a rebuild); `npx wrangler rollback --env production` reverts only the Worker fallback. Neither reverts migrations. Purely additive schema is safe to leave; anything else needs its own down-migration before "rollback available" is a true statement — leave the schema (additive); the Pi rolls back by `./scripts/pi/deploy-pi.sh --ref <sha>`; neither reverts the migration, and the pages would 500 only if the table were dropped

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | The first lint run failed: each new card must open a manual topic | fixed: two manual topics written |

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
| 1 | Press Remove on a made-up paper in the page itself and confirm the row goes | /management/foundation-papers |
| 2 | Read the Thai wording | both pages, Settings > Who does what card descriptions |
| 3 | Look at both pages on a phone | /management/foundation-papers |
| 4 | Say when the information protection is right, so real papers may be filed; nothing real has been loaded | Lutan |

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

Automated checks by: Claude  Date: 2026-11-12

### Manual verification

<!-- guidance:start -->
The items in **Left for manual verification** above. Signed by the person who
looked. Claude never signs this line on someone else's behalf, unless that person
has looked and explicitly asks in chat; the line then says so, e.g. `<name> —
confirmed in chat; line written by Claude at their request  Date: <yyyy-mm-dd>`.
Three valid states:

- `<name>  Date: <yyyy-mm-dd>` — a person looked. The date is required here.
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
<!-- guidance:end -->

A red `test-plan` that says what it is waiting for is a red people act on. An
illegible one is a red people learn to ignore.

- [ ] The manual list above is empty, or every item in it was checked by a person. **If the list is empty, whoever filled the plan may tick this** and write `n/a: <reason>` on the signature below — pending: see Left for manual verification

Manual verification by: pending: the four items in Left for manual verification

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — pending: pasted when the PR opens
- [ ] Handed to the production release manager — pending: after merge

Result: pass with accepted defects

Release manager acknowledgement: pending: after merge
