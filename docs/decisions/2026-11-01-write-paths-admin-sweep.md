# (D) over `src/app/admin/**`: thirteen files wrapped, and why NOTHING went on the list

Stream `write-paths-admin`, stream **(D)** of the PI FAILOVER programme over `src/app/admin/**`,
2026-11-01. Briefed from `docs/decisions/2026-10-31-write-request-wrapper.md` (stream (C)), which is
the authority for this stream.

**The headline, because it changes what every remaining (D) stream is:** the whole-page rule cannot
be satisfied by any page in this app today, including the one page already on the list. A Server
Action POSTs to the address of the page the person is **on**, and the shared header in
`src/app/layout.tsx` hosts unwrapped writes — so **every** address in the app has unwrapped writes
reachable at it. `/admin/units` is on `WRAPPED_WRITE_PATHS` in breach of the rule it was listed
under. The rest of this file is the evidence, what was built anyway, and what has to happen before
the list can grow.

---

## 1. The finding: the shared header puts writes on every address

**The rule** (`src/lib/write-requests.ts`, and section 3 of the (C) paper): a path goes on
`WRAPPED_WRITE_PATHS` only when **every** write reachable at that address goes through
`runWriteAction()`. Miss one and the Worker replays an unclaimed write — the #250 double write.

**What nobody had checked** is what "reachable at that address" actually means. It is not "the
writes in that folder's `actions.ts`". A Next.js Server Action POSTs to the **current URL**,
whatever file the action is declared in, so every action rendered into the page — including by a
layout above it — POSTs to that page's address.

`src/app/layout.tsx` is the root layout and renders `AppHeader` on every signed-in page.
`AppHeader` renders three things that write:

| in the header | reaches | writes | idempotent? |
|---|---|---|---|
| `AssistantPanel` (behind the card granting `assistant.ask`) | `src/app/assistant/actions.ts` | **12** | **no** — `assistantLogWeight`, `assistantAddPrescription`, `assistantRecordImmunization`, `assistantRecordDeath` each add a row |
| `AccountMenu` → `ThemePicker` | `src/app/account/theme/actions.ts` | 1 (`setOwnTheme`) | yes, a `user_metadata` merge |
| `LanguageSwitcher` | `src/lib/i18n/set-locale.ts` | 1 (`setLocale`) | yes, a cookie |

**So `/admin/units` is a listed path with twelve non-idempotent unwrapped writes reachable at it.**
`worker/origin.mjs`'s `mayReplayWrite()` is exactly `isWrappedWritePath(url.pathname)` — it reads
neither the body nor the request id. A login holding the assistant card, standing on `/admin/units`,
asking the assistant to log a weight while the Pi answers 502/503/504 or times out, has that write
**replayed by the Worker with no claim**. That is precisely the failure this programme exists to
prevent.

**It is not live, and that is why there is time to fix it properly.** Production is behind on
`0292`, and `scripts/deploy.mjs` refuses any deploy whose migrations are not applied
(`docs/decisions/2026-10-01-deploy-requires-deployed-migrations-applied.md`), so none of (C) or (D)
is serving traffic. Nothing needs to be done in a hurry; something needs to be done before it ships.

**Confirmed in the browser, not inferred:** signed in as Admin on dev, the Assistant button is drawn
in the header on `/admin/zones` and on `/admin/units`.

### Why `/admin/units` was NOT taken off the list

Fail-closed would say remove it. It is left on, deliberately, and the reason is mechanical:
`scripts/check-worker-origin.mjs:204` asserts `WRAPPED_WRITE_PATHS.length > 0` and takes
`WRAPPED_WRITE_PATHS[0]` as the subject of its replay cases. `/admin/units` is the only entry, so
removing it **empties the list and fails the build** — and weakening that check to allow an empty
list is exactly what this stream was told not to do. Reporting it loudly, with the live-deploy guard
noted, is the honest answer; closing it is the backlog item in section 6.

**That assertion is load-bearing in a way nobody had noticed**, and it is worth saying plainly: the
list cannot be emptied without a code change to a check.

## 2. The page table (deliverable 1), and it is now generated rather than drawn

An actions **file** is not a page. `diets` is reached at four addresses, `who-does-what` and
`website` at two each, and four admin pages reach writes that live under `src/app/management/**`
through shared components. Drawing that by hand is how the header was missed in the first place, so
it is a script instead: **`scripts/check-wrapped-write-paths.mjs`**, which walks the import graph
from each `page.tsx` plus the layouts above it and reports every reachable `"use server"` module and
whether it calls `runWriteAction()`.

`node scripts/check-wrapped-write-paths.mjs --prefix /admin`, today, with the five chrome modules
(the three above plus the assistant's two read modules) taken as read on every row:

| address | blocked by, beyond the shared header |
|---|---|
| `/admin`, `/admin/assistant`, `/admin/role-draft` | — (no writes of their own) |
| `/admin/blood-test-types` | — |
| `/admin/diets`, `/admin/diets/[id]`, `/admin/diets/ingredients` | — |
| `/admin/enclosures` | — |
| `/admin/immunization-types` | — |
| `/admin/procedure-types` | — |
| `/admin/recent-changes` | — |
| `/admin/shop` | — |
| `/admin/stocktaking` | — |
| `/admin/units` | — (and it is **LISTED**) |
| `/admin/who-does-what`, `/admin/who-does-what/features`, `/admin/who-does-what/details` | — |
| `/admin/zones` | — |
| `/admin/diets/ingredients/[id]` | `src/app/management/units/actions.ts` (3) |
| `/admin/medications` | `src/app/management/units/actions.ts` (3) |
| `/admin/facility-map` | `src/app/management/translations/actions.ts` (6) |
| `/admin/security` | `src/app/admin/security/actions.ts` (16) |
| `/admin/security/verify` | `src/app/admin/security/verify/actions.ts` (2) |
| `/admin/status` | `src/app/admin/status/actions.ts` (3) |
| `/admin/website` | `src/app/admin/website/actions.ts` (21), `management/translations` (6), `src/app/medical/scan-actions.ts` (2) |
| `/admin/website/pages/[slug]` | `src/app/admin/website/actions.ts` (21), `management/translations` (6) |

**Fourteen of the twenty-five admin addresses are now blocked by the shared header and nothing else.**

### A second structural finding: (D)'s split by area does not match the rule

The programme splits (D) into streams by area — `admin`, `residents`, `management`, a tail of ten —
and the boundary is enforced per stream. But **shared components carry writes across those
boundaries**: `ItemUnits`/`UnitsPanel` puts `management/units`' three writes on two admin pages, and
`TranslationPanel` puts `management/translations`' six on two more. So three admin pages cannot be
completed by an admin stream at all, however thorough it is. The areas are not independent, and the
sequencing has to account for that rather than assume each stream can finish its own addresses.

## 3. What was built: thirteen of the seventeen files

Converted, with the client half carrying the id (`useWriteForm` for a form, one `useWriteCall` **per
action** for a direct call), in this order and for this reason — the type-table pages first because
they are structurally identical to the proven `units`, so the pattern transferred with least risk;
then the single-action pages; then the larger ones, biggest last:

`zones` (5 writes), `blood-test-types` (4), `procedure-types` (4), `immunization-types` (3),
`medications` (4), `enclosures` (5), `stocktaking` (1), `recent-changes` (1), `shop` (6),
`diets` + `diets/recipe-actions` (10), `who-does-what` (14), `facility-map` (9). **Sixty-six writes.**

Four judgements inside that are worth not re-deriving:

- **`runCardOp()` dispatches to three different actions from one call site.** Feeding it from a
  single `useWriteCall` would send an id kept from an unknown Add to Remove, which
  `claim_write_request()` refuses outright — the trap the (C) paper names. `useCardOpWrite()` in
  `CardControls.tsx` holds one per action and picks by the op's kind. Up and Down are both
  `whoDoesWhat.moveCard`, one action, so they correctly share one.
- **A reordering drag runs several `moveCard` steps in sequence.** `run()` awaits each before the
  next and `useWriteCall` releases its id as soon as a press returns a real answer, so each step gets
  a fresh id without anything special being done.
- **Two uploads build their own `FormData`** rather than submitting a form (`shop.uploadPhoto`, and
  `sendPlan` for the facility map). The id is put in by hand with `set()` — not `append()`, so a
  retry of the same attempt cannot send two ids.
- **In `who-does-what`, the claim runs on a client of the action's own while `guard()` opens another
  for the body.** Both are the admin's own session, which is what `runWriteAction()` asks for; one
  client could be threaded through instead, and it would be tidier and no safer.

### The four not converted, and why — three of them for a reason, not for time

- **`src/app/admin/status/actions.ts` (3) — a reason, and it needs a decision.** `checkNow` is
  called as a raw `<form action={checkNow}>` on a **server component**. `useWriteForm` is a client
  hook, so there is no way to attach a request id without turning that form into a client component.
  `runWriteAction` with no id **refuses** and tells the person to reload, so wrapping it as it stands
  would break the button. Also: `runAlertCheckNow` and `sendTestAlertNow` **send mail**, which no
  database claim can un-send — the wrapper does protect them (a replay returns the stored result and
  never reaches the body), but `sendTestAlertNow` has two `runAction` calls in one function, one per
  branch, which the sweep's shape does not handle.
- **`src/app/admin/security/verify/actions.ts` (2) — a reason, and it may need option 1 or neither.**
  Both writes go to **GoTrue**, not through the app's database connection: `startTwoStepSetup` enrols
  a TOTP factor and `confirmTwoStep` raises the session to aal2 by rewriting the session cookies.
  `claim_write_request()` cannot make an auth-service call idempotent, and a TOTP code is
  single-use anyway, so a replay of a confirm is meaningless rather than dangerous. **This is the
  page the HARD BOUNDARY asks me to name:** it cannot be made safe by the wrapper, and it should stay
  off the list until someone decides whether it needs anything at all.
- **`src/app/admin/security/actions.ts` (16) — not converted, time.** It is also the file where a
  wrong conversion costs most: several writes go through the service-role admin client
  (`createDoctorForLogin`, `issueTemporaryPassword`, `deleteUser`), so which client the claim runs on
  needs deciding per action rather than by the sweep's default.
- **`src/app/admin/website/actions.ts` (21) — not converted, time, and nothing else.** It is purely
  mechanical: twenty-one writes across eleven client components, the largest single file in the area.

**Stopping here is a whole-page boundary.** No page is half-converted: every one of the thirteen
files has all of its own writes wrapped. A page converted but not listed behaves exactly as it does
today, which is why this is safe to leave.

## 4. Proof (deliverable 4)

**Nothing was added to `WRAPPED_WRITE_PATHS`, so the per-listed-path proof is vacuous by its own
terms.** What still had to be shown is that the conversions themselves work, because thirteen files
of unproven changes would be worse than none. `/admin/zones` was driven end to end in the browser
pane as Admin on dev, reached by clicking through from Settings and with
`requestAnimationFrame` confirmed firing first. The other twelve files were **not** driven
individually: they are covered by typecheck, lint, the 412-test suite and the shared mechanism, and
that is a weaker thing which is said here rather than implied.

1. **The id travels.** The POST to `/admin/zones` carried
   `_1___writeRequest=98c74928-1af8-4ff8-97de-f7445e30d964`, a v4 uuid, and the zone was created.
2. **A replay returns the first result and never runs the write again.** The identical request was
   re-sent, exactly as the Worker would after a failed Pi attempt. It answered
   `{"ok":true,"success":"Created zone \"wrD-zone-37m7x\"."}` — the **stored** first result.
3. **The control that makes (2) mean anything.** The same request with a **fresh** id answered
   `{"ok":false,"error":"duplicate key value violates unique constraint \"zones_name_key\""}`. So the
   body genuinely does run for a new id and the database genuinely does refuse the duplicate: (2)
   short-circuited before the body rather than the name constraint quietly doing the work.
4. **The rows agree.** After both creates and the replay, the zones table held **exactly two**
   `wrD-zone-` rows. The replay created none.
5. **The direct-call path works too**, which is separate code from the form path: Move up on
   `wrD-zone-9kyz8` moved it from 18 to 17 through `useWriteCall` → `moveZone(id, requestId,
   direction)`.

`node scripts/prove-write-requests.mjs` passes. `node scripts/check-worker-origin.mjs` passes, all
cases.

**Two test zones are left on dev** (`wrD-zone-9kyz8`, `wrD-zone-37m7x`). Dev rows are disposable;
deleting them would have been two more writes with no proof value.

**One measurement correction worth recording, because it wasted a pass here.** Patching
`window.fetch` to read Server Action POST bodies **breaks React's streaming response**: the POSTs
come back `net::ERR_ABORTED` with `TypeError: Cannot write to a CLOSED writable stream` in the dev
log, and the action appears to do nothing. A Move up looked like a bug in this stream's own change
until the log was read. Capture the request, then **unpatch before testing behaviour.**

## 5. `check-worker-origin.mjs` exercising only `WRAPPED_WRITE_PATHS[0]` (deliverable 5)

**One representative is enough, and it should stay as it is.** The argument, rather than the
assertion:

- What that check tests is **the Worker's rule** — a wrapped path falls back and is time-bounded, an
  unwrapped one is not. That rule is `mayReplayWrite(url)`, which is exactly
  `isWrappedWritePath(url.pathname)` and is **path-agnostic**: the Worker does the identical thing
  for every entry on the list. Looping the replay cases over N entries would run N copies of one
  test and learn nothing the first did not already establish.
- The check also already tests the **negative** direction with a near miss, which is the half that
  could actually regress if `isWrappedWritePath`'s prefix handling were changed.

**But the question exposes a real gap, and it is a different check, not a bigger version of this
one.** What nothing verified is whether a listed path *deserves* to be listed — the whole-page rule
is about the **app**, not the Worker, and `check-worker-origin.mjs` cannot see it. That is the check
that would have caught `/admin/units` on the day it was listed, and it did not exist. It does now:

**`scripts/check-wrapped-write-paths.mjs`**, added by this stream. It answers "does every write
reachable at this address go through `runWriteAction()`?" per page, and names any listed path that
fails.

**It always exits 0 and is deliberately NOT in CI**, for the same reason `check-stale-titles.mjs`
is not: today it reports the rule as broken on `/admin/units`, so wiring it in would fail every
build in the repository. Promoting it to a blocking check is the right end state and is filed as its
own backlog item, to be done in the change that closes the header — not switched on quietly here.
**Nothing about what `check-worker-origin.mjs` considers a fault was changed, and it was not
weakened.**

It is a reachability heuristic over the import graph, not a proof: an action imported by a component
that is never rendered still counts, and it is module-granular, so one unwrapped action marks its
whole module (which is why the assistant's two read-only modules appear in its output). Both errors
are in the direction of reporting **more** than is really reachable, which is the safe direction for
a fail-closed rule.

## 6. What has to happen before the list can grow

In order, because the first blocks everything:

1. **Wrap the shared header's writes**, or decide the rule tolerates a provably idempotent one. The
   twelve assistant writes are the real work; `setOwnTheme` and `setLocale` are one line each and are
   idempotent by construction. **Half the chrome is worth nothing** — the assistant alone keeps every
   path off the list — so it is one stream, not a piece of several. Worth weighing at the same time:
   a rule of *"every write whose replay could do harm"* would shrink this to the assistant only, but
   that **weakens a safety rule** and is Lutan's call, not a stream's.
2. **Then `/admin/units` is legitimately listed**, and the fourteen addresses in section 2's first
   block can go on the list together.
3. **`management/units` and `management/translations`** unblock three more admin addresses; they
   belong to the `management` (D) stream, which is why section 2's second finding matters for
   sequencing.
4. **`website` (21) and `security` (16)** are the remaining admin conversion work.
5. **`status` and `security/verify`** need a decision each, not a conversion.
6. **Promote `check-wrapped-write-paths.mjs` to a blocking check** once (1) is done.

## 7. The test plan's §7, and the release note

**`n/a`, and there is no line in `unreleased`.** This stream changes no behaviour a shelter user can
see: nothing was added to `WRAPPED_WRITE_PATHS`, so every page still behaves exactly as it did, and
a save during a Pi outage is refused on these screens exactly as before. There is nothing to tell
anybody. Even if a path had been listed, production is behind on `0292` and the Worker has not been
redeployed, so a note would be false until that ships — the fault
`docs/decisions/2026-10-11-release-note-truth-rule.md` was written about after #518.

## 8. Found, not fixed

- **The `/admin/units` breach itself** (section 1). Reported, left on the list, with the reason.
- **Four admin pages reach writes outside `src/app/admin/**`** through shared components
  (section 2). Not touched: the HARD BOUNDARY reserves those files, and the crossing is declared in
  the PR rather than made.
- **`CLAUDE.md`'s "a button is shown only if the login's cards let it do that action" was not
  re-listed for the thirteen pages.** This stream changed how those controls *call*, not whether they
  are *drawn*, and every page's existing gate is untouched — but the rule asks for that list to be
  made before a page is called finished, and this stream did not make it. The same admission is in
  section 7 of the (C) paper for `UnitsTable.tsx`, so it is now two streams deep and worth its own
  pass rather than another note.
- **`sendTestAlertNow` has two `runAction` calls in one function**, one per branch (Pi or Worker).
  Nothing handles that shape; whoever converts `status` needs to know.
