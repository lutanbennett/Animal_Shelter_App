# Drive deletes check the row count and go to the trash (2026-10-01)

**Row count, not an RPC.** Under RLS a refused `delete()` matches zero rows and
raises no error, so the attachment-delete actions (blood tests,
procedures, maintenance, projects, and the website gallery) went on to destroy the Drive file while the
record survived. They now use `.delete().eq(...).select("id")` and stop unless
exactly one row came back. A security-definer RPC like `delete_resident_photo`
would be sturdier but makes this schema-first (two batches); the hole was live
and the in-code check closes it today, so the RPC is left as a follow-up.

**Trash, not permanent delete.** Every Drive removal that follows a database
delete now calls `trashFile` (recoverable for 30 days) instead of `deleteFile`.
That turns "destroyed" into "recoverable" for the whole class, including sites
nobody has found. Left as permanent deletes on purpose: rolling back a file the
same request just uploaded (`api/*/attachments`, `api/projects/*/photos`), and
regenerating the deceased-archive summary files.

**Ordering in `deleteMaintenanceJob`.** It deleted the job's attachment rows
before learning the caller could not delete the job, so a volunteer could strip
a job's photo records. Attachments are polymorphic (`owner_type`/`owner_id`), so
no foreign-key cascade can do it; the job row is now deleted first and its
attachment rows only after that row count confirms the delete.

**Census of other `.delete()` calls.** The remaining ones either already check
`.select("id")` (projects folder delete, adoption updates, the maintenance job
itself) or delete only database rows with no Drive side effect (admin lookup
tables, assignees, recurring jobs and the like), where a silent zero-row refusal
shows as a missing change rather than data loss.
