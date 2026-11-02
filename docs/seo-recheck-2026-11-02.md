# Search scores re-check of the public website — 2026-11-02

Re-measures the public site against `docs/seo-audit-2026-10-14.md` (the baseline, unchanged).
Asked for by Lutan on 2026-10-31: *"recheck the SEO metrics and provide suggested optimisation"*.
Done by a Sonnet 5.5 session (`claude/seo-recheck`), on a production build of `main` at
`4f1c1b1d`, against the **dev** database, signed out. Nothing was changed on production and nothing
was submitted to Google. The method is in `docs/decisions/2026-11-02-seo-recheck.md`.

## The five-minute version

- **SEO, accessibility and best practices are still 100 on every page, in English and Thai.** All 32
  runs (16 page types × 2 languages), including the Appeals pages, the Desexing page and the Shop,
  which did not exist at the baseline. Nothing the first audit fixed has come undone.
- **Speed has slipped.** English speed was 70–81 at the baseline and is now **64–76**. The pages
  whose main element is text (International adoption, Donate, Foster, Volunteer, Shelter Friends,
  Privacy) lost 10–15 points; photo pages (home, adoption list, an animal, a story) are level.
  Thai ranges **58–71**. LCP is 4.7–5.9 s in English (baseline 4.7–6.3 s), so the time to the main
  element did not get worse; what rose is **blocking time** (250–940 ms, the baseline quoted 160–310 ms).
- **Rich text cannot break the heading order.** Settled in code and by measurement (below).
- **Nothing was fixed in this PR.** No machine-facing fault turned up that needed fixing.

## Scores beside the baseline (English)

Speed is Lighthouse's performance score on a simulated slow-4G phone, from `next start`. **One run
per cell**; the baseline itself says LCP wobbles by half a second between runs, so read a move of
under about 5 points as noise.

| Page type | SEO / A11y / BP 2026-10-14 | SEO / A11y / BP now | Speed 10-14 | Speed now | LCP 10-14 | LCP now |
|---|---|---|---|---|---|---|
| Home `/` | 100/100/100 | 100/100/100 | 73 | **72** | 5.2 s | 4.7 s |
| Adoption list | 100/100/100 | 100/100/100 | 73 | **73** | 6.3 s | 5.0 s |
| An animal | 100/100/100 | 100/100/100 | 70 | **71** | 6.0 s | 5.4 s |
| International adoption | 100/100/100 | 100/100/100 | 74 | **64** | 5.2 s | 5.2 s |
| Our work | 100/100/100 | 100/100/100 | 76 | **66** | 5.7 s | 5.9 s |
| A story | 100/100/100 | 100/100/100 | 73 | **76** | 6.1 s | 5.2 s |
| Donate | 100/100/100 | 100/100/100 | 78 | **67** | 5.0 s | 4.8 s |
| Foster | 100/100/100 | 100/100/100 | 79 | **66** | 4.9 s | 5.1 s |
| Volunteer | 100/100/100 | 100/100/100 | 80 | **66** | 4.9 s | 5.1 s |
| Shelter Friends | 100/100/100 | 100/100/100 | 81 | **66** | 4.7 s | 5.1 s |
| Become a Friend | 100/100/100 | 100/100/100 | 77 | **68** | 5.0 s | 5.4 s |
| Privacy | 100/100/100 | 100/100/100 | 80 | **69** | 5.0 s | 5.4 s |
| Appeals list | no figure (newer) | 100/100/100 | — | 69 | — | 5.5 s |
| An appeal | no figure (newer) | 100/100/100 | — | 64 | — | 5.5 s |
| Desexing service | no figure (newer) | 100/100/100 | — | 66 | — | 5.1 s |
| Shop | no figure (newer) | 100/100/100 | — | 65 | — | 5.1 s |

Thai, now (the baseline recorded SEO and accessibility 100 for Thai but no Thai speed, so there is
nothing to compare the speed with): home 58, adoption list 69, animal 71, International 64, Our work 64,
story 64, Donate 62, Foster 68, Volunteer 64, Shelter Friends 71, Become a Friend 67, Privacy 71,
Appeals 60, an appeal 60, Desexing 63, Shop 67. SEO, accessibility and best practices are 100 on all.

**Pages not measured:** none of the sixteen. **Not measured at all:** a Thai figure for the baseline
(it never existed), and any page whose body Lutan or the Director hides with the new Show/Hide
switches. The dev database holds test data, so photo sizes and body lengths differ from production.

## Why speed moved — measured, and what is only a guess

Measured (per-run detail kept in the session scratchpad, not committed):

- On the six text-led pages the LCP element is a paragraph. Its time splits into about 0.3 s waiting
  for the server and **0.64–0.94 s of "element render delay"**: the text is in the page but is not
  painted until the browser has finished other work. That is the blocking time showing up.
- Every page ships four shared script files totalling about **280 KiB**, plus a 66 KiB font and a 33 KiB
  logo. Lighthouse flags **94 KiB of unused JavaScript** on all 32 runs (about 0.5 s of simulated time),
  and 13 KiB of legacy-browser code.
- Shelter Friends also loads Google Maps (about 570 KiB more, 1.25 MB in all).
- The shared frame still serves the **full 33 KiB `lca-logo.jpg`**; the 160 px copy from the follow-up
  is used only by `PublicHeader`, not by the `AppHeader` that draws the header on the pages above.
- Layout shift: 0 almost everywhere, but **0.074 on an appeal, 0.044 on the Appeals list, 0.038 on the
  Shop** (the footer and a grid move). Still "good" (under 0.1), but the baseline was 0 everywhere.
- Thai is slower than English by 5–14 points on several pages (home 58 against 72) with a bigger
  render delay; the Thai font is the first suspect but that was not isolated.

Not established: **which commit moved the text pages**. That needs a bisect (build and measure at a few
points between `c179b7f8` and now); it was not done because each build is several minutes and this
stream's job was the measurement. The shared page frame (#1115) and the extra client code it brings
are the likeliest cause, but that is a guess.

## The open question: can rich text break the heading order? No.

- `parseBody()` (`src/lib/site/body.ts`) recognises exactly one heading form, a line starting `## `,
  and nothing else. The `{b}`, `{i}`, `{u}`, `{c:…}` and `{s:…}` marks are parsed by `parseInline()`
  and only ever produce `strong`, `em` or `span` elements; a heading's own text goes through
  `stripMarks()`, so a mark inside a heading cannot make a different element either. `BodyToolbar`
  inserts those marks and the `## ` line and offers no other heading level.
- The level is chosen by the page, never by the author: `SiteBodyView` renders `## ` as `h2` on whole
  pages (all three uses in `SitePageArticle`) and as `h3` only in the two places that sit under an
  `h2` of their own (the home page story and the adoption list's "How adoption works" box,
  both checked in the source).
- Measured: the accessibility category, which includes heading order, is 100 on all 32 runs, on the
  five pages whose body is rich text (International, Donate, Foster, Volunteer, Become a Friend).
- So an author can write a lot of headings, but cannot skip a level. **No fix is needed in the
  parser, the toolbar or the guidance.** One residual: an author who types `## ` at the very top of a
  body gets an `h2` straight after the `h1`, which is correct. Not tested: a body with no headings at
  all in a section whose `h2` is hidden by a Show/Hide switch; the code cannot produce a jump there either,
  since the section heading and the body are separate elements, but no such page exists on dev.

## Ranked improvements (for the planner to file; none is in this PR)

Worst first, by what each would buy on the speed score and by how sure the evidence is.

1. **Find what made the text pages slower, and fix it (bisect).** Build and measure at the baseline
   commit, the shared-frame commit (#1115) and now. Buys back the 10–15 points on six page types, the
   largest single move. Evidence: measured drop, cause unproven.
2. **Cut the 94 KiB of unused JavaScript and the 280 KiB shared script set.** Check which client
   components load on a plain content page (header menus, language switcher, theme picker, the assistant
   hooks) and load them on demand. Lighthouse puts it at about 0.5 s on every page; likely 5–8 points.
3. **Make the render delay shorter for text pages**: the paragraph is the LCP and waits 0.64–0.94 s after
   the bytes arrive. Candidates: the 66 KiB web font blocking paint (use `font-display: swap` and
   a smaller subset; Thai is the worst case), and hydration work competing with first paint.
4. **Use the 160 px logo in the shared frame** (`src/app/AppHeader.tsx` line 97): saves about 30 KiB on
   every public page, about 1 point. A machine-facing swap, but left out because the header is drawn
   for signed-in staff too and it is not certain the small copy is served on those paths.
5. **Load the Google Map on Shelter Friends only when the visitor scrolls to it or taps it** (a click-to-load
   map). Saves about 570 KiB, taking that page from 1.25 MB to about 0.68 MB. Visitor-visible, so a
   separate stream.
6. **Reserve space for the Appeals and Shop footer and grid** to take the 0.04–0.07 layout shift back to 0.
7. **Thai pages: measure the Thai font.** Thai speed is 5–14 points under English on the same pages.
8. **Drop legacy JavaScript** (13 KiB on every page): a build-target setting; a few tenths of a point.
9. **Photo LCP on photo pages** is still 1.0–1.3 s of loading the main photo from the photo route; the
   Pi's disk cache and Cloudflare's edge cache will change this on the live site, so judge it
   only there.

## What cannot be known yet

Everything that needs a public address or real traffic. The site is locked until the nameserver change
and the cutover to `lannacareforanimals.org`, so none of this exists:

- **Real search data**: what people type, how the site ranks, how many see it. Search Console has
  nothing to show until the site is open and verified.
- **PageSpeed Insights** and Core Web Vitals from real phones (field data). The numbers above are
  simulated, from one Windows machine, one run per cell, and they include the Drive round trip that
  the live caches remove.
- **Google's Rich Results Test**, and the **Facebook and LINE previews** (tags are verified in the HTML by
  the first audit, but the previewers need a public URL).
- **Thai search visibility**: Google cannot see the Thai pages until they have their own addresses.
- **hreflang, sitemap host, and the `robots.txt` change on the day** — the go-live steps in the baseline
  still stand.

Several neighbouring backlog items wait on the same cutover; they were not touched.
