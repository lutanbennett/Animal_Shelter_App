# 2026-11-08 — CLAUDE.md states the card-coverage result it was measured to have (#k2v8m, #c5nt2)

## What the sentence now says

`CLAUDE.md`, under *Hard-coded security is forbidden*, used to say of the "a card does nothing" property: **"It does not pass yet:** on 2026-10-24 production named four roles." It now says that **no card in the catalogue grants nothing wherever it is held**, measured on production on 2026-11-07 after the `0.43.5` migrations, where `card-grants-applied` answered "Every held card is fully applied wherever it is held".

## Why it is written in card terms

Lutan has said twice that analysis is by card, because roles are a transient grouping and will be rebuilt. "All four roles are covered" would be false again the next time a role is added or renamed. "No card grants nothing" survives that.

The paragraph also named `role-cards-coverage`. That check is superseded by `card-grants-applied` (it is kept only as transient context), so the sentence now names the current one and mentions the old one as superseded. The Admin-outside-the-card-system passage was not touched.

## The measurement is cited, not re-run

A worktree has no production credentials (`.env.deploy.production` is absent), and reading production is the planner's job. The sentence therefore carries its date and says it is a dated measurement, with the command to re-run before relying on it. `node scripts/check-cards-count.mjs` was run locally and is `ok` at 53 cards.

## The fault worth remembering: claimed, not landed

`docs/decisions/2026-11-07-card-count-truth.md` said the sentence "now reads that it passes". It did not; `CLAUDE.md` still said "does not pass yet" a day later. The script half of the same stream did land. CI, the test plan, the backlog tick and the usage comment were all green, because none of them reads prose against the file it describes. One grep caught it. That section is now marked superseded in place, not deleted.

## Sweep

Beyond `CLAUDE.md`, the only documents carrying the old wording are `docs/release-handover.md` and `docs/releases/2026-11-07-0-43-5.md`, left on purpose as dated records of what `CLAUDE.md` said then. `docs/release-procedure.md` names `role-cards-coverage` as an after-check, which does not describe it as failing, and is left.

## Backlog

`#k2v8m` ticked by this change. `#c5nt2` was closed by the card-count-truth work (the script half landed) but still read open; ticked here with that note.
