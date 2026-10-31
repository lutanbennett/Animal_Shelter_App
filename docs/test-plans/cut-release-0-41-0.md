# Feature test plan — cut release `0.41.0`

## Header

| | |
|---|---|
| Feature | Cut release `0.41.0`: add the one note this release owes, move the nine `unreleased` notes into a new entry, empty `unreleased`, bump `package.json` |
| Backlog item | `docs/backlog.md` → n/a: a release cut is a step in `docs/release-procedure.md`, not a backlog item |
| Branch / worktree | `claude/cut-release-0-41-0` @ `C:\Development\Animal_Shelter_cut-release-0-41-0`, a fresh worktree |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3007` |
| PR | opened from this branch |
| Tested by / date | Claude Opus 5 (production release manager session) / 2026-10-31 |
| Carries a migration? | **no**: this PR is `src/lib/releases.ts`, `package.json` and this plan. The release it cuts carries **seven**, `0289` to `0295`, which belong to their own PRs' plans and are not signed here |
| Tested at SHA | the cut commit on this branch, whose parent is `8d839bf2` (`origin/main` at the cut) |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what was asked for: Lutan asked for a release and answered **yes, email it**, so `0.41.0` with `major: true`. The question was put as *should this release email you?*, never as major or minor, and it named what the email would contain and that it cannot be unsent once the production deploy runs
- [x] Files/areas touched listed: `src/lib/releases.ts` (data only), `package.json` (version), this plan. No route, no component, no `worker/`, no migration
- [x] Roles affected identified: four of the nine notes are tagged by **card** (`translations` ×2, `assistant` ×3 — one of those three is the manual topic note, `website` ×1); the rest are plain strings, and an untagged line is never filtered out. No note uses the closed `roles:` form. Admin sees every line. **Nobody's access changes in this PR**
- [x] Anything explicitly **out of scope** written down: the seven migrations are the release manager's apply step; the **fourteen** `pending:` plans in the release are Lutan's, and he chose in chat to ship with them listed open. The `@anthropic-ai/sdk` dependency is his decision too — see Defects, item 2

## 2. Automated gates

- [ ] `node scripts/worktree.mjs sync` — n/a: the worktree was created from `origin/main` at `8d839bf2` minutes before the cut, and `git rev-parse origin/main` equalled the branch parent at the cut
- [x] `node scripts/gates.mjs` ends `typecheck=0 lint=0 test=0 build=0`. Its closing lines, exactly as printed:

```
=== gates: typecheck exited 0 after 46s
=== gates: lint exited 0 after 96s
=== gates: test exited 0 after 15s
=== gates: build exited 0 after 135s
gates: typecheck=0 lint=0 test=0 build=0
```

  Status read from the command itself, not through a pipe. **All four numbers read**, not three.

- [ ] CI green on the PR (runs the same checks) — n/a: not yet, the PR does not exist at this commit
- [x] `node scripts/check-release-guards.mjs`: exit **0**, **16** `ok` lines, exit code read from the command
- [x] **The cut was verified mechanically rather than read over, against a base that is `origin/main` plus exactly the one added note.** Plain `--verify` against `origin/main` fails two assertions (`every note carried across` and `nothing invented [9 vs 8]`) **because of that one note and nothing else**, which is the honest result: it is new in this PR. So the base was built mechanically — `origin/main`'s `releases.ts` with the one line inserted into `unreleased` by the same transformation — and `diff` against `origin/main` shows exactly that one added line and nothing more. Unedited output of `node scripts/cut-release.mjs 0.41.0 2026-10-31 major --verify --base <that file>`:

```
ok   new entry is the newest and has the requested version  [0.41.0]
ok   new entry has the requested date  [2026-10-31]
ok   new entry's major flag matches  [true]
ok   new entry has a title
ok   version is newer than the previous release  [0.40.12 -> 0.41.0]
ok   unreleased is empty after the cut  [0]
ok   base unreleased was not empty
ok   every note carried across character-identical, with its role tags, same order
ok   nothing invented (note count equal)  [9 vs 9]
ok   every earlier entry present and unchanged
ok   releases are in compareVersions order, newest first
ok   latestRelease is the new entry
ok   package.json version equals the newest entry  [0.41.0]
ok   no [object Object] or undefined in the entry
ok   mail PRESENCE: majorReleasesSince(previous) is exactly the new version  [["0.41.0"]]
ok   control: from further back, an older major release is still found  [0.40.0 in ["0.41.0","0.40.0"]]

all 16 assertions passed
```

- [x] **The mail decision is asserted in both directions**: this is a **mailing** release, so the presence assertion is the live one — `majorReleasesSince("0.40.12")` is exactly `["0.41.0"]` — and the control from further back still finds `0.40.0`. An always-empty function would fail the first; an always-returning one would be caught by the previous ten releases' absence assertions
- [x] **`npm ci` WAS re-run in the main checkout, and it was necessary.** `git diff 7ec19061..origin/main -- package.json package-lock.json` is **not** empty: `@anthropic-ai/sdk@^1.3.0` was added as a production dependency by `a908120e` (#1114), and `scripts/check-llm-vendor-imports.mjs` was added to the `lint` script. This is exactly the asymmetry `docs/release-procedure.md` §1 was written about after `0.28.0`. After `npm ci`, `package.json` says `next` `16.4.2` and the installed `next` reports `16.4.2`
- [x] **`npm run audit:prod` exits 1 with the familiar `glob` advisories**, and **`npm run audit:register` exits 0**: `audit-register: 1 high/critical advisory, all registered and still unreachable.` (`GHSA-5j98-mcp5-4vw2`). Since #1055 the register is the gate, and the CI `audit` job **runs for real on this PR** rather than skipping, because the PR changes `package.json` — the condition `check-docs-only.mjs` writes as `deps-changed=`. Nothing new in the advisory list
- [x] **All 21 deferred-note candidates were reviewed and the judgement is in the cut commit** (`cut-release.mjs --deferred-reviewed`). **One is owed a note by this release and one note was added**: the Pi failover write wrapper, whose step `docs/decisions/2026-10-31-write-request-wrapper.md` §6 names as "whichever release applies `0292` to production" — this one. The note was **narrowed to Settings → Units**, the single path on `WRAPPED_WRITE_PATHS`, because stream (D) (the other 56 call sites) is explicitly out of scope and a shelter-wide claim would be false. Four more candidates are closed by notes already in `unreleased` from their own PRs (translations labels, the Shop hide switch, the public-page frame, the assistant log). Three were closed by `0.40.12` (`0283`–`0285`). The rest stay open, each with its reason, and the two record-a-death plans stay withheld on **Manage medical being assigned**, which no migration here does

### The ordering boundary

- [x] `0.41.0` sits above `0.40.12` under `compareVersions`, asserted by `--verify`. **And on the rendered page**: on this cut, signed in as Admin via `scripts/dev-signin.mjs` and reached **by clicking the sidebar's Release notes link** (not by typing the address — `docs/decisions/2026-10-28-website-contact-tab-not-an-app-fault.md`), `requestAnimationFrame` **fires**, so the page was hydrated when read. The first six version strings in document order are `0.41.0, 0.40.12, 0.40.11, 0.40.10, 0.40.9, 0.40.8`; the entry heads with `0.41.0 · Thai labels wait for approval, a wider website, and more from the assistant`, `31 Oct 2026`, and a **Major** badge; the added Settings → Units note is present character-identical; and `[object Object]` and `undefined` appear nowhere in the page text

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: this PR carries no migration. `0289` to `0295` are on `main`; the next free number is `0296`
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: this PR carries no migration. The release's: production **`289 applied, 7 pending`**, the seven being exactly `0289`–`0295`, with `0` applied rows having no file on `origin/main`
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: this PR carries no migration. The release's dry-run belongs to the release manager's apply step and is recorded in the release record
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: this PR carries no migration. Dev reads **`296 applied, 0 pending`**, applied by their own PRs
- [ ] File is re-runnable — n/a: this PR carries no migration
- [ ] Existing rows still read correctly after the change — n/a: this PR carries no migration; `releases.ts` is plain data
- [ ] **Constraints and defaults exercised against real rows** — n/a: this PR carries no migration
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: reverting the cut is reverting one commit
- [ ] Production apply plan stated for the release manager — n/a: this PR carries no migration. The release's apply plan is in section 8

## 4. Functional checks

- [x] Happy path works end to end: the releases page on this cut, driven in the browser as described in section 2, shows the `0.41.0` entry with all nine notes
- [ ] Data persists — n/a: static data compiled into the build
- [ ] Create / edit / delete all exercised — n/a: a cut has no create, edit or delete surface
- [x] Empty state renders sensibly: `unreleased` is `[]` after the cut, asserted by `--verify`
- [ ] Invalid input is rejected with a readable message — n/a: no input surface. `check-release-guards.mjs` exercises the analogous refusals
- [x] Boundary cases checked: the version boundary in section 2

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | the releases page | sees `0.41.0` and all nine notes; Admin is outside the card system | **as expected**: driven signed in as Admin, hydrated, every note present, no `[object Object]` or `undefined` |
| a login holding `translations` | the releases page | sees the two Translations notes | not driven: the tag is data, carried character-identical (section 2) |
| a login holding `assistant` | the releases page | sees the three assistant notes | not driven: same reason |
| a login holding `website` | the releases page | sees the Website → Pages note | not driven: same reason |
| a login holding none of those tags | the releases page | sees the untagged notes, and the tagged ones under Show everything | not driven: same reason |
| **a role named anything at all** | the releases page | sees every note whose tag it cannot match, not fewer | covered by `src/lib/release-audience.ts`'s unit tests in the `test` gate |

- [ ] Every role above tested — n/a: this PR changes no access rule and no page code; tagging is data asserted character-identical, and the widen-never-narrow property is covered by unit tests. Rows are by card because a role is a transient grouping of cards

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: not touched
- [ ] Manual updated (`src/lib/manual/en.ts`) — n/a: a cut adds no feature; each feature updated the manual in its own PR
- [ ] Translatable strings go through the translation path — n/a: release notes are English prose by design
- [ ] Mobile viewport (375px) — n/a: no layout change in this PR
- [x] Browser console clean on the releases page: no errors read while driving it
- [ ] Network clean — n/a: no new requests

## 6. Regression

- [x] The pages nearest the change still work: the build compiled every route
- [x] Any shared file touched checked from a second, unrelated page: `releases.ts` feeds the releases page, the release mail and `deploy.mjs`; the first through the driven page, the mail through the presence-plus-control pair, and `deploy.mjs` reads it at deploy time
- [x] No `[object Object]` or `undefined` in the entry, asserted by `--verify` **and** read off the rendered page
- [x] Nothing merged from `main` during `sync` was broken by this branch: nothing was merged

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** — n/a: a release cut closes no backlog item
- [ ] Non-obvious design choices added as a new file in `docs/decisions/` — n/a: the verify-against-a-built-base step and the narrowing of the Pi-failover note are recorded here and in the release record; neither is a design choice in the code
- [x] `README.md` still accurate: it quotes no version number
- [ ] **Release notes.** — n/a: a cut's whole purpose is to empty `unreleased`, so the checker cannot see a gained line. The one note this PR adds was checked for truth against the release: it describes code shipping in this build, on schema (`0292`) applied before the deploy, and it is narrowed to the one path actually wrapped
- [x] Commit messages say why, not just what: the cut commit records the email answer and the deferred-note review
- [x] **Claims were measured, not reasoned**: the `npm ci` need by a real diff; the advisory by running both scripts; the migration counts by `--status` on each database; the rendered page by driving it with `requestAnimationFrame` checked; the `@anthropic-ai/sdk` reachability by `grep` over `src`, `worker` and `scripts`

## 8. Pre-production gate

### Tested build

- [x] Tested SHA recorded in the header; the deployed SHA will be this PR's merge commit, recorded in the release record with a code-identity diff
- [ ] Deployed SHA matches the tested SHA — deferred: superseded by the code-identity diff (Lutan, 2026-10-24, "check for identical code only"), read at deploy time

### On the deployed build

- [ ] Deployed to test — deferred: this session, **after** the production deploy has reported. The two Worker deploys are strictly sequential: both run `next build` in the main checkout
- [ ] Smoke-tested on `test.lannacare.org` — deferred: this session
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: nothing in this PR derives "today"; the date in the entry is a literal
- [ ] **For a boundary or banding change, the assertions cover both edges** — n/a: no banding change in this PR
- [x] **Evidence pasted into this plan is the tool's actual output, unedited**
- [ ] Public pages re-checked after a cache purge or a 10-minute wait — deferred: this session. The release changes **every** public page's frame (#1115), so this is the one to look at hardest; `/shop` still cannot be opened signed out while `PUBLIC_SITE` is `locked` and shows nothing until an entry is set to shown

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: read at deploy time, from the `tee`'d log
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen — deferred: this session, read from both `tee`'d deploy logs. **14 on both environments for the last four releases; this release adds three new optional env entries** (`ANTHROPIC_API_KEY`, `ASSISTANT_LLM_MODEL` and the other assistant LLM switches in `scripts/lib/runtime-config.mjs`), so a different number here is expected rather than alarming, and the actual figure goes in the record
- [x] Any new secret/env var exists in the production Cloudflare environment: **none is required.** Every assistant LLM variable is `required: false`, and with `ANTHROPIC_API_KEY` unset `runtime-config.mjs` states the behaviour as "the model call is not configured and the keyword assistant carries on". The release notes say the same to users ("Until a model is set up for the shelter every row reads Keyword reader"). **Not read from production's Worker secrets by this session** — see Defects, item 2

### Migration ordering — *skip if no migration*

- [x] **Does this PR contain both a migration and code that reads it?** No. All seven migrations and the code that reads them are already on `main`, so all seven go **before** either deploy
- [x] **`0292_write_requests.sql` is the order-critical one, and the guard is the point.** `deploy.mjs`'s `schemaVerdict` refuses any commit whose migrations are not all applied, so the deploy cannot precede the apply. That refusal is protecting something nameable: the Pi failover wrapper makes the Worker willing to **replay** a write, and it is safe only because the database refuses a repeated request id. Deployed without `0292`, `claim_write_request` does not exist and every wrapped save fails outright. **Its one hole is that "could not ask" is a warning, not a refusal**, so `--status` was read by hand here rather than trusted to the deploy
- [x] **Predicted after-picture: no role's permission cells move at all.** Read from production **before** the apply (`check-production.mjs role-cells` and `role-cards`, both exit 0, kept for the record): doctor 16 cells/1 card, head_of_maintenance 8/4, head_of_medical 10/7, management 40/17, second_in_command 24/10, volunteer 4/3. `0295` puts `assistant.record` back on the **`assistant` card**, and `role-cards` shows **no role holds that card**, so it moves no cell. `0291` retires the `reference.add_while_recording` activity and its own header records, read from `pg_policies`/`pg_proc` on dev, that there is **no `card_grants` row and no `role_permissions` row** behind it. The other five add tables, columns and functions. Both checks are re-run after the apply and both go in the record
- [x] `node scripts/apply-migrations.mjs --env production --dry-run` — deferred to the apply step. **A red dry-run is expected and is not proof the file is wrong**: `0294` fixes a function `0293` creates, and each file is dry-run in its own `begin … rollback`, so `0293`'s object is gone before `0294` runs. Read both files before concluding anything
- [x] For a **destructive or rewriting** migration only: the before-picture above was taken of the tables the migrations write — `role-cells` is the cells table, which is the one `0.40.2` got wrong by snapshotting `role-cards` instead. A production backup is the nightly one
- [x] Apply plan stated: `0289` to `0295` to `dbkodyyxxhtygxcxmfcu` (production), before either deploy, after `git status -sb` reads neither ahead nor behind

### Rollback

- [x] Rollback position stated, **including what it does not cover**: production is served by the Pi, so a code rollback is a Pi rebuild at `7ec19061`. **This release is close to code-reversible but not provably so**: no migration here drops a column or a table that `0.40.12`'s code reads — `0291` retires an activity nothing grants, and the rest are additive. The risk in reverting is the **other** direction: `0.40.12`'s code does not know `write_requests`, so a rollback leaves the Worker's replay rule (which lives in the Worker bundle) paired with app code that does not claim request ids. A rollback therefore means rolling the **Worker** back too, not only the Pi

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | none | `audit:prod` exits 1 with the `glob` advisories (`GHSA-5j98-mcp5-4vw2` and the `minimatch` chain) | **Accepted, unchanged.** `audit:register` exits 0 — every high/critical is on `docs/advisory-register.json` and still unreachable |
| 2 | **medium** | **`@anthropic-ai/sdk@^1.3.0` ships as a production dependency, and Lutan had asked for it not to be used.** Added by `a908120e` (#1114, assistant v2 stream 2). Exactly one file imports it, `src/lib/assistant/llm-claude.ts`, reached only through a **dynamic** `import()` at `src/lib/assistant/llm.ts:108`, and only when `ASSISTANT_LLM_PROVIDER` resolves to `claude` **and** `ANTHROPIC_API_KEY` is set. Every test plan in the release records that no model is configured, so it ships **dormant**: no model call, no metered spend. **What this session did not read: production's Worker secrets**, so "`ANTHROPIC_API_KEY` is unset on production" is inference from the runtime-config contract and the release notes, not a measurement | **Accepted for this release on Lutan's explicit decision in chat, 2026-10-31: "you can continue the release, we will take it out in the next release."** He also said the backlog manager is already filing the removal, so **no backlog edit was made by this session** — the next release owes the removal of the dependency, `llm-claude.ts`, and the `claude` branch of `llm.ts`. Raised by him, not found by a check: `check-llm-vendor-imports.mjs` **permits** that file by design |
| 3 | low | The handover's `git reset --hard` recipe for reusing the cut worktree was already corrected in `0.40.12`; the corrected form (`git checkout -b claude/record-<version> origin/main`) was used to plan the record step | **No action**: already fixed upstream, recorded so the next reader knows it was followed |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | **The nine notes and the title, read as a shelter user would.** The title and the Settings → Units note are mine and nobody has reviewed them; the other eight came from their own PRs | `/releases`, the `0.41.0` entry |
| 2 | **The email itself, once it arrives.** This is the first mailing release in eleven, so the mail path has not run in some weeks. `docs/release-procedure.md` records that it currently reaches **one** person, because the shelter's own address is not on the production admin list | the inbox, a message from `releases@lannacare.org` with `0.41.0` in the subject |

The fourteen `pending:` plans in this release are **not** copied here. They belong to their own plans and their own signatures, and copying them would give them a second home that nothing closes (`docs/release-procedure.md` §3). They are listed in the release record as a stated gap, on Lutan's decision to ship with them open.

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude Opus 5 (production release manager session)  Date: 2026-10-31

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: not ticked, the two rows above are Lutan's and only the person who looked may tick this

Manual verification by: pending: the two rows in Left for manual verification

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR

Result: pass with accepted defects
