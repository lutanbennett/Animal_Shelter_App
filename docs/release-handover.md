# Release handover — written 2026-10-10, after `0.25.0`

**What this file is.** A snapshot for whoever runs the next production release,
written at the end of the previous one. It says where things stand *right now*,
what is in flight, and what not to re-derive. It is **rewritten each release**
and is deliberately short-lived.

**What this file is not.** The durable record of a release is
`docs/releases/<date>.md`, and the runbook is `docs/release-procedure.md`. Both
outrank this file. If they disagree with it, they are right and this file is
stale — check the dates.

**Amended later the same day**, after the release, when Lutan looked at the
production Website visitors tile and found it still saying *Not set up*. That is
a bug, not an outstanding check — it is logged at the top of the backlog, and
**lesson 7** is what it teaches. The husk this file told you to clear was also
cleared before handover. Nothing else has changed.

**Read these first, in this order:**

1. `docs/release-procedure.md` — the runbook, start to finish
2. `docs/releases/2026-10-10.md` — **it holds two releases**, `0.24.0` and
   `0.25.0`. Read the `0.25.0` section; read `0.24.0`'s too if you are meeting a
   renaming migration, because that is where that lesson lives
3. this file, for what has changed since

---

## Where things stand

| | |
|---|---|
| Live everywhere | **`0.25.0`** @ `590a9d35` — production Pi, production Worker, test Pi, test Worker |
| Previous release SHA, for the next range | **`590a9d35`** — `node scripts/release-prs.mjs 590a9d35 HEAD` |
| Production database | `177 applied`, **0 pending**, `No drift` |
| Dev database | `177 applied`, **0 pending**, `No drift` |
| Next free migration number | **`0178`** |
| `unreleased` notes already waiting | **0**, read off `origin/main` after the release |
| Open PRs | the record PR this file is in, and whatever has landed since |

**Both databases are clean and nothing is pending anywhere.** That is worth
noticing, because it is the first release in three to end that way: `0.24.0`
handed over a legitimate one-sided drift and a long explanation of why it was
fine. You inherit no explained-away disagreement. **So if `--status` or
`--drift` shows you anything at all, it is new**, and it is either an open schema
PR applied to dev under the schema-first rule or a migration merged since this
release. Anything else is a fault.

The pair of legitimate one-sided cases, which will keep recurring:

- **Dev ahead of `main`** → a schema PR is open and has been applied to dev under the schema-first rule. Normal.
- **Production behind `main`** → a migration has merged since the last release. Normal.
- Either is a fault only if no open PR and no merged-since-release migration explains it.

---

## In flight

**Nothing was left open by the release itself.** No migration merged after the
cut this time, so unlike `0.24.0` there is no first job waiting for you.

**Do not trust a list of worktrees in this file — run `node scripts/worktree.mjs
list`.** Writing one down was tried twice and was stale within the hour both
times. What is durable is the shape:

- The release's own worktrees — the cut, and this record — are free leftovers once their PRs merge. `/clean-streams` is the one-pass way to clear them.
- `HELD — <session name>` means someone is still in it. Ask; do not tear it down.
- The list also names **husks**, folders git no longer tracks, which `done <name>` clears. `Animal_Shelter_planner-handover-81` was still there at `0.25.0`, as it was at `0.24.0` — left behind by #490 and now two days old.
- Several feature streams run in parallel with a release and are nothing to do with it. A release manager's business is the two it created.

**The shared-dev-database courtesy still applies to whoever runs the phone-width
script in testing** (it is no longer a release step — see lesson 5):
`check-phone-width.mjs --clean` deletes every `phonewidth-*` login it finds, not
just its own, and at `0.24.0` it deleted another stream's mid-run. Leave it alone
unless you are cleaning up after a killed run and nobody else is working.

---

## The one thing to read before the next release

**Never put a runnable command in front of Lutan before the moment he should run
it.** Describe upcoming steps in words only — no code block, not even as
illustration.

This is new, it is the one real incident of `0.25.0`, and it was entirely the
release manager's fault. Explaining what the remaining steps would be, Claude
included the production deploy command in the list so Lutan could see what he was
approving. **The desktop app puts a Run button on every shell code block**, so a
command shown for context is indistinguishable from a command handed over. He ran
it — before the cut PR was merged and before the migrations were applied.

The deploy guard refused it:

```
deploy: production is missing 3 migration(s) this commit carries;
  shipping now would run code against schema that is not there:
   - 0175_map_rooms_names_and_descriptions.sql
   …
Apply them first: node scripts/apply-migrations.mjs --env production
```

**Nothing shipped.** The guard is exactly the control for this and it worked —
the second release running where a guard has stood between a mistake and
production. But it cost a round trip, and the next version of this mistake might
be a command with no guard behind it.

So: while a multi-step job is in flight, write *"then you run the production
deploy, which takes about thirteen minutes"*. Give the exact command, in its own
block, **only in the message where that step is the next thing to happen**. This
matters most for the Worker production deploy, which is his only job and the one
that mails every admin.

---

## Lessons from `0.25.0` worth not re-learning

### 1. The migration header warning is not the finding, and it looks identical either way

`0.24.0` learned that a *renaming* migration is a different animal from an
*adding* one, and that the runner's reassuring note is wrong for the first kind.
`0.25.0` is the control case that makes the lesson usable: **all three
migrations produced six consumer warnings naming files that already existed —
the exact signature that preceded `0172`'s 100-second outage — and the correct
answer was that there was no window at all.**

The runner cannot tell the difference and prints the same note regardless. What
separates the two cases takes under a minute:

```
git diff <previous release sha> HEAD -- <the files the migration's consumer header names>
git grep -n '<the old table or column name>' <previous release sha> -- src
```

At `0.25.0` the first command returned **comment-only changes** in the two files
whose logic the new SQL functions mirror, which is what proved the database's
copies matched the live build to the character. Read the code against the
previous release's SHA. Do not reason from the header, and do not be reassured by
it either.

### 2. A compatibility-engineered migration says so in its own header — believe it, then check it

`0176` and `0177` both keep arguments they no longer use, each saying in its
header that this is *"so the deploy order does not matter"*. `0175` makes a
column NOT NULL but installs a BEFORE trigger to back-fill it, and says so. Three
files written by three different streams, all of which anticipated this exact
question. **That is the pattern to expect and to reward**: it is why this release
had no window and needed no decision from Lutan.

Still open the files. The header is the author's claim; the diff is the evidence.

### 3. `gh pr merge` was refused, after two releases where it was not

`0.23.0` and `0.24.0` both recorded it working first time, and `0.24.0`'s record
said to treat a refusal as the exception. **It was refused twice at `0.25.0`**,
by auto mode's classifier, `Reason: [Merge Without Review]`. It cleared the
moment Lutan said *"merge it"* in chat.

Expect it. Do not retry it blind, and above all do not route around it — a
release reaching `main` by any other path is the thing the repo's rules exist to
prevent. One sentence in chat is the whole remedy.

### 4. `deploy.mjs` still has no `--ref`, and this time it was the *test* deploy that drifted

The production Worker built from `590a9d35`, **the release SHA exactly**, because
the handover gap was short — so `0.24.0`'s Defect 3 did not recur there. The test
Worker, run later, built from `39ec60b6`. Checked rather than assumed: two
commits, both this release manager's own backlog edits, touching only
`docs/backlog.md`.

**Read the project-ref line's SHA on every deploy and diff it against the release
SHA.** Both Pi builds pin with `--ref` and neither has drifted in two releases.

### 5. The phone-width sweep is no longer a release step — do not put it back

**Decided by Lutan on 2026-10-10, during this release:**
`node scripts/check-phone-width.mjs` is **removed from
`docs/release-smoke-test.md`** and is not run at a release. It belongs to
**testing**: a feature that changes a page runs it in that feature's own test
plan, before the PR merges.
See `docs/decisions/2026-10-10-phone-width-is-not-a-release-step.md`.

It is worth knowing why, because the obvious reading of `0.24.0`'s record points
the wrong way. That record treated three releases of skipping this check as a
failing to put right, and `0.25.0` duly ran it in full — **and it became the
single longest step in the release, longer than the production Worker deploy**,
about forty-five minutes, while the release itself had been live and verified for
half an hour. The smoke test also listed it **twice**, as two near-identical
bullets nobody had noticed, because nobody had run it for three releases.

The substantive point is that it asks a question about **pages**, which change
when a feature changes them, not when a release is cut. At release time it
re-asks the same question of the same unchanged pages, far too late for a failure
to be cheap.

**The general lesson: a checklist item that keeps getting skipped is evidence.**
Sometimes it means the step is neglected; sometimes it means the step is in the
wrong place. Ask which before restoring it.

It ran clean one last time at `0.25.0` before the decision — six roles, both
languages, 283 page views, 2793 tap targets, 0 warnings — so nothing was waved
through. The numbers are in the decision file.

### 6. Where the time went

`0.23.0` ~45 min, `0.24.0` ~65 min, `0.25.0` **~50 min** end to end — and the
difference from `0.24.0` is again almost entirely the handover gap, which was
short this time. Budget from the per-step figures, not the total.

| Step | Measured at `0.25.0` |
|---|---|
| `worktree.mjs new` | ~3 min, almost all `npm ci` |
| `gates.mjs` | ~4 min (build alone 180 s) |
| Full CI run on a PR | ~2.5 min (`check` 1m27s, `public-views` 1m28s, the rest under 15 s) |
| Production migration apply | **10 seconds** for three files |
| **Worker deploy, production** | ~13 min — still the long pole |
| Worker deploy, test | ~10 min |
| Pi build + restart | **under 36 s** — but see the caution below |
| ~~Phone-width sweep~~ | **~45 min, and removed from the release** — see lesson 5 |

**The Pi figure is a bracket, not a measurement**, and must not be budgeted on.
Nothing in `deploy-pi.sh` timestamps its own finish; what is known is that the
build was started at `12:36:24Z` and its completion line was already present when
the log was next read at `12:37:00Z`. The likely cause is a warm clone with
unchanged `node_modules`. **Budget on `0.24.0`'s measured 1m40s.** If you want a
real number, wrap the ssh call in `date -u` on both sides.

### 7. A release note that asserts a *configuration-dependent* thing needs a human to look, before the cut

`0.25.0`'s fifth note told every admin that Settings → System status now shows a visitor count. **It does not**, and Lutan found that within minutes of the deploy. Nothing that ran in the release could have caught it: the gates, CI, the drift checks and the version checks all passed, because the code is correct. The two Cloudflare values simply are not present on the Pi, and the tile's grey *Not set up* state is the designed response to that.

Two things made it invisible:

- **The screen cannot distinguish "no key set" from "key set but the API refused".** Both render the same grey message, so the feature looks identically unfinished whether it is misconfigured, broken, or simply switched off.
- **Its test plan left the one check that mattered as `pending:`** — look at the tile on production — and the release shipped on the ship-and-record call, which is a legitimate call but not one that can answer a configuration question.

**So: when a release note claims that something which depends on configuration now works, that claim needs a person to look at the live screen before the cut.** It is the one class of note a script cannot verify, it takes under a minute, and getting it wrong means mailing every admin something untrue that cannot be unsent.

### 8. Things that look alarming but are not

- Six `WARNING … declared consumer … differs from release` lines: see lesson 1. They fire for harmless files and dangerous ones alike.
- `ERROR Failed to copy …\node_modules\…` during a Worker deploy: known Windows file-lock noise; the deploy continues and exits 0.
- A red `audit` check: never blocks, never has — `CLAUDE.md` has the long version. Green throughout `0.25.0`.
- A deploy log that looks like gibberish: `| tee` writes **UTF-16**. `tr -d '\000'` before grepping.
- `skipped lannacareforanimals@gmail.com: E_RECIPIENT_NOT_ALLOWED` in the release mail: the shelter's own address refused by the relay, a known open question, not a delivery failure.
- `release mail for <version> [off]: sent 0, skipped 16` on the **test** deploy: correct by construction, `RELEASE_MAIL_ENV` is `""` there.
- A backgrounded `deploy.mjs` or `check-phone-width.mjs` writing **nothing** to its log for many minutes: output is buffered when it is not a terminal. Not a hang.
- `test-plan` red on the commit that *opens* a cut PR: the "CI green" line cannot honestly be ticked before CI has run. Complete it in a follow-up commit; the next run goes green. This happened again at `0.25.0`, exactly as predicted.
- An edge-cache check reading `HIT, HIT, HIT` instead of `MISS, HIT, HIT`: fine if you loaded the page in the pane first — that load was the cache-filling request. What must not happen is a fresh query string each time, which gives `MISS` three times and proves nothing.

---

## Outstanding verification — what actually matters

Ten of `0.25.0`'s thirteen plans are `pending:`, by Lutan's decision at the cut.
The repo-wide `pending:` count is the normal standing state and is **not** a
release blocker — do not try to clear it.

What is worth carrying forward, most valuable first:

| Item | Where | Note |
|---|---|---|
| **A donation receipt issued on production** | `docs/test-plans/receipt-content-server-side.md`, `receipt-issuer-server-side.md` | Carried from `0.23.0`, now **three** releases. Numbering from `LCA0009000` must never repeat or skip, and it has only ever run against dev. **`0176` and `0177` changed how a receipt is built** — the server now composes the issuer and the contents — so this release gave the check *more* value, not less. It also writes the PDF to Drive. **Highest value outstanding, by a distance.** |
| **Somebody using the renamed Clinics screens on production** | `docs/test-plans/vet-to-doctor-rename.md` | Carried from `0.24.0`, the largest thing in that release. Nobody has read the Thai wording or worked a doctor login's day |
| **The first facility-map upload on production** | `docs/test-plans/facility-map-upload.md` | Carried from `0.22.0`, now a **fourth** release. It is also what *creates* the Storage bucket — `ensureBucket()` runs on first use. `0175` and the new room editor sit on top of this |
| **FIXED-IN-WAITING: the Website visitors tile is broken, and `0.25.0` mailed that it works** | `backlog` → **Next up**, first item | **Answered on 2026-10-10, after the release, and it is a bug rather than a check.** Lutan looked; the tile still says *Not set up*. Measured on the production Pi: `CLOUDFLARE_ANALYTICS_TOKEN` and `CLOUDFLARE_ZONE_ID` are absent from `.env.production.local` **and from both files it is built from**, so there is nothing for the Pi to read. #518 fixed the plumbing, not the values — it was never checked that the values existed anywhere the Pi could see them. **`0.25.0`'s fifth note is therefore false and was mailed to every admin.** Fix it, or carry a correcting line in `0.26.0`'s notes. Full diagnosis and fix in the backlog item |
| **A Management login saving Management → Website** | `docs/test-plans/website-content-grant.md` | Carried from `0.22.0`. Verified only by the migration applying cleanly |
| **The new Contacts read-permission pass** | `backlog`, Security section | `0.20.0`'s version was carried six releases and could no longer be performed — it named `staff`, retired by `0173`. **Closed at `0.25.0` and rewritten** against current behaviour, against production rows, covering all six live roles. It is a backlog item now, not a test-plan ghost |
| 2IC at phone width | `scripts/check-phone-width.mjs` | **Not a release item any more** (lesson 5) — listed once more only so it is not lost in the move. The script has no `second_in_command`, so the 2IC, who has no PC on site, has never been measured. It belongs to whoever next changes a page a 2IC uses. On the backlog |
| The signed-out public tour | every release record | Standing gap: `PUBLIC_SITE` is `locked`, so nobody has seen `/`, `/adopt`, `/our-work` or `/donate` as a visitor does |

---

## What the next release will need

1. **Step 0: read `docs/releases/2026-10-10.md`, the `0.25.0` section, end to end.** The file holds two releases; do not stop at the first.
2. **Range starts at `590a9d35`.** Run `release-prs.mjs 590a9d35 HEAD` and read its exit code directly, not through a pipe.
3. **Nothing is pending on either database.** `--status --env production` first, as always, and expect `0`. Anything else is new — see **Where things stand**.
4. **Decide major or minor with Lutan before cutting**, with anything else the cut needs, in one round. Note that `0.25.0` was major on *different grounds* from the four before it: nothing moved, but four of five notes were new abilities. Do not present five consecutive majors as one precedent.
5. **Ask whether anything in the release can fail silently** — and read the candidates in code before asking, so the question carries an answer. Three of the last four answered yes; `0.25.0` answered no, and lesson 1 is how that was established.
6. **Expect a production-only guard.** There was none this time, which cost nothing. It can only ever appear at the production dry-run, and it is a question for Lutan, not a file to fix.
7. **Budget the Worker deploy at ~13 minutes**, do not overlap it with anything building in the same checkout, and fill the wait with the Pi builds, the drift checks and the record. **Not the phone-width sweep — it is no longer a release step** (lesson 5). The test Worker deploy also builds in the main checkout — **do not start it while his production deploy is running.**
8. **Hand over commands only at the moment they should be run.** See the section above; this is the lesson of `0.25.0`.
9. **Four production-only checks are owed**: a donation receipt, the Clinics screens, a facility-map upload and a Management → Website save. The fifth — the Cloudflare analytics pair — **is no longer a check but a known bug**, diagnosed and logged at the top of the backlog's **Next up**. **Decide early whether `0.26.0` fixes it or carries a correcting release note**, because `0.25.0` has already mailed every admin that it works.
10. `/clean-streams`. The `Animal_Shelter_planner-handover-81` husk that survived two releases **was cleared at `0.25.0`** (contents checked first — only a blank copy of the test-plan template — and its PR #490 long merged), so there were no husks and no release leftovers at handover time.

---

## Who does what, unchanged

Lutan has **one job**:
`node scripts/deploy.mjs --env production | tee deploy-<version>.log`.
Everything else is Claude's, and that held again on `0.25.0` — both Pi builds over
`ssh`, both `--drift` checks, the production migration apply, the test Worker
deploy and the merge, none of which were refused once the merge was asked for in
chat.

Three things about that one job:

- **Do not hand it over while anything is building in the main checkout**, and say so when you hand it over.
- Hand it over as **one command per line** — `&&` does not parse in Windows PowerShell 5.1 — and always with the `| tee`.
- **Do not show it to him before then.** That is `0.25.0`'s lesson and the reason this file now opens with it.

The Worker production deploy deliberately has **no allow rule** and should not
get one: it is his by his own instruction of 2026-10-02, and it is what mails
every admin.
