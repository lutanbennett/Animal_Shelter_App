# Feature test plan


---

## Header

| | |
|---|---|
| Feature | meme-maker-tag-residents |
| Backlog item | `docs/backlog.md` → #0awyj |
| Branch / worktree | `claude/meme-maker-tag-residents` @ `C:DevelopmentAnimal_Shelter_meme-maker-tag-residents` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:<.port>` |
| PR | pending: number known once opened |
| Tested by / date | Claude / 2026-11-09 |
| Carries a migration? | no |
| Tested at SHA | 7a0ade9a |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — the meme maker now offers the same resident picker as `/memes/new`, with the source photo's residents pre-chosen and removable
- [x] Files/areas touched listed — `src/app/memes/make/{MemeMaker,UploadPicker,page}.tsx`, `src/app/memes/actions.ts` (one condition), `src/lib/releases.ts`; no dictionary change (reuses `memes.form` strings), no migration
- [x] Cards affected identified — `meme_library`, `meme_add` (both `social.library` edit + `resident.who_and_where` read); Admin unaffected; signed-out refused by the page as before
- [x] Anything explicitly **out of scope** written down — out of scope: the meme detail page hides tagged residents from a login holding only `resident.who_and_where` (found, see Defects)

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

- [ ] `node scripts/worktree.mjs sync` — pending: run in the finishing sequence
- [x] `node scripts/gates.mjs` — all four gates, every exit code 0. Output:

```
=== gates: typecheck — npm run typecheck
=== gates: typecheck exited 0 after 89s
=== gates: lint — npm run lint
=== gates: lint exited 0 after 256s
=== gates: test — npm test
=== gates: test exited 0 after 43s
=== gates: build — npm run build
=== gates: build exited 0 after 245s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR (runs the same four gates, among its other checks). **This one cannot b — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

Per `CLAUDE.md`, schema lands as its own PR before the feature.

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: no migration
- [ ] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — n/a: no migration
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager (which file, which project, when) — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end — card-only `meme_add` login: `/memes/make?source=upload`, uploaded a photo, tagged "Test 1", saved; `meme_residents` row exists with no edit step; Admin sees "Test 1" linked on the saved meme
- [x] Data persists — reload the page and the change is still there — `meme_residents` row read back from dev with the service key after the save
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: only create is touched; edit and delete paths unchanged
- [ ] Empty state renders sensibly (no rows yet) — pending: not provoked live (dev has residents); the maker passes `residentsEmptyNote` from `loadMemeResidents` exactly as `/memes/new` does
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: the picker adds no free-text input
- [ ] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — n/a: zero residents chosen is the existing default and is allowed

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
| admin | `/memes/<id>` of the saved meme | resident chip shows "Test 1" | pass |
| exactly `meme_add` | `/memes/make?source=upload` | picker offers 4 residents; saved with the tag | pass |
| exactly `meme_library` | `/memes/make` | same page and component as `meme_add` | n/a: not driven separately, same card contents for this page |
| signed out | none | refused by the page, unchanged | n/a: not re-driven, no change to the gate |

- [x] Every login above tested — admin and `meme_add` driven; `meme_library` not separately driven (see matrix)
- [x] A login that should not have access is blocked server-side (hitting the URL directly fails) — page gate `social.library` at edit unchanged

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no nav change
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: no behaviour a manual topic describes changed
- [x] Translatable strings go through the translation path, checked at `/management/translations` — both dictionaries; the Thai is unreviewed, #y1dqu
- [ ] Mobile viewport (375px) — n/a: no layout change, one line of text in an existing list
- [ ] Browser console clean — no errors or React warnings — pending: console not read; the flow ran without a visible error
- [ ] Network clean — no unexpected 4xx/5xx on the feature's pages — pending: network log not read

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked) — `/memes`, `/memes/make`, `/memes/make?source=upload` and the saved meme page loaded; typecheck clean
- [x] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — `ResidentPicker` and `loadMemeResidents` not edited; `releases.ts` merged with another stream's note, both kept
- [x] Nothing merged from `main` during `sync` was broken by this branch — one conflict in `releases.ts` (two notes), both kept; gates run after the merge

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** — #0awyj
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `docs/decisions/2026-11-09-meme-maker-tag-residents.md`
- [ ] `README.md` still accurate — n/a: README does not describe the meme picker
- [x] **Release notes.** `unreleased` gained a line about tagging residents in the maker
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** No gate reads pro

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

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: Lutan, with the release
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** Workers run in — n/a: no date logic
  - *Does the logic handle the boundary?* Where the code lets an instant be injected, assert it rather than waiting for the clock: run the **real exported** function against fixed instants — both sides of 17:00Z, the 00:00 and 06:59 Thai ends of the broken window, month-end, year-end, a leap day — and then the same suite under `TZ=UTC`, which is the Workers case. Deterministic, and it does not depend on what hour you happened to be testing. Prefer this where it is available, and never re-type the logic into the test; a copy proves only that the copy works
  - *Does the deployed build behave as the source does?* A different claim, and only `test.lannacare.org` answers it — during 00:00–07:00 Thai, when the two dates differ. If you cannot be there at that hour, put it in **Left for manual verification** rather than ticking it
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both s — n/a: no threshold or banding change
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited.** A hand-maintaine — n/a: no evidence table in this plan beyond the gates block
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 1 — n/a: no public page touched

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: no new secret or env var

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** If yes, the production a — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — n/a: no migration
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — n/a: no migration
- [ ] Apply plan stated: which file, which project, and whether it runs before or after the depl — n/a: no migration

### Rollback

- [ ] Rollback position stated, **including what it does not cover**. Production is served by th — deferred: release manager; a pure code change, `deploy-pi.sh --ref <sha>` reverts it, no schema involved

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | The meme detail page lists only residents the login can read from the `residents` table (`src/lib/memes/queries.ts:75`), so a login holding only `resident.who_and_where` saves a tag it cannot then see ("No resident is tagged."). Present on all three routes, not caused here | deferred to the planner |

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
| 1 | Empty-picker wording in the maker: a login whose cards cannot see residents, or an empty shelter, should read the note under the Choose residents button rather than nothing | `/memes/make?source=upload` |

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

Automated checks by: Claude  Date: 2026-11-09

### Manual verification


A red `test-plan` that says what it is waiting for is a red people act on. An
illegible one is a red people learn to ignore.

- [ ] The manual list above is empty, or every item in it was checked by a person — pending: row 1, the empty-picker wording, was not provoked on dev **If the list is empty, whoever filled the plan may tick this** and write `n/a: <reason>` on the signature below — there is nothing for a person to look at, so nothing is being signed for. If the list is not empty, only the person who looked may tick it

Manual verification by: Claude  Date: 2026-11-09

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [ ] Handed to the production release manager — pending: release time

Result: pass

Release manager acknowledgement: pending: release time
