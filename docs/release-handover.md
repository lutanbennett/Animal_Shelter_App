# Release handover — written 2026-11-02 after `0.41.2`

A **delta**. The durable rules are in `docs/release-procedure.md` and this release's own record is
`docs/releases/2026-11-02-0-41-2.md`. **Both outrank this file.**

## START HERE

**`0.41.2` is deployed on both environments, from one SHA.** Both Pi clones at `9cd14859` (pinned with
`--ref`), the production Worker built from `9cd14859` and confirmed from Cloudflare as version
`9e1ba1f1` at 100%, tagged `v0.41.2`; the test Worker likewise. **`main` did not move during this
release at all**, so there is no second pair of SHAs to reconcile. **302 of 302 applied**,
`No drift: production matches origin/main`, cron healthy, every held card fully applied, every
permission cell backed by a card. **It did not mail**, on Lutan's answer, and the deploy says so itself:
`deploy: no major release new to production (was 0.41.1), so no email.`

**`--drift test` exits 1, and it is NOT this release's doing.** Dev holds a stale row for
`0302_retire_audit_activities.sql`, the name #1204 gave the file before renumbering it to `0301`.
Nothing is missing from dev (`not applied here: 0`), so dev is still a valid pre-production check.
**Filed on the `backlog` branch under *Architecture* rather than fixed here**, and it will report on
every release until someone deletes the row.

**Re-measure before trusting any of this.** `git fetch`, `git diff --stat 9cd14859..origin/main`,
`gh pr list`, `--status --env production`, `node scripts/check-production.mjs all`, `/api/version`.

## The release cost two touches, which is the target

His answer on the email, and his deploy. Nothing else.

**The migration apply was Claude's this time and did not refuse.** `0.41.1`'s edition recorded the
auto-mode classifier refusing it twice, the second time naming `[Production Deploy]`, and asked him
whether to add an allow rule. **He had not answered, and on this evidence it is not needed** —
`apply-migrations.mjs --env production` ran from the main checkout, exit 0 read from the command. One
clean run is not proof it will never refuse again, so **if it refuses, say so and hand it over rather
than treating it as a new fault.** Do not re-raise the allow rule unprompted.

## Corrections and closures to the last edition

- **The two `~/stale-next-types-{prod,test}-0.40.11` folders are GONE.** Three editions called them safe
  to delete and none did. `rm -rf` over `ssh` worked first time, exit 0, both confirmed absent — the
  "Claude's remote writes outside `deploy-pi.sh` are refused" claim did not hold for this. 336 KB, worth
  nothing except that it stops being recopied. **Closed. Do not carry it again.**
- **`ANTHROPIC_API_KEY` stays closed.** Measured last release, eleven secrets with no such name. Nothing
  to re-check.
- **`cut-release.mjs --verify` needed `--base <file>` again**, because this cut added two notes. Expect
  it on every release that publishes a deferred note, which the security rebuild keeps producing. The
  first run's refusal is the evidence the check discriminates, not a problem.
- **`release-prs.mjs` was short by three docs-only squash merges again** (#1180, #1187, #1192, all
  planner handovers). Its exit 0 is correct and not reassuring. **Read `gh pr list --state merged` by
  `mergedAt` too and add the numbers by hand** — that is now two releases running.
- **`doctor-cells` reads `MISSING 5 of 12`, unchanged from last release**, and the same five names:
  `medical.weight`, `photos.resident_add`, `resident.adoption_news`, `resident.microchip`, `visit.book`.
  Lutan is testing one card at a time on Doctor. **Never restore its cards and never edit the check.**
  Name the cells, not the number.
- **`audit` ran for real on the cut** (it changes `package.json`'s version string) and passed.
  `audit:prod` still reports the `glob`/`minimatch` chain, `audit:register` exits 0, the register is the
  gate. Unchanged.
- **`npm ci` in the main checkout was needed this time**, and measured rather than assumed: the
  release-range diff of `package.json`/`package-lock.json` was **not** empty. The build banner then read
  `Next.js version : 16.4.2`, matching `package.json` and the lockfile.
- **Both Pi caches are rebuilt and under the ceiling** (612 MB and 615 MB, `kept`). Last edition
  predicted cold builds and that is what these were; **the next release's should be quick again.**

## New this release

- **The two Pi clones built different stylesheets, and last edition's line about that is retired.**
  `0.41.1`'s record said the same filename and byte count on both hosts is *"expected here, not a
  mix-up"*. **It is not a property to rely on.** Production served `3-dgwzl6jfh0i.css` at 98735 bytes and
  test `2_kdr9t9pti8v.css` at 98670. Both clones clean, both at `9cd14859`, each host's `check-assets`
  green against its own build. Diffed: production carries two extra rules, `.z-2` and `.\!p-9`, and
  **those class names appear nowhere in the source except as accidental byte sequences inside
  `public/manual/resident-photos.png` and `public/manual/blood-test-new.png`**, which both clones hold
  identically. Tailwind's scanner extracted two candidates from binary noise on one build and not the
  other. Nothing uses either class, so nothing renders differently. **The per-host check is the check;
  the cross-host comparison never was one.**
- **The deferred-note guard's window is far wider than the release range** — 43 candidates over 122 test
  plans — and several print the plan **template's own boilerplate** instead of a reason. Last edition
  noticed three; there are more. **Read the plan, not the excerpt.** Of the 43 this release: two closed
  here, fifteen already published earlier, eleven correctly withheld on a step this release does not
  close, the rest invisible.
- **Two notes were written in the cut**, and both were right to be: the desexing sign-up (its
  `0292`/`0297` condition had closed and this release carried #1177's code) and the *See the Thai queue*
  card (`0298` applied here). Neither is ticked on the cut plan's §7 line, which is correct — a cut
  **empties** `unreleased`.
- **The live `translations-unlisted` check is now a release step** (`docs/release-procedure.md`, after the
  apply, on **both** databases). Run and clean this release, which closed
  `docs/test-plans/translations-unlisted-live-half.md`'s `pending:` line.

## In flight and open

- **16 of 37 plans shipped signed `pending:`**, on his decision, grouped in the record. Two clusters do
  most of the work: a bilingual read of new Thai, and pages whose write paths were converted but never
  pressed by hand. **The desexing form is the one worth a real look**, because this release made its
  behaviour live and it is the only public page in the eight notes.
- **ANSWERED 2026-11-02 BY LUTAN, ASKED DIRECTLY: *leave them.* STOP RAISING IT.** Put to him in the
  closing round of `0.41.2` — five cards are held by no role (`manage_medical`, `translations`,
  `propose_translations`, the new `view_translations`, and `assistant`), with the consequence spelled out:
  the death-recording note stays withheld, and several notes from the last three releases reach nobody but
  Admin. He chose to leave them. **It is his action on Settings → Who does what, not a release matter, and
  it is not a defect, a gap or a decision anyone is owed.** Four editions listed it as open before it was
  ever asked, which is the fault `CLAUDE.md` names: nobody re-asks a question they believe is already with
  him, so a false block is silent. **Do not re-raise it, do not record it as outstanding, and do not
  assign a card to "fix" it.** If a future release's note is withheld for the same reason, say so in that
  release's record in one line and move on.
- **The whole signed-out surface is still unverified** and `PUBLIC_SITE` is `locked`. `0.41.0` changed
  every public page's frame. **The release that unlocks the site inherits all of it at once.**
- **Nothing behind sign-in was verified**, on either environment: no account. Date handling for Thailand
  sits in that gap.
- **Carried, re-measure each:** the restore drill, never exercised; video playback on a real handset; the
  Worker-fallback 44-second gap found in the power-pull drill (its own backlog item under *Architecture*,
  cause not established). **`tee` under PowerShell still writes UTF-16** — `tr -d '\000'` before grepping.

**Next free migration number: `0303`.** `0301` is the highest on `main` and `0302` is best left alone:
dev still holds the stale `0302_retire_audit_activities.sql` row, so a new file of that number would make
every drift listing read as two conflicting `0302`s. Check `origin/main` *and* open `*-schema` PRs anyway.
