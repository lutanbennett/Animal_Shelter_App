# Release handover — written 2026-10-08, after `0.21.0`

**What this file is.** A snapshot for whoever runs the next production release,
written at the end of the previous one. It says where things stand *right now*,
what is in flight, and what not to re-derive. It is **rewritten each release**
and is deliberately short-lived.

**What this file is not.** The durable record of a release is
`docs/releases/<date>.md`, and the runbook is `docs/release-procedure.md`. Both
outrank this file. If they disagree with it, they are right and this file is
stale — check the dates.

**Read these first, in this order:**

1. `docs/release-procedure.md` — the runbook, start to finish
2. `docs/releases/2026-10-08.md` — the `0.21.0` record, which is step 0 of that runbook
3. this file, for what has changed since

---

## Where things stand

| | |
|---|---|
| Live everywhere | **`0.21.0`** @ `9e74be1d` — production Pi, production Worker, test Pi, test Worker |
| Previous release SHA, for the next range | **`9e74be1d`** — `node scripts/release-prs.mjs 9e74be1d HEAD` |
| Production database | `161 applied, 0 pending`, **no drift** |
| Dev database | `162 applied` — **one ahead of `main` on purpose**, see below |
| `main` when this was written | `75e34afb`, already **40 commits** past the release |
| `unreleased` notes already waiting | **4** |
| Open PRs | **#456** — Zone colour, schema half (`0162`) |

**Dev is one migration ahead of `main`, and that is correct.** Dev holds
`0162_zone_colour.sql`, whose PR (#456) is still open. `--drift dev` will
therefore report a disagreement until #456 merges. That is the schema-first rule
working, not a fault — but it means **`--drift dev` will not read `No drift`
until #456 lands**, and a release manager expecting a clean pair should know
why before they go looking.

**There is already a release's worth of material on `main`.** Four `unreleased`
notes and forty commits, a day after `0.21.0`. The next release is not a small
one.

---

## In flight

| Stream | Branch | State |
|---|---|---|
| Zone colour (schema) | `claude/zone-colour-schema` | **PR #456 open**, 5 commits ahead, `0162` already applied to dev |
| Stock pages finish | `claude/stock-pages-finish` | held by a live session, 7 behind `main` |
| Plan-day token estimates | `claude/plan-day-token-estimates` | held by a live session, 9 behind `main` |
| Account menu min width | `claude/account-menu-min-width` | **free, nothing beyond `main`** — a leftover; `worktree.mjs done` it |

`#456` carries a migration, so under the schema-first rule **no other in-flight
branch may carry one** until it merges.

---

## Outstanding verification — what actually matters

**243 test plans repo-wide say `pending:`.** That is the normal standing state,
not a backlog this release created: a plan sits `pending:` for most of its life
and the checker exits 0 on it by design. Do **not** treat that number as a
release blocker or try to clear it.

What is worth carrying forward:

| Item | Where | Note |
|---|---|---|
| **`0.20.0`'s Contacts pass** | `docs/test-plans/cut-release-0-20-0.md` | Open for **three releases** now. Lutan chose it as a gate on 2026-10-07 and events overtook it twice. Checkable on test at any time; the Contacts restriction has been live since `0.20.0` |
| CSP on the public pages | `docs/test-plans/csp-enforce.md` | `/adopt`, `/our-work`, `/donate` and a Shelter Friend page, console open. Everything else in that plan is closed |
| Thai wording on the new menu | `docs/test-plans/shelter-operations-nav.md` | งานประจำวัน and the eight tile descriptions. Item 1 (the menu itself) is signed |
| The signed-out public tour | every release record | Standing gap: `PUBLIC_SITE` is `locked`, so nobody has seen `/`, `/adopt`, `/our-work` or `/donate` as a visitor sees them |

---

## Lessons from `0.21.0` worth not re-learning

The three that changed how the release ran are now **in
`docs/release-procedure.md`'s Traps section**, which is where a release manager
will meet them. Summarised here so this file stands alone:

### 1. A Pi deploy cannot change a security header

The CSP is set by `worker/security-headers.mjs`. The Pi serves the page; the
**Worker** adds the headers. So after the Pi test build succeeded,
`test.lannacare.org` reported `0.21.0` **and was still sending
`content-security-policy-report-only`**, because the test Worker deploy had not
finished.

This nearly defeated the whole point of the test hold: checking the policy at
that moment would have reported "report-only, nothing to see" and passed the
gate having tested nothing. What caught it was asking `/api/releases/current`
(answers from the Worker bundle) alongside `/api/version` (answers from the app)
and seeing `0.20.1` against `0.21.0`.

**The consequence for production: security-header changes go live at the moment
the Worker deploy runs — Lutan's command, not Claude's.**

### 2. Read an exit code from the script, never through a pipe

`release-prs.mjs` exited **1** naming an orphaned test plan; run as
`… | tail`, it reported **0**, and the release was briefly recorded as eleven
PRs instead of twelve. The missing one had been **squash-merged**, so it had no
merge commit carrying its number. The same trap then caught `gates.mjs` on a
later branch, reported back as "completed (exit code 0)" when that was `tail`'s
status.

Redirect to a file and read `$?` from the command itself. Every script in
`0.21.0` was run that way after the first slip.

### 3. `main` moves under you during a release

`main` moved twice while `0.21.0`'s record was being written — 24 commits,
including a large feature. Two consequences:

- **Pin both Pi builds with `--ref <release sha>`** rather than letting them fetch `main`'s tip, and re-check `git status -sb` against `origin/main` immediately before handing the deploy over.
- **Diff a branch against its merge-base, not `origin/main`.** Comparing against a moving `origin/main` produced a thirty-file diff of someone else's feature and made a two-file docs branch look as though it had deleted half the app.

### 4. Write a security checklist against what the *browser* fetches

`csp-enforce`'s manual item 5 named the "Management dashboard visitor count" as
a CSP risk. It is not one and never could be: that figure is fetched
**server-side** from Cloudflare's GraphQL API, and CSP governs only what the
browser loads. The tile has also never shown a number, because
`CLOUDFLARE_ANALYTICS_TOKEN` and `CLOUDFLARE_ZONE_ID` are unset. Lutan spent his
attention asking what the item meant. Recorded as a defect on that plan.

### 5. Name a silently-failing change on its own, not inside a count

Ten plans were unsigned at the cut. Presented as "ten unsigned plans", Lutan's
answer would have been his usual one: ship and record the gap. Presented
separately — *this one switches the browser security policy to enforcing, and a
blocked resource is a missing photo or a camera that will not open, with no
error* — he chose a **test hold** instead, the first of the project.

The hold was worth it, and it is the reason lesson 1 was found before production.

### 6. Things that look alarming but are not

- `ERROR Failed to copy …\node_modules\…` during a Worker deploy: known Windows file-lock noise. It printed three times on the test deploy and the deploy then **succeeded, exit 0**.
- A red `audit` check: never blocks, never has — `CLAUDE.md` has the long version.
- The Cloudflare beacon blocked by the CSP on every page: expected, and arguably a fix, since `/privacy` promises no analytics tracking.
- A second `next build` finishing in ~80s rather than ~250s: a warm Turbopack cache, not a skipped build — but check each gate's own exit code rather than assuming.

---

## What the next release will need

1. **Step 0 of the procedure: read `docs/releases/2026-10-08.md` end to end.** It is long because `0.21.0` was the first test-hold release and the mechanics are written down.
2. **Range starts at `9e74be1d`.** Run `release-prs.mjs 9e74be1d HEAD` and read its exit code directly.
3. **Decide major or minor with Lutan before cutting**, together with anything else the cut needs, in one round. `0.21.0` was major because the menu moved for everyone; `0.20.1` was minor because nothing was taken away.
4. **Check whether anything in the release can fail silently** and, if so, name it to him on its own. See lesson 5.
5. **`#456` must merge or be abandoned before another branch takes a migration number.** The next free number is `0163` once it lands.
6. `worktree.mjs done account-menu-min-width` — a confirmed leftover.

---

## Who does what, unchanged

Lutan has **one job**: `node scripts/deploy.mjs --env production | tee deploy-<version>.log`.
Everything else is Claude's, and on `0.21.0` that held for the first time since
the procedure was written — including both Pi builds over `ssh`, both `--drift`
checks and `gh pr merge`, none of which were refused.

The Worker production deploy deliberately has **no allow rule** and should not
get one: it is his by his own instruction of 2026-10-02, and it is what mails
every admin.
