# The shared header's writes, wrapped — and two of them left the Server Action path instead

Stream `header-writes-wrapped`, 2026-11-01. It exists because of
`docs/decisions/2026-11-01-write-paths-admin-sweep.md` (stream (D) over `src/app/admin/**`),
which found that **no page in this app could go on `WRAPPED_WRITE_PATHS` at all** while the shared
header carried unwrapped writes. `docs/decisions/2026-10-31-write-request-wrapper.md` (stream (C))
is the authority for the wrapper itself.

**The outcome in one line:** every write reachable from the signed-in layout is now either wrapped
in `runWriteAction()` or is no longer a Server Action, `/admin/units` is honestly listed for the
first time, and `scripts/check-wrapped-write-paths.mjs` blocks in CI so it cannot quietly stop
being true.

---

## 1. What the header actually reaches (deliverable 1), and three things that were wrong

**Where I looked**, because the brief was right that nobody had checked: `src/app/layout.tsx` (the
only layout above the app's pages — `src/app/login/layout.tsx` is the other one and is below
`/login`), then every component it renders, then those components' own imports, and finally
`node scripts/check-wrapped-write-paths.mjs`, which walks the import graph and does not care what I
expected to find.

`layout.tsx` renders `HydrationMark`, `I18nProvider`, `ConfirmProvider`, `OfflineBanner`,
`MobileNavProvider`, `PublicPathGate` → `AppHeader`, `PublicPathGate` → `NavPane`, and the page.
`AppHeader` renders `MobileNavToggle` or a Home link, the logo link, `AssistantPanel` (behind
`can(perms, "assistant.ask")`), `LanguageSwitcher`, `AccountMenu` and `SignOutButton`.

| rendered by the layout | reaches | writes | idempotent? |
|---|---|---|---|
| `AppHeader` → `AssistantPanel` → `AssistantCards` | `src/app/assistant/actions.ts` | **10** card writes | **no** — `assistantLogWeight`, `assistantAddPrescription`, `assistantRecordImmunization`, `assistantRecordDeath` each add a row; and **every one of the ten inserts an `assistant_actions` audit row, including on the refusal path** |
| `AppHeader` → `AssistantPanel` → `AssistantConversation` | `src/app/assistant/actions.ts` | **2** — `recordAssistantTurn`, `recordRefusedTurn` | **no** — each is an insert |
| `AppHeader` → `AssistantPanel` → `AssistantConversation` | `src/app/assistant/lookups.ts` | **1** — `assistantLookup` | **no** — an insert, see below |
| `AppHeader` → `AssistantPanel` | `src/app/assistant/interpret.ts` | 0 — `interpretRequest` reads | n/a |
| `AppHeader` → `AssistantPanel` | `src/app/assistant/actions.ts` | 0 — `fetchAssistantContext` reads | n/a |
| `AppHeader` → `AccountMenu` → `ThemePicker` | `src/app/account/theme/actions.ts` | 1 — `setOwnTheme` | yes, a `user_metadata` merge |
| `AppHeader` → `LanguageSwitcher` | `src/lib/i18n/set-locale.ts` | 1 — `setLocale` | yes, a cookie |
| `AppHeader` → `SignOutButton` | — | 0 | n/a — `auth.signOut()` from the **browser** client, not a Server Action, so it POSTs to no page address |
| `NavPane`, `OfflineBanner`, `ConfirmProvider`, `MobileNavToggle`, `HydrationMark`, `PublicPathGate` | — | 0 | n/a |

**So fifteen writes, not fourteen.** Three corrections to what was on record:

- **`ThemePicker` is in the header, but not where the PR body said.** It is not imported by
  `AppHeader.tsx`; it is rendered by `AccountMenu.tsx:116`, and `AppHeader` renders `AccountMenu`.
  The brief was right to flag it as unestablished, and right that the import is not there. The
  conclusion is unchanged — it is on every signed-in address — but by a path one component longer.
- **`src/app/assistant/actions.ts` has 13 exported functions and 12 of them are writes.** The one
  read is `fetchAssistantContext`. #1149's count of 12 was right; I counted rather than inherited
  it, and the two that are easy to miss are `recordAssistantTurn` and `recordRefusedTurn`, which
  return `void` and are called fire-and-forget. A write whose result nobody reads is still a write.
- **`assistantLookup` IS A WRITE, and it was recorded as one of "the assistant's two read
  modules".** `src/app/assistant/lookups.ts:610` calls `logAssistantAction`, which inserts an
  `assistant_actions` row, on every call. The question it answers is read-only; the action is not.
  The sweep paper and #1149's output both have it as a module-granularity false positive, and the
  comment above the function helped — *"a lookup wrote nothing (0070)"*, which is about
  `result_table`/`result_row_id`, not about the row. **This is the one that mattered**: it is
  reachable from the header on every address, it is not idempotent, and it would have been left
  unwrapped by anyone working from either document. The comment now says so in capitals.

## 2. What was wrapped (deliverable 2)

**Thirteen writes, through two places**, because the assistant funnels everything through helpers:

- **`runWrite()` in `src/app/assistant/actions.ts` is the single point all ten card writes pass
  through**, so it is the only place that had to learn the wrapper. The claim sits **outside the
  card check and outside the audit row**, which is the one judgement here worth not re-deriving:
  `logAssistantAction` inserts a row on the refusal path too, so a refused confirm is a write like
  any other, and a replay that re-ran it would leave two rows for one press. `action` is
  `assistant.<intent>` — ten distinct names, so the same id against a different card is refused by
  `claim_write_request()` rather than answered with the other path's result.
- **`recordAssistantTurn` and `recordRefusedTurn`** are wrapped the same way, one action name each.
- **`assistantLookup`** is wrapped around the answer **and** the audit row together, so a replay
  hands back the first attempt's own answer and leaves exactly one row. `LookupResult` was
  deliberately **not** reshaped to `ActionResult`: six helpers in that file and six branches return
  it, so the answer travels back through one line (`wrapped.ok ? wrapped.lookup : …`) instead. The
  card check stays outside the claim — it writes nothing, so a refused lookup spends no id.

On the client, **one `useWriteCall()` per card, never shared**, which is the trap the (C) paper
names and which bit #1149 at `runCardOp`. Two details:

- **`recordLowRisk` dispatches to two different actions** (`assistant.weight` and
  `assistant.immunization`) by `draft.kind`, and it is called from three places. It takes the
  request id as a parameter rather than minting one, so each caller hands in the right action's id.
- **`AssistantConversation`'s four call sites take a FRESH id each time** rather than a kept one.
  This is a departure from `useWriteCall()` and it is deliberate: nothing there can be pressed
  twice — every call is fire-and-forget bookkeeping or a one-shot answer — so there is no retry to
  keep an id for, while a kept id would be spent on the **next** turn and replay this one's answer,
  silently losing that turn's row. The stability rule exists to protect a person's second press;
  where there is no second press it does harm instead of good. The cards, which do have a Confirm,
  keep `useWriteCall()`.

`AssistantResult` gained an `ok` (`{ ok: false; error }` rather than a bare `{ error }`) so a card's
Confirm can go through `useWriteCall()`, which asks for one. Every call site discriminates on
`"error" in result`, which reads the same either way, so nothing else moved.

## 3. The two that resisted, and why they left the Server Action path instead (deliverable 3)

**`setOwnTheme` and `setLocale` could both have been wrapped mechanically. Wrapping either one
would have broken a working control, so neither was.**

The obstacle is the same for both and it is in `0292_write_requests.sql` by design:
`claim_write_request()` **raises** when `auth.uid()` is null, **raises** when `holds_app_role()`
answers false, and `execute` on it is **revoked from `anon`**. `runWriteAction` turns that into
"something went wrong", which is correct fail-closed behaviour for a write — and fatal for these
two, because of **who sees them**:

- **`LanguageSwitcher` is drawn for signed-out visitors** on the public site (`tone="site"`), where
  `anon` cannot call the function at all.
- **`AccountMenu` → `ThemePicker` is drawn for every signed-in login**, because `AppHeader` returns
  null only when there is no user. That includes a login `holds_app_role()` answers false for,
  which reaches `/account/password` to set its first password — that page redirects only when there
  is no user, so the full header is drawn for it.

Read from the migration and the components, not driven: making a role-less login would mean writing
to the shared dev auth, which other streams are signed in to.

**The narrowest fix is not to wrap the write but to move it off the address**, and for both of these
that is available and costs nothing:

- **The theme** is now saved by `supabase.auth.updateUser` from the **browser** client — the same
  call the server action made, under the same session, with no service role, in the shape
  `SignOutButton` already uses for `auth.signOut()`. The read side is untouched: the root layout
  still passes the value through `parseTheme()`, so a tampered one renders as the default.
  `revalidatePath("/", "layout")` becomes `router.refresh()`.
- **The language** is now a `document.cookie` write. The cookie has never been `httpOnly` — not in
  the old `set-locale.ts` and not in `src/proxy.ts` — so the browser already owned it, and
  `getLocale()` still passes it through `isLocale()`. The attributes live in one pure
  `localeCookie()` beside the proxy's, so the two cannot drift.

**This is stronger than wrapping, not weaker.** A wrapped write still reaches the address and relies
on the database to refuse the second application; these two are no longer reachable at any address,
so there is nothing for the Worker to replay. **Nothing is granted by either change** and no server
or database check was removed: both values were always the caller's own, and both are still
validated where they are read.

`src/app/account/theme/actions.ts` and `src/lib/i18n/set-locale.ts` are deleted; each had exactly
one caller.

**What I did NOT do:** exempt either on the grounds that a replay is harmless. Both are idempotent,
and section 6 of the sweep paper is explicit that a rule of *"every write whose replay could do
harm"* weakens a safety rule and is **Lutan's call, not a stream's**. It was not put to him and it
was not quietly adopted.

## 4. `/admin/units` can honestly stay on the list (deliverable 4)

**Yes, and it is proven rather than asserted.** `node scripts/check-wrapped-write-paths.mjs`:

```
LISTED /admin/units  (complete)
    ok   src/app/admin/units/actions.ts  createUnit, updateUnit, setUnitArchived
    ok   src/app/assistant/actions.ts    (13 exports)
    read src/app/assistant/interpret.ts  interpretRequest
    ok   src/app/assistant/lookups.ts    assistantLookup

every path on WRAPPED_WRITE_PATHS has all its reachable writes wrapped (1 listed)
```

The entry was in breach when this stream started and is not now. **Nothing was added to the list**:
the brief's boundary is the header, and listing more paths is the next stream's judgement to make
with the check in hand. `scripts/check-worker-origin.mjs:204` was **not touched** — its non-empty
assertion never came into play, because the honest answer turned out to be "keep the entry and make
it true" rather than "empty the list".

## 5. The check blocks now (deliverable 5), and it had to learn what a read is

`scripts/check-wrapped-write-paths.mjs` is its own CI job, `wrapped-write-paths`, and exits 1 on a
listed path with an unwrapped write. Two changes were needed first, because the check's test — *does
the module's source call `runWriteAction()`* — is a proxy for the rule, not the rule:

- **A read-only `"use server"` module may declare itself**, `// write-requests: read-only -- <why>`,
  and `src/app/assistant/interpret.ts` does. The test cannot tell a read-only action module from one
  with an unwrapped write, because neither calls the wrapper; and **a read is safe to replay by
  construction**, since the Worker's rule is method plus path (`mayReplayWrite`), so it replays every
  POST on a listed path and a POST that writes nothing can be replayed all day.
  **The declaration is an assertion, guarded rather than proved.** A module that declares it and
  shows `.insert(`, `.update(`, `.upsert(`, `.delete(` or `.updateUser(` is refused loudly and the
  declaration counts for nothing; every run prints which modules used one, so a declaration can
  never quietly become the reason a path is listed. **What the guard does not see is a write inside
  an imported helper** — the same limit the rest of the script has, and exactly how `assistantLookup`
  hid. That is why a declaration carries a reason someone can check by reading.
- **Comments are stripped before looking for the call**, so prose naming `runWriteAction()` is not
  mistaken for calling it. Without this the declaring module read as *wrapped*, since its own
  declaration names the function — and so would any file that explains itself in a comment, which in
  this repo is all of them.

**Both guards were probed, not assumed.** Giving `interpret.ts` an `.insert(` produced
`declares read-only but calls .insert(` and exit 1; removing the real call from `lookups.ts` while
leaving its prose flipped it to `NOT` and exit 1.

## 6. Does this close the release-procedure item? It narrows it; it does not close it (deliverable 6)

The item is *"applying `0292` to production is what makes the header double-write live"* under
`## Security`. **Its title is now false and its hazard is gone**, so the title is rewritten in this
PR; the item stays open for what is left.

Its "done when" has two halves. The first — *"either the list cannot be in breach at deploy
time"* — **is closed**: the list is not in breach, and `wrapped-write-paths` blocks in CI, so it
cannot become so without a red build. Applying `0292` and deploying now opens nothing. The second —
*"the paragraph at line 371 is corrected so it no longer reads as all-clear in both directions"* —
**is not**, and it is the whole of what remains.

That paragraph (`docs/release-procedure.md`, around line 371) explains why deploying the wrapper
code *without* `0292` is unsafe. That was always true and still is. What has changed is that the
direction it was silent about is no longer dangerous, so it is now merely **incomplete** rather than
misleading: a release manager is not told that the whole-page rule is machine-checked, or which
check carries it. That is worth one paragraph and it is a doc edit of a different kind, which the
brief reserved for its own PR. **I did not edit `docs/release-procedure.md`.**

## 7. Proof (deliverable 7)

Driven in the browser pane on dev, port 3002, as a login holding **only** the cards `assistant`,
`record_weight`, `view_residents` — `node scripts/dev-signin.mjs --cards …`, no role. The Assistant
button was drawn for it, which is the card gate doing its job and unchanged by this stream.

Reached `/residents` by clicking through from `/my`, with `requestAnimationFrame` confirmed firing
first (a direct load gives `never`, and the brief's warning about the pane is real).

1. **The header's writes POST to the page's own address.** Three POSTs went to `/residents` while
   the assistant was used there: `fetchAssistantContext` (body `[]`), `interpretRequest`, and
   `assistantLogWeight`. **Only the write carried a request id** — the two reads carried none, which
   is the right shape.
2. **The id travels.** The weight POST carried
   `"requestId":"3b6c64e1-a280-476d-962d-e448e1618100"`, a v4 uuid, and the panel answered
   *"Done — Angsumalin (R-0055) recorded at 12.34 kg on 1 Nov 2026."*
3. **A replay returns the first result and never runs the write again.** The identical request
   re-sent, exactly as the Worker would after a failed Pi attempt, answered `{"ok":true}` — the
   **stored** first result.
4. **The control that makes (3) mean anything.** The same request with a **fresh** id answered
   `{"ok":false,"error":"A weight is already recorded for this resident on that day…"}`. So the body
   genuinely does run for a new id: (3) short-circuited before the body rather than the one-per-day
   rule quietly doing the work.
5. **The rows agree.** The resident's Weight History shows **one** `12.34 kg` row for 1 Nov 2026,
   *"via the assistant"*. The replay created none.
6. **`assistantLookup` too, and with a sharper control.** A *"Where is Angsumalin?"* POST carried its
   own id. Re-sent with **the same id but asking about a different resident**, it answered about
   **Angsumalin** — the stored result, the new question never looked at, so the body (and its audit
   insert) did not run. Re-sent with a **fresh** id and the same new question, it answered about
   **Walkassistant**. Both directions, on the write nobody had spotted.
7. `node scripts/prove-write-requests.mjs` passes. `node scripts/check-worker-origin.mjs` passes,
   all cases. `node scripts/gates.mjs`: typecheck, lint, test (412), build.

**Nothing was widened.** No card gate, server check or database policy was changed; the controls are
drawn for exactly the logins they were drawn for before, and the writes refuse exactly as before.
This stream changed how writes *call*, not who may make them.

**A correction to the (C) sweep's measurement note, because it cost that stream a pass.** It records
that patching `window.fetch` to read Server Action POST bodies breaks React's streaming response.
**It is reading the RESPONSE that breaks it, not the patch.** A patch that inspects `init.body` and
returns `real(input, init)` untouched captured every POST here while the actions kept working
normally — the weight was recorded with the patch in place. Capture the request; never clone or wrap
the response.

**Left on dev:** one weight row for Angsumalin (12.34 kg, 1 Nov 2026) and some
`assistant_actions` rows. Dev rows are disposable, and deleting them would be more writes with no
proof value.

## 8. Found, not fixed

- **`CLAUDE.md`'s "a button is shown only if the login's cards let it do that action" was not
  re-listed** for the header's controls. This stream changed how they call, not whether they are
  drawn, and every existing gate is untouched — but the rule asks for that list before a page is
  called finished, and I did not make it. **This is now the third stream to say so** ((C) section 7
  for `UnitsTable.tsx`, the sweep's section 8 for thirteen pages, and here), which is past the point
  where another note helps; there is a backlog item for the sweep and the header's controls belong
  in it.
- **A login holding an assistant card on a role `holds_app_role()` answers false for would now be
  refused at the claim.** `my_permissions()` does not exclude such a role, so this is reachable in
  principle; `src/app/admin/security/actions.ts:314` and `UsersTable.tsx:149` make it very hard to
  arrange, and the failure is fail-closed (nothing is written; the person is told something went
  wrong). Named rather than designed around, because the alternative is reasoning about the claim's
  gate, which is `0292`'s and not this stream's.
- **The assistant's audit row is written by the same session that makes the write, inside the
  claim.** That is what makes the replay leave one row. It also means a wrapper failure costs the
  audit row as well as the write, which is the right trade (no write, no row) but is worth knowing.
- **`scripts/check-wrapped-write-paths.mjs` still cannot see a write inside an imported helper.**
  Named in section 5; it is the gap that hid `assistantLookup`, and the read-only declaration does
  not close it.
