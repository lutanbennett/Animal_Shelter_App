# Planner handover — edition `726`, 2026-11-09

**This is a DELTA against `717`.** It says what changed, corrects its predecessor, and reports what each
of `717`'s warnings and owed items actually did. Per-stream figures, batch composition, ports and the
dependency notes live in `.plan-day.md` and are **not** reproduced here.

**It outranks nothing.** It is read by one chat, it will be rewritten within one plan, and a wrong line
in it is corrected by its successor rather than by a reviewer.

**Written at the SETUP of this plan's last batch, so batch 3's figures are not in it.** Batch 3 was one
stream the planner set up (`profile-photo-fails-open`) plus two opened directly and not the planner's:
`test-purge`, merged, and `restore-grants`, live with no PR.

---

## THE LEAD: THE 85% CUT HELD, AND THE ANSWER TO `717`'s QUESTION IS YES

`717` asked the one thing it could not know: *"a rule that moved to `reference.md` may be followed less
often than one that stayed. You are the first edition after the cut. Say whether it held."*

**It held, across three batches, and the measure is his interruptions: ONE round in the whole plan** —
the single mandated `AskUserQuestion` at batch 1, carrying his owed decision and the UAT status together.
**Batches 2 and 3 cost none.** Both were resumes by the conversation that wrote `.plan-day.md`, so each
went straight to setup and **reported** what had changed instead of asking. Against the plan that
provoked the cut — where he asked three times in one day where his list was — that is the whole of the
difference.

**Nothing was lost to `reference.md` that this plan needed** — the planner reached for it once, for the
`.plan-day.md` editing traps, and it was there. And **THE ONE RULE did real work twice**: on both resumes
the honest thing was a long report of actuals and findings, and putting the list first let him start three
sessions while reading the rest. **Keep it first — it is the rule most likely to erode, because every
batch gives the planner something more interesting to lead with.**

---

## WHAT `717`'s OWED ITEMS AND WARNINGS DID

- **The `stream-usage:` line as a NUMBERED deliverable fired 6 of 6**, so **12 of 12 across four
  batches**. Settled four editions running; **stop re-testing it and keep it numbered.**
- **`#d3cw7`'s unestablished half is CLOSED, and not by being answered.** It asked whether any live role
  holds exactly one of `reference.types` / `stock.diets`. #1408 established that **no card grants
  `reference.types` at all**, so that login cannot be built even to test it. **The question dissolved.
  Do not carry it a fourth time.**
- **The 54 Drive files are SETTLED and off the list.** He closed them in chat: backups into Production
  Admin, ~30 test files he removes over time, separated from all three environment folders. There was
  never a backlog item. **Drop it rather than carrying it.**
- **`#uat7p` / `#uq4vz`: DONE.** UAT is live at `uat.lannacare.org`.
- **`0338`'s production back-fill is still owed, and he corrected the line about it.** It is now `#k3mqp`
  and **sized: production holds ~20 contacts listed as suppliers.** Dev has 0 Vendor contacts of 1
  contact row, so *"moves nothing on dev"* was true but read as *"has no work anywhere"*, which is what
  he objected to. **Count production, apply, count again. And it now GATES `#xkfsv`.**
- **`#etr20` came due 2026-11-08 and is still due.** One line, ships with a release cut.

### A status answer of his has a clock on it, like any count

**He answered "none of them yet" about the three one-time UAT jobs and then did all three that night.**
`#t0k9r`, `#sud8p` and `#prg4z` are ticked and `#uq8wk` is closed, so **the release blocker is gone** — a
release carrying a migration no longer refuses UAT. **A planner that quoted his answer the next morning
would have been wrong. Re-read the items.**

---

## THE BANDS: ADD A ROW. BOTH MISSES THIS PLAN WERE THE SAME MISS

**Six valid readings, four inside, two over, one excluded** (`diets-one-card`, `compacted=yes`, so a
remainder and not a reading). All six ran `opus-5-5` / `medium`, which is his choice and not a deviation;
the +25% adjustment held on all four that landed inside.

**`control-sweep-11-count` 265,395 against 181–238k adjusted (+11%). `public-read-enumeration` 228,068
against 163–213k (+7%).** Both were priced from the *"AUDIT or REPORT over a wide but shallow surface"*
row, whose note reads **"the length of the list does not move this"**. **That is true of an audit that
LISTS rows and false of one that DERIVES a property per row** — the sweep resolved opening cards for 93
pages with `bundleOfCards([card])`; the enumeration read `pg_get_viewdef` and traced base tables for 21
views, then ran a live security probe.

**ADD: *an AUDIT that computes a property per row* — 230–290k (`medium`: 288–363k).** Validated against
both: the sweep mid-row, the enumeration at the bottom. **Keep the existing wide-and-shallow row for an
audit that only lists.**

**This is the third plan running where the ROW was wrong rather than the number** (`717`: `suppliers-app`
priced as a new surface, missing that it also deleted what it replaced). **So the discipline is the
lesson, not the row: read your own one-line scale description back and check it names everything the
stream must do.** "Audit, wide and shallow" named the reading and not the deriving.

**THE FLOOR: 106,093 · 107,502 · 111,430 · 111,416 · 107,502 · 106,429 — so ≈106–111k on 2026-11-09**,
agreeing with `717` and with `708`. 111,430 is just under the highest ever (111,478). **The drift is slow
and upward. Never carry it forward.**

---

## WHAT THE PR BODIES HANDED BACK — and one of them is a live security hole

**Still the best yield per turn spent. Nine items and two retitles came out of six PR bodies.**

1. **`#h8xqv` — THE PUBLIC PROFILE PHOTO FAILS OPEN, AND IT IS THE HEADLINE OF THIS PLAN.** The three
   resident views blank the photo only on finding a **bad** attachment row, so a drive id matching **no**
   row passes straight through; and the column is directly writable by anything holding `resident.record`
   at edit, so `0319`'s guarded RPCs are not the only writers. **Proven on dev in a rolled-back
   transaction** by #1410: `anon` read the id back and `is_public_drive_file()` answered true. The photo
   proxy then serves **any non-video Drive file the service account can read** — a blood-test PDF,
   another resident's Medical photo — on the open web with no approval step. **The stream that found it
   wrote "I would rank it above the rest of this list", and it was right: it displaced `#3nuwy` from
   batch 3 the same day.** It also **undoes a decision already taken** — the `residents` card's own
   comment says its photos went *"through approval instead of straight to the website"*.
2. **`#r9wtk` — ready for adoption and shown on the website are ONE flag on every save**
   (`residents/[id]/edit/actions.ts:200`, since 2026-09-20). A resident deliberately shown but not ready
   **leaves the website silently** the next time anyone saves its edit form. **It also changes what the
   ready/visible counts `#7aev4` was going to put to him MEAN**, because the save path makes the two
   columns agree.
3. **`#7aev4` is no longer a build, and its title now says so.** The enumeration is done (#1410): 21
   public views, 4 riding `attachments`, 4 ruled, 2 with nothing to approve, **11 carrying content with
   no review state**. **It added a fourth number he owes: weekly TEXT volume**, because eight subject
   tables have no review state for their English text and his answer of 2026-11-05 was *"any text will be
   reviewed"*.
4. **`#z5pk9` — `commit -am` in the shared backlog worktree sweeps another session's uncommitted edits
   into your commit.** It happened to this planner: `afcadff7` carries four of its items under a message
   about something else, and `git status` then read **clean**, which is what a lost edit looks like.
   **`CLAUDE.md` literally shows `commit -am` as the way to edit the backlog, so a session following it
   exactly produces this.**
5. **`#v3qmz` — `check-audited-tables.mjs` passes a table with neither a trigger nor a listing**, which
   is how `card_includes` sat unaudited from `0257` while the check reported `ok` on every run. **So
   `#q8m4t`'s own "confirm it goes from naming it to green" was wrong: it was already green.** Same shape
   as the fault it guards.
6. **`#w2hs8` — `dev-signin.mjs --cards` re-keys a shared disposable login and signs another stream
   out.** Two streams asking for the same card set is the designed case, not bad luck, and the victim
   just finds itself at `/login` mid-drive.
7. **`#j8vt4` + `#q7dn3`, and they must be ONE stream.** Settings → Units still needs two cells together
   and no card grants either, so **only Admin can add a unit of measure** — a Set up diets holder cannot.
   And `item_unit_conversions`' write policies ask `stock.diets` for **every** row, medicine rows
   included. **`#j8vt4` masks `#q7dn3` today; fixing `#j8vt4` alone uncovers it.** That is the
   *fold-an-item-whose-correctness-depends-on-a-neighbour* rule, and the clearest case of it yet.

**A green PR whose stream has left is a real state, and the planner CANNOT settle it.** `test-purge`
reached a green PR and its session left the folder without merging. The planner tried to post the usage
line and merge, and **the auto-mode classifier refused it as an external write**. Per `CLAUDE.md` a
refused step is reported, not worked around. It cost nothing — the PR merged in the meantime — but **do
not plan on being able to rescue that case**, and record such a figure as `unmeasured`, never a guess.

---

## OWED, AND WHO OWES IT

1. **`#av8rq` is NOT TICKED and that is correct.** Its *done when* is a **production** exit 0. Run
   `node scripts/check-production.mjs activities-grantable` from the main checkout; a pass ends `ok   the
   live Admin-only set matches the allow-list: 83 catalogue activities; 3 Admin-only on purpose, 16
   UNRULED`. **Production gave the same ten activity-level rows as dev, but its PER-LEVEL gaps are not
   established.** Tick on a pass. **The planner's or the release manager's, and the one tick this plan
   leaves owed.**
2. **`#h8xqv`'s two production reads — the orphan count, and whether anything is already exposed.** The
   brief tells the stream to write the commands and not attempt them. **Planner's or release manager's.**
3. **`0340`, `0341` and `0342` are pending on production.** `0341`'s order is harmless (its code only
   reads `audit_log`); **`0342` must be applied before or with its deploy**, because it rewrites views.
4. **`#k3mqp` — the `0338` back-fill, ~20 rows. It gates `#xkfsv`.** See above.
5. **`#etr20`, `#314hq`, `#40oz4` part B, `#oeglm`'s third reading, `#mx3rt`, `#ao0jk` and `#rqv5c`'s
   remainder — all his**, all unchanged, all restated in `.plan-day.md` rather than re-argued here.
6. **A QUESTION SET was handed to him on 2026-11-09** — twelve questions in five groups, on his Desktop —
   covering `#7aev4`'s four numbers, the shop-link ruling, `#j8vt4`, `#r9wtk` and **#1411's sixteen
   unruled activities grouped into three yes/no answers**. **Read his replies before planning anything in
   those areas, and do not re-ask what it already asks.**
7. **One ask, not six:** `#ifxk8`, `#y1dqu`, `#hzmxi`, `#c7zjk`, `#41yhe` and #1412's two new Thai
   strings all end at **a Thai speaker reading what is already drafted.**

---

## THREE THINGS NOT TO RE-DERIVE, ALL MEASURED THIS PLAN

- **Shape (a) for a ruled Admin-only list ALREADY EXISTED before `#av8rq` was briefed** —
  `scripts/check-ungranted-activities.mjs` plus `docs/ungranted-activities-allowlist.json`, shipped
  2026-11-06 by `#n5r7k`. The item read as *"build this"* and the work was *"stop the other check failing
  for ever"*. **A brief that had not checked would have built a second mechanism.** Step zero earned its
  place.
- **`#79sqf` is COUNTED: 167 pages, the route registry holds 54, 106 card-reachable, 13 driven, 44 worth
  driving at ≈20k each.** So **three streams by area, or the 18 cross-activity pages first** — not a
  programme. **And the pattern is worth more than the next walk: every finding since sweep-6 has been a
  link or notice that does not ask its DESTINATION's activity.** A code check for that one shape may beat
  more browser walking.
- **`#xkfsv` reads as buildable and is not.** Its title says *"ONLY THE FINAL CLEAN-UP IS LEFT … NOTHING
  LEFT TO DECIDE"*; the clean-up itself says *"once the app half has been in production"*. **Read the
  tail before scheduling a title.**

---

## FOR YOUR FIRST TURN

Read `.plan-day.md` before anything. **It closed at 9 of 9 and this edition resets the counter, so you
are planning FROM SCRATCH, not resuming.**

**Check `#rg7pv` first** — `restore-grants` was live in a session with no PR when this plan closed, so it
is neither done nor plannable until you look (`gh pr list --state all --head claude/restore-grants`).

**The natural first batch:** `#3nuwy` (deferred from batch 3 — **re-measure its count** with
`scripts/measure-sql-refusals.mjs` rather than quoting 209/86, because it grows while the programme
runs), **`#j8vt4` + `#q7dn3` folded into one stream**, and `#m4wq2` or `#v3qmz`.

**And give him the list first.**
