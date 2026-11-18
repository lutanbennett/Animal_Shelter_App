# The dictionaries name the shelter through `{shelter}` and `{shelterShort}` (Part 8, `#b4cmn`)

**Corrects 2026-11-17-per-shelter-dictionary-prose.md.** That file said a placeholder mechanism *"touches every reader of the
dictionaries"*. Measured, it does not: every reader gets its dictionary from one of two places that already assemble it —
`I18nProvider` (client, `use(loadDictionary())`) and `getT()` (server). The fill happens in those two, so the ~600 readers are untouched.

**Mechanism:** `src/lib/i18n/shelter-prose.ts` `fillShelterNames(dict, names)` walks the dictionary and replaces `{shelter}` (display
name) and `{shelterShort}` (short name), wrapping function entries so their *returned* strings are filled too. It runs on the side
that uses the dictionary: the layout passes only two plain strings to `I18nProvider`, so **no function crosses a client boundary
(`#el9zw`)**. `shareText`/`shareFallback`/`emailSubject` keep their signatures. A placeholder (not concatenation) lets Thai put the name
where Thai wants it. With the default names the output is byte-for-byte the old text: every string and every function result in both
dictionaries was compared against the pre-change files (6373 strings, 1161 functions each; `shelter-prose.test.mjs` keeps the proof).

**Two direct importers also fill:** the admin page-starter (`admin/website/pages/[slug]/page.tsx`) and `SitePagePreview.tsx`, which
imported the raw dictionary and would otherwise have shown `{shelter}`. Other raw importers read only keys with no shelter name.

**Left on purpose (recorded in the registry):** "Lanna Animal Care" in the security-step sentence (it names the authenticator
issuer, itself left on purpose); the `@lannacare` example in the LINE hint; and the Thai-script name ลานนาแคร์ in two shop sentences, for
which there is no Thai-name setting. Converted: 49 of the 53 lines (26 en, 23 th); the 4 left are the issuer sentence and the LINE hint in each language.
Not verified: a Thai speaker has not read the converted sentences (`#y1dqu`).
