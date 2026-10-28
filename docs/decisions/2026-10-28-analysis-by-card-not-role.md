# All analysis is by card, never by role

**2026-10-28.** Lutan, twice in one day:

> *"Can we stop analyzing against Roles. All analysis must be against cards as Roles are just a
> transient grouping of cards."*

and, earlier, mid-review:

> *"Let's keep the review to cards not roles. As roles are only transient groupings and all will be
> updated once we finish the cards."*

The rule now lives in `CLAUDE.md` and, for the planner, in `.claude/skills/plan-day/SKILL.md`.

## Why it needed saying twice, which is the whole reason this file exists

The first time, it was recorded — in `docs/card-access-faults.md`'s gate-3 section, as a rule for
every future row in that log. **Hours later the same session sized Card review 2 as "32 unexplained
orphans: doctor 9, management 10, 2IC 5, head of medical 4, head of maintenance 3, volunteer 1."**

So he said it again.

**The lesson is not "try harder".** It is that a rule recorded in the document it was discovered in
only governs that document. A rule about how *all* analysis is written has to sit where work starts,
which is `CLAUDE.md`.

## Why it is a THIRD role rule and not part of the two that exist

`CLAUDE.md` already had two:

1. **Hard-coded security is forbidden** — what may *grant or deny* access. Only a card may.
2. **No code may fall back to a role BY NAME** — what *code may read*, so a shelter can rename its
   roles.

**This one governs what a person or a session may CONCLUDE and REPORT.** Prose, tables, bands, briefs,
backlog notes, release notes.

The distinction matters because the two existing rules were both being followed. The codebase is
card-driven and no code falls back to a role name — and the analysis on top of it was still entirely
role-shaped. **A perfectly card-driven system can be reported on exclusively by role, and that is what
was happening.** No check catches it, which is why it has to be read rather than enforced.

## The test, and a worked pair

**If a sentence names a role, would it still be true after the card assignments are rebuilt?** He has
said they will be: *"I will build all of the card assignments up once we have finished all cards."*

- **Not a finding:** *"Five of six roles can download the whole resident list."* True this morning,
  false next week, and it tells you nothing to act on.
- **A finding:** *"Eight cards carry the whole-list download, because `src/app/residents/export/route.ts`
  asks only `resident.record` at read."* Durable, and it names the thing you would change.

Roles survive in two places, neither of which is analysis: **who is affected today**, labelled as
transient context, and **ordering** on an admin screen, which `CLAUDE.md` already permits. *(The
"transient context" carve-out is my reading of his instruction rather than his words, and is flagged
for him in this PR's test plan.)*

## The part that makes prose insufficient: the instruments

`scripts/check-menu-coverage.mjs` opens with *"which pages would become unreachable for each
non-Admin role"* and loops `for (const role of roles)` over `role_cards`, `role_permissions` and
`role_groups`. Most of `scripts/check-production.mjs` is keyed on roles the same way.

**Every brief, band and backlog note is written from their output.** While they answer per role, the
rule will keep being broken by people trying to follow it — which is exactly how the Card review 2
sizing came out role-shaped within an hour of the rule being written down.

**And it exposed a mismatch nobody had noticed:** Card review 2's backlog item describes computing
*"which pages no card can open"* — card-shaped — while the only instrument for it answers per role.
Its "32 unexplained orphans" are **32 role-page pairs, not 32 pages**: the same page is counted once
per role that cannot reach it, and nothing reports the distinct-page figure that would actually size
the work.

**Making the instruments card-shaped is its own backlog item** (Security, 2026-10-28). It is
deliberately not done here, so the rule is not held up behind a scripts job.

## The shape to copy

`fault-maintenance-delete` was rewritten the same day (#1040), from *"which roles hold Do
Maintenance"* to *"does any card grant `maintenance.delete`?"*

Same subject, card-shaped — and the rewrite did more than restate it. The old form **failed whenever
any role held the card**, on a premise ("no delete control exists") that was false, so it reported the
intended design as a fault on every run and would have for ever. The card-shaped form **guards the
decision instead**: none is correct, and one would mean deleting a job had left Admin.

**That is the argument for the rule in miniature.** The role question was not merely less durable; it
was unanswerable, and being unanswerable it had quietly become noise.

## One modelling caveat, stated rather than glossed

**Reachability is not a property of a card alone.** A page can be reached from a tile on a home,
through a group doorway, or because another card in the set opens the section (`opensAnyIn`).

So *per card* has to mean **a login holding exactly that card and nothing else** — the strictest
reading, and the one that finds every page no single card opens.
`node scripts/dev-signin.mjs <role> --cards <card>` already models precisely that, so the concept is
in the repo.

**Where a page genuinely needs two cards together, that is a finding to report, not a wrinkle to
hide.**

## Not established

Whether the role-shaped checks should be **rewritten or kept alongside** card-shaped ones is open.
`role-cards` and `role-cells` answer real operational questions about the live database — "what does
this login actually hold right now" — and deleting them would lose that. The backlog item says to keep
the role view where the question genuinely is *who is affected today*, and to label it as transient
context rather than as a finding. **That split has not been tested against a real piece of work yet.**
