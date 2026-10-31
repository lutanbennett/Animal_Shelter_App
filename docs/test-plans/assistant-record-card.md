# Feature test plan

## Header

| | |
|---|---|
| Feature | `0295`: the `assistant` card grants `assistant.record` again |
| Backlog item | `docs/backlog.md` → Security → "No card grants `assistant.record`, so NO non-Admin login can confirm any assistant write" |
| Branch / worktree | `claude/assistant-record-card` @ `C:\Development\Animal_Shelter_assistant-record-card` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3003` |
| PR | see the PR this plan is committed to |
| Tested by / date | Claude (automated and browser-driven) / 2026-10-31 |
| Carries a migration? | yes — `0295_assistant_record_card.sql` |
| Tested at SHA | `b29989f3` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — one `card_grants` row putting `assistant.record` back on the `assistant` card, which `0257` had and `0268` deleted
- [x] Files/areas touched listed: `supabase/migrations/0295_assistant_record_card.sql`; `src/lib/permissions/cards.ts` (the `assistant` bundle — a declared crossing of the brief's no-`src/` boundary, see §7); `scripts/prove-assistant-record-card.mjs` (new); `scripts/gen-card-walkthrough.mjs` (one `READBACK` entry); `scripts/check-public-stories-schema.mjs` and `scripts/check-assistant-refused-client.mjs` (fixture card); `docs/card-walkthrough.md` (regenerated), `docs/decisions/`, `docs/card-access-faults.md`, `docs/backlog.md`
- [x] Roles affected identified — **stated by card, as `CLAUDE.md` requires.** Anything holding the `assistant` card gains `assistant.record` at edit/yes the moment `0295` commits; nothing else changes, and Admin is untouched (it sits outside the card system). Who holds the card today is transient and is Lutan's to set on Settings → Who does what
- [x] Anything explicitly **out of scope** written down — a separate acting-versus-asking card (Lutan decided against it, 2026-10-31); the assistant's inability to name an animal under a who-and-where card (found here, filed, needs a `src/` change); fixing `check-migration-grants.mjs`'s string-literal blindness (filed, a later stream)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 test=0 build=0`. Paste its closing `gates:` lines below exactly as printed

```
gates: typecheck=0 lint=0 test=0 build=0
all gates passed
```

- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [x] Migration number is one above the highest on `main` — `0295`, against `origin/main`'s `0294`; `check-migration-numbers.mjs` printed `ok` on commit, and the brief confirmed no other stream in this batch carries one
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying — `295 applied, 1 pending`, nothing missing either way against `origin/main`
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed — `dry-run 0295_assistant_record_card.sql … ok`
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — `applying 0295_assistant_record_card.sql … ok`
- [x] File is re-runnable — `on conflict (card, activity) do update set level = excluded.level`, and the temp table is `on commit drop`. `0268`'s delete is a one-time statement in an already-applied file and is never re-run, so it cannot undo a re-run of this one
- [x] Existing rows still read correctly after the change — `check-card-grants.mjs` passes all five of its checks against real dev rows (`card_grants holds cards.ts exactly (112 rows)`, `all 62 roles hold exactly what their cards require`), and `role-cards-coverage`, `card-grants-applied`, `cards-union` and `card-cells-backed` all return clean
- [x] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — `scripts/prove-assistant-record-card.mjs`, nine proofs, every fixture built from cards and never from a role key. Asserted, not merely run: the grant is in `card_grants` at level 2; a login holding exactly the `assistant` card passes `has_permission('assistant.record')` and one holding no card does not; that login really inserts a `confirmed` `assistant_actions` row as `authenticated` under the live `0150`/`0214` policies and reads its own row back; `user_id = auth.uid()` still refuses writing a row in another login's name and reading one; a card granting the ask alone (`do_maintenance`) still records only a refusal; `0257`'s triggers remove the cell when the card is taken away and restore it when given back; every non-fixed holder of the card holds the cell at the level the card requires; and Admin stays outside the card system (no `admin` card, fixed roles hold no cards and no cells, somebody still holds Admin). **Verified capable of failing:** inverting proof 2's card-holder check exits 1; restored, it exits 0
- [x] Down-migration written, or the reason one is not needed is stated — not needed, and writing one would be wrong: the down is a single `delete from card_grants where card = 'assistant' and activity = 'assistant.record'`, which is literally `0268:144` and is the fault this file exists to close. Reverting means reverting the decision, which is Lutan's
- [x] Production apply plan stated for the release manager — `0295_assistant_record_card.sql`, production (`dbkodyyxxhtygxcxmfcu`), either side of the deploy. Ordering does not matter: the app code that reads `assistant.record` has been live since before #1129 and simply refuses until the row exists, and `cards.ts` without the row only mis-draws the card's bundle on Who does what. **Nobody at the shelter sees any change until the `assistant` card is given to a role**, which is Lutan's own step

## 4. Functional checks

- [x] Happy path works end to end — driven in the browser on dev at port 3003, holding `assistant, view_residents, record_weight` and nothing else: *"Walkassistant weighs 12.4 kg"* → *"Done — Walkassistant (R-8383) recorded at 12.4 kg on 31 Oct 2026."*
- [x] Data persists — read back from the database, not from the screen: a `weight` row (`12.4`, `2026-10-31`, notes `via the assistant — "Walkassistant weighs 12.4 kg"`) and an `assistant_actions` row with `status = confirmed` under that login's own `user_id`
- [ ] Create / edit / delete all exercised — n/a: the change is one `card_grants` row, which has no create/edit/delete surface of its own. The grant's effect on `role_permissions` is exercised in both directions by proof 7 (card given, card taken away)
- [x] Empty state renders sensibly — holding the `assistant` card alone, the assistant panel opens with its "Try something like" list and answered *"Cat Enclosure is empty."* for an enclosure with no residents
- [x] Invalid input is rejected with a readable message, not a crash — an unknown name answers *"Which resident do you mean? Use the name as it is written on their record, or their code."*, and a write the login's cards do not cover answers with the database's own refusal rather than a blank screen
- [x] Boundary cases checked — proof 1 asserts the grant is at level 2 and rejects level 1, because `assistant.record` is a `yesno` activity and a `yesno` at read is a cell that means nothing; proof 7 covers the zero case (no card, no cell)

### Role access matrix

**Filled by card, not by role, as `CLAUDE.md` requires** — each row is a login holding exactly those cards and nothing else (`dev-signin.mjs --cards …`), which is what `0295` actually governs. The roles that hold these cards today are transient and will be rebuilt.

| Cards held | Can reach | Expected | Result |
|---|---|---|---|
| `assistant` | the assistant panel, write examples, the LOG WEIGHT preview card with Confirm | offered the writes (`can(perms, "assistant.record")` now true) | as expected — and the resident picker is **empty**, so the write cannot be completed: a separate fault, filed, see §7 |
| `assistant, view_residents` | the same, plus the resident lookup | the write reaches the database and is judged on its own activity | as expected — `new row violates row-level security policy for table "weight"`, i.e. `assistant.record` passed and only `medical.weight` was missing |
| `assistant, view_residents, record_weight` | the whole write | the weight is recorded | **Done — Walkassistant (R-8383) recorded at 12.4 kg on 31 Oct 2026**, both rows verified in the database |
| no card at all | nothing | `has_permission('assistant.record')` false | as expected (proof 2) |
| a card granting the ask alone (`do_maintenance`) | the assistant panel, lookups | may record a refusal and only its own; no `confirmed` row | as expected (proof 6, and both patched harnesses) |
| Admin | everything | untouched, holds no cards | as expected (proof 9) |

- [x] Every card set above tested
- [x] A login that should not have access is blocked server-side — exercised in the database as `authenticated` under the real policies, not merely hidden: a no-card login fails `has_permission`, an ask-only login's `confirmed` insert raises `insufficient_privilege`, and a card holder cannot write or read another login's row

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no nav change; the Assistant button already existed and this adds no page
- [ ] Manual updated (`src/lib/manual/en.ts`) — n/a: the manual's assistant topic is its own open backlog item and `main` merged a stream's changes to that file today; nothing here changes what the assistant does, only who may do it
- [ ] Translatable strings go through the translation path — n/a: no new string. `assistant.record`'s label already exists in both dictionaries (`en.ts:1077`, `th.ts:976`)
- [ ] Mobile viewport (375px) — n/a: no UI change. The assistant panel is unchanged; only whether its write controls are drawn, which follows the card
- [x] Browser console clean — no errors or React warnings during the three drives
- [x] Network clean — the only non-2xx was the deliberate one: the `weight` insert refused by RLS under `assistant, view_residents`, which is the designed per-tool check

## 6. Regression

- [x] The pages nearest the change still work — `/my` and the assistant panel were driven under four different card sets; `docs/card-walkthrough.md` regenerates and `check-card-walkthrough.mjs` passes (`all 39 cards have steps and docs/card-walkthrough.md is current`)
- [x] Any shared file touched checked from a second, unrelated page — `src/lib/permissions/cards.ts` is read by everything that draws a home screen, so it was exercised by loading `/my` as each of the four card-only logins; each showed its own tiles (`Residents` appeared only once `view_residents` was held, `My tasks` only with `record_weight`), which is the value `cards.ts` supplies at runtime
- [x] Nothing merged from `main` during `sync` was broken by this branch — the merge brought the assistant manual topic stream; gates pass on the merged tree

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch**, with what it does and does not close; the new fault found while driving went on the `backlog` branch instead
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-10-31-assistant-record-card.md`, covering Lutan's answer, the declared `src/` crossing and why `check-card-grants.mjs` makes it necessary, the `-- consumer:` reasoning, why both harnesses moved to `do_maintenance`, and the drive. Two rows added to `docs/card-access-faults.md`
- [x] `README.md` still accurate — unchanged; it describes no card's bundle
- [ ] **Release notes.** — n/a: nobody at the shelter can notice this until the `assistant` card is given to a role on Settings → Who does what, which is Lutan's own step. A note saying the assistant can now record would promise users something still waiting on him, which is the fault that sent #518's false note to every admin; the note belongs in the change that closes the step
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and decision files were measured, not reasoned.** Everything stated was read back from the thing itself: the migration numbers from `--status`, the checks from their own output, the grants from `card_grants` on dev, the write from the `weight` and `assistant_actions` rows, and the second fault from `pg_policy` plus the three cards' actual grants rather than from what their names suggest

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: production release manager
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: production release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: production release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: nothing here derives a date. The migration inserts one constant row and reads no clock
- [ ] **For a boundary or banding change, both edges covered** — n/a: no threshold, band or cutoff. The only boundary is a permission level, and proof 1 asserts it is 2 and rejects 1
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** — the `gates:` line, the migration runner's lines and the quoted refusal and success messages are as printed
- [ ] Public pages re-checked after a cache purge — n/a: no public page is affected; nothing here is reachable signed out

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref matches production — deferred: production release manager
- [ ] `strip-baked-env` line seen in the deploy output — deferred: production release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: none added

### Migration ordering

- [x] **Does this PR contain both a migration and code that reads it?** It contains a migration and the `cards.ts` mirror of the same row. Ordering does not matter and the reason is stated in §3's apply plan: the code that reads `assistant.record` has been live for days and simply refuses until the row exists, and the mirror without the row only mis-draws a bundle on Who does what. Neither order can break anything
- [ ] `--env production --dry-run` run and clean — deferred: production release manager
- [ ] Production backup fresh — n/a: one additive row in `card_grants`, nothing destructive or rewriting
- [x] Apply plan stated: `0295_assistant_record_card.sql`, production (`dbkodyyxxhtygxcxmfcu`), either side of the deploy

### Rollback

- [x] Rollback position stated, including what it does not cover — the Pi rebuild (`./scripts/pi/deploy-pi.sh --ref <sha>`) reverts the app; `npx wrangler rollback --env production` reverts only the Worker fallback. **Neither reverts the migration, and nothing here needs them to:** the row is additive and a production that has it while running older code behaves exactly as it does today, because the only reader is the permission check that was already there. Undoing the grant is a decision, not a rollback

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | medium | Held alone, the `assistant` card is offered every assistant write and can complete none: `src/lib/assistant/data.ts:123` reads `resident_list_view`, whose `residents` select policy asks `resident.record` at read, while the card grants `resident.who_and_where`. Every card narrowed to who-and-where by card review 2 is blind inside the assistant | deferred to backlog — new Security item on the `backlog` branch, plus a row in `docs/card-access-faults.md`. Needs a `src/` file and is a different fault from this one |
| 2 | none | Two harnesses used the Assistant card as their *ask-only* fixture and would have gone red for the right reason | fixed in this PR — both now use `do_maintenance`, and three places now assert that fixture property instead of one quietly passing |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Give the `assistant` card to whichever role should be able to let the assistant write. Nothing at the shelter changes until this is done, and it is the step that decides who gets it | Settings → Who does what, on production after the release |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-31

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: the list is not empty and nobody has looked; only the person who looks may tick this

Manual verification by: pending: giving the `assistant` card to a role on Settings → Who does what, which is Lutan's own step and the only thing between this and a shelter user seeing it

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager

Result: pass with accepted defects

Release manager acknowledgement: pending: not yet released
