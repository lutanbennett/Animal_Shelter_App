# LINE links: the typed @ decides Official Account vs personal id

2026-09-29, `claude/line-link-check`.

`lineLink()` used to strip the `@` and always build `line.me/R/ti/p/~id`, the
add-friend form for a *personal* id, while `lineMessageLink()` already assumed
an Official Account (`oaMessage/@id`). The two disagreed.

Rule now: an id typed **with** `@` is an Official Account and links to
`line.me/R/ti/p/%40id`; an id typed **without** it is personal and links to
`line.me/R/ti/p/~id`; a pasted URL is used as-is. It needs no knowledge of
which the shelter has, so both kinds work. The Settings → Website hint says
so, in both languages. `lineHref()` for Contacts is unchanged: those are
people's personal ids.

Only one LINE field exists; holding an Official Account and a personal id at
once would need a second column, so it is a separate schema PR if wanted.
