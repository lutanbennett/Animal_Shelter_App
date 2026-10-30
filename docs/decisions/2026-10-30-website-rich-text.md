# Rich text on the website's page bodies (2026-10-30)

Lutan's shape (2026-10-30): page text only, the site's main colours only, each page edited in a popup.

## Storage: inline tags in the existing text — no schema

Option taken: **extend the three-rule body format with inline marks written as curly-brace tags**:
`{b}…{/b}`, `{i}`, `{u}`, `{c:ink|action|accent}…{/c}`, `{s:small|large|xlarge}…{/s}`. `parseInline()` in
`src/lib/site/body.ts` builds a small tree; `SiteBodyView` turns it into React elements, so no HTML is ever
stored or rendered. Colours and sizes are fixed names mapped to the site's own classes, never CSS from text.

Why not the alternatives: markdown would have changed how existing pages read (`*`, `_`, `#`), and the format
was deliberately not markdown. Structured blocks or an HTML editor library would need a migration or a
sanitiser on every save and render. Curly braces need no escaping in ordinary prose.

**What was given up:** the box now shows tags (`{b}word{/b}`) rather than the styled word, since it is a plain
textarea; the Preview shows the real look. A WYSIWYG box would have needed an editor library. Also: a page
that already contained a literal, exactly-formed tag such as `{b}…{/b}` would now style (none known; the
tags are unlikely in prose).

Fail-safe: only an exact, closed tag from the lists is a mark. A typo, unknown colour (`{c:red}`), unclosed or
crossed tag, `<script>` or `[x](javascript:…)` stays as the text it was typed as (links still pass only through
`lib/site/links.ts`). Headings, descriptions (`bodyLead`) and cards strip marks. Thai uses the same renderer;
the translator keeps the tags.

`/shop` does not use `parseBody`/`SiteBodyView` for its note (not touched).

## Popup

Each row has an Edit button opening a native `<dialog>` (full screen below `md`). `#<slug>` opens it. Typing in
it marks it unsaved; the "Saved" message clears that; closing (button or Esc) with unsaved typing asks, and
discarding remounts the editor from the saved page.

## Action controls on the Pages tab and what they ask

The whole Pages tab is drawn only with `website.content` (tabs gate in `page.tsx`). Edit button: `website.content`
(edit), same as `updateSitePage`. Save, page visibility, page photo upload/remove, translation panels: all
`website.content` in `actions.ts`. Found, not fixed: none.

## Left for a person

Thai wording of the new dictionary keys is a draft and wants a Thai reader. A manual topic row
(`scripts/lib/acceptance-matrix-entries.mjs`) was not needed: the existing Pages-tab step was extended.
