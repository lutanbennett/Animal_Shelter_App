# Planner handover — edition `348`, 2026-10-25

**A delta, eleventh edition in this shape.** Rules are the skill's step 8 — say what **changed**,
promote durable facts once, cite `.plan-day.md` rather than reproducing it.

**Nothing here outranks `CLAUDE.md`, the skill, `docs/backlog.md` or `.plan-day.md`** — if they
disagree with this, they are right and this is stale. **Read first:** `CLAUDE.md` → the skill →
`.plan-day.md` → this. **The next slug is `357`.**

> **Never carried forward: anything read from the repo** — counts, migration numbers, PR numbers,
> release state, candidates. **Re-read every time, never diffed.**

---

## What `339` asked for, and what happened

- **"Never conclude 'the latest definition' from a `create or replace` grep." FIRED, and it was the
  cheapest win of the round** — naming the live guards in the brief is what caught `0224`'s in-place
  rewrite. **Keep it.**
- **"Check whether #4 records the shape it chose for `cards.ts` on the database." FIRED** —
  `docs/decisions/2026-10-24-cards-grants-app.md` exists and says why.
- **"Is `AUDITED_TABLES` the deliverable most likely to be forgotten?" FIRED for #4** (`card_grants`
  and `card_includes` are in) **and FAILED for the handoff** — see the dropped-handoff finding below.
- **"Check PR state with `gh`, not the session list." FIRED AGAIN.** The app reported #916 as OPEN
  when `gh` said MERGED. Third edition running; it has earned permanence.
- **"Capture the actuals before archiving." FIRED** — four of five read while the processes were
  alive. The fifth is the new figure-is-worthless case below.
- **Its band discipline held: four of four measurable streams landed inside.** 235,169 · 149,754 ·
  143,907 · 139,841, all `claude-sonnet-5-5` / `low`, all as recommended. **Dials matched the
  recommendations for the first time in four rounds — do not read that as a model finding.**
- **One thing `339` got wrong, and this edition must correct it loudly:** it carried the item's
  framing that **the 45 page rules were "the big one" needing new cards.** They are almost certainly
  not a breach at all. See below; it is the most expensive error of the round.

---

## THE DEFINING FINDING, AND IT IS MINE: I turned an absolute instruction into a plan with stages, four times

**Lutan's rule arrived 2026-10-24 as *"zero exceptions"*.** By the next afternoon I had turned it into
a *Hidden security screen*, then a cheapest-first removal, then an `AskUserQuestion` offering him
**four orderings to choose between**. He said it four times, ending with *"No more little bit here and
then fix some other stuff I want it all gone right now"* and *"I don't know why it's taken so long for
you to understand my instruction."*

**He killed two streams himself, and both kills were right:**

1. **The *Hidden security screen*** — *"Why are we building a hidden security screen? There should be
   no hidden security."* It was redundant (the registry, the blocking check and `tileBlock()`'s
   named-rule warning already showed the list) **and wrong in kind**: it would have made the debt
   something the app *displays and manages* rather than something being deleted.
2. **`harness-sweep-batch-2`** — *"would our time not be better spent actually removing the
   security?"* Seven of its ten harnesses tested the model being removed, and one,
   `check-perm-convert-residents`, **demands that every resident policy consult
   `roles.scope_residents`** — a column on the removal list — so making it green would have **added**
   hard-coded security.

**All of these are now promoted into the skill** (step 2's figure rule, step 3's hold rule, step 4's
absolute-instruction block, step 7's handoff rule). **Do not re-derive them from this document; it
gets replaced.** The one-line version: **offering a choice feels like deference and reads as delay.**

## AND THE MEASUREMENT THAT SHOULD HAVE COME FIRST: the job is a fraction of the size I said

`canOpen()` tests `route.scope` **before** the activity test; the activity half resolves through
`role_permissions`, which **since `0257` the database computes from `card_grants` alone**. So the
activity half of a page rule is **already card-derived**, and the breach inside `routes.ts` is
**seven `route.scope` entries**, not 45 page rules. **No new cards, no migration, one PR.**

**A job that looks like a programme is worth one hour of reading before it becomes a plan.** Three
batches were built on the unread assumption.

**Two of my own gap figures were wrong in the same area, and both are recorded on the item so nobody
quotes them:** **32** pages "no card opens" (wrong method — it asked which cards *name* a page in
`opens:`), then **10** (read `cards.ts` without `jobs.ts`). **`CARDS` is `NEW_CARDS` plus the jobs in
`jobs.ts`** — read both, every time. **The answer is six.**

---

## WHAT LUTAN DECIDED, and none of it is to be re-opened

- **ADMIN SITS OUTSIDE THE CARD SYSTEM.** *"I am happy for admin access = all to be hard coded"*, *"It
  should sit outside the card system"*, *"Admin always has access to everything"*, *"No matter what
  cards exist or don't exist."* **Now in `CLAUDE.md` as the scope of the rule rather than an exception
  to it** — so *"zero exceptions"* stays true within the card system. Admin is never given cards, is
  not debt, is not a precedent, and **must not be reimplemented as "Admin holds every card"** (the
  short-circuit runs before any cell is read, which is what the ruling requires). **Never put it to
  him again.**
- **The release waits for batch 3.** Asked directly, he chose *after batch 3 merges*, with the cost
  stated. The live Volunteer fault stays open until then — **his call, made with the facts.**
- **The harness sweep is held**, with the reason on the item.
- **`test-plan` stays advisory. A red `audit` cannot block.** Unchanged, and never his to re-answer.

## WHAT HE DID HIMSELF, and what it changes for you

**He put the Director on Admin on production**, so she is not blocked while the removal runs:
*"she will not be impacted by 'can't do something'."* **Correct — both layers bypass**
(`can.ts`'s `isAdmin`, and `has_permission()`'s `r.key = 'admin'`).

**Two consequences a planner must carry:**

- **It removes the release risk `339` would have flagged** — Management's extras stop counting when
  `0257` applies, and that can no longer lock her out. **Deferred, not cancelled:** it still happens
  to the Management role itself.
- **IT ALSO HIDES THE THING THE CARD WORK EXISTS TO FIX.** With her on Admin, **nobody notices if
  Management's cards are wrong, because she is bypassing them.** Management must be tested
  deliberately with a Management login, never inferred from her working normally. **This is the
  masking pattern arriving by a different door, and it is written onto both card-review items.**

**He was also right to narrow my 2-step caution:** the second step gates **three** pages — Security,
Who does what, Stocktaking — **all Admin-only already**, so it stands in front of powers she is
gaining, never anything she had. *"which she wasn't managing before anyway as a management role."*

---

## THE ONE GAP IN THE BYPASS, and it is NOT ESTABLISHED

**`sees_all_residents()` has no admin check** — it asks only `r.scope_residents = 'all'`, and the
resident policies call it *beside* `has_permission()`. **So if the admin role's own `scope_residents`
is not `all`, resident reads stay narrowed even for an Admin.** The read-only production checks
(`role-cells`, `role-cards`) **do not list the admin role at all**, so its column values cannot be
read with what exists. **Settle it on dev, or add the role columns to a read-only check.** The
database half of the removal retires it for good.

## THE RELEASE HAS A PROVEN ORDERING CONSTRAINT — give this to the release manager verbatim

**Apply `0257` and `0258` to production BEFORE deploying the app.** Two independent reads, 2026-10-25:
`role-cards-coverage` **cannot run** against production until `0257` lands (`42883: function
card_closure(text[]) does not exist`), and `loadCardGrants()` **throws rather than falling back to the
seed** — deliberately — so an app deploy ahead of the migration breaks Who does what for the Director.
**Order: migrations → the check prints nothing → deploy.**

---

## THE DROPPED HANDOFF, and the instructive part is that the mitigation half-worked

Batch 2 told #5 to **ask** rather than edit the file #4 owned. **No collision — that half fired.** But
#5 found a job that genuinely belonged to #4, wrote it into **its own completion note**, and
`site_content` was **never on #4's brief** — so #4 added its own two tables and not that one, entirely
fairly. **The piece then landed inside a ticked item**, which is invisible work at its purest. A
website editor now hides a public page and Recent changes does not show it. **Filed, folded into a
stream, and promoted into the skill.**

## Still carried, unchanged

- **Model, effort, and which allowance to spend are his. Never block paid usage** — report, forecast,
  then work.
- **A release's cut and record PRs, and the two handover PRs, merge on green CI without asking.**
- **A measurement has a timestamp; a fact does not.** This document is never a source for release
  state, PR numbers, migration numbers or open counts.
- **Never write scratch output above the repo.** `git show <rev>:<path>` still lies about dotted paths.
- **`worktree.mjs done` refusing is information.** It refused the diets folder on 2026-10-25 and was
  right: the branch held two finished commits. **`--force` would have discarded a morning's work.**

## NEXT ROUND POINTS AT

1. **The removal PR** — all nine breaches, one PR, port 3010. Then the **database half** as its own
   schema PR, whose scope that PR lists for you.
2. **`diets-stop-writing-old-columns` is BUILT with no PR** (two commits, 2026-10-25 07:42). It needs
   a session to open the PR and nothing else.
3. **Then the release** — `0257` + `0258`, in the order above. Major vs minor and the deploy are his.
4. **The two card reviews**, both filed as next up: do cards deliver what they advertise, and the
   **six** missing Management/Operations cards (propose, do not create — each needs `card_grants`
   rows, so building them is a schema PR after he approves the set).
5. **Take Admin back off the Director** once Management's cards are in and she can do her whole job on
   Management. The revert condition is on the item; **a temporary production access change with no
   written trigger becomes permanent silently.**
