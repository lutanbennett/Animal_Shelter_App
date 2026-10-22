# Release handover — written 2026-10-22 after `0.39.1`

A **delta**. The release's own facts are in `docs/releases/2026-10-22-0-39-1.md`
and the durable rules are in `docs/release-procedure.md`. **Both outrank this
file.**

## Corrections to the last edition

- **It said to keep taking the one classifier retry and not to predict which command gets it. Right for a sixth time, and it moved again** — this release the refusal landed on a **read-only `ssh` reading the Pi build logs**, while the migration apply and the Pi deploy both went through untouched. One retry cleared it. **Six releases, six behaviours. That advice is now as well-tested as anything in here.**
- **It said `strip-baked-env` had read 13 for five releases.** It read **14** this time, both environments. **Not drift and not a regression:** the two extra names are `GOOGLE_CALENDAR_REFRESH_TOKEN` and `GOOGLE_CALENDAR_ID`, new to the deploy. A counter that has not moved in five releases is one you stop reading — **when it moves, read the log's own list, which accounts for it exactly.**
- **It said "first CI run green by construction" was broken at 12 and reset to 0. It is back to 1**, because its lesson was applied rather than admired: the cut plan was validated with `check-test-plan.mjs --base origin/main`, the way CI runs it. **That rule earned its place; keep it.**
- **It said the production calendar token was his, and next in his own stated order. It is DONE** — the values are on the Worker as of this release. What replaces it is smaller: **one real vet visit booked on production and seen in the calendar.**
- **It said the `release-prs.mjs` DISAGREEMENT is a coin-flip.** Confirmed again: **one** orphan this time (#826, squash-merged), against two, three and none before. **Four releases, four answers.**

## The thing not to re-derive, and it cost him two round trips

**`deploy.mjs --env production --secrets` cannot be used on this machine, and the
refusal's own suggested remedy is dangerous.**

Four Drive secrets (`GOOGLE_OAUTH_CLIENT_ID`, `_SECRET`, `_REFRESH_TOKEN`,
`GOOGLE_DRIVE_ROOT_FOLDER_ID`) resolve only from `.env.local`, so the fallthrough
guard refuses `--secrets` **every time**. It offers `--allow-dev-fallthrough`.
Taking that would overwrite four secrets production already holds correctly with
**dev** values — including the Drive folder id that decides where resident photos
are written.

> **To add a secret to production: push only the missing ones, then deploy.**
> `scripts/push-calendar-secrets.mjs` is the worked example — it refuses anything
> not coming from `.env.deploy.production` and never prints a value. Check what is
> actually missing first with `wrangler secret list --env production`; this
> release found production holding nine of eleven. **Push before the deploy, so
> the deploy re-tags the Worker and the Release tile never goes amber.**

**The wider lesson, and the one I would keep if I could keep only one.** I handed
over `--secrets` having confirmed the two calendar values were in the production
overlay. That was true and it was the wrong thing to check: **I verified the
change I was making, not the command I was typing.** Then the script I wrote to
fix it sat untracked in the **main checkout**, so the next attempt was refused by
the clean-tree guard. Two refusals, fifteen minutes, both mine, on a release that
was otherwise clean.

What worked on the third attempt, and what to do every time: **read the guard's
source, enumerate every condition it tests, run each against the live state, and
print the answers before writing the command out.** Under a minute. And note
`CLAUDE.md` forbids scratch output *above* the repo — this is the neighbouring
case: **a file written inside the main checkout blocks every guarded deploy.**

## The wrong-number gap closed, and the mechanism is worth protecting

The diets portion path — the only item anywhere whose failure is a wrong *number*
rather than a visible fault — **is closed.** Lutan checked the recipe book on test
himself and reported it working, after first saying he would leave it to a later
release.

**Put the numeric-risk item to him separately from the count, every time.** It has
now been answered differently from the rest three times. He said no, then did it
anyway twenty minutes later; he would not have had the chance if it had been
bundled into "nine plans await a person". **And name it concretely** — *four
ingredients, read the Standard card, expect 4 cups* is a gap a person closes in
five minutes. *"The diets screens need checking"* is not.

Recorded on `docs/test-plans/diets-recipe-book.md` as item 1 only, at his explicit
request and marked as written by me on his behalf. Items 2 and 3 stay `pending:` —
**he did not claim those and they must not be inferred.**

## A role tag at the cut, three releases running — and the obvious tag was wrong

The Settings → Diets note needed one. The page is at `/admin/diets`, so the
obvious tag is `["admin"]`, and **that would have hidden it from the doctors who
can open the page**: the route is gated on `reference.types`, which
`src/lib/permissions/fixed-for-now.ts` grants to the **doctor** box too.

**Read the permission source, not the URL.** Expect to tag another note next
release; the upstream cause is already filed on the `backlog` branch.

## Where things stand

| | |
|---|---|
| Live everywhere | **`0.39.1`** @ `654619c4` — production Pi and Worker, test Pi and Worker. All four read back after the Worker landed |
| Previous release SHA, for the next range | **`654619c4`** |
| Production database | **`247 applied`, `0 pending`**, `No drift`. **Run `--status --env production` yourself** |
| Dev database | **`No drift`, 247 of 247** — clean, second release running |
| Next free migration number | **`0247`**. `origin/main`'s highest is `0246`. **Check `origin/main` *and* open `*-schema` PRs anyway** |
| `unreleased` notes waiting | **0** at the cut — **read nothing into that.** Nine editions have said 0 and been overtaken |
| Open PRs | **none** at the cut. **Run `gh pr list` yourself** |
| Worktrees | Ten, nine `HELD` by live sessions with nothing beyond `main`. The cut reused the one `free` leftover and the record reused it again, so paperwork rule 2 was satisfied twice without a fresh `npm ci` |
| `main` moves under you | **No — not once.** Second release running |

**Server Actions keys, Worker against Pi** (seventeenth check): production
`cbd55beae8d8`, test `ecc41837fc0b`, unchanged since `0.31.0`. **Matching these
values is not evidence you checked.**

**Counters:** all four builds from one SHA **22** releases; `npm ci` as step 1
**18**; first CI run green by construction **1** (reset by `0.39.0`, earned back);
no production-only guard **20**; per-file dry-run trap **three fired, eleven
not** — this release's "not" is weak, since only one file was pending so it could
not fire; `strip-baked-env` **14**, first move off 13 in five releases.

## In flight: the same three silent failures, unchanged as a set

Name them **as a set**, say plainly none is broken today, and do not re-run them
as checks — they are **build-work on the backlog** wanting the same plumbing
(`status_alert_runs` → mail).

1. **A public desexing sign-up tells nobody** — still the most concrete, dormant only while the public site is locked, real at the cutover.
2. **Drive space** — amber at 80%, red at 95%, **never emails**.
3. **The nightly retention job** — only the general plumbing remains. **Do not re-ask whether the job runs.**

**Eight verification gaps, down from eleven, and the dangerous one is gone.** What
is left is ordinary: browser checks on Purchasing, Who does what and the menu
tiles; the Pi service-user steps in `docs/pi-hosting.md`, which are his; the
throwaway-project run for `migrations-all-history`. **Still unlooked-at from
earlier: the prescription form reading 4** (`0.38.1`) **and video playback on a
real handset** (`0.38.0`) — both now older than the gap that just closed.

**His, and his only open one: book one real vet visit on production and see it in
"Lanna Care: vet visits".** Do not ask whether the two-way calendar works in
general — the token is on, the sweep is bound, and that single booking is what is
left.

## Two things that are not in the runbook

- **A major release currently mails ONE person**, and this release did not mail at all. The `E_RECIPIENT_NOT_ALLOWED` skip older editions mention has not occurred for two releases — the shelter's own address is not on the production admin list. **Tell him plainly when the major call comes up**; "mails every admin" overstates today's lever.
- **`test-plan` is ADVISORY, permanently** (Lutan, 2026-10-20). Do not raise it, do not list it as a decision he owes. **Checked again: `main` has no branch protection at all.**
