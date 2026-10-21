# Feature test plan — assistant-return-from-carer

## Header

| | |
|---|---|
| Feature | The assistant understands "Panda came back from foster"; the manual explains the vaccination sentences |
| Backlog item | `docs/backlog.md` → Assistant v1 |
| Branch / worktree | `claude/assistant-return-from-carer` @ `C:\Development\Animal_Shelter_assistant-return-from-carer` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3007` |
| PR | opened from this branch after this commit |
| Tested by / date | Claude, 2026-10-21 |
| Carries a migration? | no |
| Tested at SHA | c42b1bf1 |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — a return-from-carer intent over `returnResidentToShelter`, plus the manual's immunization sentences: the two pieces the item still listed
- [x] Files/areas touched listed: `src/lib/assistant/intents/carer-return.ts` (new), `src/lib/assistant/carer-return-strings.ts` (new), `src/lib/assistant/types.ts`, `src/lib/assistant/parse.ts`, `src/app/assistant/actions.ts`, `src/components/assistant/AssistantCards.tsx`, `src/lib/manual/en.ts` (assistant and immunizations topics only), `src/lib/releases.ts`, `docs/`
- [x] Roles affected identified: whoever has `assistant.record` (admin, management and the roles granted it) can confirm the return; the helper's own `placement.rehome` check still applies; volunteers and others are unchanged
- [x] Out of scope written down: a new carer named in a sentence (by design), batch numbers and dates in words on the immunization card, checking the named carer against the current one; see `docs/decisions/2026-10-21-assistant-return-from-carer.md`

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (already up to date)
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Paste its closing `gates:` lines below exactly as printed. They are the evidence, and running the script again regenerates them

```
=== gates: build exited 0 after 112s

gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration; `assistant_actions.intent` is plain text, so "carer-return" needs none
- [ ] `--status` reviewed — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] Re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration
- [ ] Constraints exercised in a rollback harness — n/a: no migration
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end — driven in the browser pane on :3007 as a disposable management login: "Capwarn Test 0924 came back from foster" gave the Back to the shelter card with the resident matched and the enclosure blank; Confirm then said "Done — … is back in Cat Enclosure."
- [x] Data persists — read back on dev as the service role: a `ReturnToShelter` placement into Cat Enclosure dated 2026-10-20, the Foster placement ended, status now Resident, notes `via the assistant — "Capwarn Test 0924 came back from foster"`, and an `assistant_actions` row `carer-return / confirmed / ok`
- [x] Create / edit / delete exercised — create via Confirm; on the card I picked the zone and enclosure and changed the date from 21 to 20 Oct, and the summary line and the stored row both followed the edits
- [ ] Empty state renders sensibly — n/a: no list; a sentence naming no resident leaves the resident picker blank as on the other cards
- [x] Invalid input is rejected with a readable message — "Dryrun Zeta TH came back from Khun Nobodyhere" showed "No carer called "khun nobodyhere" is on the list, and none is added here…"; no contact was created (the action has no path that creates one). A resident not with a carer gets the "Not with a carer" hint and Confirm stays disabled; the helper refuses it again server-side
- [x] Boundary cases checked — parser run on sentences with a script: "came back from foster", "back from Khun Noi" (known carer matched), "from foster with Khun Somchai" (unknown name kept), "from fostering today" (no false name), "from foster to B1" (enclosure filled), "back from hospital" (still the hospital return), "goes to foster with Khun Noi" (still rehome), "move Panda back to B1" (still move)

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a: not signed in as admin; same `assistant.record` gate as the existing write cards | | |
| management | /assistant, the card, Confirm | writes the return | as expected |
| staff | n/a: role retired (0173) | | |
| doctor | n/a: no new surface; the assistant does not open for the doctor role, unchanged | | |
| volunteer | n/a: no new surface; `runWrite` refuses without `assistant.record`, unchanged | | |
| signed out | n/a: /assistant redirects to login, unchanged | | |

- [ ] Every role above tested — n/a: no new route or permission; the write goes through the existing `runWrite` role check and the helper's `placement.rehome` check, both unchanged
- [ ] A role that should not have access is blocked server-side — n/a: no new access path; the server action reuses the same two checks every assistant write already has

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change
- [x] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — the return paragraph, the Vaccines paragraph, the Thai phrases and the tip on Logging immunizations all present on the page
- [ ] Translatable strings through the translation path — n/a: card strings are in `carer-return-strings.ts` with Thai beside English, as `immunization-strings.ts` is, because the dictionaries belong to another stream this batch
- [x] Mobile viewport (375px) — the card at 375 px: no overflow, the picker and Send reachable
- [x] Browser console clean — no errors on /assistant after the card and Confirm
- [ ] Network clean — n/a: not inspected request by request; the server action returned and the row landed

## 6. Regression

- [x] The pages nearest the change still work — the parser probe shows hospital return, rehome and move still claim their sentences; /assistant and /manual loaded
- [x] Shared file `manual/en.ts` checked from a second page — /manual loaded and rendered both edited topics
- [x] Nothing merged from `main` during `sync` was broken by this branch — sync was already up to date

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch — Assistant v1, with a status line saying what shipped and what stays out
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-10-21-assistant-return-from-carer.md`
- [x] `README.md` still accurate
- [x] **Release notes.** One line added to `unreleased` in `src/lib/releases.ts`; nothing outstanding — no migration, no deploy step beyond the ordinary release
- [x] Commit messages say why, not just what
- [x] Claims in commit messages and the decision file were measured — the helper's refusals (system enclosure, not with a carer, no occupancy check) read from `returnResidentToShelter`; the written row read back from dev

## 8. Pre-production gate

- [ ] Tested SHA is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager
- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] Timezone-sensitive behaviour proved — n/a: dates come from the existing `parseDate` and `viewerToday`, unchanged
- [ ] Boundary or banding change covered at both edges — n/a: no threshold or band changed
- [ ] Evidence pasted is the tool's actual output — deferred: release manager
- [ ] Public pages re-checked after a purge — n/a: no public page touched
- [ ] Production project ref read in the deploy line — deferred: release manager
- [ ] `strip-baked-env` seen — deferred: release manager
- [ ] New secret/env var in production — n/a: none added
- [ ] Migration and code in one PR — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Production backup — n/a: no migration
- [ ] Apply plan — n/a: no migration
- [ ] Rollback position stated — deferred: release manager

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | "back from fostering" was read as a carer called "ing" | fixed in this branch before the browser pass |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | The return card reads well in Thai, and the Thai phrase "… กลับจากฝากเลี้ยง" is how staff would actually say it | /assistant with the language set to ไทย |

## Sign-off

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-21

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: one item is still with Lutan, see the pending line below

Manual verification by: pending: Thai wording of the return card and phrase

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR links this file instead
- [ ] Handed to the production release manager — n/a: handed over at release cut, not per PR

Result: pass

Release manager acknowledgement: n/a: given at release time
