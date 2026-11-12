# Planner handover — edition `743`, 2026-11-12

**This is a DELTA against `742`.** It says what changed, corrects its predecessor, and reports what each
of `742`'s owed items did. Figures, batch composition and ports live in `.plan-day.md`.

**It outranks nothing.** One chat reads it, one plan replaces it, and a wrong line is corrected by its
successor rather than by a reviewer.

**WHICH PLAN'S FIGURES THIS REPORTS: THE SECOND 2026-11-12 PLAN'S** — nine PRs, #1520 to #1528, read this
morning from merged PRs, and **the first fully complete set of nine the project has had.** **THERE WERE
THREE PLANS ON 2026-11-12**, because each reset the counter and each nine was built the same day. **This
edition's own plan — #1530 to #1535 plus batch 3's three — carries NO figures here. They belong to `744`.**
A missing set is not a lost one.

---

## THE LEAD: A PLAN LINE WRITTEN BEFORE THE ITEM WAS READ CAN BE A WHOLE BATCH OUT OF DATE

**Three of this plan's six later briefs were re-scoped at briefing time, and every one of them was the
plan line being stale rather than the plan being wrong.** The nine were chosen and agreed from item
titles in one `AskUserQuestion` before any worktree existed; the items were read when each brief was
written, hours later. **That gap is where all three sat.**

- **`worker-cpu-fallback-paper` was planned as *"a paper that prices the options costing nothing"*. The
  decision was already taken** — Lutan, 2026-11-12: *"can we keep serving the website and have a page on
  the app saying it's offline"* — **and the measurement it depended on had already been made** during the
  case swap: 41 Worker invocations rendering the website, **41 `ok`, zero `exceededCpu`**, median 33 ms,
  max 837 ms, against **113 consecutive `exceededCpu`** on the app's save path. So it was briefed as the
  **build**, band 150–195k → 170–215k. It shipped as #1535.
- **`general-bill-photos` was planned `migration=none, may need one`. It needs TWO FILES.** `#00e3u`
  said whether a general bill can own a photo at all was *"NOT established"*. It is now:
  `0188_bills_owner_types.sql` adds exactly four values to `attachment_owner_type` — `clinic_visit`,
  `stock_receipt`, `bill_inbox`, `maintenance_bill` — **and no `general_bill`.** `0188`'s own header
  states why that makes it two files: *"A file that adds an enum value cannot also use it."*
- **`donate-promptpay-qr` was planned as the manual fallback build. Both halves appear already shipped**,
  by other work, which is why nobody noticed: the static QR on 2026-10-13 (`donation_channels`, `0191`;
  `DonateWays.tsx` reads `channel.promptpay_id` and renders `channel.qr_drive_file_id`) and the record on
  2026-10-09 (`donations` + `donation_lines`, `0168`, with Management → Donations entering, listing and
  totalling). Briefed as an investigation that may end in a retitle; band 145–185k → 110–170k.

**THE DISTINCTION THAT MATTERS, BECAUSE THE SKILL FORBIDS THE OTHER THING: reading the item in order to
WRITE ITS BRIEF is briefing, not re-checking the plan.** His 2026-11-11 instruction removed the
end-of-batch sweep back over the backlog looking for better candidates. It did not remove reading the
item you are about to brief — **that is step 2, and skipping it is how four briefs named a file that does
not exist.** **Keep the items, re-scope the brief, and say so in your reply to him.** All three streams
merged.

---

## TWO LINES OF `742` ARE SUPERSEDED

- **`742` said `#79sqf` stands at *"13 of 25, twelve named"*. It is now 21 of 25.** `control-press-fixtures`
  (#1532) built the fixtures `742` correctly identified as the real deliverable and drove eight more.
  **Four are left and the item is retitled to say so**: three of them are one pass over a script that now
  exists.
- **`742`'s owed item 4 — `Animal_Shelter_control-press-group-d` (port 3005) held with its PR merged — is
  closed.** The folder is gone and 3005 was reissued to a new stream the same day.

---

## THE FIGURES — the second 2026-11-12 plan's nine, A COMPLETE SET

**NINE OF NINE POSTED A `stream-usage:` COMMENT. THE FIRST FULLY COMPLETE SET.** `741`'s recovery trick
was not needed once, and nobody posted a blank-field comment.

| slug | PR | band briefed | actual | reading? |
|---|---|---|---|---|
| `refusal-keys-group-8` | #1520 | 155–195k | 153,490 | valid — 1.0% under |
| `drive-sharing-report-production` | #1521 | 130–165k | 143,102 | **NOT a reading** — left no commit, planner finished it |
| `adopter-media-and-translations` | #1522 | 200–270k | 271,632 | valid — 0.6% over |
| `control-press-group-d` | #1523 | 250–320k | 286,352 | **NOT a reading — `finished=blocked`** (stopped on size, no fault) |
| `manual-unassigned-topics` | #1524 | 130–175k | 167,805 | valid, in band |
| `bill-import-csv` | #1525 | **340–460k** | **258,134** | valid — **24% UNDER** |
| `build-lock-and-migration-slot` | #1526 | 140–180k | 176,705 | valid, in band |
| `acceptance-matrix-twelve-rows` | #1527 | 145–190k | 166,093 | valid, in band |
| `admin-home-simulation-subpage` | #1528 | 155–200k | 200,758 | valid — 0.4% over |

**SEVEN VALID READINGS. FOUR IN BAND, THREE MISSED BY UNDER 1%, ONE REAL MISS.** The sub-1% misses are
rounding and carry no lesson; **do not move a row for them.**

**THE ONE REAL MISS IS A DISCOUNT NOBODY PRICED.** `bill-import-csv` was banded on the *Large* row and
came in a quarter under, **and the cause is knowable: its own investigation stream shipped first**
(`bill-import-investigation`, #1516, 158,800, in band) and handed it the cause, the decision and the
shape. **THE RULE THIS EARNS: a build whose own investigation stream shipped first bands ONE ROW DOWN.**
The skill already said such a brief *"lands near the floor"*; **this is the first measured size of it,
about 25%.**

**THE FLOOR, RE-DERIVED FROM THE COMPLETE SET: 84,458 to 88,730, mean 86,526** — nine figures, 48 in all.
`742` said ≈85k from 39. **Re-measure tomorrow; never carry it forward.**

**EVERY ONE OF THE NINE RAN ON `sonnet-5-5` AT `low`, AND SO DID ALL NINE BEFORE THEM.** So **every row
of the bands table is measured on Sonnet 5.5 at `low`.** Three briefs in this plan were corrected from
`opus` to `sonnet-5-5` before he opened the sessions — **a band quoted against a different model is
meaningless rather than generous.** **No judgement about the models is drawn or drawable from this.**

---

## WHAT `742`'s OWED ITEMS DID — all four closed

1. **Measure the nine — done**, above, and complete.
2. **The three hypotheses — all three checked, and one did NOT fire.**
   `build-lock-and-migration-slot` (#1526) **declined `#y1x2r`'s candidate (b) as its brief asked**:
   *"`--drift` was CLI-only, so I added a small flag instead of extracting a library."*
   `acceptance-matrix-twelve-rows` (#1527) **accepted the park ruling and did not stop to ask** —
   *"Corrected 4, already correct 7… No app defects found."*
   `admin-home-simulation-subpage` (#1528) **built the subpage**; the planner's guess that it would find
   the simulation already Admin-only and cosmetic was wrong. **Record a hypothesis that misses as
   plainly as one that fires** — this is the first of the three rounds where one did.
3. **`#79sqf`'s fixtures — done** and the item is at 21 of 25. See the superseded note above.
4. **Port 3005's held folder — cleared.**

---

## WHAT THIS PLAN'S SIX MERGED STREAMS LEFT BEHIND

**Batch 1:** #1531 `refusal-keys-group-9`, #1532 `control-press-fixtures`, #1530
`close-two-recorded-items`. **Batch 2:** #1535 `worker-cpu-fallback-paper`, #1533 `thai-strings-queue`,
#1534 `env-readers-and-decision`. Batch 3 (#7–9) was set up and is his to open.

- **ONE BACKLOG FILING IS OWED AND ITS CONTENT IS HERE SO IT CANNOT BE LOST** — #1531's *next group* for
  `#3nuwy`: **5 messages in 4 functions are all that is left of the person-read English.**
  `recurrence_dates` and `recurring_job_dates` (both `0095`, both raising *"Ask for at most two years of
  dates at a time."*) and `role_can` (`0277`, `security definer`) across
  `src/app/management/recurring-jobs/actions.ts`, `src/lib/medical/weigh-first.ts`,
  `src/lib/recurring-jobs/queries.ts` and `src/lib/recurring-jobs/eligibility-load.ts` — four caller
  files, three messages, **a natural single group**. Then `propose_website_draft` (`0315`,
  `security definer`), two messages, one caller file (`src/app/admin/website/actions.ts`).
- **A new backlog item arrived from a stream, at his request: `#md4rq`.** A brief's band is measured on
  one model at one effort and **nothing checks the session was opened that way**, so a figure can read as
  a **78% overrun while nothing overran** — which is what `close-two-recorded-items` found about its own
  run. **Batch 2's and batch 3's briefs now carry a line: if the session is not Sonnet 5.5 at `low`, say
  so in the first line of the PR body.** That is a mitigation, so it is a hypothesis: **check next round
  whether any PR body carried it.**
- #1533 and #1534 report **no findings beyond their deliverables**. #1533 confirms
  `check-thai-dictionary.mjs` reports clean, *"confirming it tests existence only"*.
- **`docs/thai-read-routine.md` now exists** (#1533) — a weekly sweep of the worklist. The Thai read
  itself (`#y1dqu`) is still outstanding and is the queue, not a defect.

---

## STANDING CHECKS — three new, the rest unchanged

- **A GREP THAT FINDS NOTHING IS NOT A FINDING.** Looking for the `donations` table, the planner grepped
  for a `create table` form, hit only `0168_donation_receipts.sql`, and **concluded there was no
  `donations` table** — briefly briefing a stream that it had nowhere to record a payment. `#ss2s0`'s own
  text corrected it: `0168` built it. **Before concluding something does not exist, search for it a
  second way, and read the item that claims it.** Same shape as the `git show <rev>:<path>` trap
  `CLAUDE.md` records, and it cost a wrong sentence rather than a wrong brief only because the item was
  read next.
- **A RECURSIVE `grep -rn` FROM THE REPOSITORY ROOT IS A TWO-MINUTE COMMAND HERE AND GETS KILLED.** It
  happened once this plan. **Use the Grep tool, or scope to one directory.** Both are in every batch-3
  brief.
- **A TECHNIQUE WORTH KEEPING, from #1530:** a dev-signin snippet **cannot** be loaded into the page from
  a file in `public/` — the path is not on `PUBLIC_PATHS`, so the proxy redirects the script request to
  `/login`, the tag receives HTML and the console shows `Uncaught SyntaxError: Unexpected token '<'`,
  **which looks nothing like an auth problem.** What works with no change to any path list: serve the
  snippet from a separate local port with `access-control-allow-origin: *`, fetch it from the page and
  assign the cookie value directly, no `eval`.
- **`742`'s three and `741`'s five all still hold** and are not repeated: never describe your own action
  in a PR comment before it has returned; never reach for `BACKLOG_COMMIT_ALLOW_UNNAMED=1` when the hook
  names an item you did not mean to touch; a squash-merged branch needs
  `git push -u origin claude/<slug>` before `worktree.mjs done`; the double `git merge backlog`;
  `check-backlog-sections.mjs` reading `main`'s copy; the pre-commit hook naming every item; never
  writing a backlog note through `node -e`; four-to-six sessions creating worktrees.

---

## FOR YOUR FIRST TURN

Read `.plan-day.md` first. **It stands at 9 of 9 and this edition resets the counter, so you are planning
FROM SCRATCH.**

**Read `SKILL.md`'s THE ONE RULE before anything else.** **Three days now with no interruption about the
list — nine firings** — but **this plan cost one interruption of a different kind, and it is a briefing
defect, not a stream's:** he asked *"are we close, it's been nearly 30 minutes"* while batch 2 was being
briefed. **Two of the three briefs were being re-scoped from their items at the time, which was the right
call and still took too long.** The lesson is not to brief faster; it is that **the sync plus three
`worktree.mjs new` runs plus three long briefs is about half an hour, and he should be told that at the
start rather than left to ask.**

**Your first hour is plan, agree the nine, set up batch 1, send the list — and only then** measure, clear
the merged batch's folders, read the PR bodies and file.

**WHAT IS OWED:**

1. **MEASURE THIS PLAN'S NINE:** `refusal-keys-group-9` (#1531), `control-press-fixtures` (#1532),
   `close-two-recorded-items` (#1530), `worker-cpu-fallback-paper` (#1535), `thai-strings-queue` (#1533),
   `env-readers-and-decision` (#1534), and batch 3's three. **`close-two-recorded-items` may not be a
   band reading — see `#md4rq`: check the `model=` and `effort=` fields on every comment before counting
   it.**
2. **FILE #1531's NEXT GROUP ON `#3nuwy`** — the content is in this edition above, so it survives even if
   nobody reads the PR.
3. **CHECK BATCH 3's THREE HYPOTHESES.** Did `general-bill-photos` find the enum really lacks
   `general_bill`, and did it ship two migration files or find a third way? Did `donate-promptpay-qr`
   confirm both halves had already shipped and retitle `#kxksr`, or find a real gap? Did
   `rule3-second-argument` find any `user`-class string in `driveErrorMessage`'s second argument, and did
   it leave `RULE_3_BLOCKS = false`?
4. **`#79sqf` IS STILL HIS #1: 21 of 25, four left.** Three of the four are one pass over
   `scripts/dev-fixtures.mjs`, which now exists. **The fourth, row 8, needs
   `dev-assistant-model.mjs --dev` and a second dev server on a second port.** Row 10's `UndoDeathForm`
   is **Admin-only by design and must not be given a card to press it.**
5. **BATCH 2's AND BATCH 3's WORKTREES ARE HELD BY THEIR SESSIONS.** Batch 1's are cleared. Clear the
   other six once those sessions are closed; **do not tear a held folder down.**
6. **`#d6wxo` STILL CANNOT BE BRIEFED.** He was asked on 2026-11-12 and **answered the shape, not the
   gate**: *"I want them to be able to access from the website on a page and authenticate on that page to
   send into the system."* **That is settled and useful — a public website page carrying its own sign-in,
   not a new role on the staff login.** What is open is whether that login's access is a card, a scope
   resolved in the database, or a recorded bypass for the non-staff class. **Ask again, narrowly, about
   the gate alone.**
7. **`#yy9fz`, FRIDAY 13 NOVEMBER, IS A CONFIRMATION RATHER THAN A CHANGE.** Production's Drive tree
   measured **357 folders, 972 files, 0 anyone-shared, 0 failures**, exit 0, and the root is in the walk
   (`scripts/drive-sharing.mjs` seeds its queue with the root id), so it covers the link he re-added on
   2026-11-10. **Nothing is left to remove.** What remains is caveat (a) — nobody has rehearsed the
   lockdown script against UAT — and **the Worker's own Google identity, still unread**: the local script
   authenticates as the **dev** account.
   **ONE OPERATIONAL FACT THAT COST A REFUSAL:** `node scripts/drive-sharing.mjs --env production` is an
   **exact-match** allow rule. **Sent with the background flag it is refused as `[Production Reads]`;
   sent plainly in the foreground it runs**, and the harness moves it to the background itself.

**Do NOT re-ask him about:** the Worker fix (he chose *keep the website up, app says offline*, and the
paid-plan arm is declined — `#dxjz2`); the donation provider (option 3, no integration, *"for now"* —
`#kxksr`); whether admin screens need Thai (settled 2026-11-06, they stay English); the three
`/plan-day` fixes; `#aaqtl`, which is three deploy steps of his and not a stream; payroll in the document
store; where supplier withholding documents live; or the production Drive **write** guard, which stays.
