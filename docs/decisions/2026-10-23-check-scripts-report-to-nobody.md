# Check scripts that report to nobody (2026-10-23)

Backlog item `check-scripts-report-to-nobody`. Two halves: the red `check-medical-role.mjs`, and the
general gap it exposed.

## Half one: the three recorded failures were five, and none was an app fault

Re-run 2026-10-23 against dev, after 0249 and #872: five failures, not three. All five were the harness
or its data, and the app was right.

| Failure | Which of the three things | The line that decides it |
|---|---|---|
| `residents` and `resident_list_view` as the Head of Medical return a row | Deliberate change nobody told the script about | 0249: a role reads the record when it "holds a live role whose scope_residents is 'who_and_where' AND whose own permission cells include an EDIT of a medical.* activity". She holds `medical.weight` at level 2. |
| `resident_who_and_where` as admin and as management returns a row | Stale harness, older than 0249 | 0192: "the filter becomes 'floor role, or a role that reads every resident'". |
| `photos.shelter_add` at level 2 in `role_permissions`, absent from `jobs.ts` | Stale harness | Her `role_cards` on dev hold five cards; the fifth is `add_photos` (Add Shelter Photos), whose bundle in `cards.ts` is `photos.shelter_add`. Card in, power out. No migration grants it. |

The fix for the third is the one that matters. The check compared her powers to a **hard-coded list**
(`jobs.ts`'s four jobs plus the Director's draft). A power comes from a card, so that list was wrong the
moment anyone ticked a fifth card on the roles screen. It now reads the cards she holds from `role_cards`,
expands them with `cards.ts`, and still requires an exact match, so a power with no card fails it.

**Rule (Lutan, 2026-10-23): hard-coding is forbidden for activity-based controls.** `cards.ts` is the one place that
says what a card grants. A check, screen or test that names its own list of activities for a role is the same
fault. Not enforced by a script yet; filed on the backlog.

**Still Lutan's:** whether Add Shelter Photos belongs on the Head of Medical in production. The check passes
either way. Production was not read.

## The CI decision for `check-medical-role.mjs`: no

It is green and now stays green when roles change. It is still not wired, because it needs the dev
database token and writes (inside a rolled-back transaction) to a database every stream shares, so a
second stream running it, or a dev role edit, can turn a PR red for a reason that PR did not cause.
`check-cards-schema.mjs` is the same shape and is also not in CI for the same reason (see the comment above
`check-cards-count` in `ci.yml`). Run it by hand after any change to roles, cards or the resident read policies.

## Half two: the sweep

187 `check-*.mjs` files. 21 are wired (14 by name in `gates.mjs`/`ci.yml`, the rest through the `lint` chain
in `package.json`, which the planner's grep missed). 166 were unwired; each was run on 2026-10-23.

| Group | Count | Today | Verdict |
|---|---|---|---|
| Offline checks of pure code, no database | 32 | 29 green; 3 red or not runnable | see below |
| Database harnesses, runnable without a server | 109 | **57 green, 52 red or unrunnable** | leave: run by hand when their migration or feature changes |
| Need a running dev server, a browser, or are tools | 25 | not run | leave |

**Wired in this PR (4, all green, all under 4 s, all catching something nothing else does):**
`check-prerequisites` (the roles grid's prerequisite rules), `check-multi-role-build` (several roles on one
login), `check-release-guards` (the deploy guards both releases share), `check-env-leak` (a build reading another
environment's env file). Added to the `lint` chain, which CI's `check` job and `gates.mjs` both already run.

**Offline, green, left unwired for a later decision (25):** acceptance-pdf (39 s, too slow), backup-encryption,
backup-folder, csp-report, csv, delivery-lines, docs-only.test, file-signature, medication-list-due, medication-pick,
migration-consumers (needs git history), next-path, public-view-owner, purchasing, recurring-job-eligibility,
shelter-dates, site-links, stale-titles (exits 0 by design), stock-deliveries, stock-reading, stock-usage,
stocktake-sheet, theme-contrast, translate-worker, units. Most are cheap and would join the same way; the
limit here was "a small handful", not a judgement against them.

**Red today, filed rather than fixed (one red at a time):**
- `check-worker-origin`: stale. It looks for the text `return updateSession`; `src/proxy.ts` now says
  `const response = await updateSession`. The origin check still comes first (line 20, against 52).
- `check-backup-prune`: failed once in four runs ("2000 random lists: the newest five always survive — 1
  violation"). Random input, so it is flaky or finds a real edge case; **not diagnosed**, and it guards backup pruning.
- `check-drive-token`: needs `--env-file`; a tool, not a check.

**The database harnesses are the real finding.** 52 of 109 are red or cannot run. They were written to prove one
migration and nobody re-ran them, so they decay as later migrations change the thing they assert. Most reds
are the same story as failures 1 and 2 above (a later migration did it on purpose). **Three look different and
should be read first, because they say a doctor can write outside their own clinic:**
`check-doctor-own-clinic-writes` ("doctor made a bulk booking for other: 1"), `check-doctor-report-schema` ("doctor
added a report at another clinic: 1") and `check-doctor-multi-clinic`. They may be stale in the same way (0249 and
the vet policies moved since); that is not established.

Verdict for the group: **leave, and triage the red ones in their own stream**, rather than wiring any (they
write to shared dev) or deleting any (several guard permissions).
