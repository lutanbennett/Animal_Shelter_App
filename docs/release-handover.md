# Release handover — written 2026-10-21 after `0.38.1`

A **delta**. The durable lessons from this release were promoted into
`docs/release-procedure.md` (Traps) rather than copied here, and the release's own
facts are in `docs/releases/2026-10-20.md`, which now holds **three** releases
(`0.37.2`, `0.38.0`, `0.38.1`). **Both outrank this file.**

## Corrections to the last edition

- **It said to budget a `[Production Deploy]` refusal on any production-Pi command. `0.38.1` was not refused once** — neither build start nor log read, on either clone. Three releases, three behaviours, one unchanged allow rule. **Take one retry if it comes; do not open by predicting it.** The test Pi is still never refused.
- **It said to expect a `release-prs.mjs` DISAGREEMENT.** Four releases running had one; this had **none** (exit 0, 11 PRs). **Dead prediction — expect either, and check the plans directly with `check-test-plan.mjs --base <previous SHA>` regardless.**
- **The cut PR number guess was wrong** after four right: #787 guessed, **#788** actual, because the planner's handover took #787. Keep writing the guess; stop trusting it.
- **`strip-baked-env` removed 13 on both environments** — third release running, exactly as predicted.

## What went wrong, and it was mine

**I reacted to `main` moving instead of reading the deploy log.** A docs-only
commit merged nine minutes after the cut; I inferred Lutan's deploy would build
from the new tip, rebuilt both Pis to match, and he had already started from the
original SHA — which his log said in its first lines. Moving the Pis back left
Cloudflare serving the intermediate build's HTML, and `check-assets` caught it.
A zone purge fixed it; both clones then read `identical to the build`.

**Cost Lutan nothing** (his command ran once; the release stayed at two touches)
and me about fifteen minutes. **The full mechanism and the five rules it produced
are now in the runbook's Traps** — including that the Pi pin is the shipped SHA,
never `main`'s tip, and that a red `check-assets` is to be believed.

## The decision you will be tempted to "fix"

`0.38.1` shipped a note saying vet visits sync back from Google Calendar, and
another describing a public desexing sign-up form. **Neither works on production
today** — no production calendar token, and `PUBLIC_SITE` is `locked`. Raised
before cutting with holding recommended; **Lutan chose to ship both as written**
(`docs/decisions/2026-10-20-release-0-38-1-notes-shipped-as-written.md`).

> **Do not re-raise it, do not reword those released notes, and do not cite it as
> precedent.** It was tolerable only because the release was **minor**, so the
> notes sit on `/releases` rather than in every inbox — which is exactly how it
> differs from `#518`. **The truth rule is unamended.**

**Expect him to override a recommendation — he did on both — and ask anyway.**
A major would have needed the same question with a different answer available.

**No pattern to carry on major versus minor:** `0.38.0` mailed everyone and
`0.38.1` mailed nobody, on the same day. Put the case to him with a
recommendation and let him weigh it.

## Where things stand

| | |
|---|---|
| Live everywhere | **`0.38.1`** @ `1de7bdb4` — production Pi and Worker, test Pi and Worker |
| Previous release SHA, for the next range | **`1de7bdb4`** |
| Production database | **`236 applied`, `0 pending`**, `No drift`. **Run `--status --env production` yourself.** |
| Dev database | `236 of 236`, `No drift`. **Already stale — run `--drift test`.** |
| Next free migration number | **`0236`** (`origin/main`'s highest is `0235`). **Still check** |
| `unreleased` notes waiting | **0** at the cut — **read nothing into that.** Six editions have said 0 and been overtaken |
| Open PRs / worktrees | **run `gh pr list`** and **`worktree.mjs list`.** Nine feature leftovers were `HELD` by live sessions — not the release manager's to clear |
| `main` moves under you | **Yes, twice this release** — a backlog conflict another session resolved, and #787 nine minutes after the cut merged |

**Server Actions keys, Worker against Pi** (fourteenth check): production
`cbd55beae8d8`, test `ecc41837fc0b`, unchanged since `0.31.0`. **Matching these
values is not evidence you checked.**

**Counters:** all four builds from one SHA **19** releases; `npm ci` as step 1
**15**; first CI run green by construction **11** — and **one run only** this
time, because the cut plan's CI line was written `n/a` instead of ticked in a
second commit; no production-only guard **17**; per-file dry-run trap **twice
fired, nine not**.

## In flight: three silent failures, one new and public

Name them **as a set**, and say plainly none is broken today. All three want the
same plumbing (`status_alert_runs` → mail) and all three are **build-work on the
backlog, not checks to re-run.**

1. **A public desexing sign-up tells nobody.** NEW and the most concrete: `src/app/services/desexing/actions.ts` inserts the row and returns; it surfaces only on Management → Desexing drives if someone opens the page. No mail, no alert, no tile. **A member of the public is on the other end.** Dormant only while the site is locked, so it becomes real at the cutover.
2. **Drive space** — videos up to 500 MB into a 1 TB Drive; the tile goes amber at 80%, red at 95%, and **never emails**.
3. **The nightly retention job** — confirmed *working* on production 2026-10-20. **That question is shut; do not re-run it.** What is open is that it would not announce a future failure.

**Also open and his: the production calendar token**, next in his own stated order
(two-way built and tested → the token → share with the Director). Until then the
poll is dormant on production — `calendarConfigured()` false, not an error.
**Do not ask whether the two-way calendar works.**

**The nine verification gaps this release shipped with** stay in their own plans
with their own signatures. **The one worth five minutes is the prescription
form**: four times a day with three ticks must still read **4** on the medication
list and stock forecast. It is the only gap where being wrong produces a wrong
*number* rather than an awkward screen. Still unlooked-at from `0.38.0`: video
playback on a real handset.

## Two things that are new and not in the runbook

- **`test-plan` is ADVISORY, permanently** (Lutan, 2026-10-20). Do not raise it, do not list it as a decision he owes, and **if branch protection already requires it, say so** rather than assuming it was intended.
- **The public site is locked on both environments**, so the public pages cannot be smoke-tested at all — fifth release running, and this release's headline is a **public** feature nobody outside the shelter can reach. Test the enforcing layer as `anon` instead: `check-public-views.mjs` on dev, exit 0, confirmed the public can read the drives list and **nobody's sign-up**. The edge-cache `HIT` check stays `n/a: vacuous while the gate is served no-store`.
