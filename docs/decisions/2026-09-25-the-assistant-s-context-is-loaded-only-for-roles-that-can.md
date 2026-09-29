# 2026-09-25 — The Assistant's context is loaded only for roles that can use it

- **`fetchAssistantContext` checks the role itself.** It is a server action,
  so anyone signed in can call it whether or not they have the button. It
  now answers a role outside `canUseAssistant` with an empty context and
  `t.assistant.notAuthorized` in `error`, the way `assistantLookup` does.
  The gap was real: on dev a vet's own RLS lets them read 81 residents, 5
  vets, 69 enclosures and 16 zones (rolled-back harness, 2026-09-25), and
  the action handed all of it to them. A signed-out caller can reach it too,
  by posting the action to a public path such as `/login`, but anon can read
  none of those tables, so that was never a leak.
- **`/assistant` skips the load for those roles as well.** For a vet the
  page renders only the "can't use the assistant" note and the read-only
  subtitle. Neither uses the rows, so every query behind them was thrown
  away. The rows never reached the browser, because `AssistantConversation`
  was not rendered, so this is tidiness rather than a second fix.
- **`loadAssistantContext` takes the role instead of fetching it.** The
  caller already needs the role to decide whether to load. Passing it in
  means one `current_user_role` call per load, not two, and the gate cannot
  drift from the role the context reports. The helper does no check of its
  own, and its comment says so. The cost is that the role call now runs
  before the other queries instead of alongside them: one extra round trip
  when the panel opens.
- **`recordAssistantTurn` still has no role check, deliberately.** It only
  inserts into `assistant_actions`, and 0070 gives the vet role no insert
  policy there, so RLS already refuses it.
