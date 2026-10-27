# Release handover — written 2026-10-27 after `0.40.6`

A **delta**. The release's own facts are in `docs/releases/2026-10-27-0-40-6.md` and the durable
rules are in `docs/release-procedure.md`. **Both outrank this file.**

## START HERE

**`0.40.6` is deployed, verified, and it correctly mailed nobody.** Both databases read **270 of 270**
with `No drift`, all four migrations went on before any deploy, and both Worker deploys succeeded
first time. **It cost two touches — one answer and one command — which is the target.**

**What did it, for the third release running, was folding every foreseeable question into ONE round**
before the cut: the mail, the seven unsigned plans, and the Send to hospital consequence. **Do that
again.**

**The previous edition's own correction worked, and this release is the proof.** `0.40.5`'s handover
said to re-measure before repeating any carried item, after four editions passed along a red script
that did not exist. Every carried item below was re-measured this time, and one of them moved — the
`audit` item finally went from observation to a filed backlog item, and the OpenNext count was
*counted* rather than recalled. **Keep doing that.** A carried item with no command attached to it is
a rumour.

**`doctor-cells` red is EXPECTED and is not a fault** — Lutan uses Doctor as his test role, one card
at a time (`docs/decisions/2026-10-25-doctor-is-the-test-role.md`). It reads `MISSING 12 of 13`.
**Never restore the Doctor's cards and never edit the check.** Report the number, change nothing.

**Re-measure before trusting any of this.** `git diff --stat 641f340c..HEAD`, `gh pr list`,
`--status --env production`, `node scripts/check-production.mjs all`, the live `/api/version`.

## Corrections and closures to the last edition

- **The `audit`-shows-`skipped` item is now FILED, not carried.** Fourth release running, which is
  what `0.40.5`'s handover said should trigger a fix. It is a backlog item under *Documentation*:
  **the decision file's wording is wrong, not the job.** Measured on #975 rather than recalled.
  **Do not carry it here again** — check the backlog item instead.
- **The home-icon count behaved exactly as the last edition's correction predicted, which retires the
  question.** It moved **52 → 50** while the card count stayed at **32**, because `iconCatalogue()`
  counts distinct *pages* and `0268`/`0269` repointed what some cards open. **It verifies nothing
  about cards.** `cards-union`, `role-cards`, `role-cards-coverage` and `check-cards-count` are the
  real checks, and all four were clean.
- **`strip-baked-env` was held at 14 for an eighth release. Ninth now**, same 14 names both sides.
- **OpenNext `Failed to copy`: counted, not recalled — 3 on test, 0 on production, same three
  packages** (`age-encryption`, `color-string`, `data-uri-to-buffer`). **Sixth release running.**
  Still watch, do not act.
- **The public-page and edge-cache checks are vacuous while `PUBLIC_SITE=locked`. Proven again** —
  both deploy logs printed `env.PUBLIC_SITE ("locked")` and `/adopt` 307s to `/login` on both hosts.
- **The retired "all four builds from one SHA" property stayed retired. Honoured.** `main` moved once
  (#974, a planner handover) and the code-identity diff was **empty**, so nothing was rebuilt.
- **`release-prs.mjs` exited 0 with no squash-merge gap**, unlike the last two releases. The exit code
  was still read from the command rather than through a pipe, which is the habit, not the result.

## Where things stand

| | |
|---|---|
| Live | **`0.40.6`** — production Worker `e8828404` tagged `v0.40.6`, test Worker `5211879f`; both Pi clones at `641f340c` |
| Previous release SHA, for the next range | **`641f340ce816f064a39a825c1eefa2da706e4427`** |
| Production database | **`270 applied, 0 pending`**, `No drift`. **Run it yourself** |
| Dev database | **`No drift`, 270 of 270** |
| Next free migration number | **`0270`**. **Check `origin/main` *and* open `*-schema` PRs anyway** |
| The mail | **None, correctly.** Both deploys printed `no major release new to <env> (was 0.40.5), so no email.` |
| Cards | **32**, `cards-union` and `role-cards-coverage` both clean |
| Public site | **`PUBLIC_SITE=locked`**, read from both deploys |
| Worktrees | The record's (reused from the cut, itself a reused leftover) plus several free leftovers from merged PRs. **A `/clean-streams` round is owed** |

**Counters:** `npm ci` as step 1 **29**; no production-only guard **31**; `strip-baked-env` **24**, at
**14**, ninth consecutive release; **Server Actions keys** (twenty-eighth check): production
`cbd55beae8d8`, test `ecc41837fc0b`, unchanged across seven releases.
**Releases that mailed: 1 in the last ten.**

## The method that keeps paying

**Take the before-picture of the table the migration writes, and diff it afterwards.** This release
is the clearest case yet that it is worth the ninety seconds. `role-cells` before and after gave the
whole permission change as four lines, and **the one loss in the release — the 2IC's single cell,
`placement.hospital` — was itemised rather than inferred.** Without it, "Send to hospital is held by
nobody" would have been an argument from a migration header instead of a measurement.

**Read an exit code from the thing you are measuring, not from what printed it.** Still the highest
value habit here; met three times again (`release-prs`, `gates`, `check-release-guards`), each read
from the command or from `GATES_EXIT` rather than from a pipe or a background wrapper.

**A failed deploy also finishes.** Both deploys were confirmed from `wrangler deployments list`
against the log's `Current Version ID`.

## Two things a future release manager will meet

- **The classifier refuses `apply-migrations --env production` sometimes, as `[Production Deploy]`.**
  It was **transient and cleared on one retry** this release. It looks exactly like a missing
  permission and is not one. Retry **once**; if it refuses again, hand it to Lutan rather than
  working around it.
- **`git reset --hard` is refused by the classifier, and the runbook's worktree-reuse recipe names
  it.** You do not need it: `git checkout -b <branch> origin/main` in a clean worktree lands at the
  same commit. **Worth correcting in `docs/release-procedure.md`** — it is one line, and this is the
  second mechanical recipe in that file found to be unrunnable as written.

## In flight and open

**`role-cards-coverage` is CLEAN on production, and `CLAUDE.md` still says it is not.** That file
records "it does not pass yet: on 2026-10-24 production named four roles". It now prints `Every held
card is covered by its role's access`. **Someone should confirm and update that paragraph** — not
mid-release, and not by assuming: re-run the check first.

**Send to hospital is held by no live role** until Lutan gives someone **Manage medical** in Settings
→ Who does what. His decision, the note says so, and the fix is a card assignment rather than code.
**It is row 1 of his manual list and the one open item with a live consequence.**

**The `staff` phantom is the root cause of two decisions reasoned about a role that does not exist**
(`0268` and `0269`, hours apart). The backlog item — remove `staff` completely and stop reporting
archived roles as live — says the **check fix comes first**, because it is still feeding wrong
evidence to other streams. Nothing here changes that ordering.

**Seven `pending:` plans shipped as a stated gap** on Lutan's explicit decision. The trend is
**5, 5, 5, 5, 13, 7** — worth watching as a trend rather than a per-release footnote.

**Carried unchanged, nothing new to say, and RE-MEASURE EACH before repeating it:** `0257`'s stale
`-- consumer:` header; `who-does-what` items 2 and 3 and `stocktaking` item 3; the Thai wording of the
Units screen and one real vet visit on production; the three silent failures as a set (public
desexing sign-up, Drive space thresholds, the retention job — all wanting the same
`status_alert_runs` → mail plumbing); and the two unlooked-at items, the prescription form reading 4
and video playback on a real handset. **`tee` under PowerShell still writes the deploy log as
UTF-16** — `tr -d '\000'` before grepping, used again and it works.
