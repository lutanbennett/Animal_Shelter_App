# 2026-11-09 — Approving public text: the card, the guard, the reset and the queue (`#7aev4` app half; migration 0345)

**What shipped:** the activity `text.approve`, the card **Approve public text** (`approve_text`, opens `/text/approve`), the database guard on
`text_approval`, the reset-on-edit rule, `text_review_queue()` and `set_text_approval()`, the review screen, and a status bar with the two
buttons on the six record screens. **The default is still `public_ok` and `0217`'s approve-on-save is untouched, so no *new* record is hidden.**
Flipping the default is the next stream's, on purpose (spec points 3 and 6).

## Step zero (the result)

`0343` is applied on dev; nothing in `src/` or `scripts/` read `text_approval`; #1319's work was photos only. The gap was real, so the work went ahead.

## Decisions taken (all reversible, none put to Lutan)

1. **One activity, one card, approving not editing.** `text.approve` (yes/no) is held by `approve_text` and nothing else. The card grants no right to
   edit any record: the spec's own words, *the point of the review is the Director reading it*. Nobody is given the card.
2. **The card applies two functions, not table policies.** A resident's row carries medical and personal columns a reader of public words must not
   be handed, so the card does not get a `select` policy on six tables. `text_review_queue()` returns **only** the public prose columns of the rows
   with no answer yet; `set_text_approval(kind, id, state)` records the answer. Both are `security definer` and refuse at the top unless
   `has_permission('text.approve')`. (Admin passes inside `has_permission()`, unchanged.)
3. **The guard is `text_approval_stamp()`** (the shape of `attachments_approval_stamp()`): a change to `public_ok` or `private_only` needs
   `text.approve` unless there is no `auth.uid()` (a migration or script on the service role, as in `0224`). Setting NULL is always allowed.
   **An INSERT is not guarded**: the default is still `public_ok` and an insert taking the default cannot be told from one naming it. **The flip
   closes it.** Proven in a rolled-back harness (`supabase/harness/0345_text_approval_card_harness.sql`, `HARNESS-OK`).
4. **Reset on edit.** A change to a public prose column with no explicit change of `text_approval` puts it back to NULL and clears the stamp;
   an internal column does not. The column list is the specification's, **completed from the views**: `residents` also carries `good_with_dogs`,
   `good_with_cats`, `good_with_children`, `energy_level`, `breed_th`, `colour_th` (the profile view shows them). **FOR THE PLANNER:** this changes what
   a visitor sees *before* the flip: editing the words of an already-approved record hides it until it is approved again. That is the design and
   the queue now exists, but it is the one place this PR is not invisible to the public.
5. **The queue lists only what the website would show** (resident visible; adoption update shared; appeal published and not draft; event
   published; folder public; drive open or cancelled), plus every one of them with no words at all. A resident with no prose that vanishes
   after the flip is still something to approve.
6. **Public readers need no change.** `localizedField` and `bioLead` already take null and return an empty string. Proved by loading `/adopt` and
   `/r/<code>` on dev with one resident's `text_approval` NULL and another `private_only` (all 200); the rows were put back.
7. **Production check: `node scripts/check-production.mjs appeal-override`** (read-only, guards the decision: it fails and names every published
   non-draft appeal whose animal is not visible, because each goes public on its own through the override). On dev: 0 such appeals.

## Found, not fixed (for the planner to file)

- The status bar is a server component that reads its own row, one extra query per record screen. Cheap, and it asks the table directly, so it
  draws nothing for a login that cannot read the record.
- `projects.folders` screens show the bar on every folder, including top-level ones that the public view never lists.
- Thai text is drafted and unverified (joins `#y1dqu`).
