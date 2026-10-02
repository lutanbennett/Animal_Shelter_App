# 2026-10-02 — The acceptance matrix: generated from the manual, never typed

**Context.** The shelter has to sign that the system does what it needs. That
needs one checklist: every activity, tried by someone in the role that does it,
in Thai and in English, on the device it is really done on. A typed list of
activities rots within a week of the next feature, so the list is **generated**
(`node scripts/acceptance-matrix.mjs`), and **fails loudly** when it can no
longer be true. `fable-dry-run` walks this checklist, so it comes first.

**What the generator reads.**

| Source | Gives | Mechanical? |
|---|---|---|
| The manual, `src/lib/manual/en.ts`, through `isForRole` | Which activities exist and which roles do them | Yes |
| `scripts/lib/acceptance-matrix-entries.mjs` | What the tester is told to do and see, and the device | No — the words |
| `docs/role-walkthrough.md`, Passes 1–6 | The "must **not** be able to" lines | Parsed; the wording is an entry |
| The 2026-09-24 "Admin on mobile" decision | Phone, desktop or both for the admin and management pages | A judgement per entry |

**A row is an activity, not a topic.** One thing a person does that has one
result a tester can see: "Register a new resident", "Send a resident to
hospital". The test is whether the dry run could mark it pass or fail in one
sitting. A manual topic that covers several becomes several rows — "Foster and
adoption" is three (foster, adopt, bring back), "Sign in" is four, "Security" is
four — while a topic that is one job is one row. 67 topics became 93 rows; the
split is decided in the entries file, once, by a person, because the manual's
headings were written for reading, not for testing.

**Cells.** One column per role — the five app roles, the public viewer, and the
signed-out visitor. A cell is **does** (the manual's `roles`, via `isForRole`),
**must not** (every role outside it, for an app activity) or **–** (the activity
has no meaning for that role: a vet has no My tasks; only a visitor asks for
access). **Must not** is the default for a role outside the manual's list,
because the app both hides the control and refuses the request, and the tester
tries both. `roles` on an entry can only *narrow* the manual's list (the
generator refuses an entry that grants a role the manual does not), so the
matrix cannot promise something the manual denies.

**Cases per "does" cell.** Language (EN and ไทย) × device (phone, desktop, or
both as the entry says): up to four boxes on one line, with a dash where the
activity is not done on that device. That is the item's "a full Thai pass and a
full English pass across the whole matrix", built into every row rather than
left to the dry run's own notes. An activity done on both devices costs four
boxes, which is why `both` is reserved for the pages the Admin-on-mobile
decision marks nice-to-have and for work genuinely done either way.

**Where the walkthrough's "must not" lines go.** They are prose and role-wide
("typing `/vets` is refused"), not activity-shaped, so they do **not** become
cells. Each bullet under a pass's *Must not be able to* (all of Pass 6) needs a
`BOUNDARIES` entry in plain words, matched by the bullet's opening text. They
print as a *Boundaries to try* table in that role's sheet, next to the
generated "must not" activity list. Nothing is dropped: a bullet with no entry
stops the generator and the message prints the entry to paste; a reworded bullet
orphans its entry and says which one. The signed-out visitor has no pass in the
walkthrough, so its three boundaries are written from what the manual promises
about the public site.

**Not committed; the signed edition is.** The generated document is not in git.
A committed copy goes stale silently unless CI regenerates and diffs it, and
with several streams adding manual topics at once that is a conflict on one
generated file in every PR — the failure `docs/decisions/README.md` records for
the old `merge=union` decisions file. What *is* committed is the **signed
edition**: copy the output to `docs/uat/acceptance-<date>.md`, fill it in, keep
it. A signed edition is never edited; any later change to a signed activity starts
a new one. Row numbers (R001…) are by position, so they are stable within an
edition and may shift between editions, which is why an edition is a snapshot.

**What a later PR meets.** `npm run lint` runs `scripts/acceptance-matrix.mjs
--check`, and CI's `check` job runs lint, so **a PR that adds a manual topic
must add a matrix entry** or lint fails. The message names the topic and prints
the entry to fill in. The same goes for a renamed or removed topic (the entry is
orphaned) and for a reworded walkthrough "must not" line. `colour-theme` and
`icon-buttons` are queued behind this and will meet it.

**Not in this PR.** The sign-off **PDF** (A4, cover page, section per role, Thai
fonts from `src/lib/archive/fonts/`) and Thai-language instructions. The
checklist the dry run needs is the generated Markdown; the printable edition is a
follow-up on the `backlog` branch. The instructions are English only until the
Thai manual exists, so a Thai tester reads English steps and judges the Thai app.
**Still to agree before the first real run** (from the backlog item): who tests
which role, an account in each role on the test or UAT site with disposable data,
and what counts as a blocker versus an accepted issue.

**It signs nothing.** Neither the generator nor the dry run signs anything: the
sign-off is the shelter's, by the people who use the system — the same principle
as the test plans' *Manual verification by* line.
