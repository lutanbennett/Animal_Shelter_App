# Small UI fixes, folded (2026-10-15)

- **Map editor tool buttons:** the selected state is now a second class string (`btnOn`, derived from `btn`
  by swapping the border/background pair) rather than appended utilities, so no two utilities compete.
- **Dev surface:** only `--surface` under `:root[data-env="dev"]` changed (`#172221` to `#141e1d`); a darker
  surface raises contrast for the light text on it. Production and every theme block are untouched, and
  `check-theme-contrast.mjs` passes on every theme with `KNOWN` now empty. The script was not loosened.
- **Donate Add:** a successful add now says which way was added and that it is in the list above (the add
  form resets by design, which read as "only the type was saved"). A failed read of `public_donation_channels`
  now throws, as in `2026-10-11-silent-empty-reads.md`, so `/donate` shows the error page, not an empty one.
  Hazard: if that view is quietly broken on production, `/donate` starts showing an error.
