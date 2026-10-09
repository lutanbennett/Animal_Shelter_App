/**
 * Text made safe for @react-pdf with Noto Sans Thai: SARA AM (ำ, U+0E33)
 * written as its two parts, NIKHAHIT + SARA AA (U+0E4D U+0E32).
 *
 * fontkit shapes one ำ into two glyphs, and @react-pdf/textkit (7.0.1) then
 * drops one character from the END of the text for every ำ in it, because it
 * keeps as many glyphs as the string has characters. So "บริษัท … จำกัด (คุณสมศรี)"
 * printed without its closing bracket, and a name with two ำ lost two letters,
 * on a page that otherwise looks right. Found 2026-10-09 building donation
 * receipts (docs/decisions/2026-10-09-thai-sara-am-in-pdfs.md). The two-part
 * spelling is ำ's own compatibility decomposition and shapes to the same two
 * glyphs, so the page looks identical; only text copied out of the PDF carries
 * the two code points instead of one.
 */
export function thaiPdfText(text: string): string {
  return text.replace(/ำ/g, "ํา");
}
