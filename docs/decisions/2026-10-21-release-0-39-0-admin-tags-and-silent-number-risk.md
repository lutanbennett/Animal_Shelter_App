# Release `0.39.0`: two notes tagged at the cut, and a wrong-number risk shipped on purpose

2026-10-21. Both of these are decisions rather than findings, and both were
Lutan's. Written down because each has a tempting wrong lesson attached.

## Role tags were added at the cut for the second release running

Two of the nine notes describe **Settings → Who does what**, a page only an Admin
can open. They arrived in `unreleased` as plain strings, which shows a note to
every live role, so a volunteer and the 2IC were about to be told about a board
they cannot reach. Raised in the opening round; **he chose to tag both `admin`.**

Why it was safe here, on the same reasoning as `0.38.2`'s single tag: the note
**texts** are untouched, and the cut's verification compares the notes **as
values**, so it asserts that tags changed on exactly notes 6 and 7 and that the
other seven are still untagged. **A tag change is visible to the check rather
than hidden by it.** That is the whole of the licence, and it does not extend to
rewording a note at the cut.

**The lesson is not "tagging at the cut is fine".** `0.38.2`'s record already said
a role tag belongs in the feature PR, because that is where someone knows who the
feature is for. It has now happened twice, which makes it a process gap rather
than an accident: **the release-notes line in `docs/test-plan-template.md` asks
whether a user would notice, and does not ask who.** Filed on the `backlog`
branch. Until that changes, expect the release manager to keep finding these, and
expect the finding to keep being correct — which is the argument for fixing it
upstream, not for getting better at catching it late.

## A wrong-number risk shipped without a person looking, on his explicit decision

Fourteen test plans in this release await a person. Eleven are real; three ask how
a *future* chat or edition reads a document and cannot be closed by anybody today.

One of the eleven is not like the others, and it was put to him **separately from
the count** rather than inside it: diets became recipes, so a resident's diet form
now carries a **portion multiplier** where it carried a daily amount, and
Purchasing, the food forecast, Cashflow and stock usage all read ingredients
instead of treating a diet as one product. **Nothing in that path has been clicked
through in a browser.** If it is wrong it does not throw — it produces a *wrong
number* on a food order, which is the failure class this project holds a release
for.

**He chose to ship with all fourteen recorded**, as he has for the last four
releases, having been told which one of them was the numeric risk and what five
minutes would have covered (`docs/test-plans/diets-app.md`, *Left for manual
verification*). That is his call to make and it is recorded as made, not absorbed:
it is a stated gap in `docs/releases/2026-10-21.md`, not a tick.

**What makes it tolerable rather than reckless**, and all three were established in
code rather than assumed:

- **A diet with one ingredient behaves exactly as before** — stated in the note and
  in `0239`, so every diet that exists today is unchanged until someone edits it.
- **`0239`'s own plan proves the forecast arithmetic by script**, so what is
  unverified is the screens, not the maths.
- **The rollback is a Pi rebuild of `0.38.2`**, and `0243`'s drops do not stand in
  its way for the reason given in that plan — but they are **not reversible**, which
  is why a fresh production backup was taken before the apply rather than relying
  on the 03:00 nightly one.

**The wrong lesson would be "pending plans are routine, so stop raising them."**
The right one is the opposite: the count is routine, and **the one inside it that
produces a wrong number is not**, so it gets its own question every time. That
distinction is why this release cost him two interventions and not three.
