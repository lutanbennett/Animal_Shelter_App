# Load only the active dictionary (architecture review C4)

**Chosen:** `I18nProvider` loads the active locale with a dynamic `import()` and reads it
with React's `use()`. The server still passes only the `locale` string, because the
dictionaries hold formatter functions and cannot cross the Server→Client boundary. The
dictionaries' contents and shape are untouched; server callers (`get-t.ts`,
`export.ts`) still import them statically, which costs the client nothing.

**Rejected:** splitting the dictionaries by area and passing each page its slice. It
touches every page, and three streams were adding entries to `en.ts`/`th.ts` the same
week. The dynamic import was enough, so the split was not needed.

**Measured** (`next build`, Next 16.3.8 / Turbopack). Turbopack's route table prints no
sizes, so the client chunks in `.next/static/chunks` were measured directly, finding the
chunk that holds the Thai text:

| | before | after, English visitor | after, Thai visitor |
|---|---|---|---|
| dictionary JS, raw | 737,319 B (one chunk, both locales) | 241,104 B | 496,048 B |
| dictionary JS, gzip | 173,502 B | 76,804 B | 96,740 B |

All 99 chunks together grew by about 6 KB gzip (784,486 → 790,427 B): the saving is per
visitor, not in the total on disk.

**Behaviour:** the server-rendered HTML is complete in both locales (checked with
`curl` and a `locale` cookie on `/adopt`; Thai text present only for `th`). The client
suspends until its dictionary chunk arrives, so hydration waits briefly on a slow phone
rather than painting untranslated keys. Not checked on the deployed Worker build.
