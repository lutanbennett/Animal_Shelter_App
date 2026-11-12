# The Thai read: how new Thai wording gets read by a person

**Last read: 2026-11-01** (Lutan's wife read all 91 production labels). This line is the whole
record of the date. Whoever merges a round of corrections changes it in the same pull request.
Chosen because it lives in the one file everybody opens first and travels with the change that
makes it true, so it cannot drift the way a calendar entry or a note in a chat can.

**The cadence below is a recommendation. Lutan has not confirmed it.**

## Why this exists

`node scripts/check-thai-dictionary.mjs` proves a Thai entry exists for every English one. It never
proves a person read it. Every stream writes its own Thai and says honestly that it is unreviewed.
Without a regular read, that wording ships unread and stays that way.

## When

**Once a week, and also before any release that adds new wording a shelter worker will meet daily.**
At the measured rate (below) a read at every release would be every day or two and the reader would
never finish; a weekly read hands over about 700 strings, which is already a lot.

## Who

- **Runs the command and hands over the file:** anyone with access to the repository. Today that is
  Lutan or Claude. (Transient context: it is nothing to do with any app role.)
- **Reads:** a Thai speaker. **The reader is not a role in the app and needs no card**, because
  reading a markdown file is not an app action. Do not build a screen for it.

## The command

Replace the date with **"Last read" above**:

```bash
node scripts/list-thai-added.mjs 2026-11-01 --out "Thai to read since 2026-11-01 (today's date).md"
```

Put the file on the Desktop, not in the repository (it is public and the file is generated).
`--count` prints just totals, no text. It needs no database and no dev server and changes nothing.

## What the reader does, in this order

1. **"English changed, Thai did not" (read first).** The two no longer say the same thing and
   nothing else reports it. The old English sits beside the new. Correct the Thai.
2. **"Thai reworded".** Someone edited the Thai, so nobody has read the new version. Read it.
3. **"New".** A key that did not exist at the last read. Read it. If the list is too long, read
   wording a worker meets while typing or in a message first (tags, refusals, upload messages),
   and settings labels last.

The reader marks any string that is wrong or awkward (a line in the file, a photo, or a message is fine).

## How a correction gets back in

Someone with repository access edits `src/lib/i18n/dictionaries/th.ts` in an ordinary pull request
and updates the **Last read** date above in that same PR. Nobody edits Thai they cannot read: the
reader supplies the wording.

## Should new strings queue somewhere instead of being filed by hand?

**Yes, and the script already is the queue.** Eight batches were filed into backlog item `#y1dqu`
by hand, each after the fact. That filing is the part to stop. From now on a stream writes
`pending: Thai unreviewed` on its test plan and does **not** file into `#y1dqu`; the weekly sweep finds it.

## What the script cannot see

It reads `src/lib/i18n/dictionaries/{en,th}.ts` and nothing else. Thai written anywhere else is
invisible to it: for example the bilingual offline page of the Worker, or any Thai typed straight
into a component. The manual is English only, so there is no Thai manual to read. A stream that
writes Thai outside the dictionaries must say so in its PR so a person can add it to the handover by hand.
