# The meme maker's photo list reads a view gated on `resident.who_and_where` (#m8kq4)

**Which read dead-ended the page:** the per-resident list at `src/app/memes/make/page.tsx` (the `attachments` read for the chosen
resident), which produces *"no photos that can be made into a meme"*. The ranking read (`owner_id` only) merely returns nothing
for a `meme_add`-only login, so residents sort alphabetically; it is not the dead end and is left alone.

**Activity chosen: `resident.who_and_where` at read**, resolved through `has_permission()` (migration `0354`, view
`resident_photo_list`). Rejected: `resident.record` (it is what the card lacks, and widening it is the opposite of the fix) and
`private.works_with_residents()` (any of a dozen unrelated cards would then read photos). Reasoning, by card: the card that may
name a resident already shows that resident's profile photo through `resident_who_and_where`, so showing its approved,
non-medical photos is the same kind of disclosure, and it stays true however cards are assigned to roles.

**What the view exposes:** id, resident id, Drive file id, file name, upload time of resident attachments that are approved
(`approved_at is not null`), `media_kind = 'photo'` and not in the medical folder (the exact trim expression of
`attachments_select_perm`). No `sub_folder`, no uploader, no notes. The `.jpg/.png/.webp` name test stays in the page.
`attachments`' policy is untouched. Cards unchanged.

**Admin:** driven 2026-11-11 against the same resident (Test 1): Admin is offered the photo too (page shows "Choose a photo of Test 1",
no "no photos" message), through the `has_permission()` Admin short-circuit.

**Driven proof:** a login holding only `meme_add` clicked Memes → Make a meme → Test 1 and was offered the approved photo.
**Production:** `0354` is pending behind `0348` and `0350`–`0353`; this fix is inert there until they apply.
