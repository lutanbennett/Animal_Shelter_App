# The test-plan template quotes four gates, and the checker stays silent on purpose

2026-11-02, stream `test-plan-template-four-gates`.

## The fault

Section 2 of `docs/test-plan-template.md` said `gates.mjs` ends
`gates: typecheck=0 lint=0 build=0`. The script prints four gates
(`typecheck lint test build`) and `CLAUDE.md` says four. Every brief says the
template wins a disagreement, so a stream was told to trust the wrong string.

## What changed

- Section 2 now describes the shape `gates: typecheck=<N> lint=<N> test=<N> build=<N>`, read from the
  script's real `console.log` (`scripts/gates.mjs:109`), and says all four must be `0`.
- It asks for the `=== gates: <name> exited <N> after <S>s` lines as well, and says never to type the final line.
- "all three gates" in the prose and "runs the same three" on the CI line now say four.

## Deliverable 2: can a pasted-but-unrun block be detected? Judgement: no check; the wording is the guard

- **The template was its own answer key.** The old line printed a string a passing run produces, so a stream
  could copy it. The fix is to stop printing a copyable line: the template shows a redacted shape with `<N>`
  placeholders, and a literal paste of it is already caught by `check-test-plan.mjs`'s `FENCE_PLACEHOLDER`
  only if it contains the stand-in words; `<N>` is not one, so the shape alone is not machine-detected.
- **"Not identical to the template's example" is now moot**: there is no example line to be identical to.
- **A real detector would need to know what a run on this commit prints.** The checker would have to re-run
  a five-minute build or compare against CI output. It reads a markdown file in about a second. The only
  cheap check is a format check (four `name=N` pairs, all `0`), and that is exactly what a fabricator types.
  It would add false confidence and a rule that can fail a faithful paste (a failed gate legitimately
  prints non-zero), and `CLAUDE.md` is explicit that this checker's strictness must not be loosened or
  reshaped lightly. So `scripts/check-test-plan.mjs` is **unchanged**; its silence is deliberate.
- The remaining weakness is honest: a stream that invents the whole block still passes. The Automated
  checks signature is where that is meant to be held, and the template now says so.

## Deliverable 3: other command output in the template

Checked against the producing script: `deploy: production → Supabase project <ref>` (`deploy.mjs:258`),
`strip-baked-env: removed N env var(s) from the Worker bundle` (`strip-baked-env.mjs:37`), the
`apply-migrations.mjs` flags `--status`, `--dry-run`, `--drift`, and `worktree.mjs sync`. All still match.
Not a script output but stale: the role matrix still lists `staff` (retired, `0173`) and the section 1
roles line says "staff / resident"; left for the planner to file, outside this item.

## Deliverable 4: other quoters of the three-gate string

Searched `lint=0 build=0`, `typecheck=0 lint`, `three gates`, `all three`, `same three` over the repo
excluding `node_modules`, `.next`, `.git`, `docs/decisions`, `docs/test-plans`, `docs/releases`.
Live instructions: only the template. `.claude/skills/plan-day/SKILL.md` has the same drift in its own
words and is the planner's file (not touched). Old plans and decisions are records, left as they are.
A grep that finds nothing is not proof of absence; this one covers those literal phrases only.
