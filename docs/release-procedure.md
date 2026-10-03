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
| Cut PR, gates, CI, merge | Claude |
| Production migrations | Claude — `apply-migrations.mjs --env production` from the **main checkout** |
| **Worker production deploy** | **Lutan** — the one handover |
| Worker test deploy | Claude |
| Pi production build + restart | Claude — SSH works and `systemctl restart lanna-care` is passwordless |
| Pi test build + restart | Claude — same |
| Verification, release record | Claude |

**Do not idle.** The Pi production build does not depend on the Worker deploy —
start it as soon as the cut is merged and let the two run in parallel. `0.15.0`
sat waiting on a handover that did not need to be sequential.

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

## 6. Deploy

Deploy **test first** where the release allows it. Check what is on test before
overwriting it — it is sometimes deliberately an integration build that exists
nowhere else:

```bash
curl -s https://test.lannacare.org/api/releases/current
```

### Worker, production — Lutan runs this

```bash
node scripts/deploy.mjs --env production
```

**Not `npm run deploy:prod`.** `npm.ps1` is blocked by PowerShell's execution
policy on this machine (`npm : File C:\Program Files\nodejs\npm.ps1 cannot be
loaded`). `npm.cmd run deploy:prod` works, but the bare `node` form has no
wrapper to go wrong and is what should be handed over.

Read the output rather than assuming it: the
`deploy: production → Supabase project dbkodyyxxhtygxcxmfcu (<sha>)` line, and
`strip-baked-env: removed N env var(s)`.

This deploy is also what **mails the admins** on a major release. The Pi deploy
does not mail, and neither does test (`RELEASE_MAIL_ENV` is `""` there).

### Worker, test — Claude runs this

```bash
npm run deploy:test
```

### The Pi — Claude runs this

Production is served by the Pi; the Worker is the fallback. A Worker deploy alone
does **not** update what users see.

```bash
ssh lutan@lanna-pi.local 'cd ~/Animal_Shelter_App && ./scripts/pi/deploy-pi.sh'
ssh lutan@lanna-pi.local 'cd ~/Animal_Shelter_App_test && ./scripts/pi/deploy-pi.sh --env test'
```

**Run it detached with a log, not in the SSH foreground.** The build takes longer
than the foreground tool timeout, and a timeout kills the SSH session mid-build:

```bash
ssh lutan@lanna-pi.local 'cd ~/Animal_Shelter_App && rm -f ~/deploy-prod.log && setsid nohup ./scripts/pi/deploy-pi.sh > ~/deploy-prod.log 2>&1 < /dev/null & sleep 20; tail -15 ~/deploy-prod.log'
```

then poll with `sleep <n>; tail ~/deploy-prod.log`. The script ends with
`deploy-pi: lanna-care running` and a `served by: x-lanna-served-by: pi` line it
checks itself.

## 7. Verify

`docs/release-smoke-test.md` is the checklist. What can be done without an
account:

```bash
curl -s https://lannacare.org/api/releases/current
curl -s https://test.lannacare.org/api/releases/current
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
node scripts/apply-migrations.mjs --drift dev
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
checked, and **what the record cannot say**. Commit it on whatever branch is to
hand; it is a record, not a gate.

---

## Traps

Every one of these cost real time. They are not hypothetical.

**PowerShell blocks `npm` and `npx`.** `npm.ps1 cannot be loaded because running
scripts is disabled on this system`. Hand over `node scripts/<script>.mjs`, or
`npm.cmd` / `npx.cmd`. Never `npm run …`.

**`ssh host 'sudo …'` cannot prompt for a password.** No TTY, so it dies with
`sudo: a terminal is required to read the password`. Use `ssh -t` for anything
that needs a password — and check first whether it needs one at all.

**The Pi's passwordless sudo is four commands, nothing else:**
`systemctl restart lanna-care`, `systemctl restart lanna-care-test`, and
`is-active --quiet` for both. Everything else needs Lutan at a terminal. A
normal deploy needs nothing more, because both clones are owned by `lutan` — if a
deploy suddenly wants a password, something has become root-owned and *that* is
the fault to fix.

**`/api/releases/current` is answered by the Worker, not the Pi.** It is bundled
into the Worker, so it reports the Worker's version even when the Pi serves the
site. It is not evidence that the Pi took the release. Check the clone's
`git log -1`, and `x-lanna-served-by` on a real page.

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
until proven otherwise.
