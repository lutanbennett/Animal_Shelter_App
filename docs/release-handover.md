# Release handover — written 2026-10-14, after `0.30.0`

**What this file is.** A snapshot for whoever runs the next production release,
written at the end of the previous one. It says where things stand *right now*,
what is in flight, and what not to re-derive. It is **rewritten each release**
and is deliberately short-lived.

**What this file is not.** The durable record of a release is
`docs/releases/<date>.md`, and the runbook is `docs/release-procedure.md`. Both
outrank this file. If they disagree with it, they are right and this file is
stale — check the dates.

The standing instruction for this file: **when something it warns about gets
fixed, come back and say so** — a confidently wrong warning costs more than a
missing one. Honouring that, from the previous edition:

- **`npm ci` as step 1 earned its keep a second time.** `0.30.0`'s range touched
  the lockfile, which is exactly the condition that bit `0.28.0`, and the first
  Worker build printed `Next.js version : 16.3.8` matching `package.json`. Four
  minutes, nothing to investigate. Keep doing it.
- **The two-touch budget held for a second release.** Both allow rules worked and
  neither PR merge nor the production apply went near Lutan.
- **`--drift <env>` is fine** and was quoted again on both databases. Closed; do
  not re-derive.

**Read these first, in this order:**

1. `docs/release-procedure.md` — the runbook, start to finish
2. `docs/releases/2026-10-14.md` → the **`## 0.30.0`** section, end to end —
   especially "The migration" and "What this record cannot say"
3. `docs/decisions/2026-10-13-release-prs-merge-without-asking.md` — who merges
   what, and the two-touch budget. `0.29.0` and `0.30.0` both ran under it
4. this file, for what has changed since

---

## Where things stand

| | |
|---|---|
| Live everywhere | **`0.30.0`** @ `ab59e475` — production Pi, production Worker, test Pi, test Worker |
| Previous release SHA, for the next range | **`ab59e475`** — `node scripts/release-prs.mjs ab59e475 <the new release SHA>` |
| Production database | `195 applied`, **0 pending**, `No drift: production matches origin/main.` |
| Dev database | `195 applied`, **0 pending**, `No drift: test matches origin/main.` |
| Next free migration number | **`0195`** |
| `unreleased` notes already waiting | **0**, read off `origin/main` after the release |
| Open PRs | the record PR this file is in, and whatever has landed since |

**All four builds came from the release SHA exactly**, for the sixth release
running — and `0.30.0` added a check worth keeping: the **Server Actions key
fingerprint was read on both pairs**, not just production's. The deploy prints
`deploy: Server Actions key <fp> (the Pi's build must print the same)`, and until
this release only the production half was ever checked. Production was
`cbd55beae8d8` on both Worker and Pi; test was `ecc41837fc0b` on both. Two
comparisons, two greps, and it is the only thing that catches the Worker fallback
and the Pi disagreeing.

**Both databases are clean and nothing is pending anywhere**, for the seventh
release running. **So if `--status` shows you anything at all, it is new.** The
two legitimate one-sided cases:

- **Dev ahead of `main`** → a schema PR is open and has been applied to dev under the schema-first rule. Normal.
- **Production behind `main`** → a migration has merged since the last release. Normal, and it is what the last three releases opened with.
- Either is a fault only if no open PR and no merged-since-release migration explains it.

**`--env dev` is not a thing.** `apply-migrations.mjs` takes `test`, `uat` or
`production`; the dev database *is* `test` (`qxkmhwybjggxvsfxsxbd`). The same goes
for `--drift`: it is **`--drift test`**. `release-procedure.md` §7 was corrected
for this by `49a157fd`, so the runbook and this file now agree.

---

## The one new thing `0.30.0` learned

**The three `ERROR Failed to copy …\node_modules\…` lines are intermittent, not
universal.** `0.29.0`'s record met them on every Worker build and recorded them as
benign. `0.30.0` got **three on the test Worker build and zero on the production
one** — same checkout, minutes apart. So they are a Windows file-lock during
OpenNext bundling, and **either count is normal**: three is not a fault, and zero
is not evidence that something was skipped.

The check, if you want it, is that `age-encryption`, `color-string` and
`data-uri-to-buffer` are all present in
`.open-next/server-functions/default/node_modules/` afterwards. They were.

**The older lesson still stands and is still the most valuable one:** an option
you put to Lutan is a commitment that it can be carried out. Verify the mechanism
before offering the choice. `--upto` exists (#570) so a partial apply is possible
today, but **it has still never been used in a real release** — rehearse it
before offering an order that depends on it.

---

## Lutan's time: two touches, and `0.30.0` hit the budget again

A release costs him **exactly two interventions**:

1. **Major versus minor** — it mails every admin and cannot be undone
2. **The production Worker deploy** — his by his instruction of 2026-10-02

**`0.30.0` cost him exactly those two**, as `0.29.0` did. `0.28.0` cost five.

**If a release asks him for a third thing, record it in the release record as an
avoidable cost**, with what caused it — the same as any other defect.

Two things not to re-derive:

- **The record PR is not a gate, and must never be presented as one.** By the time
  it exists the release is deployed and verified. Merge it, then tell him.
- **Nothing about what ships changed.** `gates.mjs`, all seven CI checks and the
  test plans are exactly as they were. A red check is still never merged past.

### The two allow rules are **not in this repository**

They are in `C:\Users\Leidos\.claude\settings.json` on Lutan's laptop:

```
"Bash(node scripts/apply-migrations.mjs --env production)"
"Bash(gh pr merge *)"
```

alongside the older `Bash(ssh lutan@lanna-pi.local *)`. **Claude cannot read, add
or revert them** — the classifier refuses any access to that file as
self-modification. So you cannot check they are still there by looking; you find
out when a command is refused.

**All three were exercised on `0.30.0` and all three worked.** `gh pr merge 614
--merge` merged the cut with no prompt; `node scripts/apply-migrations.mjs --env
production` ran in its plain form; and the Pi deploys and backup-log reads went
over SSH without a prompt. **So `0.28.0`'s Defect 3 has not recurred for two
releases.** It remains unpredictable rather than fixed: `0.27.1` got the plain
form through, `0.28.0` did not, `0.29.0` and `0.30.0` did. Send it plain, exactly
`node scripts/apply-migrations.mjs --env production` — no timestamps, no redirect,
nothing wrapped round it. **If it is refused anyway**, do not retry blind: hand it
to Lutan, say the dry-run was clean, and **ask him for the output**, or the record
cannot state the file order or the timing.

**The production Worker deploy deliberately has no allow rule and must never get
one.** His instruction of 2026-10-02, and it is what mails every admin.

**Read his deploy log; do not take "done" for an answer.** On `0.30.0` he said his
bit was done, and the log was sitting there to read:
`tr -d '\000' < deploy-0.30.0.log` (`tee` writes UTF-16), then grep for the
project ref, `Next.js version`, `strip-baked-env`, the Server Actions key and the
release mail line. All five were right — but "the version endpoint says `0.30.0`"
would not have told you the Server Actions keys matched.

---

## In flight

**Nothing was left open by the release itself.** No migration merged after the
cut, and `main` did not move under the release — the second time in a row, so do
not assume it will hold.

**Do not trust a list of worktrees in this file — run `node scripts/worktree.mjs
list`.** Writing one down was tried twice and was stale within the hour both
times. What is durable is the shape:

- The release's own worktrees — the cut (`cut-release-0-30-0`) and this record (`record-0-30-0`) — are free leftovers once their PRs merge. `/clean-streams` is the one-pass way to clear them.
- `HELD — <session name>` means someone is still in it. Ask; do not tear it down.
- The list also names **husks**, folders git no longer tracks, which `done <name>` clears.
- There were already free leftovers from the earlier batches before this release started. That is `/clean-streams` work, not a release manager's.

---

## What the next release will need

1. **Step 0: read `docs/releases/2026-10-14.md` → `## 0.30.0`**, then `0.28.0`'s Defect 2 in `2026-10-13.md`, then `0.26.0`'s apply-plan failure in `2026-10-11.md`.
2. **Merge the cut PR and the record PR yourself, as soon as CI is green. Do not ask.** Two touches is the budget, and a third is a defect to record. Never call the record PR "ready to merge when you say".
3. **`npm ci` in the main checkout before any deploy**, and read the `Next.js version :` line on the first Worker build against `package.json` anyway. Two releases running it has been the cheap step that would have caught the expensive fault.
4. **Check the Server Actions key on both pairs**, production Worker against production Pi and test Worker against test Pi. New in `0.30.0`; two greps.
5. **Open with one message to Lutan** carrying major-versus-minor, the silent-failure answer, and **the whole outstanding-verification list**. `0.30.0` did this and got the version call in one word. The verification list has now closed nothing for **three** releases — **keep asking anyway.** The restore test into a real Supabase project has gone **four** releases unanswered and is still the cheapest item on it.
6. **Range starts at `ab59e475`** — run `release-prs.mjs` against the **release SHA after the cut merges**, not `HEAD` before it. Read its exit code directly, not through a pipe. **Expect exit 1**: five releases running have had squash-merged PRs with no merge commit carrying their number, and `0.30.0` had three. Match them by commit subject, then **confirm each against `gh pr view <n> --json mergeCommit`** — that turns an inference into a check, and it is one command. A PR-number range with **no gaps** is the independent check that none is missing.
7. **Nothing is pending on either database.** `--status --env production` first, and expect `0`. Anything else is new. The dev database is `--env test`, and the drift check is `--drift test`.
8. **Decide major or minor with Lutan before cutting.** `0.30.0` went major on the stated question — *can anyone do something today they could not do yesterday* — answering yes in three places at once. **The question is doing real work in both directions and there is no presumption either way.** Minor mails nobody.
9. **Ask whether anything in the release can fail silently**, and read the candidates in code first. **A header is a statement of intent, not evidence — diff it.** `0.30.0`'s answer is worth reading as a worked example, because the strongest form of it is not "the author says nothing changes" but "the migration aborts rather than commits if anything would change, and the production dry-run had already run that assertion against production's real rows". Look for that shape.
10. **Expect a production-only guard.** There has been none for six releases running. It can only appear at the production dry-run, and it is a question for Lutan, not a file to fix.
11. **The production migration apply is yours, with an allow rule** — see above for the exact form and what to do if it is refused anyway.
12. **Budget the Worker deploys at ~9–10 minutes each** and **do not overlap them with each other or with anything building in the same checkout** — both build in the main checkout, so the production command cannot be handed over until the test deploy has finished. **The Pi production build is on a different machine and does not conflict: start it the moment the cut is merged** and let it run alongside the test Worker deploy. On `0.30.0` the Pi was already serving `0.30.0` before the test Worker had finished. Start the record worktree during the CI wait, and **remember it needs `worktree.mjs sync` before you write in it**, because it was created before the cut merged.
13. **Hand over commands only at the moment they should be run.** `0.25.0`'s lesson; it has now held seven releases running.
14. **Confirm the release mail arrived, not just `sent N`.** `lannacareforanimals@gmail.com` being skipped with `E_RECIPIENT_NOT_ALLOWED` is expected and known.
15. `/clean-streams` for the release's own two worktrees once their PRs merge.

---

## The public site is still locked, and it is now the biggest blind spot

`PUBLIC_SITE` is `locked`, so an anonymous request to `lannacare.org` gets the
"Staff testing site" gate — confirmed on `0.30.0` rather than assumed. Two
consequences a release manager should expect:

- **The public pages cannot be smoke-tested at all**, signed out or otherwise, and
  `0.30.0` shipped **four of its eight notes** about the public website. The
  record says so plainly and so should the next one.
- **The edge-cache check is not merely hard, it is vacuous.** The gate is served
  `Cache-Control: private, no-cache, no-store`, so there is no cached public page
  to get a `HIT` on. Write it `n/a` with that reason rather than hunting for a
  browser that will show one.

---

## Things that look alarming but are not

Everything `0.28.0`'s and `0.29.0`'s lists hold still applies, in particular: a
red `audit` never blocks (it was green on `0.30.0`, which is not the usual state);
`| tee` writes UTF-16 so `tr -d '\000'` before grepping, and the `→` does not
survive that conversion, so grep for the project ref; a backgrounded `deploy.mjs`
writing nothing for minutes is buffering, not hanging; `-- consumer:` warnings
naming files "not on `origin/main` at all" are the safe direction; and
`deploy: release mail … [UAT]` on production is the production setting and the
mail is real. Also:

- **A `gates.mjs` build that finishes in 59s where the last took 196s is a warm Turbopack cache.** `0.30.0` ran the gates twice on the same tree and got 153s, then 59s.
- **A second CI run on the cut PR is correct and expected.** Ticking the "CI green" line is itself a commit, which re-runs all seven checks. Wait for the second run before merging rather than merging on the first run's green.
- **`test.lannacare.org/api/version` disagreeing with `/api/releases/current` mid-release is not a fault.** `/api/version` comes from the origin Pi and `/api/releases/current` is answered by the Worker, so between the test Worker deploy and the test Pi build they legitimately report different versions. On `0.30.0` that window showed `0.29.0` and `0.30.0` at the same time. Deploy the test Pi and they agree.
- **A foreground deploy that passes the ten-minute tool cap is moved to the background, not killed.** `node scripts/deploy.mjs --env test` did this on `0.30.0` and finished exit 0. Read its log file rather than re-running it.
