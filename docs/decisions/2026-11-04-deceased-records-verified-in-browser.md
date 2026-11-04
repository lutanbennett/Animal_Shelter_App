# 2026-11-04 — Deceased visit correction driven in a browser; bills hint

Driven on dev with a login holding exactly `medical_records` + `bills`, reached by clicking through (`next.router.push`).

- **Dead resident's visit (Canyon, R-0015):** the page shows the closed-record note, bill control and *Correct cost and notes*. The edit page offers only cost, notes and the bill control; saving 1234.50 plus a note persisted on reload.
- **Database refusal proven:** an UPDATE of `clinic_visits` touching a third column (`reason`) on that visit is refused with `enforce_deceased_lock()` ("This resident is deceased"), so `0310`'s predicate holds. Rolled back, nothing kept.
- **`src/app/bills/actions.ts`:** it writes `clinic_visits.cost` only (line ~133), which is the one shape 0310 opens. A bill matched to a dead resident's visit was not pressed: none was among the likely matches of the one waiting bill. Left as a manual row.
- **Not driven:** a login without the visit card (rows in the test plan); the Thai wording.
- **Hint fix:** `bills.page.addHint` no longer says each file "becomes a card below"; it says to tap a picture. EN and TH (Thai unreviewed).
- **Dev data left:** that visit now carries cost 1234.50 and a test note (dev data is disposable).
