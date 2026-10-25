---
card: dashboard
walked: 2026-10-25, driven in a browser on the test system as a login holding only this card (dev: 265 applied, 0 pending; read back first: 1 card, 2 permission cells, the dashboard at edit and the cashflow read)
---

## Purpose

The manager's one-page picture of the shelter: how many animals are in care today, how many are ready for adoption, what happened this month (intakes, adoptions, deaths, vet visits, spending, procedures, vaccinations) and a twelve-month chart. It also promises a read of the Cashflow page (what the shelter expects to spend). It changes nothing.

## Gives access to

### Pages

- **The Management dashboard.** It opens. It has three parts: "Right now" (eleven tiles), "this month at a glance" (with a previous and next month link, Copy as text and Print) and "Last 12 months" (a chart, month by month or cumulative).
- **The Management menu entry**, which opens a page holding one tile, the Dashboard. A login holding only this card does not need the Management landing card to get there.
- Nothing else. The Cashflow page and its Fixed outgoings page are **refused** (see restrictions).

### Tables

- **The report figures**, read only. Nothing on the page can be edited, and no form, box or Save button is offered anywhere on it.

### Forms

- None.

## Major restrictions

- **Every figure is wrong, and nothing says so.** With only this card the page opens and shows **0 in care, 0 in the shelter, 0 in hospital, 0 fostered, 0 ready for adoption, 0 clinic visits in the next 7 days and 0 open maintenance jobs**, and "None" under every line of the month. When this was looked at the test system held **102 residents, 112 clinic visits and 14 maintenance jobs** (counted directly). The card reads the report but not the animals, visits or jobs the report is made of, so it counts nothing and does not tell the reader. This is the same fault the Enclosures card has: a page that looks like access and is wrong in the thing it is for.
- **So the card cannot leak.** Because it reads none of the underlying data, no figure on the page amounts to information the card cannot otherwise reach. This was the question to answer, and the answer is no: the failure is the opposite one, it shows too little and calls that the truth.
- **The tiles lead to doors that are shut.** "In care" and "In care, no microchip" open the Residents list, which reads "0 residents"; "Clinic visits next 7 days" and "Open maintenance jobs" are refused ("You don't have access to this page"). "Ready for adoption" opens the public adoption page, which anyone can see.
- **The Cashflow read is not usable.** The card holds a read of Cashflow, yet the Cashflow page and the Fixed outgoings page are both refused. The pages ask for the right to change, which a read does not give. So half of what the card promises does nothing.
- **Cannot open** the Medication list, Operations, Vet visits or Maintenance.
- **The Residents entry is drawn in the menu** although this card holds nothing about residents; it opens as an empty list.

## Recommendation

- **Increase (needed for the card to be true):** let the card read the counts it reports, as a shelter-wide total that does not open the resident record, or let the page count without it. As it stands the card is confidently wrong. This is one decision shared with Enclosures and the other cards that cannot read residents (see the access fault log).
- **Fix or remove (small):** either let the Cashflow page open for a read, or take the Cashflow read off this card so it does not promise what it cannot give.
- **Decrease (small):** hide the Residents menu entry and the tiles that lead to refused pages.
