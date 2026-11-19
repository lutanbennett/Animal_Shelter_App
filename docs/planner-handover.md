# Planner handover — edition `764`, 2026-11-19

**This is a DELTA against `763`.** It says what changed, corrects its predecessor, and reports what `763`
left owed. Figures, batch composition and ports live in `.plan-day.md`.

**It outranks nothing.** One chat reads it, one plan replaces it, and a wrong line is corrected by its
successor rather than by a reviewer.

**IT COVERS THE NINE STREAMS MERGED SINCE `763`, AND SEVEN HAVE FIGURES:** #1717, #1718, #1723, #1724,
#1725, #1727, #1728, #1729, #1730. **#1721 and #1722 are `0.47.4`'s own two PRs, #1726 is the release
handover and #1720 is `763` itself; none of the four counts.** **Two of the nine carry no figure and
NEITHER is a fault** — see "the no-comment cases". **Written at nine, on cadence — and all nine merged
on the SAME DAY as `763`**, which is the day's real headline.

## FOR YOUR FIRST TURN

1. **Read `.plan-day.md` first.** Gitignored. **There were NINE `/plan-day` runs on 2026-11-19**,
   because batches merged in ten to twenty minutes each.
2. **Read the system date and compare it with this document's.** **Never derive today's date from a
   document** — including this one.
3. **`worktree.mjs list` will show `onboarding-runbook-steps` as `UNMERGED WORK`.** It is not.
   `git diff --stat origin/main...claude/onboarding-runbook-steps` is **EMPTY** — PR #1705
   squash-merged and those five commits are the pre-squash originals. **`done` refuses it and
   `--force` does not override. LUTAN SAID *"Leave it"*. Do not raise it again.**
4. **Read the repository AFTER the pull, not before.**
5. **`onboarding-script-faults` (port 3011) was set up and unmerged when this was written.** Its figure
   belongs to `765`.

## THE RULE THAT CHANGED, AND IT COST A WORKTREE: `gh pr list --state open` BEFORE CREATING ANYTHING

**`/plan-day` step 3 says to name every open PR this session did not open — and that read happens AFTER
the batch is created.** On a day with a live release-manager session that is too late.

**What happened:** `#pdmin` was agreed by Lutan, created as `product-admin-bootstrap` and briefed in
full — and was **already done**. The Release Manager session had built it while the brief was being
written: PR #1723, every check green, and `lutan.bennett2@gmail.com` **already placed on production at
07:48 UTC**. The redundant worktree, branch and origin branch were cleared before the list went to him,
and **#1723 was not touched** — it belonged to a live session, and that session merged it.

**It also resolved a contradiction that looked like a stale item.** Asked whose account should be the
first product administrator, Lutan answered *"I am already setup as a product administrator"* — about
ten minutes after that script had placed him. **The item's premise was true when filed and false when
briefed.** Taking his word and writing the uncertainty into the brief as a question was right; **but one
`gh pr list --state open` would have cost nothing and saved the worktree.** **Add it to the three cheap
facts allowed before `(a)`.** First time in nine plans, because it is the first time a non-plan session
built a backlog item.

## THE DRIVE HINGE IS ANSWERED, AND IT WAS THE PLANNER'S OWN WORK WITH HIM

**`#dscop`'s deliverable 5, which #1717 left unproven and called "the planner's to price", was measured
against Google in about forty minutes** (#1727,
`docs/decisions/2026-11-19-drive-file-hinge-proved.md`).

**THE ANSWER IS NO: a file a HUMAN puts into an app-created folder is INVISIBLE to an app holding only
`drive.file`.** The app's own control file in the same folder read `200`; the uploaded file was never
returned by any query. **So `#drvcl` must not have a flow that depends on a shelter dropping files where
the app will find them.**

**TWO CORRECTIONS FELL OUT, AND THE SECOND MATTERS MORE THAN THE ANSWER:**

- **`drive.file` IS PER CLOUD PROJECT, NOT PER OAUTH CLIENT.** #1717's decision file recorded the
  opposite, explicitly as an inference. A throwaway client saw **100 files created through the
  published client**. **Measured false.** So **most of Lanna's existing tree is already accessible**,
  and route 1 (the app creates the tree) is **cheaper than it looked** — a script counts, because the
  app creates the file. Route 2 (moved by hand) is the one-way door.
- **Visibility is per FILE and cascades neither way:** the hand-made root folder answered **`404`**
  while nine folders inside it answered `200` each. **The app can read inside a folder it cannot read.**

**AND A METHOD NOTE WORTH MORE THAN THE FINDING.** The cheap route was to re-consent the **published**
client to the narrower scope — no console work at all. **It was rejected and should stay rejected.**
Google does not document what happens to an existing refresh token when the same client re-consents
narrower, and says incremental authorization is **not supported for installed apps**; that client holds
dev's live token and `test-shelter-2`'s. **A throwaway Desktop client made the question moot, and
`check-drive-token.mjs` before and after proved the live grant untouched — which also proves the
two-client plan works.** **This does NOT license narrowing an existing client's scope.**

**Eleven Google pages across two independent passes said nothing about the hinge.** Recorded as *not
stated* twice before anyone measured. **That is the shape to copy: exhaust the documentation, record the
silence, then measure.**

## THE aal2 WALL IS NOW THE REAL BLOCKER ON PRODUCT-ADMIN WORK, AND IT HAS STOPPED TWO STREAMS

`/admin/product-admin` is gated on `is_product_admin()` **plus `aal2`**, and a `dev-signin.mjs` session
is **aal1**. **So no stream can drive that screen on dev at all.**

- **#1723 said so in its own words:** the presses — Add, Remove, create-a-shelter, map-an-address, the
  step-up return — are *"what four test plans across two releases are waiting on"*, and it could not
  drive them.
- **#1729 was briefed to drive them as part of the rehearsal and could not either**, and correctly
  recorded `pending:` rather than an app fault. Its brief had priced standing up an authenticator as out
  of band, and that held.

**So four test plans wait on presses nobody can perform, and three more findings from #1729 are screen
work in the same place:** no screen sets `display_name`/`short_name`, the receipts function
`product_admin_set_shelter_receipts` has **no caller**, and there is no way to create a first login from
the screen. **Do not brief a fourth product-admin stream until this is settled — it would hit the same
wall.** **It is the planner's to put to Lutan**, and the honest options are his own authenticator, a
dev-only step-up path, or accepting that this screen is verified by him and not by a stream.

## FIGURES — NINE STREAMS, SIX BAND READINGS: THREE INSIDE, TWO UNDER, ONE OVER

| slug | PR | band | actual | verdict |
|---|---|---|---|---|
| `drive-scope-decision` | #1717 | 150-185k | **164,967** | **inside** |
| `cn7gk-upload-proof` | #1718 | 175-205k | **192,150** | **inside** |
| `product-admin-seed` | #1723 | — | **no comment** | **not a reading — see below** |
| `new-shelter-rows` | #1724 | 150-185k | **163,052** | **inside** |
| `fonts-local` | #1725 | 175-215k | **158,653** | **UNDER by ~16k** |
| `hinge-proof` | #1727 | — | **no comment** | **not a reading — see below** |
| `shelter-seed-rows` | #1728 | 155-185k | **188,835** | **OVER by ~3.8k** |
| `onboarding-rehearsal` | #1729 | 170-210k | **168,738** | **under by ~1.3k, at the floor** |
| `backup-own-client` | #1730 | `unmeasured` | **154,419** | **band does not apply — unplanned, no brief** |

**THE FLOOR, SEVEN READINGS: 86,761 · 86,985 · 87,050 · 87,708 · 87,708 · 87,773 · 90,094.**
**Six of the seven sit in a 1,012-token band; the seventh is 90,094.** **`763` reported exactly this
shape — eight in 1,014 tokens with one at 90,375 — so two complete sets on two days agree:** the floor
is **~86.8–87.8k with a rare excursion near 90k**, not a uniform `~86–90k`. **Recommend narrowing the
floor row and recording the ~90k cases as rare rather than as the top of a range. The scale rows are
still not to be shifted with it.**

### THE NO-COMMENT CASES, AND NEITHER IS MECHANISM A

**Check this before anyone files a recurrence against `#3qmzt`.**

- **#1723 was the RELEASE MANAGER session's work.** `#3qmzt`'s own reconciliation already records this
  shape — *"#1637 was the release-manager session, which posts no `stream-usage:` comment by design"* —
  so this is the **second** instance of that confusion, not a new fault.
- **#1727 was the PLANNER's own**, and the omission was deliberate: it had no brief and no band, and the
  figure would have been this planner window's whole context, **which the band table explicitly cannot
  see and which would pollute it.** **A planner proof PR is not a stream reading.**

**So `#3qmzt` still has NO new occurrence**, and it stays what it was retitled to: a standing watch.

## BAND REVISIONS — ONE FIRED, ONE FAILED, AND THE FAILURE CORRECTS `763`

**(1) THE `+30k` BROWSER PREMIUM IS FOR *DRIVING* INTERACTIONS, NOT FOR *LOOKING* AT A PAGE.**
`fonts-local` was banded 175-215k on the ordinary row plus ~30k for browser verification plus a
two-language premium, and came in at **158,653 — under its own floor by 16k.** Its proof was a visual
and computed-CSS comparison in two languages with **no control pressed**. **The band table's dearest
question is "how many live interactions must it drive", and the answer there was none.** **Revision: a
stream asked to SEE a page in two languages takes the ordinary row plus about 10k, not plus 30k.**
**Written down before the next reading existed**, and #1729 is consistent: banded 170-210k *with* a
driving premium, it could not drive, and landed 1.3k under the bottom.

**(2) `763`'s SPECIFICATION DISCOUNT FOR A SCHEMA HALF DID NOT HOLD, AND THIS IS A CORRECTION.**
`763` recorded that a handed-over specification *"discounts a SCHEMA half much more than an app half"*.
`shelter-seed-rows` was banded **155-185k on exactly that reasoning** — its bottom set *below* the
160-185k row because `#shrow` had handed it the per-table counts, the method, the gate answer and a
working harness. **It came in at 188,835, OVER the top by 3.8k.** **The discount did not pay for
establishing six tables' default content from four of Lanna's own migrations, nor for the receipt definer
function's shape.** **Revision: a specification discounts the DISCOVERY, not the DESIGN. Where a schema
half must still decide what the right rows ARE, price the design and do not discount it.** `763`'s
revision is not wrong in general — #1711 and #1713 fired on it — but it was over-applied here, and **a
revision that fails on its next test is evidence too.**

**Both predictions were written into briefs before their readings existed, which is the only way a
revision counts as evidence. Keep doing it.**

## WHAT `763` LEFT OWED

- **`brief-blocks.md` STILL DESCRIBES THE AGENT BUILD HALT AS LIVE.** Still not rewritten, and `762`
  and `763` both asked. **It was copied verbatim into four more briefs on 2026-11-19.** It needs a
  stream and a PR, and nobody has measured enough halts to replace the text with.
- **Its band-table recommendation (two bottoms nearer 135k) is STILL UNACTED, and the day's figures
  weaken it further.** Nothing came in below 154,419, and that one has no band. **Still deliberately
  not edited.**
- **"A tick is not a title rewrite" RECURRED, THIS TIME AS A MISSING ANSWER RATHER THAN A STALE
  TITLE.** #1717 shipped a 92-line decision file for `#dscop` and **never touched the item**, so the
  backlog read as if the scope were undecided, with four things "NOT ESTABLISHED", for three hours.
  **Corrected on the backlog branch. Fourth day running for this family.**

## FILED, TICKED AND CORRECTED

**Ticked by streams:** `#pdmin` (#1723), `#fntlc` (#1725), `#shsed` (#1728 — seeds and function only).
**Not ticked, correctly:** `#shrow` (#1724, absent-row consequences only partly established), `#onbrb`
(#1729 — Step 3 and Step 4's secrets are Lutan's, so the rehearsal clause is unmet), `#civwx` (#1730,
code half only, no token minted).

**Filed by the planner from streams' own reports:** **`#shsed`** (from #1724's deliverable 8 — a new
shelter is created with exactly one row, and all 115 tables carrying `shelter_id` hold zero; it became a
stream and shipped as `0416` the same day) and **`#uvcls`**.

**Corrected in place:** **`#dscop`** now records the measured answer, and its open list is down to three
things — the calendar scope's class, Lutan's Web OAuth client, and whether the Picker recovers a
human-added file. **`#3qmzt`** is now a standing watch, because its two unexplained PRs had their
transcripts destroyed by routine tidy-up and its done-when **cannot be met as written**.

**`#uvcls`, AND IT INVERTS A RULE EVERY BRIEF LEANS ON: a Node script on this machine can exit
NON-ZERO after its work has SUCCEEDED** — `Assertion failed: !(handle->flags & UV_HANDLE_CLOSING),
file src\win\async.c, line 94`, at teardown. Seen twice in one session: `check-shelter-settings.mjs`
after printing all three of its results, and an OAuth probe **after minting and saving its token**,
which the harness reported as `failed with exit code 127`. **`brief-blocks.md` and the gates both say
to trust the exit code over plausible-looking output. Here the exit code is the liar.** Not fixed; filed.

## WHAT IS LEFT FOR CLAUDE AT ALL

**The multi-tenancy programme (`#ykefa`) is ELEVEN OF THIRTEEN PARTS DONE.** Only **Part 12** (`#egq18`,
the 10 ms measurement — **not a worktree job**, route (a) only, and Lutan said *"Hold it for now"*) and
**Part 13** (`#34a30`, blocked on Part 12's number) remain, plus the go-live step, which is the release
manager's and his. **His priorities list was read first and NONE of its seven ranked items was
streamable** — that is his order running out of buildable work, not a departure from it.

**In flight when this was written:** `onboarding-script-faults` (port 3011) —
`connect-shelter-calendar.mjs` crashes at start with `ERR_MODULE_NOT_FOUND`, which is **Step 5 of
onboarding**. Cause measured: **a TS module reached from a script is only safe if its own internal
imports carry extensions.**

**Next, and in this order:** the **aal2 decision** above, because it gates everything else on that
screen; then `#drvcl`'s screen once Lutan registers the **Web OAuth client** (the hinge no longer blocks
it); then `#shrow`'s remaining half.

**Everything else is as `763` left it** — his hands, parked, waiting on a person or on data. **`#pl7aq`,
the public launch, is a date he names: not to be re-asked.**

## PROCESS NOTES

- **`0.47.4` SHIPPED AND IS RECORDED** (#1721 cut, #1722 record, #1726 release handover). **The
  production Worker deploy is still his.** `#fntlc` fixed the cause of `0.47.3`'s failed deploy: the
  build no longer fetches five fonts from `fonts.gstatic.com`.
- **`worktree.mjs done` REFUSES A FOLDER A SESSION IS SITTING IN, and that is correct.** `fonts-local`
  and `new-shelter-rows` merged and could not be cleared because Lutan's sessions were still open in
  them. **Their figures were read BEFORE the attempt**, so nothing was at risk. **Never force it.**
- **`git ls-remote` FAILED ONCE WITH A BARE EXIT 128** mid-`done` — a network blip, not a refusal. It
  completed on retry and `--force` was not used. **Retry a transient git failure; do not reach for a
  flag.**
- **THE DEV DATABASE IS UNCHANGED FROM `763`:** `test-shelter-2` is connected with a second Google
  account's real credentials, and `proof-b` belongs to other work. **Every brief says both, and says
  never to run `dev-signin.mjs --remove`.**

## INTERRUPTIONS

**ONE, AND IT WAS A FAIR CORRECTION OF THE PLANNER'S WRITING RATHER THAN OF ITS WORK.** Lutan asked
twice for clearer instructions during the hinge session — *"you need to be clearer in your instructions
- where do I login to for part 1?"* and *"and what account should I be using"* — because the planner had
named the console account in one turn and then omitted it from the step-by-step turn that mattered.
**Three accounts were in play** (`lannaanimalfoundationbwm` owns the Cloud project, `lutan.bennett3` was
the intended consent account, `lutan.bennett2` is the new product admin) **and instructions for a human
must name which account does which job, every time.** He also asked for the result *"in simple
english"*, which was the right ask of a write-up that had been written for a planner.

**No stream was corrected, rescoped or stopped.** He approved the hinge consent as the foundation
account rather than `bennett3` and **said so immediately**, which made the result stronger rather than
weaker: that account's Drive is what produced the per-project finding.
