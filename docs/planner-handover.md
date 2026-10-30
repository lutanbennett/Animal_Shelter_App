# Planner handover — edition `501`, 2026-10-30

**A delta, twenty-eighth edition in this shape. Nine streams** — three batches of three, all in one
day, all `claude-sonnet-5-5` / `low`. `492`'s subject was *a brief that says what the planner has NOT
established gets corrected; one that asserts gets obeyed*. **Both its promotions fired, one of them in
a shape it did not anticipate.** But the round's real subject is the mirror of its own: **the three
things I got wrong were all claims about files I had not opened — and one of them was a PROHIBITION.**

**Nothing here outranks `CLAUDE.md`, the skill, `docs/backlog.md` or `.plan-day.md`.**
**Read first:** `CLAUDE.md` → the skill → `.plan-day.md` → `492` → this. **The next slug is `510`.**

> **Never carried forward: anything read from the repo** — counts, migration numbers, PR numbers,
> release state, candidates. **Re-read every time, never diffed.**

---

## THE ONE THING TO READ: A PROHIBITION IS A CLAIM ABOUT THE REPO, AND IT AGES AND MISLEADS LIKE ANY OTHER

The skill already says a count quoted without its database is not a reading, and that an instrument
quoted without reading its query carries false authority. **This round produced three instances of the
same fault in a new place: the brief's own assertions about files I had never opened.** Two were
harmless because I had cited where I read them. **The third cost Lutan an interruption, and it was a
ban.**

- **I banned all of `scripts/lib/` in three briefs**, because `exit.mjs` lives there and every stream
  imports it. **I never listed the directory.** `readonly-checks.mjs` is also in there, and it is
  where *every* production check lives — so the stream told to add an `assistant-could-not-help`
  check to `check-production.mjs` found its deliverable forbidden by my own brief, and **asked Lutan,
  who approved it in chat.** A correct stream, a legitimate deliverable, an interruption caused
  entirely by a prohibition I had not checked.
- **I told a stream to rebuild `can_see_drive_file()` from `0276`'s body**, because `grep -l` listed
  `0193`, `0218` and `0276` and I took the last. **`0276` does not define that function at all.** The
  stream rebuilt from `0218` and said so in its PR.
- **I filed a backlog item quoting `public-pages.ts` from a PR body** without opening it. The file is
  `src/lib/public-pages.ts`, not `src/lib/site/`. **Opening it also shrank the item** — `sitemap:` is
  a field on the same `PUBLIC_PAGES` entry, so two of its four parts are one edit.

**The rule, and it is cheap: ban the FILE, not the folder — and open anything you are about to assert
or forbid.** A folder name is not a manifest; a `grep -l` listing says a file mentions a symbol, not
that it defines it; a PR body is another session's prose.

**The counter-case is the whole argument, because the two things I DID open both paid:**

- **A feared collision dissolved to one file.** Stream 7 drops `frequency_id`, which nine `scripts/`
  files mention, and stream 8 owns `scripts/`. By the skill's second-axis rule that is the
  *expensive* case and one of them should have moved to a later batch. **Instead I intersected the
  remaining guard-read rows against the nine.** Exactly one file is in both — `check-phone-width.mjs`,
  the three-hour browser check neither should run. **A named carve-out, nothing moved, one command.**
- **Four of the reds I was about to brief were green.** The harness item named three undiagnosed reds;
  re-running them found `check-card-grants`, `check-features-schema`, `check-cards-count` and
  `check-home-cards` all exit 0, closed by that morning's own streams. **I would have priced three
  diagnoses that no longer existed.**

**So: before a brief forbids, prices or asserts anything about this repo, open the thing.** Every
instance above, good and bad, turned on whether I had.

## AND COUNT INTERRUPTIONS AS A COST OF THE BRIEF, NOT OF THE STREAM

**Two of nine streams had to ask Lutan something my briefs should have settled** — the `scripts/lib/`
ban above, and whether to narrow the `add_while_recording` retirement to the card alone when the
activity turned out to be still asked by live policies. **Neither stream was wrong to ask.** Every PR
was green, every deliverable landed, and nothing in the paperwork records that the round cost him two
touches it should not have.

`CLAUDE.md` says the target shape of a release is **two touches, one answer and one command**, and that
a third is a fault to write down. **The same arithmetic applies to a batch**, and nothing was counting
it. **Count them, and treat a batch that cost an unplanned interruption as a briefing defect even when
every check is green.**

## WHAT `492` ASKED FOR, and what each promotion did

- **The second disjointness axis (dev database and check suite, not only files). FIRED THREE TIMES,
  and it has a NEW HALF.** Twice as its cheap case, told in the brief and held. The third time it
  would have moved a stream, and **the intersection measurement above is what replaced the move** —
  promoted into the skill in this PR. **It has still never been tested as the genuine expensive case**,
  so do not claim the rule is proven; claim only that the cheap case holds and that the expensive case
  is now worth measuring before acting on.
- **The positive form of never-upgrading-an-open-question. FIRED FIVE TIMES, FAILED ONCE ON
  PLACEMENT.** Its best instance: I could not work out how rich-text marks should be *stored* — the
  body format is deliberately not markdown and needs no escaping — so I wrote the three options I
  could see into the brief **as options**, named the constraints that came from the item rather than
  from me, and said I would not guess. It chose inline tags in the existing column, needed no
  migration, recorded what it gave up, and **landed 10% under.** **The failure: I put one open
  question in a brief's STEP ZERO block instead of its numbered deliverables**, and the
  report-every-deliverable rule covers only numbered deliverables — so nobody answered it and the
  entry it was about is unchanged. **An open question you want ANSWERED is a numbered deliverable; one
  in step zero is context, and context is not reported on.** Promoted.
- **Report every deliverable. HELD, nine for nine.** Every stream accounted for every numbered
  deliverable, including partials said out loud: *"Routes not driven over HTTP"*, *"No cards-login
  browser drive: no screen existed to check"*, *"I did not re-drive it"*. **Treat it as settled
  mechanism.**
- **Name the instruments by path. HELD, four rounds** — and widened usefully: **naming a CLOSED
  warning is as valuable as naming an open one.** An item still said `check-can-see-drive-file` *"has
  never been diagnosed … diagnose it first"*; it had been diagnosed the hour before, I said so with
  the commit, and that stream spent nothing on it and came in **16% under**.
- **File an item a merge before briefing it. HELD.** Three items filed this round, all a full merge
  ahead of any brief.

## THE BAND RULE I BROKE WAS ALREADY IN THE SKILL, PUT THERE BY MY OWN PREDECESSOR

**This is a confirmation, not a finding, and the distinction matters because I nearly wrote it up as
new.** `492` promoted exactly this sentence into the skill's *Token estimates*: **"a question the
stream must SETTLE is judgement and bands near the ordinary stream; a question it must build an
INSTRUMENT to answer does not."**

**I then widened the rich-text band because its storage question was unsettled, and it came in 10%
under.** The rule was already written, by the edition I had read that morning, and I did not apply it.

**So the fact needs no promotion; the failure mode does.** A rule promoted into the skill is not
thereby in force — the skill is long, and the sections a planner reads closely are the ones matching
the fault it is currently worried about. **When you widen a band, say in `.plan-day.md` which rule you
are applying.** Naming it is what would have caught this: I could not have written "widening because
the decision is open" beside that sentence without noticing they contradict.

Meanwhile the round's two real misses were an **unbudgeted proof** (#1098, 21% over, an md5 across
every live prescription to show nothing changed) and **the ban above**. Neither was a band rule we
lacked.

**One new rate, measured and usable: a GUARD READ costs ~3.6k a row** — 25 rows, 90,107 above its own
floor. That is **half** the restate-or-retire rate and **a fifth** of the diagnosis rate, and the
reason is worth more than the number: **the triage table had already localised each decision to one
call site.** **Ask who localised it before reaching for a rate.** Promoted into the bands table.

**Still unpromoted, deliberately:** the find-little driven pass at ~5k a step (three readings, no
fourth in six batches — none was a driven walkthrough), and the unchanged-value proof at ~60–80k (one
reading; batch 3's stream 7 is its second test).

## STATE, RE-READ EVERY TIME

Nothing in this section may be quoted from here. **Re-read it:** open items and their titles from
`docs/backlog.md`; batches, bands, actuals, mitigations in flight and the next candidates from
`.plan-day.md`; release and migration state from `apply-migrations.mjs --status --env production`; what
merged from `gh pr list`; live worktrees from `worktree.mjs list`.

**What is with Lutan** changes daily and is listed in `.plan-day.md` under his decisions — read it
there. The standing ones that shape sequencing: **the production Worker deploy and the Pi install are
his by instruction**, so a stream whose work only runs after one of those **must write `n/a` on its
release note** and name the outstanding step; **the domain move gates two free Cloudflare steps**; and
**a release has two halves** — a Worker deploy alone does not change what users see, so read the Pi's
version endpoint against the Worker's rather than trusting a 200.

**THE MIGRATION BACKLOG ON PRODUCTION IS NOW DEEP ENOUGH TO BE ITS OWN RISK, and this is the one piece
of state worth a sentence rather than a number.** Several pending migrations have app code **already
merged on `main`**, and at least two must be applied **before** that code ships or a feature breaks
rather than merely lagging. **Migrations-before-deploy has always been the order; with a queue this
deep it stops being hygiene and becomes the thing that decides whether the release works.** Read the
count and the list from `--status --env production` and check each one's consumer header.

**One piece of housekeeping that will bite the next planner:** a merged batch's worktrees stay **HELD**
while their Claude sessions are open, so the next batch's ports step forward instead of being reused,
and `worktree.mjs done` must not be forced on them. **Ask Lutan to close those sessions; never tear
down a HELD folder.**

**NEITHER SUPABASE PAID FEATURE MAY EVER RETURN TO ANY LIST** — session inactivity timeout and
leaked-password protection are **dropped, not deferred**:
`docs/decisions/2026-10-29-pro-only-features-are-dropped.md`.
