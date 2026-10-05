# 2026-10-05 — The policies no conversion stream owned (`0145`, between R5's second and third conversions)

`docs/roles-and-permissions.md` §15, "Where the orphans landed", is the answer to the backlog item this
closes; this file is the reasoning behind it. Read `2026-10-04-perm-convert-medical.md` for the policy
shape and `2026-10-04-perm-convert-residents.md` for the mood: most of this slice was *findings in what was
there*.

## The deliverable is ownership, and a query

The item's complaint was not only that nine policies still named a role. It was that §15 did not say where
they land, so nobody would. So there are two halves:

1. **§15 now says, for every table that names `management` or `staff` in a policy, who converts it**: here
   (`0145`), or a named later stream with the reason it waits. `attachments` waits on the photo split;
   `group_origins` has no activity and gets none (below).
2. **`scripts/check-policy-role-names.mjs` is the query the item asked the last conversion to end on.** It
   asks `pg_policies` for *policy text* naming `'management'::app_role` or `'staff'::app_role`, which is the
   thing `perm-convert-medical`'s `management_%` prefix sweep missed. Default mode: every table with such a
   policy must be in the script's `OWNERS` map **and** named in §15, and every owned table must still have
   one (so a converted table cannot stay on the list, and a new role-named policy anywhere fails until
   someone says who converts it). `--final`: any row at all fails. The stream that empties `OWNERS` runs
   `--final`; `perm-drop-enum` waits for it.

After `0145`, **twenty-two tables and fifty policies** still name a role (the first run of the new script), against the item's
four-plus-nine that this migration takes. The item's list was right and incomplete: it did not know about
`frequency_rounds` (it is `management_rw_frequency_rounds`, missed because `0137` post-dates `0135`), the four
recurring *read* policies, or the maintenance and project tables. Those last are the reason for a new §15
row, `perm-convert-work`.

## What `0145` converts, and the three calls in it

Shape as `0135` / `0144`: one policy per command, `(select has_permission(…))`, no role named.

| Table | Activity |
|---|---|
| `enclosures`, `zones` | `facility.enclosures` (Read / Edit) |
| `group_origins` | `resident.register`, read only |
| `resident_diet_rounds`, `prescription_rounds` | `medical.diet`, `medical.prescriptions`; write only, parent visible |
| `frequency_rounds` | read `medical.prescriptions` Read; write `reference.types` |
| `item_unit_conversions` | write `stock.diets` (read was `0143`'s) |
| `stock_receipts`, `stock_counts` | role-named policies dropped; `0143`'s cell policies already answered |
| `recurring_jobs`, `recurring_job_assignees` | write `recurring.manage`; plus four read drops |

**1. `group_origins` gets no activity.** The brief offered "define one, or justify leaving it". Defined one
would be a catalogue entry, a `permission_activities` row, parity probes and a Settings row for a table with
two rows, no screen that edits it and no write from the app at all (the import script uses the service
role). The only *reads* are the intake form's origin picker and the resident archive, and both are
`resident.register` territory. So: read asks `resident.register`; writes are Admin's through
`admin_all_group_origins`. **That is acceptable until a screen edits origins**, and the day one does it adds
its activity then. Not `resident.record` Read for the read: the volunteer holds that cell and `0134` took
this table away from the volunteer on purpose.

**2. The rounds tables ask the cell and the parent, not `sees_all_clinical()`.** `0135`'s medical tables
need that scope function because a vet's Edit is `E°`. The rounds' policies read the *parent* row as the
caller (`exists (select 1 from resident_diets …)`), so the parent's own policy is what limits a vet to a
clinic, and the old role list included the vet. Cell plus visible-parent therefore answers every old caller
the same way, with no `vet_*` policy to add. `frequency_rounds` holds no resident data and has no parent,
so its read is the cell alone: that keeps the vet's read (`E°` still passes `has_permission()`), and does not
ask a clinic scope that has nothing to scope.

**3. `item_unit_conversions` writes ask `stock.diets`, `frequency_rounds` writes ask `reference.types`.**
The app asks exactly those (`src/app/management/units/actions.ts`, `src/app/admin/frequencies/actions.ts`),
and the database should ask what the screen does. For `frequency_rounds` that is a tightening: the old
policy let Management write it by hand; the cell is Admin's. The app writes it through
`reset_frequency_rounds()`, which is `security definer`, so nothing a screen does changes.

## What changed for anyone, and what did not

Nothing a button does. Four things a hand-built request could do, closed:

- **C1 closes.** Management and staff could insert, update and delete `enclosures` and `zones`; they now
  hold Read (the §4 cell) and only read. The parity check noticed: four STALE entries on the first run
  after the apply, which is what shows a closing is seen; the `known` entries are gone from
  `permission-probes.mjs` and §3 C1 says so.
- Management and staff can no longer write `group_origins`.
- **C8 is answered: `stock_receipts` has no update policy.** A wrong delivery is deleted and recorded again
  (`0096`; the app does only that), and `0143` had already written select / insert / delete only for the
  cell. The default cell (`stock.delivery` Yes) *would* allow an update, so this is a tightening of the
  default, the same kind as C5. If the Director ever wants to correct a receipt in place, that is a new
  activity, not a policy.
- Management can no longer write `frequency_rounds` by hand.

**A role's rights are otherwise unchanged**, and the parity count is the proof: **before 1,926 match / 34 known
tightenings / 0 mismatch; after 1,930 / 30 / 0** (245 probe runs, 1,960 answers, both times). The four that moved
are C1's. No other known entry changed. The probes read `has_permission()` for 110 of the 245; the rest
exercise the tables.

## Findings in what was there

- **A cell is not always enough.** `recurring.manage` alone gives a role *insert* on `recurring_jobs` and
  not update or delete: a statement with a `WHERE` must also read the row, and the read is `recurring.do_own`.
  Management and Admin hold both, so nobody is affected, but a configured role given `recurring.manage`
  without `do_own` would find it half working. The harness's `c_manage_only` role shows it (insert allowed,
  update and delete refused). The same shape is true of any table whose read asks a different cell from its
  write; today that is this one and `item_unit_conversions` (reads on three stock cells, writes on
  `stock.diets`), where every holder of `stock.diets` also holds a read cell.
- **`0141` and `0143` each added cell policies *beside* the role-named ones**, so `maintenance`,
  `maintenance_assignees`, `stock_*` and `recurring_*` answered correctly for the new roles while still
  naming the old ones. That was right for those streams, and it is why the stock and recurring drops here
  are one line each. `maintenance` and `maintenance_assignees` are the same, and are now `perm-convert-work`'s.
- **A staff-floor role with no cell gets nothing**, on all thirteen tables. That is the harness's `c_none`,
  and it is the direct proof that no role name is left in these tables' policies; it answers the handover
  `perm-convert-residents` left ("a configured role that borrows staff reaches these tables with no policy of
  its own") for the tables here.

## Evidence

`scripts/check-perm-convert-orphans.mjs`, against dev, one rolled-back transaction, each login's own JWT,
real rows and fixtures: **691 checks, 0 failed**. Thirteen tables x the principals (admin, management, staff,
volunteer, vet, no role, and ten configured roles on the staff floor holding one or two cells each, one holding
none) x read / update / insert / delete. Two sweeps: no policy on those tables names management or staff, and
every new policy wraps `has_permission()` in `(select …)`; 28 new policies.

**§10's measurement**, staff, residents list (it reads `enclosures` and `zones` through `resident_list_view`),
five runs, median of four, `measure-permission-baseline.mjs` with the old enclosure and zone policies
restored inside the rolled-back transaction for "before" (`MEASURE_PRE_SQL`, added to the script for this):

| login | query | before: exec ms (shared hit) | after: exec ms (shared hit) |
|---|---|---|---|
| staff | residents list (92 rows) | 4.51 (523) | 5.73 (839) |
| staff | medication list: placements | 4.05 (583) | 5.52 (899) |
| staff | medication list: prescriptions | 2.58 (249) | 2.61 (249) |
| volunteer | all three | 2.9 / 0.91 / 2.95 (380 / 61 / 440) | 2.90 / 0.94 / 2.93 (380 / 61 / 440) |

**This one is slower, and the honest reading is a fixed cost, not a gain.** The residents list and the
placements query read `enclosures` and `zones`, and each now plans one more init-plan: about 1.2 to 1.5 ms and
about 316 buffers more, for two tables, with no per-row term. The saving `0144` measured (the per-row
`current_user_role()`) is not there to pay for it, because the enclosure and zone tables are small (17 zones on dev) and their old policies'
per-row cost was already small. This is the same trade as `0144`'s
prescriptions query (an init-plan costs about 0.3 to 0.5 ms on a cold call) and is a cost of the pattern,
**not** a regression to fix here. What it does say: `has_permission()` is called about once per converted table in
a join, and a page that joins eight converted tables pays it eight times. Worth watching as Admin and Vet
convert and the bare `current_user_role()` calls disappear; whether a statement-level cache is needed is a
question for then, filed on the backlog branch. L9 (the live lookup, not the token hook) stands.

## What this does not cover

- No page was driven in a browser for a signed-in role. The manual list is in the test plan.
- `attachments` and the photo tables are unconverted by design (the photo split). `perm-convert-people`,
  `-stock-and-lists`, `-settings` and the new `-work` remain; `check-policy-role-names.mjs` lists them.
- Production apply is Lutan's, from the main checkout: `--dry-run`, then apply `0145`. No app code reads
  anything new, so there is no ordering constraint against a deploy.
