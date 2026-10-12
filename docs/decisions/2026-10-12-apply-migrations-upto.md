# apply-migrations: `--upto`, and a dry-run that says when it is only dependent

**`--upto <file>`.** Applies pending files in order and stops after the named one, then lists
what it left by name. It refuses a name that is already applied, not pending, or absent, and
refuses to combine with `--status`, `--drift` or `--baseline`. A pending file *behind*
an unnamed one is not skipped: earlier pending files run first, because there is no such thing
as applying out of order, and the run says how many files it is about to apply. The
`origin/main` guard is untouched; `--upto` is the sanctioned way to express "apply `0178`-`0180`,
deploy, then `0181`" (the 2026-10-11 release).

**`--drift` / `--status`** still report the remainder as pending (exit 1 for drift, as before),
but now say that is expected if a release staged files with `--upto`, and that it is a fault
only if nobody meant to leave them.

**Dry-run: option 2, detect and say so, not one transaction.** One transaction across all
pending files is not what a real apply does (a real apply commits each file before the next),
and it fails on a new enum value used in the transaction that added it, so it would trade one
false red for another. Instead the per-file `begin … rollback` is kept, and when a file fails
after earlier pending files passed, it is retried once with those files in the same
transaction (still rolled back). If it passes there, the message says it is *not a fault in the
file*, it depends on an earlier pending one, and a real apply is expected to work. If it still
fails, the message says so and names the enum case. The retry is diagnosis only and never commits.

**Verified:** syntax, argument refusals, and a not-in-folder refusal against dev. Dev had
nothing pending, so the apply and dry-run-retry paths were not exercised against a database.
