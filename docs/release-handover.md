# Release handover — written 2026-10-26 after `0.40.5`

A **delta**. The release's own facts are in `docs/releases/2026-10-26-0-40-5.md` and the durable
rules are in `docs/release-procedure.md`. **Both outrank this file.**

## START HERE

**`0.40.5` is deployed, verified, and it correctly mailed nobody.** All four builds came from
`aa984fa1`, both databases read **266 of 266** with `No drift`, `0265` went on before any deploy, and
the production deploy succeeded first time. **It cost two touches — one answer and one command —
which is the target.**

**What did it, again, was folding every foreseeable question into ONE round** before the cut: the
mail, `0265`'s access narrowing, and the thirteen unsigned plans. Two releases running. **Do that
again** — a decision you can see coming is a decision you can batch.

**The most important thing in this edition is a correction, and it is about this file.**
`0.40.4`'s handover carried `check-diets-per-serving-schema.mjs` as *"one red still unresolved rather
than explained away… carried from `0.40.1`, `0.40.2` and `0.40.3`, still plausible and unverified"*,
and told you four releases carrying one red script is how a real fault hides. **That script did not
exist when those words were written.** It was deleted on 2026-10-25 by `3a0219c8` ("Diets link 4"),
deliberately: `0260` dropped the `qty_small/medium/large` columns it asserted proportions on. This
session repeated the claim to Lutan **twice** before running it, offered to make it a workstream, and
he said yes — the phantom was caught only because writing the backlog item properly meant capturing
the exact failure, and there wasn't one. **No item was filed.**

**So: the handover's own first instruction is the one it is easiest to skip for the handover itself.**
Re-measure before repeating ANY item below, including the ones that look like settled background.
A carried item with no command attached to it is a rumour. `git log --oneline --all -- <path>` costs
five seconds and would have caught this four editions ago.

**`doctor-cells` red is EXPECTED and is not a fault** — Lutan uses Doctor as his test role, one card
at a time (`docs/decisions/2026-10-25-doctor-is-the-test-role.md`). It reads `MISSING 12 of 13`.
**Never restore the Doctor's cards and never edit the check.** Report the number, change nothing.

**Re-measure before trusting any of this.** `git diff --stat aa984fa1..HEAD`, `gh pr list`,
`--status --env production`, `node scripts/check-production.mjs all`, the live `/api/version`.

## Corrections to the last edition

- **The diets red: wrong, and wrong for four editions.** See START HERE. **Do not reinstate it.**
- **It said the home-icon count was "an independent check that exactly one card was added"
  (`52 cards … 8 created`). It is not, and this release proved it.** `iconCatalogue()` counts
  **distinct pages**, deduped by path in `toIcons()`. `record_death` has `opens: "/residents"`, the
  same path as two existing cards, so the count correctly stayed at **52 with 0 created** while a card
  genuinely was added. It only ever detected cards that open a **new** page. **`cards-union`,
  `role-cards` and a before/after prediction are the real checks.**
- **It said to expect to pay a four-minute `npm ci` for the cut worktree from now on. Paid, correctly.**
  There were no leftovers. The record then **reused the cut's worktree** under paperwork rule 2 rather
  than making a second one.
- **It said `audit` showed `skipping` although the cut changes `package.json`, second release running.
  Third now**, same behaviour. Its gate is genuinely narrower than the 2026-10-25 decision's wording
  suggests. **Still not worth changing during a release** — but it is now a pattern, and if a fourth
  release sees it, the decision's wording should be corrected rather than the job.
- **It said the OpenNext `Failed to copy` count held at three on test and zero on production, fourth
  release. Fifth now**, same three packages. **Still watch, do not act.**
- **It said `strip-baked-env` was held at 14 for a seventh release. Eighth now**, same 14 names both sides.
- **It said the public-page and edge-cache checks are vacuous while `PUBLIC_SITE=locked`, and to prove
  it rather than recall it. Proven again** — the deploy printed `env.PUBLIC_SITE ("locked")` and
  `/adopt` 307s to `/login` on both hosts.
- **It said the "all four builds from one SHA" property is retired and carries no counter. Honoured.**
  All four did come from `aa984fa1`, recorded as a fact.

## Where things stand

| | |
|---|---|
| Live | **`0.40.5`** — production Worker version `5880dc1d` tagged `v0.40.5`, test Worker `24e3a999`; both Pi builds under the script from `aa984fa1` |
| Previous release SHA, for the next range | **`aa984fa1ad4e033781e10e109ded460efa6a4f54`** |
| Production database | **`266 applied, 0 pending`**, `No drift`. **Run it yourself** |
| Dev database | **`No drift`, 266 of 266** |
| Next free migration number | **`0266`**. **Check `origin/main` *and* open `*-schema` PRs anyway** |
| The mail | **None, correctly.** Both deploys printed `no major release new to <env> (was 0.40.4), so no email.` |
| `unreleased` and open PRs | 0 at the cut; `main` moved **one** PR during the release (#961, a planner handover), and the shipping tree is **byte-identical** to the tested SHA |
| Public site | **`PUBLIC_SITE=locked`**, read from the deploy. Public-page and edge-cache-`HIT` checks are vacuous |
| Home screen icons | `52 cards, 416 images`, **0 created** — correct, see the correction above |
| Worktrees | The record's (reused from the cut) plus two free leftovers from merged PRs — `card-decisions-schema` (#960) and `harness-sweep-diets-stock` (#959). **A `/clean-streams` round is owed** |

**Counters:** `npm ci` as step 1 **28**; first CI run green by construction **11**; no production-only
guard **30**; `strip-baked-env` **23**, at **14**, eighth consecutive release. **Server Actions keys**
(twenty-seventh check): production `cbd55beae8d8`, test `ecc41837fc0b`, unchanged across six releases.
**Releases that mailed: 1 in the last ten.**

## The method that keeps paying

**Read an exit code from the thing you are measuring, not from what printed it.** This release met
that trap **three times in one afternoon**, and it is the single highest-value habit here:

- `release-prs.mjs` piped through `tail` read **0**; its real exit is **1**, and it was hiding two squash-merged PRs.
- The gates run's background wrapper reported **exit 0** — also `tail`'s. The gates' own `GATES_EXIT=0` was the evidence.
- The production Pi build's wrapper returned **exit 0 after 20 seconds** — that was the `sleep`.

**It is worth promoting into `docs/release-procedure.md` as a one-liner** rather than being
re-derived from a record every release. That is this edition's one suggested rule change.

**A failed deploy also finishes.** Still true, still the reason every deploy is confirmed from
`wrangler deployments list` against the log's `Current Version ID`.

## In flight and open

**Card review 1's APP half is the next piece, and the release notes already promise it.**
`0265` landed the schema; the app half is a later stream. Until it lands, four medical cards are
narrowed in the database while the live app still asks for the wider read — which the notes describe
honestly ("will show nothing or refuse"). **The five manual checks in
`docs/test-plans/cut-release-0-40-5.md` are the ones that would catch a card left short**, and four of
them can only be done on production.

**Card review 2 stays blocked behind Card review 1** by Lutan's ruling of 2026-10-25. Read its item
fresh when the gates are met.

**Thirteen `pending:` plans shipped as a stated gap** on Lutan's explicit decision — the largest number
so far, nine of them him reading this release's card reports. Listed in the record, not ticked on
anyone's behalf. **Worth watching as a trend rather than a per-release footnote:** 5, 5, 5, 5, 13.

**Still filed rather than fixed:** `0257`'s stale `-- consumer:` header. **`tee` under PowerShell
writes the deploy log as UTF-16**, so `tr -d '\000'` before grepping — used again this release and it
works.

**Retired from this file:** the diets red (never existed), and the home-icon card count as a
verification (it does not verify that).

**Carried unchanged, nothing new to say:** `who-does-what` items 2 and 3 and `stocktaking` item 3; the
Thai wording of the Units screen and one real vet visit on production; the same three silent failures
as a set (public desexing sign-up, Drive space thresholds, the retention job — all wanting the same
`status_alert_runs` → mail plumbing); and the two unlooked-at items, the prescription form reading 4
and video playback on a real handset. **Re-measure each before repeating it — that is what this
edition's correction is about.**
