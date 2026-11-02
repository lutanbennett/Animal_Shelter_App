# Planner handover — edition `564`, 2026-11-02

**A delta, thirty-fifth edition in this shape. Nine streams across three batches** — batches 1 and 2 of
this round built, batch 1 merged and measured, **all three inside or under band, which makes four
consecutive clean batches.** The method needs nothing done to it.

Two things earned this edition's space, and the first is a correction to `555` itself:

> **A REFUSED SESSION START IS RECOVERABLE BY A RETRY. Ask him for one line and send the identical
> call again** — twice today that worked where the documented fallback would have given the work away.

> **A STREAM THAT SAYS IT FILED SOMETHING MAY NOT HAVE.** The report-versus-file rule has a new and
> worse shape: not silence, but a PR body reading *"Backlog note added"* with nothing in the backlog.

**Nothing here outranks `CLAUDE.md`, the skill, `docs/backlog.md` or `.plan-day.md`.**
**Read first:** `CLAUDE.md` → the skill → `.plan-day.md` → this. **The next slug is `573`.**

> **Never carried forward: anything read from the repo** — counts, migration numbers, PR numbers,
> release state, candidates. **Re-read every time, never diffed.**

---

## THE ONE THING TO READ: `555` WAS RIGHT THAT THE DIAL RULE IS NARROW, AND WRONG THAT THE REFUSAL IS FINAL

`555` recorded two refusal conditions and said of the Remote Control one: **"No sequencing fixes this
one."** That is true and it is misleading, because a sequencing fix is not what it needed.

**What happened, twice, hours apart.** The first `start_session` of each batch was refused —
*"the user is working over Remote Control, and for now you can start a session only on a message typed
in the desktop app"* — with the worktree installs already run in the **foreground**, so the
automated-event condition never fired. **Then Lutan typed one line (*"kick off the streams"*, and later
*"Retry the sessions"*), the IDENTICAL call was sent again, and it succeeded.** Six sessions started
this way, dials set, read back.

**So the condition is a property of the TURN, not of where he is sitting.** A fresh typed message from
him satisfies it even over Remote Control.

**The practical rule, and it costs one line:** when a start is refused for the Remote Control reason,
**say so in one line and ask for a go-ahead, then retry the identical call on his reply.** Do **not**
fall straight to naming folders and ports, which is what the skill prescribed and what the previous two
refusals did — that hands him three sessions to open and three sets of dials to re-set, which is the
whole cost the dial rule exists to remove.

**Promoted into the skill this round** (step 7), so no future edition carries it. **Tally: succeeded on
five batches, refused four times, and two of those four are now known to have been recoverable.**

## THE SECOND FINDING: A CLAIMED FILING IS WORSE THAN A SILENT ONE

**"A stream can REPORT; only the planner can FILE" fired again, in a shape no previous instance had.**
#1183's deliverable read *"Reported, not fixed … Backlog note added"* — and **nothing had reached
`docs/backlog.md`**; the PR touched that file only to tick its own item.

**Every earlier instance was a stream that stayed quiet.** This one asserted the filing was done, and
**the words "Backlog note added" are exactly what makes a reader skip the check.** The brief already
carried *"before you write 'done' against a deliverable, open the file and look"*, so this is not a
missing instruction — it is that instruction not followed on the one deliverable that was *about* the
backlog.

**What the read-every-PR-body pass bought, which is the argument for keeping it:** what #1183 found is
**more serious than what it fixed.** Three more SQL readers blind to string literals, of which
`assertSelectOnly()` in `scripts/lib/readonly-checks.mjs` **fails OPEN** — it strips `--` to end of
line *before* blanking quoted strings, so truncation hides a write keyword from a guard whose entire job
is to reject writes, **in the file `CLAUDE.md` names as where every production check lives.** A second,
`check-new-policy-role-names.mjs`, is a **blocking CI job** whose subject is the hard-coded-security
rule itself. **#1183's own check was not in CI at all.**

**Fix carried into the brief block this round:** a deliverable whose outcome is a backlog note is the
planner's to make — *report it in full and say "for the planner to file"*. **Check next round whether a
stream still claims one.**

## WHAT `555`'s WARNINGS DID

- **Its lead — a ticked item cannot carry an outstanding step — FIRED TWICE IN ONE DAY, and the second
  was a fresh instance.** `0297` was its own case and is now closed; then batch 1's card stream applied
  `0298` to dev, ticked its item, merged, and **production did not have it.** Milder than `0297`
  (`scripts/deploy.mjs` refuses a production deploy while any migration is unapplied, so it cannot reach
  a user by accident) but the same shape, and the stream said it in its PR body, which is again exactly
  right and exactly not enough. **Filed as its own item. Treat this as mechanism: after any batch
  carrying a migration, read production's status and file what you find.**
- **"The skill is dense, not redundant — stop commissioning trims": HELD, by not being tested.** No trim
  was commissioned. **Do not commission one.**
- **"A dial the planner set is not evidence of his choice": HELD, and it now applies to every stream
  here.** All six ran `sonnet`/`low` because the planner set them. **Draw no model finding from any
  figure in this round.**
- **Never raise a band for the size of a surface: HELD.** Nothing argued otherwise.
- **"A ruling you ask for becomes an instrument": NOT RETESTED.** Unrefuted, unconfirmed.
- **An open question in the numbered deliverables: fired, TEN rounds, no miss.** All six streams carried
  one. Two were answered *against* the planner's expectation, which is the point of them.
- **A partial pass, explicitly permitted: fired.** #1182 reported one check as *"not driven: the editor
  loads only by typed address, which the pane does not hydrate; established by reading and the test"* —
  honest, because the brief had told it that reading was sound rather than a shortcut.
- **The floor is `tokens − messages`: re-derived, three more readings**, the lowest identical to the
  token with a reading from the previous round. **Re-derive; never carry.**

## THE BAND NOTES WORTH KEEPING

- **A brief that carries the planner's CORRECTION of its own item lands under band.** #1182's PR body
  opens *"The item was wrong about what was left"* — the `canEdit` prop the item asked for already
  existed, added by the very PR the item blamed for the gap; what remained was the toolbar and the text
  box. It never spent a turn discovering that, and came in **7% under**. **Band the correction in, not
  the item's description of the work.**
- **Two unlike jobs landed within 1,000 tokens of each other above the floor** (figures in
  `.plan-day.md`). **The ordinary-stream reading again, from a lower floor; neither needed a drive,
  which is most of why both sat so low.**
- **Band a card that REUSES an existing activity below one that CREATES it.** Batch 1's card stream came
  in **13% under** a band built from the previous card migration's shape — but that one had to invent an
  activity in two places, while this only added a card. **Its own `messages` was more than double its
  siblings', so this is the band being wrong, not the job being cheap:** it really did do a migration, a
  card, two dictionaries, a route change and two card-only logins driven in the browser.
- **A card cannot be split into a schema PR and an app PR, and that is now in the skill.**
  `check-cards-count.mjs` asserts an exact card count and `check-card-grants.mjs` proves the database
  against `cards.ts`, so a card in one place and not the other fails a check. **The migration lives
  inside the feature PR, and the one-per-batch rule is satisfied by giving that stream the slot alone.**

## THE MITIGATION THAT IS STILL UNTESTED, AND SAY SO RATHER THAN BANKING IT

**The new brief line — a long gates run is ordinary, so background it and wait inside your own turn —
fired on two of three and failed on the third.** But the two that held **never had a gates failure**, so
they never had a long second run to wait on; the one that failed had its first run go red on typecheck,
which is what produced the wait. **So the block is untested on the only case it is written for.** Keep
it, and judge it only against a stream whose gates go red once. A nudge costs one message and the stream
resumed immediately, as every previous one has.

## THE THING THAT ANSWERED BETTER THAN ASKED, AND WHY IT IS A BRIEFING LESSON

Batch 1's card stream was handed a contradiction the planner could not resolve: the translations screen's
registry has **one** spare activity slot and it was already spent, so a third card had nowhere to go. The
brief wrote that down **as an open question in the numbered deliverables**, said either answer was
complete, and named "an array" as the shape the planner half-expected.

**It did neither.** It pointed the route at the activity all three cards share and dropped the special
case entirely, with the per-control gates doing the rest — **removing a mechanism instead of widening
one.** The planner then checked that nothing else grants that activity, so it opens the screen to no card
that could not already reach it.

**A brief that had asserted the array would have got the array.** This is the positive form of the
rule, and it is the third round running that it has paid.

## STATE, RE-READ EVERY TIME

Everything below is read from the repo and is stale the moment it is written. **Re-read it; never diff it.**

- `main`, the open item count, the highest migration, how far production is behind, and every batch's
  figures: `.plan-day.md`'s own blocks.
- **ONE THING IS OWED AND IT IS THE SAME SHAPE AS LAST EDITION'S:** a migration applied to dev, its item
  ticked, production behind. Filed under `## Deployment (before go-live)`. **Read `--status` first; the
  runner applies every pending file.**
- **THE PRODUCTION APPLY IS LUTAN'S, NOT THE PLANNER'S.** The classifier refused
  `apply-migrations.mjs --env production` as `[Production Deploy]`, he was asked directly, and he chose
  to run it himself. **Read the status and the dry run, then give him the command at the moment he needs
  it — never earlier.** It worked first time.
- **A release is still the release manager's.** Lutan, 2026-11-01: *"I will get the release manager to do
  the release."* **Do not cut one, do not prepare one, do not put it to him as a decision he owes.**
  Major versus minor and the production Worker deploy remain his.
- **The Pi-failover sweep is finished at 149 of 149 addresses, and that is NOT the failover working end
  to end.** The fallback stops covering after about eleven seconds; it needs a repeat power-pull drill
  with `wrangler tail`, which needs Lutan at the Pi. **Not a stream. Do not brief one.**
- **Leftover worktrees accumulate fast — fifteen were waiting at the start of this round**, all with
  merged PRs. `/clean-streams` does the round. **`ahead` is not the test; the PR is**, because a squash
  merge leaves a branch ahead for ever — **except where `list` says `UNMERGED WORK`, which is
  unsubmitted work and must not be touched.**
- **Interruptions this round: two, both the planner's and both cheap** — the refused production apply
  and the refused session start. **Count them as briefing and setup costs, never as a stream's.**
