# Feature test plan

## Header

| | |
|---|---|
| Feature | UTC "today" data audit — a report on which stored dates may be a day early, plus the read-only script that produced it. No data changed, no `src/` changed. |
| Backlog item | `docs/backlog.md` → **"'Today' is UTC everywhere, so it is yesterday in Thailand until 07:00."** — the *data* half (piece 2). The item stays unticked; `claude/utc-today` owns the code half. |
| Branch / worktree | `claude/utc-date-audit` @ `C:\Development\Animal_Shelter_utc-date-audit` |
| Dev server | not started — no runtime surface to look at |
| PR | see the PR this file is committed to |
| Tested by / date | Claude Opus 5 / 2026-09-23 |
| Carries a migration? | no |
| Tested at SHA | recorded in the PR; the branch tip at the time of the run |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — the item says "audit what is actually affected … before deciding whether to correct anything"; this audits and recommends, and corrects nothing
- [x] Files/areas touched listed: `docs/utc-date-audit-2026-09-23.md` (new), `docs/test-plans/utc-date-audit.md` (this file), `scripts/throwaway-utc-date-audit.mjs` (new, read-only, disposable), `docs/decisions.md` (appended). No `src/`, no `worker/`, no `supabase/migrations/`
- [x] Roles affected identified: none. Nothing added reads a request, renders a page or runs in the deployed Worker; the script is run by hand from a developer machine with a Supabase personal access token
- [x] Anything explicitly **out of scope** written down — in the document's §1 and §5: the code fix (`claude/utc-today`'s), the SQL-side fixes it does not reach (§3.2, needs a migration by whoever owns the code half), and the production run, which this session's permissions refused

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `npm run typecheck` — clean
- [x] `npm run lint` — clean
- [x] `npm run build` — succeeds
- [ ] CI green on the PR (runs the same three) — n/a: the PR does not exist at this commit. Ticked in a follow-up commit once the run is actually green, not before

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration. The document *proposes* one (`maintenance.date_created` default) but deliberately does not write it; it belongs to the code half as its own schema PR
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: nothing to apply
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: nothing to apply
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: nothing to apply
- [ ] File is re-runnable — n/a: no migration file
- [ ] Existing rows still read correctly after the change — n/a: no rows were written. Every statement this branch ran was a `select`, and the script enforces that (`read_only` on the API call plus a `select`/`with` guard); dev row counts are unchanged
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager — n/a: no migration. The production *read* that is still owed is in the document's §5 and in the handover table below

## 4. Functional checks

- [x] Happy path works end to end — `node scripts/throwaway-utc-date-audit.mjs --rows` ran against dev and produced the figures in §4 of the document; the summary table and the worked examples were copied from its output, not written by hand
- [ ] Data persists — reload the page and the change is still there — n/a: no page, and nothing is written to persist
- [ ] Create / edit / delete all exercised — n/a: the script only reads
- [x] Empty state renders sensibly (no rows yet) — the `maintenance`, `group_origins` and `project_folders` targets have no qualifying rows on dev and report `0 of 0` rather than erroring or dividing by zero; those zeros are marked in the document as "table empty"/"no dates set" so they are not read as clean
- [x] Invalid input is rejected with a readable message, not a crash — a non-`select` passed to `--sql` is refused by the script's own guard before any request is made; a failing target is caught per-table, reported as `FAILED — <message>` and recorded in the output rather than aborting the run
- [x] Boundary cases checked — the detector's boundary is the 07:00 Bangkok cutoff, and it is exclusive (`< time '07:00'`); rows one day early but written *outside* the window are counted separately (`day_early_outside`) rather than silently dropped, and `null` dates and `null` stamps are excluded from `examined` so they cannot inflate the denominator

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | nothing new | — | n/a |
| staff | nothing new | — | n/a |
| vet | nothing new | — | n/a |
| volunteer | nothing new | — | n/a |
| resident | nothing new | — | n/a |
| signed out | nothing new | — | n/a |

- [ ] Every role above tested — n/a: the change adds no route, no component and no database object. There is nothing for any role to reach
- [ ] A role that should not have access is blocked server-side — n/a: as above. The script authenticates with a personal access token from `.env.local` and is never deployed

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no UI
- [ ] Manual updated (`src/lib/manual/en.ts`) — n/a: no user-facing behaviour. The document is for the developer and the shelter manager, not a feature anyone operates
- [ ] Translatable strings go through the translation path — n/a: no user-facing strings
- [ ] Mobile viewport (375px) — n/a: no UI
- [ ] Browser console clean — n/a: nothing runs in a browser
- [ ] Network clean — no unexpected 4xx/5xx — n/a: no app requests. The script's own calls to the Supabase Management API all returned 200 on dev; the three production attempts were refused by this session's permission classifier before any request left the machine (document §5)

## 6. Regression

- [x] The pages nearest the change still work — there is no page near the change, so this was checked structurally instead of by clicking: `git diff --stat` against `origin/main` shows no file under `src/` or `worker/`, and `npm run build` compiles every route successfully
- [x] Any shared file touched checked from a second, unrelated page — the only shared file is `docs/decisions.md`, appended to (it merges by union per `CLAUDE.md`); `docs/backlog.md` is deliberately **not** touched, since the item's tick belongs to the code half
- [x] Nothing merged from `main` during `sync` was broken by this branch — `sync` brought `origin/main` in cleanly and the three gates passed afterwards

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** — n/a: deliberately not ticked. This is one of the item's two halves; ticking it would mark the code fix done when it is not. Stated in the brief and repeated in the PR description
- [x] Non-obvious design choices appended to `docs/decisions.md`, dated — the candidate definition and, more importantly, why a candidate is not an error and why no bulk correction was run
- [x] `README.md` still accurate — it names individual scripts where it explains a workflow (`apply-migrations`, `deploy`, `backup`, `worktree`) rather than carrying a list of `scripts/`, so a deliberately disposable audit script needs no entry. Nothing else in it is affected
- [x] Commit messages say why, not just what

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — n/a: nothing to deploy. This change cannot reach a build; `docs/` and `scripts/` are not bundled
- [ ] Deployed SHA matches the tested SHA — n/a: no deploy

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — n/a: no deployable change
- [ ] Smoke-tested on `test.lannacare.org` — n/a: no deployable change
- [ ] **Timezone-sensitive behaviour checked on test, not locally** — n/a: no deploy, and no timezone-sensitive *behaviour* is added. Worth being exact about why, since this branch is all about timezones. Its findings about timezone behaviour are not from observing the app at all — they are from reading source and migrations, and from SQL that does its own timezone arithmetic explicitly (`at time zone 'Asia/Bangkok'`) against `timestamptz` columns, which are absolute instants. Nothing here depends on the clock of the machine that ran it, so no local observation is being relied on
- [ ] Public pages re-checked after a cache purge — n/a: no public page changed. The document does flag that `public_shelter_stats.in_treatment` is wrong for seven hours a day (§3.2), but fixing it is the code half's

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — n/a: no deploy
- [ ] `strip-baked-env` seen in the deploy output — n/a: no deploy
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: no new env var. The script reads `SUPABASE_ACCESS_TOKEN`, which already exists for `apply-migrations.mjs`

### Migration ordering — *skip if no migration*

- [ ] Does this PR contain both a migration and code that reads it? — n/a: neither
- [ ] `apply-migrations.mjs --env production --dry-run` run and clean — n/a: no migration
- [ ] Production backup fresh, for a destructive migration — n/a: no migration, and nothing was written anywhere
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position stated, including what it does not cover — reverting the merge commit removes both documents and the script and leaves nothing behind, because nothing was applied, deployed or written. This is the rare case where "fully reversible" is literally true

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | high | A `Deceased` placement closes every open prescription with `new.start_date::date`, cast in the database's UTC session (`0049_undo_deceased.sql:118`), so a death recorded before 07:00 Bangkok end-dates the course the day *before* the animal died. Found by reading the trigger; 0 instances on dev (the 6 deceased residents there were imported with end dates already set) | deferred — belongs to `claude/utc-today` / a schema PR; flagged to that stream. Document §3.3 |
| 2 | high | "End today" on a prescription or diet matches no row when the course started today in Bangkok (`.lte("start_date", today)` with a UTC `today`), so it fails with the generic `saveFailed` for seven hours a day; and when it does match, it ends the course a day early | deferred — same owner. Document §3.4 |
| 3 | medium | Six `current_date` sites inside SQL (a column default, a trigger, a seed, and three views incl. the public `in_treatment` figure) that a `todayIso()` helper in `src/lib/format.ts` cannot reach. Currently nobody's | deferred — needs a migration; raised so the code half's PR does not close the item while these remain. Document §3.2 |
| 4 | medium | The production half of this audit was not run — all three routes to production were refused by this session's permission classifier | accepted and documented — the document leads with it, §5 gives the exact command and where to run it, and the PR says the audit is incomplete |
| 5 | low | `prescriptions` and `resident_diets` have no `updated_at`, so wrong `end_date` values are permanently undetectable from the data | deferred to backlog — document §7.1 |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| — | nothing | — |

The change is a document and a read-only script. Every figure in the document
was produced by running the script against dev and copied from its output;
every code and migration citation was opened and read at the cited line. There
is no screen, no deployed behaviour and no stored change for a person to look
at, so this list is empty rather than padded.

The production run owed in §5 is **not** listed here. It is the next step of the
work the document describes, not verification of the document — and treating it
as a sign-off item would let a signature stand in for a number nobody has yet.

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude Opus 5  Date: 2026-09-23

### Manual verification

- [x] Every item in the manual list was checked by a person, or the list is empty

Manual verification by: n/a: the change is a document and a read-only script — no UI, no deployed behaviour and no data change for a person to look at  Date: n/a

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [ ] Handed to the production release manager — n/a: nothing here deploys. `docs/` and `scripts/` are not bundled, so there is no build for a release manager to gate

Result: pass with accepted defects
