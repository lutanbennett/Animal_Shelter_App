# Feature test plan — cut-release-0-9-0

## Header

| | |
|---|---|
| Feature | Cut release `0.9.0`, **major**: move the six `unreleased` notes into a new register entry and bump `package.json` to match |
| Backlog item | none — the release-cut step described in `src/lib/releases.ts`'s own header |
| Branch / worktree | `claude/cut-release-0-9-0` @ `C:\Development\Animal_Shelter_cut-release-0-9-0` |
| Dev server | not started — this PR changes register data, not the app |
| PR | opened from this branch |
| Tested by / date | Claude (release manager session) / 2026-09-28 |
| Carries a migration? | no — `0108` and `0109` sit between the deployed build and `main`, both read by code already on `main`. See §3 |
| Tested at SHA | `cbec985` + this branch's commit |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what was asked for — two files: a `0.9.0` entry holding the six notes written by PRs #198–#205, and `package.json`'s version field
- [x] Files/areas touched listed — `src/lib/releases.ts` (data only) and `package.json` (version field). No `src/app/`, no `worker/`, no migrations
- [x] Roles affected identified — **all roles** in what `/releases` lists, each filtered to their own role (#195). Three of the six notes are role-tagged: two `admin`, one `vet, admin`. `major: true`, so **every admin with an email is mailed on the production deploy**
- [x] Anything explicitly **out of scope** written down — (a) the production deploy, Lutan's go; (b) the production release record, written after that deploy; (c) applying `0108`–`0109` to the production database (§3); (d) the still-owed `0.8.1` release record, being written separately on `main` in this same session — it records the previous release, not this cut

**Decision confirmed in chat by Lutan, 2026-09-28:** `0.9.0` with `major: true`. The lead note is the reason — a vet account with no clinic set now sees **no residents** until an admin sets one under Security, which is an admin action the release mail exists to announce. `0.8.1` shipped the sibling change (a vet records *to* their own clinic) as minor; this one narrows what a vet can *see*, and needs someone to act.

**The note count was fixed before the cut and the cut refused any other count.** `unreleased` held exactly six single-line entries at `cbec985`; the cut script asserts both the count and the one-line-per-note shape, and exits rather than cutting a different release. This matters because `0.8.1`'s version question was put to Lutan against five notes and cut against nine — `main` moved underneath it. Here `main` also moved mid-preparation, from `42ac098` to `cbec985` (#203–#205), which is where three of these six notes came from; the count was re-read after that rather than carried forward.

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — not needed and verified rather than assumed: `git rev-list --count HEAD..origin/main` returned **0** at `cbec985`
- [x] `npm run typecheck` — clean. Via `node scripts/gates.mjs`: `typecheck=0`
- [x] `npm run lint` — clean: `lint=0`
- [x] `npm run build` — succeeds: `build=0`
- [ ] CI green on the PR (runs the same three) — n/a: recorded at push time, before CI has reported
- [x] Newest release version matches `package.json` — both `0.9.0`
- [x] `unreleased` is empty — emptied by this PR; it held exactly 6 entries and the cut refused any other count
- [x] **`majorReleasesSince("0.8.1")` returns `["0.9.0"]`** — the check that matters for a major release, and the inverse of `0.8.1`'s. A non-empty list is what makes the deploy mail admins, so it is verified rather than inferred from `major: true`
- [x] **The date was read from the system clock and compared back to it** — `date +%Y-%m-%d` gave `2026-09-28`, the entry says `2026-09-28`, and the register was re-loaded and asserted equal to today
- [x] The register parses the way `deploy.mjs` loads it — `latestRelease` is `0.9.0` / `2026-09-28` / `major: true` / 6 notes

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration in this PR
- [ ] `--status` reviewed before applying — n/a: no migration in this PR. **Not establishable from this session** for the production database: `--env production` reads are refused here
- [ ] `--dry-run` reviewed — n/a: no migration in this PR; owed for the release
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: no migration in this PR. Dev is current through `0109`: `--status` reports `109 applied, 0 pending` and no drift against `origin/main cbec985`
- [ ] File is re-runnable — n/a: no migration in this PR
- [ ] Existing rows still read correctly after the change — n/a: this PR reads no database
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration in this PR
- [x] Production apply plan stated for the release manager — **the starting point is known from `deploy.log`**, not assumed: the `0.8.1` deploy recorded `Against origin/main ac8a722: 107 file(s), 104 applied row(s)` and then `0105`, `0106`, `0107` applying cleanly, so the production database is at `0107`. `0108` and `0109` are what is new.

  1. `node scripts/apply-migrations.mjs --drift production >> deploy.log 2>&1` (Lutan — production reads are refused to this session). Run it even though the expected answer is known: other work may have applied something since.
  2. `--dry-run`, apply, then `check-public-views.mjs --env production` and `check-app-access-gate.mjs`, **all appended to the same log**. Both checks are directly relevant this time rather than boilerplate: `0109` redefines a public view and `0108` rewrites the residents access policies.
  3. **Then** deploy.

  | File | Read by code already on `main`? |
  |---|---|
  | `0108_vet_resident_scope.sql` | **Yes** — the vet resident scope (#199) rests entirely on `current_vet_resident_ids()` and the policies this file replaces |
  | `0109_public_project_photos_exclude_non_images.sql` | **Yes** — `src/lib/projects/public.ts` reads `public_project_photos`, and `is_public_drive_file()` (0084) asks that same view |

- [x] **`0108` is the largest access change since `0100`, and the order matters more than usual.** It replaces the residents policy and seven more (`resident_diets`, `placement_history`, `adoption_updates`, `attachments`, `translations`) and redefines two security-barrier views. The code that depends on it is already on `main` and will be in the deployed build, so **applying it after the deploy leaves vets seeing the pre-scope list for the gap** — the one ordering here that is not merely degraded but wrong in the direction the release exists to fix. Apply before deploy, as step 2 above
- [x] **`0109` closes a real public-read gap and is worth applying on its own merits.** `public_project_photos` (0042, last redefined in 0056) returned every attachment in a public project folder with no type filter, and `is_public_drive_file()` asks it directly — so a PDF filed in a public project folder was streamable to a signed-out visitor holding its link, and would have rendered as a broken `next/image` on `/our-work/[id]`. Same shape as `0101` and `0103` for resident and profile photos. No such row exists on dev today, so nothing was visibly broken; the file is worth applying whether or not the release ships
- [x] **No new schema-ahead-of-code in this release** — both `0108` and `0109` have their consumer on `main`. Nothing to carry forward as an expiry date

## 4. Functional checks

- [x] Happy path works end to end — the register was loaded the way `scripts/deploy.mjs` loads it: `0.9.0`, `major: true`, `2026-09-28`, 6 notes, `unreleased` length 0
- [ ] Data persists — n/a: static data compiled into the build
- [ ] Create / edit / delete all exercised — n/a: no CRUD surface
- [ ] Empty state renders sensibly — n/a: `releases` has fourteen entries. `unreleased` is now empty, its correct post-cut state
- [ ] Invalid input is rejected with a readable message — n/a: no input. The rules that reject bad register data live in `deploy.mjs` and were run in §2
- [x] Boundary cases checked — the cut is line-based, so it carried all six source lines verbatim; each entry occupies exactly one source line, asserted before cutting. After the cut the register resolves to **3 strings and 3 objects**, every one returning readable text through `noteText()`. **Note count**: exactly 6, none reworded — the moved lines were diffed against the `unreleased` block they came from. **Date**: read from the clock. **Indentation**: six spaces, matched to the existing entries. **Line endings**: CRLF preserved
- [x] **The release mail was built and read, and this is the first major release that will actually mail an object-shaped note.** `0.8.1`'s plan proved `buildReleaseMail` against object notes with `major` forced true, as a dry precaution; here it is real. Run against this release's entry: subject `Lanna Care release 0.9.0: Vets see only their own clinic's residents, …`, **0** occurrences of `[object Object]`, **0** of `undefined`, **6** `<li>` bullets in the HTML and six in the plain text, each carrying its note's own words. The role tags do **not** filter the mail — every admin gets all six lines, which is correct, since the mail goes only to admins and three of the notes are tagged for them anyway

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | `/releases` | sees `0.9.0` filtered to their role; **is emailed on the production deploy** | mail built and read above; the send itself is a production-deploy step, §8 |
| management / staff / volunteer | `/releases` | sees `0.9.0`, filtered to their role — three of six notes are admin- or vet-tagged, so they see a narrower list | not verified on a deployed build at PR time |
| vet | `/releases` | sees `0.9.0`; the lead note is tagged `vet, admin`, and it is the one that changes their job | not verified on a deployed build at PR time |
| signed out | the sign-in lock | unchanged by this PR | unchanged |

- [x] Every role above tested — n/a as a per-role exercise: this PR changes the data the page renders, not who may see it or how it filters. The filtering behaviour shipped in #195 with its own plan; this cut's job was to carry the tags across intact, which §4 verifies
- [x] A role that should not have access is blocked server-side — not re-verified here and not claimed as verified: no access rule is touched by this PR. The release's own access change is `0108`, covered in §3

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no nav change in this PR
- [ ] Manual updated (`src/lib/manual/en.ts`) — n/a: this PR publishes notes; each feature updated the manual in its own PR
- [ ] Translatable strings go through the translation path — n/a: release notes are English only by design (#62)
- [ ] Mobile viewport (375px) — n/a: no layout change in this PR
- [ ] Browser console clean — n/a: no browser involved for this PR
- [ ] Network clean — no unexpected 4xx/5xx — n/a: no new requests

## 6. Regression

- [x] The pages nearest the change still work — the build compiled every route
- [x] Any shared file touched checked from a second, unrelated page — `releases.ts` has four consumers: `/releases`, `worker/release-mail.mjs` via `src/lib/release-mail.ts`, `scripts/deploy.mjs`, and the role filter. All four were exercised in §2 and §4, the mailer for real rather than as a precaution
- [x] Nothing merged from `main` during `sync` was broken by this branch — no sync needed; 0 behind `cbec985`. `main` moved from `42ac098` to `cbec985` before the worktree existed, and the note count was re-read after it

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` — n/a: no backlog item; this is the release-cut step
- [ ] **Release notes.** — n/a: a release cut *removes* entries from `unreleased` rather than adding one. All six were written by the PRs that made each change
- [ ] Non-obvious design choices appended to `docs/decisions.md`, dated — n/a: no design choice in this PR. The `major: true` reasoning is in §1 and is a release decision rather than a design one
- [x] `README.md` still accurate — unaffected; it names no version
- [x] Commit messages say why, not just what

## 8. Pre-production gate

### Tested build

- [x] Tested SHA recorded in the header — `cbec985` plus this branch's commit; the tip of `main`, 0 behind
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager. `main` moved once during `0.8.1`'s preparation and again during this one; check `git log` immediately before deploying

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: this session, immediately after merge. Test is on `0.8.1`, confirmed from `/api/releases/current`
- [ ] Smoke-tested on `test.lannacare.org` — deferred: this session, after the test deploy
- [ ] Timezone-sensitive behaviour checked on test — deferred: production release manager. **Directly relevant**: note 3 is a Thailand-clock fix for prescriptions and diets that ended yesterday, in the midnight-to-7am window that is wrong for part of every day and invisible on `next dev`
- [ ] Public pages re-checked after a cache purge or a 10-minute wait — deferred: production release manager. `0109` changes what `/our-work/[id]` may show, and anonymous GETs are edge-cached per data centre
- [ ] **`check-public-views.mjs --env production` and `check-app-access-gate.mjs`, appended to the log** — deferred: production release manager. Named explicitly because `0108` rewrites the residents access policies and `0109` redefines a public view; the `0.8.0` record had to report both checks as never run

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref matches production — deferred: production release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen — deferred: production release manager. Use `>>`
- [x] Any new secret/env var exists in the production Cloudflare environment — none added by this PR
- [x] **Release mail — this is the one to watch, and the test deploy cannot prove it.** `major: true` and `majorReleasesSince("0.8.1")` is `["0.9.0"]`, so the production deploy will look up every unarchived admin, read their email from the Auth admin API and POST the built mail to `/api/releases/mail`. **The test environment has no `RELEASE_MAIL` binding and `RELEASE_MAIL_ENV` is `""`** (`wrangler.jsonc`, the `test` env), so the dev database never sends release mail by design — a test deploy of this release mails nobody, and therefore proves the recipient lookup and the relay not at all. The evidence that the path works is `0.7.0` and `0.8.0`, each `sent 1, skipped 1` from production. What is genuinely new here is the note *shape*, and that was proved offline in §4

### Migration ordering — *skip if no migration*

- [x] Does this PR contain both a migration and code that reads it? — no migration in this PR. For the release, **both** `0108` and `0109` are read by code already on `main`, so both must be applied **before** the deploy, not after. `0108` is the one where the wrong order is actively wrong rather than merely degraded — see §3
- [ ] `--env production --dry-run` run and clean — deferred: Lutan
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — deferred: Lutan. Neither file rewrites data — `0108` replaces policies and views, `0109` one view — so this is the ordinary pre-release backup check rather than a specific worry, unlike `0.8.1`'s `0106`
- [x] Apply plan stated — §3

### Rollback

- [x] Rollback position stated, **including what it does not cover** — `npx wrangler rollback --env production` returns the Worker to the `0.8.1` build in seconds. **This release is not fully reversible, and that is new**: `major: true` means the release mail is sent, and a mail cannot be unsent. Everything else reverses. Rollback does not revert `0108` or `0109`, and leaving both applied under the `0.8.1` build is safe in the direction that matters — `0108` would narrow what a vet sees one release early, and `0109` would filter a public view that nothing on `0.8.1` needs unfiltered

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| — | — | None found in this PR | — |

Checked across the release rather than in this PR:

- All **eight** feature branches merged since `0.8.1` (#198–#205) have a completed plan under `docs/test-plans/`. None reports `Result: fail`; two report `pass with accepted defects`. **Every one of the eight has `Manual verification by: pending:`** — normal for a PR, and a release-time question rather than a merge-time one, which is what the release smoke test's by-hand check exists for
- **The `0.8.1` release record was missing when this cut was prepared.** `0.8.1` was applied and deployed at `ac8a722` around 18:56 on 2026-09-28 and `docs/releases/2026-09-28.md` did not exist, so the repository looked exactly like one where the release had never shipped — and this session first read it that way. Third release running where the record lagged the deploy. Being written now, from `deploy.log`, on `main`

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | The six notes **and the title**, read as a shelter user would. Higher stakes than `0.8.1`: `major: true` means these exact words are emailed to every admin, and the title becomes the subject line. **The title is mine and nobody has reviewed it** | `src/lib/releases.ts`, the `0.9.0` entry |
| 2 | **The `major: true` call itself, once the notes are read together.** Confirmed in chat on the strength of the lead note; worth one look at the set before the mail goes out | `src/lib/releases.ts`, the `0.9.0` entry |
| 3 | **The lead note's instruction to admins is complete enough to act on.** It says a vet with no clinic set sees no residents and that an admin sets it under Security. If any vet account is currently unset, that is work the mail is asking someone to do, and nobody has counted them | Settings → Security, on the deployed build |
| 4 | The role tags on the three tagged notes, read as a set. A wrong tag hides a line from the people it is for | `src/lib/releases.ts`, the `0.9.0` entry |

`--drift production` is deliberately **not** a row here: it is a deploy-time check and lives in section 8 as `deferred:`, per the template rule added 2026-09-27.

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (release manager session)  Date: 2026-09-28

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: not yet — all four items are open and need a person. Items 1 and 2 matter more than usual because this release mails

Manual verification by: pending: Lutan to read the six notes and the title (item 1), confirm `major: true` against the set (item 2), check for vet accounts with no clinic (item 3) and the role tags (item 4)

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager — this session, with the items above outstanding

Result: pass
