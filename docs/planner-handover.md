# Planner handover — edition `763`, 2026-11-19

**This is a DELTA against `762`.** It says what changed, corrects its predecessor, and reports what `762`
left owed. Figures, batch composition and ports live in `.plan-day.md`.

**It outranks nothing.** One chat reads it, one plan replaces it, and a wrong line is corrected by its
successor rather than by a reviewer.

**IT COVERS THE EIGHT STREAMS MERGED SINCE `762`, AND ALL EIGHT HAVE FIGURES:** #1706, #1707, #1709,
#1710, #1711, #1712, #1713, #1714. **#1708 is `762`'s own handover PR and does not count.** **Three more
were set up and had not merged when this was written** — `shelter-admin-role-app`, `cn7gk-upload-proof`,
`drive-scope-decision` — **so their figures belong to `764`.**

**WRITTEN AT 8 OF 9 BECAUSE LUTAN ASKED FOR IT EARLY — AND THAT IS NOW TWICE IN A ROW.** `762` says the
same thing in its own opening. **So the nine-stream rule has never once fired on its own**, in the two
editions since it was made. **This is an observation for the next planner, not a decision to re-open:**
he settled the cadence on 2026-11-18 and it is not to be put to him again. But if a third edition is
also asked for early, that is data worth showing him rather than a coincidence worth ignoring.

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

## THE ITEM THAT CHANGED SHAPE THREE TIMES IN AN HOUR, AND WHY ALL THREE ARE RECORDED

`#drvcl` (connect a shelter's Drive from a screen) was answered by him three times in one conversation:
the product-admin console; then *"the shelter director would authorise the token and send me the token ID
and folder ID and I paste them into the admin console"*; then **"landing straight into the app is even
better"**.

**SETTLED: the shelter's own Admin connects Drive from that shelter's own Settings, and the credentials
go straight into the app. Nothing is shown, copied, emailed or pasted.** Admin only — **Admin already
sits outside the card system, so this needs no new card and creates no new exception.** The product-admin
console keeps the status view and a manual paste fallback, *"the exception, never the design"*.

**TWO THINGS TO TAKE FROM IT.** First, **the middle shape was rejected on a security argument that should
not be re-litigated quietly**: the token carries the FULL `drive` scope, so sending it would have put one
organisation's key into a message neither party controls, once per shelter, for ever. Second — and this
is the modelling lesson — **the self-service shape is the SIMPLEST to build, not the most complex.** The
one-time-link design exists solely to tell the app which shelter a consent belongs to; **a director
signed in to her own shelter already answers that**, so the link, its expiry and every way it could be
forwarded to the wrong person all disappear. **It deletes a mechanism rather than adding one.**

**The earlier answer is marked SUPERSEDED IN PLACE on the item, not deleted**, so a reader meets both.

## THE COST THAT NOBODY HAD PRICED, AND IT IS NOW ITS OWN ITEM

**`#dscop`, filed on his instruction (*"yes file it"*).** We ask for `https://www.googleapis.com/auth/drive`
— **the whole of a shelter's Google account.** Google classes that as *restricted*, and a restricted
scope on a **public, self-service** app is what triggers verification with an annual third-party security
assessment. **That is a recurring bill against the zero-ongoing-cost rule.** It is also why a brand-new
account consenting on 2026-11-19 was shown **"Google hasn't verified this app"** and had to click
**Advanced** — **observed, not inferred.** Lutan clicking past that is fine; **a shelter director being
asked to click past a security warning, at the moment she decides whether to trust us, is not.**

**THE CANDIDATE ANSWER IS `drive.file`** (app-created files only; not restricted, no verification, no
warning, no cap) **and the hinge is a question nobody has settled: does a file a human places into an
app-created folder become visible to the app?** If not, "create the folder with the app, then migrate by
hand" does not work and the migration must run through the app.

**AND HIS OWN MESSAGE MAY DECIDE IT:** *"As we haven't moved the documents onto lannacareforanimals
google account yet, we have the opportunity to either create a folder from scratch and then migrate the
files or decide to run it as a hand crafted option"*. **The strongest objection to the narrow scope was
that Lanna's tree was hand-made — and that tree does not exist yet. There is a window, and it closes when
the files move.**

**`#dscop` GATES `#drvcl`** and is briefed as a reading stream that changes no code.

## A SECOND CONSENT-SCREEN FINDING, HIS, AND ONLY HE CAN CLOSE IT

**`#gcnst`**, from his own observation at the keyboard: *"it still asks to allow permission to lannacare
not cooperjaidee"*. The consent screen's app name is `Lanna Care for Animals`; the product was renamed
**Cooper Jaidee** on 2026-11-14. **It is wider than the step that found it** — the app name shows on
**every** consent screen the project serves, so a new staff member signing in with Google reads it too.

**WHY NOBODY HAD DONE IT: the only place the work was ever described is inside `#ki6cx`, ticked on
2026-11-05 — NINE DAYS BEFORE THE NAME WAS CHOSEN** — so it lists the domains and not the name, **and
nobody re-reads a ticked item.** Console change, his hands. Nobody has established whether renaming a
brand-verified app re-triggers review; **do not promise a size.**

**AND A CORRECTION TO THE RECORD THAT GOES WITH IT:** the Google accounts stocktake says verification is
not required *"since your app is not requesting any sensitive or restricted scopes"*. **True of the
SIGN-IN client; false of the Drive client.** Do not reason about Drive from that line.

## FIGURES — EIGHT, SEVEN VALID, ONE OVER

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

**Seven valid readings: four inside, two under, one over.** **#1707 is excluded on its own report and its
PR body never says what the rescope was** — one question if anyone talks to that session, never a guess.

**THE FLOOR, EIGHT FIGURES: 86,759 · 86,761 · 87,050 · 87,474 · 87,482 · 87,482 · 87,482 · 87,773.** A
**1,014-token spread**, entirely inside `~86–90k`. **No edit owed, and the scale rows are still not to be
shifted with it.**

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
**`shelter-admin-role-app` is banded 155-190k as the deliberate re-test and had not reported when this
was written.**

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

**In flight (figures belong to `764`):** `shelter-admin-role-app` (`#shadm`'s screen half — the last gap
in onboarding a shelter), `cn7gk-upload-proof` (`#cn7gk`'s one remaining word), `drive-scope-decision`
(`#dscop`).

**Next, and in this order because of the gate:** `#dscop` answers → **`#drvcl`'s screen**, which also
needs a **Web OAuth client with a redirect URI per environment host** that only Lutan can register (the
Desktop/loopback client cannot serve a hosted page). Then `#shrow`, and `#onbrb`'s end-to-end rehearsal,
**which is finally unblocked** now that the write half has landed.

**Everything else is as `762` left it** — his hands, parked by his own answer, waiting on a person,
waiting on data, blocked or frozen. **`#pl7aq`, the public launch, is a date he names: not to be
re-asked.**

## PROCESS NOTES

- **A HEREDOC WRITING A LONG DOCUMENT FAILED TWICE** (`unexpected EOF while looking for matching '`) on
  apostrophes and backticks in prose. **Use the Write tool for prose, and keep heredocs for code.** The
  second failure wasted a turn on a lesson already learned in the same session.
- **`worktree.mjs done` CAN EXCEED THE FOREGROUND TIMEOUT** and finish in the background (deleting
  `node_modules`). It did on 2026-11-19 and exited 0. **Re-read `worktree.mjs list` before relying on a
  `done` you did not see finish.**
- **THE DEV DATABASE GAINED A SECOND CONNECTED SHELTER, `test-shelter-2`**, with real Drive credentials
  for a second Google account. `check-shelter-settings.mjs --env test` was **green afterwards**, so it
  makes no check noisy. **There is also a `proof-b` from another stream's proof; it was deliberately not
  borrowed.** Every brief in the batch says both.
- **THE PUBLIC-REPOSITORY RULE BIT A NEW SURFACE:** this day's work involved real Drive folder ids and a
  real account address. **Briefs now say explicitly that no folder id goes into a committed file** —
  meaning in the repo, value in the Desktop notes.

## INTERRUPTIONS

**ONE, AND IT WAS THE PLANNER'S** — the morning's *"What are you waiting on, it's merged"*, three turns,
charged to the planner for reading a stale snapshot. **No stream was corrected, rescoped or stopped.**
The rest of the day's messages from him were direction, not correction: three changes to the plan
(*"Next batch"*, *"yes file it"*, and `#drvcl`'s final shape), each recorded on its item rather than
argued with.
