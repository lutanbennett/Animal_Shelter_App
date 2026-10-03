# 2026-10-03 — Who may write a blood test: staff and management, nobody else new

**Context.** The first role dry run (staff, 2026-10-03) found F-01: Resident →
Blood Tests → Log blood test showed the form, the "+" and the visit's link, and
every save answered "You don't have permission to do that". `0001` gave staff
only `staff_read_blood_tests`; `0020` noted that row creation "stays gated to
vet/admin" as "a deliberate read of the Section 6 role table … an assumption to
confirm", and it was never confirmed. The manual has since said otherwise
("Logging a blood test", roles admin, management, staff, vet), and `procedures`
had the identical gap closed in `0031`. Blood tests simply never got the same
fix.

**What `0131` grants.** Exactly `0031`'s pair, same names and shape, for the two
roles the manual names:

| Role | insert | update | delete |
|---|---|---|---|
| staff | **new** | **new** | no |
| management | **new** | **new** | no |
| vet | own clinic (0110, unchanged) | own clinic (0110) | own clinic (0110) |
| admin | all | all | all |
| volunteer | — | — | — |

Management has its own `management_*` policies, written out by hand. `0039` makes a
management twin of every `staff_*` policy that exists when it runs; `0031` (staff
write on procedures) came before it, so procedures got twins, and blood tests had
no staff write to copy, so they did not. Hence the finding that "no management
policy was seen either": it was true, and management could not save a blood test
either.

**What it deliberately does not grant, and why.**

- **Vet — nothing.** The vet already has insert, update and delete through
  `0110`, and they are narrower than anything given to staff: only on a visit at
  the vet's own clinic, and only for residents that clinic holds a record for
  (`0108`). The brief singled the vet out as the role where a generous policy is
  most likely to be wrong, and the answer was to leave it alone. Widening it to
  "any blood test" would have undone `0110`.
- **Delete — nobody new.** The app has no way to delete a blood test, and the
  manual's "Removing a medical record" lists weight, prescriptions, vet visits
  and immunizations, not blood tests. Staff got no delete on `procedures`
  either.
- **Archive — no policy needed.** `0124` added `archived_at` to `weight`,
  `prescriptions`, `vet_appointments` and `immunization_records`; `blood_tests`
  is not in that set, so there is no archive path that could fail the way the
  insert did. If blood tests ever join it, that migration needs its own update
  policy check — the new `staff_update_blood_tests` would already cover an
  archive-by-update, so it would work, but nothing tests it yet.
- **Volunteer — nothing.** Read only, as the walkthrough's Pass 6 says: every
  medical write is refused. A volunteer can still attach a file to an existing
  blood test through `record_attachment`, which is older and deliberate
  (`docs/decisions.md`, "volunteers may write attachments/photos, any owner type", in the blood-test attachments entry).
- **Update is granted even though the app has no edit screen for a blood test
  yet.** Following `0031` (staff can correct a procedure) and the brief. It is
  the narrow end of what a "Log blood test" correction would need, and costs
  nothing a staff member could not already do by logging a new row. Revisit if
  that bothers anyone; removing it is one `drop policy`.

**`scripts/check-role-write-policies.mjs` — what it covers and what it does not.**
A general check was tried and is partly a project, so this is a bounded one:

- *Covers:* (1) a hand-kept list of writes the app offers each role (blood
  tests, procedures, prescriptions, immunizations, vet visits, weight, diets;
  seeded from the manual's activity topics), each of which must have a
  permissive policy naming that role for that command; (2) for **every** table,
  whatever staff can do, management can (`0039`'s promise), with no list to
  forget; (3) a rolled-back transaction using each role's own JWT on real rows —
  staff and management insert, update and attach a file, cannot delete, and a
  volunteer can only read; (4) an advisory list of tables staff can read and
  nothing else, so a new one gets seen.
- *Does not cover:* a table the app writes that is **not** in the list. Finding
  those mechanically means reading every `.from(t).insert(…)` chain in `src/`
  and knowing which roles reach the page that makes it; a grep for the call
  catches only some chains and says nothing about roles. The list is therefore
  maintained by hand, next to the manual — add a row when you add a form. It is
  also not in `npm run lint`: it talks to the dev database, so (like
  `check-vet-own-clinic-writes.mjs`) it is run by whoever touches a policy, and
  it reads the **live** schema rather than replaying a file.
- Roles are matched from the `'<role>'::app_role` text inside each policy's
  expression. Every policy in this schema is written that way; one that tested
  the role differently would read as missing, and the script would need teaching.

**Verified.** Before the migration the new check fails on blood tests (both the
list and the real-row harness). After it, it passes, and a disposable staff
login on dev saved a blood test through the real form (row present, redirected
to the Blood Tests tab). The file half is proved at the database gate
(`record_attachment` as staff and management); attaching an actual file through
the browser's picker is left for a person (see the test plan).

**Migration number.** `docs/pi-failover.md` had `0131` "kept free" for its
option 1. A role-blocking bug outranks an only-if, so this took it and the paper
now says the failover change takes the next free number.
