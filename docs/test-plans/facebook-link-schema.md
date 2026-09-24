# Feature test plan

## Header

| | |
|---|---|
| Feature | `site_content.facebook_url` and `instagram_url`: where the shelter's own social links will be stored. Schema half only |
| Backlog item | `docs/backlog.md` → Public website → **Link to the LCA Facebook page from the public site** (ticked on the feature PR, not this one) |
| Branch / worktree | `claude/facebook-link-schema` @ `C:\Development\Animal_Shelter_facebook-link-schema` |
| Dev server | not started. This change ships no runtime code |
| PR | see the PR this plan ships in |
| Tested by / date | Claude (automated) / 2026-09-24 |
| Carries a migration? | yes: `0080_social_urls.sql` |
| Tested at SHA | branch on `main` @ `1254631` (#103). The migration, harness, `decisions.md` entry and this plan are the only changes |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: one additive migration adds nullable `facebook_url` and `instagram_url` text columns to the `site_content` singleton. That is the schema the item asks for
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs): `supabase/migrations/0080_social_urls.sql`; `scripts/check-social-urls.mjs` (dev-only rollback harness); `docs/decisions.md`; this plan. No `src/`, no `worker/`
- [x] Roles affected identified: admin / staff / vet / volunteer / resident / signed-out public. No policy or grant changed. `site_content`'s existing public-read and admin-update policies (0018) and table grants (0077) cover the new columns. No code reads them yet
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised: the `/admin/website` fields, the footer icon row and the header link all belong to the `claude/facebook-link` feature stream, as does the backlog tick. The frequency RLS question from `frequency-options-to-admin` is **not** in this PR (Lutan, 2026-09-24)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly. `Already up to date.`
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Closing lines, as printed:

  ```
  === gates: build exited 0 after 477s

  gates: typecheck=0 lint=0 build=0
  ```
- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [x] Migration number is one above the highest on `main`, and no other in-flight branch carries one. `origin/main` tops out at `0079_public_enclosures.sql`, there are no open PRs, and the batch-3 plan gives this stream the only migration slot
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying: `81 applied, 1 pending.` on `qxkmhwybjggxvsfxsxbd`
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed: `dry-run 0080_social_urls.sql … ok`
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations`: `applying 0080_social_urls.sql … ok`, then `--status` reported `82 applied, 0 pending.`
- [x] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`). The harness runs the whole file twice in one transaction and asserts there is still exactly one check per column. It was run again after the real apply, which is a third run over an already-migrated table. Both runs exit 0
- [x] Existing rows still read correctly after the change (checked against real dev data). Harness step A: `site_content` still has its one row, the new columns are NULL on it, and every other value on the row is unchanged (compared as jsonb against a snapshot taken before the migration ran)
- [x] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness: `scripts/check-social-urls.mjs`. Asserted: (A) singleton intact, nothing back-filled, nothing else changed; (B) two nullable `text` columns with exactly two check constraints after two runs; (C) https Facebook and Instagram URLs of the shape the validator saves round-trip exactly; (D) `javascript:alert(1)` and a schemeless `instagram.com/lannacare` are refused with `check_violation`; (E) clearing both back to NULL is allowed; (F) `anon` reads `facebook_url`. Output, unedited (run after the apply):

  ```
  status 400
  Failed to run sql query: ERROR:  P0001: HARNESS-OK singleton: 1 row, new columns NULL, other values unchanged | shape: 2 nullable text columns, 2 checks after two runs | https urls round-trip | javascript: and schemeless refused | clear to NULL ok | anon reads facebook_url | file ran twice
  CONTEXT:  PL/pgSQL function inline_code_block line 52 at RAISE
  ```

  (`status 400` is by design: the harness ends in a `raise` so it cannot commit, and the script exits 0 only on `HARNESS-OK`.) To prove the harness can fail, I ran it against a copy of the migration with both checks removed. It failed with `FAIL B 0 check constraints on the new columns, expected 2`, and the file was then restored
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: purely additive, two nullable columns nothing reads yet; undoing it is `alter table site_content drop column if exists facebook_url, drop column if exists instagram_url`
- [x] Production apply plan stated for the release manager (which file, which project, when): Lutan applies `0080_social_urls.sql` to production `dbkodyyxxhtygxcxmfcu` from the main checkout, running `node scripts/apply-migrations.mjs --env production --dry-run` and then without the flag. This must happen **before** the `facebook-link` feature deploys, because that code will select these columns

## 4. Functional checks

- [x] Happy path works end to end: harness steps C and F are the admin save and the anon footer read the feature will make
- [ ] Data persists — reload the page and the change is still there — n/a: no UI surface, no code reads these columns yet
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: no UI surface; set and clear exercised in SQL (steps C and E)
- [x] Empty state renders sensibly (no rows yet): at the schema level "not set" is NULL on the existing row, not a missing row or an empty string (step A)
- [x] Invalid input is rejected with a readable message, not a crash: at the schema level a non-http(s) value raises `check_violation` (step D). The readable message is the admin form's job in the feature PR
- [x] Boundary cases checked (long text, zero, negative, missing optional fields, dates): NULL (missing), a schemeless host, a `javascript:` scheme, and a short `fb.com` link

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a: no route; existing `admin_update_site_content` covers the columns | — | — |
| management | n/a: no policy change | — | — |
| staff | n/a: no policy change | — | — |
| vet | n/a: no policy change | — | — |
| volunteer | n/a: no policy change | — | — |
| signed out | `site_content` via the anon key | SELECT the new columns | read `facebook_url` as `anon` (harness step F) |

- [ ] Every role above tested — n/a: no route, policy or grant changed; the one access the feature relies on (anon read) was tested
- [ ] A role that should not have access is blocked server-side (hitting the URL directly fails) — n/a: no new access was granted to anyone; `site_content` writes remain admin-only under the unchanged 0018 policy

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no UI change
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: nothing visible yet; the feature PR documents the new fields
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: URLs are not translated, and no strings were added
- [ ] Mobile viewport (375px) — n/a: no UI change
- [ ] Browser console clean — n/a: no UI change
- [ ] Network clean — n/a: no UI change

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked). No page was loaded, because nothing in `src/` reads the new columns. Harness step A shows every existing `site_content` value unchanged, and those values are what the home page and footer read
- [ ] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — n/a: no shared source file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch. Sync brought nothing in

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** — n/a: only the schema half is done; the feature PR ticks it
- [x] Non-obvious design choices appended to `docs/decisions.md`, dated: why a database URL check was added despite the brief, and why it cannot disagree with the form validator
- [x] `README.md` still accurate. It does not list columns
- [ ] **Release notes.** Would a shelter user notice this change? If so, `unreleased` in `src/lib/releases.ts` has a line for it — n/a: two empty columns no page reads yet; the feature PR adds the line when the icons appear
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** The 0076 check was read from the file. The claim that the validator only saves `https://` values is from `checkHttpsUrl`, which returns `parsed.toString()` only after `protocol === "https:"`. The harness asserts that a value of that shape round-trips

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: production release manager
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: production release manager (nothing to deploy — SQL only, already applied to the dev database `test.lannacare.org` reads)
- [ ] Smoke-tested on `test.lannacare.org` — deferred: production release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: nothing here derives a date
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary** — n/a: no threshold or band
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.**
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — n/a: no public page reads the new columns, and no existing value changed

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: production release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: production release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: none added

### Migration ordering

- [x] **Does this PR contain both a migration and code that reads it?** No, but the follow-on `facebook-link` feature will, so production must have 0080 **before** that feature deploys
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: Lutan (production reads are refused from feature worktrees)
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — n/a: two new nullable columns; no data rewritten
- [x] Apply plan stated: which file, which project, and whether it runs before or after the deploy. See §3

### Rollback

- [x] Rollback position stated, **including what it does not cover**. There is no Worker change, so `wrangler rollback` does not apply. The columns are additive and safe to leave in place; the drop in §3 removes them. Once the feature ships, dropping them breaks the footer query

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| — | — | none | — |

## Left for manual verification

Empty. Nothing in this change has a surface for a person to look at that the harness did not already cover.

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
- [x] Handed to the production release manager: the PR states that the production apply is Lutan's and must happen before the feature deploys

Result: pass

Release manager acknowledgement: n/a: schema PR; acknowledged at release time
