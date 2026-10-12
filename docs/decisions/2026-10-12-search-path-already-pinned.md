# `search_path` was already pinned everywhere — the item was a file-grep artefact

2026-10-12.

## What was asked

Architecture review S7 (2026-10-11) filed *"Pin `search_path` on every
`security definer` function"*, reporting **171 `security definer` declarations
and 164 `set search_path` lines** across the migrations, with *"a rough scan"*
finding **about forty** definer declarations lacking `search_path` within four
lines. It was planned as batch 96's schema stream, holding migration `0188`.

**The item's own instruction was "verify first", and verifying closed it.**

## What is actually true

A read-only query against the **dev** project (`qxkmhwybjggxvsfxsxbd`):

```sql
select n.nspname, p.proname, p.proconfig
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
 where p.prosecdef and n.nspname in ('public','private');
```

```
security definer functions total: 57
  pinned   : 57
  UNPINNED : 0

search_path values in use among the pinned:
  {search_path=public}   (40)
  {"search_path=\"\""}   (17)
```

**Zero unpinned.** The per-function choice between `public` and `''` — which is
not cosmetic, because `''` forces every name in a body to be schema-qualified and
a body that relies on the search path breaks *at call time* — had already been
made, 40 one way and 17 the other.

## The gate the item asked for already exists

The item proposed *"a line in `check-migration-grants.mjs` or a sibling that
refuses a new definer function without one."*

`scripts/check-migration-grants.mjs:261-262` already does exactly that, and it is
wired into `npm run lint`, which CI runs on every pull request:

```
migration grants: ok (110 file(s) checked)
```

So there was no gate to add either.

## Why the review's number was wrong, and why that is instructive

The review counted **declarations in migration files**. Files are not the live
state: `create or replace function` means a later migration supersedes an earlier
body, so a grep counts versions that no longer exist as written.

| source | count |
|---|---|
| `security definer` declarations across 110 migration files | **173** |
| `set search_path` lines across the same files | **165** |
| distinct function names declared in files | **179** |
| **live `security definer` functions in dev** | **57** |

173 declarations resolve to 57 functions. **The item anticipated this in its own
words** — *"some will be false positives, and later files replace earlier
bodies"* — which is why it said to run the `pg_proc` query first. The lesson is
not that the review was careless; it is that **a file grep cannot answer a
question about live database objects**, and the review said so.

This is the fourth time a planned stream has turned out to be already done
(`CLAUDE.md`, "Finishing a feature"). The pattern holds: **ask whether the
behaviour the item describes still happens, not whether the code it names still
exists.**

## What is NOT closed by this

**Production was not checked, and cannot be from these sessions.** If production
is behind on migrations it may still hold an older, unpinned body of a function
that dev has since replaced. That is a **release-manager check before a deploy** —
run the same query against production and compare — and not a workstream. It is
recorded here rather than left as an open backlog item because there is no work to
do unless the check comes back dirty.

## Consequences

- **No `0188`.** The migration number is not taken and remains free.
- The `claude/search-path-pin` branch carries this record and the backlog tick
  only.
- Batch 96's third slot went to the public-page/public-host list unification
  (review C3 and S5) instead.
