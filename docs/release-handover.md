# Release handover — written 2026-10-25 after `0.40.3`

A **delta**. The release's own facts are in `docs/releases/2026-10-25-0-40-3.md` and the durable
rules are in `docs/release-procedure.md`. **Both outrank this file.**

## START HERE

**`0.40.3` is deployed, verified, and it correctly mailed nobody.** All four builds came from one
SHA, `b02864e7`, `main` never moved at any point, and the code-identity diff is `CLEAN`. Both
databases read **262 of 262** with `No drift`, and `0259`, `0260` and `0261` all went on before any
deploy.

**Read the release's own fault first, because it is mine and it is the one thing to change:** the
test Worker deploy and Lutan's production Worker deploy were started in the **same checkout** at the
same time, collided over `next build`, and **his failed**. The Worker fallback sat a release behind
for forty minutes and **he was asked twice more than the runbook allows.** Users were never affected —
the Pi serves the app and was already on `0.40.3` — which is why it went unnoticed. **Promoted into
`docs/release-procedure.md` as its own rule: the two Worker deploys are strictly sequential; only the
Pi builds parallelise.** Do not re-derive this from "do not idle", which is what misled me.

**`0259` took the last role-based rules out of the database, and nothing was lost.** This is the
counterpart to `0.40.2`'s `0257`, and it went the other way: measured on dev, **33 widenings across
five roles, no losses, Admin unchanged.** `role-cells` on production read **identical before and
after**, role for role — because `0259` changes which *rows* a login may read, not which cells it
holds. **The before-picture was taken of the right table this time**, which was `0.40.2`'s named gap.

**What it widened is the thing to watch:** six views now have **no card gate at all**
(`current_placement`, `translation_queue`, `immunization_compliance`, `immunization_duplicate_check`,
`resident_current_state`, `app_users`), so every login in the app reads them in full. No card was
created to close that, on Lutan's instruction *"No creating cards just remove permissions"*. Held for
Card review 2 and listed in `docs/card-access-faults.md`. **He was told plainly and chose to go
ahead** — do not re-raise it as a surprise.

**Re-measure before trusting any of this.** `git diff --stat b02864e7..HEAD`, `gh pr list`,
`--status --env production`, `node scripts/check-production.mjs all`, the live `/api/version`.

## The question that came mid-release, and its answer

**Lutan asked, during the release, whether all role-based access is now gone. The honest answer was
no, and the exception was found by measuring rather than recalling.**

`opensWhoDoesWhat()` — `src/lib/permissions/who-does-what.ts:13` — grants Settings → Who does what
from the role key `management`. It fails `CLAUDE.md`'s own test, it is **not** the Admin bypass, and
**it is in none of the registry's five mechanisms**, so `check-hard-coded-security.mjs` passes
without seeing it. That is exactly the blind spot
`docs/decisions/2026-10-24-hard-coded-security-ratchet.md` says the ratchet has, found in the wild
for the first time.

Filed under *Security* on the `backlog` branch with the fix: create the activity and its card, hand it
to Management **in the same change** or Management loses the page, and the hard-coded count goes
**down**. Not patched mid-release, per `CLAUDE.md`. **When the next session is asked the same
question, the answer is "the database half is done; one grant remains in the app, and it is this
one."**

## Corrections to the last edition

- **It said to re-measure the Doctor's nine cells rather than re-close them from the `0.40.1` record. Still exactly right, and still nine** — `doctor-cells` reports the same `MISSING 9 of 13` after this release. `0259` neither helped nor hurt it. **The new doctor cards remain the remedy and the most important open item.**
- **It named running `check-production.mjs role-cells` before the apply as the one method fix. Done, and it paid for itself** — the before/after pair is what turns "nothing was lost" from an assurance into a measurement, and it took seconds. **Keep doing it for anything that rewrites rather than adds.**
- **It said `audit` was red with `body-parser` and `undici` and nothing new. Unchanged** — same two packages, same four advisory IDs, all in `docs/decisions/2026-10-24-audit-body-parser-undici-not-reachable.md`. **Fix nothing.** New this release: the PR job showed **`skipping` even though the cut changes `package.json`**, so its gate is narrower than the decision's wording suggests. A skip is not a pass; the release-time `npm run audit:prod` is the check that counts, and it was run.
- **It said the OpenNext `Failed to copy` count held at three and to keep watching. Held at three again** — same three packages on test, **zero** on production, as on the last three releases. Still watch, do not act.
- **It said `strip-baked-env` was held at 14 for a fifth release. Sixth now**, same 14 names on both environments.
- **It said `main` not moving was "not method, but two releases running". Three now** — `gh pr list` empty throughout and `b02864e7..origin/main` empty after the last build. Ten worktrees were live and none merged. **Still not method.**
- **It listed `who-does-what` item 2 as the open check that matters. Unchanged, still run by nobody.** The card save click-through now matters more, because it is what this release's one note promises.

## Where things stand

| | |
|---|---|
| Live | **`0.40.3`** — all four builds from `b02864e7`; production Worker version `db93bdc2` tagged `v0.40.3`, test Worker `58f91a44` |
| Previous release SHA, for the next range | **`b02864e7`** |
| Production database | **`262 applied, 0 pending`**, `No drift`. **Run it yourself** |
| Dev database | **`No drift`, 262 of 262** |
| Next free migration number | **`0262`**. **Check `origin/main` *and* open `*-schema` PRs anyway** |
| The mail | **None, correctly.** Both deploys printed `no major release new to <env> (was 0.40.2), so no email.` Five independent confirmations, one of them the rendered page: `0.40.0` shows a **Major** badge and `0.40.3` shows none |
| `unreleased` and open PRs | 0 at the cut; `gh pr list` empty throughout. **Run it yourself** |
| Backlog | Conflicted at step 1 and was resolved by **keeping both halves** — `main`'s completion ticks and Lutan's new binding card-review method. `check-backlog-sections.mjs` ok, 83 open items |
| Public site | **`PUBLIC_SITE=locked`**, read from the Pi this release. The public-page and edge-cache-`HIT` checks are therefore vacuous |
| Home screen icons | `51 cards, 408 images`, **`0 created`** — independent confirmation that this release added no home-screen card, which is correct |
| Worktrees | Still about ten leftovers, most `HELD` by live sessions. **This release paid no `npm ci`** — it reused a free leftover for the cut and then the record, under paperwork rule 2, breaking a run of three releases that each paid four minutes. **Do that again**, and a `/clean-streams` round is still worth it |

**Counters:** `npm ci` as step 1 **26**; first CI run green by construction **9**; no production-only
guard **28**; `strip-baked-env` **21**, at **14**, sixth consecutive release. **Server Actions keys**
(twenty-fifth check): production `cbd55beae8d8`, test `ecc41837fc0b`, unchanged across four releases.
**Releases that mailed: 1 in the last nine.**

## Touches: four, and two were avoidable

Lutan was asked for **the mail decision**, **the `0259` access-widening decision** and **the
production Worker deploy** — the first and third are the runbook's allowed two, and the second is
required by its own rule that a quietly-changing access decision is named separately and put to him
rather than absorbed. **Then twice more, because of my collision.** Unlike `0.40.2`'s third touch,
which was genuinely unavoidable, these had a one-line fix and are now a rule.

**One thing to copy rather than re-derive:** when he said "it looks like it has deployed", it had not.
Three cheap reads settled it — the log's mtime against the clock, `/api/releases/current`, and his
terminal. **A failed deploy also finishes.** Confirm from `wrangler deployments list`, and match its
version against the deploy log's `Current Version ID`.

## In flight and open

**The security rebuild's database half is finished.** `0257` made every role exactly its cards,
`0259` removed the last role columns from 108 policies and 13 views, `0261` dropped `role_extras`.
What remains is in the app: the five registry mechanisms, plus `opensWhoDoesWhat()` above, which is
in none of them. **Card review 1 is the gate and Card review 2 is explicitly blocked behind it** by
Lutan's ruling of 2026-10-25 — do not schedule review 2 early, and read its item fresh when the four
gates are met.

**Seven `pending:` plans shipped as a stated gap on Lutan's explicit decision**, the same call he made
for `0.40.2`, `0.40.1` and `0.15.0`. Listed in `docs/test-plans/cut-release-0-40-3.md` and not ticked
on anyone's behalf.

**Also his, and NOT done: the ten production sign-in checks.** The most valuable single one is the
**card save on Who does what** — add a card, remove one, move one — because it is what this release's
note promises and no session can pass the authenticator step. `0.40.1`'s and `0.40.2`'s were not done
either.

**Carried unchanged, nothing new to say:** the Doctor's nine cells and the new doctor cards;
`who-does-what` items 2 and 3 and `stocktaking` item 3; the Thai wording of the Units screen and one
real vet visit on production; the same three silent failures as a set (public desexing sign-up, Drive
space thresholds, the retention job — all wanting the same `status_alert_runs` → mail plumbing); and
the two unlooked-at items, the prescription form reading 4 and video playback on a real handset.

**Still filed rather than fixed, and still one-liners:** the cut script is rewritten from scratch every
release (asks for `scripts/cut-release.mjs` with the cut assertions folded in — this release met the
same CRLF hazard and worked around it again with a one-line `package.json` replacement), and `0257`'s
stale `-- consumer:` header.

**One red still unresolved rather than explained away:** `check-diets-per-serving-schema.mjs` fails
`servings default to 1 / 1.5 / 2 - got 1` on dev. Carried from `0.40.1` and `0.40.2`, still plausible
and unverified — and note `0260_diets_drop_old_amounts.sql` shipped here without changing it either
way.
