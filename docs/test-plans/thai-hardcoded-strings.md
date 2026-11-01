# Feature test plan — the fifteen typed-in English strings

## Header

| | |
|---|---|
| Feature | Decide each of the fifteen pieces of English typed into three `.tsx` files: two translated, thirteen named as deliberate in a new `RULE_2_ALLOWED`, and `RULE_2_BLOCKS` turned on so the next one fails the build |
| Backlog item | `docs/backlog.md` → *English typed straight into a page or component instead of through the Thai dictionary*, under `## Architecture` |
| Branch / worktree | `claude/thai-hardcoded-strings` @ `C:\Development\Animal_Shelter_thai-hardcoded-strings` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3002` |
| PR | #TBD (this plan is committed before the PR exists) |
| Tested by / date | Claude (stream 11, batch 7) / 2026-11-01 |
| Carries a migration? | no |
| Tested at SHA | the tip of `claude/thai-hardcoded-strings` at the gates run below |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — *all fifteen flagged strings are decided with a reason, two go through the dictionary, thirteen are named as deliberate, and rule 2 becomes a gate.* The item asked for exactly that, and said to set `RULE_2_BLOCKS` in the same PR
- [x] Files/areas touched listed — `scripts/check-thai-dictionary.mjs` (allow-list, gate, header), `src/lib/i18n/dictionaries/en.ts` and `th.ts` (two new `common.*` keys), `src/components/DateInput.tsx` (two aria-labels), `src/lib/manual/manual-pdf.tsx` and `src/app/manual/pdf/route.ts` (one heading prop), `src/lib/releases.ts` (one note), `docs/backlog.md`, `docs/decisions/2026-11-01-rule-2-allow-list-and-gate.md`, this plan. **No migration, no `worker/`, no `src/app/admin/**`, no `src/lib/manual/en.ts`**
- [x] Access affected identified — **none.** Nothing here grants or denies anything: no card, activity, policy, page rule or control gate is read or written. The only control involved is the calendar button beside a date field, and its *name* changed, not whether it is drawn. *(Written by card, not by role, per `CLAUDE.md`.)*
- [x] Anything explicitly **out of scope** written down — the ~258 prose strings in `.ts` files and 161 in `.tsx` files that rule 2 cannot see (measured, filed on the `backlog` branch, deliberately not swept: the brief asked for them to be *said*, not fixed); `src/lib/manual/en.ts` (another stream's this batch); `assistant.volunteerReadOnly` and `assistant.pageSubtitleReadOnly` (their own item, seen and left); the Thai edition of the manual's *content*

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (brought in PR #1146's `CLAUDE.md` change and two files; no conflicts)
- [x] `node scripts/gates.mjs` ends:

```
gates: typecheck=0 lint=0 test=0 build=0
```

  The first run was **red** (`gates: typecheck=2 lint=0 test=0 build=1`) and the defect is recorded below: an untagged release note had been written as `{ text: … }`, which the `ReleaseNote` type only allows with `cards`. The build failure was the same error, not a second one.

- [ ] CI green on the PR — `n/a: not yet — the PR does not exist at this commit`

## 3. Schema and data

- [ ] Every line in this section — `n/a: no migration in this PR`

## 4. Functional checks

- [x] Happy path works end to end — on `http://localhost:3002`, signed in by `scripts/dev-signin.mjs admin`, with the app switched to **ไทย** and **every page reached by clicking, never by typing an address** (`requestAnimationFrame` was confirmed firing first). On `/clinic-visits/new`, reached Residents → a resident → *Book a clinic visit*: the calendar button's `aria-label` reads **เปิดปฏิทิน** and the time box's reads **เวลา (24 ชั่วโมง)**. On `/maintenance/new`, reached Operations → Maintenance → *บันทึกงานซ่อม*: **เปิดปฏิทิน** again. `/manual` shows **บัตรงานโดยสรุป**, which is the string the PDF now uses
- [x] Data persists — `n/a` would be wrong: nothing is written by this change, but the thing that must survive a reload is the **language**, and both pages above were reached after the Thai switch and still read Thai
- [x] Create / edit / delete all exercised — `n/a: this PR creates, edits and deletes nothing.` No form was submitted on purpose: the dev database is shared with two other live streams
- [x] Empty state renders sensibly — the check script's own empty state is the point of the change, and it is exercised below: with no faults it prints *every piece of English in a .tsx is either translated or allowed by name* and exits 0
- [x] Invalid input is rejected with a readable message — the check script's three refusals were each provoked and read (section 6)
- [x] Boundary cases checked — the matcher's boundary is what the whole change turned on: it flags `"Open calendar"` but not `"Time, 24-hour"` (leading digit) and not `"DD/MM/YYYY"` (one token), which is why both siblings were handled rather than only the flagged one

### Access matrix

**Written by card, not by role** (`CLAUDE.md`: all analysis is by card, because roles are a transient
grouping of cards and every assignment will be rebuilt).

| Card | Can reach | Expected | Result |
|---|---|---|---|
| *(none)* | nothing changes | No card grants, gates or hides anything touched here. A date field is drawn by whatever card already opens the form it sits on; `/manual/pdf` already refuses a signed-out request and still does; the heading's *wording* is the only thing that moved | as expected — the `/manual/pdf` route's sign-in check is untouched, and the one line added to it passes a string |

- [x] Every card above tested — vacuously, and checked against the diff: no `can(`, `has_permission`, card key, activity or policy appears in it
- [x] A card that should not have access is blocked server-side — unchanged and not weakened: `/manual/pdf` still reads `supabase.auth.getUser()` and returns 401 before rendering. The PDF was fetched **with** a session (200, `application/pdf`, 397,592 bytes, `%PDF-` header) to prove the new prop did not break the route

## 5. Cross-cutting

- [x] Nav entry correct — `n/a: no nav change`
- [ ] Manual updated (`src/lib/manual/en.ts`) — `n/a: that file is another stream's this batch and the brief forbids touching it; nothing here changes a task a reader is told how to do`
- [x] Translatable strings go through the translation path — **this is the change.** Two new keys in `common` in both dictionaries; `node scripts/check-thai-dictionary.mjs` exits 0 with rule 1 clean and rule 2 showing 13 allowed by name, 0 to translate. *Not checked at `/management/translations`:* that screen is for wording typed into the system (the `label_translations()` and `translations` tables), and dictionary keys are code, which is the split the 2026-10-31 decision file sets out
- [x] Mobile viewport (375px) — `n/a: no layout change.` Two `aria-label` values and one PDF heading; no element, class or size moved
- [x] Browser console clean — `read_console_messages` with `onlyErrors` returned no entries after the click-through above
- [x] Network clean — the only request this change affects is `GET /manual/pdf`, checked: 200

## 6. Regression

- [x] The pages nearest the change still work — `/my`, `/manual`, `/operations`, `/maintenance`, `/maintenance/new`, `/residents`, a resident's page, `/clinics` and `/clinic-visits/new`, all in Thai, all by clicking through
- [x] Any shared file touched checked from a second, unrelated page — `DateInput.tsx` is used by 45 files, so it was loaded on **two unrelated forms** (`/maintenance/new` and `/clinic-visits/new`), not read. It now calls `useI18n()`, which **throws outside an `I18nProvider`**; the provider is mounted once in `src/app/layout.tsx`, the root layout, and every one of the 45 callers is under `src/app/`. Both forms rendered, so the hook resolves at runtime and not only in the types
- [x] The three ways the new allow-list can go wrong were each provoked and watched go red, then green again:
  - a listed file or string that is gone → `FAIL RULE_2_ALLOWED["src/components/Nope.tsx"] "a bogus line" is stale`, exit 1
  - the archive PDF's header losing *"Deliberately English-only in its labels"* → its twelve strings became faults **and** the entry went stale, exit 1; the file was restored byte-for-byte and the check went green
  - a brand-new `.tsx` with one line of English → `FAIL src/components/TmpProbe.tsx — 1 piece of English typed in`, exit 1. **This is the whole point of the item**
- [x] Nothing merged from `main` during `sync` was broken by this branch — the merge brought `CLAUDE.md` and two new docs; the gates were run after it

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** — ticked, and **its title rewritten**, because the old one said *"15 strings in 3 files"* and that is now a count of what one regex catches rather than a backlog of fifteen faults. The superseded premise is marked in place, not deleted. Two follow-ups went on the `backlog` branch instead: the residue rule 2 cannot see, and a correction to the Thai-sweep item, which still says half (B)'s PR *"is open and held"* when #1132 merged on 2026-10-31
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `docs/decisions/2026-11-01-rule-2-allow-list-and-gate.md`: the verdict on each of the fifteen, why the twelve are allowed as a *file* rather than as twelve lines, why the file's own header is what the allowance rests on, why *Cards at a glance* did not need deferring, and what "the list is empty" has to mean for the flag to be flippable at all
- [x] `README.md` still accurate — it says nothing about the dictionary check or either PDF
- [x] **Release notes.** `unreleased` in `src/lib/releases.ts` gained one line, written for a shelter user: the printed manual's heading and the two names a screen reader reads out on a date field are now Thai, and the `DD/MM/YYYY` and `HH:MM` boxes deliberately are not. **Untagged (a plain string) on purpose** — every signed-in person meets a date field, and the manual is for everyone. No step is outstanding before a user sees it: no deploy, no hand edit, no setting. *What is outstanding is not a step but a reading* — the two new Thai values are machine-composed and his wife reads the Thai; they are listed in the PR for her, and the note does not claim anything about their wording
- [x] Commit messages say why, not just what
- [x] **Claims were measured, not reasoned** — the figure for what rule 2 cannot see (900 / 107 / 438 / 204 / 161) comes from a script run today, not an estimate; the claim that `t.manualPage.cardsAtAGlance` already existed was read out of both dictionaries and `src/app/manual/page.tsx`; the claim that the archive PDF declares itself English-only is a quotation from its header; the claim that #1132 merged is from `gh pr list`; and the three guard behaviours were provoked rather than argued

## 8. Pre-production gate

- [ ] Every line in this section — `deferred: the production release manager — no migration, no secret, no env var and no Worker change, so the deploy-time steps are the ordinary ones for any release carrying this PR`

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | The release note was first written as `{ text: … }` with no `cards`, which `ReleaseNote` only permits as a plain string. `typecheck` and `build` both went red | fixed — written as a plain string, gates re-run to `typecheck=0 lint=0 test=0 build=0` |
| 2 | low (not this PR's) | `src/components/DateInput.tsx` writes two validity messages in English (`"Date must be … or later."`, `"Enter a 24-hour time as HH:MM, for example 14:30."`) while `t.validation.notBefore`/`notAfter` already exist translated and `src/lib/i18n/validity.ts` exists to carry them; `src/lib/date-input.ts`'s `badDateMessage()` does the same. Rule 2 cannot see any of them | deferred to backlog — filed under `## Architecture` on the `backlog` branch. Found in the file this stream was editing, **not fixed on purpose**: the brief asked for the invisible residue to be measured and reported, and rewiring these changes a validity message on every form in the app |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | **The two new Thai values.** `common.openCalendar` = `เปิดปฏิทิน` and `common.timeField` = `เวลา (24 ชั่วโมง)`. Both are composed from words already used in `th.ts` (`เปิด`, `ปฏิทิน`, `เวลา`, `ชั่วโมง`), but Lutan's wife reads the Thai before it goes live, and neither has been read by her. They are a screen reader's words, not anything on screen | `src/lib/i18n/dictionaries/th.ts` → `common`, and listed in the PR |
| 2 | **The printed manual in Thai.** Open `/manual/pdf` with the app set to ไทย and look at the heading over the card list: it should read **บัตรงานโดยสรุป**, matching `/manual`. The route was proved to return a valid PDF, but reading glyphs out of a PDF is a person's job | `/manual/pdf?view=all` |
| 3 | **A screen reader on a date field,** if anyone has one to hand. The DOM values were read in Thai on two forms; nobody has heard them spoken | any form with a date box |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (stream 11, batch 7)  Date: 2026-11-01

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — `n/a: the list is not empty; items 1–3 are for a person to tick, not for whoever filled this plan`

Manual verification by: pending: the bilingual read of the two new Thai values, and a look at the heading on the printed manual in Thai

### Result

- [x] Open defects are either fixed or explicitly accepted above — defect 1 fixed, defect 2 accepted and filed
- [x] Checklist pasted into the PR
- [ ] Handed to the production release manager — `n/a: nothing in this PR needs anything of them beyond carrying it in the next release`

Result: pass

Release manager acknowledgement: n/a: no deploy step of its own
