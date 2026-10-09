# Planner handover — written 2026-10-09, after batch 81

**What this file is.** A snapshot for whoever runs `/plan-day` next in a fresh chat,
written at the end of nine workstreams (batches 79, 80, 81). It says where the
planning loop stands, what is blocked and on whom, and what not to re-derive. It is
**rewritten every nine workstreams** and is deliberately short-lived.

**What this file is not.** The work is `docs/backlog.md`; the plan is
`C:\Development\Animal_Shelter_App\.plan-day.md`; the rules are `CLAUDE.md` and
`.claude/skills/plan-day/SKILL.md`. **All four outrank this file.** If they disagree
with it, they are right and this file is stale — check the date at the top.

**Read these first, in this order:**

1. `CLAUDE.md` — the workstream rules, start to finish
2. `.claude/skills/plan-day/SKILL.md` — the loop you are about to run
3. `.plan-day.md` — **the top line and the last few hundred lines only.** It is
   ~7,500 lines; do not read it all. The top line says which batch is live
4. this file, for what has changed since

---

## Where things stand

| | |
|---|---|
| `main` when this was written | **`dfd28758`** |
| Dev database | **171 applied, no drift** (`apply-migrations.mjs --status`) |
| Production database | **not read from this session** — the classifier refuses production reads, and that is correct. See `docs/release-handover.md` |
| Next free migration number | **`0172`** (`0171_contacts_editor_reads.sql` is the highest on `main`) |
| Open backlog items | **85** |
| Open PRs | **none** at writing; `resident-corrections-script` is still building |
| Live worktrees | batch 81: `community-dogs` and `close-the-over-grants` **merged**, `resident-corrections-script` **still building**; plus this one, and **a pile of free leftovers** — `/clean-streams` them |
| Last release | **`0.22.0`** (2026-10-08) |
| Workstreams since this handover | **0 — the counter restarts here.** `.plan-day.md` carries it |

---

## The loop, in one paragraph

Each run: sync `main` and fold in `backlog`; read the worktree registry and **capture
token actuals for merged streams whose sessions are still open** (the only chance);
check each candidate against the code *and against what the user has already ruled
out* before offering it; present three batch tables with estimates; ask once; create
only the current batch's worktrees and briefs; save the plan and bump the counter.

---

## Three states that look like faults and are not

1. **A merged branch showing `ahead`** — the PR was squash-merged, so the branch tip
   is not in `main`. The work is in. Check the PR's state, not the count.
2. **`mergeable: UNKNOWN`** on a fresh PR — CI has not finished. Not a conflict. A
   conflict shows as `CONFLICTING`, and **silent CI on a pushed commit means exactly
   that** — sync the branch, do not wait.
3. **A `backlog` merge conflict** during the daily sync — expected, and the count is
   now **seventeen**. **"Keep both sides" has resolved every one**, in three shapes:
   two lines kept; one spliced from both; **one side discarded because the other was
   a superset.** Compare byte lengths before assuming both hold something — twice now
   the longer side was simply the same item plus a status line.

---

## The lesson that cost the most, and its new second half

**An open item is not proof the work is undone, and a status note saying "still open"
is not proof either.** On 2026-10-07 that cost four streams.

**Two commands per candidate, before it enters a batch:**
`ls docs/decisions/ | grep -i <subject>` and `git log -S "<symbol>"` (or `-- <file>`).

**NEW, 2026-10-09 — there is a third question, and it cost a stream.** The planner
briefed `perm-convert-vet` to convert the vet's policies *and* change nobody's
access. On dev those cannot both hold, and **Lutan had already declined that exact
narrowing on 2026-10-07** (*"nothing changes for a vet"*), recorded as prose inside
the item. The stream stopped and asked before writing anything; Lutan chose a third
route and it shipped well — but the brief was wrong.

**Why the two commands missed it:** they look for work that is **done**. This was
**declined**, and a declined approach lives as prose in the item, not as a decision
file or a commit. Worse, the planner leaned on `check-policy-role-names.mjs`, which
correctly reported 54 outstanding policies. **A tool that lists outstanding work
cannot know what the user has ruled out.** It was right about the work and silent
about the approach.

**So: is it done, is it blocked, and has an approach to it already been declined?**
Read the item's own prose for *declined*, *parked*, *on hold*, *Lutan said*. The same
reading caught the Vet rename being parked on 2026-10-08.

**And an item can end in a question, not a build** — the contacts-maps item closed on
Lutan answering "no preview wanted".

---

## Token estimates, from measured actuals

**Twenty-two measured, five lost.** Every loss was a **closed** session: `get_usage`
answers fine for an *idle* one, so **the loss is specifically a chat shut between the
merge and the next `/plan-day`.** There is no second chance.

Every stream pays a **~110k floor**. **Cost tracks how much a stream must find out,
not how much it writes** — `planner-handover-doc` produced a long document for
**129,722** because its brief carried a full draft.

| landmark | figure |
|---|---|
| Largest ever measured | **`donation-receipts` 454,572** (+8% on ~420k) — a document format, a numbering sequence, a form and a country variant |
| Previous record | `medications-diets-split` 361,651 |
| **The fold, proven** | **`grants-lint-and-refused-row` 130,291** for *two* backlog items — barely over the floor, where two streams would have paid ~250k |

**Do not shade estimates down by 10%.** An earlier handover said to, on a run of eight
unders. That run broke immediately: +2%, +7%, +8% since. The bands are about right.

---

## Two constraints that shaped the last three batches

**1. There are two app-wide sweeps in the queue, and neither can share a batch with
the other or with any screen work** — the **Vet→Doctor rename** and the **mobile
sweep**. This pushes work out by whole batches, and it is why `mobile-sweep` and
`perm-drop-enum` are still queued behind batch 82.

**2. One migration per batch is the real bottleneck.** Five schema-carrying
candidates were live at once. When two belong together, **fold them into one stream**
— `close-the-over-grants` folded the carer-contacts hole with four probe findings
because all five were the same thing: a right the API answers that no screen shows.

---

## What briefs should do, learned the hard way

- **Name the specific way a thing fails, not the general requirement.** The receipts
  brief said English-only receipts still need Thai glyphs *because donor names are
  free text*. That found a pre-existing bug — the vowel **ำ drops letters in the
  archive and manual PDFs too**, in documents the shelter already sends (PR #486).
  "Support Thai" would have been ticked and nothing found.
- **If you forbid a migration, say which number to take if one turns out to be
  needed.** The receipts brief said "no migration expected, stop and say so"; it
  needed one, took `0168` sensibly, and the brief had not covered that.
- **Say what is a decision and what is a build.** `close-the-over-grants` was told to
  do three fixes and *ask Lutan* about two the items marked his call.
- **Carry the reasoning, not just the instruction.** A future session undoes a
  decision whose reason it cannot see — the hard-coded receipt issuer address needed
  a comment saying why, or the obvious "improvement" puts the hazard back.

---

## Items whose remaining condition is a person

**These look exactly like stale items and are the opposite. Do not tick them, do not
plan them.** Keep this list current:

- **The maintenance board on a phone** — someone must watch the Head of Maintenance
  use it at 375 px. Put to the Director on the 2026-10-08 answers sheet; **she left
  it blank.**
- **The photo lightbox's last two controls at 375 px** — *Set as profile* and the
  *Remove photo* confirm row, on a real phone.
- **The Director signing her roles draft.** Draft 2 is loaded on test.
  `docs/decisions/2026-10-06-director-draft-apply.md` opens *"The item stays open"*
  and says she has not yet looked. Lutan said on 2026-10-09 it *"appears to already
  have been done"* — **unverified**, and production cannot be read from these
  sessions.
- **The app header's button sizes** — Lutan's call, recommendation already written
  (Sign out to 44×44).

---

## Blocked, and on whom

- **Lutan:** the two auth decisions; the Pi jobs and the failover options paper; the
  Google secret rotation (the stocktake shipped as #481, so check what is left);
  **the visitor count**, which needs a Cloudflare API token he creates; the second
  admin account (Anchalee); **loading the facility-map plans on production** — see
  below, it is an upload, not the ordering risk the item claimed; the mobile sweep,
  which he scheduled on 2026-10-09 ("if enough credits"), so `/plan-day` **may** now
  offer it; and the two clinic-access decisions `close-the-over-grants` raised.
- **The Director:** signing the roles draft; **the community-dogs baseline number and
  the date it is true up to**; the Thai receipt wording checked by a Thai reader.
- **Time:** HSTS not before **2026-11-08**; the `sharp` override until `wrangler` and
  `miniflare` ship a `sharp` past 0.35.5.

### The facility map, corrected 2026-10-09 — the recorded warning was backwards

The item said production must move its plans into storage *before* the three
committed files are deleted, or the live map blanks. **Production never had them.**
No migration has ever inserted a `facility_maps` row, so a plan exists only where
somebody uploaded one; dev's three already read `storage:plans/…`. **The production
map is already blank**, and the warning was hiding that — a feature shipped and never
populated, which no screen reports. What is outstanding is **an upload**, through the
form in Settings → Facility map, and it also covers the two new drawings.

---

## Who does what

Lutan is solo on one machine with several sessions at once, named as roles. He wants
Claude to own git; commits auto-push; **merge only on his go**. Not technical in these
areas: **plain English, no jargon, options with consequences and a recommendation.**
Deliverables go to `C:\Users\Leidos\OneDrive\Desktop`. Make the smallest defensible
choice and record it — **except an over-grant, which no screen will show as broken.**

**He holds a release for a change that breaks quietly**, and names it separately from
the count. That is why the Medium-**low** `reset_*` grant was fixed in batch 81 rather
than deferred: silent beats severity label.

---

## Two traps in the tooling

- **`grep -c` exits 1 when it finds nothing.** On 2026-10-09 a resolution chain
  `node -e … && grep -c '^<<<<<<<' … && git add && git commit` stopped **before the
  commit**, because the grep correctly found zero conflict markers. The repo sat in a
  half-finished merge and the backlog fast-forward failed twice before the cause was
  clear. Never use `grep -c` as a success check in an `&&` chain.
- **A scanned PDF cannot be read by the usual means on this machine** — no text layer,
  `pdftotext` is the only poppler tool present, and the browser pane will not
  screenshot a `file://` PDF. Render it with Windows' own engine:
  `C:\Users\Leidos\.claude\tools\render-pdf.ps1 -Pdf <file> -OutDir <dir> -Width 1500`,
  then read the PNGs. The Director returns her answer sheets as scans.

---

## Writing the next one

When `.plan-day.md`'s counter reaches nine, `/plan-day` says so. **Rewrite this file
first, in the chat that still has the context, then start the fresh chat.**

It goes through **a branch, a worktree, a test plan and a PR**, exactly as
`docs/release-handover.md` does — that one is PRs **#459** and **#471**, from
`claude/release-handover-0-22-0` and its own worktree. Lutan asked on 2026-10-09
whether the PR was really needed, since he did not remember the production handover
having one; it did. It is a `docs/` file in the repo, so the only alternatives are
committing to `main` directly or routing it through the `backlog` branch, and the
second is the 2026-10-07 failure CLAUDE.md documents by name.

Re-verify every number in the table above against the repo; carry forward only what is
still true; reset the counter in `.plan-day.md` with today's date.
