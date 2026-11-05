import { Head, Heart, Scene, Sitting } from "./PuppyPages";

/**
 * The scene on the locked landing page: the same apricot poodle-cross as the
 * Donate and Foster scenes, in a hard hat beside a traffic cone, so a visitor
 * who arrives before the site opens is met by the shelter's own illustration
 * rather than by an admin screen.
 *
 * Built from `PuppyPages`' own parts — same 240x160 viewBox, same `Head` and
 * `Sitting`, same pyjama pattern — so it cannot drift from the other scenes
 * when one of them is adjusted. Only the hat, the tabard and the cone are new,
 * and each of those is a `--site-*` token rather than a literal colour.
 *
 * Decorative, so `Scene` hides it from screen readers; the page's words carry
 * the meaning. It reads nothing from the database and loads no photo, which is
 * the property that lets the locked page show it to a stranger (LockedLanding).
 */
export function PuppyConstruction({ className }: { className?: string }) {
  return (
    <Scene id="construction" className={className}>
      <ellipse cx="120" cy="146" rx="108" ry="8" fill="var(--site-accent-soft)" />

      <Sitting id="construction" x={72} y={104} />

      {/* The hi-vis jacket, over the pyjamas. ONE reflective band: at 240x160 a
          second one stops reading as hi-vis and starts reading as a jersey.
          Hi-vis yellow is the one colour the site palette does not have, so it is
          its own token beside the other --puppy-* fur and pyjama colours rather
          than a literal here or a new --site-* value. */}
      <g transform="translate(72 104)">
        <ellipse cx="-1" cy="-2" rx="29" ry="24" fill="var(--puppy-hivis)" />
        <path
          d="M-28.5 3 Q-14 -6 2 -5 Q17 -4 26.5 3 L26 8.5 Q16 1.5 2 0.5 Q-14 -0.5 -27 9 Z"
          fill="var(--site-cream)"
          opacity="0.95"
        />
        <path d="M7 -21 Q16 -24 22 -17 L17 -11 Q12 -16 5 -15 Z" fill="var(--puppy-hivis-shade)" />
        <line x1="14" y1="12" x2="19" y2="26" stroke="var(--puppy-hivis)" strokeWidth="11" strokeLinecap="round" />
      </g>

      <Head x={108} y={68} />

      {/* The hat sits on the topknot curls. The seam is clipped to the dome so it
          cannot poke out of the top, and the peak is part of the brim rather than
          a separate shape that reads as a notch. */}
      <defs>
        <clipPath id="puppy-hat-dome">
          <path d="M92 49 Q108 23 126 49 Z" />
        </clipPath>
      </defs>
      <g>
        <path d="M92 49 Q108 23 126 49 Z" fill="var(--site-action)" />
        <g clipPath="url(#puppy-hat-dome)">
          <path d="M108 25 Q110 37 110 50" stroke="var(--site-action-hover)" strokeWidth="3" fill="none" />
          <ellipse cx="100" cy="34" rx="7" ry="3.5" fill="var(--site-paper)" opacity="0.22" transform="rotate(-28 100 34)" />
        </g>
        <path d="M90 46 H128 q14 0 15 7 q0 1 -1 1 H90 q-4 0 -4 -4 q0 -4 4 -4 z" fill="var(--site-action-hover)" />
      </g>

      {/* Traffic cone */}
      <g>
        <path d="M176 142 L190 96 Q191 92 195 92 Q199 92 200 96 L214 142 Z" fill="var(--site-action)" />
        <path d="M184 118 L206 118 L208 126 L182 126 Z" fill="var(--site-cream)" />
        <rect x="170" y="140" width="50" height="8" rx="4" fill="var(--site-action-hover)" />
      </g>

      <Heart x={212} y={46} s={1.3} />
    </Scene>
  );
}
