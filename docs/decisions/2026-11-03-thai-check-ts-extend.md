# Thai check extended to .ts files: keys and callers first, check last (report-only)

Branch `claude/thai-check-ts-extend`. Backlog item *EXTEND `check-thai-dictionary.mjs` TO `.ts` FILES*.

## Order, and why

The item's price warning was right: API route bodies returned fixed English with no client translating it. So the
keys and callers went in first (commit `fa91255d`), the check second. After the first commit the check has nothing
left to report in routes, which is the point: it is not noise on day one.

## Numbers re-measured (step zero)

`node scripts/measure-english-in-ts.mjs` on this branch's base gave **263** prose strings outside manual/releases
(brief: 261) and **80** in the `user` class (brief: 78). The extra two are strings in the `user` class that the
brief's count did not include (`residents.recordIntake note tags`, a log label, is one of the 80 that is not
user-facing at all). Source of every count here: that script's own output, run on this branch.

## The keys: 34 wordings, not 67

57 route strings in the `upload-and-api-errors` class plus 10 in `route-and-action-messages` collapse into **34 keys**
under `t.uploads.errors` (English and Thai). I chose one key per distinct wording rather than parameters: the
twenty-odd repeats (`No file provided.`, `File is larger than 15MB.`, `… not found.`) are identical text, and the
`… not found.` family differs by a noun, which in Thai changes more than one word, so a template would have
read worse than ten short keys. The 15MB figure stays in the wording as before (it was already literal).
Callers use `(await getT()).t.uploads.errors.<key>` inline; `getT()` is the existing server-side locale reader,
already used by the same routes for other refusals. Four `notFound()` helpers became `async`.

## Do the API routes have a client that translates them? No.

Read: `AttachmentUploader.tsx` draws `body.error` verbatim under the file; the route has the locale (cookie) via
`getT()`, so translating at the route is the fix, not a client dictionary lookup.

## Thai is new and unread

All 34 Thai strings were written in this change and **have not been read by a Thai speaker**. Release note says so.

## The check (rule 3 in `scripts/check-thai-dictionary.mjs`)

TypeScript compiler API; positions: value of `error`/`message`/`notice`/`detail`, arguments of
`NextResponse.json` / `Response.json` / `new Response` / `new NextResponse`, `return` in `actions.ts`/`route.ts`,
`setCustomValidity(...)`. Skips `src/lib/manual/`, `src/lib/assistant/`, dictionaries, `releases.ts`,
`status/alerts.ts`. The literal must be prose-shaped (same test as the measure script) and `classify()` from
`scripts/lib/english-in-ts-classes.mjs` must say `user` — the class file is imported, not re-derived, and
unchanged. Allow-list `RULE_3_ALLOWED` is by name with stale detection, same shape as rule 2 (empty today).
**Report-only** (`RULE_3_BLOCKS = false`). Runs in about 5 s on 398 files.

## Measured false-positive rate

Method: ran rule 3 on the tree from before the keys commit (`git archive HEAD~1`) and read every line it flagged.
- Flagged: **64 distinct strings in 31 files** (66 occurrences; 76 prose strings in user positions, 10 of those not
  in the `user` class and correctly not reported).
- Of the 64, read each against its route: **0 are not user-facing = 0 false positives of 64** (0%). Small sample
  of one code area: this is the rate *on routes and route-like actions*, not the whole tree.
- Misses (the other direction): the `user` class holds 80 strings; 66 were flagged. **14 are in positions the filter
  does not look at** (calendar notes ×5, label/heading strings ×8 in `export.ts`, `frequency.ts`, `queries.ts`, plus
  one log label that is not user-facing). So recall on the user class is 66/80 by occurrence; positions are the cost.
After this change the check reports **0**.

## Before it can block

(1) The 14 position-missed strings need a decision on whether to widen positions (calendar note text is stored
at write time, in whichever language the writer had — a design question); (2) a day of PRs with no false positive;
(3) a Thai speaker reads the 34 strings. Then flip `RULE_3_BLOCKS`.

## Out of scope, said out loud

The 17 admin-only strings (`admin` class: status screen, alert email, release mail) stay English; the gate is on
`user` so this does not wait on that question. `.tsx` (161), the 11 "maybe", `manual/en.ts` and `releases.ts` untouched.

## Left

14 position-missed `user` strings above; the 11 "maybe"; admin-only question; Thai review. For the planner to file.
