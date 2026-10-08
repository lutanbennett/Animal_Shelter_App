# Release handover — written 2026-10-08, after `0.22.0`

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
2. `docs/releases/2026-10-08.md` — **two releases in one file**, `0.21.0` then `0.22.0`. Step 0 of the runbook is the most recent one, `## 0.22.0`
3. this file, for what has changed since

---

## Where things stand

| | |
|---|---|
| Live everywhere | **`0.22.0`** @ `7b7341df` — production Pi, production Worker, test Pi, test Worker |
| Previous release SHA, for the next range | **`7b7341df`** — `node scripts/release-prs.mjs 7b7341df HEAD` |
| Production database | `164 applied`, **1 pending** — see below |
| Dev database | `165 applied`, **no drift** |
| `main` when this was written | `98afdbd0`, already **30 commits** past the release |
| `unreleased` notes already waiting | **1** |
| Open PRs | **none** |

**Production is one migration behind `main`, and that is the normal state between
releases.** `0165_audit_facility_maps.sql` merged *after* `0.22.0` shipped, so
`--drift production` reports a disagreement until the next release applies it.

This is the **mirror image** of what the last handover flagged, and the pair is
worth understanding once rather than rediscovering each time:

- **Dev ahead of `main`** → a schema PR is open and has been applied to dev under the schema-first rule. Normal.
- **Production behind `main`** → a migration has merged since the last release. Normal.
- Either is a fault only if no open PR and no merged-since-release migration explains it.

Right now dev reads `No drift` and production does not. Both are correct.

**There is already material on `main` for the next release** — one `unreleased`
note and thirty commits, within hours of `0.22.0`.

---

## In flight

| Stream | Branch | State |
|---|---|---|
| Permission guards / `0165` | `claude/permission-guards-0165` | **merged**; worktree is a free leftover — `worktree.mjs done` it |
| Record `0.22.0` | `claude/record-0-22-0` | **merged**; free leftover — `done` it |

Nothing is open and nothing is held. `/clean-streams` clears both in one pass.
**No branch currently carries a migration**, so the next free number is `0166`
and a schema stream can start immediately.

---

## How long each step actually takes

New in this handover, because `0.22.0`'s one real failure was a **timing**
mistake rather than a technical one. Every figure was measured during `0.22.0`,
not estimated.

| Step | Measured | Notes |
|---|---|---|
| `worktree.mjs new` | **~2–3 min** | almost all of it `npm ci` ("added 730 packages in 2m") |
| `gates.mjs` | **~4 min** | the `build` alone was 181s, cold. A ~80s build means a warm Turbopack cache — still read the exit code rather than inferring either way |
| Full CI run on a PR | **~2 min** | measured three times: 2m10s, 2m05s, 1m56s. `check` is ~2m, `public-views` ~1m25s, everything else under 15s |
| Production migration apply, 3 files | **under a minute** | the dry-run is comparably quick |
| **Worker deploy (`deploy.mjs`), test or production** | **~12–13 min** | **the long pole, and the dangerous one.** It exceeded a 600-second foreground timeout outright |
| Pi build + restart (`deploy-pi.sh`) | **~4–5 min** | runs on the Pi, so it competes with nothing on the PC |
| Whole release, first command to admin mail | **~75 min** | with one failed deploy inside it |

### The rule these numbers produce

**A Worker deploy is a `next build`, and two builds in one checkout collide.**
The runbook already said that about `gates.mjs`. What `0.22.0` learned the hard
way is that it applies to **deploys** too, and that the handover window is where
it bites:

> Claude started the **test** Worker deploy in the main checkout and handed Lutan
> the production command a couple of minutes later. The test build was still
> running. Next.js refused the second build —
> `⨯ Another next build process is already running` — and `deploy.mjs` exited 1
> about seven minutes in, having built nothing. **The failure is not instant: it
> waits through most of a build before dying**, so the time is spent either way.

So:

- **Never hand over the production deploy until the test Worker deploy has
  printed its `Current Version ID`.** That line is the finish — not the Pi build
  finishing, and not the test site reporting the new version.
- **The Pi builds are the exception and should run in parallel.** They execute on
  the Pi, so they collide with nothing. Start the Pi production build in the same
  breath as handing over the Worker deploy, as the runbook says.
- **Budget ~13 minutes, not ~5**, whenever a Worker deploy sits between two
  steps. Most of a release's wall-clock time is these two deploys.
- A foreground command that outlives a 10-minute timeout is **normal** for this
  step, not a hang.

---

## Outstanding verification — what actually matters

Nine of `0.22.0`'s twelve plans are `pending:`, by Lutan's decision at the cut
(ship-and-record; nothing in the release fails silently). The repo-wide
`pending:` count remains the normal standing state and is **not** a release
blocker — do not try to clear it.

What is worth carrying forward:

| Item | Where | Note |
|---|---|---|
| **`0.20.0`'s Contacts pass** | `docs/test-plans/cut-release-0-20-0.md` | Open for **four releases** now. It was `0.20.0`'s chosen gate and events have overtaken it three times. **At this point the carrying is itself the finding** — either do it or close it with a reason |
| **The first facility-map upload on production** | `docs/test-plans/facility-map-upload.md` | It is also what *creates* the Storage bucket (`ensureBucket()` runs on first use; no setup step precedes it). This is the one code path in `0.22.0` that has never run against the production project |
| **A Management login saving Management → Website** | `docs/test-plans/website-content-grant.md` | `0.22.0`'s one access widening (`0163`). Verified only by the migration applying cleanly. Failure would be loud — a refused save — but nobody has used it |
| Thai wording on the Shelter Operations menu | `docs/test-plans/shelter-operations-nav.md` | Carried from `0.21.0`: งานประจำวัน and the eight tile descriptions |
| The signed-out public tour | every release record | Standing gap: `PUBLIC_SITE` is `locked`, so nobody has seen `/`, `/adopt`, `/our-work` or `/donate` as a visitor does |

---

## Lessons from `0.22.0` worth not re-learning

The timing lesson above is the big one and has its own section. Five more:

### 1. The two-endpoint check detects a **failed** deploy, not just a lagging one

`0.21.0` established asking `/api/version` (answered by the app, on the Pi) and
`/api/releases/current` (answered from the Worker bundle) side by side, and
described a disagreement as the Worker *lagging* between two deploys.

On `0.22.0` the same disagreement meant the Worker deploy had **not happened at
all**: production read `0.22.0` on one endpoint and `0.21.0` on the other for
twenty-five minutes, because the deploy had died. The Pi was serving the new
release perfectly, so everything a casual check looks at was green.

**A release manager reading only `/api/version` would have called this release
complete with no Worker deployed and no admin mailed.** Ask both, every time, and
treat a disagreement as "find out which" rather than "wait a bit".

### 2. The silent-failure question can answer *no*, and that is the point

`0.21.0` held the release on test because the CSP change could fail quietly.
`0.22.0` asked the same question, read the two candidate changes **in code
first**, and concluded no:

- the contact map-link check fails **open** by construction (`mapLinkLeadsSomewhere`
  returns `true` when Google is unreachable), and its one degradation is a map
  missing for a single page view, deliberately not cached;
- the facility-map image route is behind sign-in *and* a strict filename pattern,
  images are never deleted so Undo always works, and it is same-origin so the CSP
  is satisfied. A failure shows as a missing image — visible.

Lutan then chose ship-and-record. **The rule is not "hold when plans are
unsigned"** — it is "look at whether anything fails quietly, and name it on its
own if it does". Do the reading before asking, so the question carries an answer
rather than a worry.

### 3. A `-- consumer:` header can be forward-looking — grep before believing it

`0164_contacts_map_url` names **seven** consumer paths. None of them reads the
column in this release; the file says so itself ("the forms and the Friend card
are the next stream"). `grep -rn "map_url" src/` returned only
`site_content.contact_map_url`, from `0120` and long live.

Taken at face value the header implies an apply-before-deploy window that does
not exist. It is a hint about where to look, not a statement about what is live.

### 4. `worktree.mjs new` runs its own `fetch`, so your base is not what you pulled

The cut plan recorded its base as `dd44aa87` — the SHA the main checkout had just
been pulled to. The branch was actually cut from `005e6594`, because a backlog
merge landed on `origin` in the minutes between the pull and the worktree being
created. Corrected before merge.

`main` moved **three times** during this release. Confirm a branch's base with
`git merge-base --is-ancestor origin/main <branch>` against the remote, not
against a local ref read earlier, and keep pinning both Pi builds with
`--ref <release sha>`.

### 5. Things that look alarming but are not

- `ERROR Failed to copy …\node_modules\…` during a Worker deploy: known Windows file-lock noise; the deploy continues and exits 0.
- A red `audit` check: never blocks, never has — `CLAUDE.md` has the long version. It was **green** throughout `0.22.0`.
- A drift report on exactly one database, explained by an open schema PR (dev ahead) or a migration merged since the release (production behind). See the pair at the top.
- `skipped lannacareforanimals@gmail.com: E_RECIPIENT_NOT_ALLOWED` in the release mail: the shelter's own address refused by the relay, a known open question, not a delivery failure.

---

## What the next release will need

1. **Step 0: read `docs/releases/2026-10-08.md`'s `## 0.22.0` section end to end.** It is the second section in that file, not the first.
2. **Range starts at `7b7341df`.** Run `release-prs.mjs 7b7341df HEAD` and read its exit code directly, not through a pipe.
3. **Apply `0165` to production** — it is pending there, and is why `--drift production` currently disagrees.
4. **Decide major or minor with Lutan before cutting**, with anything else the cut needs, in one round. `0.21.0` and `0.22.0` were both major for the same reason each time: pages moved and people will look in the old place.
5. **Ask whether anything in the release can fail silently**, read the candidates in code, and name any on their own rather than inside a count of unsigned plans.
6. **Budget the two Worker deploys at ~13 minutes each**, and do not overlap either with anything building in the same checkout. See the timings section.
7. Two production-only checks are owed from `0.22.0`: the first facility-map upload (which creates the Storage bucket) and a Management login saving Management → Website.
8. `worktree.mjs done permission-guards-0165` and `done record-0-22-0` — both confirmed free leftovers.

---

## Who does what, unchanged

Lutan has **one job**:
`node scripts/deploy.mjs --env production | tee deploy-<version>.log`.
Everything else is Claude's, and that held again on `0.22.0` — both Pi builds
over `ssh`, both `--drift` checks, the production migration apply and
`gh pr merge`, none of which were refused.

Two things about that one job, both learned on `0.22.0`:

- **Do not hand it over while anything is building in the main checkout.** That
  is the whole of the timings section above, and it cost him a failed deploy and
  about twenty minutes.
- `gh pr merge` is refused by the auto-mode classifier as *"Merge Without
  Review"* until he asks for the merge in chat; it then succeeds on the first
  retry. Expect it, and ask rather than treating it as a fault.

The Worker production deploy deliberately has **no allow rule** and should not
get one: it is his by his own instruction of 2026-10-02, and it is what mails
every admin.
