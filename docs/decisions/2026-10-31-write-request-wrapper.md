# The shared write wrapper, and why it is NOT one transaction

Stream `pi-failover-wrapper`, stream **(C)** of the PI FAILOVER programme, 2026-10-31.
Briefed from `docs/decisions/2026-10-31-write-requests-schema.md` (stream (B), the table) under
Lutan's decision of 2026-10-19: *"I want to go for option 1 - the bigger build but proper fix.
Let's do it right the first time."*

**The headline, because it changes what (C) is:** a shared wrapper **cannot** give the
one-transaction guarantee the schema paper's requirement 1 asks for. What it can give is a
protocol that keeps **correctness** — a write is never applied twice, and a replay is never
reported as a fresh success — and pays for it in **availability**. The rest of this file is the
evidence for that, what was built on it, and what (D) must do per path to get the guarantee back.

## 1. The central question, settled

The schema paper calls it *"the single most important line in this file"*:

> Each write must reach the database as **one statement or RPC** that calls
> `claim_write_request()`, does the write, then `finish_write_request()`.

**It cannot be done from a wrapper around `runAction()`'s body, and here is what I read before
saying so.**

- **`runAction()` (`src/lib/action-result.ts`) takes `body: () => Promise<ActionResult<R>>`** — an
  arbitrary async function. A wrapper can call it, time it and catch it. It cannot see inside it.
- **Real bodies are several round trips, not one.** `createUnit` (`src/app/admin/units/actions.ts`)
  reads the highest `sort_order`, then inserts. `updateUnit` reads the current row, then reads
  `diet_types` and `medication` through `usesOf()`, then updates. Each of those is its own HTTP
  request to PostgREST and therefore **its own transaction**.
- **The constraint is already written down in this repo, by a stream that hit it for another
  reason.** `src/app/admin/units/actions.ts` says a rename *"cannot be one transaction from here
  (no migration this stream, and PostgREST has no multi-table transaction)"*.
- **supabase-js offers no transaction handle.** The only unit of work PostgREST gives that is one
  transaction is **one `rpc()` call**.
- **Being already-an-RPC does not help a wrapper.** There are 62 `.rpc(` call sites in `src/`, and
  the write-shaped ones (`record_stock_correction`, `set_role_cards`, `record_immunizations_fanout`,
  `record_attachment`) are single transactions in themselves — but they sit inside bodies that read
  first, and the claim and the finish would still be two further round trips either side.

So over a wrapper the sequence is **three transactions**, not one, and the invariant the table was
built to carry is weaker than the table assumes.

### What CAN give it, named rather than left implied

1. **Per path, the write becomes one RPC that claims, writes and finishes inside its own body.**
   This is the real answer and it is **(D)'s**, one migration per path alongside the sweep. For a
   path converted that way, `in_flight` becomes unreachable and the schema paper's requirement 1 is
   met exactly.
2. **A generic `claim_then_call(request_id, action, fn, args jsonb)`** — one `security definer`
   function that claims, `execute`s a caller-named function, and finishes, all in one transaction.
   It would cover every write that is *already* exactly one RPC with jsonb arguments without
   touching each one. **Not built here, and three reasons, in order of weight:** it executes a
   function the caller names with definer rights, which is a hazard needing its own named entry in
   `docs/hard-coded-security-registry.json`; it needs a migration, and `CLAUDE.md` allows only one
   in-flight migration branch at a time, which this stream does not hold; and it fits only the
   subset of writes that are one RPC and no reads. **It is worth (D) weighing against option 1 path
   by path**, which is why it is written down rather than dismissed.

**This narrows what (C) is, and the narrowing is the finding.** (C) is not "the thing that makes
every write one transaction". It is the thing that makes a replay safe enough that the Worker may
serve a write the Pi did not answer — which is what the four-row failover table actually asks for.

## 2. What the wrapper gives instead, exactly

`runWriteAction()` in `src/lib/action-result.ts`. Claim, body, finish, with all three of `0292`'s
answers handled. Every row of this table is pinned by a case in `src/lib/action-result.test.mjs`.

| what happens | claim | the write | finish | what the retry is told | is it right? |
|---|---|---|---|---|---|
| all three commit | yes | yes | yes | `replay`, with the stored result | **exact** |
| the body returns a refusal | yes | — | yes, records the refusal | `replay`, the same refusal | **exact** |
| the body throws | yes | **unknown** | *deliberately skipped* | `in_flight`, "we could not tell" | **fail closed** |
| the process dies after the write | yes | yes | — | `in_flight`, "we could not tell" | **fail closed**, and the write did land |
| the process dies after the claim, before the write | yes | — | — | `in_flight`, "we could not tell" | **a false unknown** |
| the process dies before the claim | — | — | — | `claimed`, so it writes | **exact** |

**Five of six rows are either exact or fail closed. The one cost is the fifth:** a retry that was in
fact free is told we cannot tell. It costs the person a look at the screen. It never costs a
duplicate and never reports a replay as a fresh success, which are the two failures the schema
paper says this programme cannot afford.

Four choices inside that are worth not re-deriving:

- **A thrown body leaves the claim OPEN, on purpose.** A throw cannot tell *"the write never
  happened"* from *"it happened and the answer was lost"*. Closing the claim with a failure result
  would make the next attempt replay a *lie*. Leaving it open makes the next attempt say it cannot
  tell. Fail closed.
- **A refusal is stored like a success.** The body decided; the answer is deterministic; a replay of
  a refused save should be refused the same way rather than tried afresh.
- **A `finish` that fails is logged and the write is still reported.** The write happened; saying
  otherwise would be a lie. The claim stays open, so a later attempt reads `in_flight`.
- **No request id is a refusal, not a fall-through.** A page whose address is on
  `WRAPPED_WRITE_PATHS` may have its writes replayed by the Worker, so letting an unclaimed write
  through would be the #250 double write. A browser running older JavaScript is told to reload.

## 3. The Worker replay rule

`worker/origin.mjs`. Before today a write fell back to a local render **only** on a 530, the one
status that proves the request never reached the Pi. Now it also falls back when its path is on
`WRAPPED_WRITE_PATHS` — and such a write is **time-bounded** like a read, which it never was.

**Which outage shapes that newly covers**, against the four rows the backlog item lists:

| the failover table's row | before | now, on a wrapped path |
|---|---|---|
| `cloudflared` stopped, 530 at once | falls back and works | unchanged (and now also deduped) |
| **power cut, first seconds, 502/504 or a timeout** | **writes refused** | **falls back and works** |
| power cut, once the edge notices, 530 | falls back and works | unchanged |
| **Pi up but sick, or `lanna-care` stopped, 502/503** | **writes refused** | **falls back and works** |

Plus a fifth shape the table does not name and the 2026-10-28 drill measured: **the Pi accepts the
write and never answers.** An unwrapped write is given no timeout at all, so it hangs; a wrapped one
is bounded by `ORIGIN_TIMEOUT_MS` and falls back.

**So both of the two refused rows are closed, for a wrapped path.** Every other path behaves exactly
as it did, which `scripts/check-worker-origin.mjs` asserts in both directions.

### Why a path list and not a header or a cookie

The Worker has to know whether *this* write is wrapped, and it gets one guess.

- **A header is impossible.** A Server Action's POST is made by React's own fetch; the app has no
  hook to add a header to it. (Confirmed in the browser: the request carries `next-action`,
  `next-router-state-tree` and the app's own form fields, and no header the app chose.)
- **A cookie is possible and wrong.** A cookie left over from an earlier wrapped save would mark the
  *next* write replayable whether or not it was wrapped. That is a double write, inside the window,
  for the exact reason this programme exists.
- **Reading the body is exact but costly** — the Worker would have to buffer a clone of every failed
  write, up to the 16 MB upload ceiling, before it could decide.
- **The path is exact and free.** A Server Action POSTs to its page's own address, so one entry
  covers every action that page hosts. It costs nothing at runtime, it is the idiom this repo
  already uses for a list the Worker shares (`src/lib/public-paths.ts`), and it **fails closed**: a
  path not on the list behaves as before.

**The rule that comes with it, and (D) owns it:** a path goes on the list only when **every** write
reachable at that address goes through `runWriteAction()`. Miss one and the Worker replays an
unclaimed write. The rule is written in `src/lib/write-requests.ts` beside the list and again at the
top of `src/app/admin/units/actions.ts`.

## 4. The client-side time limit: 30 s, and why that number

`WRITE_WAIT_MS` in `src/lib/write-requests.ts`, and it is a **sum, not a figure somebody liked**:

```
WRITE_WAIT_MS = ORIGIN_ATTEMPT_MS (20 s, the Pi) + WORKER_FALLBACK_MS (10 s, the Worker's own render)
```

The limit must fire only once there is genuinely nothing left to wait for; any earlier and it turns
a save that was about to succeed into an unknown. The Pi's leg is `ORIGIN_TIMEOUT_MS`, which
`wrangler.jsonc` sets to 20000 on both environments. The Worker's own leg is bounded by the option 5
measurement of 2026-10-31, which had an intake save returning `ok` at 354 ms of CPU — wall time on
that path is mostly PostgREST round trips, so ten seconds is generous rather than tight. It comes to
**30 s**, which is also the number `scripts/pi/drill-probe.mjs` already uses, so the drill's *"4 of
85 writes hit the client's 30 s limit"* stays comparable with what ships.

It is a limit on **waiting**, not on the request. A Server Action's POST cannot be cancelled from
the page, and it does not need to be: the save carries a request id, so whatever it is still doing,
the next press is safe.

**The id is stable across retries of the same attempt** (`useWriteForm` / `useWriteCall` in
`src/lib/use-write-form.ts`): while the last answer was "we could not tell", the next press reuses
the id, so the database answers with the first attempt's own result if there was one. Once a press
comes back with a real answer the next press is a new attempt and gets a new id. That is why the
words say *"Press Save again to find out — it will not be saved twice"*: pressing again is how a
person asks what happened.

**One trap, and it bit during the build:** a `useWriteCall` must not be shared between two actions.
An id kept from an unknown Save and then sent to Archive is the same id against a different action,
which `claim_write_request()` refuses outright — correctly, by the schema paper's requirement 4.
`UnitsTable.tsx` therefore holds one per action, with the reason beside it.

## 5. The one path proven end to end

**`/admin/units`**, chosen because all three of its writes fit in one file, it is small enough to
sweep inside (C)'s boundary, and it is the page `scripts/pi/drill-probe.mjs` already POSTs to — so
the next drill exercises the wrapped path without being changed.

Driven in the browser pane as Admin on dev (reached by clicking Settings, then Units, never by
address; `requestAnimationFrame` confirmed firing first):

1. **The id travels.** The POST to `/admin/units` carried
   `_1___writeRequest=f9bcf3e0-5fee-4813-9be7-95319e4d0fcc`, a v4 uuid, and the save succeeded.
2. **A replay returns the first result and never runs the write again.** The identical request was
   re-sent, exactly as the Worker would after a failed Pi attempt. It answered
   `{"ok":true,"success":"Added the unit \"wr-replay-…\""}` — the **stored** first result.
3. **The control that makes (2) mean something.** The same request with a **fresh** id answered
   `{"ok":false,"error":"There is already a unit called \"wr-replay-…\""}`. So the body genuinely
   does run for a new id and the database genuinely does refuse the duplicate: (2) short-circuited
   before the body, rather than the name constraint quietly doing the work.
4. **The rows agree.** `write_requests` on dev holds exactly three rows for `units.createUnit` —
   two `ok:true` and the control's `ok:false`, all finished. The replay created **no** row.

`node scripts/prove-write-requests.mjs` was re-run and passes (the two functions are unchanged;
re-run as the schema paper's requirement 6 asks).

**What the browser proof does not cover,** said rather than implied: `in_flight` cannot be forced
through the UI, because it needs a process to die between two round trips. It is covered twice
instead — by proof 4 of `prove-write-requests.mjs` at the database, and by a case in
`src/lib/action-result.test.mjs` over the wrapper. And the Worker rule is driven by
`scripts/check-worker-origin.mjs` against throwaway origins on 127.0.0.1, not against a real tunnel;
the real-tunnel version is the power-pull drill, which is Lutan's and lives in *PI TESTS AT THE PI*.

## 6. The release ordering, and the test plan's §7

`0292` must be live on production **before** this code deploys. The schema stream said its
`-- consumer:` header could not express that direction and left the guard to (C)'s release note.

**It turns out the guard is already mechanical, and better than a note.** `scripts/deploy.mjs`
refuses to deploy any commit whose migration files are not all applied to that environment
(`schemaVerdict`, the rule from
`docs/decisions/2026-10-01-deploy-requires-deployed-migrations-applied.md`). `0292` is on `main`, so
**every** production deploy is already refused until it is applied — this PR changes nothing about
that and needs no new mechanism. What section 5 of `docs/release-procedure.md` gains is a sentence
saying *why* this one matters, so a release manager meeting the refusal understands it rather than
looking for a way round it. The one hole in that guard, named because it is real: *"could not ask is
a warning, not a refusal"*, so a Supabase blip during a deploy could let a commit through; checking
`--status` by hand is what covers it, and section 5 already says to.

**Section 7 of the test plan is `n/a`, and there is no line in `unreleased`.** Production is four
migrations behind (`0289` to `0292`). A note telling every admin that saves now survive the Pi being
off would be **false until `0292` is applied and the Worker redeployed** — exactly the fault
`docs/decisions/2026-10-11-release-note-truth-rule.md` was written about after #518 shipped one in
`0.25.0`. `CLAUDE.md` forbids ticking section 7 while a manual step is outstanding. **The note
belongs in the PR that closes the step**, which is whichever release applies `0292` to production.

## 7. Found, not fixed

- **An unwrapped write still hangs against a wedged Pi.** It is given no origin timeout, because
  cutting it short would only turn a wait into a refusal — it has nowhere to fall back to. It
  closes path by path as (D) sweeps. `scripts/check-worker-origin.mjs` asserts the hang on purpose,
  so nobody "tidies" the two branches to match.
- **`useKeptForm` gained an `extraFields` parameter and nothing else.** The other nine forms that
  use it are untouched and carry no request id: they are (D). The parameter is how the id reaches a
  Server Action at all, given React makes the POST.
- **Two test units are left on dev** (`wr-proof-…`, `wr-replay-…`). Dev rows are disposable and
  units are archived rather than deleted; removing them would have been a third write with no proof
  value.
- **`src/app/admin/units/UnitsTable.tsx`'s buttons were not re-listed against `CLAUDE.md`'s "a
  button is shown only if the login's cards let it do that action".** This stream changed how those
  two buttons *call*, not whether they are *drawn*, and the page's existing gate
  (`canEditItemSettings`) is unchanged. Named here because the rule asks for that list to be made
  before a page is finished, and this stream did not make it.

## 8. Not in this stream

**(D), the sweep over the other 56 `runAction` call sites.** The backlog item splits it off as
*"the largest part"*, by area, in finishable streams. Each (D) stream converts its paths to
`runWriteAction()`, decides per path whether to go further and make the write one RPC (section 1
above), and only then adds its page addresses to `WRAPPED_WRITE_PATHS`.
