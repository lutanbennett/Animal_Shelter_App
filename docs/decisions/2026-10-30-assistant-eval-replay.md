# Assistant eval replay, and the last two harness guard reads

2026-10-30, stream `assistant-eval-replay`. Plan of record: `2026-10-30-assistant-v2-scoping.md` (stream 6).
Follows `2026-10-30-harness-guard-reads.md` and `2026-10-30-harness-exit-triage.md`.

## The replay

`node scripts/assistant-eval-replay.mjs <csv>` (or `--fixture`) reads the could-not-help export, sends each
**labelled** sentence through `createLlm()`, and prints intent agreement and resident agreement. The logic is in
`scripts/lib/assistant-eval.mjs` (pure, no network) so `scripts/assistant-eval-replay.test.mjs` drives it with a
scripted adapter. `scripts/fixtures/assistant-eval-sample.csv` is the offline sample; no labelled real rows exist yet.

- **Where the CSV comes from: a path argument.** The export route is Admin-only behind a login with a session
  cookie, so a script cannot read its output directly, and a fixtures directory would hide the real file. The
  person labelling downloads the CSV, fills `correct_intent` / `correct_answer`, and passes the path. The header
  comment documents the argument, as the brief required of a script that takes one.
- **Scoring.** `correct_intent` is a draft kind (`DRAFT_KINDS`) or `none` (no draft wanted). The model's intent is
  the name of its first tool call, or `none` if it called no tool. `correct_answer` is the resident id the draft
  should carry; blank means resident agreement is not scored for that row. Blank `correct_intent` rows are skipped
  and counted. A model error counts as a wrong intent and does not stop the run.
- **No threshold.** Exit 0 whenever a score was produced; exit 2 only for a genuine error (no file, malformed CSV,
  no model configured). Lutan decides what a good number is.
- **Not tied to Claude.** It imports only `createLlm()` and `draftTools()`, never `llm-claude.ts`; the adapter's
  `complete()` is the whole surface used. Checked by reading the imports. A self-hosted implementation behind
  `ASSISTANT_LLM_PROVIDER` runs with no edit.
- **Known limit, not hidden:** the model gets no resident lookup, so it cannot invent a real resident id. Resident
  agreement is meaningful only once a lookup tool exists (or for a model given ids in the prompt). The number is
  printed with that caveat in the header.
- **Proven by fixtures:** CSV parsing (quotes, BOM, CRLF, Thai), label handling, scoring, error rows, empty set.
  **Needs a live run:** any real model's score. There is no key and none is being bought.
- `could-not-help.ts` and the export route were not changed.

## The two guard reads

The test is whether the script makes a `fetch` before exiting.

- **`check-phone-width.mjs` (line 253 and the others): converted.** It fetches, so the `--clean` exit 0 and the
  `--public-only` exit are after network calls; both now `await exitWith(n)` with the remainder in an `else`.
  The main path already ended in `exitWith`. `fail()`'s `process.exit(2)` is left: it runs before any request
  (project guard) or after a refused connection with no keep-alive socket, and is red either way. Read, not run
  (a full run is 2.5 to 3 hours); `node --check` passes.
- **`check-shelter-dates.mjs` (line 163): left alone.** It imports only `fs`, `module` and `path`; no network call,
  so the libuv trap cannot occur. A one-line comment records the reason. Run: exit 0 before and after.
