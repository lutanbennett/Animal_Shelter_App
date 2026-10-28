# The aal1 reachability list stays prose; fenced-block check added; CLAUDE.md behaviour claims dated

2026-10-28, stream `docs-and-checker-quick-wins`.

## Fenced blocks in test plans
`check-test-plan.mjs` now fails an empty fenced block, or one holding `PLACEHOLDER`, `TODO`, `<paste`
or `xxx`, when it sits under a **ticked** checklist line, and names that line. Case-sensitive, because
`cut-release-0-23-0.md` pastes real guard output containing the lowercase word "placeholder". Fences
under `n/a:`, `pending:` or unticked lines are not read. `node scripts/check-test-plan.mjs --fences-all`
reads every plan: 947 read, one fires, `planner-handover-411.md` (left as it is, per the brief).
Unsigned plans still exit 0; nothing about `continue-on-error` or advisory status changed.

## CLAUDE.md behaviour claims
Checked on 2026-10-28 against the code: the `can.ts` Admin short-circuit (it is on line 69, not 67, so
the cited line number is gone in favour of a grep), `has_permission()`'s `key = 'admin'` in 0196, the
`roles.is_admin` column in 0275, the audit job never running on a PR (`deps-changed` is only printed,
never written to `GITHUB_OUTPUT`: still true, now with the grep to re-check it), `cardTile()`,
`role-cards-coverage`, the three git hooks, the `dev-signin.mjs` flags, and the registry file's
`outsideTheCardSystem` / `stillDecidesAccess` keys. Not checked: the live production claims (production
role cards, Admin holding none) and Cloudflare/Supabase settings; they need a production read and are
unverified here. No decision in CLAUDE.md was changed.

## Why the aal1 list is not a script
Re-measuring it needs a signed-in dev session, a running dev server and clicks through each page, and
presses write to the dev database every stream shares. It could not run in CI, and a script that quietly
goes stale is the same fault as the prose. Prose with a date and the instruction to re-measure is the
honest form. Revisit only if a driven-page check becomes cheap.
