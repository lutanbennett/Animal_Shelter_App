# Planner handover — edition `763`, 2026-11-19

**This is a DELTA against `762`.** It says what changed, corrects its predecessor, and reports what `762`
left owed. Figures, batch composition and ports live in `.plan-day.md`.

**It outranks nothing.** One chat reads it, one plan replaces it, and a wrong line is corrected by its
successor rather than by a reviewer.

**IT COVERS THE NINE STREAMS MERGED SINCE `762`, AND ALL NINE HAVE FIGURES:** #1706, #1707, #1709,
#1710, #1711, #1712, #1713, #1714, #1716. **#1708 is `762`'s own handover PR and #1715 is a release cut;
neither counts.** **Two more were open and unmerged when this was written** — `cn7gk-upload-proof`
(#1718) and `drive-scope-decision` (#1717) — **so their figures belong to `764`.**

**IT LANDS ON CADENCE, BUT ONLY JUST.** Lutan asked for it at **8 of 9**; #1716 merged while it was
being written, taking it to nine. `762` was genuinely written early and says so in its own opening, so
the nine-stream rule has now fired on its own exactly once. **The cadence is settled and not to be put to
him again.** But the planner nearly published *"written early"* as a fact about a document that was not,
and **only a session listing read in the same turn caught it** — the same shape as the fault below.

## FOR YOUR FIRST TURN

1. **Read `.plan-day.md` first.** Gitignored; holds the fourth plan of 2026-11-19 in full, with the
   detail this edition deliberately only points at. **There were FOUR plans that day** — unusual, and the
   reason is in "THE DAY WAS NOT A BATCH DAY" below.
2. **Read the system date and compare it with this document's.** **Never derive today's date from a
   document** — including this one.
3. **`worktree.mjs list` will show `onboarding-runbook-steps` as `UNMERGED WORK`.** It is not.
   `git diff --stat origin/main...claude/onboarding-runbook-steps` is **EMPTY** — PR #1705 squash-merged
   and those five commits are the pre-squash originals. **`done` refuses it and `--force` does not
   override. LUTAN SAID *"Leave it"*. Do not raise it again.**
4. **Read the repository AFTER the pull, not before.**
5. **The three streams named above were open when this was written.** Do not read `free` / `0 ahead` /
   no PR as "never started" — see the planner fault below, which is the second instance in one day.

## THE DAY WAS NOT A BATCH DAY, AND THE MOST VALUABLE WORK WAS DONE IN THE CHAT

**Four `/plan-day` runs, and between them Lutan and the planner did a piece of hand work that had been
blocking an item for weeks: the two-account Google Drive proof (`#cn7gk`).** It is worth reading as a
model, because **it cost about an hour and it closed what a stream could not have closed at all** — the
blocker was an account, not code.

**WHAT WAS PROVED, AND IT IS PROVED AGAINST GOOGLE RATHER THAN AGAINST OUR OWN LOGIC:** shelter #2's
token aimed at Lanna's folder was refused `HTTP 404`, and Lanna's token aimed at shelter #2's folder was
refused `HTTP 404`. **Google returns *not found* rather than *forbidden*, which is the stronger answer:
it does not even confirm the other folder exists.** Both runs used `connect-shelter-drive.mjs` without
`--apply`, aimed at a shelter key that does not exist, so nothing could be written either way.

**THE FINDING THAT REMOVED MOST OF THE EXPECTED WORK: A REFRESH TOKEN BELONGS TO THE PERSON, NOT TO THE
OAUTH CLIENT.** The second account was connected through the **existing published Desktop client** —
**no new Cloud project, no new OAuth client, no new consent screen, and no exposure to the 2026-09-25
fault where a client left in *Testing* expired its tokens after seven days.** It is also what real
onboarding looks like: the shelter grants OUR app access to THEIR Drive.

**`#cn7gk` was retitled** — its title claimed *"nothing writes a `shelter_drive_credentials` row"*, which
stopped being true that morning — **and what is left is the single word *upload*.**

## THREE DECISIONS HE MADE THAT DAY — ALL RECORDED IN FULL ON THEIR OWN ITEMS

**Read the items, not this summary.** Each carries his words, the shapes rejected and the reasoning;
what follows is only the one thing per item that a planner needs before briefing it.

**`#drvcl` — settled after changing shape THREE TIMES in an hour** (product-admin console → the
director sends him the token → **"landing straight into the app is even better"**). **The shelter's own
Admin connects Drive from that shelter's own Settings, credentials landing straight in the app; Admin
only, so no new card and no new exception.** The middle shape was rejected because the token carries the
FULL `drive` scope — sending it would put one organisation's key in a message neither party controls,
once per shelter, for ever — and **that argument is not to be re-litigated quietly.** **The modelling
lesson worth carrying beyond this item: the self-service shape is the SIMPLEST to build.** A one-time
link exists only to tell the app which shelter a consent is for, and a director signed in to her own
shelter already answers that. **It deletes a mechanism rather than adding one.** Earlier answer
**superseded in place**, not deleted.

**`#dscop` — filed on his instruction, and it GATES `#drvcl`.** We ask for the full `auth/drive` scope,
which Google classes as *restricted*; a restricted scope on a **public, self-service** app triggers
verification with an **annual third-party security assessment** — a recurring bill against the
zero-ongoing-cost rule — and is why a new account consenting was shown **"Google hasn't verified this
app"** (observed, not inferred). The candidate answer is `drive.file`. **The hinge nobody has settled:
does a file a human places into an app-created folder become visible to the app?** **And his own message
may decide it** — the shelter's documents have **not** moved to its Google account yet, *"so we have the
opportunity to either create a folder from scratch and then migrate the files or decide to run it as a
hand crafted option"*. **There is a window and it closes when the files move.**

**`#gcnst` — his own observation, and only he can close it.** The consent screen still names the product
`Lanna Care for Animals`; it was renamed Cooper Jaidee on 2026-11-14. **It shows on every consent screen
the project serves**, so new staff signing in with Google read it too. **Nobody had done it because the
only place the work was described is inside `#ki6cx`, ticked NINE DAYS BEFORE THE NAME WAS CHOSEN** — so
it lists the domains and not the name, **and nobody re-reads a ticked item.** Nobody has established
whether renaming a brand-verified app re-triggers review: **do not promise a size.**

**AND A CORRECTION TO THE RECORD, WHICH MATTERS BEYOND THESE THREE:** the Google accounts stocktake says
verification is not required *"since your app is not requesting any sensitive or restricted scopes"*.
**True of the SIGN-IN client; false of the Drive client.** Do not reason about Drive from that line.

## FIGURES — NINE, EIGHT VALID, ONE OVER

| slug | PR | band | actual | verdict |
|---|---|---|---|---|
| `canary-isolates-protection` | #1706 | 146-175k | **152,379** | **inside** |
| `writer-runs-lint-flag` | #1707 | — | **142,405** | **NOT A BAND READING — `rescoped=yes`** |
| `shelter-management-app` | #1709 | 200-270k | **224,659** | **inside** |
| `onboarding-runbook-screens` | #1710 | 150-185k | **152,630** | **inside, at the band floor** |
| `shelter-write-schema` | #1711 | 165-190k | **162,234** | **under by ~3k** |
| `canary-plain-run-trust` | #1712 | 145-175k | **154,934** | **inside** |
| `shelter-admin-role-schema` | #1713 | 165-195k | **159,175** | **under by ~6k** |
| `shelter-write-app` | #1714 | 145-175k | **178,482** | **OVER by ~3.5k** |
| `shelter-admin-role-app` | #1716 | 155-190k | **163,891** | **inside** |

**Eight valid readings: five inside, two under, one over.** **#1707 is excluded on its own report and its
PR body never says what the rescope was** — one question if anyone talks to that session, never a guess.

**THE FLOOR, NINE FIGURES: 86,759 · 86,761 · 87,050 · 87,474 · 87,482 · 87,482 · 87,482 · 87,773 ·
90,375.** **Eight of the nine sit in a 1,014-token band; the ninth, #1716's, is 90,375 — just OUTSIDE the
stated `~86–90k`**, and it is the highest floor the project has recorded (`762`'s top edge was 90,127,
also an outlier). **No edit owed on one reading**, but two consecutive top-edge outliers is the shape of
a range that is drifting, so **re-measure rather than carry `~86–90k` forward unexamined.** **The scale
rows are still not to be shifted with it.**

## TWO BAND REVISIONS, IN OPPOSITE DIRECTIONS, AND ONE WAS A PREDICTION THAT FIRED

**(1) THE PERMISSIONS-SCHEMA `+30k of proof` PREMIUM FALLS TO ABOUT `+20k` — BUT ONLY WHEN A HARNESS
PATTERN ALREADY EXISTS TO COPY.** This was written down as a prediction *before* the second reading
existed (*"if it also lands near 160k…"*) and **it fired**: #1711 at 162,234 and #1713 at 159,175, both
under bands carrying the full premium. **The condition travels with the revision** — a permissions schema
PR with no harness to copy is not covered by it. **This refines `762`'s own restatement** (that the
premium is about *unsettled* permissions, not permissions) rather than contradicting it: settled design
and a copyable harness are two different discounts and both were present.

**(2) THE SPECIFICATION DISCOUNT WAS OVER-CLAIMED FOR AN APP HALF.** #1714 was banded at the bottom of
its row because its schema half handed it a full specification — and it came in **over**. The discount
did not pay for mapping SQLSTATEs to readable sentences **in two languages**, a release note, and a
browser attempt. **A specification discounts a SCHEMA half much more than an APP half.**

**AND THE RE-TEST FIRED, WHICH IS WHY THIS ONE IS A REVISION RATHER THAN A HUNCH.**
`shelter-admin-role-app` was banded **155-190k** on exactly that correction — the same shape of work as
#1714, an app half built on a handed-over specification, priced above the row it would otherwise have
taken. **It came in at 163,891, inside.** **Two predictions written before their readings existed, both
fired on the same day.** Keep writing them down before the number arrives: a revision that was recorded
in advance is evidence, and the same revision applied afterwards is a story.

## WHAT `762` LEFT OWED — read this before you act on its recommendations

- **ITS BAND-TABLE RECOMMENDATION IS STILL UNACTED, AND THE DAY'S EIGHT FIGURES WEAKEN IT.** `762`
  recommended moving two bottoms nearer 135k on three readings below 143k. **Nothing on 2026-11-19 came
  in below 142,405, and that one is excluded.** So the case has not grown. **Still deliberately not
  edited** — two changes to the same rows from the same reasoning is thrashing.
- **`brief-blocks.md` STILL DESCRIBES THE AGENT BUILD HALT AS LIVE**, and `762` asked for it to be
  rewritten on more than one day's readings. **Not done, and the planner copied that block verbatim into
  two briefs on 2026-11-19** — so the stale text is still propagating. **It is a `SKILL.md`-family edit,
  which means a stream and a PR.**
- **"A TICK IS NOT A TITLE REWRITE" RECURRED, IN A NEW COSTUME: THE PLANNER'S OWN.** `762` reported it
  three times from streams. On 2026-11-19 the planner had to retitle **`#cn7gk`** (its title still said a
  shelter *cannot* connect its own Google account, hours after one did) and **`#drvcl`** (its title named
  the product-admin screen, which had become the fallback). **Both were caught by re-reading the title
  alone after changing the item — the step the skill asks for and that keeps being skipped.** `762`'s
  suggestion to move it into `brief-blocks.md` stands, and would not have caught either of these,
  **because these were the planner's, not a stream's.**

## THE PLANNER FAULT OF THE DAY, AND IT HAPPENED TWICE

**The shape: a reading taken minutes ago was treated as the present.**

1. **In the morning**, *"it's merged"* was read against a stale `list_sessions` snapshot and the planner
   asked twice more about a folder. **Cost: three turns.** The cure written down then — settle state from
   `gh`, `worktree.mjs` or a call made in the same turn — **held for the rest of the day.**
2. **In the evening it came back in a new form.** `worktree.mjs list` said `free` / `0 ahead`, no PR
   existed, and a `list_sessions` call returned seven rows without the stream's session. The planner was
   about to report that `shelter-admin-role-app` had **never been opened**. **It had been.**
   `include_archived: true` returned it at once, active minutes earlier. **What actually settled it was
   the worktree itself: an untracked `docs/test-plans/shelter-admin-role-app.md`, which only a session
   writes.**

**THE RULE, AND IT EXTENDS `762`'s "a comment is not a status":** `free` + `0 ahead` + no PR is a
**snapshot, never a verdict**, and **one `list_sessions` call is not a census.** **Look in the folder
before saying nobody has been there.** Caught before it reached him, which is the only reason it cost
nothing.

## FILED, TICKED AND CORRECTED

**Ticked by streams:** `#shmgt` (by #1714, correctly — its create-and-map half shipped), `#cnutr` (by
#1712, which answered it with option (c): the nightly now runs a trusted pass **and** an `--untrusted`
pass, two rolled-back calls of about two seconds, **and nothing stopped being asserted**).

**Filed by the planner from streams' own reports, none of which filed them itself — correctly:**
`#shadm` (a created shelter had no Admin role and no login, so nobody could sign in to it — it became a
stream the same day and shipped as `0415`/#1713), `#drvcl`, `#shrow` (what else a brand-new shelter needs
before it *works* as against merely being signable-into — **not established, and #1713 said so rather
than guessing**).

**Filed by the planner from his own words:** `#gcnst`, `#dscop`.

**Corrected in place:** `#onbrb`'s done-when named `docs/shelter-onboarding.md`, **which has never
existed** — it is `docs/shelter-onboarding-runbook.md`.

**PROVED AND WORTH KNOWING: `0415`'s harness output was `cards=0 is_admin=true has_permission=true`** —
the Admin role it creates **holds no cards and still has full access**, which is exactly what
`roles.is_admin` means and the thing most worth proving rather than asserting.

## WHAT IS LEFT FOR CLAUDE AT ALL

**Shipped as this edition was written: `#shadm`'s screen half (#1716)** — the product-admin screen can
now give a created shelter its Admin role and link a login, **which closes the last gap in onboarding a
shelter**: before it, the screen could create a shelter and the database could give one an Admin role,
and nothing joined the two.

**In flight (figures belong to `764`):** `cn7gk-upload-proof` (#1718 — `#cn7gk`'s one remaining word)
and `drive-scope-decision` (#1717 — `#dscop`).

**Next, and in this order because of the gate:** `#dscop` answers → **`#drvcl`'s screen**, which also
needs a **Web OAuth client with a redirect URI per environment host** that only Lutan can register (the
Desktop/loopback client cannot serve a hosted page). Then `#shrow`, and `#onbrb`'s end-to-end rehearsal,
**which is finally unblocked** now that the write half has landed.

**Everything else is as `762` left it** — his hands, parked by his own answer, waiting on a person,
waiting on data, blocked or frozen. **`#pl7aq`, the public launch, is a date he names: not to be
re-asked.**

## PROCESS NOTES

- **`worktree.mjs done` CAN EXCEED THE FOREGROUND TIMEOUT** and finish in the background (deleting
  `node_modules`). It did on 2026-11-19 and exited 0. **Re-read `worktree.mjs list` before relying on a
  `done` you did not see finish.**
- **THE DEV DATABASE GAINED A SECOND CONNECTED SHELTER, `test-shelter-2`**, with real Drive credentials
  for a second Google account; `check-shelter-settings.mjs --env test` was **green afterwards**. There is
  also a `proof-b` from another stream's proof, **deliberately not borrowed.** Every brief says both.
- **THE PUBLIC-REPOSITORY RULE BIT A NEW SURFACE:** real Drive folder ids and a real account address.
  **Briefs now say explicitly that no folder id goes into a committed file** — meaning in the repo, value
  in the Desktop notes. **Prose goes in with the Write tool, not a heredoc**: two heredocs died on
  apostrophes in one session.

## INTERRUPTIONS

**ONE, AND IT WAS THE PLANNER'S** — the morning's *"What are you waiting on, it's merged"*, three turns,
charged to the planner for reading a stale snapshot. **No stream was corrected, rescoped or stopped.**
The rest of the day's messages from him were direction, not correction: three changes to the plan
(*"Next batch"*, *"yes file it"*, and `#drvcl`'s final shape), each recorded on its item rather than
argued with.
