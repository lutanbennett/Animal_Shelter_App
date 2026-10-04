# Feature test plan — cut-release-0-18-0

## Header

| | |
|---|---|
| Feature | Cut release `0.18.0`, **major**: move the seven `unreleased` notes into a new register entry and bump `package.json` to match |
| Backlog item | none — the release-cut step in `docs/release-procedure.md` §4 |
| Branch / worktree | `claude/cut-release-0-18-0` @ `C:\Development\Animal_Shelter_cut-release-0-18-0` |
| Dev server | not started — this PR changes register data, not the app |
| PR | opened from this branch |
| Tested by / date | Claude (release manager session) / 2026-10-04 |
| Carries a migration? | no — but **six** (`0134`–`0139`) ship in this release and were applied to production first. See §3 |
| Tested at SHA | `088dda2f` + this branch's commits |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what was asked for — two files: a `0.18.0` entry holding the seven notes written by #344–#351, and `package.json`'s version field
- [x] Files/areas touched listed — `src/lib/releases.ts` (data only) and `package.json`. No `src/app/`, no `worker/`, no migrations
- [x] Roles affected identified — five notes are role-tagged, two untagged. **`major: true`, so every admin with an email is mailed** — verified in §2
- [x] Anything explicitly **out of scope** written down — (a) the Worker production deploy, Lutan's; (b) the release record; (c) the outstanding manual verification on six of the eight PRs, which stays on their plans; (d) **the `0.17.0` release record, which was never written** and is owed separately

**Decided in chat by Lutan, 2026-10-04: `0.18.0`, major.** Asked before cutting.
A Home screen everyone lands on and a new Head of Medical login are the largest
change to how the app is used since it shipped; people meet it at their next
sign-in whether or not they read the mail.

### Mailed in this order

1. The Home screen (everyone) · 2. Head of Medical login (`admin, management, staff`) · 3. The Director's phone and desk landing (`admin`) · 4. Resident search by ID · 5. The assistant getting out of the way · 6. Adopted residents leaving the public page · 7. The Thai notice on untranslated public pages

What a person meets first goes first. The order is a judgement and is the one item on the manual list.

### What is in the release

`node scripts/release-prs.mjs 6ee07cc3 088dda2f` — eight PRs, exit 0, fourteen added migration/test-plan files accounted for: #344–#351.

### Six of the eight plans are unsigned

Put to Lutan before the cut; he chose to ship and record the gap. Two of the six
change **who can see what**, which is why they were named to him specifically:

| PR | Outstanding |
|---|---|
| `perm-convert-medical` | the seven medical pages opened as staff, management and vet |
| `volunteer-read-only` | a volunteer's screens on a real phone |
| `medical-role` | items 1–5; **Claude drove a disposable dev account for part of it**, so this one is partly evidenced |
| `home-screens` | the Director's phone and desk landing, and a tablet if there is one |
| `public-site-findings` | signing in from the phone menu, and reading the Thai notice |
| `dry-run-findings-small` | four items |

`volunteer-schema` and `schema-medication-rounds` are honest `n/a:` — no UI surface.

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — not needed and checked: the branch was created from `origin/main` at `088dda2f` and is 0 behind
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Its closing lines, as printed:

```
=== gates: build exited 0 after 136s

gates: typecheck=0 lint=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit
- [x] Newest release version matches `package.json` — both `0.18.0`, read back from the parsed register
- [x] `unreleased` is empty — emptied by this PR; it held exactly 7 entries and the cut script refused any other count
- [x] **`majorReleasesSince("0.17.0")` returns `["0.18.0"]`** — the call that makes the deploy mail admins
- [x] **The date was read from the local clock** — `2026-10-04`, matching the entry. Same day as `0.17.0`, which is why the record for both goes in one file
- [x] The register parses the way `deploy.mjs` loads it — `0.18.0` / `2026-10-04` / `major: true` / 7 notes, under type stripping
- [x] Order intact — `0.18.0 > 0.17.0 > 0.16.0`, file order still matching a re-sort by `compareVersions` across all 27 entries
- [x] **The cut was verified against the pre-cut register through the parsed module** — `carried across unchanged: 7 of 7`, `text lost: 0`, `text invented: 0`
- [x] **Role tags survived the reorder** — matched by text rather than position: `role tags changed: 0`
- [x] **The notes render clean** — `notes rendering badly: 0`
- [x] `node scripts/check-release-guards.mjs` — all ok, exit 0

### The cut script met a third note shape, and refused rather than guessing

`unreleased` has held two shapes until now: a multi-line object with roles, and
a bare string. This release introduced a **third** — a whole object on one line,
`{ text: "…", roles: [...] },` — and the script threw:

```
Error: unrecognised line in unreleased: "  { text: \"Search on the Residents list now finds a resident by their ID…
```

That is the behaviour worth having. The `0.16.0` cut found a comparison that
keyed on one shape and would have checked two of seven notes while printing
success; the fix then was to compare through the parsed module, and the lesson
was that a check must not quietly skip what it does not recognise. Here the
parser hit something new and **stopped**, rather than dropping the note. It was
taught the shape and re-run.

One thing it still gets wrong, recorded as defect 1: its closing summary counts
a single-line object as "string form", so the printed tally is misleading. The
numbers that matter come from the verification pass, not that line — which is
itself the reason the verification is a separate step.

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration in this PR
- [x] `--env production --status` reviewed — six pending: `0134`–`0139`
- [x] `--env production --dry-run` reviewed — **`0136` reported `FAILED`, and applying was still correct.** See below
- [x] Applied to **dev** and recorded in `schema_migrations` — by #346, #348, #350 and #351 before this release
- [x] File is re-runnable — read rather than assumed
- [x] Existing rows still read correctly after the change — the set is policies, a role, and round tables; #350's plan exercised the medical role against a disposable dev account
- [ ] **Constraints and defaults exercised against real rows** — n/a: no migration in this PR; done in the schema PRs
- [ ] Down-migration written — n/a: no migration in this PR
- [x] Production apply plan stated — **already executed**, before any deploy, and it had to be: `0134`'s consumer is `src/lib/residents/who-and-where.ts` and `0135`–`0138` name `src/lib/medication-list/load.ts` and others, all of which ship here

### The red dry-run was the documented trap, and it was checked rather than assumed

```
dry-run 0134_volunteer_narrowing.sql … ok
dry-run 0135_perm_convert_medical.sql … ok
dry-run 0136_medical_role.sql … FAILED
Failed to run sql query: ERROR:  42883: function sees_all_clinical() does not exist
```

`CLAUDE.md` describes this exactly: each file is dry-run in its own
`begin … rollback`, so a file depending on an earlier **pending** file fails,
and "the trap is that a red dry-run normally means *do not apply*, and here the
correct action was to apply".

Checked, not assumed: `sees_all_clinical()` is created by
`0135_perm_convert_medical.sql` at line 56 — an earlier pending file, rolled
back before `0136` ran. A real apply commits each file before the next starts.
All six then applied `… ok`, which is the confirmation.

So the honest statement is **"the dry-run failed because of how the runner
works"**, not "the file is wrong" — `CLAUDE.md` asks for exactly that
distinction to be reported, because they are not the same claim.

The consumer-header warnings fired as designed, naming files that do not exist
in `0.17.0` — which is correct, since they ship in this release:

```
WARNING 0134_volunteer_narrowing.sql: declared consumer src/lib/residents/who-and-where.ts does not exist in release 0.17.0.
WARNING 0136_medical_role.sql: declared consumer src/lib/home/tiles.ts does not exist in release 0.17.0.
```

`--drift` afterwards, both databases: `No drift: production matches origin/main`
(`139 file(s), 139 applied row(s)`, zero each way) and `No drift: test matches origin/main`.

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no UI in this PR; `/releases` reads the register and what it will read was verified by parsing it in §2
- [ ] Data persists — n/a: the change *is* data, committed to git
- [ ] Create / edit / delete all exercised — n/a: no UI surface
- [ ] Empty state renders sensibly — n/a: no UI surface
- [ ] Invalid input is rejected with a readable message — n/a: no input. The nearest thing is the parser meeting an unknown shape, which §2 covers: it refused
- [ ] Boundary cases checked — n/a: no input. Version ordering across 27 entries is checked in §2

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | `/releases` | all seven, **and the email** | not driven — register parse checked instead |
| management | `/releases` | five (not the Director's, not the public-site note) | not driven |
| staff | `/releases` | five | not driven |
| vet | `/releases` | four | not driven |
| volunteer | `/releases` | four | not driven |
| signed out | `/releases` | page renders; role-tagged notes hidden | not driven |

- [ ] Every role above tested — n/a: no code changed; the tags are data carried across unaltered, asserted by text match in §2
- [ ] A role that should not have access is blocked server-side — n/a: no new access path **in this PR**. The release as a whole changes a great deal about role access, and that is `perm-convert-medical`'s and `volunteer-read-only`'s unsigned role pass

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change in this PR
- [ ] Manual updated — n/a: the manual does not describe the register; the features' own PRs updated it
- [ ] Translatable strings go through the translation path — n/a: release notes are English only by design (#62)
- [ ] Mobile viewport (375px) — n/a: no UI change in this PR
- [ ] Browser console clean — n/a: no UI change, no page loaded
- [ ] Network clean — n/a: no UI change

## 6. Regression

- [x] The pages nearest the change still work — `build` compiles `/releases` and the Worker's `/api/releases/current` with the new register
- [x] Any shared file touched checked from a second, unrelated page — `src/lib/releases.ts` is read by `/releases`, the Worker and `deploy.mjs`; the third was exercised directly by loading the register under type stripping
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing was merged; the branch is `origin/main` plus two files

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` on this branch — n/a: a release cut is not a backlog item
- [ ] Non-obvious design choices added as a new file in `docs/decisions/` — n/a: the one choice here, the note order, is recorded in §1
- [x] `README.md` still accurate — it describes the register and the cut, not the version
- [ ] **Release notes.** — n/a: a release cut *removes* entries from `unreleased`. All seven were written by the PRs that made each change and are carried across unaltered
- [x] Commit messages say why, not just what
- [x] **Claims were measured, not reasoned** — the ones that could have been guessed were each run: the seven-note comparison through the parsed module, the role-tag check by text, `majorReleasesSince("0.17.0")`, and above all `sees_all_clinical()` being created by an earlier pending file rather than missing

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager, after the merge
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: nothing in this PR derives a date at runtime
- [ ] **Boundary or banding change** — n/a: no boundary in this PR
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited** — deferred: release manager, for the deploy output. Everything pasted above is unedited
- [ ] Public pages re-checked after a cache purge or a 10-minute wait — deferred: release manager. **Worth real attention this release:** note 6 is about adopted residents leaving the public Adopt page, and public pages are edge-cached per data centre

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref matches production — deferred: release manager, with `| tee` as `docs/release-procedure.md` now says
- [ ] `strip-baked-env: removed N env var(s)` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: none new

### Migration ordering — *skip if no migration*

- [x] **Does this PR contain both a migration and code that reads it?** — n/a in form; **for the release, yes**, and §3 is that answer: five of the six name consumers shipping here, and all six were applied first
- [x] `--env production --dry-run` run — and its one red result investigated rather than obeyed. §3
- [ ] For a **destructive or rewriting** migration only — n/a: policies, a role and round tables; nothing rewrites data
- [x] Apply plan stated — §3; already executed

### Rollback

- [x] Rollback position stated, including what it does not cover — the Pi serves production, so the rollback is `./scripts/pi/deploy-pi.sh --ref 6ee07cc3`; `npx wrangler rollback --env production` reverts only the Worker fallback. **Neither reverts `0134`–`0139`.** This set is the widest of any release so far: `0134` narrows what volunteers can read and `0135`/`0136` convert medical permissions, so rolling the code back leaves the **narrowed** database policies in place under code that expects the old ones. That is the safe direction for exposure but not obviously safe for function, and anyone rolling back should expect medical and volunteer screens to be the first things to misbehave. **The mail cannot be un-sent**

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | The cut script's closing tally counts a single-line object note as "string form", so the printed summary is wrong | accepted: it is a log line, not evidence. The counts that matter come from the separate verification pass, which reads the parsed register |
| 2 | low | `0133`'s stale "read by nothing yet" note, carried from `0.17.0` | still open; it belongs in the `0.17.0` record, which is also still owed |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | The `0.18.0` title, and the order the seven notes will be mailed in — leading with the Home screen is a judgement about what people meet first | `src/lib/releases.ts`, the `0.18.0` entry |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (release manager session)  Date: 2026-10-04

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: one item, Lutan's, a judgement about text about to be mailed

Manual verification by: pending: the `0.18.0` title and the mailed order of the seven notes

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR body links it and summarises §1 and §3
- [ ] Handed to the production release manager — n/a: this session is the release manager

Result: pass with accepted defects

Release manager acknowledgement: Claude (release manager session), 2026-10-04 — all eight plans read; the six unsigned lines were put to Lutan with the two permission conversions named, and he chose to ship and record the gap. The `0.17.0` record is still owed and is tracked as defect 2 rather than forgotten again
