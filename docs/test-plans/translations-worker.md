# Feature test plan

Filled from `docs/test-plan-template.md`. Every line is ticked (run and passed)
or `n/a` with the reason.

---

## Header

| | |
|---|---|
| Feature | Machine-drafted translations: a cron on the Worker fills pending `translations` rows with a `draft` for managers to check |
| Backlog item | `docs/backlog.md` → Management: Machine-drafted translations (phase 2). Left open, with a status line |
| Branch / worktree | `claude/translations-worker` @ `C:\Development\Animal_Shelter_translations-worker` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3016` (not used: Worker logic, checked by script) |
| PR | linked from the PR itself |
| Tested by / date | Claude (translations-worker session), 2026-10-04 |
| Carries a migration? | no (0134 left unclaimed for `perm-convert-medical`) |
| Tested at SHA | see the PR head (code last changed at 48c4e90a) |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: the Worker's 15-minute cron also takes a few `pending` translations, has an engine write the other language, and saves it as `draft` only. The item's second half (machine-tier fields and triggers, the model bake-off) is explicitly not in this PR
- [x] Files/areas touched listed: `worker/translations.mjs`, `worker/translate-engines.mjs`, `worker/index.mjs` (`scheduled`), `wrangler.jsonc` (`ai` binding and vars on test and production), `src/components/TranslationPanel.tsx` and both dictionaries (one line each), `scripts/check-translate-worker.mjs`, `src/lib/releases.ts`, `docs/`, `README.md`. No migration, no route changes. The guard on `/management/translations` is not touched (the page file is unchanged), so there is nothing for `permissions-sweep-rest` to collide with
- [x] Roles affected identified: management (sees machine drafts, labelled, in the queue); every other role is shown no machine draft in the panel
- [x] Out of scope written down: `machine`-tier fields and triggers (a migration), the twenty-bio / twenty-vet-note model comparison, translating `stale` rows (only `pending` is polled), a daily cap for the `machine` tier (no one reviews it)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly ("Already up to date")
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Closing lines as printed:

```
=== gates: build exited 0 after 243s

gates: typecheck=0 lint=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `apply-migrations.mjs --status` reviewed — n/a: no migration
- [ ] `apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration
- [ ] Constraints and defaults exercised against real rows — n/a: no migration (the worker writes only values `0056`'s `translations_text_matches_status` already allows: `draft` with text, `pending` with null text)
- [ ] Down-migration written — n/a: no migration
- [ ] Production apply plan stated — n/a: no migration

## 4. Functional checks

`node scripts/check-translate-worker.mjs` drives the real exported `runTranslations`, `checkOutput`, `cleanOutput` and `pickEngine` against an in-memory stand-in for Supabase REST and a stub AI binding. It exits 0 with "all checks passed".

- [x] Happy path works end to end: a pending row becomes `draft` with text and engine `workers-ai:<model>`; nothing it writes is `approved`; the reviewed-tier prompt asks for natural Thai and the machine-tier prompt for literal output keeping doses
- [ ] Data persists — n/a: not run against the live dev database; the stand-in is in memory. The real PostgREST filter syntax (`status=eq.pending&updated_at=eq.…`, `engine=neq.human`) is the one unverified seam; see Left for manual verification
- [x] Create / edit / delete: a person approving, or staff editing the source, while the model works leaves the row untouched (two cases); the manager's text and `engine = 'human'` survive
- [x] Empty state: no AI binding, no service key or an unreachable database each do nothing and do not throw (so the status alerts on the same cron still run)
- [x] Invalid input is rejected with a readable reason, not a crash: English handed back for Thai, Thai for English, the source unchanged, empty output, and a clinical note that lost a dose (whole-number match: "2" is not satisfied by the "2" in "12") are all refused and counted as a failure
- [x] Boundary cases: failure handling at attempts 1, 2 and 3 (30 min and 3 h back-off, then left alone a day later); an edit to the source resets the count; an engine error stops the run after one row; `TRANSLATE_BATCH` default (2) and override (10); the reviewed-tier daily cap of 3 with 2 already handed over lets exactly one more through while the machine tier is unaffected; drafts older than 24 h stop counting; Ollama and M2M100 drive the same cron with no other change

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a | the worker acts as the service role, not as a user | n/a |
| management | Translations queue, panel | sees a machine draft with the "written by a machine" note and approves it as before | not driven in a browser: see Left for manual verification |
| staff | panel on a record | shown no machine draft (`isMachineDraft` hides it when not `canManage`) | not driven in a browser |
| vet | as staff | as staff | not driven in a browser |
| volunteer | as staff | as staff | not driven in a browser |
| signed out | public pages | only `approved` translations are exposed by the public views, unchanged by this PR | n/a: no change to the views |

- [ ] Every role above tested — n/a: no browser pass this PR, only the worker and one panel condition; the table above says what was and was not driven
- [x] A role that should not have access is blocked server-side: the worker can only ever write `status = 'draft'` (a literal in `saveDraft`, asserted by the check), so a bug here cannot publish text; the public views read `approved` only (0056)

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI route
- [ ] Manual updated — n/a: no manual topic describes drafts yet; it belongs with the machine tier, when staff first see machine text under an original
- [x] Translatable strings go through the translation path: the one new panel string `translations.machineDraft` is in `en.ts` and `th.ts` (the Thai is Claude's and unreviewed; see Left for manual verification)
- [ ] Mobile viewport (375px) — n/a: one extra line of muted text in an existing panel; not rendered
- [ ] Browser console clean — n/a: not rendered
- [ ] Network clean — n/a: not rendered

## 6. Regression

- [x] The pages nearest the change still work: `next build` compiles and prerenders the whole app including `/management/translations` (gates build=0); the existing `scheduled` status-alert path is unchanged in behaviour (moved into `runStatusAlerts`, wrapped so a failure there cannot stop translations, and translations cannot throw into it)
- [x] Any shared file touched (`en.ts`, `th.ts`, `TranslationPanel.tsx`, `wrangler.jsonc`, `worker/index.mjs`) checked from a second, unrelated page — the build loads every route; `wrangler.jsonc` still parses (the build and the deploy tooling read it)
- [x] Nothing merged from `main` during `sync` was broken by this branch: nothing was merged

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` — n/a: deliberately left open, with a status line saying the worker is in and what remains (the Cloudflare steps, the bake-off, the machine-tier schema PR)
- [x] Non-obvious design choices added as a new file in `docs/decisions/`: `2026-10-04-translations-worker.md` (engine seam, failure memory in `engine`, batch size and daily cap, why the existing Worker)
- [x] `README.md` still accurate: the Worker file list gained the two new files and the check script
- [x] **Release notes.** `unreleased` gained a line for Management → Translations, written to say drafts begin only once the translation service is switched on, at about twenty a day
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** The behaviours claimed (back-off timings, cap arithmetic, race guards, "2" vs "12") are each an assertion in the check script. Not measured: the Workers AI free allowance and the model's Thai quality, which the decision says are not established here

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: Lutan, with the console steps below
- [ ] Smoke-tested on `test.lannacare.org` — deferred: Lutan; see the first Left for manual verification row
- [ ] Timezone-sensitive behaviour proved — n/a: the only clock use is relative (a rolling 24 h window and minutes of back-off), injected as `now` in the check, with no calendar-day boundary
- [ ] Boundary or banding change — n/a: not a band change; the back-off and cap boundaries are asserted on both sides (attempt 1 at 10 min and 31 min, attempt 2 at 60 min and 181 min; cap with 2 of 3 used; a draft at 25 h)
- [x] Evidence pasted into this plan is the tool's actual output, unedited (gates lines above)
- [ ] Public pages re-checked after a cache purge — n/a: no public page changes; drafts are not shown publicly

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref matches production — deferred: release manager
- [ ] `strip-baked-env` line seen — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — deferred: Lutan. No new secret: `SUPABASE_SERVICE_ROLE_KEY` is already pushed by `deploy.mjs --secrets`. The new values (`SUPABASE_URL`, `TRANSLATE_BATCH`, `TRANSLATE_REVIEWED_DAILY`, the `AI` binding) are in `wrangler.jsonc` and travel with the deploy

### Migration ordering — *skip if no migration*

- [ ] Both a migration and code that reads it? — n/a: no migration
- [ ] `--env production --dry-run` — n/a: no migration
- [ ] Production backup — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position stated: the worker only adds `draft` rows. To stop it without a deploy, remove the `AI` binding in the Cloudflare dashboard; to undo, `npx wrangler rollback --env <env>` (production is served by the Pi, so this reverts only the Worker, which is where this runs). Drafts already written stay as drafts (a manager can Remove translation); nothing was published, so there is nothing to retract. No migration, so nothing to revert

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | First run of the check script failed five cases: the injected clock was ignored when stamping `updated_at`, the Ollama engine ignored the injected `fetch`, and the number check matched "2" inside "12" | fixed before the first commit; the script now passes |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Console steps, in order. (a) Cloudflare dashboard → Workers AI: confirm it is available on the account (the free daily allowance is the constraint; accept the model licence if it asks). (b) `npm run deploy:test`: wrangler creates the `AI` binding from `wrangler.jsonc`, so no binding is made by hand; `SUPABASE_SERVICE_ROLE_KEY` should already be a secret on `lanna-animal-care-test` (if not, `node scripts/deploy.mjs --env test --secrets`). (c) Dashboard → `lanna-animal-care-test` → Logs: within 15 minutes a `translations: drafted N, failed M, skipped K` line; `not running: …` names what is missing. (d) Management → Translations on test.lannacare.org: a row has Thai text, the Draft chip and the "written by a machine" note. (e) Only then `npm run deploy:prod` (same binding, secret already there; it drafts against the production database) | Cloudflare dashboard; test.lannacare.org |
| 2 | The PostgREST filters and the model's real response shape have only been run against a stand-in. On test, after step 1(c): a draft really landed (not zero rows from a filter that never matches) and `translations.engine` reads like `workers-ai:@cf/meta/llama-3.3-70b-instruct-fp8-fast`. If that model id is not in the account's catalogue the log shows the error and the row backs off; set `TRANSLATE_MODEL` to one that is | Worker logs on test; Supabase `translations` |
| 3 | Whether the Thai reads well, and which model. Code checks only that there is text, in Thai script, with numbers intact. A Thai speaker must read real drafts. The item's bake-off still stands: twenty real bios and twenty real vet notes through two models (`TRANSLATE_ENGINE` / `TRANSLATE_MODEL` per environment; M2M100 is `workers-ai-m2m100`), and the two bilingual managers choose | The two bilingual managers |
| 4 | The Thai wording of the new panel note is Claude's, and the panel itself was not rendered this PR. Look at one draft on a phone in Thai | Management → Translations, Thai, 375 px |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (translations-worker session)  Date: 2026-10-04

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: four rows are open, so this is not ticked

Manual verification by: pending: the Cloudflare console steps and a first look at real drafts (rows 1–4 above)

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet — the PR is not open

Result: pass

Release manager acknowledgement: pending
