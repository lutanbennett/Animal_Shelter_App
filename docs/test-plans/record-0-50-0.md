# Test plan — release record 0.50.0

## Header

| | |
| --- | --- |
| Feature | The `0.50.0` release record, the handover rewritten after it, and the cut plan's deploy-time lines answered |
| Branch | `claude/record-0-50-0` |
| Tested SHA | `cbd69edee53e632ae07a061d0e82725c62dec9a9` — the release this documents |
| Environments | none: documents only, nothing is served, imported or rendered |
| Author | Claude (release manager) |
| Date | 2026-11-27 |

## 1. Scope and risk

- [x] Change described in one sentence — three markdown files: the `0.50.0` record, the handover
  rewritten as a delta after it, and `docs/test-plans/cut-release-0-50-0.md`'s twelve
  `deferred: release manager` gate lines answered with what was actually measured
- [x] Files touched listed — `docs/releases/2026-11-27-0-50-0.md` (new),
  `docs/release-handover.md` (rewritten), `docs/test-plans/record-0-50-0.md` (this file),
  `docs/test-plans/cut-release-0-50-0.md` (its section 8 answered). **No code, no migration, no
  configuration**
- [x] Cards affected — none. Nothing here grants or denies anything, and no card, role or policy
  is read or written
- [x] Out of scope, written down — the four items the record lists as Lutan's (the
  `cooperjaidee.org` hand purge, the two `/auth/callback` entries, the two `site_url` moves, and
  the seven test-plan gaps), and the five findings handed to the planner. **A release cuts what
  the build gave it**; none of them is fixed here
- [x] Risk assessed — a documents-only PR. `check-docs-only.mjs` gates the heavy CI jobs off it,
  so `check` and `public-views` are expected to skip, and **skipped is not a pass**: it means
  nothing was checked, on purpose

## 2. Automated gates

- [x] `node scripts/check-release-handover.mjs` — `Current: the handover names 0.50.0`. Worth
  stating why that line is not free: the check reads the handover's **first line only**, so the
  H1 has to carry the version
- [x] Handover length — **122 lines**, against the runbook's ~100 aim and 150 limit
- [x] `node scripts/check-test-plan.mjs --base origin/main` — the way CI runs it, exit 0 on both
  plans in this PR
- [x] `node scripts/gates.mjs` — run on this branch, exit 0 on all four
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit. Read before
  merging, with `headSha` confirmed equal to the pushed head

## 3. Schema and data

- [x] Migration present? — n/a: no migration in this PR. The release's own four (`0446` to `0449`)
  are applied, verified and recorded in the file this PR adds

## 4. Functional checks

- [x] Every figure in the record was read from the command that produced it — the deploy logs
  (production's decoded from UTF-16 with `tr -d` first, as the runbook requires), the Pi logs read
  with `grep` **on the Pi**, `wrangler deployments list`, `curl`, and the inbox
- [x] The record's claims were checked against their sources rather than from memory — the three
  Server Actions keys against their own environment's Pi log, the live Worker version against
  Cloudflare's own answer, and the release mail against the message that arrived
- [x] **The record corrects its own predecessor where that predecessor was wrong**, rather than
  quietly agreeing with it: the DNS blackout's duration and the `0.49.3` tenancy figure
- [x] Nothing in the record asserts a cause that was not measured — the resolver failure is named
  as inferred, and *What this record cannot support* lists the five things it does not establish
- [x] **No personal address, network address, mesh host name or device model is written into
  either file.** The repo is public. The release mail's two refused recipients are described by
  what they are, not by their values, and the sender address is the service's own
- [x] Happy path, persistence, empty state, invalid input, boundaries — n/a: markdown files with
  no behaviour
- [x] Role access matrix — n/a: nothing here is reachable by any login

## 5. Cross-cutting

- [x] Nav, manual, translations, mobile viewport, browser console, network — n/a: no route, no
  component, no manual topic and no string is touched
- [x] Thai strings — n/a: none added. The Thai note this release published was proved
  character-identical by the cut's own 17 assertions

## 6. Regression

- [x] `docs/releases/` gains one file and no existing record is edited
- [x] The handover is rewritten in place, which is what the paperwork budget requires — one file,
  one PR, with the record
- [x] `docs/test-plans/cut-release-0-50-0.md` is edited only to answer lines it had marked
  `deferred: release manager`; no tick was changed and no evidence replaced
- [x] `check-test-plan.mjs` still accepts the cut plan after the edit — exit 0

## 7. Documentation

- [ ] **Release notes.** n/a: nobody using the app would notice a release record, a handover or a
  test plan. Nothing is served, rendered or imported
- [x] Backlog item ticked — n/a: a release record closes no backlog item. The findings this
  release turned up are filed on the `backlog` branch, which is where new items belong
- [x] Decision file — n/a: no design choice is made here. The record and handover **are** the
  durable write-up, and the runbook is unchanged by this release
- [x] `README.md` still accurate
- [x] Commit messages say why, not just what
- [x] Claims were measured, not reasoned — and where a previous record reasoned, this one
  re-measured both ways and says which flags each figure came from

## 8. Pre-production gate

- [x] Tested SHA recorded in the header — `cbd69edee53e632ae07a061d0e82725c62dec9a9`, the release
  this documents, which was also `origin/main`'s tip throughout verification
- [x] Deployed SHA matches the tested SHA — this PR deploys nothing; the release it records was
  deployed from `cbd69edee53e`, read from the deploy's own line on all three Worker deploys
- [x] Deployed to test, smoke-tested — n/a: documents only, nothing to deploy or smoke-test
- [x] Timezone-sensitive behaviour — n/a: nothing here derives a date; the record's dates are
  facts about a past event
- [x] Boundary or banding change — n/a: no threshold
- [x] Evidence pasted is the tool's actual output, unedited — yes, throughout both files, and the
  record says explicitly where a figure came from a different attempt's log (UAT's
  `strip-baked-env`) rather than presenting it as the retry's
- [x] Public pages re-checked after a cache purge — n/a for this PR; done for the release and
  recorded in it, twice, with byte counts
- [x] Supabase project ref line read — n/a: this PR runs no deploy. Read for all three of the
  release's deploys and recorded
- [x] `strip-baked-env` seen — n/a for this PR; **23** on each of the release's three deploys,
  recorded
- [x] Any new secret or env var — n/a: none added. Production still holds 15, read by name only
- [x] Migration and code together — n/a: no migration
- [x] Production dry-run — n/a: no migration
- [x] Fresh production backup — n/a: no migration, and nothing here writes a row
- [x] Apply plan — n/a: no migration
- [x] Rollback position stated, including what it does not cover — revert this PR. It changes
  three markdown files and one test plan, so reverting loses the record and nothing else.
  **It does not, and cannot, roll back the release**: that is the record's own Rollback section,
  and neither path reverts a migration or unsends the email

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
| --- | --- | --- | --- |
| 1 | low | The `0.49.3` handover was the current edition for less than a day, and two of its statements needed correcting in this one: the blackout's duration, and the tenancy figure it inherited from its record | **Accepted, and corrected in place.** This is the handover working as intended — a wrong edition is corrected by its successor rather than by a reviewer — but it is worth a row rather than a silent fix |

## Left for manual verification

| # | What to check | Where |
| --- | --- | --- |
| — | nothing: three markdown files and a test plan, with no surface a person can look at. The release's own unlooked-at items are tabled in the record, under their own plans' signatures | — |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (release manager)  Date: 2026-11-27

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person

Manual verification by: n/a: documents only — nothing is served, imported or rendered, so there is no screen to check

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR body links this plan instead
- [ ] Handed to the production release manager — n/a: the release manager wrote it

Result: pass
