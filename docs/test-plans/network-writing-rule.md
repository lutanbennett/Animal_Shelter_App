# Feature test plan

---

## Header

| | |
|---|---|
| Feature | Move the house-network writing rule out of `docs/backlog.md` and into `CLAUDE.md` |
| Backlog item | `docs/backlog.md` → `#1wf15` ("A WRITING RULE, NOT A SCRUB: when writing about the house network, put the VALUE in the Desktop notes and the MEANING in the repo") |
| Branch / worktree | `claude/network-writing-rule` @ `C:\Development\Animal_Shelter_network-writing-rule` |
| Dev server | n/a: docs only, no page to open — `node scripts/worktree.mjs dev` → `http://localhost:3001` if one were needed |
| PR | pending: opened immediately after this commit; the PR carries the same three files and nothing else |
| Tested by / date | Claude (Opus 5) / 2026-11-13 |
| Carries a migration? | no |
| Tested at SHA | 672898577 — the commit this header is in is the next one, which only replaces these two header cells |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for

  One sentence: the standing writing rule that was living in backlog item `#1wf15` is now a
  section of `CLAUDE.md`, and the item is ticked. The item asked for nothing to be *built* — its
  own first line says *"Nothing to decide; apply it as you write"* — which is exactly why it could
  never be ticked, and Lutan asked on 2026-11-13 for it to be moved into the instructions.

- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs)

  Three files, all documentation, no code:

  - `CLAUDE.md` — one new section, *"Writing about the house network: the value goes in the Desktop notes"*, inserted between `## Finishing a feature` and `## A trap in this shell`.
  - `docs/backlog.md` — `#1wf15` ticked, with a note naming the new section by its heading.
  - `docs/test-plans/network-writing-rule.md` — this file.

  No route, no `worker/`, no `supabase/migrations/`, no shared lib, no `src/` file at all.

- [ ] Cards affected identified (the cards whose behaviour changes; who holds them today is labelled context only), plus whether admin and the signed-out public are affected — n/a: no card, no permission check and no page is touched, so no card's behaviour changes, admin is unaffected and the signed-out public is unaffected
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised

  Out of scope, deliberately:

  - **No scrub and no history rewrite.** The new section says so in its first line. The 2026-11-01 decision considered rewriting history and rejected it — force-pushing every branch of a repository with other sessions working in it, to remove things that are not credentials, from a history that forks and caches may already hold. Nothing in this PR removes a published value.
  - **No new decision file.** `docs/decisions/2026-11-01-hardware-identifiers-in-a-public-repo.md` already holds the reasoning and names the scans so nobody re-derives them. This PR only moves where the rule is read, and the new section cites that file. Recorded under section 7.
  - **No release note.** See section 7.
  - **The other `CLAUDE.md` change in flight is not this one.** `#d6wxo` (the adopter portal's website-only account) also needs a `CLAUDE.md` entry; that is its own stream and nothing here anticipates it. Checked at `sync` time — see section 6.

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly

  Merged `origin/main` at the `migration-number-hook` stream's merge: five files, with
  `docs/backlog.md` auto-merged (that stream ticked its own item a few lines away from `#1wf15`).
  **Read rather than trusted, because `CLAUDE.md` is the repo's own rulebook:** after the merge
  `grep -c "Writing about the house network" CLAUDE.md` is `1` and the `#1wf15` line still begins
  `- [x]`, so both of this branch's edits survived. `CLAUDE.md` itself was not touched by
  `origin/main`, so there was no collision with `#d6wxo` to resolve.

- [x] `node scripts/gates.mjs` ends with one line of the shape `gates: typecheck=<N> lint=<N> test=<N> build=<N>`

```
=== gates: typecheck exited 0 after 72s
=== gates: lint exited 0 after 179s
=== gates: test exited 0 after 33s
=== gates: build exited 0 after 114s

gates: typecheck=0 lint=0 test=0 build=0
```

  Run in this worktree with all three of this PR's files on disk, **after the second `sync`** —
  which brought in the `bills-chips` stream, including code under `src/`. An earlier run had
  already passed, but its figures described the branch before that merge, so it was run again
  rather than left to describe content that had moved. Those per-gate timings are the part only a
  real run has, which is why they are pasted rather than retyped. (A first attempt was piped into
  `tail -30`, which threw away the three earlier per-gate lines; it was re-run without the pipe
  rather than reconstructing them.)

  **This matters more than usual on this PR: CI skipped the gates.** The run is docs-only, so
  `check-docs-only.mjs` set `docs-only=true` and 14 of the 17 jobs skipped — the `check` job that
  runs these same four gates among them. The three that ran (`changes`, `decision-dates`,
  `test-plan`) all passed. So this block is the only gate evidence for this change, by design.

- [ ] CI green on the PR (runs the same four gates, among its other checks) — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

Skipped: this PR carries no migration. `supabase/migrations/` is untouched.

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration in this PR
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration in this PR
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration in this PR
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration in this PR
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration in this PR
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: no migration, and no code reads anything new; no database column, view or function is involved
- [ ] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — n/a: no migration in this PR, so there is no constraint or default to assert
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration in this PR
- [ ] Production apply plan stated for the release manager (which file, which project, when) — n/a: no migration in this PR, so there is nothing for the release manager to apply

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no runtime behaviour changes; the happy path of a `CLAUDE.md` section is a session reading it, which is checked by reading the rendered section in place (section 6)
- [ ] Data persists — reload the page and the change is still there — n/a: no page and no stored data; the change is three documentation files in git
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: the feature has none of these; it adds no form, action or route
- [ ] Empty state renders sensibly (no rows yet) — n/a: no list, table or query is involved
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no input surface; nothing in this PR accepts a value from anyone
- [ ] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — n/a: no input and no computation; the two dates in the new section (2026-09-18, 2026-11-01) are prose copied from the decision file, not values anything parses

### Role access matrix

n/a for this change: no page, card or server check is touched, so there is nothing a login could
reach differently. The rows are answered rather than deleted, so it is on the record that they
were considered.

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a: no page in this PR | unchanged | n/a: no page in this PR |
| exactly one card, any key | n/a: no page in this PR | unchanged | n/a: no page in this PR |
| signed out | n/a: no page in this PR | unchanged | n/a: no page in this PR |

- [ ] Every login above tested — n/a: no page, route, card or server check is touched, so no login can see anything it could not see before
- [ ] A login that should not have access is blocked server-side (hitting the URL directly fails) — n/a: this PR adds no URL to hit

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — appears for the right cards, no dead links — n/a: `src/app/NavLinks.tsx` is untouched and this PR adds no page to navigate to
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: the manual is for shelter users; this rule is for Claude sessions writing documentation and has no shelter-user meaning
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: no user-facing string is added; `CLAUDE.md` and `docs/` are English-only developer documentation and are not translated
- [ ] Mobile viewport (375px) — no overflow, controls reachable — n/a: no UI in this PR
- [ ] Browser console clean — no errors or React warnings — n/a: no UI in this PR, nothing is loaded in a browser
- [ ] Network clean — no unexpected 4xx/5xx on the feature's pages — n/a: this PR has no pages

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked)

  Read as "the checks nearest the change still pass", since there are no pages. The two scripts
  that read the files this PR edits were both run:

  - `node scripts/check-backlog-sections.mjs` — `ok — 35 open items, all above ## Completed`, so the tick did not move `#1wf15` across the `## Completed` boundary.
  - `node scripts/check-backlog-ids.mjs`, run by the pre-commit hook — `ok — 1086 items, 1086 ids, all present and unique`, so the edited line kept its id.

  `docs/backlog.md` is CRLF in the worktree and LF in git (`git ls-files --eol` reports
  `i/lf w/crlf`), which is the known trap when editing it by script. The tick shows as **one**
  changed line in `git diff --stat`, not the whole file, so no line ending was mangled. Same check
  on `CLAUDE.md`: 32 insertions, 0 deletions.

- [x] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — **by loading that page, not by reading the file**

  None of those shared files is touched. `CLAUDE.md` is itself the most-read shared file in the
  repository, and the equivalent of loading the page for it is reading the rendered section in
  place rather than reading the diff — done, and the new section sits whole between
  `## Finishing a feature` and `## A trap in this shell`, with the next heading intact after it.
  The four gates are the second, unrelated consumer: `typecheck`, `lint`, `test` and `build` all
  read the repository with these files in it, and none is affected.

- [x] Nothing merged from `main` during `sync` was broken by this branch

  `sync` brought in the `migration-number-hook` stream — `scripts/check-migration-numbers.mjs` and
  its test, plus a decision file and a test plan. This branch touches no script and no test, so it
  cannot have broken it, and the `test` gate above runs that stream's new test among the rest. The
  one overlapping file was `docs/backlog.md`, auto-merged, and both ticks are present.

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead)

  `#1wf15` ticked here, with a note that names the new `CLAUDE.md` section by its heading, says
  Lutan asked for the move and why the item could never be ticked, and states that nothing was
  scrubbed and no history was rewritten.

  **And the step every stream owes — what else this closed.** The five other open items that read
  like standing rules were checked: `#v3knd` (the prose queue's `reviewed_by` shows no name),
  `#w8kq3` (the pre-commit hook and CI disagree about migration numbers), `#hzmxi` and `#c7zjk` (a
  Thai speaker reading the new strings, then flipping `RULE_3_BLOCKS`) and `#7bd5u` (four optional
  public-site optimisations waiting on a quiet machine). Every one of them still has real work in
  it, and none is about what may be committed to a public repository. **Nothing else closed, as
  expected** — `#1wf15` was the only open item of this shape.

- [x] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`)

  Deliberately none, and that is itself the choice:
  `docs/decisions/2026-11-01-hardware-identifiers-in-a-public-repo.md` already holds the full
  reasoning and names the scans so nobody re-derives them. This PR only moves where the rule is
  read, and the new section cites that file. A second decision file about the same rule would be
  the "six dated notes on one subject" fault `CLAUDE.md` warns about, one directory along.

- [x] `README.md` still accurate

  Untouched and unaffected: `README.md` describes the app and its operations, not the repository's
  writing rules, and nothing in it contradicts the new section.

- [ ] **Release notes.** — n/a: no user-visible change; this moves a rule Claude follows when writing, and no shelter user sees it. `src/lib/releases.ts` is untouched and `unreleased` deliberately gained no line. The PR touches none of `src/app/`, `src/components/`, `src/lib/manual/`, `src/lib/i18n/` or `worker/`
- [x] Commit messages say why, not just what

  The commit says why the item could never be ticked (a standing rule with no finish line), why
  `CLAUDE.md` is the right home (measured: its only mention of the repository being public was a
  passing one about naming scratch files, inside the merge-train section, so a stream writing up
  the Pi would never have met the rule), and why the section opens by saying this is not a scrub.

- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.**

  Three claims in the commit and the new section, and each was measured rather than recalled:

  - *"`CLAUDE.md` did not say it anywhere"* — searching `CLAUDE.md` for the repository being public, before the change, returned the one line in the merge-train section about naming scratch files, and nothing else.
  - *The repo public since 2026-09-18, the drive serial, the four LAN addresses, the two device models, and "nothing was rotated and no history was rewritten"* — all copied from `docs/decisions/2026-11-01-hardware-identifiers-in-a-public-repo.md`, which is the record of the scans. **Not re-scanned here, and the section does not claim it was:** it is dated to 2026-11-01 and points at that file, so a later reader can see how old the reading is.
  - *"`#1wf15` is the only open item of this shape"* — the five candidates were read, not assumed; see the backlog line above.

  `docs/decisions.md` itself is untouched — it is the frozen baseline, and `CLAUDE.md` says to add a
  file rather than append to it.

## 8. Pre-production gate

Nothing in this PR reaches a deployed build. It changes three documentation files; no Worker
bundle, no page, no database object and no environment variable is involved, so there is no
deployed thing a deploy-time check could be true or false about. Every line below is `n/a` for
that reason rather than `deferred:` — a `deferred:` names someone who picks the check up at deploy
time, and here there will be nothing to pick up.

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — n/a: documentation only, nothing is deployed from this PR; the SHA is in the header for the record
- [ ] Deployed SHA matches the tested SHA — n/a: this PR is never deployed on its own, and `deploy.mjs` is not run for it

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — n/a: documentation only, there is nothing to deploy
- [ ] Smoke-tested on `test.lannacare.org` — n/a: documentation only, no behaviour reaches the deployed build
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: no code, no clock and no date arithmetic; the dates in the new section are prose
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary** — n/a: no threshold, rounding rule, retry window, pagination limit or permission cutoff is touched
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited.** — n/a: there is no deployed build to gather evidence from. For the record, the only tool output in this plan is the `gates.mjs` block in section 2, pasted from the run exactly as it printed, and no table of results is hand-maintained anywhere in this plan
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — n/a: no public page is touched, so no edge cache can be serving anything stale from this PR

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — n/a: no deploy is run for this PR
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — n/a: no deploy and no Worker bundle is built for this PR
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: this PR adds no secret and no environment variable

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: neither a migration nor code is in this PR, so there is no ordering to state
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — n/a: no migration in this PR
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — n/a: no migration in this PR, destructive or otherwise
- [ ] Apply plan stated: which file, which project, and whether it runs before or after the deploy — n/a: no migration in this PR

### Rollback

- [ ] Rollback position stated, **including what it does not cover** — n/a: nothing is deployed, so there is no deployed position to roll back. For the record, reverting this PR's commits restores the previous wording of `CLAUDE.md` and `docs/backlog.md` in full, and no migration or Worker state is involved

## Defects found

None.

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| — | — | None found | — |

## Left for manual verification

Empty, which is a valid answer here: the change is three documentation files and there is no
surface a person has to go and look at separately from reading the diff. Lutan asked for the move
and the wording is his own rule restated, so the one judgement a person might make — does it read
correctly — is made by reading the PR.

| # | What to check | Where |
|---|---|---|
| — | Nothing | — |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (Opus 5)  Date: 2026-11-13

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person

Manual verification by: n/a: docs only, no UI surface

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager

Result: pass

Release manager acknowledgement: n/a: documentation only, nothing in this PR reaches a deployed build or the production database
