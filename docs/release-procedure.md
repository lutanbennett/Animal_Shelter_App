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
migrations, the test and UAT Worker deploys, **all three Pi builds and their
service restarts**, the verification and the record.

**There are THREE environments to ship, not two.** UAT went live at
`uat.lannacare.org` on 2026-11-08 and Lutan said the same day that it *"is now part
of the standard release process"*. It is the customer's acceptance-test site: its
own Supabase project (`fsjagxmxjosauwmxwype`, on a second Supabase account), its own
Drive copy, its own Pi service, **and a copy of production's real people in its
database** — which is why it never mails and why its deploy is not a thing to
improvise. Everything below that says "test and production" now says UAT too, and
each step names it.

If a step appears to need him for anything else, that is a **fault to fix, not a
handover**. In `0.15.0` the test clone had been left root-owned, which made a
password-prompting `sudo` look like a thing to pass over; the right response was
to recognise it as damage and fix it, not to add it to his list. The two genuine
exceptions, both of which should be rare enough to be remarkable:

- a `sudo` password on the Pi, which only an already-broken clone should need
- anything behind a sign-in on `lannacareforanimals.org`, since Claude has no account there

| Step | Who |
|---|---|
| Cut PR, gates, CI, **merge** | Claude — **merged as soon as CI is green, without asking** (2026-10-13) |
| Production migrations | Claude — `apply-migrations.mjs --env production` from the **main checkout**, under a user-settings allow rule added 2026-10-13 |
| **UAT migrations** | Claude — `apply-migrations.mjs --env uat` from the **main checkout**. The token was never short of a permission (see *What UAT needed once*, item 1); Lutan applied UAT's migrations with it on 2026-11-08, and no Claude session has run the apply itself yet, so the first one says whether a permission prompt stops it |
| **Worker production deploy** | **Lutan** — the one handover |
| Worker test deploy | Claude |
| **Worker UAT deploy** | Claude — `--no-mail` is no longer needed to stop the mail, but say it anyway |
| Pi production build + restart | Claude — SSH works and `systemctl restart lanna-care` is passwordless |
| Pi test build + restart | Claude — same |
| **Pi UAT build + restart** | Claude — the Pi's sudo rule covers `lanna-care-uat` since 2026-11-09, so the deploy restarts it itself (*What UAT needed once*, item 2) |
| Verification, release record | Claude — **and the record PR is merged by Claude too, without asking** |

### What UAT needed once, and all three are now done

**DONE 2026-11-09. Nothing here is outstanding, and a UAT release has no manual last
mile.** All three are kept below rather than deleted, each marked superseded in place,
because release records, decision files and test plans written before that date
describe them as open — and because what each turned out to be is worth knowing.
**Two of the three were never what they looked like:** item 1 was not a missing
permission at all, and item 2 was damage to fix rather than a job to hand over.

1. ~~**UAT's Supabase access token cannot read its own database.**~~ **SUPERSEDED
   2026-11-08: it can. The `database_read` refusal was the wrong account's token:** the shell's `SUPABASE_ACCESS_TOKEN` (the OTHER Supabase account's) used to beat UAT's own, and since 2026-11-08 `scripts/lib/env.mjs` makes the environment file's token win (`ACCOUNT_KEYS`; `docs/decisions/2026-11-08-uat-go-live-findings.md`).
   Measured the same day: `apply-migrations.mjs --status --env uat` refuses with the shell's token and
   reads `339 applied, 2 pending` with UAT's; Lutan had applied UAT's migrations with it earlier that
   day. Nothing to do in any dashboard.
2. ~~**The Pi's passwordless sudo does not cover `lanna-care-uat`.**~~ **SUPERSEDED
   2026-11-09: it does.** Lutan added UAT's two commands to that file, and `sudo -n -l`
   now lists all six — `restart` and `is-active --quiet` for all three services —
   with `sudo -n systemctl is-active --quiet lanna-care-uat` answering with no prompt
   and the file still `0440 root:root`. A UAT Pi deploy reaches its own restart. *The
   problem as it was:*
   `/etc/sudoers.d/lanna-care-restart` names `lanna-care` and `lanna-care-test` only
   (read 2026-11-08: `sudo -n systemctl is-active --quiet lanna-care-uat` answers
   *a password is required*), and `deploy-pi.sh --env uat` ends in
   `sudo systemctl restart lanna-care-uat`. So the UAT Pi build stops at its last step
   for a password. This is the `sudo`-password exception above, and per that paragraph
   it is **damage to fix, not a handover to add**: two lines in that file.
3. ~~**`.env.deploy.uat` has no `CLOUDFLARE_PURGE_TOKEN`.**~~ **SUPERSEDED 2026-11-09:
   it has one, and deliberately not production's.** Production's purge token can reach
   both zones, so copying it across would have worked and would have put a key that can
   wipe production's cache into UAT's file; the token Lutan created is scoped to **Cache
   Purge on the `lannacare.org` zone alone**, verified by asking Cloudflare which zones
   it can reach. `purge-cache.mjs --env uat` then purged and proved it with a `CF MISS`
   re-fetch. *The problem as it was:* UAT's edge cache had
   never been purged. `CLOUDFLARE_ZONE_ID` is already there and is the right zone
   (`lannacare.org` serves both `test.` and `uat.`); the token is the only missing
   value, and `purge-cache.mjs --env uat` names exactly what to create.

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

**But never run two WORKER deploys at once, and this is exactly what "do not
idle" does not license. There are now THREE of them** — `--env test`, `--env
production` and `--env uat` — and every one runs `next build` in the **main
checkout**, so starting one while another is building kills the second in seconds:

```
⨯ Another next build process is already running.
deploy: `npm run opennext:build` exited with 1
```

On `0.40.3` the release manager started the test deploy and handed Lutan the
production command in the same message. His died, the Worker fallback sat a
release behind for forty minutes, and **it cost him two extra touches on a
release whose target is two** — the retry, and a second message after the retry
had not happened. Users were never affected, because the Pi serves the app and
was already on the new release; that is precisely why nobody noticed quickly.

This document already warns *"Two builds in one worktree collide"* under Traps.
That was written about `gates.mjs`, and the deploys are the same hazard in a
place nobody thought to look. **So: the Worker deploys are strictly
sequential.** Deploy test, see it finish, then hand the production command over —
or hand his over first and wait — **then UAT last, after his has finished.**
Adding UAT made the queue three long, so the discipline matters more, not less:
**his is the one that must not be killed**, which is why UAT goes at the back.
**What genuinely parallelises is the Pi builds**, which build on the Pi and touch
nothing in the main checkout.

**And confirm a deploy from the Worker, never from "it finished".** A failed
deploy also finishes. `0.40.3` was told "it looks like it has deployed" when it
had not: the log's mtime was 40 minutes stale and byte-identical to the failed
run, `/api/releases/current` still answered the old version, and the terminal
showed the old stack trace above an idle prompt. Any one of those three settles
it in seconds — `wrangler deployments list --env production` is the definitive
one, and its `Version(s)` must match the deploy log's `Current Version ID`.

---

## A release cuts what the build gave it

**Lutan, 2026-11-01, after `0.41.1` took about an hour and a half against a ~40-minute target:**
*"Do not add scope that was not provided through a build. If something is missing call it out but
don't just add it into your scope."* And, naming the cause himself: *"root cause: You did work that
you weren't supposed to."*

**The rule, in one line: a release ships the commits that are already on `main`. It does not write
any.**

What happened, because the shape of it is what recurs rather than the particular package. `0.41.0`'s
handover said *"the next release owes its removal"* of a dependency Lutan had ruled out. The `0.41.1`
release manager read that as an instruction to itself, built the removal as its own PR **before the
cut** — a worktree `npm ci`, four gates, a twelve-minute CI run and a merge — and put about 32 minutes
in front of a release that was otherwise ready to cut. **The work was correct and the release was the
wrong place for it.** He asked four times why it was taking so long.

**What to do instead, and it is two lines of your report, not a stream:**

- Name the missing or owed work, say plainly that it is **not** in this release, and leave it. The
  planner schedules it as a stream; that is what the planner is for.
- If it genuinely blocks the release — a migration the deploy guard will refuse, a broken gate — then
  it is not out-of-scope work, it is the release stopping, and you say so and stop rather than
  quietly fixing it.

**Two things to expect downstream when a release does run long, and NOT to write up as faults of their
own:** `main` moves under the deploy (read what is deploying, as the trap below says, and do nothing
if the code-identity diff is empty), and `--drift test` starts reporting other streams' migrations as
they finish. Both were recorded as findings on `0.41.1` and both were symptoms. A release that cuts
promptly has neither.

**For whoever writes the handover:** a sentence saying the next release *owes* something will be read
as an instruction to the next release manager, because that is who reads it. Write it as *"owed, and
not in the release — for the planner"*, or do not write it in this file at all.

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

## Two standing facts, promoted here so they stop being recopied

Both appeared in every handover edition for several releases, which is the signal
that they belong in the runbook instead (paperwork rule 4).

- **A major release currently mails ONE person.** The shelter's own address is not on the production admin list, so "mails every admin" overstates the lever and makes the major-versus-minor choice a false one. **Tell him plainly when the call comes up.** Several releases running have sent no mail at all, and the `E_RECIPIENT_NOT_ALLOWED` skip older editions mention has not recurred in that time.
- **`test-plan` is ADVISORY, permanently** (Lutan, 2026-10-20: *"we will NOT make this mandatory it stays as advisory"*). Do not raise it, and do not list it as a decision he owes. **If you find branch protection requiring it, say so rather than assuming it was intended** — as of 2026-10-23, `main` has no branch protection at all.

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

**Then read what is live on all three, before deciding anything.** Two commands,
and they have paid on five consecutive releases:

```bash
git log --oneline -1
node scripts/apply-migrations.mjs --env production --status
```

and, since UAT joined the standard process, what UAT is actually serving — it is
deployed last, so it is the one most likely to be a release behind:

```bash
curl -s https://uat.lannacare.org/api/version
node scripts/assert-schema.mjs --env uat
```

`node scripts/apply-migrations.mjs --status --env uat` works too (the old `database_read` refusal was
the shell's token from the other account; see *What UAT needed once*). And note the version it answers is **not** proof of the
commit: UAT can be serving the right version number from a later `main` than the
release, because `deploy-pi.sh` ships `origin/main`. Read the SHA in the same
answer.

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

### Audit the production dependencies (every release, before any deploy)

The PR `audit` job runs only on a PR that changes `package.json` or `package-lock.json`
(Lutan, 2026-10-25; `docs/decisions/2026-10-25-audit-on-releases-not-every-pr.md`), so this
is the step where the advisory check is made by someone who will act on it. A new advisory
about a package that merged weeks ago is caught by the daily `advisories.yml` run within a
day and, at the latest, here.

On the release SHA (the main checkout, after the `npm ci` in step 1):

```bash
npm run audit:prod
```

- **Nothing high or critical** — fine; write "audit: clean" in the release record.
- **A high or critical** — either it already has a decision file saying why it is not
  reachable in this app (`docs/decisions/`; name it in the record), or **stop the release**
  and fix it, then audit again. Do not carry on to the cut on the grounds that the PR check
  is `continue-on-error`: that flag stops a *PR* being blocked, and this is not a PR.
- **Inconclusive** (the registry timed out, no advisory printed) — run it once more; if it
  is still silent, say "audit inconclusive" in the record rather than "clean".
- Never `npm audit fix --force`: it can move a dependency backwards across a major
  version (it offered to drag the Cloudflare chain back to `wrangler@4.15.2` on 2026-10-07).

Record the result under "Before the deploy" in the release record.

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

**Ask about the EMAIL, never about "major or minor".** Promoted here after `0.40.1`,
where the ambiguity nearly sent the wrong release. The two words mean different
things to the two sides of the conversation:

- In Lutan's usage, **"minor" is the middle-number bump** — `0.39.5 → 0.40.0` — and that release **mailed**.
- In this repo, the `major` boolean means **"worth an email"**, not semver major, and `0.40.0 → 0.40.1` is the last-number bump that mails **nobody**.

So "minor" fits both `0.41.0` *with* mail and `0.40.1` *without* it, and a session
offering the words as options will get an answer it cannot interpret. `0.40.0`'s cut
plan named this trap in writing, and **it still nearly bit the very next release**,
because the fault is in the question rather than in the data — which is why naming it
in a handover was not enough and it lives here now.

**Put it to him with the words removed:** *should this release email you?*, naming what
the email would contain and that it cannot be unsent once the production deploy runs.
Then derive the version and the `major` flag from his answer, and assert both in the cut
(the absence-plus-presence pair below). On `0.40.1` that second question took one round
trip and settled it.

**Do the cut and the check with `scripts/cut-release.mjs`, not a throwaway script.**
`node scripts/cut-release.mjs <version> <date> <major|minor> --title "…"` does the cut
(either line ending; refuses before writing if `unreleased` is empty or an anchor is
missing), then the same line with `--verify` runs the assertions below against
`origin/main` and exits non-zero on any failure. Note: `major` there means *worth an
email*. It is the mechanical form of the paragraph that follows; read that paragraph
to know what is being asserted.

**Verify the cut mechanically — do not read it over.** A cut's one real failure
mode is losing or altering a note, and that is invisible to every gate. Compare
the new entry against `origin/main:src/lib/releases.ts` note by note and assert:
every note carried across unchanged, nothing lost, nothing invented,
`majorReleasesSince("<previous version>")` returns exactly the new version,
`package.json` equals the newest entry, the file order still matches
`compareVersions`, and the notes render with no `[object Object]` or `undefined`.

Then `node scripts/gates.mjs` (must end `typecheck=0 lint=0 test=0 build=0`),
`node scripts/check-release-guards.mjs`, a filled-in
`docs/test-plans/cut-release-<version>.md`, `gh pr create`, CI green, merge.

**There are four gates, not three.** A `test` gate runs between `lint` and
`build`, and the closing line is `typecheck=0 lint=0 test=0 build=0`. Several
documents in this repository — this one included, until 2026-10-23 — describe it
as "typecheck, lint, build", which is three of four and invites a release manager
to paste a closing line they did not actually read. Read all four numbers.

**Validate the cut plan with `node scripts/check-test-plan.mjs --base origin/main`,
the way CI runs it, and know the two things it catches every time:**

- **A cut PR cannot tick the release-notes line.** The checker holds that line to
  the diff and a tick requires `unreleased` to have *gained* a line — while a
  cut's entire purpose is to **empty** it. The honest state on every cut plan is
  `n/a: <why>`, and a tick there is a claim the diff contradicts. This is not a
  quirk to work around; it recurs on every release, and it has now cost two of
  them a correction.
- **A reason must follow `n/a:` immediately.** `n/a: there is no band here` passes;
  `n/a as a banding change, because …` reads fine to a person and fails.

**An empty `unreleased` is not proof that nothing user-visible shipped.** Promoted
here from `0.39.5`'s handover, because that release existed *entirely* to publish a
note that had been deliberately withheld. `unreleased` was `[]` at the cut, which
normally means nothing a user would notice — and there it would have been false:
#882 changed the first screen every signed-in person lands on. #882 wrote its
release-notes line as `n/a` **correctly**, citing
`docs/decisions/2026-10-11-release-note-truth-rule.md`: no note may promise users a
change works while a manual step is still open, and `0251`, which seeded the
replacement cards, was not yet on production. That rule says the note goes in the PR
that **closes** the step — so the cut PR published it, and the migration went on
before the deploy, so the note was true the moment it became visible.

**Do not conclude "nothing visible" from `unreleased`, empty or not.** This check used to run
only when `unreleased` was empty, so at `0.40.10` — two notes in, a third missing — it never ran,
and `0275`, `0276` and `0279` each lost a note that way. It is now a script that runs on every
cut: `node scripts/check-deferred-notes.mjs` lists each PR in the range whose plan wrote `n/a` on
its release-notes line, and `cut-release.mjs` runs it first and **refuses to write** while a
candidate (a reason pointing at a step still to happen) has no answer. For each one decide whether
this release closes its step; if so add the note to `unreleased` first. Then pass
`--deferred-reviewed "<one line per PR>"`. The note still goes in the PR that closes the step
(`docs/decisions/2026-10-11-release-note-truth-rule.md`); the script never asks for one early.
It does not tell you the step closed, only that nobody may skip the question
(`docs/decisions/2026-10-28-release-note-guard.md`). An empty
note list otherwise looks exactly like a release in which nothing visible shipped,
which is the failure `docs/decisions.md` records on 2026-09-24. **Expect this shape
again while the security rebuild runs**, since it lands schema and code in separate
PRs by design.

**Know how it over-lists before you start, and budget one lookup per candidate.**
Promoted here 2026-11-08, after `0.43.4`, `0.43.5` and `0.43.6` each recorded it as
a defect and carried it in a handover rather than fixing it at source. Two quirks,
both still present:

- **It ignores the commit range you pass it.** Given `<prev deployed sha> HEAD` on
  `0.43.6` it re-read **58** plans from an older cut point, against that release's
  **32** PRs.
- **It prints the test-plan template's own guidance text as the "reason"** for a
  plan whose answer it cannot parse — six of thirteen candidates on `0.43.6`, and
  it lists lines that are **ticked** rather than `n/a`.

**This is the right way round and must not be "fixed" by narrowing it:**
under-listing is the fault it exists to prevent, and `0.40.10` lost three notes
that way. So read each candidate's plan yourself, decide whether **this** release
closes its step, and answer every one in `--deferred-reviewed` — the flag is a gate
on writing, not a record, so **the durable answer goes in the cut's test plan and
the release record**, where the next release manager will look.

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

**THREE databases, not two.** Production and test as always, and now **UAT's own
project**, which the same runner reaches with `--env uat`. Apply to UAT in the same
pass, before UAT's deploy, for the same reason: its code reads the new columns.

**UAT is applied to like the other two:** `node scripts/apply-migrations.mjs --env uat`, every mode.
(Until 2026-11-08 this said every mode died with `database_read`; that was the shell's token from the
other account, fixed in `scripts/lib/env.mjs`. If it ever reappears, the token in use is the wrong one,
not short of a permission.)

**The schema READ, unlike the apply, now works for UAT anyway.**
`appliedMigrations()` falls back from the Management API to the database itself over
PostgREST with the env file's service-role key, and refuses if that URL does not
name the project it was asked about. That is what turned UAT's guard from blind into
real: before 2026-11-08 a UAT deploy printed *could not ask … continuing WITHOUT the
schema check* every time. The assertion now names which route answered — `asked the
database directly` means the token is still the limited one.

**The check that stops a Pi build running ahead of its schema is on THIS machine, not the Pi.**
The Pi has no `SUPABASE_ACCESS_TOKEN` (it is the internet-facing box and must not get one), so
`scripts/pi/guard-release.mjs` checks the release record only and says so. Immediately before
section 7's `ssh … deploy-pi.sh` for uat or production, run:

```bash
node scripts/assert-schema.mjs --env production
node scripts/assert-schema.mjs --env uat
```

It asks the database which migrations it holds and compares them with `origin/main` (`--ref <sha>`
for another commit). **It asserts:** every migration file in that commit is applied. **When it
fails (exit 2) it names each missing migration with the app files its `-- consumer:` header says
read it, and it also fails when it cannot ask** (no token, network, API error), because a guard
that cannot check must not pass. **What to do:** run `node scripts/apply-migrations.mjs --env
production`, read back `0 pending`, then run the assertion again. **Do not start the Pi build
until it prints `holds every migration`.** `scripts/deploy.mjs` (the Worker) runs the same
comparison itself, and warns rather than refuses on a Supabase blip.

**`0292_write_requests.sql` is the one where that refusal is protecting something
you can name, so do not look for a way round it.** The Pi failover wrapper
(`src/lib/action-result.ts`, `worker/origin.mjs`) lets the Worker serve a write
the Pi did not answer, and it is safe to do that ONLY because the database
refuses the second use of a request id. Deploy that code to an environment where
`0292` is not applied and every wrapped save fails outright --- `claim_write_request`
does not exist --- while the Worker is newly willing to replay. The guard already
stops it; this paragraph is here so the refusal reads as a reason rather than an
obstacle. Its one hole is the line above: *could not ask* is a warning, not a
refusal, so read `--status` yourself rather than trusting the deploy to have asked.
See `docs/decisions/2026-10-31-write-request-wrapper.md`, section 6.

The other direction is guarded by a check, not by anyone remembering. Which pages'
writes go through the wrapper is a machine-checked list: the blocking CI job
`wrapped-write-paths` (`scripts/check-wrapped-write-paths.mjs`) fails the build if a
page on `WRAPPED_WRITE_PATHS` carries a write that is not wrapped, the shared header
included (`docs/decisions/2026-11-01-header-writes-wrapped.md`, section 6). So by
the time a release reaches this step that job has been green on every commit in it,
and applying `0292` and deploying opens nothing. There is no separate stop here:
read `--status` and carry on. If that job is red on the release commit, the release
is not ready; that is a stop like any red check. Do not empty `WRAPPED_WRITE_PATHS`
to clear a failure: `scripts/check-worker-origin.mjs` asserts it is non-empty.

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

### Thai columns nobody can reach (after the apply, production and test)

```bash
node scripts/check-production.mjs translations-unlisted
node scripts/check-production.mjs translations-unlisted --env test
```

The CI job `translations-unlisted` reads migration files only, so it cannot see a `_th`
column applied to a live database another way, or one that predates it. This is the
live half: read-only, exit 1 and the column names if the database holds a `_th` column
that no `translatable_labels` row names and that is not in `DELIBERATE` (imported from
`scripts/check-translations-unlisted.mjs`, so the two cannot drift). Run it after the
apply, so a column the release adds and registers is judged as registered. Run it on
both: test is the database every stream shares, so a hand-applied column shows there
first. A name printed is a stop: register it in a migration, or name it in `DELIBERATE`
with a reason. Not a CI job; CI has no live database to ask
(`docs/decisions/2026-11-02-translations-unlisted-live-half.md`).

### Snapshot what the migration will change, before applying it

Promoted here after `0.40.2`, where the lesson was learned and half-missed in the
same release. **A migration that rewrites rows rather than adding columns needs a
before-picture, and the picture has to be of the thing it moves.**

`0257_card_grants.sql` recomputed every production role's `role_permissions` and
deleted anything that came from no card - on Lutan's ruling, and correctly. Its
own header promises a per-role `NOTICE` listing what was added and removed, and
calls that list *"the record of what to give back"*. **Two things then went
wrong, and neither is specific to that file:**

- **`RAISE NOTICE` output does not come back.** `apply-migrations.mjs` reaches
  Supabase through the Management API, which returns statement results only. So a
  migration's own narration of what it changed is **not** a capturable record,
  however clearly the file promises one. Do not plan to rely on it.
- **The snapshot taken was of the wrong table.** `check-production.mjs role-cards`
  was run before the apply - but `0257` does not change which **cards** a role
  holds, it changes which **cells** it has. `role-cells` was the one to take, and
  without it only one role's loss could be itemised afterwards.

So, before applying anything that rewrites rather than adds: **run the read-only
check that covers the table the migration writes, and keep its output.** For
anything touching roles or permissions that is `node scripts/check-production.mjs
role-cells` **and** `role-cards`, which take seconds together. Then re-run both
afterwards and put both in the record. `cards-union` and `role-cards-coverage` are
the after-checks that say whether the rebuild is self-consistent; they cannot tell
you what was lost, because by then it is gone.

**The general form, worth keeping even when the next case looks different:**
reading production rather than reasoning about it is the rule `0.40.1` established
- and this release obeyed it and still came away with a gap, because it read the
wrong thing. **Read the table the change actually writes.**

## 6. Deploy

Deploy **test first** where the release allows it. Check what is on test before
overwriting it — it is sometimes deliberately an integration build that exists
nowhere else:

```bash
curl -s https://test.lannacare.org/api/version
curl -s https://uat.lannacare.org/api/version
```

**The order is test, then production, then UAT**, with the three Worker builds
strictly one after another (see *never run two WORKER deploys at once* above).
UAT goes last on purpose: it is the one environment nobody is waiting on, and
putting it behind Lutan's command means it can never kill his build.

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
node scripts/deploy.mjs --env production | tee .local/deploy-<version>.log
```

**Hand over that one line and nothing more.** This example read
`mkdir -p .local && node scripts/deploy.mjs …` until 2026-10-23, and **it could
not have run in his shell**: `&&` is not a statement separator in Windows
PowerShell 5.1 and `mkdir -p` is not a PowerShell flag, so it would have failed
to parse and run *neither* half. That is this document's own standing rule — do
not hand Lutan a command you have not confirmed runs in his shell — broken by the
document itself, in the one command it exists to get right, a few paragraphs above
where it names the `&&` trap explicitly. It survived this long because each
release manager fixed it silently on the way past instead of fixing it here.

`.local/` already exists by then: the release manager's own test deploy creates
it, and it is gitignored (`.gitignore:59`). Confirm rather than assume —
`ls -d .local` and `git check-ignore -v .local/deploy-<version>.log` — since an
untracked file in the main checkout is what refused his deploy on `0.38.2`.

**The log file does NOT appear on disk while the build runs, and that is not a
missing `tee`.** `Tee-Object` buffers, so for the ten minutes that matter
`ls .local/` shows no `deploy-<version>.log` at all — which looks exactly like a
deploy started from the bare command, with the pre-build lines heading for the
scrollback. On `0.41.0` that inference was made and was wrong: he had run the
handed-over line verbatim. **Read his terminal instead of guessing**
(`mcp__terminal__read_terminal`, generous `lines`), which has the whole log live,
including `deploy: production → Supabase project <ref> (<sha>)` and the
`Next.js version :` banner. Check the file again once the deploy has finished, by
which time it is written. **Never conclude from an empty `.local/` that the
handover was ignored**, and never ask him to re-run anything on that basis.

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
mkdir -p .local && node scripts/deploy.mjs --env test | tee .local/deploy-test-<version>.log
```

**`tee` it, and never pipe it through `tail`.** The production deploy above is
`tee`'d because the lines worth reading print *before* the long build; that is
equally true of the test deploy, and `0.38.2` lost them by running
`node scripts/deploy.mjs --env test | tail -40`. `tail` discards exactly the head
of the log that matters — the `deploy: test → Supabase project <ref> (<sha>)` line
and `strip-baked-env: removed N` — so the record had to say that test's count was
never read. Both facts were recoverable from the bindings printout and
`/api/version`, which is luck rather than method. `tee` passes the status through
and keeps the whole log; `tail` costs a ten-minute rerun to recover one line.

### Worker, UAT — Claude runs this, last of the three

```bash
mkdir -p .local && node scripts/deploy.mjs --env uat --no-mail | tee .local/deploy-uat-<version>.log
```

**Run it from the MAIN checkout, and nowhere else.** `worktree.mjs` copies only
`.env.local`, so a worktree has no `.env.deploy.uat` at all and the deploy would
resolve the wrong project or refuse.

**Read the project line before anything else.** It must say
`fsjagxmxjosauwmxwype`. If it names `qxkmhwybjggxvsfxsxbd` (dev) or
`dbkodyyxxhtygxcxmfcu` (production), **stop** — that is UAT about to be pointed at
somebody else's data. The deploy has its own refusal for dev's Supabase secrets
leaking in from `.env.local`, which no flag overrides, but read the line anyway.

**Lutan's shell exports a `SUPABASE_ACCESS_TOKEN` for the other Supabase account,
and it beats the one in `.env.deploy.uat`.** If the project line looks wrong, that
is the first thing to check: `env -u SUPABASE_ACCESS_TOKEN node scripts/deploy.mjs
--env uat …`, or clear it from the window
(`Remove-Item Env:SUPABASE_ACCESS_TOKEN` in PowerShell).

**`--secrets` is for the first deploy and for a release that CHANGES one of UAT's
secrets, not for every release.** Part 6 of `docs/uat-finalisation.md` used it
because UAT had none yet. A routine release does not need it, and pushing secrets
you have not changed is a way to overwrite a good value with a stale one.

**`--no-mail` no longer carries the whole weight, and write it anyway.** UAT's
Worker has `RELEASE_MAIL_ENV: "UAT"` and a mail binding, and **UAT's database holds
production's real people** — so before 2026-11-08 a major release deployed to UAT
with the flag forgotten would have mailed every real admin from a test site. Since
2026-11-08 `deploy.mjs` will not mail from UAT unless `--mail` is given in words,
and it says so in its own output and in `--plan`. Keep writing `--no-mail`: it
makes the intent readable, and belt-and-braces is the right shape when the failure
is "real people were emailed".

**Then bring UAT's Pi clone to the same release** (below), so the Pi and the Worker
fallback run the same code.

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
ssh lutan@lanna-pi.local 'cd ~/Animal_Shelter_App_uat && ./scripts/pi/deploy-pi.sh --env uat'
```

**Three clones now, one per environment** — `~/Animal_Shelter_App`,
`~/Animal_Shelter_App_test`, `~/Animal_Shelter_App_uat` — serving
`lanna-care`, `lanna-care-test` and `lanna-care-uat` on ports 3000, 3001 and 3002.
They build in parallel safely; they are on the Pi, not the main checkout.

**The UAT one restarts itself since 2026-11-09**, when `/etc/sudoers.d/lanna-care-restart`
gained UAT's two commands (*What UAT needed once*, item 2). Before that it stopped at its
last step for a password, leaving `.next.new` swapped and the service not restarted — so
a release record written before that date reporting exactly that is describing the old
state, not a new fault.

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
node scripts/purge-cache.mjs --env uat
```

**The UAT one works since 2026-11-09**, on its own token scoped to the `lannacare.org`
zone alone (*What UAT needed once*, item 3) — before that it refused, and a record saying
so is describing the old state. **Nothing purges test**, which is still true; the trap
below says why and what the real exposure is. Note that the purge is zone-wide, so
purging UAT also clears `test.lannacare.org`'s cache: harmless, since it re-fetches.

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
ssh lutan@lanna-pi.local 'cd ~/Animal_Shelter_App && node scripts/pi/check-assets.mjs --url https://lannacareforanimals.org/'
```

The script builds into `.next.new` and renames it over `.next` only once it compiled, so a request never meets a half-written build; it probes the Pi on loopback **with the origin key** (production answers `Forbidden` without it); and the asset check below runs from an exit trap, so a failure in an earlier step can no longer skip it. A `DEPLOY FAILED` banner is believed — but if the probe line says `serves 'nothing'`, confirm with `https://lannacareforanimals.org/api/version` before rolling back, and **run the asset check by hand either way**.

`deploy-pi.sh` already runs that check as its last step and **fails loudly** if the
served stylesheet differs from the build; a red result there means purge, then re-run.
**Purge even when the check is green**: it only samples the edge it reaches, and a
phone on mobile data may reach another. Symptom of a missed one: the app renders with
no styling (white, serif, no orange) while the content is current.

**One caveat before you rely on any of this:** a change to `deploy-pi.sh` takes
effect on the **next** deploy, not the one that ships it — the script checks out the
new ref over the file bash is already executing. On a release that changes it, run
its checks by hand (`docs/releases/2026-10-18.md`, Defect 1).

### Home screen icons — Claude does this, after the Worker deploys

`node scripts/sync-home-icons.mjs --env production` redraws every card's icon from the route registry and replaces the files in the shared Drive folder "Home screen icons" (8 images a card, about 350 files, a few minutes). Run it once per release, after the deploys, so the folder matches the cards that are now live. It deletes nothing; a re-run leaves no duplicates. `--local <folder>` draws the images without touching Drive. Lutan does nothing. If it fails, say so in the record and carry on: the app page still draws icons in the browser, only the shared folder is out of date.

### When a Pi build is killed

If one clone builds and its twin does not on the same machine, run `du -sh .next .next/cache node_modules` on both **before** theorising about the machine. A bloated `.next/cache` (4.4 GB on 2026-10-19) starves the build; `deploy-pi.sh` now removes it above 1 GB. A failed build prints a boxed `DEPLOY FAILED` banner and exits 1; a deploy also fails if `/api/version` does not show the new version.

## 7. Verify

`docs/release-smoke-test.md` is the checklist. What can be done without an
account:

```bash
curl -s https://lannacareforanimals.org/api/version
curl -s https://test.lannacare.org/api/version
curl -s https://uat.lannacare.org/api/version
ssh lutan@lanna-pi.local 'cd ~/Animal_Shelter_App && git log --oneline -1; cd ~/Animal_Shelter_App_test && git log --oneline -1; cd ~/Animal_Shelter_App_uat && git log --oneline -1; systemctl is-active lanna-care lanna-care-test lanna-care-uat'
```

**Ask both endpoints on all three, not just `/api/version`.** `/api/version` is
answered by the app the Pi is running; `/api/releases/current` is bundled into the
Worker. They disagree exactly in the window between a Pi deploy and its Worker
deploy, which is the window UAT now sits in while it is deployed last:

```bash
for h in lannacareforanimals.org test.lannacare.org uat.lannacare.org; do curl -s "https://$h/api/releases/current"; done
```

**And confirm UAT is still served by the Pi**, because its Worker rendering every
page is what put it over Cloudflare's free CPU limit in the first place (627 errors
on 5 November):

```bash
curl -sI https://uat.lannacare.org/login | grep -i x-lanna-served-by
```

`pi` is right. `worker` means UAT's service is down and the fallback is carrying it
— a finding, not a pass.

**`lannacare.org` is not a check of anything any more.** Since 2026-11-08 it 301s
to `lannacareforanimals.org`, so curling it tells you about production. Several
paragraphs in older release records read it as UAT; they were right when written.

The edge-cache check must be done **in a real browser**, not with curl — curl
sends no `locale` cookie and gets `BYPASS` every time, proving nothing. From the
browser pane, fetch the page twice and read `x-lanna-cache` and
`x-lanna-served-by`.

Everything behind sign-in is Lutan's, and so is the signed-out public tour while
`PUBLIC_SITE` is `locked` — anonymous visitors get the "STAFF TESTING SITE" gate,
so `/`, `/adopt` and the rest cannot be checked without an account.

**Drift, every database, explicitly.** `--status` prints a comparison, but run
the named check and quote it, because it is the one that reads as a drift check
to whoever reads the record afterwards:

```bash
node scripts/apply-migrations.mjs --drift production
node scripts/apply-migrations.mjs --drift test
node scripts/apply-migrations.mjs --drift uat
```

Each must end `No drift: <env> matches origin/main`, with `0` in each direction.
Dev matters as much as production: it is the database test runs against, so
drift there invalidates test as a pre-production check.

**`--drift uat` reads like the other two** since 2026-11-08 (the `database_read` refusal before then
was the shell's token from the other account). `node scripts/assert-schema.mjs --env uat` is the
weaker reading (it does not report schema ahead of code); if you ran only that, say so.

**Confirm the release mail actually arrived — do not stop at "sent 1".** The
deploy prints `deploy: release mail for <version> [UAT]: sent N, skipped M`;
that is the relay accepting it, not delivery. Check the inbox for the message
from `releases@lannacareforanimals.org` with the version in its subject.
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

**ONE COMMAND AT A TIME. This is the only fault that has cost Lutan time in two
consecutive releases, and both halves of it came from trying to save ten minutes.**
Added 2026-10-28, after he said *"this is two releases in a row now."* The rule, in
three clauses:

1. **Never run anything of yours against shared state while a command of his is in
   flight.** On `0.40.9` the test deploy was started in the main checkout while his
   production deploy was building there. Both write one `.open-next`: his died
   `ENOTEMPTY, Directory not empty: .open-next` at `initOutputDir`, mine died
   `ENOENT … pages-turbo.runtime.prod.js`. Nothing was damaged — it is gitignored
   build output — but it cost a wasted ten-minute deploy. Recovery: confirm no build
   process holds it (`wmic process where "name='node.exe'" get CommandLine`), delete
   `.open-next`, run **one** build.
2. **Hand over ONE command, never two.** On `0.40.10` the migration and the deploy
   were given in the same message, in two code blocks, and the deploy was run first.
   The guard refused it correctly — *"production is missing 1 migration(s) this commit
   carries"* — but it cost a round trip. **A command in a code block gets run**, which
   is the standing *never show commands early* rule; describe the next step in words
   and give its command only when the previous one has reported.
3. **The next command only after the previous one reports.** Not "while it finishes".

**Deploy test AFTER production, not alongside it.** The ten minutes saved by
parallelising is the whole of what both failures bought.

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

### Check the code is identical, not that the SHAs match

**Lutan's decision, 2026-10-24: "Check for identical code only."** This replaces the
"all four builds from one SHA" property, which is **retired** — stop reporting it and
stop carrying its counter.

Why it was retired: on `0.40.0` the four builds came from **three** SHAs, and not one
difference was application code. A backlog grooming merged between the cut and the
Worker deploy; a planner handover merged between the Worker deploy and the Pi build.
Each Pi build checks out the current tip, so it cannot help picking up whatever landed.
**The property therefore measured how quiet other sessions happened to be, which a
release manager cannot control, and `deploy.mjs` takes no `--ref` to pin against.**

**What to assert instead**, for each pair of SHAs the release actually built from:

```bash
git diff --name-only <tested sha>..<deployed sha> | grep -E '^(src/|worker/|public/|next\.config\.|open-next\.config\.|wrangler\.jsonc$|package(-lock)?\.json$|postcss\.config\.|tsconfig[^/]*\.json$|scripts/pi/|scripts/lib/[^/]+$|scripts/(deploy|apply-migrations|actions-key)\.mjs$)'
```

This is an **allow-list of what is built or run at deploy**, and it is the authoritative form
(`docs/decisions/2026-11-04-release-check-false-positives.md`). **Empty output means the served
application code is identical**, and the release is sound however many SHAs appear in
`/api/version`. **Any line means stop** — something that is built or run at deploy is in one
build and not another, which is untested code on a production box, and that is a real finding
rather than a counter. The instruction is unchanged; what changed is which lines reach it.
It used to be `grep -vE '^(docs/|\.claude/)'`, so repo tooling (`.github/`, `.githooks/`,
`README.md`, most of `scripts/`) read as application code and would halt a sound release,
as it did on `0.42.0`.

**An allow-list's failure mode is the other way round, so close it by reading.** Run the same
diff with `grep -vE` and the same pattern and **read what it prints**. If any of those files is
imported by the build or run during a deploy, add it to the list in the same change.
`scripts/pi/` and `scripts/lib/*` are listed because they run on the Pi and in `deploy.mjs`; the
`scripts/lib/backlog-page/` subdirectory is not, because only the backlog page reads it.

Two things this gets right that SHA-equality did not. It **stays quiet when only
documents differ**, which is the common case and never mattered. And it **fails when
code differs**, which is the case that always mattered and which SHA-equality caught
only by also crying wolf. Record the SHAs and the diff result in the release record,
not a streak.

**It does not license rebuilding a Pi to chase a SHA.** The trap above stands: when
`main` moves, read what is deploying. If the diff is clean, there is nothing to do.

**THE PRODUCTION PURGE NO LONGER COVERS TEST. Nothing purges test.** Corrected
2026-11-08 during `0.43.6`; this paragraph asserted the opposite for two releases.

Until the 2026-11-06 cutover production and test were one Cloudflare zone, so
`purge-cache.mjs --env production` genuinely cleared both and `--env test`
refusing was harmless. **Production now has its own zone**, and the script reads
`CLOUDFLARE_ZONE_ID_LANNACAREFORANIMALS` for production and `CLOUDFLARE_ZONE_ID`
for everything else. Measured with `--dry-run`, which sends nothing:

```
--env production --dry-run   would purge everything for lannacareforanimals.org (zone 323637bc…)
--env test --dry-run         CLOUDFLARE_ZONE_ID and CLOUDFLARE_PURGE_TOKEN missing from .env.local.
```

So `--env test` still **refuses**, but the reason it did not matter has gone: it
looks for those two values in `.env.local` while they live in
`.env.deploy.production`. **Fixing it is one value in one file**, and until then
test's edge is purged by nothing.

**`--env uat` refused for a different reason until 2026-11-09, and now works.**
`.env.deploy.uat` carried `CLOUDFLARE_ZONE_ID` (the right zone —
`lannacare.org` serves both `test.` and `uat.`) but no `CLOUDFLARE_PURGE_TOKEN`, so
the script named exactly what to create and stopped. It now holds one, scoped to Cache
Purge on that zone and nothing else — **not** production's, which can reach both zones.
**A second thing was wrong here
and is now fixed:** `--env uat` purged the host `lannacare.org`, which since
2026-11-08 is a 301 to production — it would have purged a redirect, reported
success, and left UAT's own cache standing. It now purges `uat.lannacare.org`.

**Why it has not yet produced a visible fault — which is also what the exposure
actually is:** every build names its assets by content hash, so a new build's
stylesheet has a name the edge has never cached. On `0.43.6` the after-checks read
production `HIT` and test `MISS`, both *identical to the build*. The risk is
**stale HTML pointing at an old asset name**, which is the shape that renders the
app unstyled. **So always re-run the test asset check**
(`node scripts/pi/check-assets.mjs --url https://test.lannacare.org/` on the test
clone) and believe a red one; never reason that production's purge covered it.

**A Worker deploy goes SILENT for about six minutes on `Building server function:
default...`, and it is not a stall.** Promoted here 2026-11-08; `0.43.5` met it,
recorded it and carried it in its handover rather than fixing it at source.
OpenNext's esbuild stage prints nothing while it works,
which looks exactly like a hung build — on `0.43.5` it survived two long terminal
reads with no output.

**Measure it instead of killing it, and give the measurement a wide enough
window.** `0.43.5`'s handover said `find .open-next -type f -newermt '-20 seconds'
| wc -l`, which returned 63 there; on `0.43.6` the same command returned **`0` on a
perfectly healthy build**, because the stage writes in bursts and 20 seconds lands
in a gap. Use two or three minutes, or read the newest file's age:

```bash
for w in 60 180 600; do printf "%-6s " "${w}s:"; find .open-next -type f -newermt "-$w seconds" | wc -l; done
find .open-next -type f -printf '%T@ %p\n' | sort -rn | head -1   # newest file, epoch seconds
```

On `0.43.6` that read `60s: 0 / 180s: 15 / 600s: 213`, newest file 64 seconds old —
alive, settled in seconds.

**WATCH THE DIRECTORY THE CURRENT STAGE ACTUALLY WRITES, or you will read a
healthy build as a stall.** `.open-next` is only written during the OpenNext
stages. While the deploy is still in `next build` — up to and including
`Finalizing page optimization …` — the writes go to **`.next`**, and `.open-next`
can sit untouched for ten minutes while everything is fine. Measured on `0.43.6`'s
test deploy: `.open-next` showed **2 files in 600 seconds** while `.next` showed
**26 in the last 60**, newest 5 seconds old. Read the banner to see which stage you
are in, then point `find` at the matching directory.

**And never pipe a deploy through `tail`.** It buffers until the process exits and
discards the head of the log, which is where every line worth reading is. `0.38.2`
and `0.43.5` each lost test's `strip-baked-env` count that way, and `0.43.5`'s
record had to say the count was never read. `tee` passes the status through and
keeps everything.

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
worktree for the record — which rule 2 of the paperwork budget requires — run
`git fetch` and then `git checkout -b claude/record-<version> origin/main` there.
(This said `git reset --hard origin/main`, which the auto-mode classifier refuses;
six handover editions named it before `0.40.12` corrected it.) **Check the worktree
still exists first:** on `0.40.12` another session's clean-up removed it minutes after
the cut merged, since its branch was by then fully merged and its folder free.

**A predicted `-- consumer:` warning that does not appear is fine.** It means the
declared consumer file is unchanged since the live release, so its reader was
already live and the schema landed under code that already reads it — the safest
order there is. One `git diff --stat <previous release SHA>..HEAD -- <the file>`
proves it. **Over-predicting warnings is free; the point is that none surprises
you.**
