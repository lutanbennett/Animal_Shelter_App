# The assistant no longer shows the database's text when a write is refused (2026-11-01)

**Where it was.** Every assistant write goes through one function, `runWrite()` in
`src/app/assistant/actions.ts` (deliverable 4: one shared path, not twelve). The shared write helpers
it calls (`recordWeight`, move, hospital, rehome, immunization, prescription…) return
`{ error: error.message }` when they have no wording for a failure, so a refused policy arrived as
Postgres's own text and was shown as it came.

**What changed.** `src/lib/assistant/refusal.ts` recognises database text. In `runWrite()` a policy
refusal (row-level security, permission denied, 42501) is replaced by `t.assistant.cardRefused`; any other
database-shaped text (constraint, column, PGRST) by the existing generic "something went wrong". Sentences
the helpers wrote themselves pass through untouched. The audit row still records the original text.
Nothing about *what* is refused changed, and no role is named.

**Judgement call.** The sentence says "your cards", not which card. Only the prescription tool declares an
extra activity (`needs` in `llm-tools.ts`); for the other writes the activity lives in each table's policy
and the helpers return no code, so naming it would mean a new per-tool map that could drift from the policy.
Naming the exact card is a possible follow-up if Lutan wants it.

**Detection is by text.** The helpers drop the Postgres code, so the match is on message wording. A refusal
phrased unlike those patterns would still show; the proper fix is for helpers to return the code, which
touches many files outside this stream.

**Thai is mine and unreviewed** (`th.ts`, `assistant.cardRefused`): it needs a Thai reader's eye.

**Found, not fixed.** `src/app/assistant/lookups.ts` returns `error.message` from read paths in several
places (lines ~226, 283, 362, 535); those are reads, not writes, and not in this item.
