# 2026-09-26 — The loading animation is a puppy at a laptop, from one root `loading.tsx`

- **A puppy working at a laptop, not a running dog.** The backlog item began
  as a run cycle like RSPCA's and was corrected by Lutan the same day to a
  puppy at a laptop, from his own video of an apricot poodle-cross in orange
  pyjamas. The drawing is ours: flat shapes inspired by the video, not traced
  from it. Three sketches were shown first; Lutan chose **A** (side-on, nose
  to the screen, paw tapping, a paw-print progress bar filling) for the
  public site and **C** (a one-colour glyph) for the staff app.
- **Plain SVG and CSS keyframes, no Lottie.** A head lean, a paw tap, a tail
  wag, a blink and a progress bar are five transforms. The bar grows by
  `scaleX` rather than `width`, because CSS `width` on an SVG `rect` is not
  animatable in every browser. The puppy's own colours are fixed (fur is
  fur); the laptop, screen and bar use the `--site-*` tokens. The glyph is
  `currentColor`, so it takes the app's orange, or teal on dev.
- **One `loading.tsx` at the root, choosing by path.** A public page gets the
  scene centred on cream (the loader carries `data-public-site`, so the
  page switches to the public palette before the real header arrives). A
  staff page gets the glyph and "Loading…" where its content will be, with
  the header and sidebar in place, not an overlay. One root file means a
  new page gets it without anyone remembering to add one.
- **Accepted: a missing page now answers 200 with `noindex`, not 404.** A
  `loading.tsx` makes every page stream, and once streaming has started
  the status code cannot change, so a `notFound()` after a database read
  (an adopted resident's old `/adopt/<id>`, a bad `/r/<code>`) sends
  200 with `<meta name="robots" content="noindex">`. Measured on dev: 404
  without the file, 200 plus noindex with it. Search engines drop such a
  page just as they drop a 404, and Next documents this as how streaming
  works. If a real 404 status is ever needed for these pages, the check
  has to move into `src/proxy.ts`, before rendering starts.
- **The 300 ms delay is CSS, not a timer.** `.puppy-delay` keeps the loader
  `visibility: hidden` for `--puppy-delay` and then fades it in, so it
  works in the first server-rendered HTML before any JavaScript runs. The
  `role="status"` label is in the DOM from the start, so a screen reader
  may hear "Loading" on a fast navigation that sighted users never see.
  That was judged better than delaying the announcement with a timer that
  would not run until hydration.
- **Reduced motion: the dog holds still with the bar part-way**, beside the
  label. The appear delay stays, because it is timing, not motion.
- **Inline waits use the glyph only where nothing else shows progress:**
  the website hero and gallery uploads and a Shelter Friend logo upload.
  There it sits inside the button, after 1 s, next to the button's own
  "Uploading..." text. The photo and attachment uploaders already have a
  real per-file progress bar and are left alone; a loop is worse than a
  measurement.
