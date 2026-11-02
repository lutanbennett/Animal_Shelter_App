# Date and time messages through the dictionaries, and which English counts

2026-11-02 · stream `thai-check-ts-strings` · no migration

## 1. The three messages are wired

`outOfRange()`, the time literal and `badDateMessage()` in `DateInput.tsx` / `date-input.ts` now read
`t.validation`. Out-of-range reuses the existing `notBefore` / `notAfter` (the limit is passed as
DD/MM/YYYY, the format the box shows). Four new keys, in both dictionaries: `dateNotAMonth`,
`dateNoSuchDay`, `dateFormat`, `timeFormat`. The out-of-range wording changes slightly in English
("Choose 13/10/2026 or later." in place of "Date must be 13/10/2026 or later."), because the
existing translated keys are the ones every other date field already uses; one voice is better than
two.

## 2. How a pure helper gets the right wording: it returns a reason, not words

`badDateMessage(text): string` became `badDateReason(text): BadDate`, a small tagged value
(`notAMonth`, `noSuchDay`, `format`) that carries only the numbers. `DateInput.tsx` turns it into a
sentence from `t.validation`. Why this and not the alternatives:

- **Passing the dictionary in** would make a pure date helper import the type of a 7,000-line file.
- **Moving the helper** into the component would leave the day/month logic with no unit test.
- **Returning a reason** keeps the helper dependency-free and testable on the data (the test now
  asserts `{ kind: "noSuchDay", day: 31, last: 30 }` instead of matching English with a regex), and
  the Thai cannot drift from the English because both live next to each other in `t.validation`.

## 3. The rule: which strings are user-facing

**A string is user-facing if it can reach a person's screen**: returned in an action result, in an
API response body the app shows, in a validity bubble, a toast, a label, or an email sent *to a
shelter user*. **It is not user-facing if it goes only to a machine, a log or an operator**:
`console.*` and thrown errors that are only logged, SQL / `select(...)` column lists, HTTP headers,
regexes, identifiers, an LLM prompt, and an admin alert email. A string that is both (an `Error`
message that a page shows as-is) counts as user-facing. If you cannot tell, follow the string to
its last hop: where does it end up?

Sample, checked against the rule: a rough scan of `src/**/*.ts` (excluding manual, releases,
dictionaries, tests) with a looser matcher than the item's, which printed 1,034 hits, was sampled
at every eighth hit: **36 hits**. Of the 36, about **14 were not strings at all** (the
scanner paired a quote across code, e.g. `.update({...}).eq(`), **~10 were user-facing** (JSON
error bodies of `src/app/api/**/route.ts` such as "Resident not found.", "File is larger than
15MB.", "Sign in to view receipts.", plus "Failed to archive the resident."), and **~12 were
not** (log lines in `memes/actions.ts`, `appeals/*.ts`, `action-result.ts`, a cache-control
header, SQL column lists). So roughly **one real hit in four** is user-facing, and the API route
error bodies are the big cluster that is both English-only and invisible to rule 2. This is a
sample of 36, not a count of the 258.

## 4. What extending `check-thai-dictionary.mjs` to `.ts` would take (NOT done; for the planner to file)

- Parse with the TypeScript compiler API rather than regex (the regex above mispairs quotes).
- Flag a literal only in a **user-facing position**: the value of `error:` / `message:` /
  `notice:` / `detail:`, the argument of `NextResponse.json({ error })` / `new Response(...)`,
  a `return` inside a file under `actions.ts` / `route.ts`, and `setCustomValidity(...)`.
  Ignore `console.*`, `.select(` / `.eq(` / `.from(`, `headers`, anything under
  `src/lib/assistant/` prompts and `src/lib/status/alerts.ts`.
- Reuse rule 2's allow-list-by-name mechanism so every survivor is a named record.
- Expected false positives: with position filtering, likely low (the sample's 12 non-user-facing
  hits were all in positions the filter excludes), but **unmeasured**; without it, about
  three in four. Start with `src/app/api/**/route.ts`, the largest cluster, and report-only for a
  day as rule 2 did.
- The API route bodies need a client that translates them (they return fixed English today), so
  the real cost is the dictionary keys and the callers, not the check.
