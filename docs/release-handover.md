# Release handover — written 2026-10-25 after `0.40.4`

A **delta**. The release's own facts are in `docs/releases/2026-10-25-0-40-4.md` and the durable
rules are in `docs/release-procedure.md`. **Both outrank this file.**

## START HERE

**`0.40.4` is deployed, verified, and it correctly mailed nobody.** The code-identity diff is
**empty**, `main` **never moved at any point** (`origin/main` *is* the release SHA `2374d15d`), both
databases read **265 of 265** with `No drift`, and `0262`, `0263` and `0264` all went on before any
deploy. **No fault of its own, and the first release in a while with nothing to apologise for.**

**It cost two touches, which is the runbook's stated target: one answer and one command.** `0.40.3`
cost five where two were his. The thing that did it was **folding three questions into one round** —
the mail, `0263`'s access narrowing, and the unsigned plans — rather than asking as each arose. **Do
that again**: a decision you can see coming is a decision you can batch.

**`0.40.3`'s fault did not recur and the rule works as written.** The two Worker deploys were strictly
sequential — test started, allowed to finish, verified against `wrangler` — *before* the production
command was handed over. His deploy succeeded first time.

**The security rebuild is finished.** `0263` gates every view and door that only the front door
guarded; `0264` deleted the inert leftovers (60 dead policies, 7 stub functions, 5 retired `roles`
columns). **This closes the thing the last handover told you to watch**: the six ungated views where
every login read everything in full are all gated now, and `docs/card-access-faults.md`'s item is
closed. `opensWhoDoesWhat()`, the role-key grant the last handover found in the wild, is gone — it is
a card (`0262`), and Management was given it in the same change.

**`0263` narrowed access and nothing was lost — and that is a measurement, not an assurance.** One
cell and one card changed hands in the entire release (Management gaining `who_does_what`); the other
six roles are byte-identical before and after; `cards-union` and `role-cards-coverage` are clean for
all seven. Independent confirmation: `sync-home-icons.mjs` went from `51 cards` to `52 cards` with
**8 created**, agreeing that exactly one card was added.

**Read the release's one real finding, because it is nobody's change and it is getting worse:** the
**Doctor role holds one card where `0.40.3` recorded five**, so `doctor-cells` reports **MISSING 12 of
13** against that record's 9. **Identical before and after today's apply**, which is what proves this
release did not cause it. It has now drifted twice, by a route nobody has identified. **Find out
*how* it is changing, not just restore the cards** — a role losing cards silently between releases is
the same class of fault as the tile that silently is not drawn.

**Re-measure before trusting any of this.** `git diff --stat 2374d15d..HEAD`, `gh pr list`,
`--status --env production`, `node scripts/check-production.mjs all`, the live `/api/version`.

## Corrections to the last edition

- **It said the Doctor's nine cells were "still exactly nine" and to re-measure rather than re-close
  from the record. The method was right and it is what caught this: now twelve.** Keep re-measuring,
  and note the number is moving.
- **It said `opensWhoDoesWhat()` was one hard-coded grant in none of the registry's five mechanisms,
  and that the answer to "is role-based access gone?" was "the database half is done; one grant
  remains in the app." That answer is now out of date. Both halves are done.** The grant is a card.
  If asked again, say so — and then say the honest remainder, which is the registry's recorded
  mechanisms, not this one.
- **It said to re-use a free leftover worktree under paperwork rule 2 and that a `/clean-streams`
  round was worth it. The round happened — there are no leftovers left**, only the main checkout and
  `backlog`, so this release paid a four-minute `npm ci` for the record worktree. Correct trade, not
  a fault, but **expect to pay it from now on** rather than planning around a leftover.
- **It said `audit` was red with the same two packages and four advisory IDs, and to fix nothing.
  Unchanged, and fixed nothing.** The PR job again showed **`skipping` although the cut changes
  `package.json`** — second release running, so its gate is genuinely narrower than the 2026-10-25
  decision's wording suggests. Still not worth changing during a release.
- **It said the OpenNext `Failed to copy` count held at three and to keep watching. Held at three
  again** — three on test, **zero** on production, fourth release running. **Still watch, do not act.**
- **It said `strip-baked-env` was held at 14 for a sixth release. Seventh now**, same 14 names on both
  environments.
- **It said the public-page and edge-cache checks were vacuous because `PUBLIC_SITE=locked`. Still
  vacuous, and this time it was proven rather than recalled** — `/adopt` 307s to `/login` on both
  hosts, the deploy printed `env.PUBLIC_SITE ("locked")`, and the release touches neither
  `public-site.ts` nor `public-paths.ts`. **Check it that way, because `0263` is exactly the kind of
  change that could have closed the public site by accident.**
- **It said the "all four builds from one SHA" property is retired and carries no counter. Honoured.**
  All four did come from one SHA here, recorded as a fact and **not** as a property or a streak.

## Where things stand

| | |
|---|---|
| Live | **`0.40.4`** — production Worker version `82eb498c` tagged `v0.40.4`, test Worker `b6074ec4`; both Pi builds pinned `--ref 2374d15d` |
| Previous release SHA, for the next range | **`2374d15d82000463a7f5462f44c60ab660e8c850`** |
| Production database | **`265 applied, 0 pending`**, `No drift`. **Run it yourself** |
| Dev database | **`No drift`, 265 of 265** |
| Next free migration number | **`0265`**. **Check `origin/main` *and* open `*-schema` PRs anyway** |
| The mail | **None, correctly.** Both deploys printed `no major release new to <env> (was 0.40.3), so no email.` |
| `unreleased` and open PRs | 0 at the cut; `gh pr list` **empty throughout**, and `main` moved **zero** commits |
| Public site | **`PUBLIC_SITE=locked`**, read from the test Worker deploy this release. The public-page and edge-cache-`HIT` checks are therefore vacuous |
| Home screen icons | `52 cards, 416 images`, **8 created** — the new `who_does_what` card, and an independent check that exactly one card was added |
| Worktrees | **None left** — main checkout and `backlog` only. `/clean-streams` is no longer outstanding |

**Counters:** `npm ci` as step 1 **27**; first CI run green by construction **10**; no production-only
guard **29**; `strip-baked-env` **22**, at **14**, seventh consecutive release. **Server Actions keys**
(twenty-sixth check): production `cbd55beae8d8`, test `ecc41837fc0b`, unchanged across five releases.
**Releases that mailed: 1 in the last ten.**

## The method that paid off, and is worth copying verbatim

**Every "it finished" signal was treated as a nudge and confirmed from the thing itself.** Three of
the four were exit code 0 from something that was *not* the thing being measured:

- `gh pr merge` printed **nothing**; the merge was confirmed from `gh pr view --json state,mergeCommit`.
- Both Pi builds returned exit 0 — that was the **`sleep 25` wrapper**, not the build. Confirmed from
  the log's own `deploy-pi: restarting under the script from <sha>` and `serving 0.40.4 as expected`.
- The production deploy's background exit 0 was **`tail`'s status** through the pipe. Confirmed from
  `wrangler deployments list`, matched against the log's `Current Version ID`.
- The Cloudflare purge was followed by **re-running `check-assets.mjs` on the Pi**, not by trusting
  the purge's own output.

**A failed deploy also finishes.** That is `0.40.3`'s lesson and it is now four signals wide.

**One deliberate deviation from the runbook, worth keeping:** it lists both Pi builds together; this
release ran **test's first, verified `/api/version` and the asset check off it, and only then started
production's.** Production's Pi is what users see, and one extra build cycle is cheaper than a
rollback. It cost nothing in wall-clock, because the test Worker was building in the main checkout at
the same time. **Say so in the record if you do it, as this one does.**

## In flight and open

**The Doctor's twelve missing cells is now the most important open item** — see START HERE. Filed
under *Security* with the new doctor cards as the remedy, but the drift itself wants explaining.

**Also his, and NOT done: the ten production sign-in checks.** The most valuable single one is still
the **card save on Who does what** — add a card, remove one, move one — because it is what one of this
release's two notes promises, and no session can pass the authenticator step. `0.40.1`, `0.40.2` and
`0.40.3` were not done either. **Four releases is long enough that it should be raised as its own
item rather than carried in a handover.**

**Five `pending:` plans shipped as a stated gap** on Lutan's explicit decision, the same call he made
for `0.40.3`, `0.40.2`, `0.40.1` and `0.15.0`. Listed in `docs/test-plans/cut-release-0-40-4.md` and
not ticked on anyone's behalf.

**Card review 1 is the gate and Card review 2 is explicitly blocked behind it** by Lutan's ruling of
2026-10-25. `0263` has closed review 2's substantive worry — nothing is ungated any more — but the
blocking order stands. Read its item fresh when the four gates are met.

**Still filed rather than fixed, and still one-liners:** the cut script is rewritten from scratch
every release and met the **CRLF hazard** in `src/lib/releases.ts` for the third time (asks for
`scripts/cut-release.mjs` with the cut assertions folded in); and `0257`'s stale `-- consumer:`
header. New and trivial: **`tee` under PowerShell writes the deploy log as UTF-16**, so decode it
before grepping — keep using `tee`, because it passes the exit status through.

**One red still unresolved rather than explained away:** `check-diets-per-serving-schema.mjs` fails
`servings default to 1 / 1.5 / 2 - got 1` on dev. Carried from `0.40.1`, `0.40.2` and `0.40.3`, still
plausible and unverified, and nothing in this release touched it either way. **Four releases carrying
one red script is how a real fault hides.**

**Carried unchanged, nothing new to say:** `who-does-what` items 2 and 3 and `stocktaking` item 3; the
Thai wording of the Units screen and one real vet visit on production; the same three silent failures
as a set (public desexing sign-up, Drive space thresholds, the retention job — all wanting the same
`status_alert_runs` → mail plumbing); and the two unlooked-at items, the prescription form reading 4
and video playback on a real handset.
