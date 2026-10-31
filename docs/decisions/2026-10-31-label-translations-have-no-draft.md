# A translated label has no draft state, so the Thai sweep wrote none of them

**2026-10-31, `claude/thai-sweep-typed` (half (A) of the Thai translation sweep).**

The brief and the backlog item both say the same thing, in Lutan's words: fixes go in
"as **drafts** on Translations for a bilingual manager to approve, **never as approved**".
Half (A) found 221 rows missing and 2 out of date on dev, proposed Thai for 72 of them, and
**entered none of it into the system.** This says why that is the faithful reading of the
instruction rather than a shortfall against it.

## What the sweep actually found

Measured on dev on 2026-10-31, and the screen and the database agree row for row:

| | missing | out of date |
|---|---|---|
| short labels (`label_translations()`, `0166`) | 84 | 0 |
| prose (`translations` queue, `0056`) | 137 | 2 |
| **total, as the screen reports it** | **221** | **2** |

Of the 84 labels, 12 are practice rows that exist only on dev (`Dryrun …`, `ZZ Width …`).
**72 are real wording a Thai reader sees in English today**, and each now has a proposed Thai
beside it in the gap list on Lutan's Desktop.

## The two halves behave completely differently, and only one of them can hold a draft

**Prose can.** `TranslationStatus` is `pending | draft | approved | stale`
(`src/lib/translations/types.ts`). The machine translations worker writes `draft`; the screen
labels it *"Draft — not yet approved"*; `localizedFromRow()` shows the public the English until
somebody presses **Save & approve**. That is exactly the shape the item asks for — and it is
**already filled in**: all 139 open prose rows carry machine Thai as a draft. There was nothing
for this stream to add, and no action in `actions.ts` that could add one: `approveTranslation()`
approves and `clearTranslation()` empties, and there is no third.

**A label cannot.** `LabelStatus` is `missing | as_typed | stale | current` — no draft among
them — and `set_label_th()` (`0166`) writes the Thai straight onto the row. The moment it is
pressed, every screen that reads that diet, zone, vaccine or unit shows the new Thai. Nothing
records who proposed it or whether anyone checked it.

So for a label the only two options open to this stream were:

1. write the Thai, which publishes unreviewed, non-native Thai to the live app; or
2. put it in a document and leave the screen as it is.

**Option 1 is worse than the thing the rule forbids.** "Never as approved" exists so that a Thai
reader sees nothing a Thai speaker has not checked; publishing straight past the approval step
breaks that rule harder than approving would. So: option 2, for all 72.

## What was done instead

- **Every proposal is in one document on Lutan's Desktop**, laid out English | Thai now |
  proposed Thai, grouped by the screen each label is typed on, with practice rows greyed out and
  a tick column. Lutan's wife reads it; it is written for her, not for a developer.
- **The prose half points at the screen rather than reprinting it.** 139 bios, stories and page
  bodies would be unreadable on paper and are already side by side on Translations with the
  button that approves them.
- **The gap is filed as work**, under Management on the `backlog` branch: whether a label should
  gain the draft-then-approve step prose has. That is a question for Lutan, not a thing to decide
  in a sweep.

## The production half had no instrument, so one was built

The item asks for the same count on production, read-only. There was none:
`scripts/` had `check-translate-worker.mjs` and nothing else, and a stream in a worktree cannot
read production anyway. Two named checks now live on the existing read-only harness
(`scripts/lib/readonly-checks.mjs`), so they inherit its guarantees — no path from argv to SQL,
one `SELECT` each, every query inside `begin read only`:

- **`translations-open`** — the counts the screen shows itself, missing and out of date, by group.
- **`translations-unlisted`** — Thai columns the screen never lists at all.

```
node scripts/check-production.mjs translations-open --env production
```

Two things about that first check are worth not re-deriving:

- **It cannot call `label_translations()`.** That function is `security definer` and returns
  nothing to a session holding no `translations` permission, which is every session this harness
  opens. So the registered label pairs are read directly, one `UNION` arm each.
- **Because the arms are written by hand, the check names any registered pair it has not been
  taught** (`uncovered`) and that is the one thing it flags. A label registered by a later
  migration shows up as a gap in the *check* rather than as a silently smaller count — which is
  the fault that produced the twelve unlisted columns in the first place.

Verified against dev: 221 missing, 2 out of date, group by group identical to the screen.

## The twelve columns nobody can translate

`translations-unlisted` found twelve `_th` columns on base tables with no row in
`translatable_labels`: the website's address and registration line and four photo descriptions,
`diets.name_th` (`0239`), `units.name_th` (`0252`), `features.name_th` (`0255`),
`role_groups.name_th` (`0241`), `memes.caption_th`, and `rounds.name_th`. The last is deliberate
and `0166` says so in its own comment — a fixed seeded vocabulary whose Thai ships with it. The
rest are an accident of the same hand step being missed eleven times since `0166`.

**Reported, not built**, because `src/app/management/translations/` belongs to another stream this
batch and bringing a column onto the screen is a change there plus a migration. It is filed with
the fix that stops it recurring: nothing tells anyone a new `_th` column must be registered, and
`translations-unlisted` is the check that would.

## One smaller thing found and left

Appeal rows file under a heading that is a database table name, `appeals`, because `proseGroup()`
in `src/lib/translations/labels.ts` has no case for them and `GROUP_ORDER` no entry. 28 rows on
dev sit under it. Found, not fixed — it is a line in the file the other stream is working beside,
and it is in the backlog item.
