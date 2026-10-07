# 2026-10-07 — Impact figures: a baseline table and a computed public view (0156)

Backlog: "Impact figures as a baseline plus a live count" (decision brief q10). This is the schema half; the Settings → Website editor, the "approximate" wording and both dictionaries are the app half.

- **Shape.** `impact_baselines` (id, unique key, label, label_th, baseline_count, baseline_date, set_by, set_at) and the view `public_impact_figures`, which returns `baseline + live count` computed on every read. Nothing stores a total.
- **"Since the baseline date" is strictly after it.** The baseline is the count up to and including that day (Asia/Bangkok, via `shelter_date`), so entering "412 as of 7 October" never counts a 7 October adoption twice.
- **Only `animals_rehomed` has a live count** (placements of type Adopt, the rows `public_shelter_stats.adopted_this_year` counts). **Nothing records sterilisations in local villages**: the Sterilisations project category (0034) is a photo folder, projects have no count field, and "Spay / neuter" (0031) is a resident procedure. `villages_sterilised` is baseline-only until something records them; a counted figure later is one more `when` in the view.
- **Unset is not public.** The two seeded rows start with count and date both null and the view omits them, so the page cannot show a 0 nobody chose. A check keeps count and date together.
- **Not editable casually.** Insert and update ask `website.content` (Edit), the cell Settings → Website already uses; no delete policy or grant, so a figure is retired by clearing it. `set_by`/`set_at` are stamped by trigger from the session, so they cannot be forged. Every change goes through `record_audit()` like the other audited tables (hence a surrogate `id`, which `audit_log.row_id` needs).
- **Management cannot write yet.** On dev only Admin holds `website.content`. The brief and backlog say Management; giving that role the cell is a permissions decision for the Director, not made here.
- The public view exposes label, baseline, date, live count and total, which the page prints; not `set_by`.

Checked by `scripts/check-impact-baselines.mjs` (the migration runs inside a rolled-back transaction).

**Superseded in part, 2026-10-07:** the home page no longer marks these figures "About" or carries the estimate note; Lutan asked for both to go after seeing the live page. See `2026-10-07-impact-band-plain-figures.md`.
