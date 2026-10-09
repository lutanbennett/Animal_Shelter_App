# Thai ำ drops letters from @react-pdf text: write it as two code points

2026-10-09, found while building donation receipts (`claude/donation-receipts`).

## What happens

With `@react-pdf/renderer` 4.9.0 (textkit 7.0.1, fontkit 2.0.4) and Noto Sans Thai, every SARA AM (ำ, U+0E33)
in a piece of text makes the PDF lose one character **from the end** of that text. fontkit shapes ำ into two
glyphs (NIKHAHIT + SARA AA) and textkit keeps only as many glyphs as the string has characters, so the last
glyph falls off. "บริษัท ล้านนา พัฒนา จำกัด (คุณสมศรี ใจดี)" printed without its closing bracket. A name with two ำ
loses two letters. The rest of the page looks right, which is what makes it dangerous on a receipt that has
already been sent. "จำกัด" (company limited) is in almost every Thai company name.

## What we do

`thaiPdfText()` (`src/lib/archive/fonts/thai-pdf-text.ts`) replaces U+0E33 with U+0E4D U+0E32, ำ's own
compatibility decomposition. It shapes to the same two glyphs, so the page is identical, and the glyph count
now equals the character count. The receipt's `Text` wrapper passes every string through it. The one cost:
text copied out of the PDF carries the two code points rather than one, so a search for "จำ" in a PDF viewer
may not match.

## Not done here

The deceased-resident summary (`src/lib/archive/resident-summary-pdf.tsx`) and the manual PDF
(`src/lib/manual/manual-pdf.tsx`) use the same font and the same code path and have the same bug. Fixing them
is its own task (suggested from this session), because archived summaries already on Drive may need
regenerating, and that is a decision, not a side effect of a receipts PR. Drop the helper if a later
@react-pdf fixes the glyph count. The test is to render "จำกัด (x)" and check that ")" appears.
