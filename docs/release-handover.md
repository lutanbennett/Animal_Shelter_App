# Release handover — written 2026-11-05 after `0.43.0`

A **delta**. The durable rules are in `docs/release-procedure.md` and this release's own record is
`docs/releases/2026-11-05-0-43-0.md`. **Both outrank this file.**

## START HERE

**`0.43.0` is deployed on both environments and it MAILED.** Both Pi clones are the release commit
**`3227a19e`** (pinned with `--ref`); **both Workers are `fda3c508`**, because #1286 merged itself on
green in the gap and `deploy.mjs` takes no `--ref`. **Nothing served differs** — the allow-list
code-identity diff is empty, and that mattered, see below. **316 of 316 applied**, `No drift` on both
databases, `calendar-cron` healthy, every held card fully applied, every permission cell backed by a
card, `activities-grantable` unchanged at ten.

**The release cost two touches — the target.** The email answer and his Worker deploy.

**Re-measure before trusting any of this.** `git fetch`, `git diff --stat fda3c508..origin/main`,
`gh pr list`, `--status --env production`, `node scripts/check-production.mjs all`, `/api/version`.

## `0.42.0`'s fix to the code-identity check earned its keep on the very next release

**The one thing in this edition worth reading before you start.** `main` moved under the deploy again
(#1286, the planner preflight). The **authoritative allow-list form** of the check printed nothing, so
the release was sound and **nothing was rebuilt**:

```bash
git diff --name-only <a>..<b> | grep -E '^(src/|worker/|public/|next\.config\.|open-next\.config\.|wrangler\.jsonc$|package(-lock)?\.json$|postcss\.config\.|tsconfig[^/]*\.json$|scripts/pi/|scripts/lib/[^/]+$|scripts/(deploy|apply-migrations|actions-key)\.mjs$)'
```

**Under the old `grep -vE '^(docs/|\.claude/)'` form it would have printed three files** — a planner
skill, a test plan and `scripts/check-planner-preflight.mjs` — and *any line means stop* would have
halted a sound release for the second release running. **Use the allow-list form.** And close its
opposite failure mode as the decision file requires: run the same diff with `grep -vE` and **read**
what it prints, to confirm nothing there is built or run at deploy. Three releases now say the same
thing in different words: **when `main` moves, read what is deploying and then do nothing.**

## New this release

- **A release can now ship two notes that contradict each other, and no check looks for it.** The
  fundraising staff-screens note said *"Nothing is on the public website yet"* while the public Events
  page shipped in the **same release** — both would have been mailed together. Found only by reading
  the thirteen notes **as a set**. **Expect this whenever a feature lands in two halves**, which the
  security and fundraising work does by design. Corrected in the cut; it is a defect in the record.
- **`--base` was needed, exactly as the last edition predicted**, because five notes were written in
  the cut: the **deferred notes whose step this release closes**. That is the one case the runbook puts
  in the cut, and it will recur on any release that applies migrations several streams were waiting on.
  **Commit the notes first**, then `--verify --base <that commit>`, so *character-identical* still
  means something.
- **The deferred-note window went 48 → 9 → 16, and every one of the 16 was flagged.** It tracks how
  many streams are waiting on a production apply, not quality. **Eight of the sixteen were the plan
  template's boilerplate** rather than a reason, which is four editions running: **read the plan, not
  the excerpt.** Budget ten minutes, not an hour.
- **The production dry-run FAILED and applying was still correct.** `0314` uses the
  `attachment_owner_type` value `'event'` that `0312` adds, and a new enum value cannot be used in the
  transaction that adds it. **Read both files and check dev**: all seven were already applied there,
  which is the proof. A red dry-run normally means *do not apply*; this shape means *apply*.
- **An untracked file in the main checkout would have refused his one command.**
  `scripts/check-deceased-archive-state.mjs`, in no branch, left by the planner the night before. Moved
  to `.local/`. **Check `git status --porcelain` in the main checkout before the handover, every time** —
  it is the cheapest avoidable cost there is and only cheap if someone looks.
- **This session could reach both databases**, which `#4xx3l` says no session can since
  `SUPABASE_ACCESS_TOKEN` moved to a Windows user variable. Every read worked, which **supports the
  item's own hypothesis**: a process started after the variable was set inherits it. **Do not let this
  become a reason to put the token back in any `.env.local`** — a stream asked for exactly that and must
  be refused.

## Corrections and closures to the last edition

- **The test Worker was NOT left behind.** The last edition recorded it as `cd2b0070`; it read
  `2c985e4f` before this release began, so it was brought level afterwards. Both hosts agreed at the
  start and agree now.
- **The migration apply was clean again.** The pattern over six releases: refused twice (`0.41.1`),
  clean (`0.41.2`), refused (`0.41.3`), clean, **clean**. **Two in a row still predicts nothing. Do NOT
  ask for an allow rule** — settled on `0.41.2`. A *third* refusal is when to put the pattern to him.
- **The "minor release" trap did not fire**, because he said *"a major release with email"* himself. **Do
  not read that as the trap being gone**: it fired on the two releases before this one. Use the exact
  question — *should this release email you?* — every time.
- **`release-prs.mjs` was short one squash-merged planner handover again** (#1284). **Five releases
  running.** Its exit 0 is correct and not reassuring: also read `gh pr list --state merged` by
  `mergedAt` and add the numbers by hand.
- **`doctor-cells` reads `MISSING 5 of 12`, unchanged for five releases**, same five names. Never
  restore its cards, never edit the check, never raise it.
- **Both Pi caches stayed warm** (693 MB and 695 MB, both under the 1 GB clear point).
- **`npm ci` was again measured as not needed by the range and run anyway, first, before any build.**
  Keep doing both.
- **The two hosts' stylesheets differ again** (33 bytes, different filenames) and it is **still not a
  finding**. Stop re-deriving this.

## Two measurement notes, so nobody repeats the mistakes

- **The edge-cache check gave three `HIT`s and no `MISS`, and that is a pass.** The browser pane's own
  page load was the miss that warmed it. **Fetch ONE url three times** — a fresh URL per fetch is a
  fresh key and proves nothing. Say which fetch was the miss rather than implying you saw the sequence.
- **A header is only verifiable once BOTH endpoints report the release.** `/api/version` is the Pi and
  `/api/releases/current` is the Worker bundle. This release's CSP fix (#1277) was read **after** both
  agreed: `connect-src` names `googleapis.com`, enforced, no report-only header. **That is the first
  time a release has verified the thing its own deferred note promised**, rather than asserting it.

## In flight and open

- **16 of 30 plans shipped signed `pending:`**, on his decision, grouped in the record. **The one worth
  doing first is `video-upload-csp`** — his own upload, now unblocked by the deploy, on a feature that
  has never once worked.
- **The locked public site now hides something people would want to see.** `/events` sends an anonymous
  visitor to `/login?next=%2Fevents`, so **the only publicly visible change in this release is the one
  nobody can check.** The same applies to the Campaigns and Sterilisation redirects. The release that
  unlocks the site inherits all of it at once.
- **Six of the thirteen notes say their own Thai is unread by a Thai speaker.** That is a standing
  backlog now, not a per-release item, and worth putting to him as one decision rather than six.
- **Nothing behind sign-in was verified**, on either environment: no account.
- **Carried, re-measure each:** the restore drill, never exercised; the Worker-fallback 44-second gap
  from the power-pull drill. **`tee` under PowerShell still writes UTF-16** — `tr -d '\000'` before
  grepping, and the log is absent from disk for the whole build, so **read his terminal instead**.

**Next free migration number: `0316`.** `0315` is the highest on `main`, and there is no number to
avoid: both databases read 316 of 316 with nothing applied that has no file. Check `origin/main` *and*
open `*-schema` PRs anyway.
