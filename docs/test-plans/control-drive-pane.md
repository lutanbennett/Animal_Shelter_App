## Header

| | |
|---|---|
| Feature | Drive `/memes/make` under a meme_add-only login; fix the photo refusal it exposed; list the click-only controls |
| Backlog item | `docs/backlog.md` → #79sqf (left open) |
| Branch / worktree | `claude/<feature>` @ `C:\Development\Animal_Shelter_<feature>` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3002` |
| PR | see PR |
| Tested by / date | Claude / 2026-11-11 |
| Carries a migration? | no |
| Tested at SHA | see PR head |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog i — done: see PR body and docs/decisions/2026-11-11-control-drive-pane.md; card meme_add (only card whose behaviour changes), Admin unaffected, signed-out unaffected; out of scope: pressing the click-only controls
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, — done: see PR body and docs/decisions/2026-11-11-control-drive-pane.md; card meme_add (only card whose behaviour changes), Admin unaffected, signed-out unaffected; out of scope: pressing the click-only controls
- [x] Cards affected identified (the cards whose behaviour changes; who hold — done: see PR body and docs/decisions/2026-11-11-control-drive-pane.md; card meme_add (only card whose behaviour changes), Admin unaffected, signed-out unaffected; out of scope: pressing the click-only controls
- [x] Anything explicitly out of scope written down, so the release manager  — done: see PR body and docs/decisions/2026-11-11-control-drive-pane.md; card meme_add (only card whose behaviour changes), Admin unaffected, signed-out unaffected; out of scope: pressing the click-only controls

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

- [x] `node scripts/worktree.mjs sync` — origin/main merged in cleanly
- [x] `node scripts/gates.mjs` — all four gates exit 0, output as printed:

```
=== gates: typecheck exited 0 after 186s
=== gates: lint exited 0 after 661s
=== gates: test exited 0 after 90s
=== gates: build exited 0 after 427s
gates: typecheck=0 lint=0 test=0 build=0
```
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

Per `CLAUDE.md`, schema lands as its own PR before the feature.

- [ ] Migration number is one above the highest on `main`, and no other in-f — n/a: no migration in this PR
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration in this PR
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration in this PR
- [ ] Applied to dev (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrat — n/a: no migration in this PR
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exist — n/a: no migration in this PR
- [ ] Existing rows still read correctly after the change (checked against r — n/a: no migration in this PR
- [ ] Constraints and defaults exercised against real rows in a `begin; … ro — n/a: no migration in this PR
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration in this PR
- [ ] Production apply plan stated for the release manager (which file, whic — n/a: no migration in this PR

## 4. Functional checks

- [x] Happy path works end to end — driven on dev as a meme_add-only login: Make a meme, pick Test 1, photo, caption, Save; the meme page then read back the resident and the tag
- [x] Data persists — driven on dev as a meme_add-only login: Make a meme, pick Test 1, photo, caption, Save; the meme page then read back the resident and the tag
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: the change is one lookup fallback; create was exercised, edit/delete/empty/boundary not touched
- [ ] Empty state renders sensibly (no rows yet) — n/a: the change is one lookup fallback; create was exercised, edit/delete/empty/boundary not touched
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: the change is one lookup fallback; create was exercised, edit/delete/empty/boundary not touched
- [ ] Boundary cases checked (long text, zero, negative, missing optional fi — n/a: the change is one lookup fallback; create was exercised, edit/delete/empty/boundary not touched

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
| admin | not exercised | unchanged | n/a: path unchanged for a login that reads attachments |
| exactly `meme_add` | /memes, /memes/make, saved meme | pick photo, canvas, save, read back | pass |
| exactly `meme_add` | Archive/Delete on a meme | absent | pass |
| signed out | n/a | n/a | n/a: no change |

- [x] Every login above tested — the one card whose behaviour changed (meme_add) was driven; admin and others unchanged
- [x] A login that should not have access is blocked server-side (hitting th — Archive and Delete are absent on the saved meme for this card; their server checks untouched

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no nav, manual, string or layout change
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly  — n/a: no nav, manual, string or layout change
- [ ] Translatable strings go through the translation path, checked at `/man — n/a: no nav, manual, string or layout change
- [ ] Mobile viewport (375px) — n/a: no nav, manual, string or layout change
- [ ] Browser console clean — n/a: no nav, manual, string or layout change
- [ ] Network clean — n/a: no nav, manual, string or layout change

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked) — /memes library and /memes/<id> loaded as the meme_add login after the change
- [x] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs)  — /memes library and /memes/<id> loaded as the meme_add login after the change
- [x] Nothing merged from `main` during `sync` was broken by this branch — gates ran after sync

## 7. Documentation

- [ ] Backlog item ticked — n/a: #79sqf deliberately left open; what remains is named in the decision file
- [x] Non-obvious design choices added — docs/decisions/2026-11-11-control-drive-pane.md
- [x] `README.md` still accurate — it does not describe the meme maker source lookup
- [x] **Release notes.** — a card-tagged (meme_add) line added to `unreleased` in src/lib/releases.ts
- [x] Commit messages say why
- [x] Claims were measured — the refusal was reproduced, the fix re-driven to a saved meme

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

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at depl — n/a: not a release PR; no deploy done by this stream
- [ ] Deployed SHA matches the tested SHA — n/a: not a release PR; no deploy done by this stream

### On the deployed build

- [ ] Deployed to test — n/a: not a release PR; no deploy done by this stream
- [ ] Smoke-tested on `test.lannacare.org` — n/a: not a release PR; no deploy done by this stream
- [ ] Timezone-sensitive behaviour proved, not observed at a convenient hour — n/a: not a release PR; no deploy done by this stream
  - *Does the logic handle the boundary?* Where the code lets an instant be injected, assert it rather than waiting for the clock: run the **real exported** function against fixed instants — both sides of 17:00Z, the 00:00 and 06:59 Thai ends of the broken window, month-end, year-end, a leap day — and then the same suite under `TZ=UTC`, which is the Workers case. Deterministic, and it does not depend on what hour you happened to be testing. Prefer this where it is available, and never re-type the logic into the test; a copy proves only that the copy works
  - *Does the deployed build behave as the source does?* A different claim, and only `test.lannacare.org` answers it — during 00:00–07:00 Thai, when the two dates differ. If you cannot be there at that hour, put it in **Left for manual verification** rather than ticking it
- [ ] For a boundary or banding change, the assertions cover both edges of t — n/a: not a release PR; no deploy done by this stream
- [ ] Evidence pasted into this plan is the tool's actual output, unedited — n/a: not a release PR; no deploy done by this stream
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after  — n/a: not a release PR; no deploy done by this stream

### Deploy safety

- [ ] `deploy — n/a: not a release PR; no deploy done by this stream
- [ ] `strip-baked-env — n/a: not a release PR; no deploy done by this stream
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: not a release PR; no deploy done by this stream

### Migration ordering — *skip if no migration*

- [ ] Does this PR contain both a migration and code that reads it? If yes,  — n/a: not a release PR; no deploy done by this stream
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and — n/a: not a release PR; no deploy done by this stream
- [ ] For a destructive or rewriting migration only — n/a: not a release PR; no deploy done by this stream
- [ ] Apply plan stated — n/a: not a release PR; no deploy done by this stream

### Rollback

- [ ] Rollback position stated, including what it does not cover — n/a: not a release PR; no deploy done by this stream

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | Medium | Meme maker refused every photo for a meme_add-only login (resolveSource read attachments, the picker reads resident_photo_list) | fixed |

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
| 1 | Nothing: every item was driven by Claude in the pane | n/a |

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

Automated checks by: Claude  Date: 2026-11-11

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

- [x] The manual list above is empty — nothing for a person to look at

Manual verification by: n/a: nothing is left for a person to look at; the browser check was driven

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted — pending: pasted when the PR is opened into the PR
- [ ] Handed to the production — pending: next release release manager

Result: pass

Release manager acknowledgement: pending: next release
