# Planner handover — edition `760`, 2026-11-18

**This is a DELTA against `759`.** It says what changed, corrects its predecessor, corrects itself, and
reports what `759` left owed. Figures, batch composition and ports live in `.plan-day.md`.

**It outranks nothing.** One chat reads it, one plan replaces it, and a wrong line is corrected by its
successor rather than by a reviewer.

**AND IT OWNS AN OMISSION BEFORE ANYTHING ELSE: THE FIRST PLAN OF 2026-11-18 WAS SET UP, MERGED AND
CLEARED WITHOUT A HANDOVER.** `SKILL.md` says one plan is one handover, written when the plan's last
batch is set up. That plan's last batch was its only batch, set up this morning, and no edition was
written. **`760` therefore covers it as well as being written at the next plan's setup.** Nothing was
lost — its three figures are in `.plan-day.md` — but the rule was not followed, and a session reading
only the edition numbers would see a day with two plans and one handover.

**WHICH PLAN'S FIGURES THIS EDITION REPORTS.** The **fourth** plan's complete set of **six** (#1669,
#1670, #1671, #1673, #1674, #1675), read this morning in the day's single measurement slot — the set
`759` said it owed. **The fifth plan's three (#1676–#1678) were read only because the pre-clearing check
requires one read per merged PR; they belong to `761`**, and they are in `.plan-day.md`. One of them is
quoted below because it settles a question `759` left genuinely open.

## FOR YOUR FIRST TURN

1. **Read `.plan-day.md` first.** It is gitignored. It holds both of 2026-11-18's plans, their statuses,
   both figure tables and every finding filed.
2. **Read the system date and compare it with this document's.** **Never derive today's date from a
   document** — including this one.
3. **Check whether the current batch merged with `gh pr list --state all --head claude/<slug>`, AND
   CHECK IT AGAINST `origin/main`** — `scheduled-writer-visibility`, `security-check-coverage`,
   `calendar-per-shelter-schema`. **That `gh` read was STALE BY SECONDS today** and reported two merged
   PRs as `OPEN`; what caught it was that both branch heads were already ancestors of `main`, which
   cannot be true of an open PR. **When the PR state and the git graph disagree, believe the graph.**
4. **Read the repository AFTER the pull, not before.**
5. **`#calsh` is the line to read first**, and the next section says why.

## READ THIS FIRST: THE LAST KNOWN PLACE ONE SHELTER'S DATA REACHES ANOTHER'S

**`src/lib/clinics/calendar-sync.ts` reads its credentials straight from the environment** — four
variables, `GOOGLE_CALENDAR_REFRESH_TOKEN`, `GOOGLE_CALENDAR_ID`, `GOOGLE_OAUTH_CLIENT_ID`,
`GOOGLE_OAUTH_CLIENT_SECRET` — so there is **one calendar per deployment and no `shelter_id` anywhere in
the path.** The sweep, `syncPendingVisits()`, sends every shelter's clinic visits to it.

**So a second shelter's vet visits would appear as events in the calendar Lanna's staff read every day**,
with nothing in the app to say where they came from. Filed as **`#calsh`** from PR #1678's own report.

**IT IS A WRITE LEAK, NOT A READ LEAK, AND THAT IS WHY IT LEADS THIS EDITION.** Everything the programme
has closed so far stopped one shelter *reading* another's rows. This one would *put* one shelter's data
in front of another's staff. **Nothing leaks today because shelter #2 does not exist** — and it must be
closed before one is onboarded and uses clinic visits, the same prerequisite shape Part 9 carried.

**The shape is already decided elsewhere, so it is smaller than it reads:** `0404` settled table-rather-
than-columns, ciphertext with the key outside the database, explicit `0392`-shaped policies, and Admin
seeing status columns only. **And `CALENDAR_OFF_NOTE` already exists** — *"The calendar is not switched
on in this app, so this visit has not been sent"* — so the **refusal** has a precedent too, which is the
rule Part 9 settled for the Drive.

## THE CORRECTION TO `759`'s OWN RULE, AND IT SHARPENS IT RATHER THAN OVERTURNING IT

**`759` recorded, against itself, that it had narrowed a published band row twice in one afternoon and
been wrong both times.** The rule it drew was *do not narrow a published row without writing down why.*

**Today narrowed a band mid-setup and was right, which means the rule needed a sharper edge.**
`dictionary-shelter-prose` was presented at 200-255k on the strength of yesterday's decision file, which
said the mechanism *"touches every reader of the dictionaries"* — 640 files import from `lib/i18n`. **The
planner then read the directory**, found `I18nProvider.tsx`, `get-t.ts` and `get-dictionary.ts` already
there, judged a central fill plausible, **lowered the band to 175-220k and wrote the reason into the
brief.** It came in at **195,320 — mid-band.**

**THE DISTINCTION, AND IT IS THE USEFUL PART: NARROWING A BAND ON A FACT YOU HAVE JUST READ IS SOUND.
NARROWING IT ON REASONING IS WHAT WENT WRONG ON 2026-11-17.** Yesterday's two narrowings came from
inference about the floor; today's came from an `ls` of a directory. **Same action, opposite outcome,
and the difference is whether something was opened.**

## WHAT `759` LEFT OWED, AND THE BAND METHOD IS NOW WORKING

**`759` owed the fourth plan's six figures. They are here. Nothing else was outstanding.**

**SEVEN OF NINE READINGS ACROSS THE TWO SETS LANDED INSIDE THEIR BANDS, AND BOTH MISSES ARE EXPLAINED.**
That is a real change: three editions running had recorded the discount as unapplied and the misses as
growing. **`759`'s size-dependent rule — apply the hands-over-everything discount above ~200k, not
below ~175k, because the floor dominates a small stream — was applied for the first time today and held.**

**WHAT IS STILL NOT PROVEN, STATED RATHER THAN GLOSSED: the top half.** No stream since the correction
has been banded above 250k. **Whether the discount holds on a genuinely large job is unestablished.**

## FIGURES — the FOURTH plan's complete set of six

| slug | PR | band | actual | verdict |
|---|---|---|---|---|
| `tenancy-part9-drive-schema` | #1669 | 155-190k | **160,337** | **inside** |
| `tenancy-part8-naming-prose` | #1670 | 150-195k | **151,937** | **inside**, near the bottom |
| `build-halt-gates` | #1671 | 115-160k | **165,685** | **over by 5,685** |
| `shelter-export-proof` | #1673 | 135-185k | **138,744** | **inside**, near the bottom |
| `pi-scheduled-writers` | #1674 | 140-180k | **179,041** | **inside**, near the top |
| `tenancy-part9-drive-app` | #1675 | 190-225k | **225,479** | **over by 479** |

All six ran `low`, dials matching their bands, `compacted=no`, `rescoped=no`, `finished=yes`. **The
first complete set with no disqualified figure.** Both misses: #1671 is the stream that disproved the
discount and its comment quotes a pre-widening header; #1675 missed its top by **479 tokens**, which is
not an overrun in any useful sense.

**`#1673` IS THE ONE TO UNDERSTAND BEFORE REVISING ANYTHING.** It came in at **138,744**, below the
150-170k `759` said a small stream costs. Its band was **deliberately wide (135-185k)** because the item
allowed two outcomes, and its brief said answer (b) *"should land near 135–150k"*. **It chose (b) — the
recorded reason rather than the built proof — and landed at 138,744.** So the honest claim is: **a small
stream costs 138-170k, and the bottom is reached only when the brief explicitly permits a
written-reasoning outcome instead of a built one.**

**THE FLOOR, NINE FIGURES ACROSS BOTH SETS: 86,693 / 87,417 / 87,482 (×3) / 88,132 / 89,302 / 89,802 /
90,091.** `SKILL.md`'s `~86–90k` row still describes the data. **No edit owed, and the scale rows are
still not to be shifted with it.**

## THE PROGRAMME, AND WHAT IS LEFT FOR CLAUDE AT ALL

- **DONE:** Parts 1, 2, 3, 4b, 6, 7, 8 (in full, #1670 and #1677), 10, 11, and **Part 9's schema and app
  halves** (#1669, #1675). **`0407` closed the cross-tenant card-catalogue hole `759` led on.**
- **Part 5 (`#ujqr5`) is the RELEASE, and it is his** — Worker first, then `0392`, in two releases. It
  also frees `#shtci`. **The biggest thing on the board.**
- **Part 12 (`#egq18`) is HELD AT HIS WORD, 2026-11-18: *"Hold it for now"*.** Part 13 stays blocked.
- **`#cn7gk`:** the write path shipped as `scripts/connect-shelter-drive.mjs`. What remains is the
  **two-account proof**, which needs him to create a second Google account. **Expect it to stay open.**
- **AND THE THING TO PUT TO HIM: after today's three streams there are almost no Claude-buildable items
  left.** All 31 open items were read on 2026-11-18; Quick wins, Mobile, Resident operations, Medical
  records, Facility, Auth and Deployment have **no open items at all**, and what remains is his hands or
  blocked on them. **The public website is finished and switched off** — deployment-before-go-live is
  four items, all ticked, and `PUBLIC_SITE` is `"locked"` on production. **That is a date he names, and
  it has been offered once and not chosen. Do not re-ask it; ask what comes after the programme.**

## HIS DECISIONS, SO THEY ARE NOT RE-ASKED

- **NOT BUILDING A PUBLIC MICROCHIP REGISTER** (`#dqgy8`, ticked 2026-11-18, guided session). **Two of
  his four answers corrected the scoping paper's facts rather than choosing from its options:** a
  **national DLD register does exist** (the paper had it as *not established* after four search rounds),
  and **the shelter records no chip numbers at all**, which retired the item's own precondition and meant
  nothing was sent to any outside service. **The paper is stale on that one fact; the item is the
  correction.** The one live action is **`#chpap`**, the adoption-paperwork line, which is the Director's.
- **PART 12 HELD** (above). He chose it first out of three directions and held it once the measurement
  turned out to need the test environment broken under an outside tester.
- **A per-shelter export carries DATA AND NOT STAFF LOGINS** (`#expgp`, closed).

## FILED, AND AN INSTRUMENT CAUGHT THE PLANNER FOR THE FIRST TIME

**Filed:** `#calsh` (above) · `#lblcr` and `#srreg` (2026-11-18, from PR #1674) · `#chpap` ·
`#egq18` amended with the Part 12 method · **`#ccwnx` was filed by ANOTHER session** mid-plan.

**THE BACKLOG PRE-COMMIT HOOK REFUSED THE PLANNER'S COMMIT, AND IT WAS RIGHT.** Committing `#calsh` also
carried that other session's uncommitted `#ccwnx` edit. The hook said: *"This commit changes backlog
items its message does not name: #ccwnx."* **Naming it would have been claiming someone else's work.**
Each session then owned its own commit. **Every other instrument this record celebrates caught an item or
a stream; this one caught the planner.**

**And the planner then verified `#ccwnx`'s substance rather than trusting the note:**
`scripts/check-card-catalogue-writes.mjs` exists (2,989 bytes, created today) and **nothing runs it** —
no match in `.github/`, `package.json` or any other script. **Its own header says why it cannot go in the
PR `check` job: it needs `SUPABASE_ACCESS_TOKEN`.** So it needs a nightly, and **dev only**: `0407` is
not on production, so a production nightly would go red every night for a known reason — the `#shtci`
trap, now written into the brief rather than rediscovered.

**THE GENERAL LESSON, AND IT IS NEW: A FIX THAT SHIPS ITS OWN CHECK IS NOT GUARDED UNTIL SOMETHING RUNS
THE CHECK.** `#ctlg8` closed a real cross-tenant hole and wrote a check to keep it closed. **The check
passes and nothing executes it**, so the policy could be reverted in silence. **After any PR that adds a
`scripts/check-*.mjs`, ask what runs it** — and if the answer is a live-token read, the answer is a
nightly, not CI.

## PROCESS NOTES

- **A `worktree.mjs new` FAILED SILENTLY THROUGH AN OUTPUT FILTER.** `security-check-coverage` printed
  nothing matching the planner's `grep -E "localhost|Open a Claude"` and **the folder had genuinely not
  been created**; a re-run succeeded. **"No output" is not evidence of success any more than it is
  evidence of a fault.** The brief block has told streams this about check scripts for weeks; **it now
  applies to the planner's own commands. Check the artefact, not the output.**
- **A DEV SECRET EXISTED IN ONE WORKTREE ONLY AND WAS NEARLY CLEARED AWAY.** PR #1678 reported that Part
  9's decision file **wrongly claimed dev already held `DRIVE_CREDENTIALS_KEY`**; it did not, and that
  stream put a dev value in its own gitignored `.env.local`. **The planner recovered it into the main
  checkout's `.env.local` before clearing**, with a comment saying why: new worktrees copy that file, and
  a different key orphans the ciphertext already on dev. **A decision file can state a falsehood about an
  environment and no instrument will catch it.**
- **THE GATES RETRY IS SETTLED: EIGHT RUNS, SEVEN INDEPENDENT OF THE STREAM THAT WROTE IT.** #1671,
  #1673, #1674, #1675, handover `759`, #1676, #1677 and #1678 all reported `build=0` on a single honest
  run, with **#1669 as the control at `build=1`** from before it merged. **`759` recorded it as a
  hypothesis with one run; it is now a fix that works.**
- **A `git merge backlog` CONFLICT NEEDED A THREE-WAY JUDGEMENT FOR THE FIRST TIME.** `#b4cmn` was
  **ticked on `main`** by its stream and **retitled on `backlog`** by the planner. **Neither side was
  wholly right:** `main` would have left it ticked while its title claimed 53 strings remained;
  `backlog` would have left accurate text unticked. **Taking "the newer side" is not always a rule you
  can apply to a whole line.** Resolved by keeping the corrected body, applying the tick and rewriting
  the title to say what shipped — recorded in the item itself, and guarded by arithmetic.
- **`#1678` POSTED A CORRECT USAGE COMMENT *AND* VAGUER PROSE BESIDE IT** — *"the session ran well under
  200k as far as I can tell (unmeasured precisely)"* next to a comment reading `tokens=210727`. **The
  planner wrote "a stream wrote prose instead" into all three of today's briefs, found the claim wrong
  during the pre-clearing check, and corrected all three before the sessions opened.**
- **MECHANISM A HAS NOT RECURRED IN TWENTY-SEVEN CONSECUTIVE STREAMS.** Two unexplained occurrences
  remain (#1636, #1647), both undiagnosable. **Do not re-investigate without a new occurrence.**
- **THE USAGE-COMMENT PRESENCE CHECK HAS GONE 27 OF 27 AND CAUGHT NOTHING. UNTESTED, NEVER WORKING.**
- **THREE WORKTREES ARE HELD AND NOT CLEARED**, because their Claude sessions are still open in the
  folders: `card-catalogue-writes`, `shelter-drive-connect`, `dictionary-shelter-prose`. **All three
  posted their usage comments first, so the pre-clearing check passed and nothing is lost by the
  refusal.** `worktree.mjs` declined rather than leaving husks. **Closing those sessions is his.**
- **PREFLIGHT: everything a planner needs is reachable. Production was not probed**, so nothing in this
  edition asserts a production fact that was not read from a committed file or a stream's own report.

## INTERRUPTIONS

**NONE in either of today's plans.** The Part 12 exchange cost him four answers, and three of those were
the planner stopping to ask rather than deploying into an outside tester's session. **That is a cost of
the task, not a briefing defect** — and it is the distinction `SKILL.md` asks for when it says to count
interruptions as a cost of the brief.
