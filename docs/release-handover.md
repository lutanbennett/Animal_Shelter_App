# Release handover

**This outranks nothing.** `docs/release-procedure.md` is the runbook and `CLAUDE.md` the rules; where
this disagrees with either, they win. It is one chat's note to the next, rewritten every release, and
a wrong line here is corrected by its successor rather than by a reviewer — which is why it merges on
green like any other PR.

**Written after `0.49.1` (2026-11-25, minor, no email, one touch).**

## Where things stand

- **Live everywhere: `0.49.1 @ ba6603e5b`** on both endpoints, all four hosts, all `served-by: pi`.
- **Migrations: `0438` is the highest applied** on production and UAT. Dev/test is ahead of nothing —
  check with `--status` before assuming.
- **Nothing is waiting on Lutan from this release** except the test gaps below, which are his to look
  at rather than decide.

## The three things worth knowing before your next release

### 1. A minor release's no-mail needs the CONTROL, not just the absence

`cut-release.mjs --verify` prints two lines, and a minor release is only proved by both:

```
ok   mail ABSENCE: majorReleasesSince(previous) is empty  [[]]
ok   control: from further back, an older major release is still found  [0.49.0 in ["0.49.0"]]
```

Without the control, an empty answer and a broken query are indistinguishable. Then **both your
Worker deploys say it independently** (`no major release new to <env>, so no email`), and **UAT's is
the one that counts** — UAT has a live `RELEASE_MAIL` binding and its database holds production's
real people. Pass `--no-mail` anyway, as the runbook says.

### 2. `tail` has now cost this project three separate faults. Stop piping.

On `0.49.1` I read `check-deferred-notes.mjs` through `tail -6`, concluded "all six", and wrote that
into `--deferred-reviewed` — when the guard actually lists **12 that may owe a note and 8 others**.
Nothing wrong reached disk, because that flag is a gate and is not persisted, but the claim was
false when I made it.

**Redirect to a file and read it.** `CLAUDE.md` already bans reading exit codes through a pipe (a
crashed script once printed a stack trace and `EXIT: 0`, which was `tail`'s status), and the runbook
already warns that `| tail -40` on a deploy discards exactly the head you need. **This is the same
fault on output rather than status**, and it is most dangerous when the truncated part is the part
you are about to make a claim about.

### 3. A plan with no `Result:` and 23 unticked boxes was fine

`console-shelter-access.md` reached `main` looking abandoned. **Read it before concluding anything**:
every unticked line carried a reason and most were `deferred: release manager` — the release's own
work. Since 2026-11-05 a half-written plan passes `check-test-plan` and reports as *still being
written*, so this is now the normal mid-flight state rather than a defect. Its `Result:` is yours to
write when you tick those lines.

## Two mechanical things that will save you fifteen minutes

### `deferred:` only exists in the pre-production gate

Everywhere else — sections 3 and 7 especially — a line is ticked, `n/a: <reason>`, or
`pending: <what is outstanding>`. My cut plan failed the checker on five lines for exactly this, plus
a sixth: **a ticked release-notes line is held to the PR's own diff** — even when the answer is `n/a`. A cut *empties*
`unreleased` rather than adding to it, so that line is `- [ ] **Release notes.** n/a: …`.

**It bit twice in one release** — the cut plan, then the record plan, where the reason is plainly `n/a` and ticking it still feels right. The rule is about the tick, not the reason: documents PRs leave it unticked.

### UAT refuses a dirty tree, and it is right to

`deploy: uat deploys only from a clean, pushed main` — *working tree has uncommitted changes*. On
`0.49.1` that was one untracked 214 KB data file left loose in the main checkout. **Move it to
`.local/`** (gitignored, which is where `CLAUDE.md` puts data to keep but never commit); do not
delete it and do not look for a force flag. `git status --short` in the main checkout before you
start the UAT deploy costs nothing.

## A migration that rewrites rows: take the before-picture, keep it

`0437` had a backfill, so the runbook's rule applied. `check-shelter-settings.mjs --env <env>` read
both environments first, and both backfill statements turned out to be **blanks-only** against
columns that were already populated — so they matched **zero rows**, confirmed byte-identical
afterwards.

**That is the outcome you want and it still needs doing**, because "it only fills blanks" is a claim
about the file and "there are no blanks" is a claim about the data. Only the second one lets you skip
the backup, and only a read establishes it.

## The tenancy catalogue: read the baseline BEFORE you apply

`check-tenancy-catalogue.mjs --env production` is **report-only and always exits 0**, so it will
never stop you — which is exactly why it gets skipped.

Production was **123 flagged / 7 allowed / 0 stale** before `0.49.1`'s migrations and **130 / 7 / 0**
after: **exactly the seven** definer functions `0436` and `0438` add, none of which is catalogued and
neither of which re-owns them. That is `#tnycl`, filed. **The delta is only available if you read it
first**, and the delta is the whole finding — 130 on its own says nothing, because 123 were already
flagged.

## Pi builds: serial, pre-flighted, detached

One at a time (`next build` peaks above 6 GB on a 4 GiB Pi), each log read before the next starts.
**Pre-flight the box first** — `ssh lanna-pi-mesh` with `free -m` and `uptime` — so a connection
problem surfaces before a build rather than during one. On `0.49.1`: 3158 MB available, load 0.00,
and all three builds passed first time.

**Use `lanna-pi-mesh`, never `lanna-pi.local`.** Do not put the route to Lutan as a question; it is
recorded as in place and asking has cost a touch before.

**One Worker deploy may run alongside one Pi build**, which is where the wall-clock saving is. The
Pi's `setsid nohup` build survives the SSH session ending, so a foreground timeout on the starting
command is not a failed build — read the log on the Pi before concluding anything.

## Outstanding, and none of it blocks a release

Nine test gaps from `0.49.1`, listed in `docs/releases/2026-11-25-0-49-1.md`. Two are worth carrying
forward:

- **Lutan uploading several clips from his phone.** `#rlprg`'s first half shipped with a warning
  note; **the per-clip progress half shipped with no note on purpose**, because it was never shown
  working in a browser. If he reports on it, that is when the note is owed.
- **Four of the nine are phone-width looks that can be driven**, not handed over —
  `admin-home-role-chips` closed its own that way in headless Chrome with a mobile user agent
  (`#bprf7`). Offer it; do not quietly add it to his list.

**`0.49.0`'s production cache fault did not recur.** Production passed first time, after the purge,
and after the Worker deploy. Why the two releases differed is **not established** — purge both zones
every time regardless, and if it happens a third time there are now two data points.
