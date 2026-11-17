# Planner handover — edition `758`, 2026-11-17

**This is a DELTA against `757`.** It says what changed, corrects its predecessor, corrects itself, and
reports what `757` left owed. Figures, batch composition and ports live in `.plan-day.md`.

**It outranks nothing.** One chat reads it, one plan replaces it, and a wrong line is corrected by its
successor rather than by a reviewer.

**WHICH PLAN'S FIGURES THIS EDITION REPORTS, AND 2026-11-17 WAS STRANGER THAN `757` KNEW.** `757` opened
by saying there had been **two** plans in one day. **There were three.** Lutan ran `/plan-day` again after
the second plan's batch 3 merged, and a third plan of nine streams was cut from scratch, agreed in one
answer and set up in three batches — all in the same conversation, all on 2026-11-17.

- **This edition reports the SECOND plan's last three streams** (#1656, #1657, #1658), read this morning
  at the third plan's batch 1 setup. **That completes the second plan's set of nine.**
- **It reports NO figures from its own plan.** The third plan's six merged streams (#1659–#1664) were
  deliberately **not** measured: measurement is once a day and today's slot was used. **They belong to
  `759`, together with batch 3's three.** That is the delta model working as intended, not a gap.

## FOR YOUR FIRST TURN

1. **Read `.plan-day.md` first.** It is gitignored, so it is not in this file's history. It holds all
   three of today's plans, their statuses, the ACTUALS tables and every finding filed.
2. **Read the system date and compare it with this document's.** **Never derive today's date from a
   document** — including this one.
3. **Check whether batch 3's three streams merged, with `gh pr list --state all --head claude/<slug>`
   and NOT the worktree table** — `tenancy-part10-shelter-roles`, `tenancy-lookup-lists`,
   `backlog-title-check`. `757`'s first correction is why, and it held all day: that rule answered nine
   stream states today and misreported none.
4. **Read the repository AFTER the pull, not before.**
5. **READ `#cgrnt` BEFORE YOU PLAN ANYTHING.** It is the most important line on the backlog right now,
   and the next section says why.

## READ THIS FIRST: A MIGRATION BROKE A CHECK THAT CI CANNOT RUN, AND NOTHING WOULD HAVE SAID SO

**`scripts/check-card-grants.mjs` exits 1 on dev.** `0397` made every `shelter_id` `NOT NULL` this
morning; that check's part 2 inserts a throwaway role inside a transaction it always rolls back, without
a shelter, so the insert is now refused. **The checks before it pass. It falls over at the role insert.**

**Why that matters out of all proportion to the fix:** it is the **only** instrument that proves *a
role's `role_permissions` are exactly the union of its cards' grants* against the **live database** — the
database half of Lutan's card rule. **`ci.yml`'s own comment at line 224 says it cannot run in CI**
because it needs the dev token, and CI runs `check-cards-count.mjs`, which reads `cards.ts` and
`catalogue.ts` and never looks at a database. **So that half of the rule is asserted by nothing at all
today, and the only reason anybody knows is that one stream of three reported a red it had not caused.**

**THE GENERAL LESSON, AND IT IS NEW: A MIGRATION CAN BREAK A CHECK THAT CI DOES NOT RUN, AND THE SILENCE
IS INDISTINGUISHABLE FROM HEALTH.** Everything green, nothing to see. **After any migration that adds a
constraint, run the checks CI cannot run** — the ones needing a live token — **and say in the PR that you
did.** The fix is folded into batch 3's Part 10 stream, which cannot prove its own work without it.

## THE CORRECTION AGAINST `757`: "DOES IT CLEAR ON RETRY" WAS THE WRONG QUESTION

**`757` spent a section on this and got the sign right while leaving the mechanism half-stated — and
half-stated is what sent two editions round in a circle.** Its conclusion was *"it DOES clear on retry"*,
correcting an earlier claim of mine that it did not.

**Six streams measured it today, in six fresh worktrees, and every one reported the identical pair:**
`gates.mjs` ends `build=1` on `SecurityFatalError`, and `npx next build` run immediately afterwards
exits 0.

**Both earlier claims were true about different commands.** The halt writes a receipt in `.next/cache`
that suppresses it for **five minutes**, and a full `gates.mjs` run takes five to six — **so the receipt
expires inside the run and a `gates.mjs` retry halts again, while a two-minute `npx next build` retry
passes.** *"Clears on retry"* is not a property of the halt at all; it is a property of **which command
you retry**.

**AND THE CORRECTION AGAINST MYSELF IS SHARPER THAN THE ONE AGAINST `757`.** A stream reported this
morning that *"build=1 on the advisory is not clearing on retry for every stream"*. **I explained it away
with the receipt mechanism and filed nothing** — a sound explanation, written into the saved plan, treated
as closing the matter. **Six readings later it became `#bhalt`, with a measured cost of one extra
two-minute build per stream.** **Explaining a report away is not the same as measuring it.** The
explanation tells you *why*; only a count tells you *whether it matters*.

## THE OTHER CORRECTION, AND IT IS MINE: I BROKE A RULE IN THE DOCUMENT THAT QUOTED IT

The `tenancy-part8-branding` brief listed `src/app/adopt/PublicNav.tsx` among the naming group's core
files, on the strength of its grep hit count. **PR #1664 read the file: that hit is a comment, and the
public nav's labels come from the dictionaries.** The brief's own evidence section says *a `grep -l` is
not a definition* — **I wrote that sentence and then sized a worklist from a hit count a few paragraphs
later.**

**No stream was misled**, because the same brief told it to read every hit before changing it, and it
did. **The instrument that caught this was the brief's own instruction rather than any check** — the
third time this month that step zero or a read-before-you-edit line has caught the planner rather than
the item.

## WHAT `757` LEFT OWED, AND WHAT IT DID

**`757` owed exactly one thing: the second plan's batch 3 figures.** They were read this morning, all
three present, and they are in `.plan-day.md`. **Nothing else was outstanding and nothing was lost.**

## FIGURES — the second plan's last three, completing that set

| slug | PR | estimated | actual | verdict |
|---|---|---|---|---|
| `worker-free-plan-limits` | #1658 | 150-195k | **153,661** | **inside**, near the bottom |
| `tenancy-not-null` | #1657 | 230-285k | **192,987** | **under by ~37k**, dials match, valid |
| `tenancy-de-lanna` | #1656 | 240-300k | **181,172** | `finished=blocked` — **not a band reading** |

**THE UNDER-READING IS THE THIRD OF ONE SHAPE AND THE TABLE WAS STILL NOT MOVED.** #1645 (18k under),
#1650 (32k under) and #1657 (37k under) were **all three schema-with-code jobs whose briefs handed over
the complete worklist with every judgement pre-made.** #1657 was given three `cron.schedule` migrations by
number, a count of definer functions and 247 triggers, each flagged as a count of files rather than of the
live set. **That is the *brief hands over cause, decision and shape* discount `SKILL.md` already names, so
the likeliest reading is a discount I keep failing to apply rather than three rows set too high.** **Apply
it next time a schema-with-code brief hands over a finished worklist, and see where the reading lands.**

**THE FLOOR: 86,693 / 87,417 / 87,482.** `SKILL.md`'s `~86–90k` row, re-measured yesterday, still
describes the data. **No edit owed, and the scale rows are still not to be shifted with it.**

**`finished=blocked` on #1656 is recorded as CORRECT, not as a defect.** That stream was briefed on two
groups, shipped one, reported the other as not done, and said so in its title and its comment. **The
brief's slice boundary held.**

## THE PROGRAMME'S STATE, SO IT IS NOT RE-DERIVED

**Five of the third plan's six merged streams were in the thirteen-part programme (`#ykefa`), and it is
nearly through.**

- **DONE:** Parts 1, 2, 3, 6, 7, 11, and **Part 4b (`#stmp5`) — every `shelter_id` is now `NOT NULL`
  (`0397`)**.
- **Part 5 (`#ujqr5`): the release-order guard shipped** (#1659) — `0392` can no longer be applied by a
  release manager who has not first shown the Worker is live. **The item stays open for the release
  itself: Worker first, then `0392`, in two different releases.** Its own limit is recorded on the item:
  the guard cannot observe the Worker, so it checks an assertion rather than taking a measurement.
- **Part 8 (`#b4cmn`): mostly done, in two slices** — the Drive folder id (`0398`) and the naming group
  (`0400`, `shelters.display_name`/`short_name`, `shelterNames()`), plus `check-no-lanna-literal.mjs` in
  CI. **Still open, and this is slice 3: the dictionaries' prose, the Worker's release mail sender, the
  calendar notice, the donation issuer, download file names, the backup prefix and the releases history.**
- **Part 10 (`#omt6u`) and `#lklst` are batch 3's.** **Part 9 (`#o2iyh`, per-shelter Drive) is the obvious
  next plan's batch 1**, unblocked now that Part 8 gives it a per-shelter folder id.
- **Part 12 (`#egq18`) genuinely needs a deploy** — no local CPU figure exists, because a local `workerd`
  records `cpu_time_ms` 0. **Part 13 (`#34a30`) is blocked on that number.**

**AND THE THING TO KNOW BEFORE PLANNING AT ALL, UNCHANGED FROM `757` AND NOW SHARPER: six of this plan's
nine items were findings the programme's own streams filed.** Outside the programme and those findings the
backlog has no Claude-buildable work — Quick wins, Mobile, Resident operations, Medical records and
Facility are all empty of open items. **The programme is generating work faster than it closes it, which
is fine and is not a substitute for asking him what comes after it.**

## SIX INSTRUMENTS SHIPPED TODAY, WHICH IS WHY THE DAY WAS WORTH THREE PLANS

The release-order guard (#1659) · the nightly shared-tables check (#1660) · the `system.status`
retirement (#1661, `0399`) · the usage-comment check inside the clearing step (#1662) · the cache-API
guard (#1663) · `check-no-lanna-literal.mjs` (#1664). **Every one was a finding a stream filed and the
planner turned into a stream; none was on the backlog two days ago; and each closed a case where
something reported success while doing nothing.**

## HIS DECISIONS TODAY, SO THEY ARE NOT RE-ASKED

- **A per-shelter export carries the shelter's DATA AND NOT ITS STAFF LOGINS.** Asked directly, chosen
  from three options: *"No — data only"*. That settles `#expgp`'s first gap as correct as built.
  **Retitle `#expgp` before anyone briefs it:** what is left there is small and technical, not his.
- **`system.status` is Admin only** — `757` recorded the answer; it shipped today as `0399`.

## WHAT IS WAITING ON HIM, AND IT IS ONE THING

**A repository secret for the production database, so the new nightly shared-tables check can watch
production as well as dev.** PR #1660 named it precisely rather than guessing:
`SUPABASE_ACCESS_TOKEN_PROD`, a Supabase access token **scoped to project `dbkodyyxxhtygxcxmfcu` only,
Database: Read only.** That stream probed production with the dev token, **was refused and did not force
it**, which is the right outcome. **Until it exists the check watches dev, and the workflow says so.** He
has been told and offered a walkthrough; **do not ask a second time.**

## FILED THIS PLAN — three items, none of them a stream's to file

`#pirow` the Pi's own writers have never been exercised against `NOT NULL`, and the service-role registry
reads `src/` only, so no instrument we own can see them · `#cgrnt` the broken card-grants check, above ·
`#bhalt` the build halt's measured cost · plus amendments to `#b4cmn`, `#shtci`, `#ujqr5` and `#trnsc`.

**AND ONE DELIBERATE NON-FILING, WHICH IS ALSO A DECISION.** Batch 2 produced nothing to file: all three
streams ticked or correctly left their items, each rewrote its own titles, and the one open question —
**transcript survival is not established** — was already written onto `#3qmzt` by the stream itself.
**`CLAUDE.md`'s rule about a sixth dated note applies to filing as much as to answering.** A batch that
yields nothing to file is not a batch you read carelessly.

## PROCESS NOTES THIS EDITION ADDS

- **THREE MITIGATIONS WERE CHECKED THIS ROUND AND ALL THREE FIRED, WHICH IS THE POINT OF CHECKING.** The
  build-halt brief block: **three of three** streams met the halt, recognised it, re-ran `npx next build`
  rather than `gates.mjs`, and reported both codes. The numbered `stream-usage:` deliverable: **nine of
  nine.** The usage-comment presence check: **three runs, nothing missing** — and #1662, the stream that
  built it, said so itself: *"The check has not caught anything yet; it is still a hypothesis."* **Record
  a mitigation that has caught nothing as untested, never as working.**
- **MECHANISM A HAS NOT RECURRED IN NINE CONSECUTIVE STREAMS.** Two unexplained occurrences remain
  (#1636, #1647) and both are undiagnosable, their sessions long gone. **Do not re-investigate without a
  new occurrence.**
- **CLEARING WAS DECIDED ON A CHECK RATHER THAN ON HABIT, WHICH IS WHY THE RULE IS WORTH HAVING.** Had
  any batch-1 PR been missing its comment, clearing that worktree would have destroyed the transcript the
  batch-3 stream needed for its own deliverable. **The check ran first; the clearing went ahead only
  because all three were present.**
- **A HELD FOLDER THAT NOBODY CLOSES STAYS HELD.** `worker-free-plan-limits` refused clearing twice,
  hours apart, **with the identical seven process ids** — three `node`, two `esbuild`, two `workerd` from
  its own preview run. **Nothing releases it but closing that session**, and it was never forced. Batch
  1's three cleared cleanly at the same pass, which is the contrast worth keeping: a finished-and-closed
  stream costs nothing to tidy, an open one costs a folder.
- **AND ONE `worktree.mjs done` EXCEEDED TWO MINUTES DELETING `node_modules`** and had to go to the
  background. **Lutan's 2026-11-11 ordering gets re-proved every plan:** had that run before the list, he
  would have waited for it.

## INTERRUPTIONS

**NONE. This is the first plan in this record with no interruption of any kind.** Three batches, three
lists, one question, no re-presenting, no correction from him and nothing he had to chase. `757`'s
interruption — being told twice that I had misreported open work — **did not recur, and the rule it
produced is why:** nine stream states were reported today and every one came from
`gh pr list --state all --head`, never from the worktree table.
