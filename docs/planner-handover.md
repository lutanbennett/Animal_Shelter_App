# Planner handover — edition `258`, reshaped as a delta 2026-10-21

**Read this first: the previous edition of this file ran to about 400 lines, and that was the fault
it should have reported about itself.** By its own measurement the *writing* was the largest single
cost of producing it — larger than the worktree, the build, the test plan and CI combined. Lutan,
2026-10-20: *"can you just do a delta change to the handover? that's what the release handover does
now."* This is that edition, same round, reshaped.

**The rules now live in `.claude/skills/plan-day/SKILL.md` step 8, not here.** Ceiling ~100 lines,
150 the limit. Say what **changed**; promote anything durable into the skill or `CLAUDE.md` once;
cite `.plan-day.md` rather than reproducing it. **It applies to this file and the release handover
and to nothing else** — not to decisions, records, test plans or anything a feature stream writes.

> **The one thing the delta must never cover: anything read from the repo.** Item counts, blocked
> lists, migration numbers, PR numbers, release state, candidates — **re-read every time, never
> diffed.** Carrying those forward is what had Lutan re-prosecuting answered decisions. Short prose,
> fresh facts.

**What this file is.** A snapshot for whoever runs `/plan-day` next in a fresh chat. **Nothing here
outranks `CLAUDE.md`, the skill, `docs/backlog.md` or `.plan-day.md`.** If they disagree with it,
they are right and this is stale.

**Read first:** `CLAUDE.md` → the skill → `.plan-day.md` → this.
**The next slug is `267`** (258 + nine).

---

## Honouring the standing instruction: what the last edition's warnings actually did

- **The ~128k baseline, the two band-classification errors and the revised band table are now in
  the skill's *Token estimates* section.** Promoted 2026-10-21; **do not recopy them here.** The
  short version: an ordinary well-briefed stream costs about 128k whatever it is, and both of that
  round's band misses were me putting a stream in the wrong row, not a wrong row.
- **"Never block his paid usage" is now in the skill too**, under *Model and effort*. It had been
  "the biggest thing on this page" in every edition while living nowhere permanent — the exact
  fault the delta rule fixes. **It is a hard rule; read it there.**
- **The handover PR no longer waits on him.** `CLAUDE.md`, "Release PRs and the handovers merge
  without asking" — his instruction of 2026-10-21. **Merge it yourself once CI is green.** Do not
  present it as a gate; that was the record PR's old fault.
- **"Check for an open `planner-handover-*` PR before trusting this file" — STILL LIVE. Keep it.**
  `gh pr list --state open`. An open `handover-refresh` is the *release* handover, a different
  document.
- **"Capture the actuals the moment a batch merges" — HELD, and it worked.** Nine of nine measured,
  against eight of nine the round before, by reading them in the same turn each merge was confirmed,
  before the daily sync. **Running tally: nine of nine, eight of nine.**
- **The "you add NO migration" brief line — FIRED, correctly.** `two-way-calendar-app` concluded a
  migration genuinely was needed and **stopped and said so** instead of writing one. First test of
  the line added after the `0230` collision. **Keep it verbatim in every non-migration brief.**
- **The read-only-script-plus-command pattern — FIRED twice.** Both production facts that needed
  reading got read, by Lutan running a one-line command and committing the result (#780). **This is
  the shape for anything needing production.**
- **"The dial has never been varied" — STILL TRUE, now 27 consecutive measured streams** on
  `claude-sonnet-5-5` / `low`. A recommendation in a table changes nothing; he sets it in the
  session menu. **To get evidence, ask him in words.** The round's cluster at ~128k suggests brief
  quality moves the figure far more than either dial.
- **The `rm`-then-write trap — FIRED for a third edition running.** Write refuses to overwrite a
  file this session has not read. `rm` it first.

---

## Where things stand — re-read 2026-10-21, not carried

| | |
|---|---|
| `main` | `c40c39f6` (#787) |
| `backlog` | in sync |
| Dev database | 236 applied, 236 files, zero drift both ways |
| Next free migration | `0236` |
| Open backlog items | 86 |
| Open PRs | none |
| Release | `0.38.1`; `unreleased` carries four lines. **`0.39.0` is NOT cut — the release manager's** |
| Workstreams since handover | **0.** `.plan-day.md` carries the count |

**The round's nine:** #777–#779, #781–#783, #784–#786, all merged. Per-stream measurements, batch
composition and the dependency notes are in `.plan-day.md`. **Cited, not repeated.**

---

## Two rulings from the round worth not re-deriving

- **The delivery-edit conflict (#784).** `0191`'s whole-row update policy was added **on purpose**
  for the bills inbox, so it **stays**; `0235` adds a trigger narrowing an update to the cost column
  alone, everything else refused with "delete and re-record". The transferable rule the stream was
  given: **do not make a harness green by changing what it expects** unless you have established the
  expectation is wrong and written down why.
- **Readiness is not sequencing.** The printable acceptance sign-off was fully buildable and still
  wrong to schedule — Lutan: *"we haven't finished the build."* **Ask both: is it ready, and does it
  only make sense once something else is finished?** Sign-offs, certifications and printed artefacts
  fail the second while the thing they describe still moves. Recorded on the item's own title; **not
  blocked, no decision owed, do not re-propose it until he says the build is done.**

---

## Waiting on a person — these look stale and are the opposite

Do not tick, do not plan. Each has its own backlog item with the detail.

- **Lutan:** the CODE-3 secrets confirmation (**eleven days — ask once, in one line**); the two
  security switches (one click each); WAF and bot rules; BitLocker; the second admin account; the
  contact read on production; the two dry-run reviews; the spare-SSD steps; the Home Assistant
  walkthrough; the home-network session.
- **The Director:** the domain transfer, **which gates the whole cutover**, plus the wording, data,
  shop and charitable-registration items. **One sheet, not thirteen asks.**
- **Both:** the acceptance sign-off ground rules, which the five role passes wait on.
- **Time:** HSTS not before 2026-11-08; the `sharp` override until `wrangler` and `miniflare` ship
  a `sharp` past 0.35.5.

## Answered and closed — do not re-raise

Never block paid usage · a red `audit` is not a blocker · `test-plan` is permanently advisory ·
release and handover PRs merge without asking · raising model or effort does not fix a band ·
the production calendar token is his and TBA · removing the left-hand menu goes last · only the
Admin **role** manages tiles · the throwaway Supabase project · Drive folder sharing and the Drive
move are deferred by him · videos go to Drive · the printable sign-off is sequencing, not readiness ·
`0227`'s retention job is confirmed active on production.

---

## Next round's candidates

The next chat plans; this is only where the board points. **Three of the first four carry
migrations, and only one in-flight branch may carry one at a time — that is the constraint that
will shape the plan.**

1. **Cut `0.39.0`** — the release manager's, not the planner's.
2. **The two-way calendar schema follow-up** — cancel-reason column, the *via Google Calendar* audit
   label, the *changed this week* list. #779 stopped short on purpose; its item names what is left.
3. **Make the assistant-retention job report on itself** — the only pg_cron job in the schema, so it
   sets the pattern as much as it fixes the job.
4. **Drop `frequency_id`** — filed this round. **Read the `doses_per_day` trap on its face first.**
5. **The six menu-orphan reports** — **chats, not workstreams.** Still not run; the tile-groups and
   role-home-tiles items wait on their rulings.
6. **The five acceptance role passes**, one stream each — waiting on the ground rules above.

---

## Writing the next one

**The rules are in the skill, step 8.** Offer it; do not start on an ambiguous yes. Count honestly:
a stream that produced nothing counts, a stream he ran himself counts, a second PR from one stream
does not, and the menu-orphan chats are not workstreams.

Branch, worktree, test plan, PR — then **merge it yourself once CI is green.** This one is
`claude/handover-delta`; the editions before it were #787 (`258`), #774 (`249`), #758 (`240`), #742
(`231`), #730 (`221`), #717 (`212`), #704 (`201`), #690 (`193`), #676 (`182`), #662 (`173`), #638
(`156`), #625 (`147`), #612 (`138`), #597 (`127`), #588 (`116`), #575 (`105`), #562 (`96`), #546
(`93`), #514 (`87`), #501 (`84`) and #490 (`81`).

**This edition is ~125 lines against the previous 400, and it is at the ceiling rather than the aim.**
What the next one should promote to reach 100: the *Answered and closed* list belongs on each item's
own backlog title (the standing rule already says so), and the two rulings above belong in their
decision files, which already exist — cite them and delete the summaries.
