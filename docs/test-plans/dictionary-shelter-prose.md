# Feature test plan — dictionary-shelter-prose

## Header

| | |
|---|---|
| Feature | The two dictionaries name the shelter through `{shelter}` / `{shelterShort}` placeholders, filled where each dictionary is assembled |
| Backlog item | `docs/backlog.md` → `#b4cmn` (Part 8 of 13), ticked |
| Branch / worktree | `claude/dictionary-shelter-prose` @ `C:\Development\Animal_Shelter_dictionary-shelter-prose` |
| Dev server | `http://localhost:3005` |
| PR | see the PR that carries this file |
| Tested by / date | Claude / 2026-11-18 |
| Carries a migration? | no |
| Tested at SHA | 3a709b6b8 |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — the dictionaries' prose reads the shelter's name from a placeholder, with Lanna's text unchanged
- [x] Files/areas touched listed — `src/lib/i18n/shelter-prose.ts` (new), `I18nProvider.tsx`, `get-t.ts`, `app/layout.tsx`, `dictionaries/en.ts` + `th.ts` (49 lines), `admin/website/pages/[slug]/page.tsx`, `SitePagePreview.tsx`, registry, decision, backlog tick
- [ ] Cards affected identified — n/a: no access rule is read or changed; this is copy only, for every login and the signed-out public alike
- [x] Anything explicitly **out of scope** written down — the calendar notice and Worker relay (slice 3), the authenticator issuer, the `@lannacare` example, the Thai-script name ลานนาแคร์ (no setting to fill from), any rename

## 2. Automated gates

- [ ] `node scripts/worktree.mjs sync` — n/a: `origin/main` had no commits beyond this branch at the time (`git rev-list --count HEAD..origin/main` = 0)
- [x] `node scripts/gates.mjs` ends with the line pasted below, read from the file the run wrote:

```
=== gates: typecheck exited 0 after 96s
=== gates: lint exited 0 after 226s
=== gates: test exited 0 after 48s
=== gates: build exited 0 after 200s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `--status` reviewed — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration, and the columns read (`0400`) already exist
- [ ] Constraints and defaults exercised — n/a: no migration
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end — `/privacy` on the running dev server shows "Lanna Care for Animals Foundation runs this website…" in English and "มูลนิธิ Lanna Care for Animals เป็นผู้ดูแลเว็บไซต์นี้…" in Thai, no `{shelter` anywhere on the page
- [ ] Data persists — n/a: nothing is written
- [ ] Create / edit / delete all exercised — n/a: nothing is written
- [ ] Empty state renders sensibly — n/a: no list; a shelter with no stored name falls back to the Lanna literal (`shelterNames()`), asserted in `shelter-prose.test.mjs`
- [ ] Invalid input is rejected — n/a: no input
- [x] Boundary cases checked — a second shelter's name (`Soi Dog Haven`) fills every placeholder in both languages and function entries; no placeholder survives; the strings that stay literal stay literal

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a | n/a — no access rule touched | n/a |
| signed out | `/privacy`, `/th/privacy` | the copy, with the shelter's name | read as expected (see above) |

- [ ] Every login above tested — n/a: copy only; no card, page rule or grant is read or changed
- [ ] A login that should not have access is blocked server-side — n/a: no access rule changed

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change
- [ ] Manual updated — n/a: nothing a shelter user would do differently
- [ ] Translatable strings go through the translation path — n/a: these are dictionary strings, not translated site content
- [ ] Mobile viewport (375px) — n/a: only the characters inside existing sentences changed, and not for Lanna
- [ ] Browser console clean — n/a: the one error seen in the browser pane was my own layout edit (`names is not defined`), found by loading the page and fixed before the gates run; no console sweep beyond that
- [ ] Network clean — n/a: no new requests

## 6. Regression

- [x] The pages nearest the change still work — `/privacy` and `/th/privacy` loaded after the fix; the 810 tests pass
- [ ] Any shared file touched checked from a second, unrelated page — n/a: the shared file is the dictionary provider; every page reads it, and the 810 tests and the build compile every reader
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing was merged: `main` had not moved

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch — `#b4cmn`. Searched `shelterNames`, `dictionaries`, `i18n` in the backlog: `#el9zw` is made no more or less necessary (function entries are wrapped in the process that uses them and never cross a boundary); `#y1dqu` is the open Thai read
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-11-18-dictionary-shelter-prose-placeholders.md`
- [ ] `README.md` still accurate — n/a: it does not describe the dictionaries
- [ ] **Release notes.** — n/a: Lanna's output is byte-for-byte unchanged; nothing a shelter user would notice
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned** — the claim that Lanna's text is unchanged was measured by comparing every string and function result against the previous files: 6373 strings and 1161 functions per language, identical

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: nothing derives a date
- [ ] **Boundary or banding change** — n/a: no threshold or cutoff
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited** — deferred: release manager, for the deploy output; the gates output above is unedited
- [ ] Public pages re-checked after a cache purge — deferred: release manager

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none

### Migration ordering — *skip if no migration*

- [ ] Both a migration and code that reads it? — n/a: no migration
- [ ] `--env production --dry-run` — n/a: no migration
- [ ] Destructive migration backup — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [ ] Rollback position stated — deferred: release manager (a plain code change; the Pi `--ref` rebuild reverts it, no schema involved)

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | medium | First pass edited `layout.tsx` and `I18nProvider.tsx` with a script that silently missed on CRLF lines: the first gates run failed typecheck and the page 500ed in the browser | fixed — both edited again and the gates re-run |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | A Thai speaker reads the converted Thai sentences (the name sits where the English sentence had it; no word order was rewritten) | `th.ts` (23 lines, e.g. `/th/privacy`) |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-18

### Manual verification

Manual verification by: pending: a Thai speaker has not read the converted sentences (#y1dqu)

Result: pass
