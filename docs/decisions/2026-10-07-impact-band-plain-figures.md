# 2026-10-07 — Impact band: the figures show plain, no "About" and no estimate note

Backlog: "Home page impact band: drop the word 'About' in front of the backfilled figures, and the estimate note under them". **Supersedes the "About" bullet of `2026-10-07-impact-figures-editor.md`** (built in #423 the same morning).

- **What changed.** The rehomed and village-sterilisation tiles no longer read "About 321" / "ประมาณ 321", and the line under the band saying those totals include an estimate of earlier work is gone, in English and Thai. The band now prints every figure the same way.
- **Who and why.** Lutan looked at the live page on 2026-10-07 and asked for both to go ("the disclaimer after the figures can also go"). #423 added the hedge on purpose, from the item's point (1), so a hand-entered baseline did not read as an audit. That was a judgement about tone, and the person it was made for has overruled it after seeing it.
- **Where the honesty now lives.** On the admin side, not the public one. The Settings → Website hint used to say "the home page says so"; it now says the page shows the figure as it is, without calling it an estimate, so enter a number you are happy to stand behind. The manual's Website topic says the same. The baseline, its date and its history (audit log) are unchanged.
- **The `approximate` flag is gone.** It was read only by the home page to add the prefix and the note; nothing else used it. To bring the hedge back, restore it on `impactFigureStats` in `src/lib/site/impact.ts` and the two strings in both dictionaries.
