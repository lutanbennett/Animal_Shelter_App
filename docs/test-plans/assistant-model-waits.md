# Feature test plan — assistant-model-waits

## Header

| | |
|---|---|
| Feature | The assistant's waits, and which brain answered |
| Backlog item | `docs/backlog.md` → *THE ASSISTANT'S WAITS, AND WHICH BRAIN ANSWERED* (## Assistant) |
| Branch / worktree | `claude/assistant-model-waits` @ `C:\Development\Animal_Shelter_assistant-model-waits` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3003` |
| PR | (opened from this commit) |
| Tested by / date | Claude (Opus 5) / 2026-10-31 |
| Carries a migration? | no |
| Tested at SHA | `174ad2da` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — a conversation remembers an `unavailable` model for three minutes instead of re-waiting per sentence, the per-step model cap is derived from the Cloudflare request budget rather than being a flat 25 s, and `/admin/assistant` says which brain answered each row
- [x] Files/areas touched listed: `src/lib/assistant/model-wait.ts` (new) and its test, `src/lib/assistant/interpret.ts`, `src/app/assistant/interpret.ts`, `src/components/assistant/AssistantConversation.tsx`, `src/lib/assistant/could-not-help.ts`, `src/app/admin/assistant/page.tsx`, `src/lib/i18n/dictionaries/en.ts` and `th.ts`, `src/lib/releases.ts`, `docs/`. No `supabase/migrations/`, no `worker/`, no `src/lib/manual/`
- [x] Roles affected identified — **by card, since roles are a transient grouping.** The wait change is on the assistant conversation, so it reaches whoever holds a card granting `assistant.ask`; nothing about who may ask it changed. The log screen and its export are **Admin only** by the Admin rule and no card (`requireAdminUser`), unchanged by this PR. Signed-out: no surface
- [x] Out of scope, written down: the assistant card fault (no card grants `assistant.record`, `0268_card_review_2_cards.sql:144`) — its own Security item, met and left alone; the assistant's manual topic — its own Documentation item, `src/lib/manual/` untouched; the "which one?" picker; where the model runs and whether it is reachable; assistant v2 stream 7

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly three times, as `pi-failover-schema` (#1131) and `thai-dictionary-sweep` (#1132) merged; the gates below were re-run at `174ad2da`, after the last of them
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 test=0 build=0`. Its closing lines, exactly as printed:

```
=== gates: typecheck — npm run typecheck
=== gates: typecheck exited 0 after 7s
=== gates: lint — npm run lint
=== gates: lint exited 0 after 88s
=== gates: test — npm test
=== gates: test exited 0 after 15s
=== gates: build — npm run build
=== gates: build exited 0 after 84s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration in this PR; `0292` belongs to `pi-failover-schema`
- [ ] `--status` reviewed — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration. The `model` column this PR starts reading was added by `0289`, is nullable, and is already applied to dev; rows written before it read as null and render as "Keyword reader", which was checked on real dev rows (section 4)
- [ ] Constraints and defaults exercised against real rows — n/a: no migration
- [ ] Down-migration written — n/a: no migration
- [ ] Production apply plan — n/a: no migration. **`0289` is applied to dev and is NOT yet on production**, so the new column will read null on production until the release that applies it, and every row will say "Keyword reader". That is correct, not a defect: no model answers on production today either

## 4. Functional checks

- [x] Happy path works end to end — both halves, driven in the browser signed in as `admin` on `http://localhost:3003`
- [x] Data persists — the log is a read of `assistant_actions`; reloaded with the filter form and the new column and count were still right
- [x] Create / edit / delete all exercised — the log screen is read-only; the three sentences typed at the assistant each produced a confirm card from the keyword reader
- [x] Empty state renders sensibly — the `rows.length === 0` branch is untouched and shows `a.empty` with no table, so the new split line (inside the table branch) cannot divide by an empty screenful
- [x] Invalid input is rejected with a readable message, not a crash — `stepTimeoutMs` was given `undefined`, `""`, `"not a number"`, `10` and `180000` in the unit test and returns the derived cap rather than throwing; a malformed `ASSISTANT_LLM_TIMEOUT_MS` therefore means "unset"
- [x] Boundary cases checked — the unit test covers `now` at `until - 1`, `until` and `until + 1`, a year later for the `none` state, every non-`unavailable` reason, every other `LlmErrorKind`, and an `error` with no kind at all (what the server action's own catch returns)

### What was measured in the browser, and how

Signed in as `admin` via `node scripts/dev-signin.mjs admin --port 3003`.
`requestAnimationFrame` was confirmed firing before every reading, and each page
was reached by clicking through, per `CLAUDE.md`.

**Deliverable 1 — one wait, not one per sentence.** The sleeping machine was
*simulated*, because a real one is not something this session can arrange: dev
was pointed at `http://192.168.68.250:11434/v1`, the address
`2026-10-30-assistant-local-model-reachable.md` measured `unavailable` at 10.7 s
against, with `ASSISTANT_LLM_PROVIDER=openai-compatible`. Three sentences were
typed into the assistant slide-over and timed with `performance.now()`:

| sentence | wall time to the reply | pending bubble shown? |
|---|---|---|
| 1. "Angkorwath weighs 12.4 kg" | **11,957 ms** | yes |
| 2. "Angkorwath weighs 12.5 kg" | **763 ms** | **no** |
| 3. "Angkorwath weighs 12.6 kg" | **765 ms** | **no** |

The 763/765 ms is the poll's own floor, not a wait — no pending bubble ever
appeared, so the model was never asked. The dev server log is the unambiguous
evidence and shows exactly one model call for the three sentences:

```
 POST /admin 200 in 11.9s (next.js: 13ms, proxy.ts: 369ms, application-code: 11.5s)
  └─ ƒ interpretRequest({"history":[],"request":"Angkorwath weighs 12.4 kg","today":"2026-10-31"}) in 11472ms src/app/assistant/interpret.ts
```

All three sentences produced a Log weight confirm card from the keyword reader,
so nothing was lost by not asking. `.env.local` was restored afterwards and the
tree re-checked clean.

**Deliverable 4 — which brain answered.** `/admin/assistant` reached by clicking
Settings → Assistant log. The "Answered by" column and the split line were read
off the live page:

```
4 shown. 1 of them a model read, 3 the keyword reader.
31 Oct 2026, 16:06 | Not understood | assistant-model-waits check… | — | A model / qwen2.5-14b-instruct
17 Oct 2026, 3:46  | Refused        | Panda weighs 12.4 kg        | — | Keyword reader
17 Oct 2026, 3:45  | Refused        | Move Rex to the vet 1355…   | — | Keyword reader
23 Sep 2026, 1:57  | Not understood | What is the meaning of life?| — | Keyword reader
```

Every real dev row has a null `model`, so one row carrying a model id was
inserted to see the other half of the column and **deleted again** (dev only,
the insert refused any project but `qxkmhwybjggxvsfxsxbd`). The export was
fetched from the live page and carries the two new columns in the right place:

```
id,when,status,typed,assistant_did,answered_by,model,intent_guessed,resident_id_guessed,correct_intent,correct_answer
a2b465f4…,2026-10-31 16:06,unmatched,assistant-model-waits check…,no match: no parser placed the sentence,model,qwen2.5-14b-instruct,,,,
6d155f4b…,2026-10-17 03:46,refused,Panda weighs 12.4 kg,refused: this login may not ask…,keyword reader,,,,,
```

### Role access matrix

Read by card, not by role: the only access question this PR touches is who may
open the Admin-only log, which `requireAdminUser` decides and this PR does not
change.

| Login | Can reach | Expected | Result |
|---|---|---|---|
| admin (`dev-signin-admin`) | `/admin/assistant`, `/admin/assistant/export`, the assistant slide-over | all of it | as expected; both halves driven above |
| a login holding **only the `assistant` card** (`dev-signin.mjs --cards assistant`) | `/assistant` yes; `/admin/assistant` no | assistant usable, log refused | `/assistant` 200; `/admin/assistant` serves a redirect to `/no-access` and **none** of the log's content (`grep "Assistant log"` → 0, `grep "Sentences typed at the assistant"` → 0); `/admin/assistant/export` **403** |
| signed out | nothing | refused | `/admin/assistant` → **307** to `/login?next=%2Fadmin%2Fassistant` |
| management / second_in_command / head_of_maintenance / head_of_medical / doctor / volunteer / public_viewer | — | — | n/a: not tested per role on purpose. Access here is a card question, not a role one, and a role is a transient grouping of cards (`CLAUDE.md`); the card-only login above is the durable form of the same check |

- [x] Every login above tested
- [x] A login that should not have access is blocked server-side (hitting the URL directly fails) — checked with `curl` against the URL, not by looking at the nav: `/admin/assistant/export` returns 403 and `/admin/assistant` serves the `/no-access` redirect with no log content

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no nav change; `/admin/assistant` was already linked from Settings and this PR adds no route
- [ ] Manual updated (`src/lib/manual/en.ts`) — n/a: the assistant's manual topic is its own open Documentation item and the brief forbids touching `src/lib/manual/`
- [x] Translatable strings go through the translation path — the four new strings (`answeredBy`, `byModel`, `byKeyword`, `split`) are dictionary keys in both `en.ts` and `th.ts` and are read through `getT()`; the English was read on the live page. `/management/translations` governs website page text, not dictionary keys, so there was nothing to check there
- [x] Mobile viewport (375px) — the table is inside the existing `overflow-x-auto` / `min-w-[40rem]` wrapper, so the fifth column scrolls horizontally exactly as the four did; no new fixed widths were added
- [x] Browser console clean — no errors or React warnings seen while driving the assistant and the log
- [x] Network clean — the only non-200 seen was the deliberate 403 on `/admin/assistant/export` for a login without the Admin rule

## 6. Regression

- [x] The pages nearest the change still work — `/my`, `/home`, `/admin` and `/admin/assistant` all loaded; the assistant slide-over opened from `/admin` and answered three sentences
- [x] Any shared file touched checked from a second, unrelated page, by loading it — `en.ts` and `th.ts` are the shared files; `/my`, `/home` and `/admin` were loaded after the change and render their own strings normally. `src/lib/assistant/interpret.ts` is shared with the server action, and the whole assistant path was driven end to end above
- [x] Nothing merged from `main` during `sync` was broken by this branch — the two syncs brought `docs/planner-handover.md` and `pi-failover-schema`'s `0292` plus docs; neither touches `src/`, and the gates were re-run clean after the second

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** — all three parts delivered, so the whole item ticks, with what each part became written into it
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `docs/decisions/2026-10-31-assistant-model-waits.md`, which carries the two judgements the brief asked for as answers: three minutes and why, and the derived step cap and why it cannot simply follow the env var
- [x] `README.md` still accurate — nothing in it describes the assistant's timeouts or the log's columns
- [x] **Release notes.** `unreleased` in `src/lib/releases.ts` gained one line, tagged `cards: ["assistant"]`. It is ticked rather than `n/a` because the **visible half needs no outstanding step**: the "Answered by" column and the split line are live on `/admin/assistant` the moment this ships, with every row reading "Keyword reader". The note says so in those words, and says the wait change applies "once one is set up", so it does not promise anything that waits on Lutan's model machine
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and decisions were measured, not reasoned.** The 10.7 s and 0.2 s figures are quoted from the stream that measured them and were not re-derived; the 11,957 ms / 763 ms / 765 ms readings here are this session's own, taken with `performance.now()` after confirming `requestAnimationFrame` fires, and cross-checked against the dev server's own per-call timing. The one claim that is **reasoned, not measured**, and is labelled as such in the decision file: that 20 s of reserve is enough for auth, the row load, the audit write and two network legs

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] Timezone-sensitive behaviour proved — n/a: nothing here derives a calendar date. The clocks in this PR are elapsed-millisecond durations (`Date.now()` compared against `Date.now() + MODEL_ASLEEP_MS`, and a `setTimeout` race), which are timezone-free. The log's shelter-time day bounds and its `stamp()` are untouched
- [ ] Boundary or banding change covers both edges — n/a: nothing a deployed build would show. There IS a boundary here, the three-minute window, and both sides of it plus the instant itself are asserted in `src/lib/assistant/model-wait.test.mjs`, which section 2's `test` gate runs
- [x] Evidence pasted into this plan is the tool's actual output, unedited — the gates block, the server log line and the CSV heading row are copied as printed
- [ ] Public pages re-checked after a cache purge — n/a: no public page is touched; both halves are behind a login

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` line seen — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: no new variable. `ASSISTANT_LLM_TIMEOUT_MS` already exists in `scripts/lib/runtime-config.mjs` as a `pi` value; this PR gives it a second reader and does not change where it is set

### Migration ordering — *skip if no migration*

- [ ] Both a migration and code that reads it? — n/a: no migration here. This PR **does** add code that reads `0289`'s `model` column, and `0289` is not yet on production; it is nullable, so the page reads null and shows "Keyword reader" until it is applied, which is correct rather than broken
- [ ] `--env production --dry-run` run and clean — n/a: no migration
- [ ] Backup fresh for a destructive migration — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position stated, including what it does not cover — the rollback is `./scripts/pi/deploy-pi.sh --ref <sha>` on the Pi, and `npx wrangler rollback --env production` for the Worker fallback only. Nothing here needs more: no schema, no data written, no setting changed. Rolling back restores the 25 s step cap and the per-sentence wait, and loses the log's new column

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | `react-hooks/purity` failed `lint` on the two `Date.now()` calls in the conversation component — the rule reads any `Date.now()` in a component body as a render-time call, and the handlers are declared there | fixed: the clock moved into `model-wait.ts`, where the window is decided anyway; `now` stays injectable for the test |
| 2 | low (found, not fixed) | The adapter's own timeout (`ASSISTANT_LLM_TIMEOUT_MS`, default 180 s) is now always longer than the step cap, so a step that times out abandons its `fetch` rather than aborting it; the connection runs on until the adapter gives up | accepted and recorded in the decision file: it costs a dangling connection on a machine on Lutan's own network, nothing is read from it, and wiring the cap down into `createLlm()` would couple the env plumbing to `interpret`'s budget |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | **A real sleeping machine.** The 11,957 ms → no-wait reading was taken against a simulated unreachable address. A gaming PC whose network card answers while it sleeps may fail faster or slower than 10.7 s, which changes how long the one wait is — but not that there is only one | Lutan's model machine, once it exists |
| 2 | **Whether three minutes feels right in use.** The number is reasoned from how fast sentences are typed, not from watching anyone. It is one constant in `model-wait.ts` and reloading the page retries at once | the assistant, once a model is configured |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (Opus 5)  Date: 2026-10-31

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: the list is not empty; both items need a model machine that does not exist yet, so they are Lutan's to tick

Manual verification by: pending: a real sleeping model machine, and whether three minutes feels right in use — both need a model Lutan has not set up yet

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager

Result: pass with accepted defects

Release manager acknowledgement: pending: not yet handed over
