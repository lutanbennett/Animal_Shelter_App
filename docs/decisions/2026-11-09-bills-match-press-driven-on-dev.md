# The /bills match press against a dead resident's visit: driven on dev (`#314hq`)

Stream `bills-match-walkthrough`, 2026-11-09. No code change, no migration.

## Step zero
Not already verified: `docs/decisions/2026-11-05-deceased-visit-app-half.md` deliverable 5 says *"Not driven"* and
`2026-11-06-deceased-record-widen-app.md` does not cover the match. The code (`matchBill`, `mayMatch` in
`src/app/bills/actions.ts`) is long since written; the gap was only the press.

## What was driven (dev, `qxkmhwybjggxvsfxsxbd`)
- A resident recorded deceased (active placement in Lifecycle/Deceased, `resident_current_state.is_deceased = true`), with a
  clinic visit whose cost was null, and an unmatched bill card (250, no photos) in `bills_inbox`. Seeded by a scratch script
  with the service role; the death placement went in last, because a visit cannot be inserted for a dead resident.
- Login: `dev-signin.mjs --cards medical_records` (holds `medical.visits` at edit and nothing for bills). `/bills` was reached
  by a client-side navigation (`next.router.push`), `requestAnimationFrame` confirmed firing.
- The card opened, listed the dead resident's visit under *Likely matches*, and **pressing it succeeded**: the page went to
  "0 bills waiting". The database afterwards: `clinic_visits.cost = 250`, status and reason unchanged, the card gone.

## The three rules `0310` requires, observed
1. **Named columns only.** The press changed `cost` and nothing else. A direct update of `reason` on the same visit
   was refused ("This resident is deceased — their record is read-only").
2. **INSERT and DELETE stay refused.** A new visit for the dead resident and a delete of the visit were both refused with
   the same message; the visit survived.
3. **Nothing keyed by a role.** The login was a disposable role holding exactly one card; `mayMatch` asks
   `can(perms, "medical.visits", "edit")` and was the only thing consulted.

## Is anything left? No production press is needed
Production was read by the planner on 2026-11-09 at 06:29Z: 344 applied, 0 pending, so `0310` and `0320` are live. Nothing in
the press is production-specific (same function, same trigger), so deliverable 3 (a walkthrough for Lutan) is void and was
not prepared. The item's warning about colliding with `#k3mqp`'s apply is stale: that apply has happened.

## The gating question (deliverable 4): the control is already gated
`page.tsx` fetches clinic-visit suggestions only when `can(perms, "medical.visits", "edit")` (`forVisits`), stock receipts
only on `stock.delivery`, jobs only on `maintenance.bills`. `BillsInbox` draws a Match button only for a suggestion it was
given, so a login without the activity gets no button. `mayMatch` asks the same activity, read from the same place. The
"record a new delivery" link is gated on `canDeliver` (= `stock.delivery`). **No fix needed; no file changed.**
Not tested in the browser: the negative case (a login holding bills but not visit edit). It follows from the code above.

## Found, not fixed
None. (Test rows left on dev, per the dev-test-data rule: resident "ZZ Match Walkthrough (dev test)".)
