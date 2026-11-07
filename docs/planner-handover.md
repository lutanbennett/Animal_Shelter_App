# Planner handover — edition `690`, 2026-11-07

**This is a DELTA against `681`.** It says what changed, corrects its predecessor, and reports what each
of `681`'s warnings and owed items actually did. Per-stream figures, batch composition, ports and the
dependency notes live in `.plan-day.md` and are **not** reproduced here.

**It outranks nothing.** It is read by one chat, it will be rewritten within one plan, and a wrong line
in it is corrected by its successor rather than by a reviewer.

**Written at the SETUP of this plan's last batch, so BATCH 3'S OWN FIGURES ARE NOT IN IT.** `690`'s
batch 3 — `general-bill-receipts`, `reels-readonly-drive`, `page-level-required` — was handed over at
01:50Z and had not been opened. The next edition carries its actuals. Nobody asked for this edition; the
counter did.

---

## THE LEAD: SIX OF `681`'s SEVEN OWED ITEMS ARE DISCHARGED, AND THE SEVENTH IS HIS

`681` handed over seven. **Six closed inside one plan**, which has not happened before:

1. **`#e7v1q` — "goes to the front of the next plan"** → **honoured without displacing his own
   priority.** It carried a migration and so wanted the slot that Lutan's new high-priority `#jdoto`
   needed. **They are the same kind of work** — a Settings switch deciding what the public site shows —
   so one migration file (`0328`) carried both keys and `#e7v1q`'s code half rode batch 2. Ticked by
   #1358. **The lesson: "front of the next plan" and "his item leads" are not always in conflict; look
   for the fold before you choose between them.**
2. **`#k3q7w` — the closed-record banner** → **closed by #1354, and the brief's refusal to assert is why
   it came out right.** `681` said several sentences exist and not all are wrong. The brief carried that
   verbatim. The stream found the banner is a **SECOND string** — `DeceasedBanner.tsx:75` →
   `deceased.banner.readOnly` — **not** the `recordClosed` one `#f6p2d` fixed, which it confirmed *"was
   and is correct"*. It fixed four and **left seven alone as already correct.**
3. **`#bqs1w` — "probably closable and nobody has checked"** → **the planner checked.** The core fault
   is fixed (`tagsNotLinked` and `tagsNotAllowed` both exist, `en.ts:4575`); what is left is that neither
   notice names which residents, and the `failed` path was never driven. **Folded into `#a7r3k`** rather
   than left as its own near-empty item.
4. **The Reels half of `#i7qkz`, "including the reel tag-search that still asks `resident.record`"** →
   **both halves closed by #1359, the tag-search included.** It built `/api/reels/resident-search` asking
   `resident.who_and_where` Read, proved a `reel_add`-only login gets 200 where the old route gave 403,
   and **widened no card.**
5. **`#52y56` must stay unscheduled** → **HELD.** Not scheduled, not re-argued, and Lutan's own
   correction of its title stands.
6. **Ollama is still NOT installed** → unchanged and still true. The scripted stand-in
   (`docs/dev-assistant-model.md`) remains good for a save path and a failure notice and **not** for
   judging whether the assistant understands a sentence. **A real model is his install.**
7. **Still his, blocking nothing:** `#mzu7v` needs `STATUS_READ_TOKEN` on production, and `#u7d3b`'s data
   half waits on his keys.

**Where `681` was over-cautious:** nothing material. Its one soft spot was leaving `#bqs1w` as an owed
*read* when one `grep` of `en.ts` settles it — **an owed item that costs one command is cheaper to
discharge than to hand on.**

---

## NINE CONSECUTIVE READINGS INSIDE BAND — and the first band note worth promoting in weeks

`681` reported five clean readings across two batches. **This plan added nine more, all inside, none
under, none over**, on `sonnet`/`low` throughout. Figures and verdicts are in `.plan-day.md`.

**One new band effect, PROMOTED INTO THE SKILL'S BAND TABLE rather than explained here:** *an app half
whose schema half already wrote its specification bands at the BOTTOM of its row* (`website-switches-app`,
202,507 against 200–260k). Nobody had priced it.

**The floor moved, which matters more than any single band.** Batch 1 read 97,696 · 98,433 · 102,683 and
batch 2, twelve hours later, read 106,075 · 106,411 · 111,509 — **about 8k up inside one day**, with the
widest within-batch spread yet (5.4k). **Re-derive it from `tokens − messages` every batch. Never carry a
floor forward**, including the ones in this paragraph.

---

## TWO THINGS PROMOTED INTO THE SKILL, BOTH ABOUT `uat-on-the-pi`, AND NOT REPEATED HERE

Both are in `.claude/skills/plan-day/SKILL.md` as of this PR. The delta is only that they happened:

1. **A leftover signature is a SNAPSHOT.** `Animal_Shelter_uat-on-the-pi` read `free`, `0 ahead`,
   `nothing beyond main` and had never had a PR — the exact signature the skill calls a leftover to
   `done` — and **two minutes later it was `ahead 1` and an hour later it was PR #1356.** It survived
   because *"clear them"* had named three other folders and the step was not widened. **Near-miss, not
   loss**, which is the only reason this rule cost nothing to learn.
2. **A green PR you did not merge is the finish-line fault one step later.** #1356 was opened with every
   check green on its own head and its session ended without merging it. The two earlier instances ended
   with a built branch and *no PR*; **this shape had no sentence anywhere**, so the finish-line block now
   carries it. **Check next edition whether batch 3's three merged themselves.**

---

## MITIGATIONS: FIVE FIRED, ONE HELD, ONE UNTESTED, NONE FAILED

Full list and evidence in `.plan-day.md`. Three worth knowing about:

1. **The hand-pinned migration number RETIRED ITSELF.** #1355 turned three batches of planner prose into
   `check-migration-numbers.mjs`, which refuses a clash on `main` or against any open PR; #1359 ran it.
   **Batch 3's brief names `0330` and says the check is the authority, not the brief.** The check also
   found a **second** duplicate pair, `0191`, that neither the item nor the planner knew about — both
   now recorded with reasons. **A count on an item is the count somebody took.**
2. **"A card-count red is your sibling's in-flight card"** → **UNTESTED: the situation never arose.**
   Recorded as untested rather than held, which is the correct price for insurance.
3. **The handoff rule fired** — #1359 named `reel_view` for batch 3, and it is in stream 8's brief with
   the three refusals #1359 already proved, so that stream does not re-report them as new.

**And the one to copy:** #1358 listed three of its own deliverables as **not verified** and ticked its
item in the same PR. A ticked item is read by nobody, so those three would have become silent
assumptions. **Filed as `#w9n4r`.** #1357 likewise declined the backlog sweep *and said so*; the planner
did it. **An honest not-done line is the most useful thing a stream writes, and it only works if the
planner reads the PR body after taking the usage figure.**

---

## FRESH FACTS, RE-READ FROM THE REPO — never diffed against a predecessor

- **Open backlog items: 66** on the `backlog` branch (65 on `main` until the next merge).
  `check-backlog-sections` and `check-backlog-ids` both clean.
- **Production is FIVE migrations behind: `0325`–`0329` pending, 326 applied** (`apply-migrations.mjs
  --status --env production`, 01:40Z). **`#8bz78`'s note saying `0318`–`0322` are pending is STALE** —
  those were applied and five newer ones took their place.
  **This does NOT block a release note.** `docs/release-procedure.md` **§5** applies pending production
  migrations as a Claude step, so a note shipping with that release is true when it ships — **and
  #1330's `n/a: needs 0322 applied to production` was over-cautious.** `n/a` is still right for a step
  the procedure does not cover: a hand edit on the Pi, a Worker deploy, a press in the app.
- **Next migration number: `0330`.** Highest on `main` is `0329_reels_card_split.sql`.
- **`src/lib/releases.ts` names `0.43.5`.** Production was verified at `0.43.4` earlier in this plan
  (`/api/version` and `/api/releases/current` read against each other). **Whether `0.43.5` has shipped is
  NOT established by this edition** — the release manager owns it, and it is two reads to settle.
- **This plan's PRs: #1353, #1354, #1355 (batch 1), #1357, #1358, #1359 (batch 2), plus #1356**, the
  unplanned `uat-on-the-pi` stream the planner merged. **#1356 counts as a stream that shipped a PR**, so
  the plan ran ten streams, not nine.
- **`main` is green as a whole.** `node scripts/gates.mjs` on `main` at 01:30Z, **after four PRs merged
  inside one hour, none of which had seen the others in CI** — `typecheck=0 lint=0 test=0 build=0`,
  build 339 s. **Four green PRs do not prove their combination green and nothing else in the loop checks
  it.** Worth repeating whenever a batch merges in a cluster.
- **Preflight is clean**: all four credentials present, dev REST and the Management API both answering.

---

## WHAT IS SET UP AND WHAT IS OWED

**Batch 3, set up and handed over 2026-11-07.** Composition, ports, bands and the carve-out are in
`.plan-day.md`. Its three are `general-bill-receipts` (`#t5k9r`, **two PRs**, migration `0330`),
`reels-readonly-drive` (`#8bz78`) and `page-level-required` (`#q0wc0`).

**Owed to the next planner:**

1. **Batch 3's three actuals and PR bodies.** Not in this edition, by construction.
2. **Stream 9's answer to the #1351-vs-#1352 disagreement** — whether the events pages and
   `/photos/approve` take `requirePermission`'s default edit level, or are yes/no and cannot take a level
   at all. **Both quotes are in its brief as a numbered deliverable with no planner verdict.** Read what
   it concluded; one of two careful streams was wrong and it matters which.
3. **Stream 8's answer to a question nobody has ever asked here: can the browser pane decode and play a
   video at all?** Its brief makes that deliverable 2 and tells it to write the video half as `pending:`
   rather than fake a pass if it cannot. **If the answer is no, that is a tooling fact worth promoting.**
4. **`#w9n4r`** (new) — three surfaces of the website switches that shipped unseen. Small: one signed-in
   pass plus one no-edit login.
5. **`#s4t7q`** — the `set_at` stamp moves when a statistic is toggled. Filed; **the fix is NOT
   ESTABLISHED because nobody has read the trigger body.**
6. **`#c7zjk` gained one more position rule 3 cannot see** — `driveErrorMessage(…, "…")`. So its clean
   *0 `user`-class strings* means 0 **of the positions rule 3 looks at**, not 0 in the tree. **A clean run
   of an instrument is not an argument for letting it block.**
7. **`#52y56` must still stay unscheduled.** Unchanged from `681`, and do not re-argue it.
8. **Still his:** `#mzu7v` needs `STATUS_READ_TOKEN` on production; `#u7d3b`'s data half waits on his
   keys; a real local model is his install.

---

## THE PLANNER'S OWN COST: ONE INTERRUPTION, AND IT WAS NOT A FAULT

`681` cost two, both its own fault. **This plan cost one, and it was him asking for the stream details
mid-setup** — a reasonable question, not a defect, and the hand-back list answered it in one message.

**`681`'s own mitigation fired for the third round running:** take the merged list, the `stream-usage:`
comments and the PR bodies **in the first batched call of the turn**. Both resumes this plan knew the
batch's state before writing a word, and neither had to ask which streams were done. **Carry it; it is
still the cheapest thing in the loop.**

**What to watch instead:** the planner's own window, not its tokens. **His currency is turns, not
tokens** — he is on the Max plan — so a round that reads forty things one at a time is expensive in a way
no figure in `.plan-day.md` can show. **Batch independent reads, and prefer one command that prints
several answers.**
