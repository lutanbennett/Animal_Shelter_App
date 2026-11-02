# Clinic visit booking uses the rows the RPC already returns (no migration)

**2026-11-02, stream `clinic-visit-rpc-ids`.** The backlog item said the RPC returns no ids. It does:
`schedule_bulk_appointments` has been `returns setof clinic_visits` (every column, `id` included) since
`0172_clinics_and_doctors.sql`, and no later migration redefines it. The booking action destructured only
`error` and threw the rows away, then re-found them by resident, clinic, time and `created_at`.

- **No `0301`.** A migration would have rebuilt a function that already does the job. Not security
  definer, so the permission behaviour is untouched. `0301` stays free.
- **Booking action** (`src/app/clinic-visits/new/actions.ts`) now takes `data` from the RPC and links tags
  on each returned row. The four-part re-find, `created_at` leg included, is deleted. This is one stream
  because the caller change is the whole fix.
- **Second caller found:** `src/app/assistant/actions.ts` read `data[0]` as if it were an id string, but
  it is a row, so its `id` was always `""` and its calendar sync never ran. Now `data[0]?.id`. Fixed
  because it is one line on the same RPC and the brief asked for a named handful to be fixed.
- **Proof on dev** (rollback harness): two identical bookings, same resident, clinic and time, returned
  two distinct ids. `check-doctors.mjs` section H already asserted the RPC returns two rows for
  `array[v_res, v_res]`.
