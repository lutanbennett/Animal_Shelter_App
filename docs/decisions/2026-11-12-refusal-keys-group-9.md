# Refusal keys, group 9: the three unkeyed forwarded-and-masked functions (#3nuwy)

`merge_doctors` (live in `0264`), `set_role_cards` (`0272`) and `record_attachment` (`0314`) now raise keys. Migration `0365`;
each body is the live one with only its raise lines changed, generated from those files by a script that **asserted its match
count on every substitution** rather than retyped, and diffed back against the originals to confirm nothing else moved. The
planner's table named `0264`/`0272`/`0314` and the measuring tool agrees, so no body was taken from a superseded file.

This is the group the item's own closing instruction said must be **sized by caller file rather than by function count**, and
that is why it is three functions: `record_attachment` alone is called from nine files.

## Count: 15 raises, 14 keys

Prefixes **`merge.`** for the doctors (joining group 8's merge vocabulary), **`role_cards.`** and **`attachment.`**. Per-kind
keys throughout, following group 8's finding that **Thai cannot be built by dropping a noun into an English frame** — no shared
sentence with a `%` noun in it.

| function | raises | keys |
|---|---|---|
| `merge_doctors` | 5 | `merge.doctors_not_allowed`, `…_not_found`, `…_both_have_logins`, `…_login_admin_only` |
| `set_role_cards` | 3 | `role_cards.card_twice`, `role_cards.needs_an_approver_first`, `role_cards.last_approver` |
| `record_attachment` | 7 | `attachment.purpose_invalid`, `…_media_kind_invalid`, `…_add_not_allowed`, `…_event_not_found`, `…_medical_folder_not_allowed`, `…_shelter_folder_only`, `…_update_not_this_residents` |

**15 raises but 14 keys:** `merge_doctors` raises *"Not allowed to merge doctors."* twice — once as the up-front
`has_permission('clinics.doctors')` check and once after a delete that row-level security filtered. One sentence, one SQLSTATE,
one meaning to the reader, so they share `merge.doctors_not_allowed`. Two keys with identical wording would be noise.

`role_cards.last_approver` is the only parameterised key in the group: `detail = json_build_object('roles', v_holders)`, replacing
the `%` the sentence used to interpolate.

**Every existing SQLSTATE is kept.** `merge_doctors` and `set_role_cards` name their own (`insufficient_privilege`,
`no_data_found`, `check_violation`, `unique_violation`); `record_attachment`'s raises are bare, so it stays on the default
`P0001`, as `0363`'s did. `dbRefusal()` matches on the key rather than the code, but an unconverted reader and the policies still
see what they saw before.

## `0262`'s security-definer rule

`record_attachment` is `security definer`, which group 8 had no instance of. Its permission is still resolved entirely through
`has_permission()`, `bill_owner_can()` and `can_publish_resident_photos()`; not one of those lines is touched, only the message
text of the raises, and no role is read by name. `node scripts/check-hard-coded-security.mjs` prints **`no coded security outside
the Admin bypass`**, with `0365_refusal_keys_doctors_cards_attachments.sql` in the set of migrations from `0262` on that it read.

`set_role_cards` runs with `search_path = ''`, so `json_build_object` is written `pg_catalog`-qualified rather than left to the
implicitly-searched catalog.

## Callers: eleven, not the ten the tool names

Every one was opened and confirmed to make the call before being counted.

- `src/app/management/clinics/[id]/doctors/actions.ts` — `refuse(error.message)` → `dbRefusal("doctors.mergeDoctors", …)`. The
  file's other `refuse(error.message)`, on the `doctor_clinics` update, is a different call and is left alone.
- `src/app/admin/who-does-what/actions.ts` — `apply()` now `dbRefusal(where, error, t)`.
- Nine routes for `record_attachment`: `api/blood-tests/[id]/attachments`, `api/clinic-visits/[id]/report`,
  `api/events/[id]/photos`, `api/medical/residents/[id]/photos`, `api/photos/shelter/[id]`,
  `api/procedures/[id]/attachments`, `api/residents/[id]/photos`, `api/residents/[id]/videos/finish`, and
  `src/lib/bills/upload.ts`. Routes answer `NextResponse.json`, so they take `dbRefusal(…).error`, the shape `0351` already
  established in `api/medical/residents/[id]/photos`.

**`src/app/photos/add/page.tsx` is NOT a caller.** The measuring tool lists it because it names `record_attachment` in a prose
comment; the page calls nothing. Ten listed, nine real.

Three routes (`clinic-visits/[id]/report`, `events/[id]/photos`, `bills/upload.ts`) also answer a **missing row**, which carries
no error at all. That branch keeps `t.uploads.errors.couldNotRecordFile`; only the error branch goes through `dbRefusal`.

`src/app/api/residents/[id]/photos/route.ts` takes `(await getT()).t` rather than the `t` in the same function: that `t` is
declared at line 225, **below** this block, so it is not in scope there. Read before writing, not after the typecheck failed.

## Deleted, with its reason gone

`who-does-what/actions.ts` `apply()` held a **regex rewording and a `23514` allow-list**:

```
if (error?.code === "23514" && /approve photos/i.test(…) && /^(Give a role|This is the last role)/.test(…)) {
  return { ok: false, error: error.message };
}
```

It recognised the two photo-approver refusals by matching their English text and showed them **raw** — which is precisely the
fault `#3nuwy` is about. They are keys now, matched by name and worded in both languages, so the regex would be dead code.
Anything that is not a key still falls through to `databaseFailure()`'s generic words, so a constraint name still cannot reach
the browser. Groups 5 and 6 removed rewordings of the same shape; group 8 had none.

## Proof (dev, 2026-11-12)

`supabase/harness/0365_refusal_keys_doctors_cards_attachments_harness.sql`, a `begin … rollback` with `ZZ fixture` rows, nothing
committed, run after a clean `--dry-run` and the apply. **Seen 14 of 15**, and every probe asserts the message **is the key**
rather than merely that the call was refused — an English sentence would pass a "did it refuse?" test and still be the bug.
Probe 8 reads the `detail` JSON back, so the one parameterised key is proven end to end.

**Not provoked: 1 of 15**, and it is not a missing fixture. `merge_doctors`' second `not_allowed` — the one after a filtered
delete — **cannot be reached by any login**. Read from the live policies: `doctors_delete_perm` asks
`has_permission('clinics.doctors')`, exactly what the function's own first check asks, so a login that reaches the delete always
passes it. The guard dates from `0147`, when `visit.book` let someone add a doctor without being able to remove one; that
combination is gone. **Left exactly as it was** — this change converts messages, it does not remove guards — and reported rather
than acted on.

One thing the harness had to establish to work at all, worth knowing for any later stream touching doctors: **the `doctors`
SELECT policy asks `clinics.list` at read, not `clinics.doctors`.** A login holding only `clinics.doctors` reads no doctor row,
so `merge_doctors` answers `not_found` before reaching its later checks.

Not driven on screen. `set_role_cards` is the Who-does-what save path and was provoked **only** in the harness: Lutan tests one
card at a time on that screen and a changed assignment would destroy his test state. The `doctor` role's missing cards are his
fixture and were not touched. The harness does `delete from role_permissions where activity = 'photos.approve'` to make the two
approver refusals reachable at all — inside the rolled-back transaction, so the shared dev database keeps its approvers.

## Fallback proof

`src/lib/db-refusal.test.mjs` is unchanged and still covers the case that matters here: a key-shaped string the dictionary does
**not** know gives the generic "something went wrong + reference", never the raw key.

## Meter

Before: **21** functions / **69** keyed messages, **20** person-read still English. After: **24 / 84**, **5**.
`node scripts/check-sql-refusal-keys.mjs`: ok, 24 live functions raise 76 distinct keys, each worded in `en.ts` and `th.ts`.

## Thai

My own wording, unreviewed, marked `UNREVIEWED` in `th.ts`; for the planner to file onto `#y1dqu`. The release note says the Thai
has not been checked by a Thai speaker, as the neighbouring notes do.

## Next group

**5 messages in 4 functions are all that is left of the person-read English**, by caller file:

- **`src/app/management/recurring-jobs/actions.ts`, `src/lib/medical/weigh-first.ts`, `src/lib/recurring-jobs/queries.ts`,
  `src/lib/recurring-jobs/eligibility-load.ts`** — `recurrence_dates` and `recurring_job_dates` (both `0095`, both raising the
  same *"Ask for at most two years of dates at a time."*) and `role_can` (`0277`, `security definer`,
  *"role_can: not permitted to ask about the % role"*). Four caller files, three messages — a natural single group.
- **`src/app/admin/website/actions.ts`** — `propose_website_draft` (`0315`, `security definer`), two messages:
  *"website.propose is required to propose a website change"* and *"not a draftable table: %"*. One caller file.

The planner names the next group; `#3nuwy` is a programme and stays open.
