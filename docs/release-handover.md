# Release handover — written 2026-11-10 after `0.44.1`

A **delta**. The durable rules are in `docs/release-procedure.md` and this release's own record is
`docs/releases/2026-11-10-0-44-1.md`. **Both outrank this file.**

## START HERE

Production is `lannacareforanimals.org`, now on **`0.44.1`**. `test.lannacare.org` is test on the dev
project and `uat.lannacare.org` is UAT on its own project (`fsjagxmxjosauwmxwype`), both also
`0.44.1`. All three databases hold **351** migrations, 0 pending, no drift — and all three hosts
answer from the **same commit**, `cc1349cb`.

**`0.44.1` did NOT mail**, on Lutan's instruction given in words. The `[Production]` subject fix
(`#w4k9n` (e)) stays **proven by `0.44.0`**, and a minor release cannot test it either way.

The public site is **still locked** (`PUBLIC_SITE: "locked"`).

**Still nobody holds the two cards `0.44.0` added.** `approve_text` (Approve public text) and
`diet_settings` are given to no role, and public text saved since `0.44.0` waits with no holder able to
approve it. **Unchanged from the last handover, so it has now been the first thing to raise twice.**
Settings → Who does what.

**New, and the other thing to raise: `0347` takes 281 residents off the public website's enclosure
pages** — every animal in an enclosure that is neither ticked Ready for adoption nor under a running
appeal. That is exactly Lutan's ruling of 2026-11-09 working, and `PUBLIC_SITE` is locked so nobody
outside sees it yet. **It is the thing to look at first on the day the site unlocks.** It also closed
`0.44.0`'s open `"Treatment"` item: a *closed* appeal no longer keeps its animal public.

**Re-measure before trusting any of this.** `git fetch`, `git diff --stat <deployed>..origin/main`,
`gh pr list`, `--status` on all three, `/api/version` on all three hosts.

## THE ONE THING TO READ BEFORE YOUR NEXT CUT

**Same line as the last six editions, and it has now paid seven times.** `git log --oneline -1` before
cutting, then **`--status --env production`** — and **`--status --env uat` as a separate question**.
On `0.44.1` production had **two** pending and **UAT had three**: UAT was a migration further behind,
exactly as the last edition warned. `0347` had also been applied to production by somebody else before
the release began, which is what closed a deferred note. **The pending list is not the release's
migration list, and the three environments do not agree.** Two commands, three environments. Every
time.

**Ask about the EMAIL, never "major or minor".** He answered it himself again — *"lets do a minor
release, no email and any gaps in testing noted"* — and **that one sentence answered both decisions a
release costs him**: the email, and the `pending:` test-plan question. That is two releases running
where his opening message pre-answered everything. `major` means *worth an email*, not semver major;
a non-mailing release moves the **last** number.

## WHAT `0.44.1` CHANGES FOR YOU

**1. `--base` IS THE DEFAULT. IT HAS NOW PAID TWICE RUNNING.** This cut owed a note, so plain
`--verify` would have failed *every note carried across character-identical* and *nothing invented* on
`[6 vs 5]`. Build the base and verify against it:

```bash
cp src/lib/releases.ts <scratchpad>/base.ts      # AFTER inserting the owed note into unreleased[]
node scripts/cut-release.mjs <version> <date> <major|minor> --verify --base <scratchpad>/base.ts
```

**Expect to add a note on most cuts**: four of the last five releases owed one. Copying the worktree's
own file after editing it avoids `git show` altogether — and `MSYS_NO_PATHCONV=1` is still required if
you do use `git show` on a dotted path.

**2. READ BOTH CLAUSES OF A DEFERRED NOTE'S REASON. A CLOSING STEP DOES NOT MEAN A NOTE IS OWED.**
`suppliers-cleanup` read *"nobody at the shelter would notice; Contacts has hidden Vendor rows since
0338, **and the production apply is still outstanding**"*. This release applied `0348`, so the named
step closed — and **no note was owed**, because the first clause says the user-visible change shipped a
release earlier. The script lists the candidate either way. Decide on the whole reason.

**3. THE OVER-LISTING EARNED ITS KEEP, SO DO NOT NARROW IT.** `check-deferred-notes.mjs` again printed
the template's guidance text as the "reason" for **four of six** candidates and again ignored the range
it was given. **And one of the six was a genuinely owed note that nothing else would have caught**
(`public-cards-gate`). Four editions have recorded this as a defect; read it instead as the reason the
script must stay noisy. Budget one lookup per candidate.

**4. `--no-mail` IS NOT WHAT STOPS UAT MAILING ON A MINOR RELEASE.** UAT printed
`deploy: no major release new to uat (was 0.44.0), so no email.` — **the `major: false` check answered
before the flag was reached.** UAT holds a live `RELEASE_MAIL` binding, `RELEASE_MAIL_ENV ("UAT")`, and
**production's real people in its database**. **Keep writing `--no-mail`:** on a *mailing* release it is
the only thing between a test site and every real admin's inbox. Do not conclude from this release that
it is redundant.

**5. AN ABSENCE OF MAIL IS STILL READ, NOT ASSUMED.** A mailing release ends by reading the inbox; this
one ended by reading **three** independent refusals — production and UAT each naming the previous
version and saying *so no email*, and test printing nothing at all because it had nothing to refuse —
beside the `majorReleasesSince` absence/presence pair at the cut. On a minor release the absence check
is the easiest thing to fake, so quote the lines.

**6. THE BEFORE-PICTURE MUST BE OF WHAT THE MIGRATION WRITES, AND IT SHOULD MOVE BY EXACTLY THE CLAIM.**
`role-cards` / `role-cells` would have measured nothing again — none of the three touches a role's
cells. The two that earned their place:

- `check-production.mjs table-policy-commands`: **77 lines before, 77 after, `diff` empty** — `0348`
  drops a view and three columns without costing any table its last live policy.
- `check-public-views.mjs --env production`: **477 `ok` before, 476 after**, 0 failures either side, and
  the line-by-line diff is **exactly one line gone**: `stock_vendors: anon SELECT is refused`. That is
  `0348`, and nothing else moved.

**7. TWO GAPS YOU WILL MEET AGAIN**, both recorded rather than fixed (a release ships what the build
gave it):

- **Nothing counts the Vendor contact rows `0348` archives**, so a *destructive* migration shipped with
  a refusing guard instead of a measurement. Backlog item.
- **`check-production.mjs` refuses `--env uat`** (`--env must be production or test`). UAT was the only
  database where `0347` was still pending, so it was the only place a real before-and-after for it
  existed — and it could not be read. Backlog item.

**8. "DO NOT IDLE" NOW COVERS EVERYTHING, AND IT HELD.** `0.44.0` cost two avoidable touches to a
session waiting for a notification while its own gate log sat on disk. **That did not recur:** the
gates, three Worker deploys, three Pi builds and the icon sync were each driven by reading their own log
or his terminal. For his production deploy, `mcp__terminal__read_terminal` with a generous
`wait_for_output_ms` followed it from the first line to the prompt returning. **`0.44.1` cost him one
intervention against a target of two, and nothing avoidable.**

## WHAT STAYS HIS

**His, non-negotiable:** whether it mails, and the **production Worker deploy**. Everything else is
yours, the merge included — **every PR merges on green, feature PRs included** (2026-11-01). Do not
wait for a go, and do not offer Auto-fix.

## CARRIED, UNCHANGED, RE-CONFIRMED RATHER THAN COPIED

- **`main` did not move once during this release**, so all six builds came from `cc1349cb` and the
  code-identity diff had an empty commit range. `0.44.0` needed that diff read four times. **Neither is
  a fault and neither is a streak** — it measures how quiet other sessions happened to be. `gh pr list`
  showed nothing open before the cut, which is why.
- **No `scripts/pi/` change shipped**, so the one-deploy-late caveat did not bite — but
  `deploy-pi: restarting under the script from cc1349cb` was **present on all three clones** and was
  read rather than assumed. Read that line every time; its absence means the release's guards did not run.
- **The UAT Pi restarted its own service** with no password prompt, the sudoers fix holding for a second
  release. `sudo -n -l` lists all six entries; re-read today.
- **THE PI'S `guard-release` STILL CANNOT GUARD** the schema (no `SUPABASE_ACCESS_TOKEN`, and it must not
  have one). It printed `production ok` / `uat ok` on the *release record only*, and said so. **Do not
  read that as a schema pass.** The invariant was held as always: migrations applied from this machine
  and read back `0 pending` with clean drift on **all three** databases, plus `assert-schema` on
  production and UAT, **before** any Pi build. Keep that order.
- `audit:prod` exits 1 with five vulnerabilities and `audit:register` exits 0 — one registered,
  unreachable high advisory (`GHSA-5j98-mcp5-4vw2`). **A cut always runs the CI job for real**, because
  it bumps `package.json`; it did, and it passed in 12s. **`skipped` is not a pass.**
- **Unchanged, and in the record rather than re-argued here:** both Server Actions keys matched their Pi,
  `STATUS_READ_TOKEN` stays unset on purpose (`#mzu7v`), `sync-home-icons` read `496 unchanged`, and the
  restore drill is settled (`#rg7pv`) — do not re-raise that one.

**Read the live state; never accept "it's done."** This edition's example is `0347`: the last handover
did not mention it, and it was applied to production by somebody else before this release began — which
is the fact that closed a deferred note and let a real release note ship.
**Next free migration number: `0350`** — read `git ls-tree`, never this line.
