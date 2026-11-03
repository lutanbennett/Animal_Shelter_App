# Release handover — written 2026-11-03 after `0.41.3`

A **delta**. The durable rules are in `docs/release-procedure.md` and this release's own record is
`docs/releases/2026-11-03-0-41-3.md`. **Both outrank this file.**

## START HERE

**`0.41.3` is deployed on both environments, from one SHA.** Both Pi clones at `befdeeb8` (pinned with
`--ref`), the production Worker built from `befdeeb8`, the test Worker likewise. **`main` moved once
after the cut** (#1238) and the deployed SHA is that tip, not the cut's merge commit — the
code-identity diff between the two is **empty**, so nothing served differs and nothing was done about
it. **306 of 306 applied**, `No drift` on **both** databases, cron healthy, every held card fully
applied, every permission cell backed by a card. **It did not mail**, on Lutan's answer.

**Re-measure before trusting any of this.** `git fetch`, `git diff --stat befdeeb8..origin/main`,
`gh pr list`, `--status --env production`, `node scripts/check-production.mjs all`, `/api/version`.

## The migration apply was refused again — and the answer is still "hand it over"

The auto-mode classifier refused `apply-migrations.mjs --env production`, naming `[Production Deploy]`.
Lutan ran it; all four applied cleanly. **That is a third touch on a release whose target is two, and
it is recorded in the record as an avoidable cost.**

**The pattern across four releases, which is the part worth knowing:** `0.41.1` refused twice,
`0.41.2` ran clean, `0.41.3` refused. **So neither a clean run nor a refusal tells you what the next
one will do.** Do not plan the release around either.

**Do NOT ask for an allow rule.** `0.41.2`'s edition closed that as *not needed on this evidence* and
said to hand it over if it recurred, which is exactly what happened. Asking again on a second refusal
re-asks him something already settled. **If it refuses a third time, that is the moment** — put the
whole pattern to him then, with all four readings, rather than one release's experience.

## Corrections and closures to the last edition

- **The `0302` warning is CLOSED, and the stale dev row is gone.** The last edition said `--drift test`
  would exit 1 on every release until somebody deleted dev's stale `0302_retire_audit_activities.sql`
  row, and that `0302` was best left alone. A stream took `0302` anyway. Measured: the row has since
  been deleted, dev reads `306 applied, 0 pending` with nothing applied that has no file, and
  **`--drift test` ends `No drift`**. One `0302`, no ambiguity. **Do not carry it again.**
- **`cut-release.mjs --verify` needed NO `--base` file this time**, and the reason generalises: **no
  note was written in the cut.** All seven came from the streams that did the work, so the assertions
  ran against `origin/main` itself, which is the stronger form. Expect `--base` only on a release that
  publishes a deferred note in the cut.
- **The Pi caches stayed warm and both builds were quick**, exactly as the last edition predicted after
  its cold ones: 629 MB and 632 MB, both `kept`.
- **The two hosts' stylesheets differ again** (107 bytes, different filenames) and it is **still not a
  finding** — `0.41.2`'s record established the cause and retired the cross-host comparison. The
  per-host `check-assets` is the check. **Stop re-deriving this.**
- **`release-prs.mjs` was short by two squash-merged planner handovers again** (#1226, #1235). **Three
  releases running.** Its exit 0 is correct and not reassuring: read `gh pr list --state merged` by
  `mergedAt` too and add the numbers by hand.
- **`doctor-cells` reads `MISSING 5 of 12`, unchanged for three releases**, same five names:
  `medical.weight`, `photos.resident_add`, `resident.adoption_news`, `resident.microchip`, `visit.book`.
  Lutan tests one card at a time on Doctor. **Never restore its cards and never edit the check.** Name
  the cells, not the number.
- **`audit` ran for real on the cut** and passed; `audit:prod` still reports the known `glob`/`minimatch`
  chain and `audit:register` exits 0. Unchanged.
- **`npm ci` in the main checkout was NOT needed this time, and that was measured**: the release-range
  diff of `package.json`/`package-lock.json` is empty. Run it anyway — the point is that nobody notices
  the release where it matters.

## New this release

- **The "minor release" trap fired, and the prescribed question defused it in one round.** He asked for
  "a minor release". In his usage that means the middle-number bump; in `releases.ts` `major` means
  *worth an email*. The runbook's instruction — **ask about the EMAIL, never about "major or minor"** —
  was followed verbatim and produced an unambiguous answer in one exchange. **It is not a theoretical
  trap and the remedy works. Use the exact question.**
- **The deferred-note window keeps growing: 48 candidates, up from 43.** Two closed here, six already
  published earlier, nineteen correctly withheld, the rest invisible. Several still print the plan
  template's own **boilerplate** instead of a reason. **Read the plan, not the excerpt**, and budget
  real time for it — this is now the single largest reading task in a release's pre-cut phase.
- **THE TEST WORKER DEPLOY FAILED AND ITS OWN BUILD GUTTED `node_modules` IN THE MAIN CHECKOUT.** 484
  packages down to ~70, directories left **empty**, `esbuild` gone, no reparse points behind. `npm ci`
  restored it and the retry succeeded, so the release was not blocked — **but expect this and know the
  shape, because the error it prints points at the wrong thing.** The visible failure is
  `Could not resolve @opennextjs/aws/dist/adapters/server-adapter.js`, which reads like a code or
  dependency fault; the real tell is the ENOENT storm **above** it, naming nearly every package's
  `package.json`. **If you see either, check `ls node_modules | wc -l` before anything else** — 484 is
  right, 70 is gutted — then `rm -rf .open-next`, `npm ci`, and run the deploy once more.
  **Cause not established**, filed on `backlog` under *Architecture*; the suspect is the Windows junction
  preload (`scripts/win-junction-symlinks.cjs`) that `opennext:build` loads with `node -r`.
  **It happened fifteen minutes after a clean production build from the same `node_modules`, so do not
  read it as a checkout that was already broken.** And **do not blame a concurrent
  `worktree.mjs done`**: one was running and it is the obvious story, but its process started three
  minutes *after* the damage timestamps. Check times before you accuse another session.
- **While a build is in flight in the main checkout, run nothing else there** — not even something that
  does not build, like the home-icon sync. The `0.40.9` rule was written about `.open-next`; after this
  release, treat the whole folder that way.
- **A `tail`-free gates log is worth the redirect.** `0.41.2`'s plan could quote only `build`'s per-gate
  line because the run was piped through `tail`. Redirect to a file in the scratchpad and all four
  `exited 0 after <S>s` lines survive, which is what the plan template now asks for by name.

## In flight and open

- **10 of 23 plans shipped signed `pending:`**, on his decision, grouped in the record. Three clusters:
  a Thai read of new Thai (4), a press with a card-limited login (4), and two documents for him to read.
  **The adoption-update videos are the one worth a real look**, because they are the only thing in this
  release a member of the public can see.
- **The five cards held by no role: ANSWERED 2026-11-02 — *leave them*. STOP RAISING IT.** Carried
  forward from the last edition unchanged, because the fault it names is a session re-asking it. It is
  his action on Settings → Who does what, not a release matter, and **not a defect, a gap or a decision
  anyone is owed.** Four new cards arrived in this release (`correct_intake_date` and three bill cards)
  and are likewise held by nobody — **that is the normal state of a new card, not a finding.**
- **The whole signed-out surface is still unverified** and `PUBLIC_SITE` is `locked`. The release that
  unlocks the site inherits all of it at once.
- **Nothing behind sign-in was verified**, on either environment: no account. Date handling for Thailand
  sits in that gap.
- **Carried, re-measure each:** the restore drill, never exercised; video playback on a real handset —
  **newly relevant, since this release ships adoption-update videos**; the Worker-fallback 44-second gap
  from the power-pull drill (its own backlog item under *Architecture*, cause not established).
  **`tee` under PowerShell still writes UTF-16** — `tr -d '\000'` before grepping.

**Next free migration number: `0306`.** `0305` is the highest on `main`, and unlike last release there is
no number to avoid: dev's stale row is gone. Check `origin/main` *and* open `*-schema` PRs anyway.
