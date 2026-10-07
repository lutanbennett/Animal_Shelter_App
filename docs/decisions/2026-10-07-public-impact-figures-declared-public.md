# `public_impact_figures` is declared public, not revoked (2026-10-07)

`0156_impact_baselines.sql` created the view `public_impact_figures` and
granted `select` on it to `anon`. `scripts/check-public-views.mjs` keeps a
hardcoded `PUBLIC_VIEWS` allowlist of what `anon` is permitted to read and
fails if anything else answers it, so from the moment 0156 was applied to dev
the `public-views` job went red.

**Two opposite fixes were available, and the choice matters.** The check says
"an object anon can read is not on the approved list". That is either:

1. a **leak** — the grant was a mistake, and the fix is to revoke it; or
2. a **missing declaration** — the grant was deliberate, and the fix is to add
   the object to the list.

A red `public-views` invites the first reading, and taking it would have
silently broken the feature 0156 exists for. This is case 2, and the evidence
was checked rather than assumed:

- 0156's own header states the intent: *"The public figure: anon and
  signed-in, through the view only, which exposes label, baseline and totals
  (the same things the public page prints) and not `set_by`."*
- The grant is explicit and narrow (`grant select on public_impact_figures to
  anon, authenticated`), with `insert`/`update`/`delete` revoked from both.
- The underlying table is not reachable: `0156` revokes all on
  `impact_baselines` from `anon` and grants only to `authenticated` and
  `service_role`, behind `has_permission('website.content')` policies.
- The view is owner-run, like `public_shelter_stats`, and selects no `set_by`,
  so it cannot leak which login last edited a figure.
- The check's own probes confirm the shape: `public_impact_figures` carries no
  amount column, and `audit_log` and every base table still refuse `anon`.

So the view is declared, with a comment naming 0156 and the grant line.

## Why this broke every branch, which is the part worth remembering

`check-public-views.mjs` deliberately enumerates the **live database** with the
service key — "so an object added later is checked without anyone adding it
here". The consequence is that the job's result does not depend on the branch
it runs on. Once 0156 was applied to dev, the check failed on 0156's own PR,
on the `main` push that merged it, and on unrelated PRs in the same minute —
six runs and seven failure emails inside ten minutes, with each stream seeing
a red check on work that had nothing to do with it.

**So a migration that grants anything to `anon` must update that allowlist in
the same PR.** It is not the migration author's own CI that pays for the
omission; it is everyone else's, and the failure is indistinguishable from a
flaky check. Unlike `audit` (`continue-on-error: true`, see the CLAUDE.md
section added the same day), `public-views` is **not** suppressed — it fails
the run, which is correct for a check about who can read the database, and is
exactly why the omission is expensive.

The schema half of this feature is merged, so recording that rule beside the
migration guidance belongs to whoever builds the app half; it is deliberately
not bundled into this one-line fix.
