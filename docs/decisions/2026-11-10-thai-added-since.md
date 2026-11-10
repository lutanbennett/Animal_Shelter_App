# A worklist for the Thai read: `scripts/list-thai-added.mjs`

Backlog `#y1dqu`. `check-thai-dictionary.mjs` proves a Thai key exists, never that a person read it.
This script gives the reader a list of what to read: everything that has arrived since a date or commit.

## What counts as "added" — three kinds, all reported, never merged into one

Compared per key, as the dictionaries stood at the start point and as they stand now:

1. **disagree — the English changed, the Thai did not.** Listed first. The two no longer say the same
   thing and nothing else reports it (the typecheck sees both keys present). Most urgent, and the output
   shows the old English beside the new so the reader sees what moved.
2. **new — the key did not exist.** The obvious case.
3. **reworded — the Thai changed**, with or without a change to the English. Someone edited the Thai, so
   it is unread. (If both changed, it is here: the Thai was touched, and it is shown against the new English.)

Left out on purpose: a key whose English has no letters (a dash, `4:5`, bare placeholders), because there
is nothing to read; and a key with no Thai, because `th.ts` is typed against `en.ts` and the typecheck
already fails it.

Not tried: telling a *corrected* Thai from a *rewritten* one. Any Thai change is listed; a reader passes
a trivial fix in seconds, and guessing which edits "don't count" is how unread Thai got here.

## Start point

`YYYY-MM-DD` means the dictionaries as they stood at the start of that day (last commit touching
`src/lib/i18n/dictionaries/` before it). Anything else is a commit. An old state is read by checking the
two files out to a temp folder and importing them, so no worktree is disturbed. Parsing is the
`check-thai-dictionary.mjs` way: at runtime, templated entries sampled with stand-in arguments, shown to
the reader as `{a}`, `{b}`, `{c}`.

## Output

Markdown by default, a Thai speaker can be sent it as is: English beside Thai, grouped by kind and then by
area (the dictionary's top-level section), the key last and unobtrusive. `--out file` writes it,
`--json` gives the machine form, `--count` gives totals per kind and area.

## Not done

The cadence and the handing-over stay with a person; `#y1dqu` stays open, retitled to say so. The script
changes no dictionary and does not touch `check-thai-dictionary.mjs`.
