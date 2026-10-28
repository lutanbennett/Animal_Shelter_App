# Planner handover — edition `420`, 2026-10-28

**A delta, nineteenth edition in this shape.** Rules are the skill's step 8 — say what **changed**,
promote durable facts once, cite `.plan-day.md` rather than reproducing it.

**Nothing here outranks `CLAUDE.md`, the skill, `docs/backlog.md` or `.plan-day.md`** — if they
disagree with this, they are right and this is stale. **Read first:** `CLAUDE.md` → the skill →
`.plan-day.md` → this. **The next slug is `429`.**

> **Never carried forward: anything read from the repo** — counts, migration numbers, PR numbers,
> release state, candidates. **Re-read every time, never diffed.**

---

## WHAT `411` ASKED FOR, and what each warning actually did

- **"The Pi is not deployed and it is Lutan's." CLOSED.** Both halves read `0.40.8` at `429229cd`
  when checked. He had done it. **Checking the two endpoints against each other took one command and
  is now the only honest way to say "deployed".**
- **"Ask who can run the proof — the answer may be Lutan even when it looks like the planner."
  FIRED, and split both ways in one day.** The classifier let `0275`'s production apply through and
  **refused `0276`'s twice**, including after Lutan asked for it in chat. **So it is not even
  predictable per command.** Band nothing for a production apply; find out who can run it at the
  moment you need it.
- **"Band the harnesses that are RED." Now the method, as `411` said. HELD.**
- **"Check PR state with `gh`, not the session list." HELD, fifth round.** Two false OPENs today,
  no false MERGED, ever. **Stop carrying it — it is in the skill.**
- **"An item's conclusion ages like a count." FIRED TWICE, both on TITLES.** A ticked item still read
  *"STILL LIVE ON PRODUCTION UNTIL 0275 IS APPLIED"* twenty minutes after it was applied, and the
  calendar item still ordered `/plan-day` to spend a slot on work that shipped in `0.40.8`. **Add:
  a TICKED item's stale title is worse than an open one's, because nobody reads a ticked item.**
- **Band discipline: nine streams, nine measured, nine inside or under, none over.** Best spread
  recorded. **Three were band errors in one direction — see below; a clean sheet is not the same as
  a good one.**

## THE ROUND'S LESSON: OUR OWN TOOL WAS LYING, AND A BRIEF TO FIX A BUG FOUND IT

**In the built-in browser pane, `requestAnimationFrame` NEVER FIRES.** React streams a page body
inside a Suspense boundary and swaps it in with an inline `$RC(...)` call that waits on it: the swap
stays pending, the page's client chunks are never requested, and **only the layout hydrates.** An
un-hydrated form is a plain HTML form, so Save submits a GET with every field in the address bar.
Clicking through from another page is a client-side navigation, never uses that swap, and works.

**Measured by #1017** (`docs/decisions/2026-10-28-website-contact-tab-not-an-app-fault.md`): the pane
hydrated **no** button on `/admin/website?tab=contact` and showed 15 forms all `method=get`; Chrome
hydrated all 13. `/admin/diets` fails identically **and nobody has ever reported it**, which is how
we know it is the pane.

**#1001 had filed this as an app fault. I filed it as a backlog item. A whole stream was spent
proving there was nothing there.** How many other rows in `docs/card-access-faults.md` are the same
artefact is **not established**, and that log is Lutan's gate 3 — **propose a marking pass, never run
one.**

**The workaround is in every batch-3 brief and filed for `CLAUDE.md`:** click through, never type an
address; if something looks dead run `requestAnimationFrame(()=>0)` **before recording anything**; a
plain-GET submission in the pane is a symptom, not a finding.

**Why the brief worked:** the item's hypothesis — a component throwing during hydration — was written
in **as a hypothesis, with its source**. The stream disproved it and found the real cause. **Had I
asserted it, the stream would have fixed the wrong thing.** That is the `402` lesson paying off.

## THE BAND ERRORS WERE ALL ONE ERROR, AND IT NEEDS A SHARPER TEST THAN THE SKILL HAS

43% under, 21% under, 17% under — `harness-sweep-batch-6`, `buttons-sweep-4-operations`,
`policy-triage-1`. **Each was banded for the size of its surface; each delivered a READING of that
surface.** Ten harnesses became a count and five verdicts; five areas of button fixes became an audit
finding **one** gap; ten tables of policy investigation came back **all ten deliberate**.

The skill says *band by what the stream must find out, not by the size of the surface*. **I was
reading that as being about open-ended scope. It also covers scope that is wide but shallow.**

**The test that catches all three, and it is one question: if everything here turns out to be FINE,
what work is left?** If the answer is "write the list and say so", it is a report — band it near the
floor whatever its surface. **A sweep that expects to find little is an audit, and an audit is
cheap.** Promote this when a fourth reading agrees; three is a pattern, not yet a rule.

## A DOCUMENT IS NOT A READING — and this one shipped a production outage

**`CLAUDE.md` said the Admin bypass was *"keyed on `roles.is_admin`"* in three places. That column did
not exist.** The planner's *Security redesign* item repeated the document, #990 and #991 built on it,
and both shipped in `0.40.7` selecting a column no migration ever created — **so Settings → Security
could not give anyone a role, and Delete role refused every role.** Lutan found it. `0275` fixed it.

**The same day, a second one:** `CLAUDE.md`'s *"proven reachable at aal1 … `/admin/security`"* is
wrong — it redirects to `/admin/security/verify` — and I had quoted that into #1014's brief, so it
could drive neither of its pages.

**The rule: `CLAUDE.md` is authoritative about DECISIONS and is not evidence about BEHAVIOUR.** Where
it states a behaviour it needs a date and a way to re-check it. **A brief that cites a document where
it should cite a file and a line is the same fault as a count quoted without its database** — and
this time it cost an outage, not a round trip.

**What came out well, and is worth not re-litigating:** I asked #1014 to check whether #990 and #991
had made false ticks. **Neither had.** Both marked the unverified parts `pending:` honestly. **The
test-plan discipline held; the briefing was the entire fault.** Do not propose tightening the
checklist over this.

## WHAT I GOT WRONG BESIDES THE BANDS

**I asked two streams for a proof that cannot be run.** #1008 and #1015 both wrote `pending:` against
*driven in both directions*. I diagnosed a shared-dev-database inconvenience and wrote
`dev-signin --cards` into the next brief. **For #1015 the login cannot exist:** `maintenance.jobs`
and `maintenance.photos` are both granted by `do_maintenance`, and a card is the only thing that
grants anything. **Before writing "drive it in both directions", check whether the two activities
live on the SAME card.** If they do, the hidden side is unobservable and the brief should say so.

**That is the "a mitigation is a hypothesis" rule firing on me, one round later, exactly as the skill
predicts.** The batch-2 mitigations *did* fire — #1017 carried its *not established* clauses through
and tried the cheapest instrument first. **Check the browser-pane block next round; it is new.**

## THE RELEASE-NOTE RULE HAS A GAP, AND IT SWALLOWED A NOTE

#1014 wrote `n/a` and deferred its note to *"the PR that closes the production apply"* — **the truth
rule applied exactly right.** But the apply was a **command**, so that PR never existed and
`unreleased` is missing the day's most user-visible fix. **When the outstanding step is a command —
a migration apply, a Worker deploy, a Pi rebuild — nominate who carries the note at the moment the
step is named.** Filed; batch 3's briefs say it explicitly.

## STILL CARRIED, unchanged

- **A release's cut and record PRs, and the two handover PRs, merge on green CI without asking.**
- **Model, effort and which allowance to spend are his. Never block paid usage.**
- **One item is ONE LINE in `docs/backlog.md`**, and check your amendment script for `\n` first —
  **and for substring collisions: `"## Quick wins\n"` also matches `### Quick wins`.** The guards
  caught both failures today loudly, which is the whole argument for writing them.
- **A measurement has a timestamp; a fact does not.**
- **`check-who-does-what` and `check-menu-coverage` are red ON PURPOSE.**

## NEXT ROUND POINTS AT

1. **`0276` IS NOT ON PRODUCTION.** The classifier refused the planner twice. **And applying it is
   not neutral: no live role holds View medical or Manage medical**, so it makes Medical photos
   Admin-only — Head of Medical included. Lutan chose *apply now, assign after*. **Re-read
   `--status --env production` and `role-cards` before saying anything about it.**
2. **Did the browser-pane block fire?** Batch 3's three briefs carry it. Did they click through, and
   did any run the `rAF` probe? **This is the first use of the round's biggest finding.**
3. **The card-access fault log may contain pane artefacts.** Propose a marking pass; do not run one.
4. **Policy triage 2** — the other ten tables. Batch 1's ten were **all deliberate**, so **band it as
   a report.**
5. **Cards: ten re-passes still owing** after batch 3's eight — `assistant`, `add_photos`,
   `approve_photos`, `meme_library`, `contacts` (14 steps), `who_does_what`. Count them from the
   repo.
6. **Sixteen worktrees and two husks.** Lutan has been offered a clean three times and said leave
   them. **Do not keep asking.**
