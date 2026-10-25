# Release handover — written 2026-10-25 after `0.40.2`

A **delta**. The release's own facts are in `docs/releases/2026-10-25-0-40-2.md` and the durable
rules are in `docs/release-procedure.md`. **Both outrank this file.**

## START HERE

**`0.40.2` is deployed, verified, and it correctly mailed nobody.** All four builds came from
**one SHA**, `221c041b`, `main` never moved during the release, and the code-identity diff is
`CLEAN`. Both databases read **259 of 259** with `No drift`, and `0257` and `0258` went on before
any deploy.

**But the release took something away, it is live now, and it is the first thing to deal with.**
`0257` rebuilt every production role's access from its cards alone and removed anything that came
from no card — exactly Lutan's 2026-10-24 ruling, confirmed again for this release. It worked:
`cards-union` reports every role *"exactly the union of its cards"*, and **`role-cards-coverage`
passes for the first time** — the check `CLAUDE.md` says must always come back empty and which was
recorded as not passing on 2026-10-24. The Volunteer's My tasks is fixed.

**The cost landed on the Doctor: 9 of the 13 cells `0230` gave it are gone.** In plain terms the vet
cannot open or record medical records on production. Lutan's remedy, 2026-10-25: *"I will be creating
a new set of doctor cards"* — filed on the backlog branch under **Security**, with the verification
named. **Do not "fix" it by giving the Doctor the existing `residents` card**: it would recover two
cells and also grant moving, hospitalising, rehoming and recording a death. And one of the nine,
`reference.add_while_recording`, is granted by **no card at all** (it is in `fixed-for-now.ts`), so
that one needs a card created, which takes the hard-coded-security count **down** rather than
sideways.

**Two things the last edition recorded as closed are re-opened by this release, by design.**
`0.40.1`'s record closed #900's `pending:` by measuring all 13 doctor cells live on production, and
on that basis the last handover declared its standing list of unreadable production facts **empty**.
Nine of those cells are now gone. The measurement was correct when taken and is simply no longer
true. **Do not re-close it from the `0.40.1` record.**

**Re-measure before trusting any of this.** Run `git diff --stat 221c041b..HEAD`, `gh pr list`,
`--status --env production`, `node scripts/check-production.mjs all` and the live `/api/version`.

## The method fault worth fixing before the next release of this shape

**`0257` prints a per-role list of what was added and removed, its own header calls it *"the record
of what to give back"*, and this release could not capture it.** `apply-migrations.mjs` reaches
Supabase through the Management API, which returns statement results and **not `RAISE NOTICE`
output**. The loss was established from two other directions — `doctor-cells` names all nine
activities, `cards-union` proves no role keeps an unbacked cell — but **only the Doctor's loss is
itemised**, because the before-picture taken was `role-cards`, which `0257` does not change, rather
than `role-cells`, which it does.

**The fix is one command, before the apply: `node scripts/check-production.mjs role-cells`.** Any
future migration that rewrites `role_permissions` needs that snapshot first. `0.40.1`'s handover
praised reading production rather than reasoning about it; this release read it, and still took the
wrong snapshot. **Reading is not enough on its own — read the thing the change actually moves.**

`docs/test-plans/cards-grants-schema.md`'s outstanding row still asks for the list from `audit_log`.
**That remains open and is not ticked.**

## Corrections to the last edition

- **It said to expect three SHAs again, because `0.40.1`'s single SHA was other sessions' timing rather than method. Wrong twice over, in a useful direction: this release also came from ONE SHA, and `main` did not move at all** — `gh pr list` was empty throughout. Ten sessions were live in their worktrees and none merged anything. **Still do not treat it as method**, but two releases running suggests the merge traffic has genuinely quietened rather than that we got lucky twice.
- **It said `audit` was red with `body-parser` and `undici` and nothing new. Still exactly that** — same two packages, same four advisory IDs, all in `docs/decisions/2026-10-24-audit-body-parser-undici-not-reachable.md`. **Fix nothing.** One practical note: **CI logs are not retrievable while the run is still in progress**, so `gh run view --log` returns nothing useful; run `npm audit --omit=dev --audit-level=high` locally instead, which is the same command the job runs.
- **It said the OpenNext `Failed to copy` count held at three and to keep watching. Held at three again** — same three packages, and **zero** on the production build, as on the last two releases. Still watch, do not act.
- **It said `strip-baked-env` was held at 14 for a fourth release. Fifth now**, same 14 names on both environments.
- **It named the classifier refusing `apply-migrations.mjs --env production` as `0.40.1`'s one avoidable cost. It did not recur** — the apply ran first time, unprompted. Nothing to do; worth knowing the allow rule held this time.
- **It listed `who-does-what` item 2 as the open check that matters. Unchanged, still run by nobody** — move a card, then check a second role shows it in the same section. It would catch the feature grouping being stored per-role, which is what `0.40.1`'s note promises.

## Where things stand

| | |
|---|---|
| Live | **`0.40.2`** — all four builds from `221c041b`; production Worker version `c351fdcc` tagged `v0.40.2`, test Worker `349ce695` |
| Previous release SHA, for the next range | **`221c041b`** |
| Production database | **`259 applied, 0 pending`**, `No drift`. **Run it yourself** |
| Dev database | **`No drift`, 259 of 259** |
| Next free migration number | **`0259`**. **Check `origin/main` *and* open `*-schema` PRs anyway** |
| The mail | **None, correctly.** Both deploys printed `no major release new to <env> (was 0.40.1), so no email.` |
| `unreleased` and open PRs | 0 at the cut, and `gh pr list` empty throughout the release. **Run it yourself** |
| Backlog | Two commits folded in at step 1 (retiring the 2-step refusal for admins); `check-backlog-sections.mjs` ok |
| Public site | **`PUBLIC_SITE=locked`**, read from the Pi this release. So the public-page and edge-cache-`HIT` checks are vacuous — **and note this release's headline note is a switch that hides public pages**, which is therefore only verifiable signed in |
| Home screen icons | `51 cards, 408 images`, **`0 created`** — an independent confirmation from another direction that this release added no home-screen card, which is correct |
| Worktrees | **Ten leftovers, all `HELD` by live sessions, all `nothing beyond main`.** Second release running that paid a four-minute `npm ci` for a fresh cut worktree. **Worth a `/clean-streams` round**; `HELD` means ask |

**Counters:** `npm ci` as step 1 **25**; first CI run green by construction **8**; no production-only
guard **27**; `strip-baked-env` **20**, at **14**, fifth consecutive release. **Server Actions keys**
(twenty-fourth check): production `cbd55beae8d8`, test `ecc41837fc0b`, unchanged across three
releases, each Pi printing that its own build carries its key. **Releases that mailed: 1 in the last
eight.**

## The third touch, and why it was not a fault

**Lutan was asked three times: the mail, the production Worker deploy, and whether to pause when
`0257`'s cost to the Doctor was established.** The runbook's target is two, and a third is to be
recorded as an avoidable cost — but **this one was not avoidable and should not be read as one.**
`0.40.1`'s third was a classifier refusal on a step assigned to Claude. This one was a quietly
failing change to what the vet can do, found mid-release, and `docs/release-procedure.md`'s own rule
is that such a change is named separately and put to him rather than absorbed. He chose to carry on
and fix it after. **A future release manager meeting the same shape should ask again.**

**The mail question cost one round trip and the trap did not bite**, because step 4's promoted rule
was followed literally: the words "major" and "minor" never appeared in the question, only whether
the release should email him. That rule is now proven on the release after the one that motivated it.

## In flight and open

**The security rebuild continues and `0257` is the biggest single step it has taken.** With
`role-cards-coverage` passing and every role exactly its cards, what remains is the hard-coded role
settings still to come out (`JOBS_OF_ROLE`, `CURATED_HOME`, `OUTSIDE_REGISTRY`, `FIXED_FOR_NOW`,
role-key ordering, the no-cards fallback home) — and **the new doctor cards are now the first piece
of that work with a user waiting on it.** The card walkthrough runs remain on hold.

**Six `pending:` plans shipped as a stated gap on Lutan's explicit decision** (nine rows, listed in
`docs/test-plans/cut-release-0-40-2.md`), on the same call he made for `0.40.1` and `0.15.0`. A
seventh was closed by measurement: `hard-coded-security` is green on #913, read from its checks
rather than inferred from the PR being merged — which would not have been sound, since `audit` is red
on that same run.

**Also his, and NOT done: the ten production sign-in checks** for this build. Recorded as not done,
not ticked. `0.40.1`'s were not done either.

**Carried unchanged, nothing new to say:** `who-does-what` items 2 and 3 and `stocktaking` item 3
(from `0.40.1`); the Thai wording of the Units screen and one real vet visit on production (from
`0.40.0`); the same three silent failures as a set (public desexing sign-up, Drive space thresholds,
the retention job — all wanting the same `status_alert_runs` → mail plumbing); and the two
unlooked-at items, the prescription form reading 4 and video playback on a real handset.

**Two tooling faults filed rather than fixed mid-release:** the cut script is rewritten from scratch
every release and hit the same CRLF fault for a second time (asks for `scripts/cut-release.mjs` with
the eighteen cut assertions folded in), and `0257`'s `-- consumer:` header names a script renamed
inside the same release. Both on the backlog branch, both one-liners, neither worth touching during a
release.

**One red still unresolved rather than explained away:** `check-diets-per-serving-schema.mjs` fails
`servings default to 1 / 1.5 / 2 - got 1` on dev. Carried from `0.40.1`, still plausible and
unverified. `check-production.mjs diets-proportion` reports every production line in proportion,
which is a neighbouring fact and not the same claim.
