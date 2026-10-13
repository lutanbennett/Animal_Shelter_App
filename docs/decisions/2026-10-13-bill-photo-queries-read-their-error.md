# Bill photo queries order by `uploaded_at` and throw on error (2026-10-13)

`attachments` has `uploaded_at`, not `created_at`. All three bill-photo queries (`src/lib/maintenance/bills.ts`,
`src/lib/bills/photos.ts`, `src/app/bills/page.tsx`) sorted by the missing column, PostgREST returned an
error, and `data ?? []` showed no photos with no message. The `created_at` orders on `maintenance_bills` and
`bills_inbox` are correct and were left alone.

**Reading the error, not only reordering, is the point.** Each query now throws
`Could not load bill photos: <message>` on error. A page that fails loudly is found the same day; one that
shows "nothing here" lasted from `0.29.0`'s release until a user reported it. Throwing (the page's error
boundary) was chosen over a quiet banner because a bill page with silently missing photos is worse than an
error: the person would add the photo again. If a softer message is wanted later, it replaces the `throw`.

**The new check, `scripts/check-bill-photos-listed.mjs`** (dev only, read-only): every `attachments` query
under `src/` may order only by columns `attachments` really has (read from dev's `information_schema`); each
of the four photo places must order by `uploaded_at` and read its `error`; and that select runs on dev for
each owner type. It sits beside `check-bills-roles.mjs`, which tests who may *see* a photo, not that a page
*lists* it. It is a source-and-schema check, not a rendered-page one; the page-level look is in the test plan.
