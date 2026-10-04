# The manual-verification queue

`node scripts/verification-queue.mjs` reads every plan in `docs/test-plans/`
carrying `Manual verification by: pending` and sorts what is in them. This file
is the reading of it on **2026-10-03**, and the argument that came out of it.
Re-run the script rather than trusting the numbers below: a hand-written list
going stale is the failure this document is about.

```
plans with an unsigned manual-verification line: 151   (of 260)
items in them: 456
of which security-flavoured: 35
oldest: 2026-09-24
```

Only **40** plans have ever carried a human signature.

## The queue is not noise, and that was the surprise

The reasonable guess — made by QA and by me — was that most of those 151 plans
had an empty handover table and should have been `n/a: <reason>` at the time.
That is **not** what is there: exactly **2** of the 151 have an empty table.
The other 149 wrote down real items and then never closed them.

## It holds three different kinds of thing, and only one is verification

| kind | count | what it is |
|---|---|---|
| `work` | 14 | a task someone must **do**, written as if it were a check |
| `deploy` | 20 | a release-time gate that belongs in section 8, not in this table |
| `read` | 48 | read a document, agree a recommendation, answer an open question |
| `look` | 374 | a person at a screen, a phone, or a page in Thai |

`look` over-collects — it is the fallback bucket, and the classification is by
regex over each item's own words, so it sorts rather than judges.

### The 14 `work` rows are the finding

These were never checks. They are tasks, and filing a task in a queue of checks
is how it stays undone: a list headed "left for manual verification" is read, if
it is read at all, as things to confirm, not things to perform. Several are
production security settings from the shelter's own assessment:

| | from | still open? |
|---|---|---|
| **Turn off open sign-up, or restrict Google sign-in to the shelter's domain — dev *and* production** (WEB-3) | `signup-bounds-and-mfa` 2026-10-01, repeated in `signup-bounds-two-step` 2026-10-02 | written twice in two days and not done either time |
| **Turn on leaked-password protection — dev and production** | `code-hardening-batch` 2026-10-01 | — |
| **Authentication → Sessions → inactivity timeout = 60 days** | `session-inactivity-timeout` 2026-10-01 | — |
| **Generate the backup key pair on Lutan's own machine, store it in the password manager, delete the file** | `backup-encryption` 2026-09-30 | the feature shipped in `0.14.0`; the custody step is a separate act |
| **Rotate what was exposed** — password hashes, TOTP secrets, refresh tokens | `backup-encryption` 2026-09-30 | `0.14.0` signed everyone out, which covers sessions; re-enrolment was a separate question |
| Enrol a real authenticator app and sign in with it; the same step-up after a Google sign-in | `security-2fa` 2026-09-27 | — |
| Add repository secrets `TEST_SUPABASE_URL`, `TEST_SUPABASE_ANON_KEY`, `TEST_SUPABASE_SERVICE_ROLE_KEY` | `schema-placement-lifecycle` 2026-10-01 | **closable — this one is done.** See below |

Whether each is still open is stated from the plan, not from the console. The
console is Lutan's; nothing here reads or changes production auth settings.

### At least one row is already satisfied and was never signed

`schema-placement-lifecycle` and `ci-public-views-secrets` both say the
`public-views` CI job passes without running until three repository secrets
exist. It runs. In workflow run `37118893021` (PR #328, 2026-10-03) the job
produced real output against a live database:

```
public-views  ok    audit_log: anon POST is refused — HTTP 401
public-views  ok    is_public_drive_file(): yes for a public resident photo — true
public-views  skip  is_public_drive_file(): no non-image attachment in a public project folder to ask about
```

A skipped-for-want-of-secrets job does not print `ok` lines for a database it
cannot reach. So those rows can be closed on the evidence, by whoever owns the
plan — and that is worth knowing about the rest of the queue too: an unknown
number of the 456 are already true.

### 20 rows are in the wrong place by the template's own rule

`docs/test-plan-template.md` says plainly that a deploy-time check does **not**
belong in the handover table: it has its own `deferred: <owner>` state in
section 8, and listing it in both gives it a second home that nothing closes.
It names five release-cut plans that accumulated permanently-open rows exactly
that way on 2026-09-27. There are 20 such rows now.

## Why this queue never drains

The per-PR `pending:` line has never once stopped a release. It is not that the
rule is weak — `docs/test-plan-template.md` states it as flatly as it could
("**Nothing ships on a `pending:`**") — it is that nothing enforces it and
nobody reads it. CI is correct to exit 0 on a `pending:`; a check that is
permanently red is one people filter. So the line is written, the release ships,
the gap is recorded, and the item joins 455 others.

Meanwhile the bugs that actually get found come from somewhere else entirely.
The microchip scan returning "0 residents", the blood test refused on save, the
midnight-to-7am date refusals — all three came from **role dry runs** (#314,
#318), none from a per-PR sign-off. The effective control is unscheduled and
informal; the formal one generates 456 rows a year and catches nothing.

## What to do about it — Lutan's call, not a session's

Three changes, smallest first. **None of them is implemented here**, and the
third deliberately is not:

1. **Split the queue by kind at the point of writing.** A task goes in
   `docs/backlog.md` with an owner, where things get done. The handover table
   keeps only "a person must look at this", and a deploy gate stays in section 8
   where the template already puts it. That alone removes 34 of the 456 from the
   wrong list, including every production security setting above.
2. **Let the dry run sign.** The role dry runs already exercise the app the way
   the per-PR items describe, and they already produce findings. If a dry-run
   report covered a feature, let it sign that feature's line, rather than asking
   for a per-PR browser pass nobody will make.
3. **Promoting `test-plan` to a required check is Lutan's decision and no
   session's to make.** `CLAUDE.md` records it as a staged rollout — "see how we
   go, and if it is working smoothly then we can change to a hard block". The
   evidence above is an argument for revisiting that. It is not permission, and
   nothing in this PR changes what the checker enforces or what branch
   protection requires.

## A small inconsistency found on the way

`walkthrough-vet-pass-update.md` writes `Manual verification by: pending — …`
with an em dash where the template says `pending: <what>`. `check-test-plan.mjs`
accepts it, so it is in the queue but would be missed by a stricter reader. The
script here matches `pending` with or without the colon for that reason.
