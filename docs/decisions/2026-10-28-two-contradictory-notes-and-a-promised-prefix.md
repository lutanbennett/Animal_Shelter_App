# Two defects #1047 left behind, and they are the same defect twice

**2026-10-28.** #1047 made the analysis instruments ask a card question — good work, and the
card-shaped `check-menu-coverage` now reports the number nobody had: **27 pages that no single card
both opens and reaches**. It left two things behind, and they share a shape worth naming.

## 1. `0.40.10` shipped two notes that contradict each other

The release contained both:

> *"…A login that holds Add Medical Photos can still file photos into the Medical folder but **can no
> longer look at them** afterwards."*

and

> *"If your cards include Add medical photos, you **can now look at** the photos in a resident's
> Medical folder as well as add them."*

The first was true of `0276` alone. `0279` falsified it, and `0279` shipped **in this same release**.
A shelter admin opening `/releases` saw both sentences in the same list.

**Fixed by removing the false clause**, not by rewording both. The rest of that note — that viewing the
Medical folder needs a medical card — is still true and is untouched. The note beside it states the
position for `add_medical_photos`, so the clause was redundant as well as wrong.

## 2. The *TRANSIENT CONTEXT* prefix the decision file promised was never written

`docs/decisions/2026-10-28-instruments-ask-a-card-question.md` says:

> *"The role-keyed checks stay (they answer 'who holds what today') with a TRANSIENT CONTEXT prefix."*

`grep -c "TRANSIENT" scripts/lib/readonly-checks.mjs scripts/check-production.mjs` returned **0 and
0**. So `fault-residents-lifecycle` still printed *"Which roles hold the Residents card or a placement
cell but not facility.enclosures at read?"* with nothing marking it as context rather than a finding —
**which is precisely the output that gets quoted as a measurement**, and the reason Lutan had to give
the cards-not-roles instruction three times in one day.

Four checks now carry it, with two different reasons:

- **`role-cards`, `role-cells`** — *"TRANSIENT CONTEXT, not a finding (who holds what TODAY; roles are a
  transient grouping of cards, so do not quote this as a measurement)"*.
- **`fault-residents-lifecycle`, `fault-clinic-visit-save`** — the same, **plus** *"SUPERSEDED as a fault
  check by `card-lifecycle-enclosures` / `card-clinic-visit-save`"*, naming the card-shaped check that
  replaced each. A reader who lands on the old one needs pointing at the new one, not just warning off.

## What the two have in common, which is the part worth keeping

**Both are a decision file describing the intended end state rather than what shipped.** #1047 *noticed*
the contradictory notes and wrote *"is now superseded by the new line beside it"* — which is true as an
observation and did nothing for the user reading `/releases`. It *intended* the prefix and wrote it down
as though done.

**A contradiction recorded in a decision file is still live in the product.** Writing it down is not
fixing it, and a decision file is the one place where that mistake is hardest to see, because the
sentence reads like a completed action.

**This is the same family as the three other faults of the same day**: a policy read without its grants,
a check quoted without its query, a release-note carrier nominated in prose four times and never picked
up. **In each case the record was right and the thing itself was not.** The cheap guard is to re-read
the artifact rather than the note about it — one grep, here, for a word the decision file claimed was
present.

## Three checks deliberately left unlabelled

`doctor-cells`, `role-cards-coverage` and `cards-union` are keyed on roles, and are **not** labelled.
Their subject is the card system's own integrity — *does any held card do nothing*, *are a role's cells
exactly the union of its cards' grants* — rather than who holds what today. Calling those transient
context would misdescribe them: a role is the unit they happen to iterate, not the thing they are about.

**Stated here and in the test plan so it can be objected to in one line rather than discovered later.**

## Not established

Whether the two superseded role-shaped fault checks should be **deleted** rather than labelled. Keeping
them leaves a role-shaped number quotable, which is the risk; deleting them loses the "who is affected
today" view, which Lutan's rule explicitly still allows. **Labelling is the reversible option and was
chosen for that reason**, not because it is known to be right. If a role figure from either one turns up
in a brief or a band again, that is the signal to delete them.
