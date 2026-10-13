# Feature test plan — public-site-fable-review

## Header

| | |
|---|---|
| Feature | Fable review of the public website, ending in a report: `docs/public-site-review-2026-10-13.md`, nineteen reduced screenshots in `docs/public-site-review/`, a decision file, and a PDF of the report on the Desktop |
| Backlog item | `docs/backlog.md` → **Fable review of the public website: design improvements, navigation and content suggestions, ending in a report.** (Public website; not ticked — the item closes on the walkthrough with Lutan; a status note was added on this branch) |
| Branch / worktree | `claude/public-site-fable-review` @ `C:\Development\Animal_Shelter_public-site-fable-review` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3001` (the server the review drove; the change itself has no UI) |
| PR | to be filled when opened |
| Tested by / date | Claude (Fable 5.1) / 2026-10-13 |
| Carries a migration? | no |
| Tested at SHA | `f23a60f1` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — a review-only document of every public page at 375 and 1280 px in English and Thai, opening with a five-minute summary and ranking 22 suggestions as ready-to-paste backlog items grouped design / navigation / content / trust / comparison / search, with screenshots and a PDF copy on the Desktop; the item asked for exactly that and for nothing to be changed
- [x] Files/areas touched listed — `docs/public-site-review-2026-10-13.md` (new), `docs/public-site-review/*.jpg` (19 new), `docs/decisions/2026-10-13-public-site-fable-review.md` (new), `docs/backlog.md` (one status note on the review's own line, and one open item moved from below `## Completed` back into its section, text unchanged — see §2), this plan; a PDF written to `C:\Users\Leidos\OneDrive\Desktop` outside the repo. No `src/`, `worker/`, `scripts/` or `supabase/` file changed
- [x] Roles affected identified — none; no code, policy, grant or schema changed. The review *describes* what a signed-out visitor sees and changes none of it
- [x] Anything explicitly **out of scope** written down — production and `test.lannacare.org` were not opened (the brief's rule); a real phone, a screen reader and a native Thai reader were not used (report §1 says so); the signed-in header and card-page states were not reviewed; the review raises no backlog items and ticks none; the walkthrough of the summary with Lutan is the step after this PR

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` already up to date at `4b868b84` when run on 2026-10-13; nothing merged
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Paste its closing `gates:` lines below exactly as printed — the first run ended `lint=1`: `check-backlog-sections` refused an open backlog item sitting below `## Completed`, put there by the backlog branch on 2026-10-13 and merged into `main` at `4b868b84` (main's own CI was red for the same reason). The line was moved up into its section, text unchanged, in its own commit on this branch, and the gates were run again:

```
=== gates: typecheck exited 0 after 8s
=== gates: lint exited 0 after 77s
=== gates: test exited 0 after 3s
=== gates: build exited 0 after 37s
gates: typecheck=0 lint=0 test=0 build=0
```
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly after the change — n/a: no migration; nothing was written to the database
- [ ] **Constraints and defaults exercised against real rows** — n/a: no migration
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager — n/a: no migration

## 4. Functional checks

The review's own coverage is the record this section exists for, so it is listed here even though
the change has no UI of its own. Every page below was loaded, screenshotted and measured by the
review's script at **375 × 812 (touch, 2×)** and **1280 × 800**, in **English and in Thai**
(language cookie), signed out, on `http://localhost:3001` reading the dev database; the pages
marked ✓ were also read by eye in the desktop app's browser pane:

`/` ✓ · phone menu open ✓ · laptop header groups open ✓ · `/adopt` ✓ · `/adopt?species=Dog&ready=1` ·
`/adopt/<Panda>` ✓ · `/adopt/<Markey>` · `/adopt/international` ✓ · `/our-work` ✓ · `/our-work/<id>` ✓ ·
`/friends` ✓ · `/friends/join` · `/donate` ✓ · `/foster` · `/volunteer` · `/privacy` · `/r/R-0014` ·
`/r/R-0395` ✓ · `/e/<id>` ✓ · `/adopt/0000…` (not found) ✓

- [ ] Happy path works end to end — n/a: review only, no code changed; the pages and widths looked at are the list above
- [ ] Data persists — n/a: review only; nothing was written
- [ ] Create / edit / delete all exercised — n/a: review only; no form was submitted
- [ ] Empty state renders sensibly — n/a: no UI of its own; the report's §3.4 records how the public pages' empty states read
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no UI input
- [ ] Boundary cases checked — n/a: no UI; the report's §3.1 records the not-found case of the public pages

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | unchanged | unchanged | n/a — no policy, grant or code changed |
| management | unchanged | unchanged | n/a — as above |
| staff | unchanged | unchanged | n/a — as above |
| doctor | unchanged | unchanged | n/a — as above |
| volunteer | unchanged | unchanged | n/a — as above |
| signed out | every public page, as reviewed | unchanged | n/a — the review read what a signed-out visitor sees and changed none of it |

- [ ] Every role above tested — n/a: nothing changed for any role
- [ ] A role that should not have access is blocked server-side — n/a: no access rule changed

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no nav entry; nothing in `src/` changed
- [ ] Manual updated (`src/lib/manual/en.ts`) — n/a: a review document is not a staff feature
- [ ] Translatable strings go through the translation path — n/a: no strings added; the report's §5.1 records which public texts are still English in Thai mode
- [x] Mobile viewport (375px) — no overflow, controls reachable — measured by the review on every public page at 375 px: 0 px of sideways overflow on all 20 pages in both languages (report §2); the document itself has no viewport
- [x] Browser console clean — no errors or React warnings — on every public page loaded by the review, the only console output was Next's own image-sizing notices and one LCP hint (recorded in the review's run; none is an error); the document itself has no console
- [x] Network clean — no unexpected 4xx/5xx on the feature's pages — no 4xx or 5xx on any of the 72 page loads (the review's run recorded failed requests per page: none)

## 6. Regression

- [ ] The pages nearest the change still work (list the ones checked) — n/a: documents only; no page reads these files
- [ ] Any shared file touched checked from a second, unrelated page — n/a: no shared file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing was merged (already up to date)

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** — n/a: the item's "done when" is the report on `main` *and* Lutan walked through the summary, and the brief says to tick nothing; a status note naming the report was added to the item's line on this branch instead
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `docs/decisions/2026-10-13-public-site-fable-review.md`
- [x] `README.md` still accurate — unchanged; it does not describe reviews
- [ ] **Release notes.** — n/a: a review document that no shelter user sees; nothing under `src/`, `worker/` or the manual changed
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** — every number in the report (pixel positions, target sizes, status codes, page heights, contrast ratios, tag presence) came from the review's headless run and the page's own links, not from reading the code; the decision file says which was which

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager; nothing visible changes, so the smoke test is the ordinary one
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: no code changed
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary** — n/a: no threshold or cutoff changed
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited.** — deferred: release manager, for the deploy output; the gates lines in §2 are copied from the terminal as printed
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — n/a: the public site is untouched by this PR

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: none added

### Migration ordering — *skip if no migration*

- [x] **Does this PR contain both a migration and code that reads it?** — no: it contains neither
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — n/a: no migration
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — n/a: no migration
- [ ] Apply plan stated — n/a: nothing to apply

### Rollback

- [x] Rollback position stated, **including what it does not cover** — documents only: reverting the merge commit removes the report, the screenshots, the decision file and the backlog note; there is nothing in the database or the Worker to roll back, and the PDF on the Desktop is outside the repo

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| — | — | none: the review changes no behaviour; what it found about the public pages is in the report as 22 proposed backlog items, none raised here | accepted — Lutan picks after the walkthrough |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Walk through the five-minute summary with Lutan: does it read in plain English, and which of the 22 suggestions become backlog items | `docs/public-site-review-2026-10-13.md`, top section, in chat; the PDF on the Desktop is the same text |
| 2 | On a real phone on `test.lannacare.org` (signed in, since the site is locked): an animal's "Share" opens the phone's share sheet, and "Ask on LINE" opens LINE with the message started — the review read the links, it did not tap them | `/adopt/<any animal>` on a phone |
| 3 | A Thai reader skims the Thai home page and menu once for wording — the review judged the Thai as a non-native reader | `/` in Thai, on a phone |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed — the review's headless run over 20 pages × 2 widths × 2 languages (outcomes in the report), the sync, the gates, `node scripts/check-test-plan.mjs` on this plan
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (Fable 5.1)  Date: 2026-10-13

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: the list is not empty; item 1 is the walkthrough and waits for Lutan, items 2 and 3 for a person with a phone

Manual verification by: pending: the walkthrough of the summary with Lutan, and the two phone checks in the table above

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: not yet — pasted when the PR is opened and ticked in the same follow-up commit as the CI line
- [ ] Handed to the production release manager — n/a: documents only; nothing to deploy or smoke-test beyond the ordinary pass

Result: pass

Release manager acknowledgement: n/a: documents only; no deploy step for the release manager to acknowledge
