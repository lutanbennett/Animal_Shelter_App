# Feature test plan — assistant-v2-conversation

## Header

| | |
|---|---|
| Feature | Assistant v2 stream 4: the model sees the conversation so far, can ask for a missing field through a dialog built from the action tool's schema, and "which Panda?" goes to the card's picker instead of being guessed |
| Backlog item | `docs/backlog.md` → **Assistant v2 stream 4** (ticked); the umbrella and stream 5 are left open |
| Branch / worktree | `claude/assistant-v2-conversation` @ `C:\Development\Animal_Shelter_assistant-v2-conversation` |
| Dev server | `http://localhost:3001` |
| PR | opened after this plan; number on the PR |
| Tested by / date | Claude / 2026-10-30 |
| Carries a migration? | no |
| Tested at SHA | `24cac7e8` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — each sentence is sent with the last three outcomes before it, the model may call `request_details` and the person answers in a dialog whose fields come from the action tool's own schema, the answer returns as the tool result, and an ambiguous resident goes to the card's existing picker; nothing is kept between page loads
- [x] Files/areas touched listed — `src/lib/assistant/interpret.ts` (+ `.test.mjs`), `src/app/assistant/interpret.ts`, `src/components/assistant/AssistantConversation.tsx`, new `AssistantDetails.tsx`, `src/lib/i18n/dictionaries/en.ts` and `th.ts`; decision file; backlog tick. `llm.ts`, the adapters, `llm-tools.ts` and `scripts/` are not touched
- [x] Roles affected identified — by card: a login holding `assistant.ask` gets history and questions about `where`/`who`/`due`; with `assistant.record` too, questions about the write actions. Today nobody sees a change, because no model is configured anywhere
- [x] Anything explicitly **out of scope** written down — a live model (none exists), the picker for read-only questions (decision file, found not fixed), exporting `FieldSpec` from `llm-tools.ts` (not this stream's file), a per-person ceiling on calls (stream 3's deferred defect)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — merged `origin/main` (one backlog line from another stream); gates ran after the merge
- [x] `node scripts/gates.mjs` ends with all four codes 0. Paste its closing `gates:` line below exactly as printed.

```
=== gates: build exited 0 after 404s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly after the change — n/a: no migration; `exchange` is jsonb and nothing in the app reads it back (grep), so v1 and v2 rows sit side by side
- [ ] **Constraints and defaults exercised against real rows** — n/a: no migration
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager — n/a: no migration; stream 3's `0289` note still applies to the release that carries both

## 4. Functional checks

- [x] Happy path works end to end — unit: `interpret.test.mjs` now 21 tests on a scripted adapter (ask, answer as tool result, one-row exchange with both legs; skip; re-ask refused or narrowed; dropped answer put back; id, unknown field and ungiven action refused; MAX_ASKS and the per-sentence round cap; act-and-ask; tampered resume refused with no model call; ambiguous pick cleared to candidates; history checked, capped and kept out of the row; dialog fields from the schema). Browser, dev, admin dev sign-in, slide-over, dev server pointed at a scripted stand-in model on localhost: "weigh Panda" opened the dialog with a number field labelled Weight (kg); answering 12.4 produced the Log weight card "Record Panda (R-0002) at 12.4 kg"; then "send her to hospital" produced the Send to hospital card for Panda from the history alone
- [ ] Data persists — reload the page and the change is still there — n/a: by design nothing persists; a reload is a new conversation. No card was confirmed, so no row was written to dev by the browser check
- [ ] Create / edit / delete all exercised — n/a: the write actions and cards are unchanged
- [x] Empty state renders sensibly — with no model configured (stand-in removed, dev restarted) "Panda weighs 12.4 kg" gave the keyword parser's Log weight card, as before
- [x] Invalid input is rejected with a readable message, not a crash — a wrong-type answer becomes a skip (unit); a tampered or mismatched resume falls back to the parser (unit)
- [x] Boundary cases checked — second question allowed and third refused; six model calls a sentence at most; three earlier sentences sent, older dropped (unit)

### Role access matrix

Analysed by card, as `CLAUDE.md` requires; the dev logins are named only to say how it was driven.

| Login | Can reach | Expected | Result |
|---|---|---|---|
| Admin (dev sign-in) | dialog, card, history | asks, fills the card, resolves "her" | pass (dev, 2026-10-30) |
| holding only card `assistant` (dev sign-in `--cards assistant`) | the panel | panel opens; on dev today it offered only the question examples, because `canWrite` read false | observed; see decision file, not a fault of this change |
| holding `assistant.ask` without `assistant.record` | the write actions through a question | the question tool names only `where`, `who`, `due` | pass (unit, `interpretTools(false)`) |

- [ ] Every role above tested — n/a: rows are cards, not roles; the read-only row is proved in a unit test, said plainly
- [x] A role that should not have access is blocked server-side — `interpretRequest` checks `assistant.ask` before anything, on every leg including a resume; the write tools are filtered by `assistant.record` on the server

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no new page
- [ ] Manual updated — n/a: nothing a user can see until a model is configured; the manual is another stream's file this batch
- [x] Translatable strings — `assistant.details` added to `en.ts` and `th.ts`; `locales.test.mjs` passes
- [ ] Mobile viewport (375px) — n/a: not driven at 375px; the dialog uses the same full-width `max-w-md` shell and `p-4` gutter as `ConfirmDialog`
- [x] Browser console clean — no errors after the whole run
- [x] Network clean — the server log showed `interpretRequest` returning in about 0.5 s per leg against the stand-in, no errors

## 6. Regression

- [x] The pages nearest the change still work — the slide-over, a card, Cancel, and the no-model parser path were driven on dev
- [x] Any shared file touched checked from a second, unrelated page — the dictionaries are shared; typecheck covers every use and `locales.test.mjs` checks both locales match
- [x] Nothing merged from `main` during `sync` was broken by this branch — gates ran after the sync

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch; the umbrella and stream 5 left open on purpose; no other open item is closed by this work (searched)
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-10-30-assistant-v2-conversation.md`
- [x] `README.md` still accurate — it does not describe the assistant's internals
- [ ] **Release notes.** — n/a: no model is configured, so a shelter user sees exactly today's assistant; the note goes in the PR that turns a model on
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** Prompt sizes were measured on the wire; behaviour of a real small model and the server's prompt cache are written as guesses

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: the browser's calendar date is passed on each leg as before; nothing new is date-sensitive
- [ ] **For a boundary or banding change, assertions cover both edges** — n/a: no banding; the question and round caps are tested at their limits
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited** — n/a: the gates block above is pasted as printed
- [ ] Public pages re-checked after a cache purge — n/a: no public page touched

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration
- [ ] `apply-migrations.mjs --env production --dry-run` run and clean — n/a: no migration
- [ ] Destructive migration backup — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [ ] Rollback position stated — n/a: revert the PR; nothing new is persisted except jsonb rows the old code ignores

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | medium | Escape in the dialog also closed the slide-over and lost the conversation | fixed in `c8ef9f96`, re-driven in the browser |
| 2 | low | A read-only question with several matching residents answers "which resident?" in words, not with the picker | deferred to backlog: the Assistant section item filed 2026-10-30 |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | With a real small model configured, a sentence that leaves out a weight or cause of death asks for it, and an answer fills the card; watch for the drifts in the decision file | the assistant slide-over, then `assistant_actions.exchange` |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-30

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person. — n/a: the list is not empty; item 1 needs a real model, which does not exist yet

Manual verification by: pending: item 1 needs a real model, which does not exist yet

Result: pass with accepted defects
