# 2026-11-21: the label drafter's three Worker values are registered as secrets (#aaqtl)

`runLabelDrafts()` (worker/translations.mjs) reads `LABEL_DRAFT_EMAIL`, `LABEL_DRAFT_PASSWORD` and
`SUPABASE_ANON_KEY` from the Worker environment. None was in `scripts/lib/runtime-config.mjs`, and the
deploy pushes only what that registry lists, so none could reach the Worker.

**Decision:** all three are `where: "worker"`, `secret: true`, `required: false`.

- **`LABEL_DRAFT_EMAIL` is a secret, not a wrangler.jsonc var.** The repository is public and a var is
  committed in clear, which would publish the machine login's address. The comment in
  worker/translations.mjs calls it a "plain var"; that wording predates this decision and is wrong for a
  public repo.
- **`LABEL_DRAFT_PASSWORD`** is a secret, and is scrubbed from status-tile error text.
- **`SUPABASE_ANON_KEY` was not already present under another name for the Worker.**
  `NEXT_PUBLIC_SUPABASE_ANON_KEY` is inlined into the build and is not a Worker binding, so
  `env.SUPABASE_ANON_KEY` is undefined at run time. A separate name is needed. The key is public by design, so a var would
  be safe, but a secret keeps each environment's value in its values file rather than committed three times.
  The cost: it must be typed into each values file beside the public one.
- **`required: false`**: unset, the drafter logs one line and does nothing, so no environment is stopped from deploying.

**Not done here (planner and Lutan, after merge):** add `LABEL_DRAFT_EMAIL`, `LABEL_DRAFT_PASSWORD` and
`SUPABASE_ANON_KEY` (same value as `NEXT_PUBLIC_SUPABASE_ANON_KEY`) to the local, uncommitted
`.env.deploy.production`, then Lutan runs the production deploy with `--secrets`.
