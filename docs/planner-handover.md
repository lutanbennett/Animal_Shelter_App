# Planner handover — written 2026-10-12, after nine workstreams

**What this file is.** A snapshot for whoever runs `/plan-day` next in a fresh chat. Written at the
end of nine workstreams planned and merged in one chat on one afternoon — the second planning chat
of 2026-10-12, after the batch-96 handover. It says where the planning loop stands, what is blocked
and on whom, and what not to re-derive. It is **rewritten every nine workstreams** and is
deliberately short-lived.

**What this file is not.** The work is `docs/backlog.md`; the plan is
`C:\Development\Animal_Shelter_App\.plan-day.md`; the rules are `CLAUDE.md` and
`.claude/skills/plan-day/SKILL.md`. **All four outrank this file.** If they disagree with it, they
are right and this file is stale — check the date at the top.

**Read these first, in this order:**

1. `CLAUDE.md` — the workstream rules, start to finish
2. `.claude/skills/plan-day/SKILL.md` — the loop you are about to run
3. `.plan-day.md` — **the top line and the last few hundred lines only.** The top line says which
   batch is live
4. this file, for what has changed since
5. **`docs/architecture-review-2026-09-22.md`** — 568 lines, the best single description of the
   system. Read §1 before planning anything structural. **Its findings are nearly worked through:
   S1, S2, S3, S5, S6, S7, C2, C3, C5, C6 and N1/N4 are all closed. C4 and C7 remain**

---

## Where things stand

| | |
|---|---|
| `main` when this was written | **#574 merged** (`claude/stock-receipts-update-policy`) |
| Dev database | **192 applied, 0 pending, no drift** |
| Production database | **not read from this session** — the classifier refuses production reads, and that is correct. See `docs/release-handover.md` |
| Next free migration number | **`0192`** — but read *the `0191` collision* below before using it |
| Open backlog items | **92**, down from 96 |
| Open PRs | **none** — but `claude/bills-inbox` is **8 commits ahead and mid-build**; see *Two streams that are not finished* |
| Last release | **`0.27.1`** (2026-10-12) |
| `unreleased` | **one line** (the photo-first Add photos button). A cut is NOT yet due |
| Workstreams since this handover | **0 — the counter restarts here.** `.plan-day.md` carries it |

**Nine workstreams in one afternoon, eight of them planned in three batches and merged:** #566–#574.
**Batch 1 was set up and fully merged inside about 40 minutes.** **Do not assume a batch you set up
is still in flight** — check `gh pr list` before telling the user anything about it. It happened
three times in a row today: every single `/plan-day` resume found its batch already merged.

---

## The loop, in one paragraph

Each run: sync `main` and fold in `backlog`; check whether the live batch has merged and **capture
token actuals in that same turn if it has**; check each candidate against the code, against the
live database, *against what the user has already ruled out*, and *against whether it is waiting on
a decision rather than on effort*; present three batch tables with bands **and a model/effort
recommendation**; ask once; create only the current batch's worktrees and briefs, **each ending with
the pre-push test-plan block**; save the plan and bump the counter.

---

## THE BIGGEST MISTAKE OF THE DAY, AND IT WAS THE PLANNER'S

**Two migration files on `main` both numbered `0191`:** `0191_donation_channels.sql` (#572) and
`0191_stock_receipts_update_policy.sql` (#574). Both merged. Both applied to dev.

**How it happened, exactly.** `bills-inbox` was briefed as schema-then-app in one worktree: PR 1 was
`0190`, which merged. The planner then read "its migration has landed" as "it no longer holds the
migration slot", and put `donate-channels` — which needed its own table — in the same batch, with
the words *"You hold the only migration slot in this batch"* written into its brief. **But when
`bills-inbox` started building its app half, it discovered that matching a bill to a delivery has to
UPDATE `stock_receipts`, which needed a policy it did not have.** So it correctly opened a second
schema PR. Two live streams, two free-looking numbers, same number.

**The rule this gives, and it is new:**

> **A schema-then-app stream holds the migration slot until its APP PR merges, not until its schema
> PR merges.** The app half is exactly where a second migration gets discovered, because that is
> where the code meets the policies.

**`scripts/check-migration-numbers.mjs` cannot catch this, and it is in CI on every PR.** It compares
a PR's files against its base branch. Each PR separately took a number that was genuinely free at the
time; the collision exists only in the merge of both. **So do not expect the gate to save you here —
this one is the planner's job at planning time.**

**What to do about the two files: nothing, and say so.** Applied files are never edited
(`CLAUDE.md`), both are recorded in `schema_migrations` under their own filenames, both applied
cleanly, and they touch unrelated objects so the order between them does not matter. **But the
production release manager must be told**, because "0191" is now ambiguous in conversation. There is
a backlog item for the hazard; do not reopen the decision to rename them.

---

## Two streams that are not finished, and both look finished

**`gh pr list` showing a branch MERGED says nothing about whether the stream's work is done**, and
this bit twice in one afternoon.

| stream | what merged | what is still missing |
|---|---|---|
| `bills-inbox` | #569 (`0190`, three files, no app code) and #574 (its second migration) | **The entire Bills feature** — the Bills page and inbox, Add a photo of the bill on Record a delivery and the clinic visit, the `Bills/<year>/<month>` Drive folder, the unmatched count. **In flight: 8 commits ahead, session live** |
| `donate-channels` | #572 (`0191`, the table, a checker, the public view) | **The buttons.** No Settings → Website → Donate, no buttons on `/donate`. Its session is idle at 149,808 and warm |

**The tell was the token figure, both times.** `bills-inbox` measured **106,428** against a
~300–400k band for both halves; `donate-channels` **149,808** against ~250–330k. **A stream that
comes in at a third of its band has usually not done the work, not beaten the estimate.** Read the
PR's file list before recording an actual as a win: `gh pr view <n> --json files`.

**Both can be resumed in their own live sessions rather than re-worktreed** — Lutan chose that for
`bills-inbox` and it is much cheaper, because the session has already read the schema and the
decision file and pays the ~77k floor only once. `SendMessage` to the session by its name
(`ListAgents` lists them) works and was confirmed delivered today.

---

## Token estimates — twenty-eight measured, none over band

### Today's eight

| batch | slug | model / effort | estimated | actual | |
|---|---|---|---|---|---|
| 3 | `test-runner-node-test` | sonnet-5-5 / low | ~170–240k | **169,049** | inside |
| 3 | `donate-channels` | sonnet-5-5 / low | ~250–330k | **149,808** | **PR 1 only — not a win** |
| 2 | `migrate-upto` | sonnet-5-5 / low | ~150–210k | **116,883** | 22% under |
| 2 | `resident-page-split` | sonnet-5-5 / low | ~250–350k | **194,681** | 22% under |
| 2 | `bills-inbox` | sonnet-5-5 / low | ~300–400k | **106,428** | **PR 1 only — not a win** |
| 1 | `backup-daily` | sonnet-5-5 / low | ~150–220k | **158,310** | inside |
| 1 | `photo-first-tagging` | sonnet-5-5 / low | ~200–290k | **218,173** | inside |
| 1 | `bills-schema` | sonnet-5-5 / low | ~190–260k | **155,018** | 18% under |

**All eight confirmed from `get_session` as `claude-sonnet-5-5` / `low`** — read, not assumed.

### THE FLOOR IS ~77k, NOW CONFIRMED SEVEN TIMES

Identical to the hundred in every session measured today: System tools 38,776 · MCP 16,902 ·
Memory 9,820 · Skills 6,383 · System prompt 4,973 = **76,854**. (Two sessions showed System tools at
39,186 and 39,849 — a kilotoken of drift from extra tools loaded, nothing more.) **This is settled.
Stop re-deriving it and stop calling it one measurement.**

### Two band corrections earned today

- **A schema PR that also adds a permission activity, or writes its own checker script: ~150–175k**,
  not the 230–285k "schema with code" band. `bills-schema` did two files, four enum values, three
  tables and views, and a new `maintenance.bills` activity for **155,018**. `donate-channels` did a
  table, a public view **and** `scripts/check-donation-channels-schema.mjs` for **149,808**. Both
  well under `role-floor-schema`'s 231,297. **The old "with code" band was measuring something
  else.**
- **"Prove the refactor's output is identical" does NOT widen the band.** `resident-page-split` split
  a 1,465-line file into ten and proved it with probes across several roles and resident states, for
  **194,681** against ~250–350k. **Third confirmation of the 2026-10-11 rule: reading and rewriting
  is cheap; only building a measuring instrument is expensive**, and a loop over ten sections is not
  an instrument. Reserve a wide band for a script that must establish something nobody knows, as
  `who-does-what-view` did at 449,014.

### Landmarks

| | |
|---|---|
| Largest ever measured | **`who-does-what-view` 449,014** (est. ~300k, +50%) |
| Second | **`fable-architecture-review` 448,294** — fable-5-1 at `xhigh`, **two dials, not comparable** |
| Cheapest stream ever | **`release-note-truth-rule` 103,070** |
| Cheapest schema stream | **`receipt-backdate-rule` 119,322** |

**Nothing lands below ~100k.**

### CAPTURE THE FIGURE WHEN THE PR MERGES, NOT AT THE NEXT `/plan-day`

**Now twenty-six consecutive successes and not optional.** The instant a stream's PR has merged, call
`get_usage` **in that same turn**, before touching the registry. Today all eight were captured
because every resume checked `gh pr list` first and found the batch already merged.

- **An archived session is as lost as a closed one.**
- **The condition is a live process, not a session state.** `isRunning: false` has answered fine
  twenty-six times. **Do not infer readability from the listing — try the call.**
- **It is not a setting to change.** Lutan archives by hand, which is correct.

---

## Model and effort

**Two dials, and they do not behave the same way.** **Model** changes the price per unit of work, not
the amount: the floor is identical whichever model runs, so **choosing a cheaper family is the only
dial that reduces usage without changing the work.** **Effort** changes how much thinking happens per
turn, so raising it **raises** the figure. **It is not a usage optimisation and must never be
presented as one.**

**Never raise effort to fix an overrun.** The cure is a tighter brief or a spin-out.

**`claude-sonnet-5-5` / `low` is the default and the evidence is now strong:** twenty-eight
consecutive streams, none over band, including a dozen carrying migrations or permissions. **The
caveat stands — the briefs also keep getting better, so the model cannot take all the credit.**

**Fable sat at 5% all day and expires 2026-10-14.** The remaining Fable item is *Fable dry run of the
acceptance checklist*, still blocked on Lutan and the Director agreeing who tests which role. The
drop-shipment options paper was offered twice as a use for the bucket and not taken up. **Do not
offer a third time.** All-models went **73% → 76%** across the nine.

---

## What briefs should do — the additions that paid off today

Everything from the last handover still holds. Four things earned their place:

- **The pre-push test-plan block works.** Zero format-only test-plan commits across all eight
  streams, against six in the two batches before it was added. Copy it verbatim from the skill; the
  four named traps are the whole value.
- **Name the hazard instead of raising the dials.** `backup-daily` was writing code that deletes the
  shelter's only copy of its data. Its brief named the floor (never prune without a confirmed upload,
  always keep the newest few) and asked for proof against fabricated failed runs. It stayed at `low`,
  came in inside band, and got it right.
- **Tell a stream to file the outstanding step as a backlog item, not a test-plan row.**
  `backup-daily`'s brief said so and it did (*"Switch the Pi's backup from Sundays to daily"*). This
  is the `x-origin-key` lesson applied before it could bite: nothing ever re-reads a merged PR's test
  plan. **Repeat this in every brief whose work ends on the Pi or a deploy.**
- **Hand a schema stream the next stream's needs too.** `bills-inbox`'s migration brief said to add
  **all four** bill owner types to `record_attachment`, including `maintenance_bill`, which its own
  work did not need. **Verified in the merged file: all four arms are there**, so
  `maintenance-bills` needs no migration at all. One file instead of two branches.

**And one false finding avoided, worth knowing:** `node --test` does **not** appear in
`scripts/gates.mjs` or in CI as that string. It is wired correctly as `npm test` — `package.json`'s
`test` script runs `node --test` with `scripts/test-support/register.mjs`. **Grepping for the flag
makes it look missing when it is present.** Eight `*.test.mjs` files landed in #573.

---

## Candidates for the next batch, in order

**No release cut is due yet** — `unreleased` carries one line. It will be due once the two unfinished
features land, and both will add one.

1. **Finish the two half-done features, and prefer resuming their live sessions.**
   (a) `bills-inbox`'s Bills page — **already in flight.** (b) `donate-channels`' buttons — **not
   started**; its session is idle and warm at 149,808.
2. **`maintenance-bills`** — **Bills on maintenance jobs** (the build). **No migration needed**,
   verified. Waits on (1a), because it extends the same Bills inbox page.
3. **`photo-rpc`** — **An internal photo costs seven queries** (review C7). Needs a migration
   (`can_see_drive_file`, written like `is_public_drive_file` in `0084`). **Deferred twice today for
   slot reasons only; nothing blocks it.**
4. **C4** — both dictionaries ship to every phone; load only the active one.
5. **The `x-origin-key` Pi deploy item** and **the Pi backup crontab item** — both are deploys plus a
   check, not workstreams. Release-manager work with Lutan.
6. **The thirteen red check harnesses** — three need a per-role ruling from Lutan.

---

## Items whose remaining condition is a person

**These look exactly like stale items and are the opposite. Do not tick them, do not plan them.**
Carried forward from the batch-96 handover; **none was re-verified today**, so treat the list as a
pointer and check any one you intend to act on.

- **The maintenance board on a phone** — someone must watch the Head of Maintenance use it at 375 px.
  Put to the Director on the 2026-10-08 answers sheet; **she left it blank.**
- **The photo lightbox's last two controls at 375 px** — on a real phone.
- **The Director signing her roles draft** — Lutan said on 2026-10-09 it *"appears to already have
  been done"*; **unverified**, and production cannot be read from these sessions.
- **The app header's button sizes** — Lutan's call; recommendation already written.
- **The Staff holders on production** — until that list is answered, **`0173` must not reach
  production**, or those logins fail closed.
- **The acceptance checklist's pre-run agreements** — who tests which role, the per-role accounts on
  Test, what counts as a blocker, and where the signed paper copy lives (**it carries real names and
  this repo is public**). **This also blocks the one remaining Fable item.**
- **Who can read what of a contact, checked on production**, as each of six roles.
- **The role walkthrough re-run** — owed twice; a person runs it.
- **`search_path` on production** — dev came back 0 unpinned, but production may be behind on
  migrations and hold an older unpinned body. A one-minute release-manager query, in #560's test plan.
- **NEW — the Pi's backup schedule.** `backup-daily`'s code is merged, but **backups are still weekly
  until the crontab hand step is done on the Pi with Lutan.** Filed as its own backlog item.

---

## Blocked, and on whom

- **Lutan:** the two auth decisions · the Pi jobs and failover options paper · the Google secret
  rotation leftovers · the second admin account (Anchalee) · the mobile sweep (**declined five times
  — offer only as a swap**) · the product `.org` name · **whether the purchasing job keeps reading
  stock receipts through `stock.delivery`** · **three of the thirteen red check harnesses**.
- **The Director:** signing the roles draft · **the community-dogs baseline number and the date it is
  true up to** · the Thai receipt wording checked by a Thai reader · the online merchandise shop.
- **Time:** HSTS not before **2026-11-08** · the `sharp` override until `wrangler` and `miniflare`
  ship a `sharp` past 0.35.5.

### Answered and closed — do not re-raise

1. **The quick-win band stays as written** (2026-10-11, asked four times).
2. **The test-site visitor tile is NOT wanted.** The grey *Not set up* on `test.lannacare.org` is
   **the intended permanent state.**
3. **The Director MAY backdate a receipt.** `received_on <= issued_on <= today`, Bangkok today.
4. **The token floor is ~80k** (measured 76,854, seven times).
5. **`/r` and `/e` are not edge-cached, on purpose** (2026-10-12).
6. **NEW — maintenance bills are Management and Admin only** (Lutan, 2026-10-12): *"lets keep it at
   management for now. The maintenance lead would give all receipts to the manager anyway."* The
   activity `maintenance.bills` exists and is on the Who does what grid, so it can be widened without
   a release.
7. **NEW — backups prune by AGE, not count.** Lutan's words were "remove backups over 2 weeks old",
   so the architecture review's `--keep 30` was superseded. Both items are ticked.

---

## Who does what

Lutan is solo on one machine with several sessions at once, named as roles. He wants Claude to own
git; commits auto-push; **merge only on his go** — though he merges from the PR bar himself, often
before the planner has read the checks. Not technical in these areas: **plain English, no jargon,
options with consequences and a recommendation.** Deliverables go to
`C:\Users\Leidos\OneDrive\Desktop`. **The repo is public** — never commit or attach a file naming
real people. **Never give him a command before the moment he should run it.**

**He holds a release for a change that breaks quietly**, and names it separately from the count.

**He answers questions put as options with a recommendation, and he answers them fast.** On
2026-10-12 he took the recommendation every time it was offered — six for six across two chats — and
**chose the cheaper path when it was explained** (resuming a warm session rather than a fresh
worktree). **A two-line "here is the trade-off, here is what I suggest" gets a decision in seconds;
a paragraph of options does not.**

**He may start a batch before the planning conversation finishes, may set a different model or effort
than recommended, may merge a PR himself, and may pull an urgent item in outside the batch.** **Ask
what he has actually started rather than assuming the plan describes reality.**

---

## Traps in the tooling

- **`grep -c` exits 1 when it finds nothing**, so never use it as a success check in an `&&` chain.
- **Do not put long prose inside `node -e` or a `bash` heredoc.** Backticks, apostrophes and quotes
  break parsing in ways the error does not explain, and **a script can report success while writing
  mangled text**. **Write the file with the file-writing tool.**
- **Appending by line position needs an anchor that cannot match another item, and a guard.** `§` and
  other non-ASCII are multibyte — avoid them in anchors. **`sed -n "${A}p"` with an empty `$A` prints
  the ENTIRE FILE** — always `test -n "$A"` first.
- **A long backlog item is one line.** `sed -n '273p'` can print 4 KB, and `sed -n '1,90p'` on
  `docs/backlog.md` printed **152 KB** today. **To survey the backlog, extract the bold titles**:
  `awk '/^## Completed/{exit} /^## /{sec=$0} /^- \[ \]/{print NR"|"sec"|"substr($0,1,150)}'`. Then
  read only the items you are actually planning. **And the line numbers move** the moment anything is
  added on the `backlog` branch — re-find by title, never reuse a number from earlier in the chat.
- **A scanned PDF cannot be read by the usual means on this machine.** Render it with
  `C:\Users\Leidos\.claude\tools\render-pdf.ps1 -Pdf <file> -OutDir <dir> -Width 1500`, then read the
  PNGs. The Director returns her answer sheets as scans.
- **To query dev read-only**, copy the `query()` helper from `scripts/apply-migrations.mjs:140` into a
  scratchpad `.mjs` and load credentials with **`loadEnv("test")`** — *not* `loadEnv("development")`,
  which demands a `.env.deploy.development` that does not exist and exits 2. **And import
  `scripts/lib/env.mjs` as a `file:///C:/Development/...` URL**: a relative path out of the scratchpad
  resolves against the wrong root and fails with `ERR_MODULE_NOT_FOUND`. This is the third
  already-done check and it is the one that catches phantoms the file greps cannot.
- **The planner can apply a migration to dev**, from the main checkout only, and today it was the
  step that unblocked a stream. `--dry-run` first; the consumer WARNINGs about files "not on
  origin/main at all" are **correct and expected** when the reader is the next PR.

### Leftovers

**Nine `Animal_Shelter_*` folders at writing, eight of them merged leftovers** — `brief-test-plan-gate`,
`planner-handover-96`, and today's `bills-schema`, `photo-first-tagging`, `backup-daily`,
`migrate-upto`, `resident-page-split`, `donate-channels`. **Every actual through today is captured**,
so nothing is at risk if Lutan archives those chats. **`bills-inbox` is NOT a leftover — it is
working.** `/clean-streams` does the round.

**The `planner-handover-81` husk is gone**, cleared since the last handover. It was raised six times;
it does not need raising again.

---

## Writing the next one

When `.plan-day.md`'s counter reaches nine, `/plan-day` says so. **Rewrite this file first, in the
chat that still has the context, then start the fresh chat.** Offer it; do not just do it.

**Count the workstreams honestly.** Today's nine are eight planned streams plus this handover.
`bills-inbox`'s second migration PR (#574) is **not** a tenth stream — it is the same worktree and the
same session, and counting PRs instead of streams is how the counter read 13 and then 16 on
2026-10-12.

It goes through **a branch, a worktree, a test plan and a PR**, exactly as `docs/release-handover.md`
does. This one is `claude/planner-handover-105`; the previous were **#562** (`planner-handover-96`),
**#546** (`93`), **#514** (`87`), **#501** (`84`) and **#490** (`81`). Lutan asked on 2026-10-09
whether the PR was really needed; **it is.** It is a `docs/` file in the repo, so the only
alternatives are committing to `main` directly or routing it through the `backlog` branch, and the
second is the 2026-10-07 failure `CLAUDE.md` documents by name.

Re-verify every number in the table above against the repo; carry forward only what is still true;
reset the counter in `.plan-day.md` with today's date.
