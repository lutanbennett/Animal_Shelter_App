# ำ in the archive summary and manual PDFs: same fix as the receipt, and what it actually broke

2026-10-09, `claude/thai-pdf-sara-am`. Follows `2026-10-09-thai-sara-am-in-pdfs.md` on
`claude/donation-receipts`, which found the bug and fixed the receipt.

## What we do

Both PDFs' `Text` wrappers now pass their children through `thaiPdfChildren()`
(`src/lib/archive/fonts/thai-pdf-children.ts`), which applies the receipt's `thaiPdfText()` (ำ → ํ + า)
to a lone string **and to every string in an array of children**. The receipt's wrapper rewrites only a
lone string. Here that is not enough: the manual's callout is `<Text>Tip: </Text>{c.text}` and reaches the
wrapper as an array, and any `{a} {b}` JSX does the same. A nested `Text` is the file's own wrapper, so it
rewrites its own strings.

`thai-pdf-text.ts` is copied byte-for-byte from the receipts branch, so whichever merges second adds an
identical file and git takes it cleanly. The receipt is not changed here: its children are template
strings today, so it is not exposed, but if it ever gets an array child it should switch to
`thaiPdfChildren()`.

## What the bug actually did here (measured, not inferred)

Rendered the real components with stub records before and after, rasterised with Windows' own PDF
renderer, pixel-diffed the pages and compared `pdftotext` output:

- **Visible, in the manual as it ships today:** the English manual's assistant topic, step 7, ends with
  Thai examples containing two ำ (`น้ำหนัก`, `กำหนด`). The PDF printed it ending `…ครบกำหน`, two
  characters short (`ด.`). After the fix it reads `…ครบกำหนด.`, and that line is the only pixel change
  on the page. So the downloadable manual has been missing those characters since step 7 gained its
  Thai.
- **Visible, in stub samples:** the summary's bold header
  `Nam (บริษัท ล้านนา พัฒนา จำกัด (คุณสมศรี ใจดี))` printed one `)` short, and so did a manual title with
  ำ in it.
- **Not visible in other stub samples:** notes, table cells, a two-line wrapped paragraph with 48 ำ,
  the footer, the callout and short strings like `Nam (น้ำ)` all drew every glyph. So a ำ does not
  always cost a letter. Whether it does depends on how textkit lays out the text, and we did not pin
  that down, so the fix covers every Text rather than guessing which ones are safe.
- **Text layer, every ำ:** copying or searching text in the PDF gave wrong characters wherever a ำ
  appeared (`น้ำ)` came out as `นำ้ )`, `งาม` as `ง ม`), because the glyph-to-character map is shifted
  by one after each ำ. After the fix it copies as `น้ํา)`: right letters, ำ as two code points.

## Archives already on Drive

Summaries already written for deceased residents keep the old rendering until they are regenerated.
`scripts/count-sara-am-archives.mjs [--env production]` counts archived residents with a ำ anywhere the
summary prints, and how many have it in the header (the case that visibly lost a character). Test:
8 archived, 0 affected. Production was not counted from this stream (production reads are refused from
worktrees). Regenerating is a separate decision: `refreshDeceasedArchiveIfNeeded()` or the hub's Retry
button, per resident.
