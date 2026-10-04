# Machine-drafted translations: one cron, one seam, drafts only (2026-10-04)

The worker half of the free-text strategy's phase 2 (`docs/backlog.md`, Management).
Plumbing from 0056 is unchanged; **no migration** (0134 stays unclaimed).

## Where it runs

In the existing Worker, on the existing 15-minute cron (`worker/index.mjs`
`scheduled`, after the status alerts and unable to delay them), in the `test` and
`production` environments. Not a second Worker: this one already holds
`SUPABASE_SERVICE_ROLE_KEY` as a secret (`deploy.mjs --secrets` pushes it), so the
service key is not in a second place. New in `wrangler.jsonc`: an `ai` binding
(`AI`) and the vars `SUPABASE_URL`, `TRANSLATE_BATCH`, `TRANSLATE_REVIEWED_DAILY`.
`SUPABASE_URL` is a var because the Next build's `NEXT_PUBLIC_SUPABASE_URL` is
inlined at build time and is not in the Worker's own `env`.

## The engine seam

`worker/translate-engines.mjs` exports `translate(env, picked, {text, from, to,
tier})`. An engine is `{ id, model(env), available(env), translate(env, request) }`
and there are three: `workers-ai` (a prompted chat model, default
`@cf/meta/llama-3.3-70b-instruct-fp8-fast`), `workers-ai-m2m100` (Meta's dedicated
translation model, no prompt) and `ollama` (`OLLAMA_URL`). `TRANSLATE_ENGINE` and
`TRANSLATE_MODEL` choose; polling, write-back, failure handling and the cron are in
`worker/translations.mjs` and never see which ran. `translations.engine` records
`<engine>:<model>`, so the bake-off the item asks for can be read back from the
table: run each candidate for a week and compare drafts by that column.
The output is always cleaned and checked (`checkOutput`): non-empty, not the source
handed back, in the target script, not absurdly long or short, and for the
`machine` tier every number in the source present in the output. These are what
code can judge. **Whether the Thai reads well is for a Thai speaker.**

## Failure: three strikes, remembered in `engine`, no schema

A pending row the model fails on must not spin. Each failure writes
`engine = 'mt-retry:<n>:<hash of source_text>'` on the still-pending row and bumps
`updated_at`; the next try waits 30 min after the first failure, 3 h after the
second, and after the third the row is left alone (still pending, in the manager's
queue to write by hand exactly as before). The hash is the point: editing the
source changes it, so a row someone fixed gets a fresh three, and a row whose
source never changes is not retried for ever. Chosen over a new `attempts` column
because the migration slot is reserved and `engine` is otherwise null on a pending
row; the cost is that the marker is a convention, documented here and in the file.
An engine that *throws* (quota, outage) is likely to throw for the next row too, so
that row is charged and the run stops, rather than spending the batch; a model that
returns something unusable is that row's problem alone and the run continues.

## `draft` is the whole safety model

`status: "draft"` is a literal in one function (`saveDraft`); nothing in the worker
can write `approved`, which is all the public views show. Every write is
conditional on `status = pending` and the `updated_at` the row was read with (the
0056 trigger bumps it on any source edit), so a manager's approval or an edit made
while the model was working wins and the machine text is dropped. The panel labels
a machine draft for managers, and does not show one to a non-manager as if it were
settled (`TranslationPanel`).

## Volume

`TRANSLATE_BATCH` (default 2) rows a run, so at most 192 a day on the 15-minute
cron: a backlog cannot burst through the free allowance. Separately,
`TRANSLATE_REVIEWED_DAILY` (default 20) caps machine drafts handed to managers in
any rolling 24 hours for the `reviewed` tier, counted from the table
(`engine <> 'human'`, `status = 'draft'`, recent `updated_at`), so the managers get
about twenty a day rather than three hundred on Monday. The `machine` tier has no
daily cap because no one reviews it.

## Not in this PR (the item stays open)

The `machine`-tier fields and their triggers (a migration, which waits for the
schema lane), the bake-off on twenty real bios and vet notes, and the Cloudflare
steps in the test plan. The `machine` prompt and number check are written and
tested so that PR is data, not code.
