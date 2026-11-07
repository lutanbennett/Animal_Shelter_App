# Feature test plan — english-plumbing-archive

## Header

| | |
|---|---|
| Feature | Archive/restore helpers and Drive-folder warnings take `t` from their callers, so they read in Thai (`#c7zjk` tail) |
| Backlog item | `docs/backlog.md` → `#c7zjk` (annotated, left open: Thai read and rule 3 blocking remain) |
| Branch / worktree | `claude/english-plumbing-archive` @ `C:\Development\Animal_Shelter_english-plumbing-archive` |
| Dev server | not started — helpers are server-side and write to the shared dev database |
| PR | opened after this plan |
| Tested by / date | Claude / 2026-11-06 |
| Carries a migration? | no |
| Tested at SHA | `4d03b978` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the — one sentence: nine English strings (5 archive helpers, 4 Drive-folder warnings) now come from the dictionary passed by the caller
- [x] Files/areas touched listed (routes, `worker/`, `supabase/mig — `src/lib/archive/*`, `src/lib/{maintenance,projects}/drive-sync.ts`, nine caller files, both dictionaries, `src/lib/releases.ts`, `docs/`
- [x] Cards affected identified (the cards whose behaviour changes — none changes behaviour; only the language of five refusals and three warnings. Admin and public unaffected
- [x] Anything explicitly **out of scope** written down, so the re — out of scope: making rule 3 blocking, a Thai read, any other threaded `t`

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

- [x] `node scripts/worktree.mjs sync` — run before the PR
- [x] `node scripts/gates.mjs` — pending: gates run
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

Per `CLAUDE.md`, schema lands as its own PR before the feature.

- [ ] Migration number is one above the highest on `main`, and no other in-f — n/a: no migration in this PR
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration in this PR
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration in this PR
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_mi — n/a: no migration in this PR
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exist — n/a: no migration in this PR
- [ ] Existing rows still read correctly after the change (checked against r — n/a: no migration in this PR
- [ ] **Constraints and defaults exercised against real rows** in a `begin; — n/a: no migration in this PR
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration in this PR
- [ ] Production apply plan stated for the release manager (which file, whic — n/a: no migration in this PR

## 4. Functional checks

- [ ] Happy path works end to end — n/a: server-side helper text only; no screen added, see pending line in Left for manual verification
- [ ] Data persists — n/a: server-side helper text only; no screen added, see pending line in Left for manual verification
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: server-side helper text only; no screen added, see pending line in Left for manual verification
- [ ] Empty state renders sensibly (no rows yet) — n/a: server-side helper text only; no screen added, see pending line in Left for manual verification
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: server-side helper text only; no screen added, see pending line in Left for manual verification
- [ ] Boundary cases checked (long text, zero, negative, missing optional fi — n/a: server-side helper text only; no screen added, see pending line in Left for manual verification

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
| admin | the retry buttons on a deceased hub | unchanged | n/a: no access rule changed |
| exactly `placement.death` | Retry archiving | unchanged, now in the app's language | n/a: not driven, writes to shared dev database |
| signed out | nothing | nothing | n/a: no access rule changed |

- [ ] Every login above tested — n/a: server-side helper text only; no screen added, see pending line in Left for manual verification
- [ ] A login that should not have access is blocked server-side (hitting th — n/a: server-side helper text only; no screen added, see pending line in Left for manual verification

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no nav, manual page or layout touched; strings go through the dictionaries
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly — n/a: no nav, manual page or layout touched; strings go through the dictionaries
- [ ] Translatable strings go through the translation path, checked at `/man — n/a: no nav, manual page or layout touched; strings go through the dictionaries
- [ ] Mobile viewport (375px) — n/a: no nav, manual page or layout touched; strings go through the dictionaries
- [ ] Browser console clean — n/a: no nav, manual page or layout touched; strings go through the dictionaries
- [ ] Network clean — n/a: no nav, manual page or layout touched; strings go through the dictionaries

## 6. Regression

- [x] The pages nearest the change still work (list the ones check — typecheck of all callers (`tsc` clean); pages not driven, see manual list
- [ ] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) — n/a: no shared UI file touched
- [x] Nothing merged from `main` during `sync` was broken by this  — sync brought nothing that touches these files

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch**  — `#c7zjk` annotated with the re-measured figures; deliberately not ticked
- [x] Non-obvious design choices added as a new file in `docs/deci — `docs/decisions/2026-11-06-english-plumbing-archive.md`
- [x] `README.md` still accurate — unaffected, it does not list helper signatures
- [x] **Release notes.** Would a shelter user notice this change?  — `unreleased` gained one line, which says the Thai is unchecked
- [x] Commit messages say why, not just what — say why
- [x] **Claims in commit messages and `docs/decisions.md` were mea — figures came from `check-thai-dictionary.mjs` and a grep of callers, not from the item

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

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at depl — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient ho — n/a: no date logic
  - *Does the logic handle the boundary?* Where the code lets an instant be injected, assert it rather than waiting for the clock: run the **real exported** function against fixed instants — both sides of 17:00Z, the 00:00 and 06:59 Thai ends of the broken window, month-end, year-end, a leap day — and then the same suite under `TZ=UTC`, which is the Workers case. Deterministic, and it does not depend on what hour you happened to be testing. Prefer this where it is available, and never re-type the logic into the test; a copy proves only that the copy works
  - *Does the deployed build behave as the source does?* A different claim, and only `test.lannacare.org` answers it — during 00:00–07:00 Thai, when the two dates differ. If you cannot be there at that hour, put it in **Left for manual verification** rather than ticking it
- [ ] **For a boundary or banding change, the assertions cover both edges of — n/a: no boundary change
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited — deferred: release manager
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after — n/a: public site not touched

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref ** — deferred: release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** If y — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and — n/a: no migration
- [ ] For a **destructive or rewriting** migration only: a production backup — n/a: no migration
- [ ] Apply plan stated: which file, which project, and whether it runs befo — n/a: no migration

### Rollback

- [x] Rollback position — a code rollback restores the English strings; nothing in the database changed

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | info | A stub-`t` test of the helpers themselves cannot load: they import `server-only` and the PDF stack | accepted — the dictionary test and the typecheck of every call site stand instead |

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
| 1 | pending: in Thai, press Retry archiving on a resident whose archive failed and read the sentence; and read the seven new Thai keys | the deceased hub |

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


The items in **Left for manual verification** above. Signed by the person who
looked. Claude never signs this line on someone else's behalf, unless that person
has looked and explicitly asks in chat; the line then says so, e.g. `a name —
confirmed in chat; line written by Claude at their request  Date: the date`.
Three valid states:

- `a name  Date: the date` — a person looked. The date is required here.
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

- [ ] The manual list above is empty, or every item in it was checked by a person — pending: the Thai read and Retry press in the manual list

Manual verification by: pending: Thai read of the seven new keys and one Retry press in Thai

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR body links it
- [ ] Handed to the production release manager — n/a: through the release's PR list

Result: pass with accepted defects

Release manager acknowledgement: n/a: not yet released
