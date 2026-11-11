# Feature test plan — control-drive-fixtures

## Header

| | |
|---|---|
| Feature | Dev fixtures for driving controls, and the Enclosure hub log-work sentence gated on the card that draws the Log button |
| Backlog item | `docs/backlog.md` → #79sqf (stays open), #m8kq4 (filed from this stream's findings) |
| Branch / worktree | `claude/control-drive-fixtures` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3007` |
| PR | pending: opened after this commit |
| Tested by / date | Claude, 2026-11-11 |
| Carries a migration? | no |
| Tested at SHA | fc721587 |

**How this plan came to be written by a second session, because it matters for reading the signatures
below.** The stream that did the work stopped deliberately under its brief's stop-rule — *"the session
has grown large, so I'd leave the gates, test plan and PR to a fresh session, as your brief says"* —
after committing both of its commits and writing a full handover in its last message. **It did not
fail or freeze; it handed over, and it answered when asked.** Everything in section 2 was re-run by the
planner on the merged head; everything in section 4 is the original stream's driven evidence, quoted
from `docs/decisions/2026-11-11-control-listing-sweep-15.md` rather than re-driven, and the one thing
neither session drove is in **Left for manual verification**.

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs)
- [x] Cards affected identified (the cards whose behaviour changes; who holds them today is labelled context only), plus whether admin and the signed-out public are affected
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised

**One sentence:** a login that cannot log maintenance work is no longer told *"Log repairs and work
needed on this enclosure…"*, and the dev fixtures needed to drive per-row controls are recorded so the
next stream does not rebuild them.

**Files touched:** `src/app/enclosures/[id]/EnclosureHub.tsx` (one ternary),
`docs/dev-fixtures-for-control-driving.md` (new), `docs/decisions/2026-11-11-control-listing-sweep-15.md`
(new). No shared lib, no `worker/`, no migration.

**Cards affected:** the change is gated on `canWriteMaintenance`, the same flag that draws the Log
button immediately below it, so **only a login WITHOUT maintenance write sees a difference** — it now
sees nothing where it previously saw an invitation it could not accept. **Admin is unaffected** (it sits
outside the card system and the flag is true for it). **The signed-out public cannot reach this page.**

**Out of scope, and named so the release manager is not surprised:** `#79sqf` stays open. Still
undriven: Archive, the match-a-bill job press, the Shelter Friend card, per-row controls on
`/medical/diets` and `/operations/*`, and the `/memes/make` canvas and tag-save-read-back — the last two
blocked by `#m8kq4`, not by fixtures.

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
- [x] `node scripts/gates.mjs` ends with one line of the shape `gates: typecheck=<N> lint=<N> test=<N> build=<N>` — **four gates, each `<N>` that gate's own exit code, and every `<N>` is `0`.** Run it yourself and paste its closing lines **exactly as your run printed them**, in a fenced block under this line: the `=== gates: <name> exited <N> after <S>s` line for each gate as well as the final `gates:` line. **Never type the final line from this description or copy it from another plan.** The shape here is deliberately not a line you could paste: the per-gate `after <S>s` timings are the part only a real run has. `check-test-plan.mjs` cannot tell a pasted run from a typed one, so this wording is the only guard (`docs/decisions/2026-11-02-gates-line-four-gates.md`). They are the evidence, and running the script again regenerates them

```
=== gates: typecheck exited 0 after 16s
=== gates: lint exited 0 after 196s
=== gates: test exited 0 after 37s
=== gates: build exited 0 after 110s
gates: typecheck=0 lint=0 test=0 build=0
```

**This run is on `fc721587`, the head after `sync` merged 22 commits from `main` (including the 0.44.2
release cut).** The original stream's own clean run predated that merge, so it was not evidence for
this head and is not quoted here.

- [ ] CI green on the PR (runs the same four gates, among its other checks). **This one cannot be true in the commit that creates the PR**, so write it `n/a: not yet — the PR does not exist at this commit` and **leave it there.** Changed 2026-10-20: ticking it in a follow-up commit used to be the rule, and that commit **invalidated its own evidence** — a new HEAD means a new run, so every PR in this repository paid two full CI cycles to transcribe a result GitHub already records permanently against the commit. A tick here attests to nothing a reader can check better by looking at the PR. **What must still happen, and is a merge step rather than a checklist line: before merging, read the run for your current HEAD (`gh run view <id> --json status,conclusion,headSha`) and confirm its `headSha` matches.** Merging on an older run's strength merges a commit whose CI never finished. **Do not pre-tick this line either** — a green you have not seen is the exact failure this checklist exists to prevent — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

Per `CLAUDE.md`, schema lands as its own PR before the feature.

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration in this PR
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration in this PR
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration in this PR
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration in this PR
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration in this PR
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: no migration in this PR
- [ ] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — n/a: no migration in this PR
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration in this PR
- [ ] Production apply plan stated for the release manager (which file, which project, when) — n/a: no migration in this PR

## 4. Functional checks

- [x] Happy path works end to end — the sentence is gone for a login holding only `enclosures`, re-checked in the pane after the edit
- [ ] Data persists — reload the page and the change is still there — n/a: a visibility gate; nothing is written
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: a visibility gate; this change has none. (Save and Delete WERE driven on `/bills` as part of the sweep — see the matrix — but they are not this change)
- [x] Empty state renders sensibly (no rows yet) — this IS the change: with no maintenance jobs, a login that cannot log work now sees nothing rather than an invitation it cannot accept
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: a visibility gate; no input
- [ ] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — n/a: a visibility gate; no input

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
| exactly `enclosures` | `/enclosures/[id]` with residents | residents listed; no Edit, no Log; **no log-work sentence** | pass — sentence gone after the fix, re-driven |
| exactly `bills` | `/bills`, open bill | Add another page, match-to-maintenance-job, Save, Delete; delivery and visit matches absent | pass — Save printed "Saved."; Delete emptied the inbox; the two matches were correctly absent |
| exactly `meme_add` | `/memes/make` | resident picker names residents; a resident with an approved photo offers it | **FAIL on the second half — filed as #m8kq4**; picker passes |
| a login that CAN log work | `/enclosures[id]` with no jobs | **still sees the log-work sentence** | **not driven — see Left for manual verification** |
| admin | `/enclosures/[id]` | outside the card system, not tested | n/a |
| signed out | `/enclosures/[id]` | not tested; the page is staff-only and 307s to `/login` | n/a |

- [ ] Every login above tested — pending: the "can log work" row was not driven by either session
- [x] A login that should not have access is blocked server-side (hitting the URL directly fails) — `/bills` and `/enclosures/[id]` both 307 to `/login` signed out, confirmed by the sweep-13/14 render passes; and **this change removes no server or database check**

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — appears for the right cards, no dead links — n/a: no new page or nav entry; one ternary in an existing component
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: no new page or string
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: no string added or reworded; the existing `t.enclosures.hub.maintenanceDetail` is unchanged and still used
- [ ] Mobile viewport (375px) — no overflow, controls reachable — n/a: the change only removes an element for some logins; it adds no layout
- [ ] Browser console clean — no errors or React warnings — n/a: not recorded by the driving session; the change is a render-time ternary with no client code
- [ ] Network clean — no unexpected 4xx/5xx on the feature's pages — n/a: not recorded by the driving session; no request path changed

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked) — `/enclosures/[id]` re-driven in the pane after the edit under the `enclosures` card; `/bills` driven in the same session; the full build passes
- [ ] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — **by loading that page, not by reading the file** — n/a: no shared file touched; `EnclosureHub.tsx` is used by `/enclosures/[id]` only
- [x] Nothing merged from `main` during `sync` was broken by this branch — `sync` merged 22 commits cleanly and all four gates pass on the merged head `fc721587`

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead) — n/a: this PR closes no item. `#79sqf` stays open and was retitled on the `backlog` branch (`afffdad4`), and `#m8kq4` was filed there from this stream's *found, not fixed* list
- [x] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`) — `2026-11-11-control-listing-sweep-15.md`, plus `docs/dev-fixtures-for-control-driving.md` as the reusable half
- [ ] `README.md` still accurate — n/a: nothing to update
- [ ] **Release notes.** Would a shelter user notice this change? If so, `unreleased` in `src/lib/releases.ts` has a line for it, **in this PR**, written for a shelter user and not as a commit message. If not, `n/a: <why nobody would notice>`: a refactor, a script, a fix to something no user reached. The checker holds this line to the diff. A tick fails if `unreleased` gained no line. A PR touching `src/app/`, `src/components/`, `src/lib/manual/`, `src/lib/i18n/` or `worker/` fails if this line is missing, and its `n/a` reason is printed for the reviewer. An empty `unreleased` looks exactly like "nothing visible shipped", so this line is the only place that difference gets written down. **Do not tick while this PR's own decision file, README or backlog note records a step still outstanding before a user could see it (a deploy, a hand-edited file on the Pi, a setting).** A note promises the user it works now; a tick that only means "the code is in" sent #518's false note to every admin (decisions, 2026-10-11). Write `n/a: <the outstanding step>` and put the note in the PR that closes the step A PR that touches nothing but `docs/test-plans/` (a sign-off recorded after merge) has a tick checked against the merge that introduced the plan instead, so leave the feature's tick as it was. **And who is it for?** If the note is about a page only some roles can open (anything under Settings, an admin page), write it as `{ text: "…", cards: [...] }` naming the card (a `CardKey` from `src/lib/permissions/cards.ts`) that opens it, because a plain string is shown to every live role, including ones who cannot open the page. A card-tagged note is shown to whoever holds one of its cards and always to Admin; a tag whose cards nobody recognises shows to everyone rather than hiding. **Do not tag a new note with `roles`**: that older form is in Lanna's own role keys, which a shelter may rename, so it is closed to new notes (history keeps the tags it has: `docs/decisions/2026-10-26-release-notes-by-card.md`). You know the audience; the release manager can only guess from the wording. The checker warns, and never fails, on an untagged note that names an admin-only place and on a new note tagged `roles` (a wrong tag hides a note from the people it is for, which is worse). The checker finds this line by its bold **Release notes.** label, so keep the label as it is — n/a: the sentence only stops being shown to logins that cannot log work; nobody who could act on it sees any change, which is the same reasoning as #1470's page-editor hint
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** No gate reads prose: `typecheck`, `lint`, `build` and this checklist all pass with a confidently wrong explanation in the commit that ships the fix, and the wrong explanation is what the next person inherits. Worth real attention on timezone, concurrency and floating-point work, where intuition is unusually unreliable and a plausible story is easy to tell — every claim in sweep 15 is a driven observation under a named one-card login, and the one thing it could not establish (whether Admin sees the same resident's photo) is written down as not established rather than assumed

## 8. Pre-production gate

Owned jointly with the release manager. **The three hosts, as they stand since
2026-11-08:**

| Host | What it is | Database |
|---|---|---|
| `lannacareforanimals.org` | **production** | `dbkodyyxxhtygxcxmfcu` |
| `test.lannacare.org` | **test** | the **dev** project, `qxkmhwybjggxvsfxsxbd` |
| `uat.lannacare.org` | **UAT**, the customer's acceptance-test site | its own project, `fsjagxmxjosauwmxwype`, on a second Supabase account |

**`lannacare.org` is now a 301 to production and is a check of nothing.**

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — deferred: release manager
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary** — deferred: release manager
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited.** — deferred: release manager
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — deferred: release manager

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — deferred: release manager

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration in this PR
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — n/a: no migration in this PR
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — n/a: no migration in this PR
- [ ] Apply plan stated: which file, which project, and whether it runs before or after the deploy — n/a: no migration in this PR

### Rollback

- [ ] Rollback position stated, **including what it does not cover** — deferred: release manager

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | medium | `/enclosures/[id]`: *"Log repairs and work needed on this enclosure…"* was drawn to a login with no Log button — a notice promising an ability the card does not carry (`#79sqf` fault shape 2) | **fixed** — `EnclosureHub.tsx` now gates it on `canWriteMaintenance`, the same flag as the button; re-driven after the edit |
| 2 | medium | `/memes/make`: a `meme_add`-only login can pick a resident but cannot read that resident's photo list, so the maker dead-ends on "no photos that can be made into a meme". `attachments`' select policy asks `resident.record`; the card grants `resident.who_and_where` | **deferred to backlog** — filed as `#m8kq4`; needs a migration (a new view), so out of scope for this PR |

## Left for manual verification

Anything above that Claude could not honestly verify, listed here so it is a
short, concrete handover rather than a vague "please check it". Empty is a valid
answer when the change has no surface a person needs to look at.

**Do not repeat a section 8 deploy-time check here.**

The test for whether something belongs here: **would a person have to go and look
at it, separately from deploying?**

| # | What to check | Where |
|---|---|---|
| 1 | **The positive path: a login that CAN log maintenance work still sees the "Log repairs and work needed on this enclosure…" sentence** when the enclosure has no jobs yet. The driving session proved only that it is GONE for a login without the card; neither session drove the card that should still see it. The code is a plain `canWriteMaintenance ? sentence : null` and is correct by inspection, so this is a low-risk confirmation rather than a suspicion — but it is the half that was not driven, and a fix that hid the sentence from everyone would look identical on the evidence collected | `/enclosures/[id]` for an enclosure with no maintenance jobs, under a card granting maintenance write (`node scripts/dev-signin.mjs --cards <card> --port <yours>`), or as Admin |

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

- [ ] The manual list above is empty, or every item in it was checked by a person — pending: the positive-path row above has not been driven by anyone

Manual verification by: pending: a login that can log work still sees the sentence — not driven

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — pending: release manager

Result: pass

Release manager acknowledgement: pending: release manager
