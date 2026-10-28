# Planner handover — edition `429`, 2026-10-28

**A delta, twentieth edition in this shape, and an OFF-CADENCE one.** `420` was written and merged
about an hour before this, and the counter stood at **0**: batch 3's three streams were set up
before `420` and are counted in its nine. **Lutan asked for this edition directly.** It exists
because one thing `420` could not contain has now happened — **batch 3 ran, so `420`'s own
prediction can be tested** — so it is deliberately short and covers batch 3 only. **Read `420`
first; this does not replace it.**

**Nothing here outranks `CLAUDE.md`, the skill, `docs/backlog.md` or `.plan-day.md`.**
**Read first:** `CLAUDE.md` → the skill → `.plan-day.md` → `420` → this. **The next slug is `438`.**

> **Never carried forward: anything read from the repo** — counts, migration numbers, PR numbers,
> release state, candidates. **Re-read every time, never diffed.**

---

## THE ONE THING THIS EDITION EXISTS FOR: `420`'s MITIGATION FIRED, AND THE STREAMS EXTENDED IT

`420` closed by asking: *"Did the browser-pane block fire? This is the first use of the round's
biggest finding."* **It did, on both card streams, and neither filed a false row.**

`card-drive-daily-ops`, in its own words: *"`requestAnimationFrame` fired on every page driven, and
each page hydrated after a click-through, so none of the rows above is the pane."* Its one direct
load — `/my`, the first screen after sign-in — **showed only the layout, exactly as the brief
predicted, and was recorded as nothing.** It also noticed the sensible exception on its own: *"Only
the refusal checks typed an address, since a refusal is decided on the server."*

**`card-drive-money` then found three things the original diagnosis did not cover.** All three are
appended to the pane's backlog item and belong in the same `CLAUDE.md` entry:

1. **A HIDDEN pane stops painting, and `rAF` stops firing there too** — so the symptom is **not**
   confined to direct loads: a page reached correctly by click can still freeze if the pane is off
   screen. **A `screenshot` wakes it.**
2. **Pixel clicks can miss: the screenshot frame is 800×600 while the page is 1024×768.** A click
   read off a screenshot lands somewhere else — it missed the resident chooser's **Done**.
   `element.click()` through `javascript_tool` worked. **A click that lands on nothing looks exactly
   like a dead control**, which is how this becomes a false fault-log row.
3. **`dev-signin.mjs --cards <card>` called twice re-keys the same login**, so only the later snippet
   is valid.

**The transferable part: a mitigation is a hypothesis, and this is what it looks like when one is
confirmed properly.** Not "no complaints", but two streams saying in writing what they checked, and
one of them finding the edges the original measurement missed. **Keep asking the next round.**

## THE WALKTHROUGH RE-PASS RATE NOW HAS ITS FOURTH AND FIFTH READINGS, AND IT HOLDS

Both card streams, floor taken from their own non-`Messages` categories (**~98.0k each**):

| stream | steps | actual | above floor | per step |
|---|---|---|---|---|
| `card-drive-daily-ops` | 23 | 237,110 | 139,120 | **6,049** |
| `card-drive-money` | 20 | 233,021 | 135,031 | **6,752** |

**`411` said a re-pass is ~6k a step and asked for a fourth reading before promoting it. There are
now two more, both inside, and both banded correctly** (215–265k and 195–245k). Seven readings
across three rounds: 5,529 · 5,858 · 5,911 · 6,438 · 8,010 · 6,049 · 6,752.

**This is now safe to promote into the skill — but promoting it is the NEXT planner's job, not a
thing to do in an off-cadence edition written at the end of a long day.** The rate moved three times
in one day on 2026-10-27 because someone was confident each time. **Do it deliberately, in a chat
that has read the figures rather than inherited them.**

## WHAT ELSE BATCH 3 SHOWED

- **Nine of nine inside or under band, for the second round running.** `medical-photos-app` 140,226
  (banded 150–190k, 7% under), and the two above inside. **Twelve streams today, none over.**
- **The release-note-by-command gap, which `420` recorded, was closed by a brief.** #1020 was told
  to say explicitly what note was owed and who should carry it, and it did: *"Release note owed once
  Lutan applies `0276`: 'Medical photos are now visible only to logins holding View medical or
  Manage medical.'"* **That is the fix working first time.** `0275`'s note is still owed and still
  unwritten.
- **`card-drive-daily-ops` found a control the walkthrough could not have found:** `/upcoming-visits`
  offers **Edit** to a read-only login and sends it to `/no-access`. Its own observation is the
  useful part — *"it sits on a page the menu adds and no step opens"* — so **the walkthrough and the
  buttons sweep have a gap between them that neither covers.** Worth a thought when slice 5 is
  scoped.
- **`card-drive-money` separated a cause it read from a cause it proved**, unprompted: the donations
  resident picker reads `resident_list_view` while `/residents` reads `resident_who_and_where`, and
  it wrote *"read from the code and the view's definition, **not proven**: no query was run as that
  login."* **That is the NOT ESTABLISHED discipline arriving in a stream's own output** without the
  brief asking for it.

## STILL CARRIED, unchanged

- **A release's cut and record PRs, and the two handover PRs, merge on green CI without asking.**
- **Model, effort and which allowance to spend are his. Never block paid usage.**
- **`0276` IS STILL NOT ON PRODUCTION.** The classifier refused the planner twice, including after
  Lutan asked for it in chat, so it is one command of his. **He chose *apply now, assign after*,
  knowing it makes Medical photos Admin-only until a role holds View medical.** Re-read
  `--status --env production` and `role-cards` before saying anything about it.
- **A measurement has a timestamp; a fact does not.**
- **`check-who-does-what` and `check-menu-coverage` are red ON PURPOSE.**

## NEXT ROUND POINTS AT

1. **Promote the ~6k re-pass rate into the skill**, deliberately, with the seven readings above.
2. **`0276`'s production apply, and the release note that follows it** — both `0275`'s and `0276`'s
   are now owed and neither is written.
3. **Ten card re-passes still owing:** `assistant`, `add_photos`, `approve_photos`, `meme_library`,
   `contacts` (14 steps), `who_does_what`. Count them from the repo, not from here.
4. **Buttons slices 5 and 6**, and the gap `card-drive-daily-ops` found between the walkthrough and
   the sweep — a page the menu adds that no walkthrough step opens.
5. **The `CLAUDE.md` entry for the browser pane**, now four facts rather than one.
6. **Policy triage 2** — band it as a report; batch 1's ten were all deliberate.
7. **Sixteen-plus worktrees.** Lutan has been offered a clean four times and said leave them.
   **Stop asking.**
