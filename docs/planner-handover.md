# Planner handover — edition `749`, 2026-11-14

**This is a DELTA against `748`.** It says what changed, corrects its predecessor, and reports what each of
`748`'s owed items did. Figures, batch composition and ports live in `.plan-day.md`.

**It outranks nothing.** One chat reads it, one plan replaces it, and a wrong line is corrected by its
successor rather than by a reviewer.

**WHICH PLAN'S FIGURES THIS EDITION REPORTS, because `748` asked for this to be said explicitly.** It
reports **`748`'s plan's complete set of six**, measured this morning in one slot. **It carries NO
figures from its own five streams** — those are read at the next plan's first batch and reported by this
edition's successor. **That is the delta model working as designed, not a gap.**

**WHY THIS EDITION EXISTS.** `748`'s plan was complete at 6 of 6; this plan was then built from scratch,
agreed in one answer (*"All five, as listed"*), and **both its batches were set up and batch 1 merged
inside one chat.** Second edition in a row written from the same chat that planned it.

---

## THE LEAD: `748`'s BEST PIECE OF EVIDENCE DOES NOT REPLICATE, AND THE FLOOR IS A RANGE RATHER THAN A FIGURE

`747` said the floor was *"a constant of the harness"*. **`748` correctly narrowed that** to *a property
of WHEN a session starts — streams started together share it*, and its strongest support was two streams
starting the same minute returning **89,505 to the token**.

**This morning's set has its own same-minute pair, and they do not agree.**

| slug | started | floor (`tokens − messages`) |
|---|---|---|
| `card-boxes-triage` | 2026-11-14T00:32Z | **86,731** |
| `report-animal-photo` | 2026-11-14T00:32Z | **86,257** |

**474 apart, same minute.** Across the whole set the floor ran **86,037 to 89,659**.

**THE CORRECTION, AND IT IS NARROW: "started together" buys the same BAND of floor, roughly ±500, not the
same figure.** `748`'s to-the-token pair reads as coincidence rather than mechanism. **What survives
intact is the half that matters: the brief does not move the floor.** **So re-derive it per plan, quote a
range, and do not repeat `748`'s "share it" without this correction.**

---

## WHAT IN `748` IS SUPERSEDED, AND WHAT ITS OWED ITEMS DID

- **`748`'s owed item 1 (production four migrations behind) IS UNCHANGED AND STILL THE MOST CONSEQUENTIAL
  LINE.** `0375`, `0377`, `0378`, `0379` all still pending. **`0375` re-owns 90 objects and re-owning
  wrongly makes views read 0 rows — a blank public website, not a leak.** **And it now blocks something
  concrete:** `0377` creates the report-photo bucket, so this plan's `report-photo-retention` job has
  nothing to clean on production until it is applied. **Still `#w2knt`; still Lutan's and the release
  manager's (2026-10-02); never brief a feature stream to do it.**
- **`748`'s owed item 2 (measure nothing at the first batch) WAS OBEYED AND THE SLOT WORKED.** The set of
  six was read once, after batch 1's list went out; batch 2's setup was a resume and skipped it.
- **`748`'s owed item 3 IS SPENT: `#x5tbv` IS ANSWERED AFTER THREE DEFERRALS.** Put to him once with the
  middle option as the recommendation, exactly as `748` instructed, and he chose **a scheduled run
  against the dev project** — not per PR, not left as a by-hand release step. **Filed the same hour**:
  title rewritten, old `DECIDE:` heading marked superseded in place, done-when narrowed to three
  non-decisions — record it in `docs/decisions/`, **he** adds `SUPABASE_ACCESS_TOKEN` as a repository
  secret, one session wires the workflow. **Do not put it to him again, and do not wire it per PR.**
- **`748`'s owed item 4 (`#r9pzq`) IS DONE, BUT NOT BY FOLDING.** `748` said fold it into the next
  card-check pass; **there was no such pass to fold it into**, so it got a stream, priced as a quick win
  with the answer and the `$MERCH`/`$REPORT` pattern pasted into the brief. **It shipped (#1592).**
- **`748`'s owed item 5 (say which outcome a band prices) WAS APPLIED TO ALL FIVE BRIEFS, and there is
  one early sign it works.** `merch-photo-upload` reported, unprompted: *"Branch taken: `merch.manage`
  only. No migration, so the 170-215k band applies."* **The brief made its own band legible to the
  stream.** **One reading is not a trend — check the next round.**
- **`748`'s owed item 6 (`#j4m8w` before any tenancy hostname work) IS DONE AND HAS HANDED HIM A
  DECISION.** See below.

---

## `#j4m8w` IS DONE AS A PAPER, AND THE ONE DECISION IT COULD NOT MAKE IS NOW WITH HIM

**The stream did exactly what its brief allowed and the distinction is the point.** Its brief said: decide
(a) where the answer follows from the technical facts; **write it as a recommendation if the choice rests
on what the product is to its customers.** It read the facts, found the choice was the latter, and
**recommended rather than ruled** (`docs/decisions/2026-11-14-cooperjaidee-hostnames.md`, PR #1590).

- **The certificate limit is VERIFIED, not assumed** — against Cloudflare's own Universal SSL
  Limitations page, read 2026-11-14: **full-setup zones cover the root and first-level subdomains only.**
  **It agrees with the item's understanding**, so `lanna.cooperjaidee.org` is covered and a deeper name
  is not. **One residual unknown is marked rather than glossed: wildcard-on-Workers on the free plan is
  `not verified`.**
- **(c) EMAIL is answered from the code:** sends go through `send_email` bindings from
  `releases@lannacare.org` / `releases@lannacareforanimals.org`; **nothing sends as `cooperjaidee.org`**,
  and nothing was set up.
- **Its recommendation:** the apex as the platform's front door, **shelters keeping their own domains**,
  and a one-level subdomain offered to shelters that have none. **One technical consequence holds
  whichever shape he picks: build the host-to-shelter mapping table-driven.**
- **Nothing in Cloudflare was touched, nothing outside `docs/` was touched, and the item is correctly
  LEFT OPEN** with its title rewritten by the stream itself to say that (a) is his.

**SO PUT (a) TO HIM: what does a hostname mean to a shelter?** It is the first question of `#ykefa`'s
build and everything else hangs on it.

---

## WHAT THIS PLAN SHIPPED, IN ONE LINE EACH

- **#1590 `domain-tenancy-hostnames`** — the hostname paper above: **a recommendation, not a ruling.**
- **#1591 `merch-photo-upload`** — `#qtnob`: a real photo chooser on the merch add-product form,
  uploading through `/api/merch/photos`, **a route rather than a Server Action** (the 1 MB
  `serverActions.bodySizeLimit` trap, proved with a 4.3 MB PNG). **`merch.manage` at edit for both the
  route and the control, so no second activity and no migration.** Current photo shown, paste-an-id kept.
- **#1592 `receipt-probe-fixture`** — `#r9pzq`: a `$DONATION` fixture and a `read` probe, rolled back with
  the rest of the harness like `$MERCH`/`$REPORT`. **And it corrected a figure two briefs had quoted.**

**Batch 2 is set up and unmerged at the time of writing:** `admin-nav-reachability` (`#fc7te`, port 3005)
and `report-photo-retention` (`#6rkux`, port 3006).

---

## A COUNT HAS A CLOCK ON IT, AND THE PLANNER BROKE THAT RULE THIS MORNING

**`check-who-does-what` reports 392 boxes, 0 probe faults and 1,630 probes** (#1592, measured before and
after its own change). **The figure `748` carried — "9 probe faults out of 385 boxes" — was true of the
check's first-ever run and was cleared by #1583 hours later.** The planner pasted the stale figure into
stream 3's brief as evidence, and **the stream caught it at step zero and said so plainly in its PR.**

**That is the step-zero instrument catching the BRIEF rather than the item — the second time in three
days** (the first was four briefs naming a `th.ts` that does not exist). **Re-read a count before pasting
it into a brief.** `#k7vnd`, filed today, carries the corrected figures so the next planner inherits them
rather than `748`'s.

**AND THE CLASS OF FAULT IS WORTH RESTATING, because #1592 was careful about it:** a box with **no probe
at all** is worse than a reported fault. A fault is visible in the output; **an unprobed box is
indistinguishable from one that passed.** `#r9pzq` closed one; `#k7vnd` is the next.

---

## FOUR ITEMS WERE FILED FROM STREAMS' OWN REPORTS, AND NONE WOULD HAVE SURVIVED OTHERWISE

**A stream reports; only the planner files.** Three of these were reported *for the planner to file* and
would have been lost:

- **`#8t3rk` (Security)** — the public report form and its photo upload have **no per-visitor rate
  limit**. It was recorded **only inside `#6rkux`**, so it would have died the moment that item was
  ticked. Its first work is establishing what Cloudflare's **free** tier can do, against the
  zero-ongoing-cost rule.
- **`#k7vnd` (Security)** — the **0169 places-list read box has no probe at all**
  (`permission-probes.mjs` line 114). Same shape as `#r9pzq`. **One neighbouring comment is deliberate
  and must not be "fixed": `translations.manage` is read by hand in Appendix C on purpose.**
- **`#w9xpq` (Fundraising)** — **`can_see_drive_file()` has no case for `merch_products`**, so staff
  cannot preview a not-yet-public product's photo. **Nothing is broken for a user: the stream made the
  preview hide itself** rather than draw a broken image. Needs one migration gated on the same
  `merch.manage`. It also carries #1591's outstanding press — product save and public display were never
  clicked, after a transient Google Fonts 500 in the browser pane, and its plan says `pending`.
- **`#d6xhs` and `#n2bkc` TICKED** — both shipped in PR #1582 at 01:02Z and **the stream never ticked
  them**, so both still read as open work at this plan's sync and both were still on his priorities
  list. **The phantom-item fault, caught at the backlog read.**

---

## TWO MITIGATIONS FIRED AGAIN, AND BOTH HELD

- **THE MIGRATION TIEBREAK, THIRD OUTING, TWO FOR AND NONE AGAINST.** #1584 renumbered `0376` to `0377`
  on the pre-written rule — *the lower PR number keeps the number* — after #1583 took `0376`, and used
  `--forget` on dev's old row rather than leaving drift. **No planner was needed.**
- **THE BACKLOG MERGE CONFLICT RESOLVED ITEM BY ITEM FROM EACH SIDE'S NEWER TEXT.** `#x5tbv` from
  `backlog` (his answer, filed after the morning sync) and `#r9pzq` from `main` (the stream had ticked
  it). **The resolving script guarded that each side really was the newer text rather than trusting the
  label**, and that nothing was lost. **Do not assume `main` is newer.**

---

## FOR YOUR FIRST TURN

Read `.plan-day.md` first. **It stands at 5 of 5 and this edition resets the counter, so you are planning
FROM SCRATCH.**

**Read the system date and compare it with the date at the top of this file.** **Three plans ran on
2026-11-14**; a fourth on the same date is a normal thing to be. **Never derive today's date from a
document.**

**Tell him at the start that the sync plus the `worktree.mjs new` runs plus the briefs is about half an
hour.** Seven editions have recorded that as the fix for an interruption.

**WHAT IS OWED:**

1. **PRODUCTION IS FOUR MIGRATIONS BEHIND** — `#w2knt`, unchanged and still the most consequential line
   here. `0375` re-owns 90 objects and the failure mode is a **blank public website**. `0377` creates the
   report-photo bucket, so batch 2's retention job cannot run on production until it is applied.
   **His and the release manager's. Never brief a feature stream to do it.**
2. **MEASURE THIS PLAN'S FIVE AT YOUR FIRST BATCH, and they are not in this edition on purpose.** Read
   `stream-usage:` from **#1590, #1591, #1592** and batch 2's two PRs. **They cannot expire** —
   `gh pr view <n> --json comments` reads them from a merged PR whose worktree is long gone.
3. **PUT `#j4m8w`'s (a) TO HIM: what does a hostname mean to a shelter?** The recommendation is written
   and the certificate limit is verified. **This is the gate on `#ykefa`'s build** — and `#ykefa` is
   still ≈50 hours with object counts **40% larger** than the spike priced, so it is a programme to
   sequence across days, not a stream to brief in one go.
4. **`#x5tbv` IS DECIDED AND WAITS ONLY ON HIS SECRET.** A scheduled run against dev. **Do not re-ask.**
   It is the obvious first candidate once `SUPABASE_ACCESS_TOKEN` exists, and it cannot start before.
5. **THREE FRESH ITEMS WITH THEIR EVIDENCE ALREADY WRITTEN IN:** `#w9xpq` (one migration, gated on
   `merch.manage`), `#k7vnd` (one fixture, the shape `#r9pzq` just proved), `#8t3rk` (read Cloudflare's
   free tier first, against the zero-ongoing-cost rule).
6. **CLEAR THE LEFTOVERS, AFTER YOUR LIST.** At this edition's writing, batch 1's three folders were all
   `HELD` by their own sessions, so they were left alone and raised with him instead — the same way
   `merch-currency` was cleared earlier today on his *"Yes, clear it"*. **`done` them once those sessions
   are closed:** `domain-tenancy-hostnames`, `merch-photo-upload`, `receipt-probe-fixture`, plus
   `handover-749`.
7. **RE-READ ANY COUNT BEFORE YOU PASTE IT INTO A BRIEF**, and say where and when you read it. The
   planner broke this today and a stream caught it.

**Do NOT re-ask him about:** `#x5tbv` (answered today — a scheduled run against dev); the product name or
which TLD; the anonymous photo upload (*"Yes, build it properly"*); whether staff may add a currency;
`donation.receipt`'s shape (yes/no, #1585); the adopter-portal exception; `test-plan` being advisory;
merging a green PR; the Thai read's cadence; **the 90-day retention figure** (it is the decision file's
own starting point, and a stream may change it with a reason); or anything on `748`'s, `747`'s and
`746`'s do-not-re-ask lists.
