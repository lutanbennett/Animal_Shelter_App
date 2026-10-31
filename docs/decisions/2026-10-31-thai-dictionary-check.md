# 2026-10-31 — The Thai dictionary: eleven lines, and the first check over it

**Context.** `src/lib/i18n/dictionaries/th.ts` (8,051 lines) is typed against
`en.ts` (8,337), so a **missing** key already fails the typecheck and is not a
possible fault. What nothing caught was a key whose Thai is the English string
copied across, stale, or naming a screen in English. Half (B) of the Thai sweep
item (`## Management`) asked for the real count, a judgement of each one, a
check script, and a list a bilingual reader can scan. No check script existed
for any of this — `scripts/` had nothing matching `i18n`, `thai` or `dict`.

The planner's crude scan had found 27 identical values and warned that the
figure was a **floor**: it matched only simple one-line double-quoted entries,
2,632 of 8,051 lines.

## What the measurement actually was, and why the method matters

**Compare at runtime, not with a regex.** Importing both dictionaries and
walking them in parallel reaches every leaf: 5,285 strings, 950 templated
functions and 15 arrays. A templated entry is sampled by calling it with marker
arguments that are identical for both languages, so any difference in the result
is the wording rather than the arguments.

- **The real count is 96, not 27** — and **33 of the 96 are templated entries a
  regex cannot see at all.** The floor was off by a factor of three and missed
  the entire category.
- **The sample's reframing was right.** 33 of the 96 hold **no translatable
  words** once placeholders, digits and punctuation come out (the em dash, the
  ellipsis, `4:5`, and every entry that is only placeholders and spacing), and
  58 more are brands, codes, filenames or example URLs. **Three were genuinely
  untranslated.**
- **A second axis the item did not name found two more:** a Thai value holding a
  run of three or more Latin words. 18 matched, and 14 of those are the
  foundation's own name used untranslated inside Thai prose, which is the file's
  settled habit. The other four were the finding.

`node scripts/check-thai-dictionary.mjs` now does the first axis on every CI
run; the second was a one-off and is recorded here rather than built, because
"Latin words inside Thai prose" is right far more often than it is wrong.

## The eleven lines, and the three groups they fall into

**Identical and genuinely untranslated (3).** `photos.medicalTile` was the
literal word *Medical*; `donations.detail.emailSubject` and `emailBody` were an
English subject line and an English letter. **That last pair is the one that
mattered:** a staff member using the app in Thai pressed *Email the receipt* and
the app composed an English letter for them to send to a donor, with the rest of
that screen in Thai.

**Naming an in-app folder or page in English (5).** The photo folders are shown
to a reader through `enums.photoFolder`, which **is** translated — *Medical* is
`การแพทย์`. So a reader saw `การแพทย์` on a photo in the gallery and `Medical`
on the same photo on the Edit page, and *Who does what* described the approvals
screen as *Photos to approve* while every other line in the file calls it
`รูปที่รออนุมัติ`. Five lines now agree with the names the app already uses.

**Stale — the English moved and the Thai did not (3).** Established by the
method the item named, and it was practical: index both files into key paths
(6,108 paired, so 97.7% of the ~6,250 runtime leaves), blame each file once, and
take each entry's **last** commit date. **6,067 of 6,108 changed in the same
commit as their English**, which says the habit here is to write both together.
Of the 33 where the Thai was older, judging each left three that had actually
drifted: the diets forecast note still described the pre-recipe model
(English moved 2026-10-21), the Pi origin tile had lost the emergency-switch
clause, and the *Manage medical* card description never gained
*record a death* (English, 2026-10-30) — so a Thai reader could not see that the
card records a death.

## What was deliberately NOT changed

- **Google Drive folder names stay English** — `Unsorted`,
  `Residents/Deceased/`, `Adoption updates`, "โฟลเดอร์ Drive". A reader goes
  looking for that folder in Drive, where the name really is English.
  Translating them sends people hunting for a folder that does not exist. Nine
  lines, left alone on purpose.
- **The authenticator's issuer is not a fault, though it reads like one.**
  `admin.security.twoStep.codeSubtitle` tells the reader to look for
  **Lanna Animal Care**, which contradicts the foundation's name everywhere
  else. `src/lib/auth/two-step.ts:123` registers exactly that string, so the
  copy is correct and changing it would send people looking for the wrong entry.
- **`src/lib/i18n/enum-labels.ts` (123 lines, all read) holds no label text at
  all.** It is plumbing: every label comes from `t.enums.*`. So the deliverable's
  real subject was the `enums` block in the dictionaries, and **all 60 labels
  across 16 enum groups are translated** — nothing to fix. Worth recording
  because the item names the file, and a future reader will otherwise re-read it
  expecting to find labels. (`roleKeyLabel` there looks up a role key in the
  dictionary and falls through to the key set out as words. That is the shape
  `CLAUDE.md` explicitly permits — a label lookup falling through to the role's
  own name — not a named-role fallback.)
- **The vet → clinic terminology drift.** The English was reworded from *vet* to
  *clinic visit*; the Thai still says `นัดหมอ`, and the same Thai serves two
  different English phrases. It reads well, so nothing changed and it goes to the
  bilingual reader as a wording choice rather than a fix.

## The check: two rules at different stages, on purpose

**Rule 1 fails the build.** No Thai entry is its English. The deliberate cases
are handled without a count, which is what `CLAUDE.md` requires:

- **Structurally, with no list to keep:** an entry whose English has no letters
  left once placeholders, digits and punctuation come out is not translatable.
  33 entries, and the set needs no maintenance.
- **By name:** `ALLOWED`, one line per entry with its reason, 58 entries. A
  brand must not be a permanent red, and the reason is there so the next reader
  does not have to work out why LINE is in Latin. **An `ALLOWED` entry whose Thai
  is no longer its English fails as stale**, so the list cannot drift away from
  the dictionary — proved by adding a bogus entry and watching it go red.

**Rule 2 reports and returns no verdict**, and this is the decision most worth
reading. `CLAUDE.md`'s test for a check worth building is that **a passing tree
has none**. This tree does not pass: there is real literal English copy in
components, which is why the sweep was told to measure it rather than fix it. A
blocking rule would be red for weeks, and a red people are emailed about hourly
is one they filter — the exact fault `test-plan` had to be rescued from. So the
rule prints its count and its grouped list and **stores no number**, so it
cannot rot and cannot quietly accept a new one. `RULE_2_BLOCKS = true` flips it
in one line once the backlog item has cleared the list, and that instruction is
on the item.

**Rule 2's first figure was wrong and the correction is the point.** It reported
**56**, and reading the list showed over half were TypeScript generics —
`: Promise<Metadata>`, `Record<`, `new Map` — whose `<` closes a JSX text match
just as a tag's does. The matcher now rejects candidates carrying code
punctuation or ending on a generic type name, and the honest figure is **15
strings in 3 files**. A measured count that has not been read is not a
measurement, and **56 should be ignored wherever it is quoted.**

It imports the dictionaries at runtime, which means CI's node must strip
TypeScript types. It already must: `npm test` imports `src/**` TypeScript under
the same node 22, so this adds no new dependency.

## Why this PR does not merge itself

Lutan, 2026-10-30: the dictionary PR is not merged until the Thai lines in it
have been checked, because his wife is bilingual and reads all the Thai before it
goes live, and *"they will just get approved via my login"* — so there is no
login for her and none was created. The eleven lines are on his Desktop as
`Thai dictionary gaps - 2026-10-31.html`, English | current Thai | proposed Thai,
grouped by where in the app they appear, in the shape #1128 used that morning for
half (A). The release-note line is therefore answered `n/a`, not ticked: the
wording ships only once she has read it.

**One question is in that document and it is a different one from #1128's**
(Buddhist-era years, which is pointed at rather than asked twice): the receipt
email is composed in the **sender's** language, so a Thai-speaking staff member
now sends a Thai letter to a donor who may be from abroad. Whether that is
wanted, or the letter should always be English, is hers to answer.
