# Feature test plan — planner-handover-738

## Header

| | |
|---|---|
| Feature | Planner handover, edition `738` — a delta against `737` |
| Backlog item | none — `/plan-day` step 8 requires a handover when the plan's last batch is set up |
| Branch / worktree | `claude/planner-handover-738` |
| Dev server | not started — no runtime surface (see section 1) |
| PR | pending: opened after this commit |
| Tested by / date | Claude, 2026-11-11 |
| Carries a migration? | no |
| Tested at SHA | b85d9c3a |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs)
- [x] Cards affected identified (the cards whose behaviour changes; who holds them today is labelled context only), plus whether admin and the signed-out public are affected
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised

**One sentence:** `docs/planner-handover.md` is replaced with edition `738`, a delta against `737`
reporting what its warnings and owed items did and correcting one claim it made.

**Files touched:** `docs/planner-handover.md` only, plus this plan. **No `src/`, no `worker/`, no
`supabase/migrations/`, no script, no shared lib.**

**Cards affected: none.** The handover is a document read by one planner chat. **There is no route, no
component, no activity and no card**, so Admin and the signed-out public are unaffected.

**Out of scope, named so the release manager is not surprised:** **batch 3's figures are not in this
edition and it says so in its own opening** — `control-activity-check`, `th-path-alternates` and
`refusal-keys-group-4` were set up in this plan and two of them already have PRs open (#1478, #1479).
Their readings belong to `739`. `docs/release-handover.md` is untouched.

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

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly — the worktree was branched from `origin/main` and is 2 commits ahead of it, 0 behind, at the tested SHA
- [x] `node scripts/gates.mjs` ends with one line of the shape `gates: typecheck=<N> lint=<N> test=<N> build=<N>` — **four gates, each `<N>` that gate's own exit code, and every `<N>` is `0`.** Run it yourself and paste its closing lines **exactly as your run printed them**, in a fenced block under this line: the `=== gates: <name> exited <N> after <S>s` line for each gate as well as the final `gates:` line. **Never type the final line from this description or copy it from another plan.** The shape here is deliberately not a line you could paste: the per-gate `after <S>s` timings are the part only a real run has. `check-test-plan.mjs` cannot tell a pasted run from a typed one, so this wording is the only guard (`docs/decisions/2026-11-02-gates-line-four-gates.md`). They are the evidence, and running the script again regenerates them

```
=== gates: typecheck exited 0 after 64s
=== gates: lint exited 0 after 178s
=== gates: test exited 0 after 31s
=== gates: build exited 0 after 133s
gates: typecheck=0 lint=0 test=0 build=0
```

**One thing stated rather than glossed, because the run and the tested SHA are not quite the same
commit.** The gates were started on the handover's content and finished after a second commit
(`b85d9c3a`) that **trimmed ten lines of `docs/planner-handover.md` and changed nothing else.** **No
gate reads that file** — typecheck, lint, test and build do not look in `docs/` — so the four exit
codes above hold for the tested SHA. **Said here rather than left for someone to notice from the
timestamps.**

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

- [ ] Happy path works end to end — n/a: a markdown document; it has no execution path
- [ ] Data persists — reload the page and the change is still there — n/a: no page, no data
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: no page, no data
- [ ] Empty state renders sensibly (no rows yet) — n/a: no page, no data
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no input
- [ ] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — n/a: no input

### Role access matrix

Analyse by CARD, not by role (`CLAUDE.md`, *All analysis is by CARD, never by role*).

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| any | — | **the document is not served to anyone; it is read from the repository by one planner chat** | n/a |

- [ ] Every login above tested — n/a: no runtime surface, so there is nothing a login can reach
- [ ] A login that should not have access is blocked server-side (hitting the URL directly fails) — n/a: no URL serves this document

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — appears for the right cards, no dead links — n/a: nothing under `src/`
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: the manual is for shelter users; this is a planner document
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: no user-facing string
- [ ] Mobile viewport (375px) — no overflow, controls reachable — n/a: no rendered surface
- [ ] Browser console clean — no errors or React warnings — n/a: no rendered surface
- [ ] Network clean — no unexpected 4xx/5xx on the feature's pages — n/a: no rendered surface

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked) — not pages: the thing that consumes this document is the next planner chat, and **every factual claim in it was re-derived in the writing turn rather than carried over** (the PR-state check for all eleven slugs, the `check-ungranted-activities.mjs` run, the `cards.ts:405-406` grant levels, the seven floor figures from their own `stream-usage` comments). All four gates pass.
- [x] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — **by loading that page, not by reading the file** — n/a as written, and worth one line on why: no shared code file was touched. **`docs/planner-handover.md` is itself the shared artifact, and it is wholly replaced each edition by design** — `CLAUDE.md` records that a wrong line in it is corrected by its successor rather than by a reviewer, which is why it merges on green
- [x] Nothing merged from `main` during `sync` was broken by this branch — the branch is one document ahead of `origin/main`; nothing to break

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead) — n/a: there is no backlog item. A handover is required by `/plan-day` step 8 when the plan's last batch is set up, and it closes nothing
- [ ] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`) — n/a: the document IS the record. A decision file about a handover would be a second place to look for the same reasoning
- [ ] `README.md` still accurate — n/a: nothing to update
- [ ] **Release notes.** Would a shelter user notice this change? If so, `unreleased` in `src/lib/releases.ts` has a line for it, **in this PR**, written for a shelter user and not as a commit message. If not, `n/a: <why nobody would notice>`: a refactor, a script, a fix to something no user reached. The checker holds this line to the diff. A tick fails if `unreleased` gained no line. A PR touching `src/app/`, `src/components/`, `src/lib/manual/`, `src/lib/i18n/` or `worker/` fails if this line is missing, and its `n/a` reason is printed for the reviewer. An empty `unreleased` looks exactly like "nothing visible shipped", so this line is the only place that difference gets written down. **Do not tick while this PR's own decision file, README or backlog note records a step still outstanding before a user could see it (a deploy, a hand-edited file on the Pi, a setting).** A note promises the user it works now; a tick that only means "the code is in" sent #518's false note to every admin (decisions, 2026-10-11). Write `n/a: <the outstanding step>` and put the note in the PR that closes the step A PR that touches nothing but `docs/test-plans/` (a sign-off recorded after merge) has a tick checked against the merge that introduced the plan instead, so leave the feature's tick as it was. **And who is it for?** If the note is about a page only some roles can open (anything under Settings, an admin page), write it as `{ text: "…", cards: [...] }` naming the card (a `CardKey` from `src/lib/permissions/cards.ts`) that opens it, because a plain string is shown to every live role, including ones who cannot open the page. A card-tagged note is shown to whoever holds one of its cards and always to Admin; a tag whose cards nobody recognises shows to everyone rather than hiding. **Do not tag a new note with `roles`**: that older form is in Lanna's own role keys, which a shelter may rename, so it is closed to new notes (history keeps the tags it has: `docs/decisions/2026-10-26-release-notes-by-card.md`). You know the audience; the release manager can only guess from the wording. The checker warns, and never fails, on an untagged note that names an admin-only place and on a new note tagged `roles` (a wrong tag hides a note from the people it is for, which is worse). The checker finds this line by its bold **Release notes.** label, so keep the label as it is — n/a: an internal planner document; no shelter user or visitor can observe any difference
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** No gate reads prose: `typecheck`, `lint`, `build` and this checklist all pass with a confidently wrong explanation in the commit that ships the fix, and the wrong explanation is what the next person inherits. Worth real attention on timezone, concurrency and floating-point work, where intuition is unusually unreliable and a plausible story is easy to tell — **this is the line that matters most for a handover, since the whole document is prose no gate reads.** What was measured rather than reasoned: the eleven slugs' PR states (run in the writing turn, and it changed the text — two PRs had opened since hand-over); `check-ungranted-activities.mjs`'s actual output for the `#n5r7k` correction; the two stock activities' grant **levels** read from `cards.ts:405-406` rather than taken from the stream that reported them; the seven floor figures from their own PR comments; and the stalled-stream account quoted from that session's transcript via `list_events`. **Two claims are explicitly marked as NOT established in the document: the per-surface driving cost, and whether block B's fix will fire.**

## 8. Pre-production gate

Owned jointly with the release manager. **The three hosts, as they stand since
2026-11-08:**

| Host | What it is | Database |
|---|---|---|
| `lannacareforanimals.org` | **production** | `dbkodyyxxhtygxcxmfcu` |
| `test.lannacare.org` | **test** | the **dev** project, `qxkmhwybjggxvsfxsxbd` |
| `uat.lannacare.org` | **UAT**, the customer's acceptance-test site | its own project, `fsjagxmxjosauwmxwype`, on a second Supabase account |

**Nothing in this PR reaches any of the three.** A document under `docs/` is not bundled, served or
deployed. **Every line below is `n/a` for that reason, not deferred** — there is no deploy-time action
for the release manager to pick up, and marking them `deferred` would open rows that nothing ever
closes (the 2026-09-27 fault, which five release-cut plans hit).

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — n/a: nothing in this PR is deployed
- [ ] Deployed SHA matches the tested SHA — n/a: nothing in this PR is deployed

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — n/a: nothing in this PR is deployed
- [ ] Smoke-tested on `test.lannacare.org` — n/a: nothing in this PR is deployed
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: no date or time logic
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary** — n/a: the document discusses token bands but computes nothing
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited.** — n/a: the only tool output here is the gates block, pasted unedited from the run file
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — n/a: no public page changes

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — n/a: no deploy
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — n/a: no deploy
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: no new secret or env var

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration in this PR
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — n/a: no migration in this PR
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — n/a: no migration in this PR
- [ ] Apply plan stated: which file, which project, and whether it runs before or after the deploy — n/a: no migration in this PR

### Rollback

- [ ] Rollback position stated, **including what it does not cover** — n/a: nothing is deployed. Reverting the commit restores edition `737`, and a wrong line in a handover is corrected by its successor in any case

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | Edition `737` stated that `#n5r7k`'s mirror check did not exist. It does, it is blocking in CI, and it shipped 2026-11-06 | **fixed** — corrected in `738` with the check's actual output, and the item's title was corrected on the `backlog` branch |
| 2 | low | `738` is 247 lines against the skill's ~150-line target | **accepted** — every line is delta, no per-stream figures are reproduced, and `737` was 322. Ten of the weakest lines were cut in `b85d9c3a`; the standing-checks section is named in the PR as what to cut next |

## Left for manual verification

Anything above that Claude could not honestly verify, listed here so it is a
short, concrete handover rather than a vague "please check it". Empty is a valid
answer when the change has no surface a person needs to look at.

**Do not repeat a section 8 deploy-time check here.**

The test for whether something belongs here: **would a person have to go and look
at it, separately from deploying?**

| # | What to check | Where |
|---|---|---|
| | | |

**Empty on purpose.** `CLAUDE.md` records that Lutan has never reviewed a handover and that asking him
to merge one *"made a gate out of bookkeeping"* — which is precisely why these merge on green. **The
document's real verification is the next planner reading it and finding it accurate**, and that is
recorded inside it as work for edition `739`, not as a manual check anyone can perform now.

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

- [x] The manual list above is empty, or every item in it was checked by a person. **If the list is empty, whoever filled the plan may tick this** and write `n/a: <reason>` on the signature below — there is nothing for a person to look at, so nothing is being signed for. If the list is not empty, only the person who looked may tick it

Manual verification by: n/a: a planner document with no runtime surface; Lutan has never reviewed a handover and these merge on green by his decision of 2026-10-21

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: nothing in this PR is deployed, so there is nothing to hand over

Result: pass

Release manager acknowledgement: n/a: nothing in this PR reaches any host
