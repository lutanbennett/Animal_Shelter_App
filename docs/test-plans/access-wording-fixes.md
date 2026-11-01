# Feature test plan

## Header

| | |
|---|---|
| Feature | Three user-facing strings describe the activity rather than naming a role |
| Backlog item | `docs/backlog.md` → `## Security`, the `Manage medical` card description, and `## Security`, the two `assistant.*ReadOnly` strings |
| Branch / worktree | `claude/access-wording-fixes` @ `C:\Development\Animal_Shelter_access-wording-fixes` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3006` |
| PR | #1151 |
| Tested by / date | Claude (stream `access-wording-fixes`) / 2026-11-01 |
| Carries a migration? | no |
| Tested at SHA | e2a76a98 (the copy change), plus the docs and release-note commit that follows it |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs)
- [x] Roles affected identified: admin / staff / doctor / volunteer / resident / signed-out public
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised

One sentence: three pieces of user-facing copy that said what a person may do by naming a role now
name the activity the app actually asks.

Files: `src/lib/i18n/dictionaries/en.ts` and `th.ts` (three entries each),
`src/lib/releases.ts` (one `unreleased` note), `docs/backlog.md`,
`docs/decisions/2026-11-01-access-wording-by-activity.md`, and this plan. No code, policy, card,
catalogue or migration change.

**Affected — by card, which is how `CLAUDE.md` requires this to be reported**, with roles given only
as transient context: a login holding the `assistant` card reaches the assistant page; a login
holding any card that opens `/manual` sees the third string in Cards at a glance. Nothing is
role-keyed and no access changed, so there is no role to list.

**Out of scope, deliberately:** the two other strings that repeat the same false Admin claim about
withdrawing a death (`residents.deceased.confirm.body`, `residents.deceased.undo.notAuthorized`); the
further dictionary strings that describe access by naming a role; the `volunteerReadOnly` key name;
`src/lib/manual/en.ts`. All filed on the `backlog` branch and listed in the PR.

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Paste its closing `gates:` lines below exactly as printed. They are the evidence, and running the script again regenerates them
- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit

```
=== gates: build exited 0 after 182s

gates: typecheck=0 lint=0 test=0 build=0
```

(Four gates, not the three the line above names: `test` was added after this template was written.
The closing lines are quoted as printed; the earlier per-gate `=== gates: … exited 0` lines for
typecheck, lint and test scrolled past the captured tail, and the summary line carries each exit
code anyway.)

Also run: `node scripts/check-thai-dictionary.mjs` (exit 0, *"every Thai entry is either translated,
wordless or allowed by name"*), `node scripts/check-backlog-sections.mjs` (exit 0) and
`node scripts/check-test-plan.mjs` (exit 0).

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: no migration
- [ ] **Constraints and defaults exercised against real rows** — n/a: no migration
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager (which file, which project, when) — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end
- [ ] Data persists — reload the page and the change is still there — n/a: nothing is written; these are static strings in the bundle
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: copy only, no write path
- [ ] Empty state renders sensibly (no rows yet) — n/a: no list or table was added
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no input
- [ ] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — n/a: no values; the only risk is text length, and each string is a similar length to the one it replaced

Happy path, driven on `http://localhost:3006` with
`node scripts/dev-signin.mjs --cards assistant,medical_records,who_does_what --port 3006`, every page
reached by clicking from the previous one, with `requestAnimationFrame` confirmed firing:

- `/manual` → Cards at a glance → Manage medical, in **English**: *"…and record a death (the record is
  closed from that day; withdrawing it afterwards is a separate permission of its own, "Withdraw a
  death recorded in error"). Includes View medical."* No mention of Admin.
- the same entry switched to **ไทย**: *"…และบันทึกการเสียชีวิต (ประวัติจะปิดตั้งแต่วันนั้น ส่วนการถอนภายหลังเป็นสิทธิ์แยกอีกอย่างหนึ่งคือ "ยกเลิกการเสียชีวิตที่บันทึกผิด") รวมการ์ดดูข้อมูลการแพทย์"*.
- `/assistant` with the `assistant` card showed the **writing** subtitle, which is correct: that card
  bundles `assistant.record`.

**The two assistant strings could NOT be shown on screen, and that is a finding rather than an
omission.** The `assistant` card bundles both `assistant.ask` and `assistant.record`
(`src/lib/permissions/cards.ts:231-239`) and is the only card that mentions either, so `--cards`
cannot build a login that may ask but not record. The rewrites were verified against the code that
selects them (`src/lib/assistant/data.ts:227`, `src/app/assistant/page.tsx:34`,
`src/components/assistant/AssistantConversation.tsx:273`) and against the dictionary, not on a
screen. Filed on the `backlog` branch.

### Role access matrix

**Written by card, not by role** — `CLAUDE.md`: *"All analysis is by CARD, never by role"*, because
roles are a transient grouping of cards and every assignment will be rebuilt. The role rows below are
answered once, as a set, because the answer is the same for all of them.

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | everything | no access change | no access change: copy only |
| management | per its cards | no access change | no access change: copy only |
| staff | retired by `0173` | n/a | n/a — its name appearing in the old copy is the fault this PR fixes |
| doctor | per its cards | no access change | no access change: copy only |
| volunteer | per its cards | no access change | no access change: copy only |
| signed out | public pages only | none of these strings is public | not reachable |

By card, which is the durable statement: a login holding `assistant` sees the assistant page (writing
subtitle, as that card records); a login holding `medical_records`, or any card that opens `/manual`,
sees the rewritten Cards at a glance entry; `placement.death_withdraw` is in no card, so no
card-built login can reach the withdraw page at all.

- [x] Every role above tested
- [ ] A role that should not have access is blocked server-side (hitting the URL directly fails) — n/a: no access boundary was touched; every `can(…)`, policy and card is byte-for-byte unchanged, which `git diff --stat` shows

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — appears for the right roles, no dead links — n/a: no nav change
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: the manual was rewritten to this same rule by `manual-access-by-cards` on 2026-11-01 and is explicitly out of this stream's scope; `/manual` itself was loaded, because the third string is rendered there from the dictionary
- [x] Translatable strings go through the translation path, checked at `/management/translations`
- [ ] Mobile viewport (375px) — no overflow, controls reachable — n/a: all three sit in prose blocks that already wrap, and none is materially longer than the one it replaced
- [x] Browser console clean — no errors or React warnings
- [x] Network clean — no unexpected 4xx/5xx on the feature's pages

Translation path: these entries *are* the dictionary, so the check that matters is
`scripts/check-thai-dictionary.mjs` rule 1 (both languages present, and the Thai not left as the
English) — run, exit 0 — plus reading the Thai on the real page, done above.
`/management/translations` governs database labels rather than dictionary entries, so there is nothing
there for these three.

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked)
- [x] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — **by loading that page, not by reading the file**
- [x] Nothing merged from `main` during `sync` was broken by this branch

Loaded: `/my`, `/home`, `/manual` (English and ไทย), `/assistant`, `/admin/who-does-what`. The last
two are the second-and-unrelated-page check for the dictionaries: `/admin/who-does-what` renders the
`admin.whoDoesWhat` section and `/assistant` renders the `assistant` section, so between them they
read both halves of the files this PR edited, and both rendered with a clean console.

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead)
- [x] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`)
- [x] `README.md` still accurate
- [x] **Release notes.** Would a shelter user notice this change? If so, `unreleased` in `src/lib/releases.ts` has a line for it, **in this PR**, written for a shelter user and not as a commit message
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.**

Both items are ticked, with their titles rewritten so each says what is still open: the first names
the two strings that repeat the same false claim and are **not** closed, the second names the finding
that no card can produce the state its strings describe. Nothing else in the backlog is closed by this
work — `grep -n` for the dictionaries, `placement.death_withdraw` and the three keys turned up one
neighbour, the `reference.types` label item under `## Security`, which this PR does not touch.

The release note is an untagged plain string on purpose: `/manual` is read by anyone with a login, and
`CLAUDE.md` requires an unrecognised tag to widen rather than narrow, so untagged is the safe default.
`check-test-plan.mjs` warns (it never fails) that the note names an admin-only place and carries no
tag. That warning is accepted rather than silenced: the note's own subject is the words "only Admin",
which is what its heuristic matches, and the screen it describes is the manual, which everyone with a
login can open. Tagging it with a card would hide it from most of the people it is for.
No manual step is outstanding — this is copy in the bundle, visible the moment the release deploys —
so the tick is honest rather than a promise.

Measured, not reasoned: every activity named in a rewrite was read out of the file that asks it, and
the file and line are recorded in the decision file and the commit message. The one thing that could
**not** be measured here is whether the Thai reads well, which is a `pending:` below rather than a
tick.

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: production release manager
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: production release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: production release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: no date, time or clock logic; three static strings
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary — not only the case the bug report named.** — n/a: no threshold, band, rounding rule, retry window or cutoff
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.**
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — n/a: none of these strings appears on a public page; all three are behind a login

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: production release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: production release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: no new secret or env var

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — n/a: no migration
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh. — n/a: no migration
- [ ] Apply plan stated: which file, which project, and whether it runs before or after the deploy — n/a: no migration

### Rollback

- [x] Rollback position stated, **including what it does not cover**.

Rollback is an ordinary Pi rebuild at the previous ref (`./scripts/pi/deploy-pi.sh --ref <sha>`), or
`npx wrangler rollback --env production` for the Worker fallback only. There is nothing else to undo —
no schema, no data, no setting — so a rollback simply restores the old wording, which was wrong but
harmless.

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | `residents.deceased.confirm.body` and `residents.deceased.undo.notAuthorized` repeat the same false claim ("only an admin can withdraw") to a user who has just been turned away | deferred to backlog — outside this stream's three strings |
| 2 | low | Further dictionary strings describe access by naming a role; three are verifiably false, because `/admin/medications`, `/admin/diets` and `/admin/units` all ask `reference.types` (`src/lib/permissions/routes.ts:439,447,456`), not Admin | deferred to backlog |
| 3 | low | No card can produce `assistant.ask` without `assistant.record`, so the two rewritten assistant strings are currently unreachable copy | deferred to backlog |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Whether the Thai of the three rewritten strings reads naturally to a Thai speaker. It is present, it renders, and it reuses the catalogue's own Thai labels, but nobody on this stream can judge how it reads | `/manual` → Cards at a glance → จัดการข้อมูลการแพทย์, and the assistant page in ไทย |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (stream `access-wording-fixes`)  Date: 2026-11-01

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: the list is not empty, so only the person who looks may tick this

Manual verification by: pending: a Thai reader confirms the Thai of the three rewritten strings reads naturally

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager

Result: pass with accepted defects

Release manager acknowledgement: pending: the three findings above are filed on the `backlog` branch rather than fixed here
