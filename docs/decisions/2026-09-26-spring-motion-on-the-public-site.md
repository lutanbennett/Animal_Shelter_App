# 2026-09-26 — Spring motion on the public site

- **The feel was chosen from a preview, not rolled out and then asked
  about.** Three variants of the home page's "How you can help" section
  (Gentle, Springy, Playful) went to Lutan as a published page; he picked
  **B's scroll-in with A's hover**. Scroll-in: blocks rise 20 px and fade
  in, opacity over 320 ms ease-out, transform over 600 ms on a spring with
  about 9% overshoot, 80 ms between blocks arriving together (capped at
  five steps). Hover: a 3 px lift on a 450 ms spring and a soft shadow;
  press sinks to 1 px and 98.5%.
- **The springs are CSS `linear()`, no library.** Each curve is a damped
  spring (damping ratio 0.6 for the reveal, 0.55 for the lift) sampled at
  41 points into `--spring-reveal` / `--spring-lift` in globals.css. Nothing
  here needs physics CSS can't fake: every motion is a fixed distance with
  a fixed start and end, so there is no velocity to carry and no drag.
  The puppy loader (#148) uses no spring, only a 150 ms fade, so there was
  no existing easing to match. These two are the site's.
- **No-JS and crawler safety: only the script ever hides anything, and
  only below the fold.** The markup carries a bare `data-reveal`; CSS
  hides nothing until `SpringMotion.tsx` sets `data-reveal-state="pending"`,
  which it does only after hydration, only with motion allowed, and only
  on blocks whose top is below the viewport at that moment. So the server
  HTML, a no-JS visit and a crawler's render (a tall viewport, everything
  "above the fold") are all the finished page, and a hydration failure
  leaves nothing hidden. The obvious alternative, hidden-by-default in CSS
  and revealed by JS, fails the no-JS rule. A head script that hides
  before first paint would animate the hero on load too, but it hides
  content before React is there to reveal it, so an error or a slow phone
  leaves the page blank. **What is on screen at load never animates.**
  That is deliberate: the hero is the largest paint, and holding it back
  would cost a visitor on a slow connection and the page's LCP.
- **A block that is jumped past still arrives.** The observer's area
  reaches 100 000 px above the viewport, so a block an `#anchor` link or
  End carries straight past, which IntersectionObserver would otherwise
  never report, still counts as arrived and is not left hidden above the
  visitor. The effect's cleanup returns anything still pending to
  untouched, which also keeps Strict Mode's double effect in development
  from marking every block shown before it has animated.
- **Public pages only.** `SpringMotion` is rendered by `PublicHeader`, and
  `data-reveal` / `spring-lift` appear only in public components.
  `FriendCard` is shared with the staff contact hub, so it takes a
  `reveal` prop that only `/friends` sets. The `/r/` card page is left
  still: it is one screen, reached by scanning a tag.
- **Reduced motion means none.** The script does nothing, and the lift's
  transform is off under `prefers-reduced-motion: reduce`. Only opacity
  and transform ever change, so there is no layout shift.
