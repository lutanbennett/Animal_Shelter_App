# 2026-10-07 — Impact figures: the Settings editor and the homepage band (app half of 0156)

Backlog: "Impact figures as a baseline plus a live count". The schema half is `2026-10-07-impact-baselines.md`.

- **Where it lives.** A card on Settings → Website → Home page, under the hero photo and Pet of the week: it is what the band on the home page says, so it sits with the home page, not with contact details. One small form per figure, each saving on its own.
- **Saving asks first** (a confirm dialog) because it changes a public claim. Both boxes blank clears the figure, which the view then leaves out. The audit entry comes from the table's own `record_audit()` trigger (0156); the action writes nothing extra, so there is no second mechanism to drift.
- **"About", on the tile and as a note under the band.** Every figure from this table includes a hand-entered baseline, so every one is marked "About" (ประมาณ) and a single line says the early part is an estimate. The band's own live figures (in care, adopted this year, in foster, in vet care) are counts and are not marked.
- **The band grows to up to six tiles.** With more than four it lays out three across on a wide screen so it does not end on a lone tile; on a phone it was already two across.
- **The date cannot be in the future** (Asia/Bangkok today), since a baseline "to the future" would hide real adoptions from the live count. Count and date are required together, as the table's check requires.
- **Management cannot use it yet.** The backlog and brief say Management, but only Admin holds `website.content` on dev, and nothing in the Director's role draft gives Management website content. Granting it would be a permission nobody decided, so this ships Admin-only; the grant is Lutan's/the Director's call, filed as a follow-up on the backlog branch.

**Superseded in part, 2026-10-07:** the home page no longer marks these figures "About" or carries the estimate note; Lutan asked for both to go after seeing the live page. See `2026-10-07-impact-band-plain-figures.md`.
