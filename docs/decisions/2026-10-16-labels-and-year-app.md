# "Since <year>" on the baseline figures, and Thai for breed and colour

**2026-10-16, `claude/labels-and-year-app`.** The app half of two features whose schema shipped in #648 (0204, 0205).

## The year is the Director's

`impact_baselines.since_year` ships **empty**, and nothing in the code supplies one: not `baseline_date` (the day the
number was entered, not the year counting began) and not a guess. The label is conditional: no year gives exactly the label
as before, with no "since" and no placeholder. The word order is a dictionary template, `home.stats.sinceYear`:
"{label} since {year}" in English, "{label} ตั้งแต่ปี {year}" in Thai. The year prints as typed (a Gregorian year), in both
languages; whether Thai readers would rather see a Buddhist-era year is a question for the Director, not a default to pick.
The field accepts four digits from 1990 to 2100, the same range as the column's check, and blank clears it.

## One fallback rule for breed and colour: Thai if set, else English, never blank

`residentText()` in `src/lib/residents/labels.ts` is the only place the rule lives. Every screen that shows a breed or
colour calls it: the resident page (breed line and the "For adopters" colour), `/adopt` cards and the similar-residents
strip, the `/adopt/[id]` profile, the `/r/[code]` card landing and the home page's featured resident. A resident with a
Thai breed and no Thai colour therefore reads Thai on one row and English on the next; that mixed row is the expected state
while the fields are filled by hand one at a time, and it is better than a gap. An English-language reader never sees the Thai.
`/e/[id]` (the enclosure page's resident cards) still shows the English: its loader does not select the Thai column.

## Intake does not capture the Thai fields

The edit form has them; the intake form does not. Intake is a rush job done by whoever is standing there, often with no Thai
to hand, and the five-step form is long already. The people who write Thai (Management, the Director) find the resident
afterwards, and the edit page is where they go. Intake is not worse for it: blank means the English is shown. The shared
`AdoptionProfileFields` takes a `withThai` prop, set only by the edit form.

## Not done: registering in `translatable_labels`

The brief asked for it, and also said not to carry a migration. Registering needs one: `translatable_labels.label_group` has a
check constraint without `residents`, and a registered table needs the `label_sources` trigger. So the Translations page does
not yet list breed and colour. Filed as a follow-up on the backlog branch; the edit page is the way to fill them meanwhile.
