# 2026-11-26: the console's Thai is accepted, not read

The weekly Thai read of 2026-11-26 met 894 strings — more than double the first run's 417 — because
the product-administrator console shipped the day before. Measured, not estimated: **664 of them were
the `admin` section, of which 315 are the public CooperJaidee About and feature pages and ~349 are
labels inside the console.** (A first count said the About page was 76; the grouping command had
dropped every key containing `[0]`, which is most of the sample-card wording. Count with a script
that keeps bracketed keys.)

## The decision

Lutan, asked nothing — he said it unprompted while the batches were running:

> *"for the console translation, just apply whatever you reccomend as it will prettty much just be
> english people administering it"*

So the ~349 console strings are **accepted as they stand**. No reader time is spent on them.

## What "accepted" must not be allowed to mean

**It does not mean a person read them, and no Thai was rewritten on that instruction.** Both of those
would have been easy and both would have been wrong:

- **Rewriting** would mean editing Thai that nobody present can read, which `docs/thai-read-routine.md`
  forbids in terms — *"Nobody edits Thai they cannot read: the reader supplies the wording"* — and the
  result would look like an improvement in the diff while being unverifiable.
- **Recording them as read** would corrupt the one file whose entire purpose is to say which strings a
  person has looked at. `check-thai-dictionary.mjs` already proves a Thai entry exists for every
  English one; it has never proved anyone read it, and that gap is why the routine exists.

`docs/thai-read-progress.md` therefore records them under their own heading as accepted, with the
reason, and names what would reopen them: **a Thai-reading product administrator.** The next run's
`--skip-read` range skips them along with everything genuinely read, and the progress file says so
out loud, because that range is the one place where "skipped" and "read by a person" part company.

## Why the reader's time went where it did

The 315 public strings are what a shelter considering CooperJaidee reads before it trusts the system.
The console's labels are seen by one or two administrators who read English. Reading the public pages
in one sitting also found two faults that no per-string check could: the same sample card worded
differently on two pages, and the sample cat spelled two ways. **Both were only visible because the
pages were read together**, which is an argument for keeping the public pages in a single run rather
than splitting them across weeks.
