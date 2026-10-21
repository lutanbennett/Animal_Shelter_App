# Release handover — written 2026-10-21 after `0.38.2`

A **delta**. The durable lesson from this release was promoted into
`docs/release-procedure.md` (the test-deploy `tee` rule) rather than copied here,
and the release's own facts are in `docs/releases/2026-10-21.md`. **Both outrank
this file.**

## Corrections to the last edition

- **It said the `release-prs.mjs` DISAGREEMENT prediction was a "dead prediction". It is not dead** — this release had one: exit 1, three test plans belonging to no listed PR, all three resolved to **squash-merged** PRs (#787, #790, #793). So the range was **13** PRs, not the 10 printed. It is a coin-flip that depends on how the day's streams merged, which the release cannot control. **Expect either, resolve every orphan to a PR by hand, and check the plans with `check-test-plan.mjs --base <previous SHA>` regardless.**
- **It said not to open by predicting a `[Production Deploy]` refusal, and to take one retry if it comes. Exactly right, and it came.** The first production-Pi command was refused by the classifier **with no explanation given**; the same command minus a `rm -f`, retried once, went through and was never refused again. **Four releases, four behaviours. Keep taking the one retry; still do not open by predicting it.** The test Pi was again never refused.
- **`git reset --hard` is refused** as irreversible local destruction. This matters because the runbook's trap for reusing the cut's worktree tells you to `git reset --hard origin/main`. **`git checkout -b <branch> origin/main` does the same job on a clean worktree and is not refused** — worth knowing before you reach for the documented form.
- **The cut PR number guess was right** (#801 guessed, #801 actual) after being wrong last time. **Keep writing the guess; keep not trusting it.**
- **`strip-baked-env` removed 13 on production** — fourth release running. **Test's count was not read this time; that was my fault, below.**

## What went wrong, and both were mine

**I piped the test deploy through `tail -40` and lost the evidence.** The lines
that matter — `deploy: test → Supabase project <ref> (<sha>)` and
`strip-baked-env: removed N` — print *before* the long build, which is precisely
why the runbook `tee`s the production deploy. I knew that rule, applied it to his
command, and not to my own. Both facts were recoverable from the bindings
printout (`env.SUPABASE_URL` names the dev project) and `/api/version`, **which is
luck, not method**. The rule now covers the test deploy in the runbook. Cost:
nothing but the honesty of one checklist line.

**`sync-home-icons.mjs --env production` failed on a Drive rate limit**, 403
`userRateLimitExceeded`, after drawing all 344 images and uploading 40. A straight
retry got through, so the release note's Drive promise is true. **Budget that
retry, and do not read a 403 here as an auth failure** — the token was fine.

**Expect it again, because the cause is not backoff.** It is **43 cards × 8 files**
(dark/light × 180/1024 × with-name/icon-only), and the loop
(`sync-home-icons.mjs:97`-`104`) has **no "unchanged" case**: for each of the 344
it does a `files.list` lookup and then *always* uploads, with nothing comparing the
PNG just drawn against the one in Drive. **~688 Drive requests a release to replace
files that are almost all byte-identical.** I filed this first as a missing-backoff
bug and **that was wrong** — Lutan's own question ("will the next release save only
the new cards?") found it. Rewritten on the `backlog` branch to lead with *upload
only what changed*; trimming the eight variants is the second fix and his call.

## The thing not to re-derive

**A directory in a migration's `-- consumer:` header can never read `live`.**
`git show <ref>:<dir>/` prints a tree listing whose first line embeds the ref, so
any directory path reports `differs` at any two refs however little changed
inside it. Four of this release's nine warnings were of that kind — proved with
`worker/`, which has **zero** changed files since `1de7bdb4` and warned anyway.
Also wrong the other way: a tree listing holds only names, so changed *contents*
under unchanged *filenames* would read `live`.

> **Predict the warnings anyway, by running the real `consumerReport` rather than
> reasoning about which files changed.** All nine were predicted exactly, so none
> surprised anyone and the four vacuous ones cost no thinking at the apply. Filed
> on the `backlog` branch; reasoning in
> `docs/decisions/2026-10-21-release-0-38-2-admin-tag-and-directory-consumers.md`,
> including the two tempting wrong fixes.

**A note was tagged `admin` at the cut** (Lutan's call) because it described an
admin-only page. Safe only because the text was untouched and the verification
asserts exactly one note's tags changed. **The tag belongs in the feature PR next
time** — do not read this as licence to edit notes at the cut.

## Where things stand

| | |
|---|---|
| Live everywhere | **`0.38.2`** @ `ce754d32` — production Pi and Worker, test Pi and Worker |
| Previous release SHA, for the next range | **`ce754d32`** |
| Production database | **`239 applied`, `0 pending`**, `No drift`. **Run `--status --env production` yourself** |
| Dev database | **DRIFTED, and not by this release** — `240` rows against `239` files, the extra being **`0239_diets_are_recipes.sql`**, applied to dev by in-flight **#803** and not on `main`. It was clean before the cut. Schema ahead of code on dev is the intended direction; **re-run `--drift test` and expect it to have moved again** |
| Next free migration number | **`0239` is already claimed** by unmerged #803, though `origin/main`'s highest is `0238`. **Check `origin/main` *and* open `*-schema` PRs before numbering** |
| `unreleased` notes waiting | **0** at the cut — **read nothing into that.** Seven editions have said 0 and been overtaken |
| Open PRs | **#802** `harness-reds`, **#803** `diets-schema` (`0239`), **#804** `cancelled-visits-and-archive`. **Run `gh pr list` yourself** |
| Worktrees | Four live streams plus this record's. **The nine leftovers the last edition reported `HELD` were cleared by somebody during this release** — not the release manager's doing, and not theirs to do |
| `main` moves under you | **Yes, once** — my own backlog item, merged by the daily sync. Docs-only, one file. **Doing nothing was correct**; all four builds were already on `ce754d32` |

**Server Actions keys, Worker against Pi** (fifteenth check): production
`cbd55beae8d8`, test `ecc41837fc0b`, unchanged since `0.31.0`. **Matching these
values is not evidence you checked.**

**Counters:** all four builds from one SHA **20** releases; `npm ci` as step 1
**16**; first CI run green by construction **12** — and **one run only** again,
because the cut plan's CI line was written `n/a` rather than ticked in a second
commit; no production-only guard **18**; per-file dry-run trap **twice fired, ten
not**; `strip-baked-env` at 13 **four** releases (production).

## In flight: the same three silent failures, one half-closed

Name them **as a set**, say plainly none is broken today, and do not re-run them
as checks — they are **build-work on the backlog** wanting the same plumbing
(`status_alert_runs` → mail).

1. **A public desexing sign-up tells nobody** — still the most concrete, still dormant only while the public site is locked. A member of the public is on the other end, so it becomes real at the cutover.
2. **Drive space** — the tile goes amber at 80%, red at 95%, and **never emails**.
3. **The nightly retention job** — **this release closed the "nobody would know" half.** `/admin/status` now has a tile that goes red and **mails admins** if the job is missing, switched off or failing. Confirmed on production after the apply: `check-cron-job --env production` reads the job `active`, `17 3 * * *`, and `0238`'s function present. What remains is only the general plumbing the other two want. **Do not re-ask whether the job runs.**

**Also open and his: the production calendar token**, next in his own stated order.
**Do not ask whether the two-way calendar works** — it is built and its follow-up
shipped here.

**The nine verification gaps** stay in their own plans with their own signatures.
**Three of the nine cannot be closed by anyone** — they ask how a future chat or
edition reads a document; say so rather than inflating the count. Of the six real
ones, **the one worth five minutes is the new tile on `/admin/status`**, because it
is the thing this release's headline note promises. Still unlooked-at from
earlier: the **prescription form reading 4** (`0.38.1` — still the most valuable
item anywhere, the only one where being wrong produces a wrong *number*) and
**video playback on a real handset** (`0.38.0`).

## Two things worth knowing that are not in the runbook

- **`test-plan` is ADVISORY, permanently** (Lutan, 2026-10-20). Do not raise it, do not list it as a decision he owes. **Checked this release: `main` has no branch protection at all**, so nothing requires it and there is nothing to report.
- **The public site is locked on both environments**, sixth release running — and this release put a registration line, a Thai address and a "where your gift goes" section on `/about`, `/donate` and the public footer that **nobody outside the shelter can reach**. That is why `0237` correctly carries no release note, and it is the clearest example yet of the truth rule earning its place. The edge-cache `HIT` check stays `n/a: vacuous while the gate is served no-store`.
