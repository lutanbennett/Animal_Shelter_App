# Feature test plan

## Header

| | |
|---|---|
| Feature | Assistant v2 stream 5: prescription, find-enclosure and resident-summary tools; weight and immunization skip the confirm |
| Backlog item | `docs/backlog.md` → Assistant → "Assistant v2 stream 5: remaining tools and low-risk writes skipping the confirm" |
| Branch / worktree | `claude/assistant-v2-tools` @ `C:\Development\Animal_Shelter_assistant-v2-tools` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3001` |
| PR | opened from `claude/assistant-v2-tools` at the SHA below; the number is on the PR itself (not written here, because it is not known at this commit and a guessed number is a false claim) |
| Tested by / date | Claude (Opus 5) / 2026-10-31 |
| Carries a migration? | no |
| Tested at SHA | 1c14bcac |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — adds the three remaining assistant tools (add-prescription, find-enclosure, resident summary), lets weight and immunization skip the confirm card when the sentence left nothing to choose, and exports `FieldSpec` / `fieldSpecs(kind)` so the details modal and the id validator stop inferring field types from names
- [x] Files/areas touched listed — `src/lib/assistant/` (`types.ts`, `llm-tools.ts`, `interpret.ts`, `data.ts`, `parse.ts`, `text.ts`, `intents/lookups.ts`, `immunization-strings.ts`), `src/components/assistant/` (`AssistantCards.tsx`, `AssistantConversation.tsx`, `AssistantAnswers.tsx`), `src/app/assistant/` (`actions.ts`, `interpret.ts`, `lookups.ts`), `src/app/prescriptions/actions.ts`, `src/lib/i18n/dictionaries/{en,th}.ts`, `src/lib/releases.ts`, tests. No `worker/`, no `supabase/migrations/`
- [x] Roles affected identified — **stated as transient context, not as analysis** (`CLAUDE.md`: all analysis is by card). The cards are what matter: `assistant.ask` gets the two new questions; `assistant.record` is needed for the confirm-skip; `medical.prescriptions` at edit is needed for the prescription tool, which is withheld without it; the summary's four medical sections each need the read activity the resident hub's own tab asks (`SECTION_READS`). Today **no card grants `assistant.record`**, so only Admin can reach the write side — a pre-existing fault, recorded in the decision file and on the backlog, not caused here
- [x] Anything explicitly **out of scope** written down — no keyword parser for a prescription (deliberate, decision file); the day pattern stays the card's picker rather than something the sentence sets; no new permission card; the `noCard` refusal path is unreachable today and is covered by a unit test rather than a browser step

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Paste its closing `gates:` lines below exactly as printed

```
=== gates: typecheck exited 0 after 11s
=== gates: lint exited 0 after 87s
=== gates: test exited 0 after 15s
=== gates: build exited 0 after 94s

gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration; the three tools use existing tables and existing activities
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly after the change — n/a: no schema change; the new reads are the same queries the resident hub and the enclosure list already run
- [ ] **Constraints and defaults exercised against real rows** — n/a: no migration. The prescription write goes through `recordPrescription`, which is the existing `createPrescription` path, so 0026/0027/0107 are exercised exactly as the form exercises them
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager — n/a: no migration

## 4. Functional checks

Driven in the browser pane on `http://localhost:3001`, signed in with
`node scripts/dev-signin.mjs admin --port 3001`, every page reached by clicking through
(the Assistant button in the header opens the slide-over).

- [x] Happy path works end to end — all three tools and the confirm-skip, see below
- [x] Data persists — each write was confirmed by a **second, separate read**: after the weight skip, "tell me about Angsumalin" answered `Last weighed 13.1 kg on 31 Oct 2026`; after the prescription Confirm, "tell me about R-0002" answered `AMC 500 — from 31 Oct 2026, open`
- [x] Create / edit / delete all exercised (whichever the feature has) — this feature creates only. A weight row (skip path), a prescription row (card path). Nothing here edits or deletes
- [x] Empty state renders sensibly — the summary draws "No weight has been recorded." / "No medicine is prescribed at the moment." / "No clinic visit recorded." / "No vaccination recorded." per section, and the free-space answer draws "No enclosure has room at the moment." Checked by reading the branches and seen for the prescription section before the write landed
- [x] Invalid input is rejected with a readable message, not a crash — the prescription card's Confirm is disabled until resident, medicine, start date, a valid dose and a valid day pattern are all present (`parseScheduleForm` and `tickVerdict`, the form's own validators); a nonsense `timesPerDay` from the model lands as a blank rather than as 99, asserted in `interpret.test.mjs`
- [x] Boundary cases checked — `timesPerDay` is bounded 1–4 in the spec and clamped by `coerce`; `places` is bounded at 1 and `Math.max(1, …)` again at the server; the free-space list is capped at 8 with "39 more have room"; an enclosure with no capacity recorded is reported, not hidden; `readyToRecord` refuses a zero or negative weight, an empty vaccine list, and an ambiguous name

### Role access matrix

**Read this as transient context, not as a finding** (`CLAUDE.md`: all analysis is by card). The
durable statement is in section 1. The table is filled from what the cards grant today.

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | everything | all three tools; the skip writes without a card | driven; as expected |
| management | nothing new | holds no `assistant` card on dev, so no Assistant button at all | driven: signed in, no Assistant in the header or sidebar |
| staff | — | n/a: retired role (`0173`) | n/a |
| doctor | — | not driven | n/a: doctor is Lutan's one-card test role and its cards change daily; nothing here is keyed on it |
| volunteer | the two new questions only | `assistant.ask` answers them; any write ends on the read-only refusal, with an audit row | not driven — see **Left for manual verification** |
| signed out | nothing | `assistant.ask` fails, `loadPermissions` returns null | not driven; unchanged code path |

- [ ] Every role above tested — n/a: the rule is that analysis is by card, not by role, and two of the six rows cannot be driven usefully (staff is retired; doctor's cards are a live experiment). Admin and management were driven; volunteer is in the manual list
- [x] A role that should not have access is blocked server-side — the server gates are unchanged and are the same ones the pages use: `assistantLookup` asks `can(perms, "assistant.ask")`, `runWrite` asks `assistant.record`, and `recordPrescription` asks `medical.prescriptions` **inside the write**, so neither caller can skip it. The prescription tool is additionally withheld from the model for a login without that card, and `interpretTools`' `holds` argument **defaults to no**, asserted in `interpret.test.mjs`

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no new page or nav entry; everything is inside the existing assistant panel and `/assistant`
- [ ] Manual updated (`src/lib/manual/en.ts`) — n/a: the manual's assistant topic lists the sentences the assistant understands and is owed an update, but `src/lib/manual/en.ts` is the file CLAUDE.md names as conflicting across streams and two others are live this batch. Raised as a follow-up rather than edited here; the in-app `cantHelp` reply, which is what a person actually reads when stuck, **was** updated with all five new sentences in both languages
- [x] Translatable strings go through the translation path — every new string is a key in `src/lib/i18n/dictionaries/en.ts` with a Thai counterpart in `th.ts`; no literal was typed into a component. Thai **wording** not reviewed by a Thai reader, see **Left for manual verification**
- [ ] Mobile viewport (375px) — n/a: not driven. The new card and the two answers reuse the existing card and reply-bubble layout (same `flex flex-col gap-*` containers and `grid gap-3 sm:grid-cols-2` pairs as the weight and immunization cards, which are phone-checked); nothing introduces a fixed width or a table
- [x] Browser console clean — no errors or React warnings during the drive
- [x] Network clean — no unexpected 4xx/5xx; the server actions returned normally and each write was followed by a successful read

## 6. Regression

- [x] The pages nearest the change still work — `/my` with the assistant slide-over (the existing `where`, `who` and `due` questions still answer, and the weight card path still exists for an incomplete sentence); the resident summary reads the same rows the resident hub does
- [x] Any shared file touched checked from a second, unrelated page — `src/app/prescriptions/actions.ts` is the shared one: `createPrescription` is now `recordPrescription` plus its redirect. Checked by **loading** `/prescriptions/new`'s own path through the build (the route compiled and is in the build output) and by the write itself running through `recordPrescription` end to end from the assistant. **The form page's own Save was not pressed** — see **Left for manual verification**, because that is the one caller whose redirect behaviour changed shape
- [x] Nothing merged from `main` during `sync` was broken by this branch — `sync` brought in `scripts/check-permission-props.mjs` and the translations/projects work; `gates.mjs` ran clean afterwards, lint included

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** — and searched for others this work closes: `FieldSpec` / `fieldSpecs` / `AssistantDetails` / `createPrescription` / `assistant.record` / `find-enclosure` were each grepped. The only other hit is the buttons-follow-cards item, which already records "no card grants `assistant.record`" as a separate fault; this PR does not close it and did not touch it
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-10-31-assistant-v2-more-tools.md`
- [x] `README.md` still accurate — no new script, env var, route or setup step
- [x] **Release notes.** `unreleased` in `src/lib/releases.ts` gained a line in this PR, written for a shelter user and tagged `cards: ["assistant"]`, covering the three new things and the weights/vaccinations no longer stopping for Confirm. Nothing in this PR records an outstanding step before a user could see it: there is no migration, no deploy-only behaviour and no hand edit — the tools work the moment the build ships
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and decision files were measured, not reasoned** — every "done" in the PR body was checked by opening the file. Two specific claims were corrected after measuring rather than reasoning: the date rule (the first version required an explicit date, and the browser showed the skip then almost never fired), and the location of the #1122 inference (the report named `AssistantDetails.tsx`; the code is in `askableField` in `interpret.ts`, and the decision file says so)

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour** — deferred: release manager. Relevant here: the skipped write's date comes from `isoLocal(new Date())` in the **browser**, the asker's own clock, which is the same source every card already uses for its default date, and `answerDue`'s existing `today` handling is untouched
- [ ] **For a boundary or banding change, the assertions cover both edges** — n/a: no threshold or band changed. The two new numeric bounds (`timesPerDay` 1–4, `places` ≥ 1) are asserted at both ends in `interpret.test.mjs`
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited** — n/a: the only pasted tool output is the `gates:` block in section 2, which is verbatim
- [ ] Public pages re-checked after a cache purge — deferred: release manager

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: no new secret or env var. `ASSISTANT_LLM_*` already exists from stream 2 and is unchanged

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration
- [ ] `--env production --dry-run` run and clean — n/a: no migration
- [ ] Production backup fresh — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [ ] Rollback position stated — deferred: release manager. No migration, so a Pi rebuild at the previous ref (or the Worker fallback rollback) reverts this completely; nothing here leaves state behind except ordinary rows a user chose to write

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | medium | The confirm-skip first required the draft to carry an explicit date. The keyword parser leaves `date` null unless the sentence says one and the model is told to pass null for anything unsaid, so the skip almost never fired and the feature did nothing. Found by driving it, not by reading it | fixed — a missing date now means today, which is what the card would have written anyway, and both done messages gained the date so the day is still checked |
| 2 | low | The free-space answer listed every enclosure with room: 47 of them on the dev shelter, which is not an answer | fixed — capped at the eight roomiest, with "39 more have room — the enclosures list has them all" |
| 3 | low | `src/app/assistant/actions.ts`'s `runWrite` comment described the gate as "admin / management / staff write, volunteers get the read-only lookups", naming roles for a check that reads a card | fixed — the comment now says `assistant.record`, which is what the code asks |
| 4 | — | **Not caused here, and not fixed here:** no card grants `assistant.record`, so no non-Admin login can confirm any assistant write today | accepted — already recorded on the backlog under the buttons-follow-cards item; out of this stream's scope |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | The Thai wording of the new strings reads naturally — the prescription card's labels, the free-space and summary answers, `notYourCard` and `recording`. Written by Claude, not reviewed by a Thai reader | `/assistant` in Thai, and `src/lib/i18n/dictionaries/th.ts` |
| 2 | `/prescriptions/new` still saves and still redirects to the resident's prescriptions tab. `createPrescription` is now `recordPrescription` plus the redirect; the build compiles it and the assistant exercises the write half, but the form's own Save was not pressed | `/residents/<id>/prescriptions` → Add prescription |
| 3 | A volunteer (or any login holding `assistant.ask` without `assistant.record`) still gets the two new questions and is still refused a write. Not driven, because no card grants `assistant.record` today, so the two sides cannot be told apart on dev without Admin | `/assistant` as a volunteer |
| 4 | The assistant's manual topic lists the sentences it understands and does not yet mention the five new ones. `src/lib/manual/en.ts` was left alone on purpose — CLAUDE.md names it as the file that conflicts across streams, and two others are live this batch | `src/lib/manual/en.ts`, `/manual` |
| 5 | The new card and the two answers on a real phone at 375px. Not driven; they reuse the existing card and bubble layout | `/assistant` on a phone |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (Opus 5)  Date: 2026-10-31

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: the list is not empty and nobody has looked yet; only the person who looks may tick this

Manual verification by: pending: Thai wording, the prescription form's own Save, a volunteer login, the manual topic, and a phone

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [ ] Handed to the production release manager — n/a: the PR is not merged yet, so there is nothing to hand over

Result: pass with accepted defects

Release manager acknowledgement: pending: the release that carries this PR
