# Date boxes read day first on every device (2026-10-13)

**Cause, so nobody re-diagnoses it.** The app's own date text was never at fault.
`formatDate` / `formatDateTime` in `src/lib/format.ts` assemble "20 Sep 2026" from a
fixed month table with no browser locale involved, so they cannot come out month-first
(`archive/*`, `PagesAccordion`, `adopt/page` are pinned to en-GB/th-TH). The month-first
dates were the **browser's own** `<input type="date">` / `datetime-local`, which draw in
the browser's language, not the page's — a Chrome on English (US) shows mm/dd/yyyy, and
`lang="en-GB"` does not change that in Chrome. Count on 2026-10-13: 39 boxes in 33 files
(the item said 28).

**Decision (Lutan, 2026-10-13: option B).** Not a device setting, because a new phone or
reinstalled Chrome would silently bring it back. `src/components/DateInput.tsx` provides
`DateInput` and `DateTimeInput`: a text box showing DD/MM/YYYY (and 24-hour HH:MM), a
calendar button using the native picker, and a hidden field carrying ISO
`YYYY-MM-DD` / `YYYY-MM-DDTHH:MM` — so no server action, schema or `format.ts` caller
changed. Parsing lives in `src/lib/date-input.ts` (tested: 13/10 is 13 October,
10/13 and 31/04 are refused, never rolled over). `scripts/check-no-native-date-input.mjs`
runs in `npm run lint` and fails on any new native date box.

**Thai.** Inputs stay Gregorian, exactly as the native box was (display dates remain
Buddhist Era). Changing that is a separate decision.

**Left alone on purpose.** The US donation receipt's month-first date (see backlog);
displayed dates ("20 Sep 2026"); `type="time"` in the assistant card (not a date).
