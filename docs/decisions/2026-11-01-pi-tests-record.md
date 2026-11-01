# Recording the three Pi tests of 2026-11-01, and fixing the probe that nearly falsified one

Stream `pi-tests-record`, 2026-11-01. **No hands-on work and no new measurement.** All three tests
at the Pi (boot from the USB clone, move the Pi behind its own firewall, the power-pull drill) ran
and passed on 2026-11-01 with Lutan at the Pi. Every number here was measured that day and is
recorded in the backlog items *PI TESTS AT THE PI* and *PI FAILOVER*; the full results, including
the addresses that must stay off a public repo, are on Lutan's Desktop as
`Pi tests - 1 Nov 2026 - RESULTS.md`. This stream is the paperwork: the fourth row of the drill
table, the probe fix, and three passages the tests proved stale.

## 1. The fourth drill row carries a caveat instead of just being the fourth row

`docs/decisions/2026-10-02-pi-failover.md` has a four-row table. The first three rows were measured
on 2026-10-28; the fourth was measured on 2026-11-01, **after the write-request wrapper shipped**
(`docs/decisions/2026-10-31-write-request-wrapper.md`). So the four rows are not four measurements
of one system — **the app changed between row three and row four, not just the instrument.**

Anybody who reads four rows in one table reads them as a series, and the series is wrong in a
specific and flattering direction: the fourth row's **zero duplicates** looks like a property of a
power cut when it is the wrapper doing exactly the job option 1 exists for. Two ways to stop that
were considered:

- **Split the table in two.** Rejected: the rows are four cases of one question ("what happens to a
  save when the Pi stops answering?"), and splitting them makes the comparison harder to make at
  all rather than harder to make carelessly.
- **Keep one table and say so where it is read.** Taken. The row names its own date and attempt
  count, and a subsection immediately under the table says it is not like-for-like, and why.

The same subsection records the **timing caveat**, because it is the kind of thing that is only
learned once and then silently forgotten: the Pi's real-time clock has no battery, so it boots
believing it is 1970, restores a stale saved time, and is corrected by NTP only after the network is
up. Wall-clock stamps from the first seconds after a power cut are **wrong**, and wrong in a tidy
way. The first reading of "power back to serving again in about 20 s" was taken from wall-clock
stamps, was wrong, and had to be redone from the journal's **monotonic** stamps, which no clock step
can touch. That caveat applies to any future outage post-mortem on this box, not just to this row.

## 2. The probe fix: one line, imported rather than copied, and loud when it lands nothing

`scripts/pi/drill-probe.mjs` was dead in the worst available way. It sent no request-id field, and
`runWriteAction()` in `src/lib/action-result.ts` now **fails closed** on a write with no request id,
so every attempt returned a clean-looking 200 while nothing landed. A six-second dry run against a
healthy Pi gave 6 of 6 refused in exactly that shape. Run unchanged across the pull it would have
recorded *"85 of 85 writes refused"* as a fact about power loss — a false record, not an error.

Three choices in the fix:

- **The field name is imported (`WRITE_REQUEST_FIELD` from `src/lib/write-requests.ts`), never a
  literal `"__writeRequest"`.** A literal is how this probe goes dead a second time: renaming the
  field would leave the probe compiling, running, and reporting 200s with nothing written. The
  import makes that a build-visible change instead of a silent one. `worker/origin.mjs` and
  `scripts/check-worker-origin.mjs` already import from that file from `.mjs` under Node's type
  stripping, so this needed no new machinery.
- **A run that lands nothing now says the probe is probably broken and exits non-zero.** A real
  outage refuses *some* saves; it does not refuse every one of them. "Everything refused" is far
  more likely to be a broken instrument than a result, so the probe says so rather than printing a
  tidy summary somebody writes down. The exit code is there so a wrapper script cannot miss it.
- **The header tells the next person to dry-run it against a healthy Pi first**, and says what went
  wrong on 2026-11-01 so the instruction reads as a rule with a reason rather than ceremony.

**Not done: an automated check that the probe still works.** It would have to post a real write to
the real test site, which needs a live `dev-signin` cookie and a running Pi, so it cannot live in
CI. The six-second dry run is the check, and it is written where it will be read.

## 3. The three stale passages get dated notes, not a rewrite

All three said something these tests disproved. Each was corrected by adding a dated note and
leaving the original text in place, marked superseded.

**Why not simply delete the wrong sentences.** Two reasons, and the second is the stronger one.
Deleting them loses the fact that the state really was that way, which is what makes "the boot test
was never done" readable as history rather than as somebody's error. And **this file set has already
caused one near-miss by being read as current**: on 2026-10-31 a session believed
`docs/test-plans/pi-usb-ssd-spare.md` and `docs/pi-hosting.md` over the machine, told Lutan the
spare drive was empty, and offered to wipe it for use as a rescue disk, which would have destroyed
the only spare. Leaving the old line beside its correction is what makes that near-miss visible to
the next reader.

For the same reason the correction in `docs/test-plans/pi-usb-ssd-spare.md` is at the **top**, in
the opening paragraph that carries the false claim, rather than filed against the individual
checklist lines further down. The opening paragraph is what a skim reads, and the skim is what went
wrong.

**The USB-speed warning was replaced rather than softened.** `docs/pi-hosting.md` warned that the
spare "runs at USB speed". Measured on 2026-11-01 while actually booted from it: **0.10–0.35 s a
page on USB against 0.08–0.21 s on the NVMe** — the time a page costs here is network, not disk.
The recovery step now carries the figures and says what the real reason to get off the spare is
(it is then your only copy), because a warning that overstates the cost can keep somebody off a
working spare in exactly the hour they need it.

## 4. The test plan's *Manual verification by* line is NOT signed, although the test passed

`docs/test-plans/pi-usb-ssd-spare.md` still says `pending: Lutan, the boot test and the first
scheduled clone`. Lutan **did** look — he was at the Pi and ran it — but he has not asked in chat
for that line to be signed on his behalf, and `CLAUDE.md` is explicit that the line is signed only
by the person who looked or at their explicit request. So the result is recorded in the document's
own correction at the top, where it is a statement of what happened, and the signature line is left
for him. This stream's own plan, `docs/test-plans/pi-tests-record.md`, is the same: automated checks
signed, manual verification `n/a` with the reason.

## 5. Where this work was done, and the one merge conflict it will cause

- **No new worktree.** The brief asked for `node scripts/worktree.mjs new pi-tests-record`. This
  session already had its own git worktree with its own branch, so the branch was renamed to
  `claude/pi-tests-record` and the work done there: same one-feature-one-branch-one-worktree shape,
  without a second checkout and a second `npm ci` for a documentation change. Recorded because the
  folder name does not match the feature name, which `worktree.mjs list` will show.
- **The *PI TESTS AT THE PI* tick will conflict with the `backlog` branch, on purpose.** The results
  were written onto that item on the `backlog` branch, which is not yet merged into `main`, so
  `main`'s copy of the line was still the pre-test wording. Rather than tick the stale wording, this
  PR replaces the whole item line with the `backlog` branch's current text **plus** the tick, so
  `main` gets the accurate record either way. The next daily `git merge backlog` will therefore stop
  on that one line: **resolve it by keeping the ticked version** — same text, `- [x]`. This is the
  case `CLAUDE.md` already describes ("a PR ticked an item while `backlog` reworded it").

## 6. What is NOT in this PR, and why

- **The Worker's 44-second hole.** During the pull the Worker covered 7 of 11 attempts over 11 s and
  then stopped for 44 s, every save a 503 in 250–370 ms with **no `x-lanna-served-by` header at
  all** — a header `worker/origin.mjs` always sets, so those replies did not come from our Worker.
  It is the most important thing the drill found, it has its own Architecture backlog item, and it
  is named in the drill table rather than fixed here.
- **Nothing that identifies the network.** No address, MAC, device name, switch model or Wi-Fi name
  is committed anywhere in this PR, the new troubleshooting entry included. The repo is public; those
  belong in the network notes on Lutan's Desktop, and the entry says so.
- **No release note and no `unreleased` line.** Nothing here reaches a shelter user: a drill table,
  a probe only this repo runs, and runbook corrections. §7 of the test plan is answered `n/a` for
  that reason.
