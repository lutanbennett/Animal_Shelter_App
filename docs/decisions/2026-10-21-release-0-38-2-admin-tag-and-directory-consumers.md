# 2026-10-21 — `0.38.2`: a note tagged at the cut, and a consumer check that always warns

Two things from cutting `0.38.2`, recorded because neither is obvious from the diff.

## A release note was tagged at the cut, which is unusual and should stay unusual

The nightly-job note arrived in `unreleased` untagged. An untagged note is shown to
every live role, and this one describes a tile on `/admin/status` and an email that
goes to admins — a page `volunteer` and `second_in_command` cannot open and a mail
they are not on. Put to Lutan with the alternative stated; **he chose to tag it
`admin`.**

**Why this is not a precedent for editing notes at the cut.** The runbook's own
verification exists to prove the cut did *not* alter a note, and `0.38.1`'s plan
records the notes as carried "byte-identical" for that reason. The distinction that
makes this safe:

- **The text was not touched.** Only `roles` was added, and the verification asserts
  the three texts byte-identical *and* that exactly one note's tags changed, with
  the other two proved still untagged. A tag change is visible to the check rather
  than hidden by it.
- **Narrowing is the recoverable direction.** A wrong tag hides a note from people
  it is for; an untagged note merely tells someone about a page that is not theirs.
  The second is the lesser fault, which is why `src/lib/releases.ts` says to tag a
  line "only when it is plainly not for some role". This one is plainly not.

**The rule to carry forward is about where the tag belongs, not whether to tag.**
A note's role tag is the feature PR's job, because that is where someone knows who
the feature is for. Tagging at the cut worked here because the mismatch was stark,
but it means the release manager is making a judgement the feature author was better
placed to make. **If this recurs, fix it in the feature plan's release-notes line
rather than at the cut** — the line already asks whether a shelter user would
notice, and "which shelter users" is the same question.

Measured, not assumed: coverage is now admin 3 and every other live role 2, so no
role opens `/releases` to an empty section — unlike `0.38.1`, where two roles saw
nothing and the record had to say so.

## A directory-valued `-- consumer:` path can never read `live`

`scripts/lib/migration-consumers.mjs` decides whether a migration's declared reader
was already live by comparing the file at two refs:

```js
const read = (ref, path) => spawnSync("git", ["show", `${ref}:${path}`], …);
…
return atRelease === onMain ? "live" : "differs";
```

For a **file** that works. For a **directory** `git show` prints a tree listing
whose first line is `tree <ref>:<path>/` — which embeds the ref. So the two texts
differ whenever the refs differ, which is always, and the path reports `differs`
however little changed inside it.

**Proved rather than inferred.** `worker/` is a declared consumer of `0236` and has
**zero** changed files between `1de7bdb4` and `f2773d25` (`git diff --name-only`
empty), yet it reports `differs`. Four of this release's nine predicted warnings are
directory paths of this kind: `src/app/clinic-visits/`, `src/app/admin/status/`,
`worker/` and `src/app/admin/website/`.

A second, quieter consequence of the same mechanism: a tree listing holds only
names. Even if the ref were not embedded, a directory whose file *contents* changed
but whose file *names* did not would read `live`. **So for directories the check is
not merely noisy, it is wrong in both directions.**

### Why this is being recorded rather than fixed here

It never blocks and never changes what is applied — `consumerReport` only ever
warns, by design (`docs/decisions/2026-10-02-migration-consumer-header.md`). So it
is noise, not risk, and a release is the wrong place to change the behaviour of a
release-time check.

But it is noise in exactly the signal that decision added to catch a real ordering
fault, and **a check that always warns is one people stop reading** — which is the
same failure the `test-plan` job's `continue-on-error` history is about. Filed on
the `backlog` branch.

**Two things the fix should not do**, written down because they are the tempting
ones. It should not start *inferring* consumers from the SQL — that was considered
and rejected in the 2026-10-02 decision, and nothing here reopens it. And it should
not simply make directory paths silent, which would trade a vacuous warning for a
vacuous `live`. The honest options are to resolve a directory to the set of files
under it and compare each, or to report a directory as its own state — something
like "declares a directory, which this cannot check" — so the sentence matches what
is actually known. That is the shape of the choice; the choice itself is not made
here.
