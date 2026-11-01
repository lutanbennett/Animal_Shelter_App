# Three user-facing strings say what the activity is, not which role may do it

2026-11-01, stream `access-wording-fixes` (batch 8). Two backlog items under `## Security`, folded
into one PR because they are the same fault in the same two files: user-facing copy that tells people
what they may do by **naming a role**.

`CLAUDE.md`, *No code may fall back to a role BY NAME*: a shelter must be able to call its roles
whatever it likes, so a sentence read by a login whose role is called something else describes a role
that shelter does not have. One of the three named `staff`, which has not been a role since `0173`.
No check will ever catch this — copy grants nobody anything, so `check-hard-coded-security.mjs` is
right to pass all three. They have to be read for, and three streams have now walked past them.

## What each rewrite claims, and where it was checked

The point of this stream is not the role names. It is that **a sentence about what someone may do is a
claim about the app**, and the third string proves it: it had been wrong about Admin all along. So each
rewrite names the activity the app actually asks, and here is the check.

### 1. `assistant.pageSubtitleReadOnly`

> Before: *"… Recording changes is for staff and management."*
> After: *"… Recording something through the assistant is a separate permission, and this account does
> not have it."*

Claims `assistant.record` is not held. Asked at `src/lib/assistant/data.ts:227`
(`canWrite: can(perms, "assistant.record")`) and read at `src/app/assistant/page.tsx:34`, which picks
this string exactly when `canWrite` is false. *"Recording something through the assistant"* is the
catalogue's own label for `assistant.record` (`en.ts:1084`), so the sentence uses the vocabulary an
Admin sees on Who does what.

### 2. `assistant.volunteerReadOnly`

> Before: *"Volunteers can ask the assistant questions, but recording this one is for staff and
> management. …"*
> After: *"Your account can ask the assistant questions, but recording something through it is a
> separate permission it does not have. Ask someone who can record it, or use the resident's own page."*

Same claim, same activity, and the two halves are exact: this bubble is reached at
`AssistantConversation.tsx:273` (`if (!context.canWrite) return { kind: "readOnly" }`) — after the
sentence parsed as a write — and the login is on the page at all because it can ask. It is deliberately
shaped like its neighbour `notYourCard`, which the backlog item named as the model.

### 3. `admin.whoDoesWhat.description.medical_records` (Cards at a glance)

> Before: *"… and record a death (the record is closed from that day; only Admin can withdraw a death)."*
> After: *"… and record a death (the record is closed from that day; withdrawing it afterwards is a
> separate permission of its own, \"Withdraw a death recorded in error\")."*

Withdrawing asks the ordinary catalogue activity `placement.death_withdraw`, in five places:
`src/app/residents/[id]/deceased/undo/page.tsx:83`, `src/app/residents/[id]/deceased/actions.ts:150`,
`src/lib/placements/deceased.ts:142`, `undo_deceased_placement()`
(`supabase/migrations/0178_perm_functions.sql:542`) and the placement policy
(`0144_perm_convert_residents.sql:127`). **Nothing anywhere asks for Admin.** Admin could do it only
the way Admin can do everything — the `perms.isAdmin` short-circuit in `can.ts` — which is not a rule
about withdrawing a death.

## Why the third one does not say "which this card does not give", although that is true

I could verify it: `medical_records` bundles `placement.death` and not `placement.death_withdraw`, and
neither does its `includes` chain (`view_medical` → `view_residents`) — `src/lib/permissions/cards.ts`,
with a comment on the `residents` card saying it was kept out on purpose. Writing *"which this card
does not give"* would have been accurate today.

I did not write it, because that is the **same shape of sentence that caused this bug**. "Only Admin
can withdraw a death" was also true when it was written; it became false the moment the card set could
change under it. A description that states which cards do not carry an activity has to be kept in step
with `cards.ts` by hand, and nothing checks it. *"A separate permission of its own"* is true for as
long as `placement.death_withdraw` is its own catalogue key, says the useful thing in context (the
heading above it is *What it gives*, so naming something as separate reads as not-included), and
cannot rot. This is the brief's instruction to **write the sentence to say less rather than guess**,
applied to a case where I could have guessed correctly.

## The Thai

All three exist in `th.ts` too and were rewritten with the Thai the dictionary already uses for the
same ideas, rather than new coinages: `บันทึกข้อมูลผ่านผู้ช่วย` and `ถามคำถามผู้ช่วย` are the catalogue's
own Thai labels for `assistant.record` and `assistant.ask` (`th.ts:977-978`), and
`ยกเลิกการเสียชีวิตที่บันทึกผิด` is its label for `placement.death_withdraw` (`th.ts:924`). The sentence
frame follows the neighbouring `notYourCard`, which is already written this way.

`node scripts/check-thai-dictionary.mjs` passes, and both rewritten strings were read off the real
screen in Thai. **That says the Thai is present and renders; it does not say it reads well.** Nobody
here can judge that, so the test plan carries a `pending:` for a Thai reader rather than a tick —
the precedent is `scripts/check-translate-worker.mjs`, which says the same about itself in its own
header.

## Found while driving it: the two assistant strings are not reachable through any card

`node scripts/dev-signin.mjs --cards assistant …` cannot produce the state these two strings describe,
because the `assistant` card bundles **both** `assistant.ask` and `assistant.record`
(`cards.ts:231-239`), and it is the only card that mentions either. So a login that can ask and not
record cannot be made out of cards as they stand — which is a consequence of `0295` folding
`assistant.record` back into the card on 2026-10-31 (Lutan: the assistant *"writes ten kinds of thing
and every one asks assistant.record"*).

Driven with that card, `/assistant` showed the **writing** subtitle, exactly as the code says it should.
So the two rewritten sentences were verified in the dictionary and against the branch that selects them,
**not on screen** — and the honest reason is that the app cannot currently show them to a card-built
login. Whether an Admin can still reach the state by hand was **not established**: the main Who does
what view assigns cards, with *See every activity (Details)* reading as a read-only view, and I did not
open it. Filed on the backlog rather than guessed at.

## Deliberately not changed

- **The key names.** `volunteerReadOnly` still names a role, but a dictionary key is not copy and
  renaming it would touch `AssistantConversation.tsx`, outside this stream's copy-only boundary. Filed.
- **`src/lib/manual/en.ts`**, settled by #1148 the same morning. I read it for the model wording and
  found no surviving role-named sentence in the parts I read.
- **Nineteen-odd other strings** that describe access by naming a role. Listed in the PR and filed as a
  backlog item; eight of them are the `residents.*.notAuthorized` family, every one of which names
  `staff` or `admins` while the code asks a plain catalogue activity.
