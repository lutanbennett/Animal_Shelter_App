# Release handover — written 2026-11-11 after `0.44.2`

A **delta**. The durable rules are in `docs/release-procedure.md` and this release's own record is
`docs/releases/2026-11-11-0-44-2.md`. **Both outrank this file.**

## START HERE

Production is `lannacareforanimals.org`, now on **`0.44.2`**. `test.lannacare.org` is test on the dev
project and `uat.lannacare.org` is UAT on its own project (`fsjagxmxjosauwmxwype`), both also `0.44.2`.
All three databases hold **354** migrations, 0 pending, no drift, and all three hosts answer from the
**same commit**, `7b1d9f03`.

**`0.44.2` did NOT mail**, on Lutan's instruction given in words. `#w4k9n` (e) stays **proven by
`0.44.0`**; a minor release cannot test it either way.

The public site is **still locked** (`PUBLIC_SITE: "locked"`).

**Still nobody holds the two cards `0.44.0` added** — `approve_text` and `diet_settings`. Public text
saved since `0.44.0` waits with no holder able to approve it. **Third handover running.** Settings →
Who does what.

**Re-measure before trusting any of this.** `git fetch`, `git diff --stat <deployed>..origin/main`,
`gh pr list`, `--status` on all three, `/api/version` on all three hosts.

## THE ONE THING TO READ BEFORE YOUR NEXT CUT — IT HAS CHANGED THIS TIME

**`git log --oneline -1`, then `--status` on production AND on uat as separate questions.** Unchanged,
and it has now paid eight times. On `0.44.2` both had the same three pending, which is the easy case;
`0.44.1` had UAT a migration further behind.

**BUT THE BIGGER ONE NOW IS THE PI: DO NOT RUN ALL THREE PI BUILDS AT ONCE.** The runbook said *"They
build in parallel safely"* and **that line was wrong and is now corrected** (`docs/release-procedure.md`,
*The Pi*). The Pi has **4 GiB of RAM**:

- Three parallel `next build` runs OOM-killed the production build — a bare **`Killed`** in its log.
- The Pi had **also rebooted at 08:39** mid-build minutes earlier, killing a whole first round of three.
  **The cause is NOT established** — the journal is not persistent on that box
  (`journalctl --list-boots` shows only the current boot) — but three concurrent builds is the only thing
  that changed. Treat it as suspected, not proven.
- **Run them ONE AT A TIME**, reading each one's closing lines before the next. One takes about five
  minutes. Serial costs ten extra minutes and buys a release that does not half-land. **This said "or at
  most two" and that was corrected within the day** from a figure already in the repo: `setup.sh` step 2b
  records that **`next build` peaks above 6 GB on this 4 GB Pi**, which is why it adds 4 GB of swap and
  why `deploy-pi.sh` refuses below ~6 GB. One build already needs swap; two want ~12 GB against ~10 GB.
  **The OOM was predictable from a comment that was already there**, and "at most two" was a guess.
- **One Pi build alongside one Worker deploy is still fine** — different machines. That is the
  parallelism to use.

**Ask about the EMAIL, never "major or minor".** He answered it himself again — *"Let's do a minor
release no email. Outstanding open tests logged as gap"* — and **that one sentence answered both
decisions**, the email and the `pending:` test-plan question. **Three releases running.**

## WHAT `0.44.2` CHANGES FOR YOU

**1. TEST THE PORT, NOT THE PING. THIS COST HIM A TOUCH.** I told him the Pi was unreachable and needed
him. It never was: **ICMP is blocked on that box**, and the SSH handshakes were timing out *because three
builds had saturated it*. **Port 2222 was open the whole time**, and one line settles it:

```bash
timeout 8 bash -c 'echo > /dev/tcp/192.168.68.81/2222' && echo OPEN || echo "no answer"
```

A box that blocks ICMP and is too busy to complete an SSH banner looks **exactly** like a box that is
off. `ping` proves nothing about this Pi, in either direction. Also note `arp -a` showed it present at
layer 2 the whole time — another signal I had and did not weigh.

**2. A PI BUILD FAILURE IS SAFE. READ IT RATHER THAN FEARING IT.** `deploy-pi.sh` discards `.next.new`
and never touches `.next`, so the clone keeps serving the old release and prints
`BUILD FAILED — discarding .next.new` then `DEPLOY FAILED — NOTHING NEW IS BEING SERVED`. Rebuilding that
clone **alone** succeeded first try with 3.0 GiB free. **And run the prescribed diagnostic before
theorising about the machine** (`CLAUDE.md`, *When a Pi build is killed*): `du -sh .next .next/cache
node_modules` exonerated the cache here — both clones `1.3G` / `1.2G`, no `.next/cache` at all — so it
was memory, not the 2026-10-19 cache-bloat fault. `free -h` is the one-line check: 4.0 GiB total.

**3. A GIT-UPDATED CLONE IS NOT A DEPLOYED CLONE, AND THIS IS WHAT THAT LOOKS LIKE.** After the reboot
all three clones had their *source* at the release commit with `.next` still the old build and a partial
`.next.new` beside it. `git log -1` would have read as "updated". **Read the served version and the
service**, which is what the runbook says and what caught it.

**4. `0.44.1`'s HANDOVER WAS WRONG ABOUT TEST AND MAIL. CORRECTED.** Its item 5 said the test deploy
*"printed nothing at all about mail"*. It prints a refusal like the other two —
`deploy: no major release new to test (was 0.44.0), so no email.` — and the previous record's grep
searched for strings the script does not print on a minor release. **So a minor release gives you THREE
explicit refusals, one per environment.** Quote them; the absence of mail is the easiest thing on a minor
release to assert without evidence.

**5. HIS `tee` LOG IS UTF-16.** `tr -d '\000' < .local/deploy-<version>.log` before grepping, or every
pattern misses. The runbook says so; it still cost a confused read here.

**6. THE THREE STYLESHEET SIZES DIFFER AND THAT IS NOT A FAULT.** Production `99854`, test `99839`, UAT
`99876`. Each environment bakes different values, so the hashes and byte counts legitimately differ.
**The check that settles it is `check-assets.mjs` on each clone** — served versus *that clone's own*
build; all three read *identical to the build*. A size matching **another** environment's would be the
worry.

**7. ANSWER A DEFERRED NOTE BY MEASURING — IT PAID AGAIN, THIS TIME TO SAY "NO NOTE".**
`public-visible-one-expression`'s reason was conditional on no appeal running.
`check-production.mjs appeal-override` read **0 running, text-approved appeals**, so `0350`'s widening
has no subject and nothing was owed. **And read BOTH clauses of a two-clause reason:** its second clause
(the production apply) *did* close here, and a candidate whose named step closes still owes nothing if
the first clause says nobody would notice. Same shape as `suppliers-cleanup` on `0.44.1`.

**8. WRITE THE PREDICTION INTO THE CUT PLAN BEFORE THE APPLY.** All three before-pictures were predicted
in writing and all three landed: policy lines **77 → 77 with an empty `diff` and no
`item_unit_conversions` line** (the specific thing to watch, since `0352` drops and replaces three write
policies); public views **476 → 476, diff empty**; residents not listed publicly **281 → 281**,
predicted not to move because `0350` changes the profile view and not enclosure membership. **A
prediction that lands is evidence; a number without one is decoration.**

## WHAT STAYS HIS

**His, non-negotiable:** whether it mails, and the **production Worker deploy**. Everything else is
yours, the merge included — **every PR merges on green, feature PRs included** (2026-11-01). Do not wait
for a go, and do not offer Auto-fix.

**`0.44.2` cost him three touches against a target of two, and the third was mine** — see item 1.
`0.44.1` cost one.

## CARRIED, UNCHANGED, RE-CONFIRMED RATHER THAN COPIED

- **`main` did not move once**, the second release running, so every build came from `7b1d9f03` and the
  code-identity diff had an empty range. **Not a streak and not a property** — it measures how quiet
  other sessions were. `gh pr list` showed nothing open before the cut.
- **No `scripts/pi/` change shipped**, so the one-deploy-late caveat did not bite — but
  `deploy-pi: restarting under the script from 7b1d9f03` was **present on all three clones** and was read
  rather than assumed. Its absence means the release's guards did not run.
- **THE PI'S `guard-release` STILL CANNOT GUARD** the schema (no `SUPABASE_ACCESS_TOKEN`, and it must not
  have one). It printed `production ok` / `uat ok` on the *release record only* and said so. **Do not read
  that as a schema pass.** The invariant was held as always: applied from this machine, read back
  `0 pending` with clean drift on all three, plus `assert-schema` on production and UAT, **before** any Pi
  build.
- **`check-deferred-notes.mjs` over-listed again** (six of eleven candidates belonged to the previous
  release's range) and printed guidance text as four "reasons". **Do not narrow it** — `0.44.1` is the
  proof, where one over-listed candidate was a genuinely owed note. Budget one lookup per candidate.
- **`check-production.mjs` refuses `--env uat`**, so UAT still gets no before-and-after. Backlog `#rv4qk`,
  second release running, and it cost more this time because UAT carried the same three migrations.
- `audit:prod` exits 1 with five vulnerabilities and `audit:register` exits 0 — one registered,
  unreachable high advisory (`GHSA-5j98-mcp5-4vw2`). **A cut always runs the CI job for real**; it did and
  it passed. **`skipped` is not a pass.**
- **Unchanged and in the record rather than re-argued here:** all three Server Actions keys matched their
  Pi, `STATUS_READ_TOKEN` stays unset on purpose (`#mzu7v`), `sync-home-icons` read `496 unchanged`, and
  the restore drill is settled (`#rg7pv`) — do not re-raise that one.

**Read the live state; never accept "it's done."** This edition's example is the Pi: `git log -1` said
every clone was on the release while two of three were serving the previous build, and the sites briefly
answered the *new* version from the **Worker** while the Pi was busy — which is the `x-lanna-served-by`
trap, met for real.
**Next free migration number: `0353`** — read `git ls-tree`, never this line.
