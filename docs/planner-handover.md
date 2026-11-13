# Planner handover — edition `745`, 2026-11-13

**This is a DELTA against `744`.** It says what changed, corrects its predecessor, and reports what each
of `744`'s owed items did. Figures, batch composition and ports live in `.plan-day.md`.

**It outranks nothing.** One chat reads it, one plan replaces it, and a wrong line is corrected by its
successor rather than by a reviewer.

**WHICH PLAN'S FIGURES THIS REPORTS: THE FIRST 2026-11-13 PLAN'S** — fourteen streams, ten measured, read
on the morning of 2026-11-13 and recorded in `.plan-day.md`. **This edition's own plan is the SECOND
2026-11-13 one, which ran to ELEVEN streams in four batches, and it carries NO figures here. They belong
to `746`.** A missing set is not a lost one.

---

## THE LEAD: EVERY BRIEF IN THIS PLAN WAS DATED A DAY INTO THE FUTURE, AND CI CAUGHT IT TWICE

**Today was 2026-11-13. The planner wrote 2026-11-14 into every brief, every backlog note, the plan file
and three prescribed decision filenames.** Two streams obeyed, named their decision files
`2026-11-14-*.md`, and `decision-dates` — which blocks — went red on both:

> `FAIL docs/decisions/2026-11-14-reviewer-name.md is dated 2026-11-14, after today (2026-11-13): rename it`

**Lutan noticed before the planner did**, asking *"Why are the decision dates failing on every stream?"*
Those two runs (43394960705, 43393187587) were the only red CI of the day. Both streams renamed and merged.

**HOW IT HAPPENED, BECAUSE THE MECHANISM IS THE USEFUL PART:** the planner opened a fresh chat, read
handover `744` (dated 2026-11-13) and a `.plan-day.md` whose batches were all closed, and concluded a new
day had begun. **It had not: this was the SECOND plan of the same day.** Two documents that each said
"2026-11-13" were read as evidence that it was now the 14th.

**THE GUARD IS ONE LINE AND IT COSTS NOTHING: read the date from the system and compare it with the date
on the handover you just read.** If they are the same, you are the second plan of that day — which is a
normal thing to be, and `SKILL.md` already allows it. **Never derive today's date from a document.**

**AND THE RESIDUE IS STILL OWED:** PR **#1557** and PR **#1560** have merged bodies citing
`docs/decisions/2026-11-14-migration-number-hook.md` and `2026-11-14-merch-shop-schema.md`, **neither of
which exists** — the real files are the `2026-11-13-` ones. A future session grepping those names finds
nothing. **`gh pr comment` was refused in the planner's session as `[External System Writes]`, and asking
a stream to post it would have been cross-session permission laundering, so it was not done.** It needs
one comment on each PR from Lutan, or a permission rule.

---

## WHAT ELSE IN `744` IS SUPERSEDED

- **`744`'s owed item 3, "brief length may move the floor — NOT ESTABLISHED", is now SUPPORTED and still
  not closed.** Four briefs were measured before their folders were cleared; the three usable pairs are
  **monotonic — longest brief, highest floor, in order** — and across 7,742 characters the floor moved
  5,227 tokens. **The counter-example `744` leaned on (`refusal-keys-group-10`) rested on a figure that
  has since been superseded by a corrected comment.** The effect is about 2.7× larger than the briefs'
  own token cost explains, so **the mechanism is not simply "the brief is in the window"** and the honest
  reading is still three points. Keep testing it; a shorter brief may be a real saving.
- **#1547's figure is 236,476, not the 218,435 `744` reported.** Its corrected comment arrived and says
  so in terms. **The deadlock work is measured after all**, and `744`'s line calling it unmeasured is wrong.
- **`744`'s owed item 5, "`#d6wxo` IS BRIEFABLE", was right but incomplete** — see the next section.
- **`744`'s owed item 6 is spent: `#z1qn7` was offered a third time and ACCEPTED**, and is batch 4's
  migration-carrying stream. Do not re-offer it.
- **`744`'s owed item 7 is closed**: `waiting-on-lutan`'s folder, and every other folder from batches 1–3,
  are cleared. The registry now holds only the main checkout, the backlog worktree and batch 4's two.

---

## THE BIGGEST FACT OF THIS PLAN: THERE IS NOW A SECOND EXCEPTION TO THE CARD RULE

**Lutan was offered three shapes for the adopter / foster-carer gate, was told IN TERMS that the one he
was choosing would be the first non-Admin exception to his own zero-exceptions rule, and answered in
writing: *"Yes, an exception"*.** It is recorded in `CLAUDE.md`'s card section (#1561),
`docs/decisions/2026-11-13-adopter-portal-card-exception.md`, and
`docs/hard-coded-security-registry.json` as `outsideTheCardSystem.websiteAccount`, `counted: false`.

**Its scope, and nothing wider:** a non-staff account that signs in on the **public website**, posts
updates and photos **only on residents it adopted or fosters**, has them **approved by staff before
publishing**, and **reaches nothing else**. **Like Admin, it is not a precedent**, and everything beyond
that stays card-governed — staff approval of those updates included.

**WHY A PLANNER MUST KNOW THIS BEFORE BRIEFING ANYTHING NEAR IT:** until #1561 merged, `CLAUDE.md` told
every session that nothing but a card may grant an ability. **A stream briefed on the portal against the
unamended rule would have been building the one thing the repo's own rules forbid**, and the blocking
`hard-coded-security` job is built around that rule. **The ordering — record the exception first, in its
own small stream, then build — was the single best sequencing decision of this plan, and it is the shape
to copy for any future exception.** Do not put the exception to him again; it is settled.

---

## THE THREE INCIDENTS OF THIS PLAN WORTH CARRYING

- **A RED PERMISSIONS CHECK READS AS AN AUTHENTICATION FAULT, AND COST AN INTERRUPTION.** Lutan asked
  *"Why is my authentication failing on the shop staff stream"*. Nothing was failing: the stream had
  signed in, driven the screens and opened #1565. What was red was `control-activity`, on one NEW finding
  — `src/app/management/merch-shop/page.tsx:179 <form action> saveProduct: no gate` — because the page
  opens at `merch.manage` **read** while saving asks **edit**, so a read-only login was offered a Save
  button. **The tell to give him: a sign-in fault stops a session working at all; this one let the stream
  finish the whole feature and surfaced only in CI.** **The briefing lesson: a page whose READ level is
  lower than its WRITE level needs the button rule as a NUMBERED DELIVERABLE**, not left to the block
  every brief carries. It is written into `adopter-portal-app`'s brief as deliverable 6 — **check next
  round whether that fired.**
- **A QUOTED HEREDOC THROUGH THE BASH TOOL ATE THE BACKSLASHES IN A REGEX.** `'\\['` reached the file as
  `'\['`, turning an anchored match into a character class that matched nothing — so a guard written to
  fail loudly passed by finding nothing, and `findIndex` returned −1 in silence. **Write a script with the
  Write tool when it contains regex escapes.** The same shape bit the block-parser in the brief assembler
  minutes later, where `brief-blocks.md`'s CRLF made every fence fail to match; **normalise line endings
  before parsing any repo file.**
- **A STREAM'S REPORT IS A REPORT, NOT PROOF — AND CHECKING IT PAID TWICE.** `shop-public` reported four
  findings at merge; all four verified in the tree and three became `#m3kpq`. `shop-staff` reported its
  `control-activity` fix; reading the pushed commit confirmed the gate was real and in the right shape.
  **Both checks were cheap. File nothing, and tell him nothing is done, on a report alone.**

---

## STANDING CHECKS — three new

- **THE STALE TITLE HAS NOW BEEN CAUGHT EIGHT TIMES** (`#v3knd`, ticked by #1562 with its title still
  reading *"STILL SHOWS NO NAME"*). **The pattern is settled enough to act on rather than re-derive: the
  stream that ticks an item does not re-read its title, so the planner must — every batch, for every item
  a stream touched.** `check-stale-titles.mjs` is a heuristic and will not catch them all.
- **AN ITEM HE HAS RANKED IS NOT TO BE DISMISSED ON A READING OF ITS TITLE.** The planner wrote that
  `#1wf15` had *"nothing to build"*; an unplanned stream (#1559) then closed it. **Read the item's tail
  before concluding there is no work in it.**
- **`docs/backlog.md` IS `eol=lf` IN THE WORKTREE TODAY** (`git ls-files --eol` says `i/lf w/lf`), so the
  CRLF trap the last three handovers warn about did not apply. **`src/lib/releases.ts` may still differ.
  Detect it; do not assume either way in either direction.**

---

## FOR YOUR FIRST TURN

Read `.plan-day.md` first. **It stands at 11 of 11 and this edition resets the counter, so you are
planning FROM SCRATCH.**

**Tell him at the start that the sync plus the `worktree.mjs new` runs plus the briefs is about half an
hour.** Three editions have now recorded that as the fix for an interruption and it still holds.

**WHAT IS OWED:**

1. **MEASURE THIS PLAN'S ELEVEN**, from the merged PRs: #1557 `migration-number-hook`, #1558
   `bills-chips`, #1560 `shop-schema`, #1559 `network-writing-rule` (**unplanned, no dials set**), #1561
   `record-card-exception`, #1562 `reviewer-name`, #1563 `shop-public`, #1564 `adopter-portal-schema`,
   #1565 `shop-staff`, plus batch 4's two (`report-animal`, `adopter-portal-app`), which were in flight
   when this was written. **All eleven were briefed `@sonnet-5-5/low`**; compare each comment's `model=`
   and `effort=` with that before counting any figure as evidence.
2. **RE-DERIVE THE FLOOR FROM THE COMPLETE SET AND NEVER CARRY IT FORWARD.** This plan's predecessor gave
   **84,526–90,793, mean 87,343 from ten figures** — the mean has moved 817 tokens in three plans. **And
   re-test brief length against it**, which is now the most promising open question about cost.
3. **CHECK BATCH 4's TWO HYPOTHESES.** Did `report-animal` build ONE form with a "what is this about"
   choice rather than two, and which did it choose for the open question it was handed — a page under the
   existing `/services` prefix, or a new top-level prefix touching `PUBLIC_PAGE_PREFIXES`, the Worker's
   cache lists, the hide keys and the sitemap? Did `adopter-portal-app` answer whether
   `public_adoption_updates` shows an approved update on a **fostered** resident, and did it **report**
   a view change rather than taking a migration number it was told was not its own?
4. **`#m3kpq` NEEDS A MIGRATION SLOT.** Three deferred merch-shop schema pieces, filed in `## Fundraising`
   directly after `#cjxq0`: `place_merch_order()` does not exist, there is no `page:shop-merch` hide key
   (so hiding `page:shop` hides the affiliate page too), and the three `merch_*` tables have no audit
   triggers. **All three are additive schema on the same tables — one stream, not three.**
   `check-audited-tables.mjs` passes today, so none of it is red.
5. **`src/lib/merch/shop.ts:81` HOLDS A DATED EXCHANGE-RATE CONSTANT** (`RATES_AS_OF = "2026-11-13"`),
   whose own comment says it stands *"until a staff-edited rate screen exists"*. `shop-staff` was asked
   for that screen; **read its PR before assuming either way.**
6. **FOUR BATCHES IS NOT THE NEW SHAPE.** This plan grew to eleven streams because he added two mid-plan
   and the one-migration-per-batch rule would not let the result fit in three. `SKILL.md` assumes three
   batches of three. **Plan three; let him add.**

**Do NOT re-ask him about:** the adopter-portal exception (settled, in writing, above); whether
`#z1qn7` should be built (he said yes on 2026-11-13); the shop's payments (manual both ways, no
processor); or anything on `744`'s own do-not-re-ask list, all of which still holds.
