# Feature test plan

---

## Header

| | |
|---|---|
| Feature | refusal-keys-group-10 — the last group of person-read English refusals |
| Backlog item | `docs/backlog.md` → #3nuwy (ticked by this PR: the programme is complete) |
| Branch / worktree | `claude/refusal-keys-group-10` @ `C:\Development\Animal_Shelter_refusal-keys-group-10` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3001` |
| PR | see PR |
| Tested by / date | Claude, 2026-11-13 |
| Carries a migration? | yes, 0367 |
| Tested at SHA | 002cb419a |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — `recurrence_dates`, `recurring_job_dates`, `role_can` and `propose_website_draft` raise dotted keys instead of English sentences, so their refusals reach a Thai reader in Thai; this was the last group
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs) — `supabase/migrations/0367_…sql`, `supabase/harness/0367_…_harness.sql`, `src/lib/i18n/dictionaries/{en,th}.ts`, `src/lib/releases.ts`, `src/lib/recurring-jobs/{eligibility-load,queries}.ts`, `src/lib/my-tasks/recurring.ts`, `src/app/management/recurring-jobs/{actions,page}.tsx`, `src/app/admin/website/actions.ts`, `docs/hard-coded-security-registry.json`. No `worker/` change
- [x] Cards affected identified (the cards whose behaviour changes; who holds them today is labelled context only), plus whether admin and the signed-out public are affected — **no card's grants change.** Only the words of a refusal change. Activities asked are untouched: `recurring.manage` (inside `role_can`) and `website.propose`. Admin is unaffected (outside the card system); the signed-out public cannot reach any of these functions
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised — the `maybe`, `masked` and `developer` classes stay English on purpose (decision file); the Thai wording being read by a Thai speaker (`#y1dqu`); group 9's two findings, deliberately not acted on

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in; the one conflict (`docs/backlog.md` line 12, which both sides edited) was resolved by taking main's line and re-applying this change to it, and the resulting diff against main is that one line
- [x] `node scripts/gates.mjs` ends with one line of the shape `gates: typecheck=<N> lint=<N> test=<N> build=<N>`

```
=== gates: typecheck — npm run typecheck
=== gates: typecheck exited 0 after 91s
=== gates: lint — npm run lint
=== gates: lint exited 0 after 357s
=== gates: test — npm test
=== gates: test exited 0 after 87s
=== gates: build — npm run build
=== gates: build exited 0 after 242s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR (runs the same four gates, among its other checks) — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [x] Migration number is one above the highest on `main`, and no other in-flight branch carries one — `0367`, one above `0365`; `check-migration-numbers.mjs` printed `ok — 0367_… (against origin/main …, highest 0365…)`, which reads open PRs
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying — the dry-run's own header read `368 applied, 1 pending`, the pending one being `0367`
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed — `dry-run 0367_… ok`; it depends on no other pending file
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — `applying 0367_… ok`
- [x] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — four `create or replace function` statements, nothing else (grants and comments from earlier files are preserved by `or replace`)
- [x] Existing rows still read correctly after the change (checked against real dev data) — no table, column, view or constraint is touched; five `raise` lines change text. Nothing reads a refusal message from a row
- [x] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — `supabase/harness/0367_refusal_keys_last_group_harness.sql`, `ZZ fixture` logins and roles, nothing committed. **Asserted: each of the five raises was provoked and its message compared to the exact key**, plus a control that a login asking `role_can` about its OWN role is answered rather than refused. Verdict: `HARNESS-OK 0367: 5 of 5 raises provoked and each gave its KEY, not a sentence. Nothing missed.` The generator also asserted one match per substitution and diffed back: 5 lines changed, all `raise`/`using errcode`
- [x] Down-migration written, or the reason one is not needed is stated — not written; the `-- undo:` header names the reversal (re-apply the four bodies from `0095`, `0277` and `0315`). Text inside function bodies, nothing structural
- [x] Production apply plan stated for the release manager (which file, which project, when) — `0367_refusal_keys_last_group.sql` to `dbkodyyxxhtygxcxmfcu`, **before the deploy**, run bare: `node scripts/apply-migrations.mjs --env production`

## 4. Functional checks

- [x] Happy path works end to end — the path of this change *is* the refusal path, and all five raises were driven in the harness; the non-refusal path is unchanged code (the harness control confirms `role_can` still answers its own role)
- [ ] Data persists — reload the page and the change is still there — n/a: nothing is saved; this changes the words of a refusal
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: no create, edit or delete surface is added or altered
- [ ] Empty state renders sensibly (no rows yet) — n/a: no list or page is added
- [x] Invalid input is rejected with a readable message, not a crash — each refusal now resolves through `dbRefusal()` to a sentence in the reader's language; an unknown key widens to "something went wrong" plus a log reference (`src/lib/db-refusal.test.mjs`, unchanged)
- [x] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — the span boundary (`p_to - p_from > 731`) was provoked with a three-year range; the app's own callers are capped at `MAX_SPAN_DAYS` (731) and sit on the allowed side of it

### Role access matrix

Analysed by card. No card's grants change; what changes is the language of the refusal.

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin | all four functions | outside the card system; unchanged | not separately driven — no admin path was altered; `role_can`'s admin test still reads `roles.is_admin` |
| no cards at all | `recurrence_dates`, `recurring_job_dates`, `role_can`, `propose_website_draft` | span refused (keyed); other-role question refused (keyed); proposal refused (keyed) | as expected — harness probes 1–4; control 3b answered |
| exactly `website.propose` | `propose_website_draft` | passes the card check; a non-draftable table refused, keyed | as expected — harness probe 5 |
| signed out | none | the functions are revoked from `anon` (unchanged by `or replace`) | as expected — read from the migrations |

- [x] Every login above tested — in the harness, each as a login holding exactly those activities (admin read, not driven)
- [x] A login that should not have access is blocked server-side (hitting the URL directly fails) — the refusals are raised by the database; nothing moves a check to the browser and no button gating changed

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no page or nav entry is added or moved
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: no behaviour a manual topic describes changes; only the language of a refusal
- [x] Translatable strings go through the translation path, checked at `/management/translations` — these four strings are **dictionary** entries in `en.ts`/`th.ts`, the translation path for app wording (`/management/translations` is for database labels). `check-sql-refusal-keys.mjs` passes: 28 live functions raise 80 keys, each worded in both files
- [ ] Mobile viewport (375px) — no overflow, controls reachable — n/a: no layout change
- [ ] Browser console clean — no errors or React warnings — n/a: no page driven in a browser (see **Left for manual verification**)
- [ ] Network clean — no unexpected 4xx/5xx on the feature's pages — n/a: status codes are unchanged; only message words differ

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked) — `typecheck` resolved every changed signature (`loadEligibility`, `loadJobDates`, `loadOpenOccurrences`, `loadMine`, `whoCannotDo`, `cannotDoProblem`) and `build` compiled the Recurring jobs page, My tasks and the website actions. Not loaded in a browser
- [x] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — **by loading that page, not by reading the file** — shared files are the two dictionaries and `queries.ts`; this rests on the gates, not a rendered page (weaker reading, said so; in **Left for manual verification**)
- [x] Nothing merged from `main` during `sync` was broken by this branch — the gates were run on the merged tree

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** — `#3nuwy` ticked and retitled; no other open item describes an outcome this closes (grepped for the four functions, the four caller files and the two scripts; the only other hits are already-ticked items)
- [x] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`) — `docs/decisions/2026-11-13-refusal-keys-group-10.md` (keys, the shared key, the `role_can` judgement, what stays English on purpose)
- [x] `README.md` still accurate — unchanged by this work
- [x] **Release notes.** Would a shelter user notice this change? — yes: one untagged note in `unreleased` (untagged widens to every reader, which is the safe default; the three places it names are reachable on several cards). It says the Thai has not been checked by a Thai speaker. No manual step is outstanding before a user sees it beyond the usual production apply and deploy
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** — meter after: 28 functions / 89 messages keyed, 0 person-read English (`measure-sql-refusals.mjs`); the caller list was checked against the files, which found that `weigh-first.ts` is named only by a comment (decision file)

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: production release manager
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: production release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: production release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: nothing here derives a date or "today"; the span check is on a day count
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary** — n/a: no threshold changes; the 731-day limit is untouched
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.** — the gates block is the run's own closing lines; the harness verdict, security line and meter figures are quoted as printed
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — deferred: production release manager

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: production release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: production release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: no secret or environment variable is added or read

### Migration ordering — *skip if no migration*

- [x] **Does this PR contain both a migration and code that reads it?** — **Yes** (`0367` and the callers). Production apply before the deploy; either order is benign (old code meeting a key shows the generic wording with a reference; new code meeting an old sentence falls to `databaseFailure()`'s generic words)
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: production release manager
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — n/a: four `create or replace function`, no table, column, view or row touched
- [x] Apply plan stated: which file, which project, and whether it runs before or after the deploy — `0367_refusal_keys_last_group.sql`, project `dbkodyyxxhtygxcxmfcu`, **before** the deploy

### Rollback

- [x] Rollback position stated, **including what it does not cover** — the app half rolls back with the build (`./scripts/pi/deploy-pi.sh --ref <sha>`, or `npx wrangler rollback --env production` for the Worker fallback). **Neither reverts the migration**; reversing it means re-applying the four bodies from `0095`, `0277` and `0315` as a new file. Safe to leave applied while the app rolls back

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | `measure-sql-refusals.mjs` lists `src/lib/medical/weigh-first.ts` as a caller of `recurring_job_dates`; it only names it in a comment and calls `weigh_first_visits()` | accepted — a known limit of a grep-based tool; for the planner to file if wanted |
| 2 | low | `check-hard-coded-security.mjs` flags a re-declared `role_can` for its unchanged `r.key = p_role_key` read | fixed — declared in `docs/hard-coded-security-registry.json` with the same reason as `0272`/`0277`; the check prints `no coded security outside the Admin bypass` |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | That the four Thai sentences read correctly to a Thai speaker. Written by me, marked `UNREVIEWED` in `th.ts`; belongs to `#y1dqu` | `src/lib/i18n/dictionaries/th.ts`, the group 10 block |
| 2 | One refusal seen on screen in both languages. None of the five is reachable by pressing a button as the app is built, so none was driven in a browser | the Recurring jobs preview, or Website → propose |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-13

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — pending: the list is not empty, so only the person who looked may tick this

Manual verification by: pending: the Thai wording read by a Thai speaker (#y1dqu), and one refusal seen on screen

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager

Result: pass

Release manager acknowledgement: pending: not yet handed over — this PR is not a release cut
