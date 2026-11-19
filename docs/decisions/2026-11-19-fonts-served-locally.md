# 2026-11-19 — The five fonts are served from the repository (`#fntlc`)

`src/app/layout.tsx` now uses `next/font/local`; nothing under `src/` imports `next/font/google`.
The build no longer needs `fonts.gstatic.com`.

## The five questions

1. **Licences.** Read from the `LICENSE` file shipped in each Fontsource package: Geist, Geist Mono,
   Noto Sans Thai, Fraunces and Source Sans 3 are all SIL Open Font License 1.1, which permits
   redistribution. Each text sits beside the files as `public/fonts/LICENSE-<family>.txt`.
2. **Thai size and subsetting.** `next/font/google` was already loading only the `latin` and `thai`
   subsets. The files taken are the same kind of subset (Fontsource splits by unicode range), so no
   whole-file swap happened. Noto Sans Thai is now the Thai subset only (26,924 bytes); the Latin
   half (30,748 bytes) is dropped because every font stack in `globals.css` lists a Latin family
   before `--font-thai`, so Noto is only ever asked for Thai characters. No subsetting step was built.
3. **Variable, not static.** One variable WOFF2 per family (weight axis; Fraunces also `opsz`, as the
   old `axes: ["opsz"]` asked).
4. **Options carried across.** `variable`, `preload: false` (Fraunces, Source Sans 3), `display: swap`,
   `style: normal` and a weight range are set by hand; the five CSS custom property names are unchanged:
   `--font-geist-sans`, `--font-geist-mono`, `--font-noto-thai`, `--font-fraunces`, `--font-source-sans`.
5. **Build with no font network.** See the PR body for the method and result.

## Files and source

`@fontsource-variable/*` from npm (geist 5.3.0, geist-mono 5.3.0, noto-sans-thai 5.3.0, fraunces 5.3.0,
source-sans-3 5.3.1), taken via a scratch install, not added as a dependency.

## Not established

Pixel-identical rendering against the Google-served files: Fontsource builds from the same upstream
sources but is not Google's own byte stream.
