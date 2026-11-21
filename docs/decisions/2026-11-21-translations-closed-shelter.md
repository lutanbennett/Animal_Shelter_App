# `runTranslations` and a closed shelter (#fu86i), 2026-11-21

The fifth job the `#swout` guard found (`#clsjb`, `2026-11-21-closed-shelter-jobs.md`, ruled on four others). It was exempted
with the reason "NOT ESTABLISHED", which passes the check for ever. This ruling replaces it.

## The three answers, from reading

1. **Does a closed shelter have untranslated drafts?** Yes, and archiving does not stop them being created or left. `translations`
   carries `shelter_id` (`0396`, not null since `0397`); `queue_translations()` inserts a `pending` row whenever a translatable
   field is edited. Archiving touches only `shelters.archived_at` (`0428`), so any row pending at the moment of closing stays pending.
2. **What does it cost?** `pickEngine` (`worker/translate-engines.mjs`) uses the Workers AI binding by default (or Ollama if set):
   a metered quota on the shared account, not money per shelter and not nothing. The run is bounded (2 rows a run, 20 reviewed
   drafts a day) but it is spent for a shelter nobody can reach. A second cost: the run reads the 50 *oldest* pending rows, so a
   closed shelter's stale backlog sits at the front and can **starve an open shelter's rows**.
3. **Does anything read a translation for a closed shelter?** No. `0428` closes both doors for people, and the public views are
   scoped by shelter; a draft for a closed shelter is read by nobody until it reopens.

## Ruling: **skip a closed shelter**

Two readings were weighed.

- **Keep going, "finish the record in case it reopens" (rejected).** It is a real argument, but nothing is lost by waiting: the
  rows stay `pending` and resume on reopening, exactly as `merch-supplier-emails` parts stay `new`. Against it: quota is spent
  now for no reader, and the starvation above is a live fault, not a hypothetical.
- **Skip (taken).** The same verdict as `label-drafts` (`#clsjb`: "a draft for a shelter nobody can reach is wasted work"). It is
  not the retention class (`report-photo-retention`), where skipping would keep expired data longer than promised: a pending
  translation is not data with a retention promise.

## What changed

- `worker/translations.mjs`, `runTranslations`: reads `shelters?archived_at=not.is.null` and adds
  `shelter_id=not.in.(<closed ids>)` to the pending read. The filter is in the query, not after it, so the 50-row window holds
  only open shelters' rows. No closed shelter means no filter added.
- `worker/index.mjs`: the "NOT ESTABLISHED" exemption comment is removed; the guard now finds nothing to exempt.
- `worker/translations.test.mjs`: a test that the closed shelters are read and the pending read excludes them.

## Guard output (`node scripts/check-scheduled-jobs.mjs`)

`runTranslations: ACTS OUTSIDE THE DATABASE (calls a translation engine); skips a closed shelter` and the line
`ok: every job that acts outside the database skips a closed shelter or records why not`. The other four verdicts read as
`#clsjb` left them.

## Not exercised

Only at unit level through the injectable `fetchImpl`: the query that goes out and that closed ids are read. Not run on the
Worker, and the PostgREST `not.in` filter on a uuid column was not run against the live database.
