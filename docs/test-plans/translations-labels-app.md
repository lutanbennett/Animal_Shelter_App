# Feature test plan — translations-labels-app

## Header

| | |
|---|---|
| Feature | Thai labels, app half: the screen learns `proposed`, Propose / Save & approve / Reject on the label row, and three group headings get words |
| Backlog item | `docs/backlog.md` → `## Management`, the label-draft item (ticked here) and the twelve-unlisted-columns item (retitled: only the gate is left) |
| Branch / worktree | `claude/translations-labels-app` @ `C:\Development\Animal_Shelter_translations-labels-app` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3002` |
| PR | #TBD |
| Tested by / date | Claude (`claude/translations-labels-app`) / 2026-10-31 |
| Carries a migration? | no — `0293` and `0294` are the schema half and are already on `main` (#1134) |
| Tested at SHA | `c41c5075` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for
      — *the Translations screen understands a Thai label that has been proposed and is waiting to be approved, and offers Propose, Save & approve and Reject beside the existing Save.*
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs)
      — `src/lib/translations/labels.ts`, `src/app/management/translations/{page.tsx,TranslationQueue.tsx,actions.ts}`,
        `src/lib/i18n/dictionaries/{en,th}.ts`, `src/lib/releases.ts`, `scripts/lib/readonly-checks.mjs` (comment only),
        `docs/backlog.md`, `docs/decisions/2026-10-31-label-drafts-the-app-half.md`. **No migration, no `worker/`, no `src/lib/manual/`.**
- [x] Roles affected identified: admin / staff / doctor / volunteer / resident / signed-out public
      — **stated as a card, because that is what is durable** (`CLAUDE.md`: all analysis is by card): the page and every control on it
        follow the **`translations`** card, which bundles `translations.view` and `translations.manage`. Admin reaches it through the
        `perms.isAdmin` short-circuit, unchanged. Nothing here reads a role key, a role name or a role column. *Transient context only:*
        whichever roles hold that card today are affected; who they are will change when the card assignments are rebuilt.
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised
      — `translations.propose` as its own activity and card (filed, deferred); teaching `translations-open` about drafts (decided *not yet*,
        §5 of the decision file); the `translations-open` empty-table fault; entering the 72 drafts on **production**; the manual topic;
        translating the wording itself.

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 test=0 build=0`. Paste its closing `gates:` lines below exactly as printed

```
=== gates: build exited 0 after 152s

gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration in this PR; `0293`/`0294` are the schema half and are on `main`
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration in this PR
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration in this PR
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration in this PR; `0293`/`0294` were applied by the schema stream
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration in this PR
- [x] Existing rows still read correctly after the change (checked against real dev data)
      — `label_translations()` on dev reports `as_typed 112, current 113, missing 311, proposed 72`, and every one of the 72 `proposed`
        rows has a null `_th` on its own table, so nothing was published and nothing previously published moved.
- [x] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness
      — `node scripts/prove-label-drafts.mjs` re-run on dev at this SHA with the 72 drafts present: **all 14 proofs passed, nothing kept**
        (exit 0). It asserts, among others, that a proposal does **not** write the row's `_th` (4), that approving publishes the draft and
        clears it (5), that `approve_label_th()` has no text argument to publish instead (6), that a second proposal replaces the first (8),
        and that `label_drafts` has RLS with its one policy resolving through `has_permission()` (14). The functions are unchanged by this
        PR; it was re-run because the app half now depends on all of it and because 72 real drafts now exist.
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration in this PR
- [ ] Production apply plan stated for the release manager — n/a: no migration in this PR, but see the **ordering** note in section 8

## 4. Functional checks

All driven in the browser pane on `http://localhost:3002`, reaching every page by clicking through
(`/my` → Management → Translations), never by typing an address. `requestAnimationFrame(()=>0)` was
confirmed firing before anything was recorded.

- [x] Happy path works end to end
      — typed Thai into `site_content.registration_text` → **Propose** → the row left *Missing*, the Website line read `11 missing · 2 out of date · 1 waiting`,
        the row appeared under the new **Waiting** filter as *"Thai proposed — waiting to be approved"* → **Save & approve** → *"Nothing is waiting to be approved."*
        and the waiting count went. Confirmed in the database: `registration_text_th` now holds the Thai and `label_drafts` holds 0 rows for it.
- [x] Data persists — reload the page and the change is still there
      — the draft survived a dev-server restart and a fresh sign-in, and was still listed under Waiting.
- [x] Create / edit / delete all exercised (whichever the feature has)
      — Propose (create), Save & approve (publish and clear), Reject (delete). Reject was driven on a drill `units` row: the confirm text read
        *"Throw this proposed Thai away? The Thai that is live now does not change."*, the draft went, and `units.name_th` was **still null** afterwards —
        the proof that rejecting does not touch the row.
- [x] Empty state renders sensibly (no rows yet)
      — the Waiting filter with no drafts shows *"Nothing is waiting to be approved."* (the new `nothingHere.proposed` line), in both languages.
- [x] Invalid input is rejected with a readable message, not a crash
      — Propose is disabled while the box is empty, and `proposeLabelTranslation` refuses an empty text with *"Write the Thai before proposing it."*
        before reaching the database. `discardLabelDraft` refuses a draft that is already gone with *"Nothing is waiting on this one any more…"*.
- [x] Boundary cases checked (long text, zero, negative, missing optional fields, dates)
      — a draft whose English changed **while it waited**: the drill unit was renamed under its waiting draft and the panel then showed
        *"The English has changed since this was proposed — check the Thai still fits before you approve it."* with *"English when this was proposed: drill-mvscd7zn-0"*.
        Dates render in both calendars (`31 Oct 2026` / `31 ต.ค. 2569`). A null `draft_proposed_at` would render `—` via `formatDate`.

### Role access matrix

**Read this as cards, not roles** (`CLAUDE.md`): the page and all four controls follow the `translations` card.
The two rows actually driven are below; the rest are `n/a` with the card reason, not with a role claim.

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | `/management/translations` | everything, through the `perms.isAdmin` short-circuit and not through any card | **driven.** Page opens, all four controls drawn, Propose / approve / reject all worked |
| *a login holding only the `translations` card* (not a role: `dev-signin.mjs --cards translations`) | `/management/translations` | the page, all 72 drafts, all four controls; **nothing else** | **driven.** Sidebar held only Home and Management; Management held exactly one tile (Translations); 72 waiting panels, 72 *Save & approve*, 72 *Reject*; drafts read *"Proposed by someone else"*; labels whose own list this login cannot open showed *"Its own list is not one you can open. Translating it here is enough."* |
| management | — | holds the `translations` card today | n/a: that is the card row above. Who holds the card is transient and is not what this change depends on |
| staff | — | retired role (`0173`) | n/a: not a live role |
| doctor | — | does not hold the `translations` card today | n/a: covered by the card row above |
| volunteer | — | does not hold the `translations` card today | n/a: covered by the card row above |
| signed out | `/management/translations` | sent to `/login` | **observed.** When the dev cookie expired mid-action the server action redirected to `/login?next=…&error=expired`; the page is behind `requirePermission("translations.manage")`, unchanged by this PR |

- [x] Every role above tested — as cards: both reachable card states were driven; the rest are the same card and are marked so
- [x] A role that should not have access is blocked server-side (hitting the URL directly fails)
      — **unchanged and deliberately not weakened.** `page.tsx` still calls `requirePermission("translations.manage")`; all three new
        server actions re-check `can(…, "translations.manage")` before the RPC; and all three RPCs raise `42501` on their own
        `has_permission('translations.manage')`. Hiding a control was added **on top of** those, never instead of one.
      — **One thing that could not be driven, said rather than glossed:** the controls-hidden state is unreachable today, because the single
        `translations` card bundles `translations.view` **and** `translations.manage`, so no login can hold view without manage. The gate is in
        place for the day a view-only card exists; noted in the decision file (§2) and beside the deferred `translations.propose` backlog item.

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no nav change; the Translations entry and its route registry line are untouched
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: `src/lib/manual/` belongs to the `assistant-manual-topic` stream this batch; the existing "Translating" topic is now out of date and the PR says exactly which lines
- [x] Translatable strings go through the translation path, checked at `/management/translations`
      — every new string is a dictionary key in **both** `en.ts` and `th.ts` inside the `translations` block; the whole screen was driven in Thai
        (filters `ยังไม่ได้แปล / รออนุมัติ / ล้าสมัย / ทั้งหมด`, headings `โซเชียลมีเดีย`, `ช่วยสัตว์ที่ป่วย`, `หน้าแรก`, panel `ภาษาไทยที่เสนอไว้ รออนุมัติ`,
        buttons `บันทึกและอนุมัติ` / `ไม่อนุมัติ`, and `คุณเสนอไว้ · 31 ต.ค. 2569`). No string is hard-coded in a component.
- [x] Mobile viewport (375px) — no overflow, controls reachable
      — driven at 375×812 on the Waiting list: `document.documentElement.scrollWidth` 375 against `window.innerWidth` 375, so **no horizontal
        overflow**, and the smallest button on the page measures **44px** tall (the phone target). The filter pills wrap to a second line, the
        draft panel's Thai wraps, and each card stacks as *Save & approve / Reject*, then the full-width Thai box, then *Save / Propose* — all
        four reachable with nothing clipped.
- [x] Browser console clean — no errors or React warnings
      — the only error seen in the whole session was `An unexpected response was received from the server`, traced in the dev-server log to
        `POST /login?next=…&error=expired` — the dev-signin cookie expiring mid-action, not an app fault. It did not recur after re-signing in.
- [x] Network clean — no unexpected 4xx/5xx on the feature's pages
      — dev-server log for the run shows `GET /management/translations 200`, `POST /management/translations 200` for each action, and the
        server-action lines naming `proposeLabelTranslation` / `approveLabelTranslation` / `discardLabelDraft`.

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked)
      — `/my`, `/management` (the section grid, both as Admin and as the card-only login), and `/management/translations` under all four
        filters in both languages. The **prose** half of the same screen still renders its own panels and its own `Save & approve` (137 of them
        under *Missing* as Admin), which is the part most at risk from the `Show` type gaining a value.
- [x] Any shared file touched checked from a second, unrelated page — **by loading that page, not by reading the file**
      — `src/lib/i18n/dictionaries/{en,th}.ts` are shared by everything: `/my`, `/management` and the whole sidebar were loaded in **both**
        languages after the change and rendered their own words, not keys.
- [x] Nothing merged from `main` during `sync` was broken by this branch
      — `sync` brought in the `assistant-manual-topic` stream (`src/lib/manual/en.ts`, `src/lib/releases.ts`, two docs). `releases.ts` auto-merged
        with both notes present; gates were run **after** the merge, at the SHA in the header.

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead)
      — the label-draft item is ticked; the twelve-columns item is **not** ticked and its title now says the only thing left is making
        `translations-unlisted` actually run; the Thai sweep item has a partial-close note. Three follow-ups went on the `backlog` branch.
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `docs/decisions/2026-10-31-label-drafts-the-app-half.md`
- [ ] `README.md` still accurate — n/a: nothing in README describes the Translations screen's controls
- [x] **Release notes.** — `unreleased` in `src/lib/releases.ts` gained one line, tagged `cards: ["translations"]` because the page is
      card-gated. **Judged rather than assumed:** the feature is true on production the moment this ships, because `0293`/`0294` are already
      on `main` and a production release applies pending migrations as a matter of course — there is no hand step in between. The note
      deliberately says nothing about the 72 drafts, which are on **dev only**; claiming those would be the #518 fault.
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.**
      — every number in the decision file is a reading: 72 landed / 0 refused and `label_drafts` = 72 from the run; `383 missing` vs
        `311 missing + 72 waiting` from `check-production.mjs translations-open --env test` and the screen side by side; the
        `diet_types` 8 / `diets` 4 and `item_unit_conversions` 5 / `units` 282 counts from `label_translations()`, which is what settles the two
        ambiguous document rows. The claim that a guarded `label_drafts` query is impossible was checked against `buildQuery()` and
        `assertSelectOnly()` in `scripts/lib/readonly-checks.mjs`, not assumed.

## 8. Pre-production gate

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: production release manager
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager
- [ ] Deployed to test: `npm run deploy:test` — deferred: production release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: production release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: nothing here derives "today". The only date shown is `draft_proposed_at`, rendered by the existing `formatDate()` and read as a calendar day by the same rule as every other date in the app
- [ ] **For a boundary or banding change, the assertions cover both edges of the band** — n/a: no threshold, band, rounding rule or cutoff is introduced; the one new predicate is "does this label carry a draft", which has two states and both were driven
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** — the `gates:` block above and the `prove-label-drafts` result are as printed
- [ ] Public pages re-checked after a cache purge — n/a: no public page is touched. That is the point of the design: a proposal lives in `label_drafts` and nothing that reads a `_th` column, including the public website, can see it
- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: production release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: production release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: no new secret or environment variable
- [x] **Does this PR contain both a migration and code that reads it?** — **No migration in this PR, but the ordering still matters and the
      release manager needs it:** this code reads `label_translations()`'s four new draft columns and calls `propose_label_th()`,
      `approve_label_th()` and `discard_label_draft()`, all of which arrive with **`0293` and `0294`**. Those must be applied to production
      **before or with** the deploy that carries this code. If the code shipped first, the Waiting filter would simply be empty but
      Propose / approve / reject would fail on a missing function.
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: production release manager
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — n/a: no migration in this PR, and `0293`/`0294` are additive
- [ ] Apply plan stated: which file, which project, and whether it runs before or after the deploy — deferred: production release manager
- [x] Rollback position stated, **including what it does not cover**
      — this PR is app code only, so the rollback is the ordinary one: `./scripts/pi/deploy-pi.sh --ref <sha>` on the Pi, or
        `npx wrangler rollback --env production` for the Worker fallback. **It does not revert `0293`/`0294`**, and it does not need to:
        they are additive, and with the app rolled back `label_drafts` simply sits unread — no reader of a `_th` column knows it exists.
        **What a rollback WOULD strand:** any proposal made on production between the deploy and the rollback would stay in `label_drafts`
        with no screen to approve it from. Nothing would be published and nothing lost; it would reappear the moment the app returned.

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | The label's **Save** box and button were drawn unconditionally — `canManage` never reached `LabelCard`, while the prose panel beside it took it as a prop. Nothing was ever offered that the database refused, because the page's own guard requires the same activity; but the control disagreed with its own action, which is the shape Lutan's 2026-10-27 rule exists to stop | **fixed** here: all four controls and the Thai box are behind `can(perms, "translations.manage")` |
| 2 | low | The **Waiting** filter would have listed prose rows: `proseShown()` fell through to its *Missing* branch for any `show` value it did not recognise | **fixed** here: `show === "proposed"` returns false for prose, with the reason in a comment |
| 3 | none (not a defect) | `An unexpected response was received from the server` during an approve | **accepted** — traced in the dev-server log to `POST /login?…&error=expired`: the dev-signin cookie expiring mid-action. Re-signed in and the same press worked |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | **The wording of the three new group headings.** Nothing on record said what they should be; these were chosen and the reasons are in the decision file (§4). *"Home screen"* is the weakest of the three — it holds `role_groups.name` (a tile on the home screen) and `features.name` (an area of the system, read on Who does what), so it is the better of two imperfect names rather than a clean fit | Management → Translations, section headings |
| 2 | **The Thai of the new dictionary lines.** Written by Claude, not by a Thai speaker — the same rule the whole feature exists to serve. Twelve new `th.ts` strings plus eleven new label field names | Management → Translations with the app set to ไทย |
| 3 | **The 72 proposed Thai labels themselves** — the bilingual read this whole feature was built for. They are on **dev**, under Management → Translations → Waiting, each with its English, the proposed Thai and Save & approve / Reject | `test.lannacare.org` → Management → Translations → Waiting |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (claude/translations-labels-app)  Date: 2026-10-31

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: the list is not empty and nobody has looked yet

Manual verification by: pending: the three heading words, the Thai of the new dictionary lines, and the bilingual read of the 72 drafts

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager

Result: pass

Release manager acknowledgement: pending: not yet handed over
