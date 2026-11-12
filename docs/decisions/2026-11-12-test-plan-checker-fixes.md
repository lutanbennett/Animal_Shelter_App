# Test-plan checker: two holes closed (#up3vf reopened, #yiozr)

**2026-11-12, `claude/test-plan-checker-fixes`.** Only `scripts/check-test-plan.mjs` and its fixtures changed.

## #up3vf

- **Extension A (fence).** A fence under a *ticked* line now also fails on any `NAME_HERE` stand-in
  (`GATES_HERE` was one) and on `<N>`, the gates line's own placeholder, which a real run never prints.
  The template has no `*_HERE` token; `<N>` is the only placeholder inside the gates line. Over all 1407
  plans: 2 hits, both correct (`adoption-updates-schema`, `planner-handover-411`).
- **Extension B (header SHA).** "Merged" is decided by the plan file already existing at the merge-base
  (`git cat-file -e <merge-base>:<plan>`). Such a plan is only *read* when a PR edits it, so an old merged
  plan nobody touches cannot turn `main` red, and **no merged plan is retrofitted**. If a sign-off PR does
  edit one with a blank/placeholder SHA, it fails until the header holds a commit or `n/a: <reason>`.
  Blind spots: a merged plan nobody edits is never judged (14 on main have a blank/placeholder SHA today,
  `adoption-updates-schema` among them); a plan merged without ever being on the base ref the PR sees
  (stale `origin/main`) reads as new, i.e. still "being written". Rejected: a dated exemption register,
  because nothing is judged unless edited, so there is nothing to exempt.

## #yiozr

`--base origin/main` changes nothing: with no flag the base is `origin/main` too (or `origin/$GITHUB_BASE_REF`
in CI). Run on #1488's plan at its pre-fix commit, both forms printed identical output, so the recorded
disagreement did not reproduce. What *can* differ between a local run and CI is the input: locally an
uncommitted plan edit is read from disk (CI sees only committed text), and a stale `origin/main` shifts the
diff. The script now prints its base, merge-base, any uncommitted plan edits it included, and that it does not
check that `origin/main` is current. Authoritative behaviour unchanged.
