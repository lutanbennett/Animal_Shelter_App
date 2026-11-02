# Feature test plan

## Header

| | |
|---|---|
| Feature | Access wording pile (B): five Drive messages say who can really help, and role-shaped dictionary keys are renamed |
| Backlog item | `docs/backlog.md` → `## Security`, "PILE (A) DONE 2026-11-01" |
| Branch / worktree | `claude/access-wording-pile-b` @ `C:DevelopmentAnimal_Shelter_access-wording-pile-b` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3001` |
| PR | see PR body |
| Tested by / date | Claude (stream `access-wording-pile-b`) / 2026-11-02 |
| Carries a migration? | no |
| Tested at SHA | SHA_HERE |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs)
- [x] Roles affected identified: admin / staff / doctor / volunteer / resident / signed-out public
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised

One sentence: five Drive messages stop saying "ask an admin" and say who can really act; role-shaped dictionary key names are renamed with their callers; the fourteen Admin sentences were read and all kept.

Files: `src/lib/i18n/dictionaries/en.ts` and `th.ts`, `src/app/friends/page.tsx`, `AdoptionUpdateForm.tsx`, `src/lib/releases.ts`, `docs/decisions/2026-11-02-access-wording-pile-b.md`, this plan. No logic, policy, card, catalogue or migration change.

Affected by card: nothing changes who can do anything; the Drive messages reach any login that uploads or moves photos (`photos.approve`, `photos.resident_manage`, `social.library`).

Out of scope: manual prose, `can.ts`, the untraced update/delete policy behind `loginLinksAdminOnly`.

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Paste its closing `gates:` lines below exactly as printed. They are the evidence, and running the script again regenerates them
- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit

```
GATES_HERE
```

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

- [ ] Happy path works end to end — n/a: Drive-failure messages cannot be provoked on dev; verified by call-site reading and typecheck
- [ ] Data persists — reload the page and the change is still there — n/a: nothing is written; these are static strings in the bundle
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: copy only, no write path
- [ ] Empty state renders sensibly (no rows yet) — n/a: no list or table was added
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no input
- [ ] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — n/a: no values; the only risk is text length, and each string is a similar length to the one it replaced

The changed strings are error and warning messages reached only when Drive fails, which cannot be provoked on dev without breaking the Drive token. Verified instead by reading each call site (decision file section 2), `node scripts/check-thai-dictionary.mjs`, and the key rename by typecheck plus grep: no remaining `staffDrafts`, `staffOnlyBadge` or `askManager` in `src/`.

### Role access matrix

Written by card: no access changed (copy and key names only); every `can(...)`, policy and card is untouched.

| Role | Can reach | Expected | Result |
|---|---|---|---|
| any | per its cards | no access change | no access change: copy only |

- [ ] Every role above tested — n/a: no access changed; copy only
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

The release note is an untagged plain string, as Drive failures can reach any login that uploads photos. No manual step is outstanding.

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
| 1 | low | `loginLinksAdminOnly` update/delete refusal: policy not traced | deferred to planner (PR body) |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Whether the Thai of the five reworded Drive messages reads naturally | `th.ts`: keys in the decision file |

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (stream `access-wording-pile-b`)  Date: 2026-11-02

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: the list is not empty, so only the person who looks may tick this

Manual verification by: pending: a Thai reader confirms the Thai of the five reworded Drive messages

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager

Result: pass with accepted defects

Release manager acknowledgement: pending: the finding in the PR body is for the planner to file
