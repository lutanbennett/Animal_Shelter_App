# Public site: LCA in the bar, full name on the home page, crest beside the buttons

Lutan, 2026-11-05 (marked-up screenshot, then in chat): the phone wordmark becomes **LCA**; the home
eyebrow is replaced by two lines, *Lanna Care for Animals Foundation* / *Chiang Mai, Thailand*; Mae Wang
goes from the home page's eyebrow and hero fallback only. **Spelling: lowercase "for"** (answered in chat,
matches `header.appName`); the eyebrow is uppercased by style anyway. His mockup said "CHIANG NAI", a slip
for Chiang Mai; built as Chiang Mai.

- The name is a `<p>`, not a second `<h1>`; the slogan stays the page's only heading.
- Thai keeps the English name (as `appName` does); the place line is เชียงใหม่ ประเทศไทย.
- Top-bar crest uses `/lca-logo-transparent.png` (light backgrounds only) at 52 px (64 px from `lg`),
  inside the unchanged bar height. The old `/lca-logo-160.jpg` stays for other callers.
- The 120 px hero crest beside the buttons is an option for Lutan and the Director to judge by eye.
- Not changed: `shareFallback`, `metaTitle`, the adopt description, the About registration sentence
  (`en.ts` ~594, a legal fact; out of scope per Lutan: "just the home page"), and the tagline (his, editable in Settings → Website).
