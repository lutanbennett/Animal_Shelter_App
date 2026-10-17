# A volunteer's refused-write row is fire-and-forget and carries only what they typed (2026-10-17)

Branch `claude/assistant-refused-row`. The policy (0214, #683) already let a volunteer insert a
`refused` row on their own `assistant_actions` row and read nothing back.

- **Fire-and-forget on both sides.** The browser calls `recordRefusedTurn(...).catch(() => {})` and
  returns without waiting; the server action wraps the insert in try/catch. The polite refusal is the
  feature, the row is bookkeeping, so no failure of the log may change what the volunteer sees. Proved
  by stubbing the server-action fetch to reject: the refusal still read normally.
- **Bare insert, no `.select()`.** Volunteers cannot read the table, so asking for the row back would
  make the write look like it failed for exactly the people it is for.
- **Only the typed text.** `intent` and `draft` are null: they are the keyword parser's guess, not
  something the person said. Request text is stored verbatim, as every other row is. It can contain
  whatever a volunteer chose to type (resident names, occasionally personal detail); how long that
  corpus is kept is the open retention item (DB-11), so no expiry is built here.
- **A separate action, not a wider `recordAssistantTurn`.** That action's status type stays
  `cancelled | unmatched`, so no client path writes any other status under `assistant.ask`.
