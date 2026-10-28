# The last two role-keyed checks, and the dev sign-in line

**2026-10-28**, `claude/instruments-last-two-and-docs`. Follows `2026-10-28-instruments-ask-a-card-question.md`.

## What changed

- `scripts/lib/readonly-checks.mjs` gained `card-grants-applied` and `card-cells-backed`, which restate
  `role-cards-coverage` and `cards-union` the way `fault-maintenance-delete` was restated.
  - `card-grants-applied` is keyed by **card**: for each card (with what it includes), does any holder lack an
    activity it grants, and how many. The cells are stored per role, so it counts holders and names none.
    Strictness is unchanged: any row fails, the answer must always be none.
  - `card-cells-backed` is keyed by **activity**: cells held that no held card backs, and card-backed cells
    missing from a holder, with a holder count.
- The two old checks stay (they answer who is affected today), relabelled *TRANSIENT CONTEXT*, as the
  earlier four were.
- `CLAUDE.md`: the dev sign-in section and the "per card" caveat now give `dev-signin.mjs --cards <a,b> --port N`
  with no role (the script refuses both), say it builds its own disposable role, and warn that `--remove`
  deletes every login the script made, other running streams' included. `dev-signin.mjs` is untouched.

## Judgement calls

- The brief warned that role checks ignore `roles.archived_at`. That column no longer exists (`0272` removed
  role archiving), so the new queries filter on `kind <> 'fixed'` only; a retired-role filter would fail to run.
- **Run on dev (`--env test`), not production**: worktrees have no production credentials. Both print clean on
  dev, as do the old role-keyed pair. **Not established:** that either new check goes red when it should; I did
  not seed a fault into the shared dev database. Their SQL is the old queries regrouped, with the same join.
- Left alone, as instructed: `doctor-cells`, `role-cards`, `role-cells`, `check-menu-coverage`, and any
  other role-keyed check not named in the brief.
