# Bills gets its own manual section (2026-11-11)

Lutan, on Test: a login holding the Bills card opened the manual and saw nothing about bills. Shown a first proposal that left half the topic under deliveries, he said: *"That is the wrong place as we have more than just deliveries in bills."*

**Cause.** The Bills topic was keyed on `stock.delivery`, which the Bills card does not grant, and sat in Management among the stock topics.

**The four routes.** A bill reaches the shelter with a delivery, at a clinic visit, against a maintenance job, or as a utility bill. No one of them owns the topic.

**Chosen.** A top-level `bills` section (icon Receipt, as on the Home tile), holding: `bills` (keyed `bills.general`), a new `bills-utility` (keyed `bills.utilities`, so each activity the card grants has a topic) and `bill-sites` (already `bills.sites`, moved because it is Bills settings). `maintenance-bills` stays in Maintenance: it teaches work done on a job page and is keyed `maintenance.bills`, which the Bills card grants, so a Bills-only login sees it too. *Recording a delivery* now points to the Bills section.

**Rejected.** Splitting the topic and leaving the delivery route under `stock.delivery` (keeps bills filed under deliveries); hand-writing a `cards:` list (the activity key derives it).

**Measured.** A login holding exactly `bills` is shown 17 topics, three of them about bills. The acceptance matrix needed its rows re-keyed to `bills.general` and a row for the utility topic.
