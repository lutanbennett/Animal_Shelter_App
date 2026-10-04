# 2026-10-04 — Rounds: the part of the day a dose or a meal belongs to (`0137`, `0138`)

Lutan, 2026-10-04: medication goes out in **three rounds, Morning, Lunch and Evening**; food in
**two, Morning and Evening**; "twice a day" means a morning and an evening dose. Four screens read
what this lands: the stock-room pick list, pictures-first, Feed Special Diets, and the medication
list (#325). Nothing here is visible to a shelter user yet; the screens are the next batch.

## The ask-the-human rule (read this before "simplifying" a screen)

**The round is an explicit choice. The clock may pre-select it; it never decides.** Lutan:
*"if they are working on preparing the lunch medication at 9am in the morning the system won't get
it confused with the morning run."* The pick list exists for bagging doses up *before* going out, so
the work is done **ahead** of the round. Someone preparing lunch at 09:00 is not doing the morning
round, and a screen that assumes otherwise is wrong for exactly the workflow this was asked for.
Catching up at 23:00, or bagging the evening round after lunch, the person picks what they are doing.

To anyone reading such a screen later it will look like friction, a tap the system "could have worked
out". It is the opposite: removing the ask reintroduces the bug. `suggestRound()` in
`src/lib/rounds/suggest.ts` is for the default only.

## The clock is Asia/Bangkok, and it is tested at the edges

What the clock suggests is read on the **shelter's** clock, never the runtime's. Workers run in UTC, so
06:00 in Thailand is 23:00 the day before there: the same trap as F-03 (#336). `suggestRound()` and
`shelterHour()` use `SHELTER_TIME_ZONE` and nothing else. The edges: morning before 11:00, lunch 11:00
to 15:59, evening from 16:00; 00:00 to 06:59 Thai time is still "morning", not yesterday's evening.
Food has no lunch, so the lunch window suggests evening (the morning feed is done). The boundaries
are constants in code, **not** columns, so there is no second copy to disagree.
`scripts/check-shelter-dates.mjs` now asserts both sides of each edge (10:59:59, 11:00:00, 15:59:59,
16:00:00 Thai) plus 00:00, 06:59 and 23:59, under `TZ=UTC`, Asia/Bangkok, America/Los_Angeles and
Pacific/Kiritimati. Any "today" the pick list derives uses `todayIso()`, as everywhere else.

## The model

| Table | Holds | Truth for |
|---|---|---|
| `rounds` | `morning`, `lunch`, `evening`; `for_medication`, `for_food`; Thai names | the vocabulary |
| `prescription_rounds` | the rounds a **prescription** is given in | **the pick list and the medication list read this** |
| `frequency_rounds` | the rounds a frequency suggests | the *default* ticks, and the back-fill |
| `resident_diet_rounds` | the rounds a diet's meals are given in | the food side |

Views `prescription_round_status`, `frequency_round_status` and `resident_diet_round_status` say `ok`,
`none` or `mismatch` per row.

**Why the rounds sit on the prescription.** My first cut (`0137`) put them on the frequency. Lutan's
whiteboard for adding a prescription is *Amoxicillin, 2 tablets, Morning ☑ Lunch ☐ Evening ☑, start
date, end date*: the person ticks the rounds, and there is no frequency field. So the ticks belong to
the prescription; `0138` adds `prescription_rounds`, and `frequency_rounds` is demoted to what it is
still good for, the starting ticks when a frequency is chosen and for every prescription that existed.
`0137` was already applied to dev, so this is an additive second file, not an edit.

**A lookup table, not an enum.** An enum value cannot be added and used in one transaction (PR #50), so
it would be two files and a dry-run that fails on the second until the first is committed. A fourth
round later is one `insert`. A `rounds_used` check and a `check_round_applies()` trigger keep lunch off
a diet.

**Food and medication are separate mappings over one vocabulary.** The vocabulary is one table with two
flags (the concept is the same and the labels are shared); the mappings are two tables because their
subjects differ (a diet is one resident's, a frequency is shared). Forcing them into one would put a
`kind` column and a polymorphic foreign key where two plain ones do.

## How a frequency maps to rounds, and why not derived

"Once daily" is genuinely ambiguous (morning or evening?) and Management edits the frequency list, so
the mapping is **per row, stored**, not computed from `doses_per_day` at read time. The *starting*
value is a rule, written once and then an ordinary editable row:

| Schedule | Default rounds |
|---|---|
| 1 a day | morning |
| 2 a day | morning, evening |
| 3 or more a day | morning, lunch, evening |
| interval (weekly, every other day, monthly) | morning (its one dose goes in a round too) |
| as needed | none, on purpose |
| diet, 1 meal | morning |
| diet, 2 or more meals | morning, evening |

Triggers apply the default on insert and when the schedule changes (`doses_per_day` or `interval_count`
for a frequency; `frequency_id` for a prescription; `meals_per_day` for a diet), so a row cannot be left
saying "twice a day" after it became once. A rename or an unrelated edit does **not** re-default: the
harness proves a hand-ticked set survives one. **A form that lets a person tick rounds must write them
after the row, in the same action; its choice then stands.** The triggers are `security definer` so an
inline add by staff or a vet is never left roundless for want of a write policy.

## Existing rows

Every existing frequency, prescription and diet was back-filled by the same defaults, only where it had
no mapping, so a re-run never undoes a tick. On dev: every scheduled prescription has at least one round,
and nothing reads `none` or `mismatch`. `as needed` has none by design and reads `ok`.

## Nothing is silently invisible

An empty round set is a dose that appears in no round and is never shown. It is therefore **visible, not
impossible**: the status views flag it. **The screens must show `none` and `mismatch` rows under "No round
set" and never drop them.** `mismatch` is also what ticking two rounds on a "Once daily" prescription reads
until the form sets the frequency to match, what a frequency of four or more doses a day reads (only three
rounds exist), and what a diet of three meals reads (only two food rounds).

## What the next stream starts from

- **The medication list (#325) is not rebuilt here.** To show a round it reads `prescription_rounds`
  (`prescription_id, round_id`) and `rounds` (`key`, `name`, `name_th`, `sort_order`) beside the
  `frequency` it already reads in `src/lib/medication-list/load.ts`, groups by the chosen round, and keeps
  `doseDueState()` for interval days. Group a prescription under each round it holds.
- **Add-prescription form:** the whiteboard's three ticks, pre-ticked from `frequency_rounds` when a
  frequency is chosen. Derive `frequency_id` from the ticked count (1, 2, 3 per day) or keep a frequency
  picker for weekly and as-needed; either way write `prescription_rounds` after the row.
- **Pick list:** ask the round, pre-select `suggestRound('medication')`, list that round's doses.
- **Food:** `resident_diet_rounds`, with `suggestRound('food')`. A per-meal portion is `daily_quantity`
  divided by the rounds the diet has.
- **RLS:** `prescription_rounds` is visible exactly when its prescription is, so the Head of Medical (cell
  `medical.prescriptions`) reads it with no new grant; writes are admin, management, staff and vet.
  `frequency_rounds` follows `frequency`; Management edits it. `rounds` is readable by every login.
- Still no record of a dose given; that is a different item.

## Proof

`node scripts/check-medication-rounds.mjs` (dev, `begin … rollback`, both files re-applied on top of
themselves first): 70 checks, covering the back-fill, every default, a changed schedule, the hand-edit
surviving, `none` and `mismatch` showing, the lunch-on-a-diet guard, the re-run, and who reads and writes
each table under their own JWT.
