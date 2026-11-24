# Who can run a proof line (#o5glo)

`--proofs` (`#prvln`, PR #1871) said whether a proof line is a command, a screen or a query. It did not say
whether the **reader** can run it, and its first live use told a planner to run *"on a phone, open `/reels`"*.
Neither way out is acceptable: claim a proof nobody ran, or ask Lutan for work he may have done.

## The groups (a second axis; the first is untouched)

Only lines already classed as runnable are split. **NOT A COMMAND** stays as it was.

| Group | Means | The planner does |
|---|---|---|
| `worktree` | a script, query or repo read that works from any checkout | runs it, says what it showed |
| `reach` | needs production, the Pi, a hosted dashboard or wrangler | runs it if this session reaches it; otherwise names it as his with the proof quoted |
| `person` | a phone, a place, a screen only he is signed in to | names it as his, proof quoted, **never reported as checked** |

Live list, 2026-11-24: 1 worktree (`#plsso`), 3 reach (`#pimir`, `#shfil`, `#drvcl`), 6 person
(`#rqv5c`, `#rlbat`, `#rlprg`, `#cjseo`, plus `#stpbk` and `#gidty` which the inference could not place).
`#gidty` is `reach` by the planner's reading; the printer cannot tell a dashboard a session can open from one
it cannot, so it says "could not tell" and the cautious group.

## Where the class is declared

**Both, with a refusal on the declared form.** A proof line may open `**Proof:** [who: worktree|reach|person] ...`;
the strict check (`check-backlog-waiting.mjs`, run by `check-backlog-sections.mjs` in CI) **fails on an unknown
value**, so a typo cannot place a line silently. With no marker the group is **inferred from the line's own
words** (`scripts/lib/backlog-waiting.mjs`, `proofWho`), in this order: person words, then Pi/ssh/wrangler/
`--env production`, then a repo command in backticks, then weaker reach words (dashboard, production, `/api/`).
**A line the inference cannot place goes to `person` and is printed `[could not tell who can run it]`**: the most
cautious group, never the most convenient. Inference alone was rejected because it rots silently when a line is
reworded; a marker alone was rejected because it would force every existing line to be rewritten first. No line
was rewritten here, and the marker is there for the day a misplacement matters.

## A second `**Proof:**` in one item

`#pacon` carried two, so the printer showed the stale one beside a tag that contradicted it. **Chosen: a warning**, in both `--proofs` (names the item and the count) and the strict check (reported, exit 0). First built as an error, and CI went red on PR #1875: `main` still carried `#pacon`'s two passages, because the planner's fix sits on the `backlog` branch until the daily merge, so an error would turn every PR red for that lag. A warning cannot do that, and `--proofs` is what the planner reads before naming him.

## Deliberately not automated

The printer never executes anything. It does not decide whether a *session* reaches the Pi or a dashboard: that
depends on the session, so `reach` asks the planner to try, and to say so if it cannot.

`SKILL.md` section 6 gained one sentence; to pay for it, the parenthetical *"Unticking is indistinguishable from
not meaning to tick"* became `(reference.md 5b.)` (the story is already in `reference.md`).
