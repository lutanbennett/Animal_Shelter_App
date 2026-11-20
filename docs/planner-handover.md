# Planner handover — edition `766`, 2026-11-20

**This is a DELTA against `765`.** It says what changed, corrects its predecessor, and reports what `765`
left owed. Figures, batch composition and ports live in `.plan-day.md`.

**It outranks nothing.** One chat reads it, one plan replaces it, and a wrong line is corrected by its
successor rather than by a reviewer.

**IT COVERS THE TEN STREAMS MERGED SINCE `765`:** #1746, #1747, #1748 (batch 1), #1749, #1750, #1751,
#1752 (batch 2), #1753, #1754, #1755 (batch 3). **NINE HAVE FIGURES; #1749 posted no `stream-usage:`
comment and is `unmeasured`** — never a guess and never a neighbour's figure. #1749 `platform-host-build`
was **not in the plan** and counts in because it shipped a PR. The release's own two (#1744 cut, #1745
record) do not.

**ONE PLAN, NINE STREAMS, THREE BATCHES, ALL MERGED.** The first time that has happened in a single plan:
he agreed batch 1, and the two later batches were set up without asking, as step 8 requires.

## FOR YOUR FIRST TURN

1. **Read `.plan-day.md` first.** Gitignored. It carries the figures, the floors and the batch tables.
2. **Read the system date and compare it with this document's.** **Never derive today's date from a
   document** — including this one. The machine clock and the system date disagreed by a few hours on
   2026-11-19/20 and the plan says so.
3. **`worktree.mjs list` will show `onboarding-runbook-steps` as `UNMERGED WORK`.** It is not — PR #1705
   squash-merged and the diff against `origin/main` is empty. **`done` refuses it and `--force` does not
   override. LUTAN SAID *"Leave it"*. Do not raise it again.**
4. **Three batch-3 folders were still `HELD` by their own sessions and were NOT cleared** —
   `public-site-per-shelter`, `onboarding-rehearsal`, `per-shelter-restore-shape`. `CLAUDE.md` says ask,
   do not tear down. `/clean-streams` settles them once those sessions are closed.
5. **PRODUCTION OWES `0424` AND `0425` BEFORE ITS NEXT DEPLOY. See the next section.**

## THE THING THAT MUST NOT BE MISSED: PRODUCTION OWES `0424` AND `0425`

`0.47.5` shipped on 2026-11-20 and **applied `0416`-`0421` in order**, which closes `765`'s warning.
**Two have landed since:** `0424` (`setShelterNames`, #1752) and `0425` (`createShelterAdminLogin`,
#1750). **Both are platform-console writes, so the console's newest two buttons fail on production until
they ship.** Planner's to put in front of whoever cuts the next release, ahead of anything else.

### `765` SAID FOUR MIGRATIONS AND IT WAS SIX — THE CORRECTION THAT MATTERS MOST

`765` wrote *"PRODUCTION NEEDS FOUR MIGRATIONS"* and named `0418`-`0421`, quoting #1742's own words. **It
owed SIX: `0416`-`0421`.** The Release Manager raised it; **the planner then measured production rather
than taking either side on trust** (`node scripts/apply-migrations.mjs --status --env production`, run
bare: **416 applied, 6 pending, zero drift**).

**#1742's words were true about #1742's own migrations. Nobody had read production.** **A stream can only
tell you what it wrote; only a production read tells you what is missing.** Carry that sentence forward —
it is the whole lesson.

**The consequence reached a brief and the mitigation fired.** `#wbsrw`'s *"not urgent"* rested on
*"`0417` backfilled every shelter"* — true of dev, unestablished on production. The
`website-silent-writes` brief said so in terms and forbade repeating it; **#1747 came in 3.3k under its
band and did not repeat the claim.**

## LUTAN'S ONE DECISION OF THE DAY, AND IT IS SETTLED

**`#flogn` — how a shelter's FIRST admin login gets created — was his to answer, and he chose a narrow
product-admin function, NOT a card.** Shipped as #1750 with migration `0425` and a console button;
recorded in `docs/decisions/2026-11-20-padmin-create-login.md`. **`#shadm` and `#onbrb` both stop needing
a terminal because of it.**

**Do not re-open it and do not read it as loosening the card rule.** It is the PADMIN idiom
(`is_product_admin()` plus `aal2`) that `0414`-`0425` already use, and PADMIN sits outside the card system
by his decision of 2026-11-18.

## FIGURES — TEN STREAMS, SEVEN BAND READINGS, TWO SET ASIDE, ONE UNMEASURED

| slug | PR | band | actual | verdict |
|---|---|---|---|---|
| `lookup-audit-row` | #1746 | 165-195k | **166,209** | inside, near the bottom |
| `website-silent-writes` | #1747 | 146-175k | **142,750** | under by 3,250 |
| `dev-shelter-login` | #1748 | 180-215k | **194,542** | **NOT A READING — `rescoped=yes`** |
| `platform-host-build` | #1749 | — | **unmeasured** | no comment posted |
| `padmin-create-login` | #1750 | 210-260k | **249,050** | **NOT A READING — `rescoped=yes`** |
| `script-exit-population` | #1751 | 210-260k | **194,556** | **UNDER by 15,444** |
| `shelter-own-name` | #1752 | 185-225k | **180,073** | under by 4,927 |
| `per-shelter-restore-shape` | #1753 | 145-190k | **162,504** | inside |
| `public-site-per-shelter` | #1754 | 175-215k | **201,256** | inside |
| `onboarding-rehearsal` | #1755 | 160-200k | **249,613** | **OVER by 49,613** |

**Seven readings: three inside, three under, one over. The table is broadly right and leans slightly
dear.** Both set-aside figures were marked `rescoped=yes` by the stream itself, which is the mechanism
working — neither was a brief the planner corrected mid-flight.

**THE FLOOR, NINE READINGS: 87,236 · 87,236 · 87,460 · 87,854 · 87,919 · 87,959 · 88,248 · 88,248 ·
90,464.** **Eight inside 87.2-88.3k; the ninth is 90,464.** That is the same shape `765` recorded from
eleven (~86.8-87.9k with an excursion near 91k) and `764` from seven, **shifted up by roughly 400
tokens** — four complete days now agree on the SHAPE and not on the exact numbers, so **re-derive it
daily and never carry it forward.**

**TWO FLOORS REPEAT TO THE DIGIT ACROSS BATCHES (87,236 and 88,248).** Recorded as an oddity and **not
explained** — it may be coincidence in a tight cluster, or it may say something about how the figure is
composed. **Do not build an inference on it until somebody looks.**

### `765`'S OWN REVISION CAME BACK NEGATIVE — THE FIRST ONE TO GO AGAINST THE PLANNER

`765` revised: *"a sweep that EDITS is not an audit. Only an untouched read stays on the audit row."*
**`script-exit-population` was banded 210-260k off the edit-many-call-sites row because of it, and came in
194,556 — 15.4k BELOW the bottom.** Forty-six conversions, the condition and the exit-code tables all
handed over cost **less** than the raised band. **`shelter-own-name` also came in 4.9k under.**

**Two under-readings in one batch says the revision OVER-corrected. Lower it back toward the audit row,
and do not raise it again.** The underlying point survives in a narrower form: a sweep that edits is
dearer than a read, but not by a whole row — and the discount for a brief that hands over the cause, the
decision AND the shape of the fix is larger than `765` allowed for.

### THE NEW HYPOTHESIS, FROM THE DAY'S ONLY OVERRUN

**`onboarding-rehearsal` was banded 160-200k as a driven walkthrough** (floor plus ~6.3k a step across six
drivable steps, plus a 474-line document to correct in place) **and came in 249,613.** Its PR title says
why: *"followed on dev, corrected, three faults found"*.

**Its brief had already named this exact risk and did NOT price it:** *"if the rehearsal finds a step that
is genuinely broken rather than merely undocumented, fixing it is a different piece of work… your band
stops at the report."* **Naming a risk is not pricing it** — the skill says so in its band section, and
this is the clean demonstration of it.

**HYPOTHESIS for the next such stream: a driven walkthrough that also CORRECTS the document it is walking
bands on the medium row (170-290k), not on the per-step arithmetic.** The arithmetic prices the walking;
it does not price finding three faults. **One reading, so write it into the next brief and record which
way it goes.**

### THE `+10k` FOR LOOKING STILL HAS NO VERDICT

#1753 was the nearest thing to a looking-not-driving stream — it builds nothing on purpose — and landed
**inside** its band without needing the allowance. **Neither confirmation nor refutation. Still waiting.**

## WHAT `765` LEFT OWED, AND WHAT IS OWED NOW

- **The floor-row narrowing: STILL OWED, and now evidenced by four days instead of three.** Narrow it to
  ~87.2-88.3k with a rare excursion near 90-91k, **without shifting the scale rows** (the 2026-11-15
  incident is why that clause exists). **It is a skill-file edit, and the skill says if you add to that
  file something else comes out — which is why three editions have carried it.**
- **The band-table note about two bottoms nearer 135k: STILL OWED and now clearly wrong.** Nothing has
  landed below **142,284** in twenty readings. **Drop it in the same edit as the floor row.**
- **`#scimp`'s 46 unreviewed scripts: CLOSED by #1751.** `check-script-exits.mjs` now reads
  *15 use `exitWith`, 8 verified exit-ok, 0 known exit-debt, 1 exempt, 0 unmarked*, with
  `--strict-widened` still deliberately unwired. **One stale line in its output survives:** the exempt
  `scripts/dev-signin.mjs` is described as *"owned by the product-admin stream (#1736); for the planner
  to convert"* — **#1736 and #1748 have both merged, so that reason is out of date.** A one-line fix for
  whoever is next in that file.
- **NEWLY OWED: `#lnlft`**, filed by the planner from #1752's own report — **a second shelter's adopt page
  still offers Lanna's contact email** (`src/app/adopt/[id]/page.tsx:196`) and one Security string says
  *"Lanna Animal Care"*, a spelling that appears nowhere else. **Not a mechanism fault:** #1752
  established that every rendered NAME goes through `shelterNames()`; **a contact email is not a name and
  never passed through the reader.** Small, visitor-facing, and somebody would actually send that email.

## FILED, TICKED AND CORRECTED

**Ticked by streams:** `#lkaud` (#1746), `#wbsrw` (#1747), `#dvshl` and `#stcnt` (#1748), `#plhbd`
(#1749), `#flogn` (#1750), `#scimp` and `#sflag` (#1751), `#shnms` and `#shnam` (#1752), `#wbsof`
(#1754), `#onbrb` (#1755).
**Not ticked, correctly:** `#shres` — #1753 **rewrote** it rather than ticking it, because its answer is
*build nothing yet* and the build, if any, is what remains open.

**Filed by the planner:** `#lnlft` (above), plus a **path correction on `#flogn`** — it pointed at
`src/app/admin/product-admin/actions.ts`, **which does not exist**; the console is `src/app/platform/`.
**One `ls` settled it**, which is the 2026-11-12 brief fault caught before a brief went out rather than
after.

**AND THE GUARD REFUSED HALF OF THAT FILING, CORRECTLY.** The planner had written into a brief that
`#shnms` named the stale path too. **It names no file at all**, and the guarded filing script exited
non-zero rather than editing it. **The brief and `.plan-day.md` were both corrected.** That is why a
backlog-editing script gets a guard: it caught the planner, not the item.

**NOT FILED ON PURPOSE:** #1752 left *"pressing Save on Test Shelter 2 was refused by the harness
classifier"* as a pending manual check. **#1755's rehearsal pressed that form on its own shelter as part
of verifying Step 6**, so the gap closed by being used rather than by an item. **Keep doing this rather
than filing phantoms** — it is the same judgement `765` recorded on `#rcpfm`.

## WHAT IS LEFT FOR CLAUDE AT ALL

**Read the backlog rather than this list** — nine items closed in one day and the sections have moved.
**37 open items on `main` after the merge, 38 on `backlog` with `#lnlft`.**

**`#gcnst` is still LUTAN'S HANDS ONLY** and unchanged from `765`: the item says in terms that a Claude
session cannot close it. The planner's half — establishing from Google's documentation whether renaming a
published, brand-verified app triggers a fresh review — **is still not established** and still offered.

## PROCESS NOTES

- **A DEV-STATE CHANGE WORTH KNOWING, not a fault:** #1752 added its own dev login to the product-admin
  list on the dev database for a browser check, and **#1755 created a shelter keyed `rehearsal-…` that
  CANNOT BE DELETED** — 111 of the 114 foreign keys into `shelters` are `ON DELETE NO ACTION`,
  `shelter_hosts` is `RESTRICT`, and there is no delete screen on purpose. **Dev test data is disposable
  and everything is wiped before the real migration, so there is nothing to undo** — but a later stream
  reading the product-admin list or the shelter list on dev should not read either as a surprise.
- **THE BACKLOG MERGE CONFLICTED ON ONE ITEM AND THE TWO SIDES DISAGREED IN OPPOSITE DIRECTIONS.**
  `#flogn` was **ticked on `main`** (closed by #1750, carrying the DONE note recording his decision) and
  **unticked on `backlog`**, where the planner had filed the path correction that morning. **`main`'s
  ticked line was taken** — the correction is moot once the item is closed — with a script that exits
  non-zero on a lost anchor or a missing DONE note. **Do not assume `main` is the newer side; here it
  was, and `765`'s predecessor recorded the opposite.**
- **`#sflag`'s fix is in the tree and it HELPS the next stream.** `shelter-export.mjs` line 32 now refuses
  an unknown argument and names it (`unknownArgs` / `unknownArgsMessage` in `scripts/lib/`). A restore or
  export that silently accepted a mistyped shelter key would be the worst possible version of it.
- **`check-backlog-sections.mjs` READS `main`'S COPY, NOT THE BACKLOG WORKTREE'S.** After filing `#lnlft`
  it still reported 37 open items. **That is not a failure to chase** — the commit hooks
  (`check-backlog-ids`, `check-backlog-titles`) validated the new item at 38.
- **`worktree.mjs done` behaved correctly this time**, printing its full success line. `765`'s warning
  stands: **verify that line, do not assume the exit code.**
- **The hard sequence was kept at all three setups** — sync, three `new`, three briefs, `streams`, then
  the list. **Nothing was cleared and no PR body was read before the list went out.**

## INTERRUPTIONS

**NONE THAT COST A STREAM.** **Two `AskUserQuestion` calls across nine streams:** one carrying batch 1 and
the release-timing question, one carrying `#flogn`'s decision — **which the item itself said was his.**
#1748 and #1750 each reported `rescoped=yes` themselves, which is the stream's own reading of its own job
and is why both are kept out of the band evidence.

**ONE COST THAT WAS NOT AN INTERRUPTION:** the Release Manager's correction cost one brief edit and one
production read, **and it was right.** A peer correcting a planner's figure before a stream acts on it is
the mechanism working, and it should not be counted against the day.
