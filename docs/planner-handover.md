# Planner handover — written 2026-10-09, after batch 84

**What this file is.** A snapshot for whoever runs `/plan-day` next in a fresh chat,
written at the end of nine workstreams (batches 82, 83, 84). It says where the planning
loop stands, what is blocked and on whom, and what not to re-derive. It is **rewritten
every nine workstreams** and is deliberately short-lived.

**What this file is not.** The work is `docs/backlog.md`; the plan is
`C:\Development\Animal_Shelter_App\.plan-day.md`; the rules are `CLAUDE.md` and
`.claude/skills/plan-day/SKILL.md`. **All four outrank this file.** If they disagree with
it, they are right and this file is stale — check the date at the top.

**Read these first, in this order:**

1. `CLAUDE.md` — the workstream rules, start to finish
2. `.claude/skills/plan-day/SKILL.md` — the loop you are about to run
3. `.plan-day.md` — **the top line and the last few hundred lines only.** It is ~7,700
   lines; do not read it all. The top line says which batch is live
4. this file, for what has changed since

---

## Where things stand

| | |
|---|---|
| `main` when this was written | **`3696e59d`** |
| Dev database | **173 applied, no drift** (`apply-migrations.mjs --status`) |
| Production database | **not read from this session** — the classifier refuses production reads, and that is correct. See `docs/release-handover.md` |
| Next free migration number | **`0175`** — `0174` is owned by the live `close-the-remaining-over-grants` stream |
| Open backlog items | **89** |
| Open PRs | **none** at writing; batch 84's three have just started |
| Live worktrees | batch 84: `close-the-remaining-over-grants` :3004, `multi-tenancy-spike` :3008, `roles-parity-reconcile` :3009, plus this one :3010 — and **six merged leftovers** from batches 82 and 83 to `/clean-streams` |
| Last release | **`0.23.0`** (2026-10-09); `unreleased` already holds 4 lines from batch 83 |
| Workstreams since this handover | **0 — the counter restarts here.** `.plan-day.md` carries it |

**Nine workstreams went through in one day**, across four `/plan-day` runs. Batches merged
faster than they could be planned — twice a batch was fully merged before the next
planning run even opened. **Do not assume a batch you set up is still in flight**; check
`gh pr list` before telling the user anything about it.

---

## The loop, in one paragraph

Each run: sync `main` and fold in `backlog`; read the worktree registry and **capture
token actuals for merged streams whose sessions are still open** (the only chance); check
each candidate against the code, *against what the user has already ruled out*, and
*against whether it is waiting on a decision rather than on effort*; present three batch
tables with estimates; ask once; create only the current batch's worktrees and briefs;
save the plan and bump the counter.

---

## Four states that look like faults and are not

1. **A merged branch showing `ahead`** — the PR was squash-merged, so the branch tip is
   not in `main`. The work is in. Check the PR's state, not the count.
2. **`mergeable: UNKNOWN`** on a fresh PR — CI has not finished. Not a conflict. A conflict
   shows as `CONFLICTING`, and **silent CI on a pushed commit means exactly that** — sync
   the branch, do not wait.
3. **A `backlog` merge conflict** during the daily sync — expected, but **the count is
   still seventeen: all three merges on 2026-10-09 were clean**, one of them "Already up
   to date". When it does conflict, **"keep both sides" has resolved every one**, in three
   shapes: two lines kept; one spliced from both; one side discarded because the other was
   a superset. Compare byte lengths before assuming both hold something.
4. **NEW — `HELD` is a snapshot, not a verdict.** `worktree.mjs list` reads whether a
   process has the folder open *right now*. On 2026-10-09 four worktrees read
   `HELD — <session name>` and all four read `free` minutes later, with no chat closed in
   between. **So re-run `list` before asking the user to close sessions** — the old advice
   wasted a round trip three times in one day. Still never `done` something that reads
   `HELD` at the moment you look.

---

## The lesson that cost the most, and its two extra halves

**An open item is not proof the work is undone, and a status note saying "still open" is
not proof either.** On 2026-10-07 that cost four streams.

**Two commands per candidate, before it enters a batch:**
`ls docs/decisions/ | grep -i <subject>` and `git log -S "<symbol>"` (or `-- <file>`).

**Third question (2026-10-09, cost a stream): has an approach already been declined?**
A declined approach lives as **prose inside the item**, not as a decision file or a commit,
so the two commands cannot see it. Read the item's own prose for *declined*, *parked*,
*on hold*, *Lutan said*. A tool that lists outstanding work — like
`check-policy-role-names.mjs` — is right about the work and **silent about the approach.**

**Fourth question (2026-10-09, and it paid off immediately): is it waiting on a decision
rather than on effort?** Two Security over-grants had sat open since the morning, both
reading *"Raised with Lutan; not decided"*. They were not stale and not hard — they needed
one answer each. **Both were put to him as options-with-a-recommendation in the same
`AskUserQuestion` card as the batch confirmation, answered in one click, and committed to
the `backlog` branch before any worktree was made.** That turned two blocked items into a
buildable stream inside the planning run.

**So: ask the blocking question in the planning chat.** The planner has the whole picture
and the user is already there answering one card. Do not plan around an undecided item,
and do not create a stream whose first act is to stop.

**And an item can end in a question, not a build** — the contacts-maps item closed on
Lutan answering "no preview wanted".

---

## Token estimates, from measured actuals

**Thirty measured, five lost.** Every loss was a **closed** session: `get_usage` answers
fine for an *idle* one, so **the loss is specifically a chat shut between the merge and the
next `/plan-day`.** There is no second chance. **Batches 82 and 83 lost none** — their
sessions were still idle when the planning run reached them.

| landmark | figure |
|---|---|
| Largest ever measured | **`donation-receipts` 454,572** — a document format, a numbering sequence, a form and a country variant |
| Second, by 2,500 tokens | **`vet-to-doctor-rename` 452,067** — live tables, 5 check scripts, routes, nav, manual, both dictionaries, **two PRs** |
| **The fold, proven twice** | `grants-lint-and-refused-row` 130,291 for *two* items; `close-the-over-grants` 266,913 for *five* |

**ONE BAND IS WRONG AND SHOULD MOVE: the quick win.** The skill says 110–170k. Measured:
`account-menu-min-width` **129,320**, `residents-select-all` **179,312** (+20% on a 150k
estimate). **Use 130–190k.** A quick win never lands near the ~110k floor, because the
floor is paid before any work and a quick win still has to read, build, check and write a
test plan.

**A large mechanical sweep is cheaper than a large design-and-build.** The rename touched
far more files than the receipts stream and still came in under it. When sizing a large
item, ask how much must be *decided*, not how much must be *typed*. **Cost tracks how much
a stream must find out** — `planner-handover-doc` produced a long document for **129,722**
because its brief carried a full draft.

**Do not shade estimates down by 10%.** This now needs saying twice over. An earlier
handover said to, on a run of eight unders; that run broke immediately (+2%, +7%, +8%).
Batches 82 and 83 then produced **five unders in six**, by 11–33% — and the one over was
the quick win. Two runs of undershooting is exactly what the trap looks like from the
inside. **Fix the quick-win band; leave medium and large alone.**

---

## Two constraints that shape batches

**1. One app-wide sweep is left, and it cannot share a batch with screen work** — the
**mobile sweep**. The Vet→Doctor rename, the other one, **shipped 2026-10-09 as #495 and
#496**, so the queue behind it has cleared. The mobile sweep's own item says Lutan
schedules it and `/plan-day` should **stop offering it**; he mentioned it on 2026-10-09
"if enough credits" and then twice chose other work when it was offered as an explicit
swap. **Offer it as a swap option, never as a slot-filler, and let him decline it.**

**2. One migration per batch is still the real bottleneck.** Three candidates are queued on
it right now: `facility-map-rooms`, and the two items `dashboard-cashflow-followups` spun
out (a Cashflow forecast function for second doses and Thai-time months; a vaccine stock
forecast). When two belong together, **fold them into one stream.**

**2a. NEW — a stream that must not merge still needs the slot managed.**
`multi-tenancy-spike` would add `shelter_id` across ~45 tables on a branch that is never
merged. Done with a numbered migration **that leaves dev carrying schema `main` does not
have**, and blocks every other stream until someone writes a down-migration. It was
**explicitly forbidden a migration number** and told to use the `begin … rollback`
`do $$ … $$` harness, to measure by reading and counting where a transaction is too small,
and to finish with `apply-migrations.mjs --status` showing no drift as a test-plan tick.
**That is what let it share a batch with a migration-carrying stream.**

---

## What briefs should do, learned the hard way

- **Name the specific way a thing fails, not the general requirement.** The receipts brief
  said English-only receipts still need Thai glyphs *because donor names are free text*.
  That found a pre-existing bug — the vowel **ำ dropped letters in the archive and manual
  PDFs too** (#486, merged). "Support Thai" would have been ticked and nothing found.
- **If you forbid a migration, say which number to take if one turns out to be needed** —
  or, where the stream must not touch dev at all, **forbid the number outright and name the
  harness instead** (see 2a). The receipts brief said "no migration expected"; it needed
  one, took `0168` sensibly, and the brief had not covered that.
- **Say what is a decision and what is a build**, with the recommendation attached.
  `close-the-over-grants` was told to do three fixes and *ask Lutan* about two.
- **Carry the reasoning, not just the instruction.** A future session undoes a decision
  whose reason it cannot see — the hard-coded receipt issuer address needed a comment
  saying why.
- **NEW — name the release-time hazard in the PR, not just in the code.**
  `remove-staff-role` archives a role, and **an archived role's logins fail closed.** If
  that migration reaches production before production's Staff holders are moved, those
  people cannot sign in. The brief told it to write the prerequisite into the PR as a
  release blocker, because the release manager reads the PR and nobody should rely on
  someone remembering.
- **NEW — tell a stream what to do with work it is not allowed to take.** Forbidden its
  migration slot, `dashboard-cashflow-followups` **spun the two schema-needing candidates
  out as new backlog items** rather than quietly taking a number or silently dropping them.
  Brief that behaviour explicitly; it is the difference between a constraint and a loss.
- **A stream told "schema first, then the sweep" will split itself into two PRs.** Both the
  rename (#495/#496) and `remove-staff-role` (#498/#499) did, unprompted. Where the item
  says `main` must never carry schema the code does not know, **keep both PRs in one
  stream** rather than splitting across batches as rule 4 would otherwise have it.
- **For an umbrella item of lettered candidates, the first deliverable is the sort-out, not
  the build** — build-now / needs-a-column / needs-Lutan, shown to him before anything
  substantial is built.

---

## Items whose remaining condition is a person

**These look exactly like stale items and are the opposite. Do not tick them, do not plan
them.** Keep this list current:

- **The maintenance board on a phone** — someone must watch the Head of Maintenance use it
  at 375 px. Put to the Director on the 2026-10-08 answers sheet; **she left it blank.**
- **The photo lightbox's last two controls at 375 px** — *Set as profile* and the *Remove
  photo* confirm row, on a real phone.
- **The Director signing her roles draft.** Draft 2 is loaded on test.
  `docs/decisions/2026-10-06-director-draft-apply.md` opens *"The item stays open"*. Lutan
  said on 2026-10-09 it *"appears to already have been done"* — **unverified**, and
  production cannot be read from these sessions.
- **The app header's button sizes** — Lutan's call; recommendation already written (Sign
  out to 44×44). Partly shipped 2026-10-07; read the item before re-raising.
- **The Staff holders on production** — `remove-staff-role` asked him for the list and who
  each person becomes. Until that is answered, **`0173` must not reach production**, or
  those logins fail closed.

---

## Blocked, and on whom

- **Lutan:** the two auth decisions; the Pi jobs and the failover options paper; the Google
  secret rotation (the stocktake shipped as #481, so check what is left); **the visitor
  count**, which needs a Cloudflare API token he creates; the second admin account
  (Anchalee); **loading the facility-map plans on production** — see below, it is an
  upload; the mobile sweep; and the product `.org` name, which `multi-tenancy-spike` will
  bring him a shortlist for.
- **The Director:** signing the roles draft; **the community-dogs baseline number and the
  date it is true up to**; the Thai receipt wording checked by a Thai reader.
- **Time:** HSTS not before **2026-11-08**; the `sharp` override until `wrangler` and
  `miniflare` ship a `sharp` past 0.35.5.

### The facility map — the recorded warning was backwards, and it still is

The item said production must move its plans into storage *before* the three committed
files are deleted, or the live map blanks. **Production never had them.** No migration has
ever inserted a `facility_maps` row, so a plan exists only where somebody uploaded one;
dev's three already read `storage:plans/…`. **The production map is already blank**, and
the warning was hiding that — a feature shipped and never populated, which no screen
reports. What is outstanding is **an upload**, through the form in Settings → Facility map,
and it also covers the two new drawings. Still true on 2026-10-09.

---

## Who does what

Lutan is solo on one machine with several sessions at once, named as roles. He wants Claude
to own git; commits auto-push; **merge only on his go**. Not technical in these areas:
**plain English, no jargon, options with consequences and a recommendation.** Deliverables
go to `C:\Users\Leidos\OneDrive\Desktop`. **The repo is public** — never commit or attach a
file naming real people. Make the smallest defensible choice and record it — **except an
over-grant, which no screen will show as broken.**

**He holds a release for a change that breaks quietly**, and names it separately from the
count. That is why the Medium-**low** `reset_*` grant was fixed in batch 81 rather than
deferred, and why he chose "lock it down" over "reading is fine" for the attachment
over-grant on 2026-10-09: the probe had **deleted all 146 rows** under a clinic login, and
nothing in the app would have shown it.

---

## Three traps in the tooling

- **`grep -c` exits 1 when it finds nothing.** On 2026-10-09 a resolution chain
  `node -e … && grep -c '^<<<<<<<' … && git add && git commit` stopped **before the
  commit**, because the grep correctly found zero conflict markers. The repo sat in a
  half-finished merge and the backlog fast-forward failed twice before the cause was clear.
  Never use `grep -c` as a success check in an `&&` chain.
- **NEW — do not put long prose with backticks and apostrophes inside `node -e '…'`.** A
  backlog-editing one-liner broke on shell quoting on 2026-10-09 and wasted a round trip.
  **Write the script to the scratchpad directory and run it with a path argument.** Same
  for any multi-line replacement text.
- **A scanned PDF cannot be read by the usual means on this machine** — no text layer,
  `pdftotext` is the only poppler tool present, and the browser pane will not screenshot a
  `file://` PDF. Render it with Windows' own engine:
  `C:\Users\Leidos\.claude\tools\render-pdf.ps1 -Pdf <file> -OutDir <dir> -Width 1500`,
  then read the PNGs. The Director returns her answer sheets as scans.

### One husk that cannot be cleared, and has been raised twice

`Animal_Shelter_planner-handover-81` is a folder git no longer tracks. `done` **refuses
it**, because the folder is no longer a git repo and so cannot be checked for uncommitted
work; only `--force` gets past that, and **that is Lutan's call, not a session's.** He has
been told twice. **Mention it once if it is still there, then leave it.**

---

## Writing the next one

When `.plan-day.md`'s counter reaches nine, `/plan-day` says so. **Rewrite this file first,
in the chat that still has the context, then start the fresh chat.** Offer it; do not just
do it.

It goes through **a branch, a worktree, a test plan and a PR**, exactly as
`docs/release-handover.md` does — that one is PRs **#459** and **#471**. This one is
`claude/planner-handover-84`, and the previous was **#490** from
`claude/planner-handover-81`. Lutan asked on 2026-10-09 whether the PR was really needed;
it is. It is a `docs/` file in the repo, so the only alternatives are committing to `main`
directly or routing it through the `backlog` branch, and the second is the 2026-10-07
failure CLAUDE.md documents by name.

Re-verify every number in the table above against the repo; carry forward only what is
still true; reset the counter in `.plan-day.md` with today's date.
