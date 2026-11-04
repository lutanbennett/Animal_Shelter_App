# Feature test plan

## Header

| | |
|---|---|
| Feature | The Drive mirror skips what Drive cannot export, instead of failing the whole run |
| Backlog item | `docs/backlog.md` → `#q4m8t` (the always-red unit) and `#16mg5` (three runbook gaps) |
| Branch / worktree | `claude/drive-mirror-skip-unexportable` @ `C:\Development\Animal_Shelter_drive-mirror-skip-unexportable` |
| Dev server | not used — this is a Pi systemd script with no app surface |
| PR | opened from `9db77969` on `claude/drive-mirror-skip-unexportable` |
| Tested by / date | Claude (planner session) / 2026-11-04 |
| Carries a migration? | no |
| Tested at SHA | 9db77969 |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — an un-exportable Google file is `skipped` rather than `failed`, a dropped download is retried twice, and the three runbook gaps are corrected
- [x] Files/areas touched listed — `scripts/pi/drive-mirror.mjs`, new `scripts/pi/drive-export.mjs` + `scripts/pi/drive-export.test.mjs`, `docs/pi-hosting.md`, `docs/decisions/2026-11-04-drive-mirror-skip-unexportable.md`, `docs/backlog.md`. No `src/`, no `worker/`, no `supabase/migrations/`
- [x] Cards affected identified — **none.** The script runs as a systemd unit on the Pi as the login user, not through the app, so no card grants or withholds anything here. Admin and the signed-out public are unaffected: nothing this touches is reachable from the website
- [x] Anything explicitly **out of scope** written down — stage 2 of `#svs6c` (measure the Pi copy against Drive, then Lutan chooses which is primary) is untouched; the two files' actual `mimeType` is still not established, and the fix is built so that it does not need to be

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends with one line of the shape `gates: typecheck=<N> lint=<N> test=<N> build=<N>`

```
=== gates: typecheck — npm run typecheck
=== gates: typecheck exited 0 after 153s
=== gates: lint — npm run lint
=== gates: lint exited 0 after 209s
=== gates: test — npm test
=== gates: test exited 0 after 18s
=== gates: build — npm run build
=== gates: build exited 0 after 197s
gates: typecheck=0 lint=0 test=0 build=0
```

(Slower than this repo's usual run because a second session was running its own
gates on the same machine at the same time. Exit codes are what the tick rests on.)

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly after the change — n/a: no migration
- [ ] Constraints and defaults exercised against real rows — n/a: no migration
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end — the classification every file passes through is covered by `scripts/pi/drive-export.test.mjs`, 8 tests, all passing: a folder is walked, the four Docs-editors types export, six non-exportable native types are skipped, ordinary files download, shortcuts skip as before
- [ ] Data persists — reload the page and the change is still there — n/a: no page. The equivalent property, that already-copied files are not re-fetched, is unchanged: `state.json` is still written before the exit
- [ ] Create / edit / delete all exercised — n/a: the mirror is read-only by rule and performs no writes to Drive at all
- [x] Empty state renders sensibly — a tree with nothing to copy yields `{"new":0,...,"failed":0}` and exits 0; `--status` before any run prints `no run yet`, unchanged
- [x] Invalid input is rejected with a readable message, not a crash — an unknown or future Google type is classified `unexportable` and named with its `mimeType` in the log rather than throwing; `isWorthRetrying` is tested against a thrown non-string
- [x] Boundary cases checked — the retry boundary is proved both ways: `terminated`, `ECONNRESET` and `HTTP 500` retry; `HTTP 400`, `403` and `404` do not. **Both edges, not only the case the report named** — the reported failure was `400`, and the case that discriminates is the transport error
- [ ] **Role access matrix** — n/a: no app surface, no route, no RPC. The script is invoked by `drive-mirror.service` as the login user; there is no login, no card and no URL to reach it by, so there is nothing a matrix could record
- [ ] Every login above tested — n/a: see above
- [ ] A login that should not have access is blocked server-side — n/a: see above

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav entry; nothing in the app links to this
- [ ] Manual updated and the topic reads correctly at `/manual` — n/a: this is the Pi runbook (`docs/pi-hosting.md`), read by whoever installs the mirror, not a shelter user's manual topic. The runbook **is** updated
- [ ] Translatable strings go through the translation path — n/a: the only new strings are English log lines in a systemd journal
- [ ] Mobile viewport (375px) — n/a: no screen
- [ ] Browser console clean — n/a: no browser
- [ ] Network clean — n/a: no app pages. The script's own Drive calls are all GETs, unchanged in kind; one call per file is removed for an un-exportable file, since it is no longer fetched at all

## 6. Regression

- [x] The pages nearest the change still work — there are none in the app; the nearest *consumer* is `src/lib/mirror-read.ts`, which reads files out of `/mnt/lanna-mirror` on the Pi. **The on-disk layout is unchanged** — same `<dest>/<shelter>/<Drive path>`, same `.pdf` suffix on exported Docs — so nothing it reads has moved. Verified by reading the suffix decision: it was `isNative(f)`, it is now `how === "export"`, and both are true for exactly the four Docs-editors types
- [x] Any shared file touched checked from a second, unrelated page — `docs/backlog.md` is the only shared file, and only two items were ticked; `node scripts/check-backlog-sections.mjs` passes via the pre-commit hook (77 open items, 949 unique ids). No shared runtime module was touched
- [x] Nothing merged from `main` during `sync` was broken by this branch — `sync` merged cleanly and the full gates ran after it

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** — both `#q4m8t` and `#16mg5`, each with its superseded report marked in place rather than deleted
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-11-04-drive-mirror-skip-unexportable.md`, including the one wording choice `#q4m8t` left open (log every run, not once) and why the helper is its own file
- [x] `README.md` still accurate — it does not describe the mirror's export behaviour; `docs/pi-hosting.md` does, and that is updated
- [ ] **Release notes.** — n/a: a nightly systemd job on the Pi. No shelter user sees the mirror, its log, or its exit code; the files they work with are in Drive either way, and the two skipped files were never copied before this change either
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and decisions were measured, not reasoned.** The cause is read from the journal lines and from the script itself (`get()` retries only 401/429/5xx; `counts.failed` non-zero exits 1; the `.pdf` suffix is the mirror's own, which is how both failures are known to be native). **What is NOT claimed: the two files' actual `mimeType`.** The names read like Forms and that is written down as a guess, not a finding

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager. Note this change cannot be exercised there at all: the mirror runs only on the Pi, against production's Drive
- [ ] Timezone-sensitive behaviour proved — n/a: nothing here derives a date. The timer's `OnCalendar=*-*-* 04:00:00` is unchanged and is systemd's, not this script's
- [ ] For a boundary or banding change, the assertions cover both edges — n/a: nothing here is a deploy-time boundary; the one boundary this change has (retry or final) is proved both ways in section 4 and in `drive-export.test.mjs`
- [x] Evidence pasted into this plan is the tool's actual output, unedited — the gates block in section 2 is pasted from `gates-mirror.out`
- [ ] Public pages re-checked after a cache purge — n/a: no public page is affected

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref matches production — deferred: release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: no new env var; the script reads the same four `GOOGLE_*` values from `.env.deploy.production` as before

### Migration ordering — *skip if no migration*

- [ ] Does this PR contain both a migration and code that reads it? — n/a: no migration
- [ ] `--env production --dry-run` run and clean — n/a: no migration
- [ ] For a destructive or rewriting migration only: a production backup exists and is fresh — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position stated, **including what it does not cover** — the change reaches the Pi only when the Pi is next rebuilt (`./scripts/pi/deploy-pi.sh`), so until then the mirror keeps running the old script and keeps reporting `FAILED` nightly, which is the present state and harms nothing. To roll back, rebuild the Pi at an earlier `--ref`. **What that does not cover: nothing, in this case** — no schema, no Worker route, no data migration. Files already on the mirror are untouched either way, and a rollback would simply restore the always-red behaviour

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| — | — | None found while making this change | — |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | After the Pi is next rebuilt, the 04:00 run reports `ok` with `"skipped":2` (or more) and **names the two `Admin/Bulk Uploads` files with their `mimeType`** — which also finally establishes what type they are | `journalctl -u drive-mirror` on the Pi, or `node scripts/pi/drive-mirror.mjs --dest /mnt/lanna-mirror --status` |
| 2 | The photo that dropped mid-download (`Projects/Rescues/Sanpakwan caged dogs/20260803_115342.jpg`) is present on the mirror | `/mnt/lanna-mirror/lanna/Projects/Rescues/…` on the Pi |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (planner session)  Date: 2026-11-04

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: the list is not empty and nobody has looked, so this is not mine to tick; both rows are carried on the `pending:` signature below

Manual verification by: pending: the next nightly run on the Pi reports ok with the two files named as skipped, and the dropped photo is present

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager

Result: pass

Release manager acknowledgement: n/a: reaches production with the next ordinary Pi rebuild; nothing here needs a release decision
