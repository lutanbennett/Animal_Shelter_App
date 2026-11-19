# Restoring one shelter: build nothing yet, and what would change that (#shres, establish half)

2026-11-20. Written by reading and counting only. No restore tool, no migration, no script edited.

## For Lutan, in plain English

**Don't build the one-shelter restore yet.** Most mistakes a shelter makes are already fixable without going back to a
backup: deleted records are mostly archived rather than destroyed, and every edit is logged with what it looked like
before, with an Undo button for the newest change. A restore only earns its cost for damage across many records at once
(a bad bulk import, a shelter wiping lots of work), and nobody has asked for that yet. **Do not make separate nightly
backups per shelter** — a second nightly job is a second thing that can quietly stop working. If a shelter ever does
need a restore, the cheap first step is already possible: last night's backup can be opened in a scratch copy and that
shelter's rows read out and fixed by hand, with no risk to anyone else. **Building the "put it all back" tool is about
8 to 12 working days** and is worth it only if that bulk-damage case actually happens, or a shelter asks for it in
their contract.

## 1. What I read, and what each does (so nobody reads them twice)

- `scripts/backup.mjs` — `pg_dump -Fc` of `public`, `private`, `auth`: one encrypted file, every shelter. Premise confirmed.
- `scripts/restore-rehearsal.mjs` — builds a throwaway PostgreSQL under `%TEMP%`, decrypts a dump in memory into it, and
  checks counts, objects and migrations. Server-side stand-ins only; no Supabase.
- `scripts/shelter-export.mjs` — reads one shelter's rows from a live database over the Management API into an encrypted
  data-only file; `--prove` reloads into an empty scratch database and checks counts, "no other shelter's row" and FKs.
- `scripts/lib/shelter-export.mjs` (95 lines) — the pure filter: `planTables` (scoped / all / own-row / none), `loadOrder`
  (parents first; cycles last), `selectSql`, `insertSql`. Insert-only, into an empty database.
- `docs/decisions/2026-11-18-export-proof-catalogue-rebuild.md` — the proof's empty database has no triggers, defaults or
  RLS; so it does not show triggers leave rows unchanged. Says a live load should use `session_replication_role = replica`.
- `docs/decisions/2026-10-02-audit-undo.md` and `audit_log` — see section 2.

## 2. Can the damage be undone instead? Mostly yes, with two honest gaps

Measured on the dev database (130 public tables), 2026-11-20:

- **Soft delete exists on 15 shelter-owned tables** (`archived_at`): the medical record types and contacts are archived in
  the app, not deleted (Restore button on each).
- **Hard deletes mostly cannot happen.** 111 of the 114 foreign keys into `shelters` are `NO ACTION`; between tables,
  249 public-to-public keys mean a resident cannot be deleted while weights, diets, placements and so on point at it.
- **Audit trail: 54 tables carry the audit trigger** (`audit_log`: id, table, row, op, actor, old_row, new_row, at,
  shelter_id). Dev holds 1,803 entries over 42 tables, 443 with a before-image.
- **Undo exists** on `/admin/recent-changes` for the newest change to a resident, contact, prescription, visit, weight or
  vaccination (edits and deletes), admin only.

**The lean in the item holds for single-record mistakes. It does not cover:** (1) **bulk damage** — Undo is one change at a
time, newest first, and refuses once something newer exists; (2) **residents deleted** — deliberately not undoable (the
before-image lacks chip fields and dependants would have to return first), and **files** (attachments, photos) are
excluded by design. I did not measure how often shelters actually do either; that is not established. **So: ask of every
request "one record or many?"** One record: Undo or Restore. Many records: a restore, last resort.

A cheaper middle step than the full tool would be a bulk undo from `audit_log` (replay a time window's old_row). It is
not priced here and has the same live-write risks as the restore, so I do not recommend it ahead of the restore.

## 3. Sizing the import direction (counted, not estimated)

- **114 shelter-owned tables** to delete and reinsert; 16 unscoped (section 4). Of the 249 FKs between public tables the
  114 shelter-owned tables form **7 dependency levels (0 to 6)**, sizes 49 / 19 / 22 / 12 / 7 / 3 / 2. **No cycles.**
  3 self-referencing tables (`project_folders`, `recurring_jobs`, `bill_kinds`) need a within-table ordering.
- **Delete runs levels 6 → 0, load 0 → 6**; the export's `loadOrder` already computes this.
- Identity columns: 6 tables. Sequences: 9, and **no `nextval` defaults** in `public`, so sequences are a small matter.
- **74 tables reference `auth.users`.** Data-only was decided 2026-11-17 for the export (logins not carried). A restore
  into a live database must keep current logins, so any restored row pointing at a user created or removed since the
  backup needs a rule (keep, null or refuse). This is the least-understood part.
- **Triggers fire on reinsert** (54 tables carry the audit trigger alone) (audit, and any others) unless replica role is used; whether the role the tool connects
  as may set `session_replication_role` on Supabase was **not checked**. Without it, a load writes audit rows and runs
  defaults; with it, FK checks are skipped and must be proved afterwards.
- **Cross-shelter FKs** (a row of shelter A pointing at a row of shelter B) were **not checked**; if any exist the delete
  step could be refused or, worse, orphan them.

**Price: 8 to 12 days** — roughly 2 for the delete/reinsert core in level order, 2 for the auth-user and trigger
rules, 3 to 4 for the before/after per-table count proof against a live shape (the export's proof is the template but its
database has no triggers), 1 to 2 for the scratch-first step plus the deliberate "write to live" gate, and the rest for
failure-case rehearsals on a copy of dev with two shelters. The upper end is if triggers or cross-shelter FKs bite.

## 4. What is shared and must never be rolled back (a list)

Unscoped tables on dev today (16). The registry lists 13; **3 are missing from it** (see finding):

1. `shelters` — the shelter's own row only if the restore needs it; never another shelter's.
2. `schema_migrations` — which migrations ran; reverting it makes the app think it is behind.
3. `permission_activities`, 4. `card_features`, 5. `card_grants`, 6. `card_includes`, 7. `features` — the card catalogue.
8. `translatable_fields`, 9. `translatable_labels` — schema metadata.
10. `status_alert_checks`, 11. `status_alert_runs`, 12. `status_alert_test_requests`, 13. `scheduled_writer_runs` — monitoring.
14. `product_admins`, 15. `product_admin_lookups`, 16. `product_admin_login_grants` — installation-level, not shelter-owned.

Also never restored: the **`auth` schema** (logins, sessions), the **`private` schema** (not examined here), **Drive and
storage files**, and **`audit_log`** — it is shelter-scoped, but rolling it back would erase the record that the
restore itself happened and what the shelter did after the backup. It should be kept and appended to.

**Finding (not fixed; `docs/` and `scripts/` are other streams' this batch):** `product_admins`, `product_admin_lookups`
and `product_admin_login_grants` are unscoped on dev but are in neither `docs/tenancy-shared-tables-registry.json`
nor `exportTreatment` on `main`. By reading `planTables`, `shelter-export.mjs` would stop with "no shelter_id and no
exportTreatment" for each. I read the code rather than running it, so this is a prediction; it should be checked and
the three recorded (`none`) by whoever owns the registry.

## 5. A per-shelter dated copy

**Agree with the item: do not invent a second backup format.** If one is ever wanted, run the existing export per shelter
on a schedule. It costs no money (the Management API and age are free-tier; it runs on the existing Pi), reuses the one
filter, and is already encrypted and proven isolated. Its risk is the item's own: a second job that can stop silently.
It would need the same alarm the nightly backup has (not examined here) before it is trusted. **Not recommended now**: it
buys a faster start for a restore that is not yet being built.

## 6. Does the chain's first link run on this machine?

**Yes, the server programs are present:** PostgreSQL 17.11 `initdb`, `postgres`, `pg_ctl`, `pg_dump`, `pg_restore` under
the per-user install folder where `backup.mjs` looks. **I did not run the rehearsal** — it needs a real dump, and the real
backups are out of bounds for this stream — **and I did not run `--prove`**, because it needs a shelter key and the only
ones I may not use are `lanna` and `test-shelter-2`, and `rehearsal-…` belongs to another stream. So "present and
right version" is established; "the rehearsal passes here today" is not.

## 7. What would change the answer

Build the restore (as a scratch-first tool, never writing to live without a deliberate step) if: a shelter suffers bulk
damage that Undo and archive cannot reach; a shelter or contract asks for a point-in-time guarantee; or a second
production shelter is live and an all-shelter rollback is no longer acceptable.

## Not established

How often shelters delete or damage records in bulk; whether any foreign key crosses shelters; whether the connecting
role can set `session_replication_role`; contents of the `private` schema; whether the rehearsal passes on this
machine today; whether the nightly backup's alarm would cover a second job. Measurements are from the **dev**
database only; production was not touched.
