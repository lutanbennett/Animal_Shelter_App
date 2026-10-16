# Release handover — written 2026-10-15, after `0.32.1`

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

- **`release-prs.mjs` exited 1 again, and the previous edition was right to say so.**
  Two clean first runs in a row had tempted the obvious conclusion; `0.32.1`'s range
  contained two squash-merged PRs and the script orphaned three files. **The warning
  stands exactly as written. Keep the reconciliation drill at point 6.**
- **The per-file dry-run trap fired this time**, where `0.32.0` reported that it
  "did not apply at all". Two of seven files reported FAILED and the correct action
  was to apply. The runner now **detects and explains** the dependency itself and
  still exits 0, which is new since the trap was first written down — so read the
  exit code, and read the explanation rather than only the FAILED line.
- **`npm ci` as step 1 earned its keep a fifth time**, and all four builds printed
  `Next.js version : 16.3.8` against `package.json`. Keep doing it.
- **The two-touch budget held for a fifth release**, and all three allow rules worked
  again, `apply-migrations.mjs --env production` in its plain form included.
- **The three `ERROR Failed to copy …` lines stayed closed** — zero on the production
  Worker build and three on the test one, the fourth release with that exact split.
  Not investigated, which is the point of calling it closed. Keep not investigating it.
- **`--drift <env>` is still fine**, and this release is the first where it **earned
  its keep rather than just being quoted** — see Defect 1 below. Run it on both.
- **The build order is still right and still untested.** `main` held still for a
  second release, so the thing it exists to prevent has not happened yet. Do not read
  that as the precaution being unnecessary.
- **Defect 1 is FIXED, and this file's own Defect 1 warnings went wrong within a day
  — corrected 2026-10-16.** The guard landed as #658, the three worktrees were cleared,
  and the phantom row is gone from dev. Five passages said otherwise and have been
  rewritten. **This is the standing instruction above doing its job**, and it is worth
  noting how the error would have read: a release manager meeting a red `--drift test`
  would have been told to expect one specific filename, found two different ones, and
  had to re-derive the whole thing at exactly the wrong moment. A warning that names
  the wrong symptom is worse than one that names none.

**Read these first, in this order:**

1. `docs/release-procedure.md` — the runbook, start to finish
2. `docs/releases/2026-10-15.md` → the **`## 0.32.1`** section, end to end — especially
   "The migrations" (the dry-run trap as a worked example, and the silent-failure
   answer), Defect 1, and "What this record cannot say". The **`## 0.32.0`** section
   above it is still worth reading for its silent-failure section, which is where the
   habit of *diffing* a migration header rather than trusting it comes from
3. `docs/decisions/2026-10-15-worker-first-then-pin-the-pis.md` — the build order,
   and the reasoning you would need in order to argue with it
4. `docs/decisions/2026-10-15-duplicate-0201-and-public-view-rule.md` — **the public-view
   rule**, which was `0.32.1`'s real silent-failure candidate and will be the next
   schema/app split's too
5. `docs/decisions/2026-10-13-release-prs-merge-without-asking.md` — who merges what,
   and the two-touch budget. `0.29.0` through `0.32.1` all ran under it
6. this file, for what has changed since

---

## Where things stand

| | |
|---|---|
| Live everywhere | **`0.32.1`** @ `61fb95ed` — production Pi, production Worker, test Pi, test Worker |
| Previous release SHA, for the next range | **`61fb95ed`** — `node scripts/release-prs.mjs 61fb95ed <the new release SHA>` |
| Production database | `207 applied`, **0 pending**, `No drift: production matches origin/main.` |
| Dev database | **0 pending**, but `--drift test` exits 1 — and **the reason changed on 2026-10-16, so read the section below rather than this row.** The phantom row Defect 1 was about is **gone**; what is one-sided now is an in-flight schema branch, which is the normal case |
| Next free migration number | **`0210`** in practice. `origin/main`'s highest is `0207`, so the rule would say `0208` — but an **unmerged** branch (`claude/ledger-labels-schema-1b9177`) already carries `0208` and `0209` and has applied both to dev. **Do not take `0208`**; check `git branch -a` and dev's ledger before numbering |
| `unreleased` notes already waiting | **0**, read off `origin/main` after the release |
| Open PRs | **none open as of 2026-10-16**; #651 (cut), #652 (record) and #653–#658 are all merged. One stream is in flight *without* a PR yet — see the migration-number row |

**All four builds came from the release SHA**, for the ninth release running — and for
the second release running it cost nothing to make true, because `main` did not move
after the cut.

**Server Actions key checked on both pairs again** (now four times): production
`cbd55beae8d8` on Worker and Pi; test `ecc41837fc0b` on both. Both unchanged from
`0.31.0` and `0.32.0`, which is expected — they are environment configuration, not
build output, so **matching this file's values is not evidence you checked.** Compare
Worker against Pi. The Pi's second line, `the build in .next carries that key`, is what
ties the fingerprint to the artefact rather than to the config.

### Defect 1 is fixed — and the dev drift you will see is now a different, normal thing

**Re-checked 2026-10-16, the day after the release. All three parts moved, so the
version of this section written at release time is superseded.**

What `0.32.1` reported: dev carried a phantom `schema_migrations` row,
`0201_map_rooms_drop_map_id_shape.sql`. `0203` existed to delete it, ran, was recorded
as applied — and the row came back, because `--env test` was unguarded and three
uncleared worktrees still held the file under its old name. The fix was written down in
three parts (backlog, *Deployment*, `4ff283f3`). Where each stands now:

1. **The guard — DONE and merged, #658** (`apply-migrations: refuse stale
   merged-then-renamed files on --env test`). It took the **narrow** shape the backlog
   item argued for rather than extending `GUARDED`: `GUARDED` is still
   `uat || production`, and `--env test` now separately refuses any file that is **in the
   merge-base but not on `origin/main`** — i.e. was merged and has since been renamed or
   removed (`scripts/apply-migrations.mjs` ~153–161). That is the distinction that
   matters: a brand-new file is not in the merge-base, so **schema-first work on dev
   before merge still works**, which is why full guarding would have been the wrong fix.
2. **A migration to clear the row — written and applied to dev, NOT yet merged.**
   `0208_clear_phantom_ledger_row_0201_again.sql`, on `claude/ledger-labels-schema-1b9177`.
   **The `0201` row is gone from dev's ledger.**
3. **Clear the three worktrees — DONE.** A `/clean-streams` round removed them, and a
   sweep of every `Animal_Shelter_*` checkout finds **no copy of the old filename
   anywhere**. With (1) merged this part is also no longer load-bearing: the guard now
   refuses the stale apply even if such a checkout reappears.

**So why is `--drift test` still red?** For a different and entirely legitimate reason:
`0208` and `0209_residents_breed_colour_labels.sql` are applied to dev but are not on
`origin/main`, because their branch has not merged. That is this file's own
**"Dev ahead of `main`"** case — a schema branch applied to dev under the schema-first
rule — and it clears when that branch merges.

**What to actually do:** run `--drift test`, read the filenames, and ask whether an
unmerged branch explains each one (`git branch -a`, and `gh pr list --state all`). If one
does, it is normal. **A row named `0201_map_rooms_drop_map_id_shape.sql` would now be a
genuine surprise** and would mean the #658 guard had been bypassed.

**`--env dev` is not a thing.** `apply-migrations.mjs` takes `test`, `uat` or
`production`; the dev database *is* `test` (`qxkmhwybjggxvsfxsxbd`). The same goes for
`--drift`: it is **`--drift test`**.

---

## The order of the four builds — decided, do not re-derive

`docs/decisions/2026-10-15-worker-first-then-pin-the-pis.md`. The order is:

1. merge the cut, pull
2. apply the migrations
3. deploy the **test** Worker
4. hand the **production** Worker deploy to Lutan
5. build **both Pis**, pinned with `--ref` to the SHA his deploy reports

The reason, in one paragraph: a Pi build can be pinned (`deploy-pi.sh --ref <sha>`) and
a Worker build cannot (`deploy.mjs` has **no `--ref`** and refuses a `main` that
differs from `origin/main`). So the Worker is the build that cannot be made to agree
with the others, and it should therefore be the reference they are made to agree with.
`0.31.0` did it the other way round, `main` moved twice, and keeping "all four from the
release SHA" true cost three rebuilds.

`0.32.1` followed it and it worked smoothly. Two things to know:

- **It conflicts with "Do not idle" in `docs/release-procedure.md`**, which says to
  start the Pi production build the moment the cut merges. That advice is good in
  general and loses here; the decision file says why. The runbook has not been edited,
  so you will read both — this one is newer and more specific. **There is still plenty
  to do in the gap**: `0.32.1` spent it syncing the record worktree and drafting.
- **Neither `0.32.0` nor `0.32.1` tested it.** `main` held still both times, so the
  new order has still never been exercised by the thing it exists to prevent. The real
  fix, if anyone wants to spend the time, is giving `deploy.mjs` a `--ref`, which would
  dissolve the question entirely.

**The older lesson still stands and is still the most valuable one:** an option you put
to Lutan is a commitment that it can be carried out. Verify the mechanism before
offering the choice. `--upto` exists (#570) so a partial apply is possible today, but
**it has still never been used in a real release** — rehearse it before offering an
order that depends on it.

---

## Lutan's time: two touches, and `0.32.1` hit the budget a fifth time

A release costs him **exactly two interventions**:

1. **Major versus minor** — it mails every admin and cannot be undone
2. **The production Worker deploy** — his by his instruction of 2026-10-02

**`0.32.1` cost him exactly those two**, as `0.29.0` through `0.32.0` did. `0.28.0`
cost five. **That is the standard: absorb it, do not hand it over.**

**If a release asks him for a third thing, record it in the release record as an
avoidable cost**, with what caused it — the same as any other defect.

**A minor release is cheaper than a major one in a way worth knowing.** `0.32.1` was
minor, so **no mail went out, and there was no irreversible step in the release at
all**. That changed two things: the rollback position had no gap in it for the first
time in this file's history, and the mail check inverted — you verify a **negative**,
that no `deploy: release mail` line exists in the log, rather than hunting the inbox.
Do that by grep on the log, not by assuming.

Two things not to re-derive:

- **The record PR is not a gate, and must never be presented as one.** By the time it
  exists the release is deployed and verified. Merge it, then tell him.
- **Nothing about what ships changed.** `gates.mjs`, all seven CI checks and the test
  plans are exactly as they were. A red check is still never merged past.

### The three allow rules are **not in this repository**

They are in `C:\Users\Leidos\.claude\settings.json` on Lutan's laptop:

```
"Bash(node scripts/apply-migrations.mjs --env production)"
"Bash(gh pr merge *)"
"Bash(ssh lutan@lanna-pi.local *)"
```

**Claude cannot read, add or revert them** — the classifier refuses any access to that
file as self-modification. So you cannot check they are still there by looking; you find
out when a command is refused.

**All three were exercised on `0.32.1` and all three worked.** `gh pr merge 651 --merge`
merged the cut with no prompt; `node scripts/apply-migrations.mjs --env production` ran
in its plain form and applied **seven** files; and both Pi deploys and the backup-log
read went over SSH without a prompt. **So `0.28.0`'s Defect 3 has not recurred for five
releases.** It remains unpredictable rather than fixed: `0.27.1` got the plain form
through, `0.28.0` did not, `0.29.0` through `0.32.1` did. Send it plain, exactly
`node scripts/apply-migrations.mjs --env production` — no timestamps, no redirect,
nothing wrapped round it. **If it is refused anyway**, do not retry blind: hand it to
Lutan, say the dry-run was clean, and **ask him for the output**, or the record cannot
state the file order or the timing.

**The production Worker deploy deliberately has no allow rule and must never get one.**
His instruction of 2026-10-02, and it is what mails every admin.

**Read his deploy log; do not take "done" for an answer.** On `0.32.1` he said it was
finished and the log was there: `tr -d '\000' < deploy-0.32.1.log` (`tee` writes UTF-16),
then grep for the project ref (the arrow does not survive that conversion),
`Next.js version`, `strip-baked-env`, the Server Actions key, and — on a minor release —
the **absence** of a release-mail line. All were right.

---

## In flight

**Nothing was left open by the release itself.** No migration merged after the cut, and
`main` did not move after it either.

**Do not trust a list of worktrees in this file — run `node scripts/worktree.mjs
list`.** Writing one down was tried twice and was stale within the hour both times, and
the `0.32.0` edition had to carry a correction for repeating a stale *count*. What is
durable is the shape:

- A release's own two worktrees — the cut and the record — become free leftovers once their PRs merge, and clearing them is the release manager's last step.
- `HELD — <session name>` means someone is still in it. Ask; do not tear it down.
- The list also names **husks**, folders git no longer tracks, which `done <name>` clears.
- **The three leftovers this file once called load-bearing for Defect 1 are gone** (`facility-map-with-enclosures`, `map-rooms-column-drop`, `mobile-44px-finish`), cleared by a `/clean-streams` round on 2026-10-15, and no checkout holds the old filename any more. With #658 merged they would not matter even if one came back. Ordinary tidying again, not a fix.
- **A stream can be in flight with no PR, which a PR list will not show you.** On 2026-10-16 `claude/ledger-labels-schema-1b9177` held two committed migrations already applied to dev with nothing open on GitHub. `git branch -a` is the check that sees it; `gh pr list` is not.

**If you repeat a number from this handover, run the list first and quote what it says**
— or write "run the list" and no number at all. A count copied from a previous edition
is not a fact, it is a quotation.

---

## What the next release will need

1. **Step 0: read `docs/releases/2026-10-15.md` → `## 0.32.1`**, then `## 0.32.0` above it for the header-diffing habit, then `0.28.0`'s Defect 2 in `2026-10-13.md`, then `0.26.0`'s apply-plan failure in `2026-10-11.md`.
2. **Merge the cut PR and the record PR yourself, as soon as CI is green. Do not ask.** Two touches is the budget, and a third is a defect to record. Never call the record PR "ready to merge when you say".
3. **`npm ci` in the main checkout before any deploy**, read `node_modules/next/package.json` against `package.json` straight afterwards, and read the `Next.js version :` line on the first Worker build as well. Five releases running this has been the cheap step that would have caught the expensive fault.
4. **Check the Server Actions key on both pairs**, Worker against Pi — not against this file's values, which have not changed in four releases and so prove nothing.
5. **Open with one message to Lutan** carrying major-versus-minor, the silent-failure answer, and **the whole outstanding-verification list**. `0.32.1` did this; because he had already given the version call in his opening instruction, the message carried the other two plus a flag that a case for major existed. The verification list has now closed nothing for **six** releases — **keep asking anyway.** The restore test into a real Supabase project has gone **seven** releases unanswered and is still the cheapest item on it.
6. **Range starts at `61fb95ed`** — run `release-prs.mjs` against the **release SHA after the cut merges**, not `HEAD` before it, and **re-run it if `main` moves again**. Read its exit code directly, not through a pipe. **Expect exit 1**: `0.32.1` got it on both runs, after two clean releases, and the two clean ones were luck of the range rather than a fix. Match orphans by commit subject, then **confirm each against `gh pr view <n> --json state,mergeCommit`**, and check the merge commit really is in the range with `git merge-base --is-ancestor`. A no-gap PR range is the independent check that none is missing — and a gap is closed by one state query, not by an argument from the numbering.
7. **Production will be clean; dev may be one-sided for a legitimate reason.** `--status --env production` first and expect `0`. On dev, **do not expect a specific filename** — that advice was written while Defect 1 was open and is superseded. Read the names `--drift test` prints and ask whether an unmerged schema branch explains each (`git branch -a`, not just `gh pr list` — a stream can be committed and applied with no PR open). The dev database is `--env test` and the drift check is `--drift test`.
8. **Decide major or minor with Lutan before cutting.** `0.32.1` went minor on his instruction, against a stated case for major. **There is no presumption either way**, and the question is *can anyone do something today they could not do yesterday*. Minor mails nobody — which also means **nobody is told about the new abilities**, so if the answer is yes and he still says minor, put that on the record as a decision rather than letting it read as an oversight.
9. **Ask whether anything in the release can fail silently**, and read the candidates in code first. **A header is a statement of intent, not evidence — diff it.** The shape to look for in any release touching the public site is the **public-view rule**: a column is public only when the public view names it, and an omission is silent — a signed-out visitor gets no photo with no error. `0.32.1` checked all twelve new columns against the view and the photo proxy by hand, and the file that *sounded* most dangerous (`0202`, dropping two columns) was again the safe one, because it drops without `CASCADE` and every reader was traced to a different table.
10. **Expect a production-only guard.** There has been none for nine releases running. It can only appear at the production dry-run, and it is a question for Lutan, not a file to fix.
11. **The production migration apply is yours, with an allow rule** — see above for the exact form and what to do if it is refused anyway. `0.32.1` applied **seven** files in one run. Say which case the per-file dry-run trap was: it **fired** this time (two files depending on a third), where on `0.32.0` it **did not apply**. "The trap did not fire", "the trap did not apply" and "the trap fired and the files were correct" are three different statements.
12. **Budget the Worker deploys at ~9–10 minutes each** and **do not overlap them with each other or with anything building in the same checkout** — both build in the main checkout, so the production command cannot be handed over until the test deploy has finished. **The Pi builds are on a different machine and do not conflict** — but under the build order they come *after* the production Worker deploy. Start the record worktree during the CI wait, and **remember it needs `worktree.mjs sync` before you write in it**.
13. **Hand over commands only at the moment they should be run.** `0.25.0`'s lesson; it has now held ten releases running.
14. **On a major release, confirm the mail arrived, not just `sent N`.** `lannacareforanimals@gmail.com` being skipped with `E_RECIPIENT_NOT_ALLOWED` is expected and known. **On a minor release, confirm the opposite** — grep the log and show there is no `deploy: release mail` line at all.
15. **Clear your own two worktrees — the cut and the record — once their PRs merge**, as the last step of the release. Beyond that, run `node scripts/worktree.mjs list` and read it; do not carry a leftover *count* over from this file. **The three named under "In flight" are worth clearing for a reason beyond tidiness** — they are the source of Defect 1.
16. **Writing the cut's test plan *before* opening the PR makes the first CI run green**, where the template expects it to fail on `test-plan` by construction. `0.32.1` did this and the first run was green, the second release running. The cost is that the plan's header has to guess the PR number — `0.32.0` guessed #638 and got #639; `0.32.1` guessed #651 and **got it right**, so there was nothing to correct. Worth doing, and worth knowing so a green first run does not look like a mistake.

---

## The public site is still locked, and it is still the biggest blind spot

`PUBLIC_SITE` is `locked`, so an anonymous request to `lannacare.org` gets the
"Staff testing site" gate. Three consequences a release manager should expect:

- **The public pages cannot be smoke-tested at all**, signed out or otherwise. `0.32.1`
  put a great deal in that blind spot: the three new page photos (`0200`/`0201`), the
  About page (`0206`) and Thai breed and colour (`0205`) are all public-site work, and
  the deploy proves only that the code and schema shipped.
- **A note that asserts a number is hidden more completely than one that asserts a
  layout.** `0.32.0`'s "about a third smaller" images is the standing example; nothing
  on the live site measured it, and nothing has since.
- **The edge-cache check is not merely hard, it is vacuous.** The gate is served
  `Cache-Control: private, no-cache, no-store`, so there is no cached public page to get
  a `HIT` on. Write it `n/a` with that reason rather than hunting for a browser that
  will show one.

---

## Things that look alarming but are not

Everything `0.31.0`'s and `0.32.0`'s lists hold still applies, in particular: a red
`audit` never blocks (green again on `0.32.1`); `| tee` writes UTF-16 so strip the nulls
before grepping, and the arrow does not survive that conversion, so grep for the project
ref; a backgrounded `deploy.mjs` writing nothing for minutes is buffering, not hanging;
`-- consumer:` warnings naming files that differ from the live release are the safe
direction; and `deploy: release mail … [UAT]` on production is the production setting
and the mail is real. Also:

- **`--drift test` exiting 1 with dev *ahead* is usually normal.** It means a schema branch has been applied to dev before merging, which is the schema-first rule working. Check each name against the unmerged branches. The Defect 1 phantom row is fixed (#658 plus `0208`), so a row named `0201_map_rooms_drop_map_id_shape.sql` would now be a real finding rather than the known one.
- **A FAILED dry-run can be the correct result.** On `0.32.1` two of seven files reported `42703: column … does not exist` because they rebuild a view naming columns an earlier *pending* file adds, and the dry-run rolls each file back before the next. The runner says so itself and still exits 0. Read the explanation, not just the FAILED line — and a *third* red, or a different file, is a real stop.
- **The `ERROR Failed to copy …` lines are closed** — zero on the production Worker build, three on the test one, for the fourth release running. Either count is normal.
- **A `gates.mjs` run that is much faster than the last one is a warm Turbopack cache.** Read the exit codes, not the timings.
- **A second CI run on the cut PR is correct and expected.** Ticking the "CI green" line is itself a commit, which re-runs all seven checks. Wait for the second run before merging. **The PR bar's cached reading can still show the *first* run's result after you push the tick** — `0.32.1` saw exactly that and nearly read it as green. **Confirm the run's `headSha` matches your HEAD** before merging, with `gh run list --json databaseId,headSha,conclusion,status`.
- **`test.lannacare.org/api/version` disagreeing with `/api/releases/current` mid-release is not a fault.** `/api/version` comes from the origin Pi and `/api/releases/current` is answered by the Worker, so between the test Worker deploy and the test Pi build they legitimately report different versions. Under the build order this window is **longer**, because the Pi builds come last. `0.32.1` observed it and it closed on schedule.
- **A foreground deploy that passes the ten-minute tool cap is moved to the background, not killed.** Read its log file rather than re-running it.
- **A Worker whose bundle was built at an earlier SHA still reports the right version.** `/api/version` reads `releases.ts`, so a stale Worker and a current one both say the release. The SHA in that response comes from the build, so it *is* the thing to compare — but only `/api/version`, not `/api/releases/current`, which carries no SHA at all.
- **A red `lint` on a fresh release-cut branch may not be yours.** `0.32.0`'s first gates run failed on `check-backlog-sections` over a `docs/backlog.md` item that had arrived on `main` with the morning's backlog merge — red on `main` too. Check whether the failure exists on `main` before debugging your own branch.
