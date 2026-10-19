/**
 * Line breaking and font fitting for the meme maker. Pure: the caller supplies `measure` (the canvas in the browser,
 * a stub in the tests), so wrapping is tested without a browser. Words come from Intl.Segmenter, which finds Thai word
 * breaks (Thai has no spaces) and never separates a base letter from its vowel or tone mark; a single word wider
 * than the line is broken between graphemes for the same reason, so a mark is never left alone at a line start.
 */
export type Measure = (text: string, fontSize: number) => number;

const graphemes = (s: string): string[] =>
  Array.from(new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(s), (x) => x.segment);

function words(s: string): string[] {
  return Array.from(new Intl.Segmenter("th", { granularity: "word" }).segment(s), (x) => x.segment);
}

/** Break one paragraph into lines no wider than maxWidth at fontSize. */
function wrapParagraph(text: string, maxWidth: number, fontSize: number, measure: Measure): string[] {
  const lines: string[] = [];
  let line = "";
  const push = () => {
    if (line.trim()) lines.push(line.trim());
    line = "";
  };
  for (const w of words(text)) {
    if (measure(line + w, fontSize) <= maxWidth) {
      line += w;
      continue;
    }
    push();
    if (measure(w.trim(), fontSize) <= maxWidth) {
      line = w.trimStart();
      continue;
    }
    for (const g of graphemes(w)) {
      if (line && measure(line + g, fontSize) > maxWidth) push();
      line += g;
    }
  }
  push();
  return lines;
}

export function wrapLines(text: string, maxWidth: number, fontSize: number, measure: Measure): string[] {
  return text
    .split(/\r?\n/)
    .flatMap((p) => (p.trim() ? wrapParagraph(p, maxWidth, fontSize, measure) : []));
}

export type Fitted = { fontSize: number; lines: string[] };

/** The largest font size (from maxSize down to minSize) at which the wrapped text fits maxHeight. */
export function fitText(
  text: string,
  maxWidth: number,
  maxHeight: number,
  measure: Measure,
  maxSize: number,
  minSize: number,
  lineHeight = 1.15,
): Fitted {
  let size = maxSize;
  for (;;) {
    const lines = wrapLines(text, maxWidth, size, measure);
    if (lines.length * size * lineHeight <= maxHeight || size <= minSize) return { fontSize: size, lines };
    size = Math.max(minSize, Math.floor(size * 0.92));
  }
}
