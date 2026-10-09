# The migration lint requires a new view's write grants revoked; a replace is exempt

2026-10-09, `grants-lint-and-refused-row`. Follows `docs/decisions/2026-10-07-view-write-grants.md` (`0160`).

## What the rule is

`scripts/check-migration-grants.mjs` now fails a migration above `0160` that creates a view in
`public` without, in the same file,

    revoke insert, update, delete, truncate, references, trigger on <view> from authenticated, anon;

`revoke all on <view> from …` naming both roles counts, because that is how `0161` and `0166` write
it. The project's default privileges hand every signed-in login those six on any new object, and
Postgres cannot set default privileges for views apart from tables (which need DML), so the lint is
the only place to stop it.

## Why the floor is 0160

`0160` revoked the grants from every view that had them, measured on dev. Every file after it
that creates a view already revokes by hand, so the rule passes on `main` without touching history,
the same way `0077` is the floor for the grant rule.

## Why `create or replace` of an existing view is exempt

A replace keeps the view's ACL. `0166` replaces `immunization_next_due` and restates only the
select; the write grants it would have had were revoked by `0160` and stay revoked. Requiring the
revoke on every replace would have failed an applied file that cannot be edited, and the finding
would have been false. The exemption mirrors the one the same script already makes for functions:
it holds only when an earlier migration created the view **and** this file does not drop it first.
A drop-then-create gets the defaults again and is flagged.

The exemption leans on one fact: every view that existed at `0160` was clean after it, and every
view created since has passed this rule. If a view were ever created outside a migration, a later
replace of it would pass unchecked; that is not how this project changes schema.

## Not done

The volunteer-refusal half of this stream was not built. `assistant_actions`' insert policy (`0150`)
asks `assistant.record`, which a volunteer does not hold, and the audit row is written under the
caller's session, so the row would be refused by the database. Widening that policy is Lutan's
decision; he chose (2026-10-09) to leave the item open with the finding written on it.
