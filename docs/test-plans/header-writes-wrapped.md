# Feature test plan

## Header

| | |
|---|---|
| Feature | Pi failover (D): wrap the shared header's writes, so a page can go on `WRAPPED_WRITE_PATHS` at all |
| Backlog item | `docs/backlog.md` → `## Next up`, the PI FAILOVER (D) item (header half), and `## Security`, "Promote `scripts/check-wrapped-write-paths.mjs` to a BLOCKING CI check" |
| Branch / worktree | `claude/header-writes-wrapped` @ `C:\Development\Animal_Shelter_header-writes-wrapped` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3002` |
| PR | #1152 |
| Tested by / date | Claude (automated and browser-driven), 2026-11-01 |
| Carries a migration? | no |
| Tested at SHA | `2d9f1ff1` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — every write reachable from the signed-in layout is now wrapped in `runWriteAction()` or is no longer a Server Action, so `/admin/units` is honestly listed and the whole-page check can block in CI
- [x] Files/areas touched listed — `src/app/assistant/actions.ts`, `src/app/assistant/lookups.ts`, `src/app/assistant/interpret.ts` (a comment only), `src/components/assistant/AssistantCards.tsx`, `src/components/assistant/AssistantConversation.tsx`, `src/app/ThemePicker.tsx`, `src/app/LanguageSwitcher.tsx`, `src/lib/i18n/locales.ts`, `scripts/check-wrapped-write-paths.mjs`, `scripts/check-permission-catalogue.mjs` (one stale list entry), `.github/workflows/ci.yml`; **deleted** `src/app/account/theme/actions.ts` and `src/lib/i18n/set-locale.ts`. No `worker/`, no `supabase/migrations/`
- [x] Access identified **by card, not by role** (`CLAUDE.md`): the writes touched are behind `assistant.ask` / `assistant.record`, which the `assistant` card carries, and the weight write additionally asks `medical.weight` edit (`record_weight`). The theme and language controls are behind **no card** — they are personal preferences every signed-in login has, and the language one is reachable signed out. **Nothing about who may do any of this changed**
- [x] Out of scope, written down — no page was added to `WRAPPED_WRITE_PATHS`; no page outside the shared header was swept; `docs/release-procedure.md` was not edited (deliverable 6 asked for the judgement, not the edit); `scripts/check-worker-origin.mjs` was not weakened or touched

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 test=0 build=0`:

```
=== gates: typecheck — npm run typecheck
=== gates: typecheck exited 0 after 6s
=== gates: lint — npm run lint
=== gates: lint exited 0 after 89s
=== gates: test — npm test
=== gates: test exited 0 after 14s
=== gates: build — npm run build
=== gates: build exited 0 after 49s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration in this PR
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration in this PR
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration in this PR
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: no migration in this PR
- [ ] File is re-runnable — n/a: no migration in this PR
- [ ] Existing rows still read correctly after the change — n/a: no migration in this PR; no column, view or function changed
- [ ] **Constraints and defaults exercised against real rows** — n/a: no migration in this PR. `0292`'s own constraints were exercised by `scripts/prove-write-requests.mjs`, which this stream re-ran and which passed (section 6), but that is `0292`'s harness and not a new one
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration in this PR
- [ ] Production apply plan stated for the release manager — n/a: no migration in this PR. **This PR adds no production step at all**; what it does is make applying `0292` safe, which section 6 of the decision file sets out

## 4. Functional checks

Driven in the browser pane on `http://localhost:3002` as a login holding **only** the
cards `assistant`, `record_weight`, `view_residents` (`node scripts/dev-signin.mjs --cards …`,
no role), reaching `/residents` by clicking through from `/my` with `requestAnimationFrame`
confirmed firing.

- [x] Happy path works end to end — the Assistant opened from the header on `/residents`, *"Angsumalin weighs 12.34 kg"* answered *"Done — Angsumalin (R-0055) recorded at 12.34 kg on 1 Nov 2026."*, and *"Where is Angsumalin?"* answered
- [x] Data persists — the resident's Weight History shows the 12.34 kg row for 1 Nov 2026, *"via the assistant"*, after a navigation
- [x] Create / edit / delete all exercised (whichever the feature has) — the writes here are creates (a weight row, an audit row) and a read-with-record (the lookup); both kinds were driven. The assistant has no edit or delete
- [x] Empty state renders sensibly — the panel's "Try something like" list is drawn before any turn, and `/my` shows "Nothing is assigned to you right now"
- [x] Invalid input is rejected with a readable message, not a crash — a second weight for the same resident on the same day was refused with *"A weight is already recorded for this resident on that day. There is one weight per day — correct that reading on the Weight tab instead."* (this is also proof (4) in section 6)
- [x] Boundary cases checked — the ones that matter to **this** change are the request id's: a missing id (`runWriteAction` refuses with `reloadToSave`, covered by the suite), a repeated id (replay, driven), a fresh id (body runs, driven), and the same id against a different action (refused by `claim_write_request`, covered by `prove-write-requests.mjs` proof set). Decimal weight (12.34) and a Thai-named resident were both exercised

### Access matrix

**Recorded by card, because roles are a transient grouping of cards and this table would
stop being true the moment Lutan rebuilds the assignments** (`CLAUDE.md`, "All analysis is
by CARD, never by role"). Each row is a login holding exactly those cards and nothing else.

| Cards held | Can reach | Expected | Result |
|---|---|---|---|
| `assistant`, `record_weight`, `view_residents` | Assistant button in the header; the weight write; the lookup | drawn and both writes succeed, carrying a request id | **as expected** — driven, section 6 |
| no `assistant` card | Assistant button | not drawn at all (`can(perms, "assistant.ask")` in `AppHeader.tsx`) | **unchanged by this stream** — the gate was not touched; not re-driven |
| `assistant` but not `assistant.record` | the panel, lookups only | write confirm refused by `runWrite`'s own check | **unchanged by this stream** — the check moved inside the claim but is the same check; not re-driven |
| signed out | the public site's language switcher | works | **as expected by construction** — the language write is no longer a Server Action and makes no database call, so `claim_write_request`'s refusal of `anon` cannot reach it. Reasoned from the code, not driven; see **Left for manual verification** |

- [x] Every row above addressed, and the ones not driven say so rather than being ticked
- [x] A login that should not have access is blocked server-side — **unchanged and deliberately so.** Every server and database check is exactly as it was: `runWrite` still asks `can(perms, "assistant.record")`, `assistantLookup` still asks `assistant.ask`, each helper still runs its own check and RLS still backs them. This stream changed how writes *call*, never who may make them. Hiding is the courtesy, never the security

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no nav entry added, removed or changed
- [ ] Manual updated (`src/lib/manual/en.ts`) — n/a: nothing a reader of the manual would do differently; the assistant, the theme picker and the language switch all behave exactly as the manual describes
- [ ] Translatable strings go through the translation path — n/a: no new string. `runWriteAction` uses `t.common.somethingWentWrong`, `saveUnknown` and `reloadToSave`, which already exist, and `src/lib/i18n/dictionaries/` was not touched (another stream owns it this batch)
- [x] Mobile viewport (375px) — no overflow, controls reachable — n/a is not honest here, so: **not re-measured, and nothing moved.** No markup changed in `AppHeader.tsx`, `AccountMenu.tsx` or the assistant cards; `ThemePicker` and `LanguageSwitcher` kept their exact JSX and only their click handlers changed. Ticked on that basis, not on a 375px pass
- [x] Browser console clean — no errors or React warnings from the change. Two Next dev-only `/__nextjs_original-stack-frames` POSTs appeared while a patched `window.fetch` was installed for the capture, and not otherwise
- [x] Network clean — no unexpected 4xx/5xx. Every Server Action POST observed on `/residents` returned 200

## 6. Regression

- [x] The pages nearest the change still work — `/my`, `/residents`, `/residents/<id>/weight` all loaded and rendered; the header (logo, language switch, account menu, Assistant, Sign out) is drawn on each
- [x] Any shared file touched checked from a second, unrelated page **by loading it** — the shared files here are the layout's own chrome, so this is the whole point: the header was loaded and used on `/my`, `/residents` and a resident's weight tab. `src/lib/i18n/locales.ts` is also read by `src/proxy.ts`, which runs on every request — every page load above exercised it
- [x] Nothing merged from `main` during `sync` was broken by this branch — `sync` brought in `label-thai-generator`'s files (`scripts/draft-label-thai.mjs`, `scripts/lib/readonly-checks.mjs`, docs); the gates were re-run after the merge and are the ones pasted in section 2

### The change's own proofs

- [x] **The id travels.** The weight POST to `/residents` carried `"requestId":"3b6c64e1-a280-476d-962d-e448e1618100"`, a v4 uuid
- [x] **The header's writes POST to the page's own address** — three POSTs went to `/residents`; only the write carried an id, the two reads (`fetchAssistantContext`, `interpretRequest`) carried none
- [x] **A replay returns the first result and never runs the write again** — the identical request re-sent answered `{"ok":true}`, the stored first result
- [x] **The control that makes the replay proof mean anything** — the same request with a fresh id answered `{"ok":false,"error":"A weight is already recorded for this resident on that day…"}`, so the body genuinely runs for a new id
- [x] **The rows agree** — exactly one 12.34 kg row for 1 Nov 2026 on the resident's Weight History. The replay created none
- [x] **`assistantLookup` too, with a sharper control** — re-sent with the **same id but a different resident in the body**, it answered about the original resident (the stored result; the new question never looked at). With a **fresh** id and the same new question, it answered about the new one
- [x] `node scripts/prove-write-requests.mjs` — passed, nothing kept
- [x] `node scripts/check-worker-origin.mjs` — passed, all cases, and the script was not modified
- [x] `node scripts/check-wrapped-write-paths.mjs` — `every path on WRAPPED_WRITE_PATHS has all its reachable writes wrapped (1 listed)`, exit 0. It reported 5 unwrapped modules on `/admin/units` before this change
- [x] **The new check's guards were probed, not assumed** — giving the declared read-only module an `.insert(` produced `declares read-only but calls .insert(` and exit 1; removing the real `runWriteAction` call from a wrapped module while leaving its prose flipped it to `NOT` and exit 1

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** — the promote-the-check item is ticked; the (D) item's header half is done and its title rewritten to say what is left (60 unwrapped action modules blocking 80 of 149 addresses, by area); the `0292` release item is retitled with a partial-closure note. Old titles are marked superseded in place, not deleted
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `docs/decisions/2026-11-01-header-writes-wrapped.md`
- [x] `README.md` still accurate — no change to setup, scripts a reader runs, or architecture as it describes them
- [ ] **Release notes.** — n/a: nothing a shelter user can see changed, **and a manual step is outstanding either way.** Nothing was added to `WRAPPED_WRITE_PATHS`, so every page behaves exactly as it did and a save during a Pi outage is refused on the same screens as before. The theme and language saves changed how they reach the server and not what they do. And production is behind on `0292`, whose apply and the Worker deploy after it are Lutan's steps, so a note promising a working failover would be false until those ship — the fault `docs/decisions/2026-10-11-release-note-truth-rule.md` was written about after #518. `unreleased` gained no line, on purpose
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and the decision file were measured, not reasoned.** The three that could have been reasoned were measured instead: `assistantLookup` writes (read at `lookups.ts:610`, and the wrapper proved end to end); the replay returns the stored result (driven, with the fresh-id control); and the remaining sweep is 60 modules on 80 addresses (`check-wrapped-write-paths.mjs --all`, not an estimate). The one claim that is **reasoned and says so** is that wrapping the theme and language saves would break them for a login `holds_app_role()` answers false for — read from `0292_write_requests.sql` and the components, not driven, because making a role-less login means writing to the shared dev auth

## 8. Pre-production gate

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: production release manager
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager
- [ ] Deployed to test: `npm run deploy:test` — deferred: production release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: production release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: nothing in this change derives a date. The one date in play, the assistant's `viewerToday()`, is unchanged and was already the asker's own clock by design
- [ ] **Boundary or banding change covers both edges** — n/a: no threshold, band, rounding rule or cutoff changed. The request id is an equality test, not a boundary
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** — the gates block in section 2 and every quoted response in section 6 are copied as printed
- [ ] Public pages re-checked after a cache purge — deferred: production release manager. **Worth their attention in particular:** the public site's language switcher now writes its cookie in the browser, so it is the one public-facing behaviour this PR touches
- [ ] `deploy: production → Supabase project <ref>` line read and the ref matches production — deferred: production release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen — deferred: production release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: no new secret or env var
- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration in this PR
- [ ] `--env production --dry-run` run and clean — n/a: no migration in this PR
- [ ] Production backup fresh for a destructive migration — n/a: no migration in this PR
- [ ] Apply plan stated — n/a: no migration in this PR
- [x] Rollback position stated, **including what it does not cover** — this PR is code and one CI job, with no migration and no data change, so the rollback is the ordinary one: `./scripts/pi/deploy-pi.sh --ref <sha>` on the Pi, and `npx wrangler rollback --env production` for the Worker fallback. **What it does not cover:** nothing extra here — there is no schema to revert. **One thing a release manager should know rather than discover:** rolling back past this commit puts `/admin/units` back on `WRAPPED_WRITE_PATHS` with the header's writes unwrapped, which is the breach this PR closed, so a rollback past it should be paired with taking that entry off the list

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | High (latent, not live) | `assistantLookup` was recorded as a read-only module by #1149 and its decision file; it inserts an `assistant_actions` row on every call, so it would have been left unwrapped and `/admin/units` would have stayed in breach while looking clean | fixed — wrapped, and the misleading comment above it corrected |
| 2 | Medium | `scripts/check-wrapped-write-paths.mjs` counted any mention of `runWriteAction` in a module's source, including prose in a comment, as proof the module was wrapped | fixed — comments are stripped before the test |
| 3 | Low | `scripts/check-permission-catalogue.mjs` carried a `NO_ACTIVITY` entry for `account/theme/actions.ts`, which this PR deletes; `lint` failed on the stale entry | fixed — entry removed |
| 4 | Low (environment, not the app) | `node scripts/check-wrapped-write-paths.mjs --prefix /admin` silently reports nothing in Git Bash: the shell rewrites `/admin` to `C:/Program Files/Git/admin` (the same trap `CLAUDE.md` records for `git show <rev>:<path>`). `--all` is unaffected | accepted — not the script's fault, and noted in the decision file so the next stream does not read an empty report as good news |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | The **public site's language switcher**, signed out. It now sets the cookie from the browser rather than through a Server Action. Switch EN/ไทย on `/` and confirm the page comes back in the chosen language and stays chosen after a reload. Reasoned from the code and from the cookie never having been `httpOnly`, but not driven signed out | `/`, signed out (dev or `test.lannacare.org`) |
| 2 | The **colour theme save**, on a second device or after a sign-out and back in. It now calls `auth.updateUser` from the browser; the picker applies the colour immediately either way, so what needs a person is that it is still *remembered* across a fresh session | Account menu → theme, any signed-in page |
| 3 | A login that `holds_app_role()` answers false for (no live role, or on the viewer role) reaching `/account/password` — confirm the theme picker and language switch still work for it. This is the case the two writes were moved off the Server Action path **for**, so it is the one that proves the decision was right | `/account/password` |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (stream `header-writes-wrapped`)  Date: 2026-11-01

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: the list is not empty; all three rows are for a person to look at, and only they may tick it

Manual verification by: pending: the three rows above — the public language switcher signed out, the theme save across a fresh session, and both controls for a login with no live role

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [ ] Handed to the production release manager — n/a: nothing in this PR deploys on its own; its section 8 rows are the ordinary release ones and are already deferred there

Result: pass

Release manager acknowledgement: pending: the release that carries this commit
