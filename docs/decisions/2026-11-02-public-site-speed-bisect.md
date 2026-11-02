# 2026-11-02 — Public site speed bisect: no regression, and #1200's drop was machine load

Backlog item: *the public site's speed score has fallen since the October audit* (reported by
`docs/seo-recheck-2026-11-02.md`, #1200). Measurement only; no site code changed in this PR.

## What was measured

- **Builds** (`next build` then `next start -p 3005`, dev database, signed out, `locale=en` cookie), each
  checked out detached in this worktree:
  `c179b7f8` (baseline, 2026-10-14), `c88831ea^` (just before rich text), `c88831ea` (rich text),
  `c3546142` (shared 1440 px frame, #1115), `a388d571` (main at the time).
  The Show/Hide switches (`51d8d165`) and the Appeals/Desexing/Shop pages lie between the baseline and
  `c88831ea^`, so they are inside the `prerich` build; they are not separated further (see below).
- **Lighthouse 12**, mobile preset, performance only, the installed Windows Chrome headless: the same
  apparatus as #1200 (its scratchpad install was reused). Nine English pages that exist at the baseline:
  `/`, `/adopt`, `/adopt/international`, `/our-work`, `/donate`, `/foster`, `/volunteer`, `/friends`,
  `/privacy`. Two runs per page per build (18 runs). Appeals, Desexing and Shop were not measured: they
  have no baseline.

## Pass 1 — chronological, and confounded

| Build | Avg speed (18 runs) |
|---|---|
| baseline `c179b7f8` | 74.6 |
| `c88831ea^` | 87.4 |
| `c88831ea` rich text | 85.8 |
| `c3546142` shared frame | 85.6 |
| `a388d571` main | 91.5 |

The scores rise in the order they were measured. Two sibling streams were running their own builds
and gates from 07:36Z to about 07:55Z; the baseline was measured first, in that window.
Elapsed time and commit were confounded, so pass 1 alone proves nothing.

## Pass 2 — interleaved, baseline both before and after main (the controlled one)

Machine idle apart from this stream. Order: baseline, main, baseline.

| Page | Baseline (2 builds, 4 runs) speed / LCP / TBT | Main (2 runs) speed / LCP / TBT |
|---|---|---|
| Home | 79 / 4.8 s / 200 ms | 93 / 3.2 s / 38 ms |
| Adoption list | 80 / 5.1 s / 135 ms | 93 / 3.3 s / 41 ms |
| International | 78 / 5.2 s / 197 ms | 92 / 3.3 s / 90 ms |
| Our work | 77 / 5.6 s / 150 ms | 91 / 3.4 s / 41 ms |
| Donate | 79 / 5.1 s / 163 ms | 91 / 3.4 s / 74 ms |
| Foster | 81 / 5.0 s / 132 ms | 92 / 3.4 s / 77 ms |
| Volunteer | 80 / 4.9 s / 170 ms | 92 / 3.3 s / 78 ms |
| Friends | 80 / 4.9 s / 79 ms | 93 / 3.2 s / 43 ms |
| Privacy | 79 / 5.0 s / 172 ms | 91 / 3.4 s / 79 ms |

Averages: first baseline build 78.4, main 91.8, second baseline build 79.7. The two baseline builds
agree to a point and a half, so there was no drift across the pass.

## What it names

**No regression exists.** Under the same conditions, current main is 12–14 points faster than the
October baseline on every page and about 1.5–2 s faster on LCP. The shared frame and rich text builds
(pass 1) were no slower than the build before them. Nothing between 2026-10-14 and now lowered the score.

**#1200's 64–76 is, on this evidence, a loaded-machine reading.** Main scores 91–93 here, 64–76 there,
so the same code spans 17+ points. #1200 was measured on a day with three parallel streams building.
Hypothesis, not a finding: that is the whole drop. It is consistent with pass 1, where the baseline
read 75 under load and 79 on a quiet machine.

**Not isolated:** why main is faster than the baseline (likely work between the two, not studied), and
which of the candidates between the baseline and `c88831ea^` it came from. Both are moot: nothing needs
fixing.

## Rule for the next person measuring this site

Lighthouse here is load-sensitive to more than 15 points. **Measure only with no other `next build`,
`gates.mjs` or dev server running** (check the linked sessions first), **interleave builds, and bracket
the comparison with the baseline measured twice.** A single run per cell, in one chronological sweep,
cannot support a conclusion about a change under 15 points. Quiet-machine noise is about 1–2 points
for main and 2–4 for the baseline.

## Open questions from the brief

- **Does the shared frame (#1115) explain the pattern, and is the Thai gap separate?** There is no
  pattern to explain. The frame build scored the same as the build before it. Thai was not re-measured
  (the baseline has no Thai figure); #1200's Thai-below-English gap was measured under the same load, so
  it is unproven too. Left for a quiet-machine re-run if anyone wants it.
