# Release procedure

What a release *is*, in order, and who runs each step. `docs/release-smoke-test.md`
is the per-release checklist of what to **verify**; this is the runbook for what to
**do**, and it exists because `0.15.0` (2026-10-02) took far longer than `0.14.0`
had, almost entirely through avoidable mechanical faults rather than anything
about the software. Each of those is written down here as a trap, because every
one of them will recur otherwise.

**The standing rule, above all the steps: do not hand Lutan a command you have
not confirmed runs in his shell.** Two commands handed over during `0.15.0`
could not work — one blocked by PowerShell's execution policy, one by `sudo`
having no terminal. Each cost a round trip and the release stalled while the
session waited on something that was never going to succeed. Prefer doing the
step yourself where you are permitted to; when you must hand it over, give the
exact form, in the shell he actually uses.

**`0.20.0` added a third, and it is the cheapest of the three to avoid:** a
two-step handover was written as `gh pr merge 414 --merge && gh pr merge 415
--merge`, and `&&` is not a statement separator in Windows PowerShell 5.1. It
died with `The token '&&' is not a valid statement separator in this version`
before running *either* command. The same mistake went out a second time in the
same message, on `apply-migrations` and `deploy.mjs`. See the trap below.

---

## Who does what

**Lutan has exactly one job in a release** (his instruction, 2026-10-02):

```bash
node scripts/deploy.mjs --env production
```

Everything else is Claude's: the cut, the PR, CI, the merge, the production
migrations, the test Worker deploy, **both Pi builds and both service restarts**,
the verification and the record.

If a step appears to need him for anything else, that is a **fault to fix, not a
handover**. In `0.15.0` the test clone had been left root-owned, which made a
password-prompting `sudo` look like a thing to pass over; the right response was
to recognise it as damage and fix it, not to add it to his list. The two genuine
exceptions, both of which should be rare enough to be remarkable:

- a `sudo` password on the Pi, which only an already-broken clone should need
- anything behind a sign-in on `lannacare.org`, since Claude has no account there

| Step | Who |
|---|---|
| Cut PR, gates, CI, **merge** | Claude — **merged as soon as CI is green, without asking** (2026-10-13) |
| Production migrations | Claude — `apply-migrations.mjs --env production` from the **main checkout**, under a user-settings allow rule added 2026-10-13 |
| **Worker production deploy** | **Lutan** — the one handover |
| Worker test deploy | Claude |
| Pi production build + restart | Claude — SSH works and `systemctl restart lanna-care` is passwordless |
| Pi test build + restart | Claude — same |
| Verification, release record | Claude — **and the record PR is merged by Claude too, without asking** |

**Two touches, and count them.** A release should cost Lutan exactly two
interventions: **major versus minor**, and the production Worker deploy. `0.28.0`
cost him five — those two plus both PR merges and the migration apply — and he
raised it. **If a release asks him for a third, record it in the release record
as an avoidable cost**, with what caused it, the same as any other defect.

**The record PR is not a gate.** By the time it exists the release is deployed
and verified. Merge it and tell him; never say "ready to merge when you say"
about it, which invents a blocker out of bookkeeping.

**Do not idle.** The Pi production build does not depend on the Worker deploy —
start it as soon as the cut is merged and let the two run in parallel. `0.15.0`
sat waiting on a handover that did not need to be sequential.

---

## The paperwork has a time budget too

Lutan, 2026-10-20, after `0.38.0`: *"we started the release hours ago and it was
released at least an hour ago but all the paperwork seems to be taking a huge
amount of time to complete which is causing these conflicts."* He was right, and
the conflicts were a direct consequence: that release's record PR was blocked
twice by a check it could not affect, because a documents PR took long enough for
three feature streams to move `main` underneath it.
`docs/decisions/2026-10-20-release-paperwork-speedup.md` has the measurements.

**The release is finished when it is deployed and verified. Everything after that
is bookkeeping, and bookkeeping is allowed to be short.** Five rules, all agreed
2026-10-20:

1. **A documents-only PR skips the heavy CI jobs.** `scripts/check-docs-only.mjs` decides, and `ci.yml` gates everything except `test-plan` on it. Nothing to do — but **do not "fix" a documents PR by touching code to make a check run**, and if you find yourself waiting on `check` or `public-views` for a diff of markdown, something has gone wrong with the gate rather than with the PR.
2. **One worktree and one PR per release.** The cut gets a worktree; **the record and the handover go in that same worktree after the cut's PR merges**, not a second one. A fresh worktree costs a four-minute `npm ci` to hold two markdown files. If the cut's worktree is already gone, reuse any free leftover before making a new one.
3. **The record and the handover are one PR.** They are written at the same moment, from the same facts, by the same person. `0.37.2` used two PRs (#760, #761) and paid two CI cycles for it.
4. **The handover is a DELTA, and it has a ceiling.** It says what changed since the last edition, what is open, and where things stand — nothing else. **Aim for about 100 lines and treat 150 as the limit.** Anything durable gets **promoted into this file once** rather than recopied every release, and anything the record already says is cited, not repeated. `0.38.0`'s first draft ran to 300 lines, most of it re-deriving this runbook; roughly 45 minutes of the hour after deployment went on writing documents that largely restated each other.
5. **Draft the record while the deploys run.** There are ~25 minutes of unavoidable waiting in every release — two Worker deploys at nine or ten minutes and two Pi builds at five. The record's header, what-shipped, why-major and before-the-deploy sections are all knowable before the first deploy finishes. Write them then, and fill in results afterwards. Do not poll a log you are already being notified about.

**What none of this touches:** the test plans, the mechanical cut verification, the
smoke test, and the two signatures. Those are the checks, and on `0.38.0` they
each caught something real — a release note that would otherwise have shipped
invisibly, and a public-view narrowing that had to be read in code to be known
safe. **Shorten the prose, never the checking.**

**And when the paperwork is overtaken, say so in it.** Twice on `0.38.0` an item
the record called open was closed by another stream before the record merged, and
one inference written into the handover ("the byte gap grew, so it is less likely
a rounding artefact") was simply wrong — two data points turned into a trend.
A record that corrects itself is worth more than one that reads as though nothing
moved.

---

## 0. Read the last release's record first

**Before anything else, read `docs/releases/<most recent>.md` end to end.** It is
the only place that says how the last one actually went: who ran which step, what
broke, and what was left open. `0.15.0` went wrong mainly because this was not
done — `0.14.0`'s record states plainly that Claude built the Pi over SSH, and
its test plan records the major-versus-minor call as "confirmed in chat by
Lutan". Both were sitting in the repo, unread, while this session guessed at
both and got both wrong. A session that starts cold on `main` has none of the
previous release's context except that file.

## 1. Before anything

In `C:\Development\Animal_Shelter_App` (the main checkout, always on `main`):

```bash
git checkout main && git pull
```

Fold in the backlog branch if it has anything (`git log --oneline main..backlog`),
then push, then fast-forward `backlog` to `main`.

**Then `npm ci` in the main checkout, before any deploy.** Added after `0.28.0`,
where it was nearly missed. That checkout had `next@16.3.5` installed while
`package.json`, the lockfile and both Pi builds had **16.3.8** — a dependency
bump had merged and `npm ci` had never been re-run there, so the first test
Worker build was made from something the lockfile does not describe.

**Every guard passed.** `deploy.mjs` verifies the commit, the project ref and the
env vars, and says nothing about `node_modules`; the release SHA was correct on
all four builds, so the usual claim that all four came from the release SHA would
have been true and materially false, with the Worker fallback running a different
Next from the Pi that serves everyone. The Pi clones run `npm ci` inside
`deploy-pi.sh`, which is exactly why they were right and the laptop was wrong —
that asymmetry is the tell, and it recurs every time a dependency bump merges
between releases.

It was caught by reading the build banner, which is the only place it is visible.
So: run `npm ci` here, and **read the `Next.js version :` line on the first Worker
build against `package.json`** anyway.

## 2. Work out what is in the release

The previous release's **deployed SHA** is in its `docs/releases/<date>.md` header.

```bash
node scripts/release-prs.mjs <previous deployed SHA> HEAD
```

It must **exit 0**. Non-zero names a migration or test plan belonging to no PR in
the list, which means a PR is missing — find it on GitHub and add it by hand.

A gap in the PR numbers is not automatically a problem: in `0.15.0` the list ran
#300, #301, #303–#305 and `#302` *was* the previous release's own deployed SHA.
Check with `git merge-base --is-ancestor <sha> <previous deployed SHA>` rather
than reasoning about the numbering.

## 3. Read every test plan in the release

Open each `docs/test-plans/<feature>.md` and read its **Sign-off** section.

- `Manual verification by: n/a: <reason>` — nothing to look at, fine.
- `Manual verification by: <name>  Date:` — someone looked, fine.
- `Manual verification by: pending: …` — **stop and put it to Lutan.** The
  template's rule is "nothing ships on a `pending:` — the release manager's
  pre-deploy pass is what holds that line, not CI". It is his call, not a thing
  to absorb silently, and whichever way he decides it goes in the release record:
  a closed item, or a stated gap. `0.15.0` shipped with three plans unsigned and
  eleven outstanding items, on his explicit decision.

Never copy another plan's outstanding items into the cut plan's own
**Left for manual verification** table — they belong to their plans and their
signatures, and copying them gives them a second home that nothing closes.

## 4. Cut the release

Its own small PR, from its own worktree — never in the main checkout:

```bash
node scripts/worktree.mjs new cut-release-0-15-0
```

In that worktree: move everything in `unreleased` into a new entry at the top of
`releases` (version, today's date, a title, `major`), empty `unreleased`, and set
`package.json`'s `version` to match. A major bump moves the middle number and
**mails every admin**; anything else moves the last.

**Ask Lutan whether it is major or minor, before cutting.** It is his call, not
a judgement to make and mention — it decides whether every admin gets an email,
and once the production deploy has run it cannot be taken back. `0.14.0`'s plan
records the decision as "confirmed in chat by Lutan"; `0.15.0` did not ask, and
he raised it. Ask it together with anything else the cut needs from him (a note's
wording, a role tag), in one round rather than three.

**Verify the cut mechanically — do not read it over.** A cut's one real failure
mode is losing or altering a note, and that is invisible to every gate. Compare
the new entry against `origin/main:src/lib/releases.ts` note by note and assert:
every note carried across unchanged, nothing lost, nothing invented,
`majorReleasesSince("<previous version>")` returns exactly the new version,
`package.json` equals the newest entry, the file order still matches
`compareVersions`, and the notes render with no `[object Object]` or `undefined`.

Then `node scripts/gates.mjs` (must end `typecheck=0 lint=0 build=0`),
`node scripts/check-release-guards.mjs`, a filled-in
`docs/test-plans/cut-release-<version>.md`, `gh pr create`, CI green, merge.

**If anything in the entry changes after the gates run — even a role tag — re-run
the gates and the comparison.** The tempting assumption is that a data-only edit
cannot break a build.

## 5. Migrations, before any deploy

```bash
node scripts/apply-migrations.mjs --env production --status
node scripts/apply-migrations.mjs --env production --dry-run
node scripts/apply-migrations.mjs --env production
```

Both deploy paths refuse a commit whose database lacks a migration that is on
`main`, so this is not optional even when nothing in the release reads the new
columns. Re-run `--status` afterwards and read `0 pending` and a clean drift
check before moving on.

**Pull the main checkout before you apply, not after.** The step above assumes
`main` is current and does not say so. On `0.20.0` the five migrations were
applied and the deploy that should have followed within seconds was refused:

```
deploy: production deploys only from a clean, pushed main:
  - main and origin/main differ (6 behind / 0 ahead)
```

The PRs had been merged **on GitHub** and the local checkout had not pulled, so
production ran the old code against the new policies until someone noticed.
Two of that release's files narrowed read policies, so the window was not
cosmetic: empty medication, diet and vaccine lists, and an empty Contacts page.
The guard behaved correctly — it refused to ship the old release — but the
`Apply them first` line it prints one step earlier is generic, and in that state
following it is what opens the window. **Merge, pull, apply, deploy, in that
order**, and confirm `git status -sb` says neither ahead nor behind before the
apply rather than after it.

## 6. Deploy

Deploy **test first** where the release allows it. Check what is on test before
overwriting it — it is sometimes deliberately an integration build that exists
nowhere else:

```bash
curl -s https://test.lannacare.org/api/version
```

### Worker, production — Lutan runs this

```bash
node scripts/deploy.mjs --env production
```

**Not `npm run deploy:prod`.** `npm.ps1` is blocked by PowerShell's execution
policy on this machine (`npm : File C:\Program Files\nodejs\npm.ps1 cannot be
loaded`). `npm.cmd run deploy:prod` works, but the bare `node` form has no
wrapper to go wrong and is what should be handed over.

Hand it over **with a `tee`**, because the lines worth reading print before a
three-minute build and scroll out of the terminal buffer:

```bash
node scripts/deploy.mjs --env production | tee deploy-<version>.log
```

The `deploy: production → Supabase project dbkodyyxxhtygxcxmfcu (<sha>)` line
was missed for this reason on `0.15.0`, `0.15.1` and `0.16.0` — three releases
running, each time recorded as a gap and each time settled indirectly. Also read
`strip-baked-env: removed N env var(s)` and the `Server Actions key <fingerprint>`
line, which must match what the Pi build printed.

**Setting a production secret by hand** (`wrangler secret put`) makes a new Worker
version from the same code with no tag, so the Release tile on `/admin/status`
goes amber ("The Worker has no release tag") until the next deploy through
`deploy.mjs`. That is expected and not a regression. The check cannot tell it from
a deploy that skipped the script, so if nobody set a secret, ask who deployed.
(`docs/decisions/2026-10-16-untagged-worker-stays-amber.md`.)

This deploy is also what **mails the admins** on a major release. The Pi deploy
does not mail, and neither does test (`RELEASE_MAIL_ENV` is `""` there).

### Worker, test — Claude runs this

```bash
npm run deploy:test
```

### The Pi — Claude runs this

Production is served by the Pi; the Worker is the fallback. A Worker deploy alone
does **not** update what users see.

**But the converse is also true, and it is less obvious: a Pi deploy does not
update the response *headers*.** The Worker adds them
(`worker/security-headers.mjs`), so the Content-Security-Policy, and anything
else set there, changes at the moment the **Worker** deploy runs — which on
production is Lutan's command. See the trap below before verifying any
header-related change.

```bash
ssh lutan@lanna-pi.local 'cd ~/Animal_Shelter_App && ./scripts/pi/deploy-pi.sh'
ssh lutan@lanna-pi.local 'cd ~/Animal_Shelter_App_test && ./scripts/pi/deploy-pi.sh --env test'
```

**Run it detached with a log, not in the SSH foreground.** The build takes longer
than the foreground tool timeout, and a timeout kills the SSH session mid-build:

```bash
ssh lutan@lanna-pi.local 'cd ~/Animal_Shelter_App && rm -f ~/deploy-prod.log && setsid nohup ./scripts/pi/deploy-pi.sh > ~/deploy-prod.log 2>&1 < /dev/null & sleep 20; tail -15 ~/deploy-prod.log'
```

then poll with `sleep <n>; tail ~/deploy-prod.log`.

**Check the log has `deploy-pi: restarting under the script from <sha>`.** That line means the
script from the release commit is the one that ran, so its guards (swap, `.next.prev`, asset
check) are live on this very deploy. If a clone's `deploy-pi.sh` predates that fix (the first
deploy that brings it in), the line is absent and the guards the release added did NOT run: do
them by hand (swap, `node scripts/pi/check-assets.mjs`) and say so in the release record. The script ends with
`deploy-pi: lanna-care running` and a `served by: x-lanna-served-by: pi` line it
checks itself.

### Purge the Cloudflare cache — Claude does this, after every Pi deploy

A Pi deploy rewrites `.next` while requests keep arriving, and Cloudflare keeps
whatever it saw at `/_next/static/**` for a year. From the **main checkout**, after
both Pi builds:

```bash
node scripts/purge-cache.mjs --env production
```

It purges the zone and then proves the purge took rather than trusting the API's own
"success": where it can it re-runs the asset check, and where it cannot it prints the
command to run on the Pi. **It runs here, not on the Pi, so no Cloudflare credential
lives on the internet-facing box** —
`docs/decisions/2026-10-18-purge-from-the-deploy-machine.md`.

It needs `CLOUDFLARE_PURGE_TOKEN` in `.env.deploy.production` (an API token scoped to
**Zone → Cache Purge** on the one zone; `CLOUDFLARE_ZONE_ID` is already there, so
this is one new value). **The token expires 2027-12-31 — renew it before then, or the purge step starts refusing.** **If it is missing the script refuses and names exactly what
to create**, and the fallback is unchanged — **Cloudflare dashboard → Caching →
Configuration → Purge Everything**, which is Lutan's step — then re-run the check on
the Pi:

```bash
ssh lutan@lanna-pi.local 'cd ~/Animal_Shelter_App && node scripts/pi/check-assets.mjs --url https://lannacare.org/'
```

The script builds into `.next.new` and renames it over `.next` only once it compiled, so a request never meets a half-written build; it probes the Pi on loopback **with the origin key** (production answers `Forbidden` without it); and the asset check below runs from an exit trap, so a failure in an earlier step can no longer skip it. A `DEPLOY FAILED` banner is believed — but if the probe line says `serves 'nothing'`, confirm with `https://lannacare.org/api/version` before rolling back, and **run the asset check by hand either way**.

`deploy-pi.sh` already runs that check as its last step and **fails loudly** if the
served stylesheet differs from the build; a red result there means purge, then re-run.
**Purge even when the check is green**: it only samples the edge it reaches, and a
phone on mobile data may reach another. Symptom of a missed one: the app renders with
no styling (white, serif, no orange) while the content is current.

**One caveat before you rely on any of this:** a change to `deploy-pi.sh` takes
effect on the **next** deploy, not the one that ships it — the script checks out the
new ref over the file bash is already executing. On a release that changes it, run
its checks by hand (`docs/releases/2026-10-18.md`, Defect 1).

### When a Pi build is killed

If one clone builds and its twin does not on the same machine, run `du -sh .next .next/cache node_modules` on both **before** theorising about the machine. A bloated `.next/cache` (4.4 GB on 2026-10-19) starves the build; `deploy-pi.sh` now removes it above 1 GB. A failed build prints a boxed `DEPLOY FAILED` banner and exits 1; a deploy also fails if `/api/version` does not show the new version.

## 7. Verify

`docs/release-smoke-test.md` is the checklist. What can be done without an
account:

```bash
curl -s https://lannacare.org/api/version
curl -s https://test.lannacare.org/api/version
ssh lutan@lanna-pi.local 'cd ~/Animal_Shelter_App && git log --oneline -1; cd ~/Animal_Shelter_App_test && git log --oneline -1; systemctl is-active lanna-care lanna-care-test'
```

The edge-cache check must be done **in a real browser**, not with curl — curl
sends no `locale` cookie and gets `BYPASS` every time, proving nothing. From the
browser pane, fetch the page twice and read `x-lanna-cache` and
`x-lanna-served-by`.

Everything behind sign-in is Lutan's, and so is the signed-out public tour while
`PUBLIC_SITE` is `locked` — anonymous visitors get the "STAFF TESTING SITE" gate,
so `/`, `/adopt` and the rest cannot be checked without an account.

**Drift, both databases, explicitly.** `--status` prints a comparison, but run
the named check and quote it, because it is the one that reads as a drift check
to whoever reads the record afterwards:

```bash
node scripts/apply-migrations.mjs --drift production
node scripts/apply-migrations.mjs --drift test
```

Both must end `No drift: <env> matches origin/main`, with `0` in each direction.
Dev matters as much as production: it is the database test runs against, so
drift there invalidates test as a pre-production check.

**Confirm the release mail actually arrived — do not stop at "sent 1".** The
deploy prints `deploy: release mail for <version> [UAT]: sent N, skipped M`;
that is the relay accepting it, not delivery. Check the inbox for the message
from `releases@lannacare.org` with the version in its subject.
`lannacareforanimals@gmail.com` is expected to be skipped with
`E_RECIPIENT_NOT_ALLOWED` — the shelter's own address refused by the relay, a
known open question, not a delivery failure.

## 8. Record it

Copy `docs/release-smoke-test.md` into `docs/releases/<yyyy-mm-dd>.md` — or add a
`## <version>` section to that day's file if one already exists, as 2026-10-02's
holds four. Fill in the header (deployed SHA, PRs, migrations, run by), what was
checked, and **what the record cannot say**. Commit it on a feature branch and
open a PR — never straight to `main`, the record included (Lutan, 2026-10-03;
`0.15.0`'s record was pushed to `main` and had to be reverted). It is a record,
not a gate.

---

## Traps

Every one of these cost real time. They are not hypothetical.

**PowerShell blocks `npm` and `npx`.** `npm.ps1 cannot be loaded because running
scripts is disabled on this system`. Hand over `node scripts/<script>.mjs`, or
`npm.cmd` / `npx.cmd`. Never `npm run …`.

**`&&` and `||` do not exist in Windows PowerShell 5.1.** Lutan's shell is
`powershell.exe`, not PowerShell 7: `&&`, `||`, `?:` and `??` all belong to 7.
A command joined with `&&` fails to parse, so **neither half runs** — and the
half you will assume ran is the second one. Hand over **one command per line**,
or `A; if ($?) { B }`. Two things that *do* work and are worth not
second-guessing: `| tee` (an alias for `Tee-Object`, which is why the deploy
line is safe, and why its log is **UTF-16** — `tr -d '\000'` before
grepping), and `&&` **inside a quoted `ssh` argument**, because that is bash
on the Pi parsing it, not PowerShell:

```bash
ssh lutan@lanna-pi.local "cd ~/Animal_Shelter_App && ./scripts/pi/deploy-pi.sh --ref <sha>"
```

**`ssh host 'sudo …'` cannot prompt for a password.** No TTY, so it dies with
`sudo: a terminal is required to read the password`. Use `ssh -t` for anything
that needs a password — and check first whether it needs one at all.

**The Pi's passwordless sudo is four commands, nothing else:**
`systemctl restart lanna-care`, `systemctl restart lanna-care-test`, and
`is-active --quiet` for both. Everything else needs Lutan at a terminal. A
normal deploy needs nothing more, because both clones are owned by `lutan` — if a
deploy suddenly wants a password, something has become root-owned and *that* is
the fault to fix.

**Ask `/api/version`, never `/api/releases/current`, for what an environment is
running.** `/api/releases/current` is bundled into the Worker and answers from
it, so it reports the Worker's version whatever the Pi is serving — on `0.15.0`
that showed test as updated for forty minutes while it served the previous
build. `/api/version` is answered by the app (`src/app/api/version/route.ts`,
PR #290, there since `0.14.0`) and returns the version **and the commit sha**,
so it can be compared against `main` rather than believed. Side by side on
production, moments apart:

```
/api/version            x-lanna-served-by: pi       {"version":"0.16.0","sha":"4a626930869db06d482c747a29fa257f4a823d63"}
/api/releases/current   x-lanna-served-by: worker   {"version":"0.16.0"}
```

The endpoint existed through two releases that were checked the wrong way, and
through the first draft of this document, which named the trap without naming
the remedy. Check `x-lanna-served-by` on whatever you ask.

**A git-updated clone is not a deployed clone.** `deploy-pi.sh` fetches before it
builds, so a run that fails partway leaves the clone's source at the new SHA with
the old build still being served. `git log -1` alone will tell you it is updated
when it is not — check the service and the served version too.

**Never run `setup-test.sh` (or `setup.sh`) with `sudo`.** They use `sudo` only
for their own systemd lines. Running the whole script as root makes root the
owner of `node_modules`, `.next`, `next-env.d.ts` and `.env.production.local` —
57,249 paths in the `0.15.0` case — and every later deploy fails with `EACCES`.
Recovery is an interactive `sudo chown -R lutan:lutan <clone>`; the husk cannot
even be deleted without root, because the directories holding it are root's.
A root-owned *file* can be moved aside without sudo (that needs write on the
parent directory, not the file) but a root-owned *directory tree* cannot.

**A production release goes to test as well, from the same commit.** Test drifting
*behind* production makes it useless as a pre-production check. Test being ahead
between releases is fine.

**Two builds in one worktree collide.** Never run `gates.mjs` twice at once in the
same checkout; a build that fails in seconds rather than minutes is contention
until proven otherwise. A build that *passes* in seconds is usually a warm
Turbopack cache from an earlier run of the same tree — still check each gate's
own exit code rather than assuming either way.

**A Pi deploy cannot change a security header, and test will lie to you about it
in the window between the two deploys.** On `0.21.0` the Pi test build finished
first, so `test.lannacare.org` reported `0.21.0` **and was still sending
`content-security-policy-report-only`**, because the test Worker deploy was still
running. Checking the policy at that moment would have reported "report-only,
nothing to see" and passed the gate having verified nothing at all.

The same two-endpoint check this document already prescribes for *versions* is
the check for *headers*: `/api/version` is answered by the app (the Pi) and
`/api/releases/current` from the Worker bundle. When they disagree, the Worker is
behind, and **any header you read is the old one**. Verify a header change only
once both report the release.

**Read an exit code from the script, never through a pipe.** `release-prs.mjs`
exited **1** naming a test plan that belonged to no PR in its list; run as
`… | tail` it reported **0**, and `0.21.0` was briefly recorded as eleven PRs
instead of twelve — the missing one had been **squash-merged**, so it had no
merge commit carrying its number. The same trap then caught `gates.mjs`, handed
back as "completed (exit code 0)" when that was `tail`'s status. Redirect to a
file and read `$?` from the command itself:

```bash
node scripts/release-prs.mjs <prev sha> HEAD > /tmp/out.txt 2>&1; echo "exit: $?"
```

The test-plan template names this trap for `npm run build | tail`; it applies to
every script in this runbook, and `| tee` is the one safe exception because it
passes the status through.

**`main` moves under you during a release.** On `0.21.0` it moved 24 commits —
including a large feature — between the deploy and the record being written. So:
pin both Pi builds with `--ref <release sha>` rather than letting them fetch
`main`'s tip, re-check `git status -sb` against `origin/main` immediately before
handing the deploy over, and **diff a branch against its merge-base, not against
`origin/main`**. Comparing a two-file docs branch against a moved `origin/main`
produced a thirty-file diff of someone else's feature and made it look as though
the branch had deleted half the app.

**Write a security checklist against what the *browser* fetches.**
`csp-enforce`'s manual list named the Management dashboard visitor count as a CSP
risk. It is not one and could not be: that figure is fetched **server-side** from
Cloudflare's GraphQL API, and CSP governs only what the browser loads. It also
has never shown a number, because `CLOUDFLARE_ANALYTICS_TOKEN` and
`CLOUDFLARE_ZONE_ID` are unset. The row cost Lutan's attention at the one moment
the release was waiting on him.

**When `main` moves mid-release, read what is deploying — do not reason about
it.** Added after `0.38.1`, where this was the release's only avoidable cost. A
docs-only commit (#787, the planner's handover) merged nine minutes after the
cut. The release manager inferred that Lutan's Worker deploy would therefore
build from the new tip and break the "all four builds from one SHA" property, and
rebuilt both Pis to the new SHA to match. **His deploy had already started, from
the original release SHA, and said so in its first lines** — in the log he was
`tee`-ing into the checkout:

```
deploy: production → Supabase project dbkodyyxxhtygxcxmfcu (1de7bdb4)
```

So the Pis were moved away from what was shipping and had to be moved back, which
left Cloudflare holding the intermediate build's HTML. `check-assets` caught it
from `deploy-pi.sh`'s exit trap:

```
check-assets: FAILED — the served stylesheet is not the one just built.
  This is what a poisoned Cloudflare cache looks like: the app renders with no styling.
```

**Doing nothing would have been correct** — all four builds were already on one
SHA. So: **the pin for a Pi build is the shipped SHA, never `main`'s tip**, and
when `main` moves, one `grep` of the deploy log settles it. If you do rebuild a Pi
after the edge has seen another build, **purge before you believe the site**, then
re-run `check-assets.mjs` on the Pi. And **believe a red `check-assets`**: it was
right and the session was wrong, on a release that shipped a change to that very
script.

**The zone purge covers `test.lannacare.org` as well as `lannacare.org`.** They
are one Cloudflare zone, so `purge-cache.mjs --env production` clears both.
`purge-cache.mjs --env test` **refuses with exit 2** — `CLOUDFLARE_ZONE_ID` and
`CLOUDFLARE_PURGE_TOKEN` live in `.env.deploy.production`, not `.env.local` — and
that is usually irrelevant for exactly this reason. **Confirm by re-running the
test asset check rather than assuming it either way.** Only worth fixing if test
ever needs purging on its own.

**`gh pr merge` printing nothing at all is neither success nor refusal.**
`0.38.1`'s cut merged with no output whatsoever. **Always re-read the state** —
`gh pr view <n> --json state,mergedAt` — which is the same rule the 502 trap
above gives, for a case that looks nothing like a 502.

**An absence-check needs a presence-check beside it.** On a minor release the mail
check is that `majorReleasesSince("<previous>")` returns nothing — which an
always-empty function would also satisfy. Assert the emptiness *and*, in the same
run, that the function still finds the previous major when asked from further
back, and print both. `0.38.1` paired `majorReleasesSince("0.38.0") → []` with
`majorReleasesSince("0.37.2") → ["0.38.0"]`.

**`git checkout main` in a second worktree is refused** (`'main' is already used
by worktree at …`), because the main checkout holds it. To reuse the cut's
worktree for the record — which rule 2 of the paperwork budget requires — create
the branch there and then `git reset --hard origin/main`.

**A predicted `-- consumer:` warning that does not appear is fine.** It means the
declared consumer file is unchanged since the live release, so its reader was
already live and the schema landed under code that already reads it — the safest
order there is. One `git diff --stat <previous release SHA>..HEAD -- <the file>`
proves it. **Over-predicting warnings is free; the point is that none surprises
you.**
