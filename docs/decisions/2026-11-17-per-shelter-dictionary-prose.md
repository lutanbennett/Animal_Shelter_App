# Per-shelter dictionary prose: handed to the website/i18n part (Part 8 slice 3, #b4cmn)

**Deliverable 3 settled: the dictionaries are not this part's.** `en.ts` has 28 and `th.ts` 25 lines naming Lanna, in static
per-language records that client components import with no shelter in scope, and several entries are functions
(`shareText`, `emailSubject`) — the shape `#el9zw` crashed on at a client boundary. A placeholder mechanism (e.g. `{shelter}`
filled by a `t()` helper, which also suits Thai word order) touches every reader of the dictionaries and belongs with the
website/i18n work. Registry reasons for both files are sharpened; `#b4cmn` is therefore **not ticked**.

**Done here:** the calendar notice footer and the cancellation line read `shelterNames().shortName` (falls back to "Lanna Care",
so Lanna's text is unchanged; `calendar-notice.test.mjs` proves it). The Worker relay sender reads the deploy variable
`RELEASE_MAIL_SENDER_NAME`, falling back to "Lanna Care". **Nothing is deployed:** to rename a shelter's relay mail, set
`RELEASE_MAIL_SENDER_NAME` in that environment's `vars` in `wrangler.jsonc` at the next release; unset reads as before.
