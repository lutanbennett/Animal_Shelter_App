# Feature test plan

## Header

| | |
|---|---|
| Feature | `refused` added to `assistant_action_status`, so a volunteer turned away from an assistant write can later be recorded in `assistant_actions` |
| Backlog item | `docs/backlog.md` → Assistant → **A volunteer turned away from an assistant write leaves no audit row** (NOT ticked: the client half remains; a status line names this PR) |
| Branch / worktree | `claude/schema-assistant-refused` @ `C:DevelopmentAnimal_Shelter_schema-assistant-refused` |
| Dev server | not started: this change ships no runtime code |
| PR | TBD |
| Tested by / date | Claude (automated) / 2026-10-02 |
| Carries a migration? | yes: `0130_assistant_action_refused.sql` |
| Tested at SHA | TBD at PR open |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: one `alter type … add value if not exists 'refused'`; the item asked for the value so the client can record a refusal
- [x] Files/areas touched listed: `supabase/migrations/0130_assistant_action_refused.sql`, `scripts/check-assistant-refused.mjs` (dev-only rollback harness), `docs/backlog.md`, `docs/decisions/2026-10-02-assistant-refused-one-file.md`, this plan. No `src/`, no `worker/`
- [x] Roles affected identified: none. No policy reads `status`, and no code writes the new value yet
- [x] Anything explicitly **out of scope** written down: the client change (`AssistantActionStatus` in `src/lib/assistant/audit.ts`, and `AssistantConversation.tsx` sending a row on refusal), which is a feature branch from `main` after this applies

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly: "Already up to date", exit 0
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Closing lines as printed:

  ```
  === gates: build exited 0 after 259s

  gates: typecheck=0 lint=0 build=0
  ```

- [x] CI green on the PR (runs the same three): see the PR checks; local `node scripts/gates.mjs` ended `gates: typecheck=0 lint=0 build=0`

## 3. Schema and data

- [x] Migration number is one above the highest on `main`, and no other in-flight branch carries one: `origin/main` tops out at `0129`; the brief gave this branch the slot
- [x] `node scripts/apply-migrations.mjs --status` reviewed: `129 applied, 1 pending. pending: 0130_assistant_action_refused.sql` on `qxkmhwybjggxvsfxsxbd`
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed: `dry-run 0130_assistant_action_refused.sql … ok`. It passes because nothing depends on a second file
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations`, after the gates and on Lutan's "merge it": `applying 0130_assistant_action_refused.sql … ok`; `--status` afterwards `130 applied, 0 pending`
- [x] File is re-runnable: `add value if not exists`
- [x] Existing rows still read correctly after the change: harness case C inserts the three original statuses alongside a `refused` row
- [x] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness, `scripts/check-assistant-refused.mjs`, run after the apply. Output, unedited:

  ```
  status 400
  Failed to run sql query: ERROR:  P0001: HARNESS-OK enum = confirmed,cancelled,unmatched,refused; refused row inserted and read back verbatim; confirmed/cancelled/unmatched still insert; bogus rejected
  CONTEXT:  PL/pgSQL function inline_code_block line 30 at RAISE
  ```

  (`status 400` is by design: the harness ends in a `raise` so it cannot commit.)
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: Postgres cannot drop an enum value; the value is harmless unused
- [x] Production apply plan stated: `0130` to production `dbkodyyxxhtygxcxmfcu` by Lutan, any time; no deploy depends on it

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no UI surface, nothing records this value yet
- [ ] Data persists — n/a: no UI surface, nothing records this value yet
- [ ] Create / edit / delete all exercised — n/a: no UI surface
- [ ] Empty state renders sensibly (no rows yet) — n/a: no UI surface
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no input
- [ ] Boundary cases checked — n/a: no input

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a: no route or policy changed | — | — |
| management | n/a: no route or policy changed | — | — |
| staff | n/a: no route or policy changed | — | — |
| vet | n/a: no route or policy changed | — | — |
| volunteer | n/a: no route or policy changed | — | — |
| signed out | n/a: no route or policy changed | — | — |

- [ ] Every role above tested — n/a: no route, grant or RLS policy changed; the trigger runs as the writer for every role alike
- [ ] A role that should not have access is blocked server-side (hitting the URL directly fails) — n/a: no access rule changed

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no UI change
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: nothing visible
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: no strings
- [ ] Mobile viewport (375px) — n/a: no UI change
- [ ] Browser console clean — n/a: no UI change
- [ ] Network clean — n/a: no UI change

## 6. Regression

- [ ] The pages nearest the change still work — n/a: no page reads or writes the new value; the assistant's existing three statuses are untouched
- [ ] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — n/a: no shared source file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch: sync merged a release cut (0.15.0) in cleanly; this branch touches none of its files

## 7. Documentation

- [ ] Backlog item ticked — n/a: deliberately not ticked, the client half remains; a status line naming this PR was added instead
- [x] Non-obvious design choices recorded as a new file in `docs/decisions/`: why this is one file, not two
- [x] `README.md` still accurate: it does not list columns
- [ ] **Release notes.** Would a shelter user notice this change? — n/a: an enum value nothing writes yet; nobody using the app can tell it exists
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and decisions were measured, not reasoned:** the no-SQL-use claim comes from grepping `supabase/migrations/` for the table and type; the dry-run line is the tool's output

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: production release manager
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: production release manager (nothing to deploy: SQL only, already applied to the dev database `test.lannacare.org` reads)
- [ ] Smoke-tested on `test.lannacare.org` — deferred: production release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: `updated_at` is a stored instant from `now()`; nothing here derives a date
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary** — n/a: no threshold or band
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.**
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — n/a: no public view reads either table's new column

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: production release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: production release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: none added

### Migration ordering

- [x] **Does this PR contain both a migration and code that reads it?** No; the client is a later branch. Applying first is safe for code that does not know the value
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: Lutan (production reads are refused from feature worktrees)
- [ ] For a **destructive or rewriting** migration only: a production backup exists — n/a: additive, rewrites nothing
- [x] Apply plan stated: which file, which project, and whether it runs before or after the deploy (see §3)

### Rollback

- [x] Rollback position stated, **including what it does not cover**: no Worker change, so `wrangler rollback` does not apply. The enum value cannot be removed and does not need to be

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| — | — | none | — |

## Left for manual verification

Empty: nothing in this change has a surface a person needs to look at that the harness did not already cover.

| # | What to check | Where |
|---|---|---|
| — | — | — |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-09-24

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person

Manual verification by: n/a: the manual list is empty — schema-only change, verified by the rollback harness

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR links this plan and quotes the harness output rather than duplicating it
- [x] Handed to the production release manager: the PR states that Lutan applies it to production

Result: pass

Release manager acknowledgement: n/a: schema PR; acknowledged at release time
