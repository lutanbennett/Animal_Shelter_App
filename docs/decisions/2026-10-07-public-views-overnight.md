# The two overnight `public-views` failures: 0153's first draft, applied to the shared dev database

2026-10-07. Closes open defect 2 of `docs/test-plans/public-views-impact-figures.md`
and the backlog item "Two `public-views` failures overnight on 2026-10-07 that
nothing explains".

## What failed

Both runs failed on the same single assertion, and on nothing else:

```
37551809878  00:25:31Z  FAIL  is_admin(): anon EXECUTE is refused — HTTP 200: false
37552423077  00:32:39Z  FAIL  is_admin(): anon EXECUTE is refused — HTTP 200: false
```

HTTP 200 with a body of `false` means the anonymous key **ran** `is_admin()` and got
an answer. It is not a timeout, a 5xx, a rate limit or missing secrets: the secrets
were present (the step's `env:` block shows all three masked), and every other probe in
both runs answered as expected. It was a real grant, in the dev database, at that time.

## Why

`0153_perm_convert_admin.sql` (stream `perm-convert-admin`) was applied to dev at
**00:19:57Z** (`schema_migrations.applied_at`). Its first version (`67d5914b`) ended

```sql
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated, service_role;
```

on purpose: its comment argued anon needed it because policies call it. The stream's
own gates then refused the file (`check-migration-grants`, run by lint: "anon may only
be granted public_* / site_* objects or a function on the public-site allow-list").
The stream corrected the file (`d7ae1572`, committed 00:37:24Z) to revoke from anon and
re-ran it on dev "from the file", which is outside `apply-migrations.mjs` — the
`applied_at` is still 00:19:57Z, and the runner never re-runs an applied file.

So from 00:19:57Z until the corrected copy ran, somewhere between 00:32:39Z (last
failure) and 00:36:34Z (first pass), **anon could execute `is_admin()` on dev**. Every
CI run in that window checked the same shared dev database, whatever its branch:

| run | started | branch | public-views |
|---|---|---|---|
| 37549595874 | 00:00:12Z | main | success |
| 37551809878 | 00:24:40Z | photo-routes-off-predicate | **failure** |
| 37552423077 | 00:31:36Z | worktree-held-reason | **failure** |
| 37552851575 | 00:36:34Z | photo-routes-off-predicate | success |
| 37552962932 | 00:37:49Z | perm-convert-admin | success |
| … every later run | | | success |

Every run inside the window failed; every run outside it passed. That is why it looked
inexplicable: it came and went on its own, and it fell on two branches that had nothing
to do with it, while the branch that caused it had its first CI run at 00:37:47Z, after
the fix, and so never saw the red.

## Verdict: a real defect, briefly, on dev — not a flaky check

The check was right both times. Nothing needs to change in how it decides.

The exposure was nil in substance: `is_admin()` takes no arguments and answers for the
caller, and for anon `auth.uid()` is null, so the answer is always `false`. It leaked no
row. But it was exactly what the check exists to catch — a function anon should not be
able to call — and the next one may not be harmless.

Production never had it. Production applies only from a checkout whose migrations match
`origin/main` (the `GUARDED` refusal in `apply-migrations.mjs`), and `0153` reached main
already corrected. Not queried on production from this worktree; that is the reasoning.

Today, on dev: `has_function_privilege('anon','public.is_admin()','execute')` is
`false`, ACL `{postgres=X, authenticated=X, service_role=X}`, and `check-public-views`
passes all 245 checks.

## What changed

1. **`apply-migrations.mjs` runs `check-migration-grants` on the pending files before
   applying any of them, and refuses a real apply if it fails.** The checker already
   refused 0153's first draft (re-run against `67d5914b`'s copy: two findings, exit 1);
   it just ran in lint, *after* the apply. The dev database is shared by every branch's
   CI, so what it holds is what every other stream is checked against; a file the
   grants check refuses should not reach it. A `--dry-run` still runs (it rolls back,
   nobody else sees it) and prints the findings. There is no override: a file that
   fails this check cannot pass lint, so it cannot merge either.
2. **`check-public-views.mjs` repeats its FAIL lines after the summary.** The cause was
   in the log all along, one line among ~245 `ok` lines, and the tail of
   `--log-failed` shows only passes. The item was written as "nothing explains" with the
   answer on screen.

Not changed: how the check decides pass and fail. The brief asked, if this turned out to
be flakiness, for a failed request to be told apart from a failed assertion. It was not
flakiness, and the existing message already says `HTTP 200: false` — it was a failed
assertion, and said so.

## Rejected

- **Pointing CI's `public-views` at something other than the shared dev database.** It
  is the only place the anonymous tier can be checked against real grants, and the
  sharing is what made this visible at all.
- **A rule that an applied file must never be re-run by hand.** CLAUDE.md already says
  applied files are never edited and SQL is never posted by hand; 0153's correction did
  both, under time pressure, to undo something the runner had no way to undo. The
  useful fix is upstream: stop the wrong file being applied, so there is nothing to undo.
