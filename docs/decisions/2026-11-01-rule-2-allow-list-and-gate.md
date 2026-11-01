# 2026-11-01 — The fifteen typed-in strings: two translated, thirteen named, and rule 2 becomes a gate

**Context.** `scripts/check-thai-dictionary.mjs` rule 2 counted **15 pieces of English typed into 3
`.tsx` files** instead of going through the Thai dictionary, and reported without a verdict because a
rule that is red for weeks is one people filter. The backlog item under `## Architecture` was the
fixing, and its instruction was to clear the list and then set `RULE_2_BLOCKS = true`.

**The item's premise was that fifteen strings wanted translating. Reading the three files first
changed the answer for thirteen of them**, which is the whole substance of this change. The gate is
the easy line at the end.

## Each of the fifteen, and why

| File | String(s) | Verdict | Why |
| --- | --- | --- | --- |
| `src/lib/archive/resident-summary-pdf.tsx` | *DECEASED RESIDENT SUMMARY*, *Date of death*, *Cause of death*, *Resident ID*, *Thai name*, *Other names*, *Intake date*, *Past story*, *Housing history*, *Clinic visits*, *Cancelled visits*, *Blood tests* (12) | **Deliberate** | The file's own header, since it was written: *"Deliberately English-only in its labels, with the resident's own data (which is often Thai) reproduced verbatim: the archive is a fixed artefact, and it would be odd for the permanent record of a resident to read differently depending on which language the person recording the death happened to have the app set to."* It imports no dictionary and takes no locale, and its date formatter says *"Fixed format, no locale"* for the same reason. |
| `src/components/DateInput.tsx` | `aria-label="Open calendar"` | **Translated** | A screen reader speaks it, to a Thai-reading member of staff, on every date field in the app. Now `t.common.openCalendar`. |
| `src/components/DateInput.tsx` | `placeholder="HH:MM"` | **Deliberate** | Notation, not words: the shape to type. `docs/decisions/2026-10-13-date-input.md` fixes the input format on every device and in Thai too, and the `DD/MM/YYYY` placeholder beside it is the same decision's other half. |
| `src/lib/manual/manual-pdf.tsx` | *Cards at a glance* | **Translated** | A real mismatch, see below. Now `t.manualPage.cardsAtAGlance`. |

**Nothing was a false positive.** All fifteen are text a person meets; the regex's judgement was
sound on every one. What it got wrong was the *coverage*, twice, and both corrections are below.

## The twelve: the item said nothing was on record, and the file says it plainly

The item asked whoever took it to *"decide while you are there whether the deceased-resident archive
PDF should follow the reader's language or is deliberately an English record — nothing on record
says, and if it is deliberate it belongs in `ALLOWED`-style prose in a decision file rather than
being left to look like a bug."* **Something on record did say: the file's own header, quoted in the
table above, gives the decision and the reason.** The item was written from the check's output rather
than from the file, which is how a documented intent came to be counted as a backlog of twelve
faults. So the finding here is a reconciliation, not a fix, and the twelve stay exactly as they are.

## Why the twelve are allowed as a FILE and not as twelve lines

`resident-summary-pdf.tsx` holds **about thirty English labels** (18 `label=` fields and 12 `title=`
sections); rule 2's matcher requires two or more word tokens, so it catches **twelve** of them —
*Date of death* yes, *Notes*, *Species*, *Breed*, *Sex*, *Age*, *Diet*, *Weight* no. Listing the
twelve it happens to catch would say the other eighteen are faults, and would need editing every
time somebody adds a two-word label to a file that is English on purpose.

So the entry allows the whole file, **and rests on the file's own statement rather than on this
script's opinion of it**: `declares` holds the phrase the header must still contain. Delete that
sentence and the file goes red here with all twelve strings, instead of staying quietly exempt. That
is narrower than a blanket file exemption, and it keeps the reason where the next reader of the PDF
code will find it.

## "Cards at a glance" — the item said to leave it, and the reason it gave does not hold

The item said: *"Leave this one to the Thai-edition-of-the-manual item under `## Documentation`;
`CLAUDE.md` names `src/lib/manual/en.ts` as the file nearly every UI stream touches, and this string
belongs with that work, not here."*

**It needs no `en.ts` edit and no new Thai.** `t.manualPage.cardsAtAGlance` has existed in both
dictionaries all along — Thai `บัตรงานโดยสรุป` — and `src/app/manual/page.tsx` renders the same
heading from it, twice. The PDF route already calls `getT()` and **already builds the card names and
their one-line descriptions underneath that very heading from `t`**. So a Thai reader printing the
manual got `บัตรงานโดยสรุป` on the page, "Cards at a glance" on the PDF, and Thai card names
directly under the English heading. That is the same fault the 2026-10-31 sweep fixed for the photo
folders (`การแพทย์` in the gallery, *Medical* on the Edit page), and it was one prop away.

The Thai *edition* of the manual is untouched and still that item's: the manual's content comes from
the `Manual` passed in (`docs/decisions/2026-09-29-manual-pdf.md`), and this is the PDF's own chrome
around it.

## A sibling the matcher never flagged, fixed with it

`DateInput.tsx` has a second `aria-label`, `"Time, 24-hour"`, on the time box beside the date. The
matcher skips it because `24-hour` starts with a digit. Translating *Open calendar* and leaving the
label right next to it in English would have been the kind of half-fix that gets re-found as a bug,
so it went through the dictionary in the same change as `t.common.timeField`. **Declared as beyond
the fifteen**; both keys live in `common`, next to `clearDate`/`clearDateLabel`, which
`OptionalDateInput.tsx` already reads the same way.

## `RULE_2_BLOCKS` is true, and what "cleared" had to mean

"Empty" cannot mean *no English left in any `.tsx`*: thirteen of the fifteen are correct as they are,
and no amount of work removes them. It means **nothing left that is not either translated or named
with its reason** — which is exactly the state rule 1 blocks in today, with 58 entries in its
`ALLOWED`. Rule 2's allow-list is the same shape and for the reason `CLAUDE.md` gives: a baseline
count rots, a named record does not. The flag is on; the count of 13 is printed as *allowed by name*
and never stored as a number to compare against.

Three guards were proved by making the tree red on purpose and watching it go green again:

- a listed file or a listed string that is gone → `stale`, exit 1;
- the PDF's header losing its declaration → its twelve strings become faults **and** the entry goes
  stale, exit 1;
- a brand-new `.tsx` with one line of English → exit 1. **That is the point of the whole item.**

## What rule 2 still cannot see, measured rather than guessed

Rule 2 reads `.tsx` files only, through JSX text and seven attributes. English in a `.ts` file, in a
template literal, in a server action's message, in a toast or in `setCustomValidity()` is invisible
to it. Measured today across `src/` (883 files), counting string and template literals that are
prose-shaped — three or more English words, one of them four letters or more — and ignoring comments:

- **900 in 107 `.ts` files.** 438 are `src/lib/manual/en.ts` (the English manual edition) and 204 are
  `src/lib/releases.ts` (the release notes); both are English by design today and each has its own
  item. **That leaves ~258 elsewhere.**
- **161 more in 93 `.tsx` files** that rule 2's own JSX-tuned matcher does not reach.

Three found in passing that are worth naming, because they are the same fault the fifteen were and
sit in the file this stream was editing:

- `DateInput.tsx`'s `outOfRange()` returns `"Date must be … or later."` while
  **`t.validation.notBefore`/`notAfter` already exist, translated**, and `src/lib/i18n/validity.ts`
  exists precisely to put the app's own words in the browser's validity bubble.
- `DateInput.tsx` calls `setCustomValidity("Enter a 24-hour time as HH:MM, for example 14:30.")`, and
  `src/lib/date-input.ts`'s `badDateMessage()` returns `"Enter a date as DD/MM/YYYY, for example
  13/10/2026."` Both bypass that mechanism; both are `.ts`-shaped string literals rule 2 cannot see.
- `src/lib/archive/resident-index-html.ts` repeats *Date of death* / *Cause of death* in English —
  consistent with the archive being an English record, and worth recording next to the entry above
  so the pair are read together.

**Not fixed here on purpose:** the item asked for this to be *said*, not swept, and wiring the
validity messages changes wording on every form in the app. Filed on the `backlog` branch under
`## Architecture`.

## Not touched

- `src/lib/manual/en.ts` — another stream's this batch.
- `assistant.volunteerReadOnly` and `assistant.pageSubtitleReadOnly`, the two user-facing strings
  that name a role: seen, left alone, their own item under `## Security`.
- Rule 1 and what it considers a fault; no `continue-on-error` anywhere.
