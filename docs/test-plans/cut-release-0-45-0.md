# Feature test plan

---

## Header

| | |
|---|---|
| Feature | Cut release `0.45.0` — **major, and it mails** |
| Backlog item | n/a: a release cut closes no backlog item |
| Branch / worktree | `claude/cut-release-0-45-0` @ `C:\Development\Animal_Shelter_cut-release-0-45-0`, port `3001` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3001` |
| PR | opened after this commit |
| Tested by / date | Claude Opus 5 (production release manager session) / 2026-11-12 |
| Carries a migration? | no — the release carries seven (`0359`–`0365`); the cut PR itself carries none |
| Tested at SHA | filled in at the commit that opens the PR; the release range is `5867f864..HEAD` |

## 1. Scope and risk

- [x] Change is described in one sentence — nine notes earned by the release plus one owed note move from `unreleased` into a new `0.45.0` entry, and `package.json` goes to `0.45.0`
- [x] Files/areas touched — `src/lib/releases.ts`, `package.json`, `package-lock.json`, and this plan. Nothing else
- [ ] Cards affected identified, plus whether admin and the signed-out public are affected — n/a: the cut changes no card's behaviour and gates nothing. One carried note is tagged `who_does_what` (from #1528) and one is tagged nothing deliberately, because the offline page is seen by everyone signed in
- [x] Out of scope, written down so the release manager is not surprised — **the seven migrations, all three deploys and the three Pi builds are the release, not the cut.** No code was written for this release: per `docs/release-procedure.md`, *a release cuts what the build gave it*. The one exception is the single release note discussed under §7, which the runbook requires the cut to publish

## 2. Automated gates

- [ ] `node scripts/worktree.mjs sync` — n/a: the worktree was branched from a freshly pulled `origin/main` (`ffd63a858`) minutes earlier, so there was nothing to merge in. `git status -sb` showed neither ahead nor behind
- [x] `node scripts/gates.mjs` ends with four gates each at exit code `0` — the run, as it printed, is below

```
=== gates: typecheck — npm run typecheck
=== gates: typecheck exited 0 after 8s
=== gates: lint — npm run lint
=== gates: lint exited 0 after 176s
=== gates: test — npm test
=== gates: test exited 0 after 52s
=== gates: build — npm run build
=== gates: build exited 0 after 58s
gates: typecheck=0 lint=0 test=0 build=0
```

**The 58-second build is a warm Turbopack cache, not a build that did not run.** `gates.mjs` was run
twice: the first pass built cold in **204s** and ended on the same four zeros, and this pass reused
that tree. Both are read from each gate's own exit code, which is what the runbook asks for — a
build that passes in seconds is checked rather than assumed either way. **The first pass was
backgrounded through `| tail -30`, which discarded three of the four `=== gates:` lines** — the trap
`docs/release-procedure.md` names in writing. Re-run with `tee`, which is why the block above is
complete. My error, and it cost one gates cycle.

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit. **Before merging, the run for the current HEAD is read with `gh run view <id> --json status,conclusion,headSha` and its `headSha` confirmed to be the commit pushed last**

### The cut's own assertions, which are the real check

A cut's one real failure mode is losing or altering a note, and that is invisible to every gate.

- [x] **All 17 cut assertions pass, against an explicitly built base.** `--verify` compares with
  `origin/main:src/lib/releases.ts`, which stops being the pre-cut state the moment a cut **adds** a
  note — so against plain `origin/main` two assertions failed on `[10 vs 9]`, which is this release's
  one owed note and nothing else. Re-run against a base built as *`origin/main`'s `unreleased` plus
  that one note*, all 17 pass:

```
ok   every note carried across character-identical, with its role tags, same order
ok   nothing invented (note count equal)  [10 vs 10]
ok   mail PRESENCE: majorReleasesSince(previous) is exactly the new version  [["0.45.0"]]
ok   control: from further back, an older major release is still found  [0.44.0 in ["0.45.0","0.44.0"]]

all 17 assertions passed
```

- [x] **The mail is asserted as a PRESENCE, with a control.** This release mails, so the assertion is
  that `majorReleasesSince("0.44.3")` returns exactly `["0.45.0"]` — and, from further back, that it
  still finds `0.44.0`, which is what stops an always-answering function satisfying it
- [x] `node scripts/check-release-guards.mjs` — exit **0**, **32** assertions, counted with `grep -c "^ok"`
- [x] `node scripts/check-test-plan.mjs --base origin/main` run the way CI runs it — exit **0**
- [x] **Audit.** `npm run audit:prod` exits 1 with 5 vulnerabilities (1 moderate, 4 high); `npm run audit:register`, which is what CI runs, exits **0**: one high advisory, `GHSA-5j98-mcp5-4vw2` (`glob`), registered in `docs/advisory-register.json` and still unreachable here. **The cut bumps `package.json`, so CI's `audit` runs for real** — `skipped` would not have been a pass
- [x] **The deferred-note gate was answered, not waved through.** `check-deferred-notes.mjs` listed **31** candidates from an older cut point (100 plans, as the runbook says it over-lists); every one was answered in `--deferred-reviewed`, and the durable answers are in §7 and in the release record

## 3. Schema and data

- [ ] Every line in this section — n/a: **the cut PR carries no migration.** The release's seven (`0359`–`0365`) each landed in their own PR, were applied to dev there, and are applied to production and UAT by the release manager before the deploys. Their numbering, dry-run, re-runnability and down-migrations were each checked in their own plans; the apply plan for this release is in §8 and the readings are in the release record

## 4. Functional checks

- [x] Happy path works end to end — `/releases` was **loaded** on the worktree dev server (HTTP 200, 639,652 bytes) with a disposable one-card login, and the new `0.45.0` section renders: `0 × [object Object]`, `0 × undefined`, and every note that login should see present. **And the card tagging was measured with two logins, which is what `0.44.3` could not do:**

```
login holding exactly my_tasks        → 8 untagged notes render; BOTH who_does_what-tagged notes absent
login holding exactly who_does_what   → both tagged notes render, and the untagged ones too
```

  So a card-tagged note is shown to a holder and withheld from a non-holder, and the one new untagged
  note (the offline page) is shown to both. The logins were keyed to this port with `--cards`, so no
  other running stream was signed out, and `--remove` was deliberately **not** run
- [ ] Data persists / create-edit-delete / empty state / invalid input / boundary cases — n/a: the cut adds no page, control, form or stored value. It edits two data files. The failure modes that exist here are "a note was lost or altered" and "the mail flag is wrong", and both are asserted mechanically in §2 rather than clicked

### Role access matrix

- [ ] Every login tested / a login that should not have access is blocked server-side — n/a: no card gates the cut and it adds no route. `/releases` was already open to every signed-in login, and note **audience** is decided per note by its `cards` tag, which the carried-across assertion proves unchanged

## 5. Cross-cutting

- [ ] Nav entry / manual / translatable strings / mobile viewport / console / network — n/a: no page, nav entry, manual topic or string path changed. The release notes are not translated: they are shown as written, which is why the Thai in two of this release's features is listed for a person in **Left for manual verification** rather than ticked here

## 6. Regression

- [x] The pages nearest the change still work — `/releases` is the only page that reads `src/lib/releases.ts`, and it was **loaded**, not read. `/api/releases/current` reads it in the Worker bundle and is covered by the order and `latestRelease` assertions plus the build gate
- [x] Shared file touched, checked from a second unrelated page — `src/lib/releases.ts` is also read by `scripts/deploy.mjs`, which refuses a mismatch between `package.json` and the newest entry; the three-way version assertion (`lock 0.45.0 / root 0.45.0 / package.json 0.45.0`) is that check made ahead of the deploy
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing was merged; see §2

## 7. Documentation

- [ ] Backlog item ticked on this branch — n/a: a cut closes no item. `#dxjz2`, the one feature whose step this release closes, was ticked in its own PR (#1535)
- [ ] Non-obvious design choices as a new file in `docs/decisions/` — n/a: the cut is mechanical. The one judgement in it — which deferred note this release owes — is recorded in this plan and in the release record, where the next release manager looks
- [x] `README.md` still accurate
- [ ] **Release notes.** Would a shelter user notice this change? — n/a: a cut **empties** `unreleased`, and the checker holds a tick to the diff having *gained* a line, so `n/a` is the honest state on every cut plan. What this cut publishes is set out below
- [x] Commit messages say why, not just what
- [x] **Claims here were measured, not reasoned** — the note count from `[10 vs 10]` against an explicitly built base rather than from reading the file over; the mail from the presence-and-control pair rather than from `major: true`; the pending counts from `--status` on all three databases; the audit from `audit:register`'s own exit code; and the `/releases` render from loading the page

### The one note this cut publishes, and the thirty it does not

`check-deferred-notes.mjs` named 31 candidates. For each, the question is whether **this** release
closes the step its plan named. One does:

- **`worker-cpu-fallback-paper` (#1535) — closed by this release.** Its `n/a` reason was *"the change
  reaches users only with Lutan's production Worker deploy"*, and this release is that deploy. The
  change is real and a user meets it: when the Pi does not answer, the Worker now serves the public
  website and answers the app with a short offline page instead of rendering the app itself and being
  killed for exceeding its CPU limit. A part-way save is refused outright where it provably never
  arrived, and otherwise still says to check it. **So the note went into `unreleased` at this cut**,
  untagged, because everyone signed in can meet it. This is the mechanism
  `docs/decisions/2026-10-11-release-note-truth-rule.md` prescribes and the one `0.44.3` used for Bills

Three worth naming because they look closed and are not:

- **`foundation-document-store`** — `0362` *is* applied by this release, but its reason named three
  steps and the other two are open: assigning either card in Settings, and Lutan's go on the
  information protection. A note would promise users a page they cannot yet reach
- **`donate-promptpay-qr`** — the shelter's own PromptPay id and QR image are still not entered, so
  nothing works end to end for a giver yet
- **`hsts-one-year`** — genuinely closed by this cut and deploy, and still owes nothing: no shelter
  user notices a longer HSTS `max-age`

The rest were planner handovers, release records, developer instruments, out-of-range candidates from
the older cut point, and changes nobody would notice. Every one has a one-line answer in the
`--deferred-reviewed` argument recorded on this PR.

## 8. Pre-production gate

| Host | What it is | Database |
|---|---|---|
| `lannacareforanimals.org` | **production** | `dbkodyyxxhtygxcxmfcu` |
| `test.lannacare.org` | **test** | the **dev** project, `qxkmhwybjggxvsfxsxbd` |
| `uat.lannacare.org` | **UAT** | its own project, `fsjagxmxjosauwmxwype` |

All three were on `0.44.3` from `5867f864` when this release began, read from `/api/version` on each.

### Tested build

- [x] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — `ffd63a858` at the cut; re-checked against `origin/main` immediately before the deploy is handed over
- [ ] Deployed SHA matches the tested SHA — deferred: release manager, read from each `deploy.mjs` run's own output. **The code-identity diff is the assertion, not SHA equality**, and it is recorded in the release record

### On the deployed build

- [ ] Deployed to test / smoke-tested on `test.lannacare.org` / public pages re-checked after a purge — deferred: release manager, at deploy time, recorded in the release record
- [ ] Timezone-sensitive behaviour — n/a: the cut derives no date. The entry's date is a literal written into the file and asserted against the requested value
- [ ] Boundary or banding change — n/a: no threshold, band, rounding rule or cutoff in this diff. The one ordering property (`compareVersions`, newest first) is asserted
- [x] Evidence pasted here is the tool's actual output, unedited — the gates block, the assertion lines and the `/releases` reading are all copied from their runs

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` read and the ref matches production / `strip-baked-env: removed N` seen / any new secret exists in production — deferred: release manager, at deploy time. **This release adds no secret or environment variable**, so the third is a confirmation rather than a change

### Migration ordering

- [ ] Does this PR contain both a migration and code that reads it? — n/a: the cut PR carries no migration. Across the **release**, each migration and its consumer merged in their own PRs, which is why the apply comes before the deploys
- [ ] `--env production --dry-run` run and clean — deferred: release manager, immediately before the apply
- [ ] Destructive or rewriting migration: a fresh production backup exists — deferred: release manager. **`0361` rewrites rather than adds**: it takes four unused edit settings off the activity list, which recomputes stored rows. So before-pictures of the table it writes (`role-cells` **and** `role-cards`) are taken before the apply and re-read after, per the runbook's *read the table the change actually writes*
- [x] Apply plan stated — `0359`–`0365`, in that order, to **production** (`dbkodyyxxhtygxcxmfcu`) and **UAT** (`fsjagxmxjosauwmxwype`), **before** any deploy to either. Test's database (dev) already holds all 367 with 0 pending and no drift

### Rollback

- [x] Rollback position stated, including what it does not cover — production is served by the Pi, so the rollback is `./scripts/pi/deploy-pi.sh --ref 5867f864` on the production clone (a rebuild, about five minutes); `npx wrangler rollback --env production` reverts only the Worker fallback. **Neither reverts a migration, and neither unsends the mail.** Of the seven, six are additive or `create or replace` function bodies and are safe to leave; **`0361` is the one that rewrites**, and its reversal is the before-picture of `role-cells` / `role-cards` taken in the step above, not an automatic rollback

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| — | — | None found in the cut | — |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | **The release mail.** That it arrives, that its subject starts `[Production]`, and that the sender's name does not say *UAT*. `0.42.0` and `0.43.0` went out titled `[UAT]`; `RELEASE_MAIL_ENV: "Production"` was set on 2026-11-06 and **no release has mailed since, so this is the first proof** (`#w4k9n`) | Lutan's inbox, after the production deploy |
| 2 | **The Thai on the offline page**, which is the stream's own and has not been read by a Thai speaker — as is the Thai in the four refusal-key notes this release ships | a Thai reader |
*(The note-audience question that `0.44.3` left here is **closed** — measured with two card-keyed logins in §4, not left for a person.)*

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude Opus 5 (production release manager session)  Date: 2026-11-12

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — pending: the list is not empty and nobody has looked yet; only the person who looks may tick this

Manual verification by: pending: a Thai reader for the offline page and the refusal wording. The other item is CLOSED, and not by a person: the mail arrived, and its subject (`[Production] Lanna Care release 0.45.0: …`) and sender name (`Lanna Care Production`) were read from the message itself — in docs/releases/2026-11-12-0-45-0.md

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager — this session is the release manager; the one step that is Lutan's is the production Worker deploy

Result: pass
