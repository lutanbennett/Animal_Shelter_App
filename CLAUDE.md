@AGENTS.md

# Working on this repo

One developer, one machine, **several Claude sessions at once** — each in
its own git worktree, on its own branch, with its own dev server. These
rules keep `main`, GitHub and the dev database in step while two or three
features are built in parallel; follow them without being asked.

## Where am I?

First thing in any session: `git rev-parse --show-toplevel` and
`git branch --show-current`.

- **`C:\Development\Animal_Shelter_App` is the main checkout and is only
  ever on `main`.** It is the sync and merge station, not a place to
  build features. If you are here and asked to build something, create a
  worktree for it (below) and tell the user to open a session on that
  folder — do not branch in this checkout.
- **`C:\Development\Animal_Shelter_<feature>` is a workstream**: branch
  `claude/<feature>`, port from its `.port` file. Feature work happens
  here, and only work for *this* feature. If there is a `.brief.md`,
  that is the task — `/plan-day` wrote it from the backlog item — so read
  it before anything else.
- **`C:\Development\Animal_Shelter_Backlog`** is the backlog branch (below).

## Workstreams

`git worktree list` is the registry: every `claude/*` branch has a
worktree and every worktree has a live session or a PR waiting. Aim for
two or three at once; more than that and merging becomes the bottleneck.

1. **Start one:** `node scripts/worktree.mjs new <feature>` in any
   checkout. It branches `claude/<feature>` from `origin/main`, copies
   `.env.local`, runs `npm ci`, records the next free port in `.port`
   and writes a gitignored `.claude/launch.json` aimed at that port.
   Never branch from another feature branch. Then open a Claude session
   on the new folder; `node scripts/worktree.mjs dev` starts `next dev`
   on its port, and so does `preview_start` with `name: "dev"` (a checkout
   without the file gets one from `node scripts/worktree.mjs launch`). (`/plan-day` picks the day's workstreams from the backlog
   and creates them.)
2. **One feature, one branch,** commit as you go. `.githooks/post-commit`
   pushes every commit and `.githooks/post-merge` every merge or pull
   (git runs no hook at all for a merge that stops on conflicts — the
   commit that resolves it is what pushes), and `worktree.mjs sync`
   pushes as its last step. Prefer new commits over `--amend`/rebase —
   those need a manual `git push --force-with-lease`. `list`'s
   `unpushed` column is the check that it all worked.
3. **Pick non-overlapping work.** Streams should touch different areas
   (a `/admin` page, a resident-hub tab, the `worker/`). The files nearly
   every UI feature touches — `src/lib/manual/en.ts`, `src/app/NavLinks.tsx`,
   `docs/backlog.md`, `docs/decisions.md` — will conflict trivially; two
   streams both adding nav entries or rewriting the same manual topic will
   conflict badly. `docs/decisions.md` merges by union, so just append.
4. **Finish: the merge train.** When a feature is done and verified:
   `node scripts/worktree.mjs sync` (merges `origin/main` in), then
   `node scripts/gates.mjs` (typecheck, lint, build; prints each exit code), then open the PR
   with `gh pr create` (signed in as the user; fall back to GitHub in the
   user's Chrome if `gh` is missing). CI runs the
   same three checks. Once the user says so, merge it, then
   `node scripts/worktree.mjs done <feature>` from another checkout
   removes the folder and the branch locally and on `origin`, prunes
   git's registry and checks that all of it actually happened. It
   refuses a branch with commits `origin` does not have (no flag
   overrides that) and a folder any process has open — usually the
   session that built it, so close that session first. Merges are
   serial: after each one, every other live workstream runs `sync` so the
   next PR is already integrated. A branch that outlives its PR is how
   work gets stacked and lost.
5. **Stale streams.** `node scripts/worktree.mjs list` shows each
   worktree's dirty files, how far it is beyond `main`, unpushed
   commits, and `held`: whether any process has the folder open, with the
   Claude session's name when it can be read. A worktree with nothing
   beyond `main` and `free` is a leftover — `done` it (with `--force`
   if it has junk changes) rather than reusing it. `HELD` means someone
   is still in it: ask, don't tear it down. `list` also names *husks* —
   `Animal_Shelter_*` folders git no longer knows — which `done <name>`
   clears.

## Testing

Since 2026-09-23 every feature carries a test plan checklist, and it is
part of the PR rather than an afterthought. The test manager writes it
from `docs/test-plan-template.md`; it is filled in during verification
and committed as `docs/test-plans/<feature>.md` on the feature branch, so
the record of what was checked sits beside the change in git history for
good. `node scripts/check-test-plan.mjs` is what CI runs — run it locally
before pushing.

- **Every PR, no exemptions — including schema-only ones.** Ruled
  2026-09-23: an exemption for migration-only PRs was granted and then
  reversed within minutes. A schema PR's checklist is mostly
  `n/a: no UI surface, no code reads these columns yet`, which costs
  about a minute and is exactly the record you want on the day that
  migration turns out to matter. Writing the `n/a` reason *is* the check.
  Do not reopen the exemption without asking the user.
- **Two signatures, certifying different things.** *Automated checks by*
  covers gates, scripts, server-side behaviour and any browser check
  actually driven — Claude may sign this for work it genuinely ran.
  *Manual verification by* is signed **only by the person who looked**, or
  `n/a: <reason>` where there was nothing to look at, and a **Left for
  manual verification** table makes the handover concrete. Claude never
  signs that line on someone's behalf unless that person has looked and
  explicitly asks in chat, and the line then says so (ruled 2026-09-23).
  A signature that does not
  correspond to someone having looked is worse than none: it turns an
  unknown into a false assurance, and it is the first artifact anyone
  reaches for when something has gone wrong.
- **`test-plan` reports red without blocking the merge, on purpose.** It
  validates content, not presence — every line ticked or reasoned `n/a`,
  no placeholders, both signatures, `Result:` one of three values. But it
  is deliberately **not meant to block** yet: the user's staged rollout,
  "see how we go, and if it is working smoothly then we can change to a
  hard block", so that a check firing wrongly on its first legitimate PR
  gets fixed rather than resented. **The soft gate is a decision, not a
  misconfiguration** — do not make it required, and do not treat a red
  `test-plan` as noise either. Promoting it to a required check in branch
  protection is the user's call and no session's to make; if you find
  protection already requiring it, say so rather than assuming it was
  intended.
- **Because it does not block, a PR can reach `main` unchecked.** Closing
  that is release-time work: before any production deploy, confirm by hand
  that every PR in the release has a completed checklist and stop if one
  slipped through. `docs/release-smoke-test.md` is the short per-release
  pass that goes with it, copied to `docs/releases/<date>.md`. It is
  deliberately **not** under `docs/test-plans/`, because a release record
  filed there would satisfy a feature PR's gate with no feature verified;
  `check-test-plan.mjs` rejects it if you try.
- **The release-notes line is answered for real.** §7 asks whether a
  shelter user would notice the change. Tick it only if
  `src/lib/releases.ts`'s `unreleased` gained a line in this PR, written for
  a user. Otherwise write `n/a: <why nobody would notice>`. The checker fails a tick
  with no new line, and a PR touching `src/app/`, `src/components/`,
  `src/lib/manual/`, `src/lib/i18n/` or `worker/` with no new line and no
  answer. An empty `unreleased` otherwise looks exactly like "nothing visible
  shipped" (decisions.md, 2026-09-24).

Everything merged up to `f32f2c1` (PRs #51–#54) is the agreed baseline and
predates the rule.

## The main checkout

Once a day, before starting streams, in `C:\Development\Animal_Shelter_App`:
`git checkout main && git pull`, fold in the backlog branch (see below):
`git merge backlog && git push`, then
`git -C ../Animal_Shelter_Backlog merge --ff-only main` (the post-merge
hook pushes it; `git -C ../Animal_Shelter_Backlog status -sb` should not
say `ahead`). New streams
branch from `origin/main`, so this is what makes fresh backlog items and
yesterday's merges visible to them. `/plan-day` does this step.

## The backlog branch

`backlog` is the one permanent branch besides `main`, and it only ever
touches `docs/backlog.md`. It is checked out as a git worktree at
`C:\Development\Animal_Shelter_Backlog` (a fresh clone recreates it with
`git worktree add ../Animal_Shelter_Backlog backlog`), so backlog edits
never depend on what any workstream is doing — mid-feature, dirty tree,
dev server running, none of it matters.

- **To add, reword or reprioritise an item** — in any session, at any
  point — edit `C:\Development\Animal_Shelter_Backlog\docs\backlog.md`
  and commit there (`git -C ../Animal_Shelter_Backlog commit -am
  "Backlog: <what>"`); the post-commit hook pushes it. No `claude/*`
  branch, no PR. Never edit `docs/backlog.md` on `main` directly.
- **Ticking the item a feature completes** stays on the feature branch,
  as part of finishing it — that is the one edit to `docs/backlog.md`
  that belongs in a PR.
- **Syncing** is the daily step above: merging `backlog` into `main`
  makes new items visible everywhere; fast-forwarding `backlog` to `main`
  afterwards picks up the ticks that came in through PRs. The
  fast-forward always works because `main` has just absorbed `backlog`.
  If the merge conflicts (a PR ticked an item while `backlog` reworded
  it), resolve it in the main checkout, commit, and carry on.
- `backlog` is exempt from the workstream rules. It is never deleted.

## Database migrations

- Files live in `supabase/migrations/` and are numbered sequentially. The
  next number is one more than the highest file **on `main`**, so an
  unmerged branch never "owns" a number.
- **Schema changes land first, as their own small PR.** A feature that
  needs a migration is two streams in sequence, not one: a
  `claude/<feature>-schema` branch holding only the migration (additive,
  re-runnable, harmless to code that doesn't know about it), merged and
  applied to dev the same day; then the feature branch created from the
  updated `main`. Only one in-flight branch may carry a migration at a
  time, so two streams can never claim the same number and the dev
  database never carries schema that `main` doesn't. If two streams both
  need schema, their migrations go in one schema PR.
- Apply with `node scripts/apply-migrations.mjs` (`--dry-run` first for
  anything non-trivial, `--status` to look). It records each file in
  `schema_migrations` in the target database and applies only what is
  pending — never POST SQL by hand or paste files into the SQL editor.
- Only apply a migration from the branch you are about to merge. If a
  branch is abandoned, its migration must be reverted from the dev
  database (write a down-migration, apply it, delete both files) before
  the number is reused.
- Applied files are never edited; write a new one. Write every file to be
  re-runnable (`if not exists` / `or replace` / `drop … if exists`) as the
  existing ones are.
- To exercise a migration against real rows without keeping anything, run
  a `begin; … rollback;` block through the same API with a `do $$ … $$`
  harness whose `raise exception` assertions surface as errors.

## Finishing a feature

Tick the item in `docs/backlog.md` (follow-ups you notice go on the
`backlog` branch, not the PR), record non-obvious design
choices in `docs/decisions.md` (dated), and keep `README.md` accurate.
Commit messages say why, not just what.
