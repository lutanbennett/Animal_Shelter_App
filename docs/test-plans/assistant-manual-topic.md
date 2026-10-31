# Feature test plan — assistant-manual-topic

## Header

| | |
|---|---|
| Feature | The manual's assistant topic rebuilt from `SPECS`: every sentence shape the assistant answers, and which writes skip the confirmation |
| Backlog item | `docs/backlog.md` → `## Documentation` → "The user manual's assistant topic owes the sentences the assistant has learned to understand since it was written…" |
| Branch / worktree | `claude/assistant-manual-topic` @ `C:\Development\Animal_Shelter_assistant-manual-topic` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3005` |
| PR | #TBD |
| Tested by / date | Claude (Opus 5) / 2026-10-31 |
| Carries a migration? | no |
| Tested at SHA | f6359d54 |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs)

  `src/lib/manual/en.ts` (the `assistant` topic rebuilt; one stale sentence in the
  `immunizations` topic corrected; the Assistant log topic gains "which brain answered"),
  `src/lib/releases.ts` (one `unreleased` note), `docs/backlog.md` (this item ticked),
  `docs/decisions/2026-10-31-assistant-manual-topic.md` (new). **No route, no component, no
  `worker/`, no migration, nothing under `src/lib/assistant/`, no card, catalogue or permission
  file.** `src/lib/manual/en.ts` is content read by `src/app/manual/page.tsx` and
  `src/app/manual/pdf/route.ts`.
- [x] Roles affected identified: admin / staff / doctor / volunteer / resident / signed-out public

  **Answered by card, not by role**, per `CLAUDE.md`'s "All analysis is by CARD". The topic is
  `activity: "assistant.ask"`, so the manual's own filter shows it to whoever holds a card granting
  that activity, and `?view=all` shows it greyed to everyone else. No reader loses a topic and none
  gains one: the topic's `activity` is unchanged by this PR. Signed-out visitors never reach
  `/manual`.
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised

  The manual's screenshots (deferred until the feature batch is finished — not regenerated, and the
  `assistant` topic has none); the Thai edition of the topic (**deliberately not drafted**, reasoning
  in the decision file, handed to the Thai-edition backlog item); the in-app `cantHelp` reply
  (already updated in both languages by #1129); the `assistant.record` card fault (another stream's,
  live in this same batch — which is why the topic describes access in shape and never states today's
  card assignment); and `assistant.volunteerReadOnly` / `assistant.pageSubtitleReadOnly`, two
  user-facing strings that name roles — found, reported, filed as a Security item, not fixed here.

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Paste its closing `gates:` lines below exactly as printed

  ```
  === gates: typecheck exited 0 after 31s
  === gates: lint exited 0 after 119s
  === gates: test exited 0 after 18s
  === gates: build exited 0 after 125s
  gates: typecheck=0 lint=0 test=0 build=0
  ```
- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration; this PR adds no file under `supabase/migrations/`
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: no migration, and this PR reads and writes no database row
- [ ] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — n/a: no migration
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager — n/a: no migration

## 4. Functional checks

The feature is prose in one content file. What "works" means here is that each sentence the topic
claims is the sentence the code accepts, and that each behaviour it describes is the behaviour the
code produces. That was checked by reading the producing code, named per line below, rather than by
driving a browser — see the note under section 6 and in the decision file.

- [x] Happy path works end to end

  Every shape in `SPECS` (`src/lib/assistant/llm-tools.ts`) is now named in the topic: the ten
  writes (`move`, `clinic`, `hospital`, `hospital-return`, `weight`, `death`, `rehome`,
  `carer-return`, `immunization`, `prescription`) and the five questions (`where`, `who`, `due`,
  `find-enclosure`, `summary`). Counted against `DRAFT_KINDS`, which is `Object.keys(SPECS)`:
  fifteen tools, fifteen shapes in the topic, none left over.
- [x] Data persists — reload the page and the change is still there

  n/a as a data check — the topic is a module constant, not a row; ticked instead on the two
  consumers resolving it: `src/app/manual/page.tsx` imports `@/lib/manual/en` and
  `src/app/manual/pdf/route.ts` the same file, and `next typegen && tsc` (gate 1) type-checks the
  `Manual` shape both read.
- [x] Create / edit / delete all exercised (whichever the feature has)

  n/a as CRUD — this PR creates no writable surface. The topic *describes* the assistant's writes;
  it performs none.
- [x] Empty state renders sensibly (no rows yet)

  n/a as an empty state — the topic has no data-driven list. The nearest equivalent was checked in
  the prose instead: the free-space answer's empty case is described (`freeNone` /
  `freeNoneInZone`), as is the case where enclosures have no capacity recorded, so a short list is
  not read as a full shelter.
- [x] Invalid input is rejected with a readable message, not a crash

  The topic's claim about this was checked against the strings that produce it: an unplaceable
  sentence gets `assistant.cantHelp` and writes nothing (the warning callout says so), a request
  the login's access does not cover is refused in words (`notYourCard`), and a low-risk draft with a
  blank falls back to the card (`readyToRecord` returns false; `recordLowRisk` returns
  `{ error: a.fillBlanks }`).
- [x] Boundary cases checked (long text, zero, negative, missing optional fields, dates)

  Three boundaries in the code are now stated in the topic because a reader would otherwise guess
  wrongly: a **missing date** on a weight or vaccination means today and the reply says which day
  (`readyToRecord`'s comment, `viewerToday()` in `recordLowRisk`); a **number in words** is not read
  (`placesWanted` matches `(\d{1,2})` only, so "room for two dogs" answers for one — the manual says
  write a figure); and the free-space list is **capped at eight** with the remainder counted
  (`freeMore`, `freeUnknownCapacity`).

### Role access matrix

Recorded as transient context only, per `CLAUDE.md`: this PR changes no access, and the roles are a
transient grouping of cards that will be rebuilt. The durable statement is the card one above —
the topic is `activity: "assistant.ask"` and that is unchanged.

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | `/manual`, the topic shown | shown — Admin sees everything, outside the card system | unchanged by this PR |
| management | `/manual` | shown if its cards grant `assistant.ask`, else greyed under `?view=all` | unchanged by this PR |
| staff | — | retired role (`0173`); not tested | n/a |
| doctor | `/manual` | as management; by card, not by role | unchanged by this PR |
| volunteer | `/manual` | as management; by card, not by role | unchanged by this PR |
| signed out | `/manual` | never reaches it | unchanged by this PR |

- [ ] Every role above tested — n/a: no access changed, so there is nothing per-login to test; the topic's `activity` is byte-identical before and after, and `acceptance-matrix.mjs --check` (inside gate 2) resolves it to real cards for every role
- [ ] A role that should not have access is blocked server-side (hitting the URL directly fails) — n/a: no server-side behaviour added or changed; `/manual` is reachable by anyone signed in, as before, and this PR adds no route

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no nav entry added or changed; the file is untouched
- [x] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual`

  Updated — that is the whole change. **The second half is honest only as far as the gates reach:**
  the topic type-checks, `acceptance-matrix.mjs` resolves it, and `check-multi-role-build.mjs`
  passes. Whether the prose *reads* well on the page is in **Left for manual verification**.
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: the manual is not on the translation path by design — `src/lib/manual/` is English only, `page.tsx` imports `en.ts` with no locale pick, and the Thai edition is its own backlog item (this is deliverable 4; see the decision file)
- [ ] Mobile viewport (375px) — no overflow, controls reachable — n/a: no layout, component or style changed; the topic is text rendered by `page.tsx`'s existing paragraph layout, which this PR does not touch. The prose was written for a phone reader (short steps, the two immediate writes given their own step rather than a table of tool names)
- [ ] Browser console clean — no errors or React warnings — n/a: no client code changed; nothing in this PR runs in the browser
- [ ] Network clean — no unexpected 4xx/5xx on the feature's pages — n/a: no route, fetch or server action added or changed

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked)

  The two consumers of the changed file, checked by type and by the gates rather than by loading
  them: `src/app/manual/page.tsx` and `src/app/manual/pdf/route.ts`. `npm run build` (gate 3)
  compiles both.
- [x] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — **by loading that page, not by reading the file**

  **Loaded, not read.** Dev server on 3005, signed in with `node scripts/dev-signin.mjs admin`, and
  `/manual` reached by clicking the User manual link on `/my` rather than by typing its address, so
  the page genuinely hydrated (`requestAnimationFrame` → `fires`, which is the check `CLAUDE.md`
  requires before believing anything the pane shows). What the rendered page supplied, read back out
  of the DOM rather than out of the file:

  - the `assistant` topic is present and 8,869 characters of rendered text;
  - all three new shapes are in it — `AMC 500` (a prescription), "Which enclosure has space?" and
    "Tell me about Panda";
  - `"room for 2 dogs"` renders with the figure, not the word;
  - both new Thai triggers render — `คอกไหนว่าง` and `สรุป`;
  - a regex for `volunteer` / `Volunteers` / `staff and management` over the whole topic returns
    **false**, which is deliverable 3 proved on the rendered page rather than in the source;
  - the second, unrelated page: the `immunizations` topic renders the corrected tip ("it is recorded
    as you press Send…") and no longer contains "check the card it fills in".

  Phone width (375 px) was set and the topic scrolled to; the measurement of overflow at that width
  did not complete before the session restarted, so it is **not** claimed here — it stays in **Left
  for manual verification**, with `/manual/pdf`.
- [x] Nothing merged from `main` during `sync` was broken by this branch

  `sync` merged cleanly and the gates were run after it.

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead)

  Ticked with what shipped, the Thai answer and the two findings. Two follow-ups went on the
  `backlog` branch instead, as the rule says: the Thai-edition item now carries this topic's Thai,
  and the two role-naming strings are a new Security item.
- [x] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`)

  `docs/decisions/2026-10-31-assistant-manual-topic.md`.
- [x] `README.md` still accurate — unchanged by this PR and checked: it describes the manual as a feature, not its contents
- [x] **Release notes.** Would a shelter user notice this change?

  Yes — the manual is a page shelter workers read, and the topic now tells them three things they
  could not learn anywhere else: the three newest sentences, which two writes go in without a
  Confirm button, and which sentence needs a model set up first. One line added to `unreleased` in
  `src/lib/releases.ts`, tagged `cards: ["assistant"]` because it is about a page whose topic is
  gated on `assistant.ask`. **Checked against the truth rule before ticking:** this PR leaves no
  step outstanding before a user sees the change — the Thai is another item's work and the note does
  not mention Thai, and the note says the medicine sentence needs a model rather than implying it
  works today.
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.**

  Every behavioural claim in the topic, the decision file and the commit message was read out of the
  code that produces it, named in each case: `SPECS` / `DRAFT_KINDS` for the shape list,
  `isLowRiskWrite` and `readyToRecord` for which writes skip the confirm, `who` /
  `a.weight.done` / `immunizationStrings().done` for the reply text quoted in the manual (both
  include the resident's code — the first draft quoted one with and one without, and the code
  settled it), `toolNeeds` for the prescription's extra activity, and `SPACE_RE` / `SUMMARY_RE` /
  `placesWanted` in `src/lib/assistant/intents/lookups.ts` for the Thai triggers and the
  digits-only number. The two disagreements that came out of this are written up rather than
  smoothed over.

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: production release manager
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: production release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: production release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: no date arithmetic added or changed; this PR adds no code. The topic *describes* `viewerToday()`'s existing behaviour (a missing date means today) and does not alter it
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary** — n/a: no boundary, threshold or band changed; the three described in section 4 are existing code this PR only documents
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited.** — n/a: the only tool output in this plan is the gates block in section 2, pasted as printed
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge — n/a: no public page touched; `/manual` requires a signed-in session

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: production release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: production release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: no new secret or environment variable; `.env.example` is untouched

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — n/a: no migration
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — n/a: no migration
- [ ] Apply plan stated: which file, which project, and whether it runs before or after the deploy — n/a: no migration

### Rollback

- [x] Rollback position stated, **including what it does not cover**

  A content-only change in one module constant plus one release note. Rollback is the ordinary
  one — `./scripts/pi/deploy-pi.sh --ref <sha>` on the Pi, or `npx wrangler rollback --env
  production` for the Worker fallback — and it covers this change completely, because there is no
  migration to leave behind and no row written. What it does not cover is nothing, here: the only
  durable artifact is the release note, which a rollback removes with the build.

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | `assistant.volunteerReadOnly` and `assistant.pageSubtitleReadOnly` in `src/lib/i18n/dictionaries/en.ts` name roles in user-facing copy ("recording this one is for staff and management"), which `CLAUDE.md`'s no-named-role rule forbids and no check can catch | deferred to backlog — new item under `## Security`; the dictionaries were another stream's this batch and the fix spans `en.ts` and `th.ts` |
| 2 | low | The `unreleased` note shipped by #1129, and `docs/decisions/2026-10-31-assistant-v2-more-tools.md`, both give "room for two dogs in the cat zone" as an example; `placesWanted` matches digits only, so a number in words is read as one place | accepted — the manual uses a figure and says why; changing the shipped note or teaching the parser written numbers is recorded in the decision file and is not this stream's file to edit |
| 3 | low | The `immunizations` topic told the reader to "check the card it fills in" for a vaccination that, since #1129, no longer draws one | fixed in this PR |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | The rebuilt **Asking the assistant** topic reads well on a phone — it is now fifteen steps and four callouts, and the one thing no gate can judge is whether a volunteer scanning it on a phone finds the sentence they want. Particularly: whether the two immediate writes are obvious enough in their own step, and whether the step order still works after the two new questions were added | `/manual`, the **Asking the assistant** topic (sign in, then click through to the manual rather than typing its address — the browser pane does not hydrate a direct load) |
| 2 | The same topic in the printed manual, since its PDF route reads the same file and the step list got longer | `/manual/pdf` |
| 3 | Whether the longer topic overflows at phone width. The viewport was set to 375 px and the topic scrolled to, but the overflow measurement did not complete before the session restarted, so nothing is claimed either way. No layout or style was changed by this PR, so a fault here would be pre-existing rather than introduced | `/manual` at 375 px, the **Asking the assistant** topic |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (Opus 5)  Date: 2026-10-31

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: the list is not empty; all three items are for a person reading the topic on a phone and in the PDF

Manual verification by: pending: nobody has read the rebuilt topic on a phone or in the PDF, and phone-width overflow was not measured; the three items above

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager

Result: pass with accepted defects

Release manager acknowledgement: pending: not yet handed over — this PR is not in a release
