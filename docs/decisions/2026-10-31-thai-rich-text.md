# Style buttons for the Thai of the website's page text (2026-10-31)

Lutan, 2026-10-30: *"The English website edit allows rich text editing for Bold, Underline and Color. I need the
same functionality for the Thai Translations when they appear on the Translations Page for update / review /
approval."* Builds on `2026-10-30-website-rich-text.md`, which defined the marks; nothing about the stored format
changed.

## One toolbar, moved to `src/components/`

`BodyToolbar` moved from `src/app/admin/website/` to `src/components/BodyToolbar.tsx`; `SitePageForm` imports it
from there and `TranslationPanel` uses the same component. The other choice was each caller passing the toolbar in
as a prop. Rejected: `TranslationPanel` would still need the textarea ref plumbing to hand it out, every caller
(the popup and the queue) would have to remember to pass it, and the panel already knows when it needs it. The
toolbar depends only on `lib/site/body.ts` and the dictionary, so nothing tied it to the website route. No copy
exists: the English and the Thai cannot offer different styles.

The toolbar was written for the English box, which is uncontrolled. The Thai box is controlled (`value` +
`onChange`). It works unchanged: `setRangeText` changes the text without going through the `value` setter React
tracks, so the dispatched `input` event reaches `onChange` with the new text. Measured in the browser on both
screens, not reasoned.

## Which fields get it: a flag that defaults off

`TranslationPanel` takes `pageBody` (default `false`). `SitePageForm` passes it on the page text's panel (not
the heading's); `TranslationQueue` passes `isPageBodyField(row)` (new, in `lib/site/body.ts`:
`site_pages.body` only). Every field drawn through the page-text format is `site_pages.body` — the home story and
"How adoption works" are `site_pages` rows too — so the test is exact. Bios, stories, labels and page headings
stay plain. A new caller that forgets the flag offers nothing.

## What the reviewer sees

With `pageBody`, the original, the saved translation, the "previous/current original" of an out-of-date row, and a
live **How the Thai will look** preview under the box are all drawn with `SiteBodyView`, the public renderer. In the
popup, where the English is not otherwise in the panel, the English sits beside the Thai preview (two columns from
`md`). These previews carry the public site's look — cream page, site ink, Source Sans + Noto Sans Thai, Fraunces
headings — through CSS variables on the wrapper (`SITE_LOOK`), because in the app's dark theme the site's dark ink
vanished and the colours did not read as a visitor sees them. On the dev database "orange" is teal: that is the
dev palette (`:root[data-env="dev"]`), the same on the public test site.

## Who sees the buttons

The toolbar is inside the editor, and only `canManage` opens the editor; it also checks `canManage` itself.
`approveTranslation` asks `translations.manage`, so that is the activity.

**Found and fixed on the way:** Settings → Website passed `canManageTranslations` as a literal `true` ("Admin is a
superset of management, so always") while the page opens on `website.content`. A login holding the Website card
without the Translations card was drawn Edit translation / Remove translation buttons that the server then refused.
It now passes `can(perms, "translations.manage")`. Proved with a login holding only `website`: no translation
buttons, only the English toolbar. The queue page already opens only on `translations.manage`
(`requirePermission`), so its literal `canManage` is correct.

Server checks are unchanged.

## Safety

The stored format is unchanged and the parser is unchanged, so this held already; it was tested rather than
assumed. A Thai body containing `<script>alert(1)</script>`, `[ลิงก์](javascript:alert(1))` and
`<b onclick="x">…</b>` was saved and approved on dev: the preview and the public `/volunteer` page show all three
as text, with no `script`, `b` or `javascript:` link element. Unit test added in `src/lib/site/body.test.mjs`.

## Left for a person

The Thai wording of the one new dictionary key (`translations.lookPreview`, "ภาษา…จะแสดงแบบนี้") is a draft and
wants Lutan's wife's eye, like the rest of the Thai.
