import type { ReactNode } from "react";

/**
 * Four scenes for the public site's page photos (Donate, Foster, Volunteer,
 * About): the same apricot poodle-cross in orange pyjamas as the loader and
 * the International adoption hero, drawn for us. They fill an empty photo
 * slot beside the page heading. Same 240x160 viewBox as `PuppyOverGlobe`;
 * fur and pyjamas are fixed colours, everything else is a `--site-*` token.
 * Decorative, so hidden from screen readers; the scenes are still, so there
 * is nothing to switch off under reduced motion.
 */

type Props = { className?: string };

function Scene({ id, className, children }: { id: string; className?: string; children: ReactNode }) {
  return (
    <svg viewBox="0 0 240 160" aria-hidden="true" focusable="false" className={`puppy-art puppy-page ${className ?? ""}`}>
      <defs>
        <pattern id={`puppy-pj-${id}`} width="12" height="12" patternUnits="userSpaceOnUse">
          <circle cx="3" cy="3" r="1.7" fill="var(--puppy-pj-dot)" />
          <circle cx="9" cy="9" r="1.3" fill="var(--puppy-pj-dot2)" />
        </pattern>
      </defs>
      {children}
    </svg>
  );
}

/** The loader's head, facing right, drawn around (104, 86) in its own space. */
function Head({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  return (
    <g transform={`translate(${x - 104 * scale} ${y - 86 * scale}) scale(${scale})`}>
      <g fill="var(--puppy-fur)">
        <circle cx="92" cy="66" r="10" />
        <circle cx="103" cy="61" r="11" />
        <circle cx="115" cy="65" r="9" />
        <circle cx="104" cy="86" r="22" />
      </g>
      <ellipse cx="125" cy="95" rx="13" ry="10" fill="var(--puppy-fur-light)" />
      <ellipse cx="137.5" cy="91" rx="4.6" ry="3.6" fill="var(--site-ink)" />
      <path d="M127 100 q5 4 10 -1" fill="none" stroke="var(--site-ink)" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="113" cy="94" r="4" fill="#e98c7a" opacity=".35" />
      <circle cx="115" cy="80" r="3.1" fill="var(--site-ink)" />
      <circle cx="116.2" cy="78.8" r="1" fill="#fff" />
      <g fill="var(--puppy-fur-shade)">
        <circle cx="90" cy="82" r="10" />
        <circle cx="82" cy="90" r="9.5" />
        <circle cx="74" cy="97" r="8" />
      </g>
      <path d="M92 100 Q100 110 112 108" fill="none" stroke="var(--site-action)" strokeWidth="5" strokeLinecap="round" />
      <circle cx="104" cy="113" r="3.4" fill="var(--site-action-hover)" />
    </g>
  );
}

/** A sitting body in pyjamas, side-on, facing right, with a tail behind. */
function Sitting({ id, x, y }: { id: string; x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <g fill="var(--puppy-fur)">
        <circle cx="-34" cy="14" r="7" />
        <circle cx="-40" cy="8" r="5.5" />
      </g>
      <ellipse cx="0" cy="0" rx="30" ry="26" fill="var(--puppy-pj)" />
      <ellipse cx="0" cy="0" rx="30" ry="26" fill={`url(#puppy-pj-${id})`} />
      <line x1="14" y1="14" x2="22" y2="38" stroke="var(--puppy-pj)" strokeWidth="11" strokeLinecap="round" />
      <ellipse cx="24" cy="42" rx="8" ry="5" fill="var(--puppy-fur)" />
      <ellipse cx="-14" cy="28" rx="14" ry="8" fill="var(--puppy-fur-shade)" />
    </g>
  );
}

function Heart({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <path
      transform={`translate(${x} ${y}) scale(${s})`}
      d="M0 4 C-8 -3 -4 -10 0 -5 C4 -10 8 -3 0 4 Z"
      fill="var(--site-action)"
    />
  );
}

/** Donate: a coin drops towards a food bowl while the puppy waits beside it. */
export function PuppyDonate({ className }: Props) {
  return (
    <Scene id="donate" className={className}>
      <ellipse cx="120" cy="146" rx="108" ry="8" fill="var(--site-accent-soft)" />
      <Sitting id="donate" x={72} y={104} />
      <Head x={108} y={68} />
      {/* The bowl, full of kibble, and a coin on its way in. */}
      <g>
        <path d="M156 118 H222 C220 142 208 148 189 148 C170 148 158 142 156 118 Z" fill="var(--site-accent)" />
        <ellipse cx="189" cy="118" rx="33" ry="7" fill="var(--site-ink)" opacity=".2" />
        <g fill="var(--puppy-fur-shade)">
          <circle cx="172" cy="116" r="5" />
          <circle cx="184" cy="113" r="5" />
          <circle cx="197" cy="115" r="5" />
          <circle cx="208" cy="117" r="4.5" />
        </g>
        <path d="M166 150 H212" stroke="var(--site-accent)" strokeWidth="5" strokeLinecap="round" />
      </g>
      <g>
        <circle cx="189" cy="62" r="15" fill="var(--site-action)" />
        <circle cx="189" cy="62" r="10.5" fill="none" stroke="var(--site-paper)" strokeWidth="2" />
        <path d="M185 62 h8 M189 56 v12" stroke="var(--site-paper)" strokeWidth="2.4" strokeLinecap="round" />
        <path d="M189 84 v10 M189 100 v6" stroke="var(--site-action)" strokeWidth="2.2" strokeLinecap="round" strokeDasharray="1 7" opacity=".6" />
      </g>
      <Heart x={222} y={38} s={1.4} />
    </Scene>
  );
}

/** Foster: the puppy curled up and safe on a sofa in a home. */
export function PuppyFoster({ className }: Props) {
  return (
    <Scene id="foster" className={className}>
      <ellipse cx="120" cy="148" rx="108" ry="7" fill="var(--site-accent-soft)" />
      {/* A window with a lamp-warm glow, so it reads as indoors. */}
      <rect x="22" y="14" width="56" height="46" rx="4" fill="var(--site-accent-soft)" stroke="var(--site-line)" strokeWidth="2" />
      <path d="M50 14 v46 M22 37 h56" stroke="var(--site-line)" strokeWidth="2" />
      <path d="M190 28 l-8 24 h32 l-8 -24 z" fill="var(--site-action)" opacity=".85" />
      <path d="M198 52 v28" stroke="var(--site-ink-soft)" strokeWidth="3" />
      {/* Sofa. */}
      <rect x="20" y="78" width="200" height="56" rx="14" fill="var(--site-accent)" />
      <rect x="10" y="92" width="34" height="46" rx="12" fill="var(--site-accent)" />
      <rect x="196" y="92" width="34" height="46" rx="12" fill="var(--site-accent)" />
      <rect x="44" y="108" width="152" height="32" rx="8" fill="var(--site-ink)" opacity=".16" />
      <rect x="40" y="104" width="160" height="30" rx="8" fill="var(--site-accent)" />
      <rect x="44" y="110" width="152" height="3" rx="1.5" fill="var(--site-paper)" opacity=".35" />
      <line x1="30" y1="140" x2="30" y2="148" stroke="var(--site-ink-soft)" strokeWidth="5" strokeLinecap="round" />
      <line x1="210" y1="140" x2="210" y2="148" stroke="var(--site-ink-soft)" strokeWidth="5" strokeLinecap="round" />
      {/* Curled up, chin on the arm. */}
      <ellipse cx="108" cy="96" rx="52" ry="24" fill="var(--puppy-pj)" />
      <ellipse cx="108" cy="96" rx="52" ry="24" fill="url(#puppy-pj-foster)" />
      <g fill="var(--puppy-fur)">
        <circle cx="60" cy="100" r="8" />
        <circle cx="54" cy="94" r="6" />
      </g>
      <ellipse cx="134" cy="112" rx="22" ry="7" fill="var(--puppy-fur-shade)" />
      <Head x={166} y={86} scale={0.86} />
      <path d="M70 66 q4 -10 14 -8 q-2 10 -14 8 z" fill="var(--site-accent)" opacity=".5" />
      <Heart x={118} y={52} s={1.5} />
      <Heart x={140} y={40} s={1} />
    </Scene>
  );
}

/** Volunteer: the puppy with a lead in its mouth, ready for a walk. */
export function PuppyVolunteer({ className }: Props) {
  return (
    <Scene id="volunteer" className={className}>
      <ellipse cx="120" cy="146" rx="108" ry="8" fill="var(--site-accent-soft)" />
      <Sitting id="volunteer" x={84} y={104} />
      <Head x={120} y={68} />
      {/* A lead from the mouth, looped down to a paw-print tag. */}
      <path
        d="M148 74 C170 82 176 106 160 122 C150 132 136 128 140 114"
        fill="none"
        stroke="var(--site-action)"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <circle cx="140" cy="112" r="4" fill="none" stroke="var(--site-action-hover)" strokeWidth="2.2" />
      {/* A badge: paw print and a heart for helping. */}
      <g transform="translate(196 54)">
        <circle r="26" fill="var(--site-paper)" stroke="var(--site-line)" strokeWidth="2" />
        <g fill="var(--site-accent)">
          <ellipse cx="0" cy="6" rx="9" ry="7.5" />
          <circle cx="-11" cy="-4" r="3.6" />
          <circle cx="-4" cy="-11" r="3.6" />
          <circle cx="4" cy="-11" r="3.6" />
          <circle cx="11" cy="-4" r="3.6" />
        </g>
      </g>
      <Heart x={226} y={96} s={1.2} />
    </Scene>
  );
}

/** About: the puppy in front of the shelter. */
export function PuppyAbout({ className }: Props) {
  return (
    <Scene id="about" className={className}>
      <ellipse cx="120" cy="148" rx="108" ry="7" fill="var(--site-accent-soft)" />
      {/* The shelter: a low building with a roof, door, window and heart sign. */}
      <rect x="96" y="56" width="128" height="86" rx="3" fill="var(--site-paper)" stroke="var(--site-line)" strokeWidth="2" />
      <path d="M88 60 L160 20 L232 60 Z" fill="var(--site-action)" />
      <path d="M96 60 L160 26 L224 60" fill="none" stroke="var(--site-action-hover)" strokeWidth="2" />
      <rect x="146" y="98" width="28" height="44" rx="14 14 0 0" fill="var(--site-accent)" />
      <rect x="108" y="82" width="26" height="24" rx="3" fill="var(--site-accent-soft)" stroke="var(--site-line)" strokeWidth="2" />
      <rect x="186" y="82" width="26" height="24" rx="3" fill="var(--site-accent-soft)" stroke="var(--site-line)" strokeWidth="2" />
      <circle cx="160" cy="46" r="9" fill="var(--site-paper)" />
      <Heart x={160} y={46} s={1.1} />
      {/* A tree behind the puppy. */}
      <rect x="22" y="94" width="6" height="50" fill="var(--site-ink-soft)" />
      <circle cx="25" cy="84" r="22" fill="var(--site-accent)" />
      <circle cx="14" cy="96" r="14" fill="var(--site-accent)" />
      <Sitting id="about" x={92} y={110} />
      <Head x={128} y={74} />
    </Scene>
  );
}

export const PAGE_PUPPIES = {
  donate: PuppyDonate,
  foster: PuppyFoster,
  volunteer: PuppyVolunteer,
  about: PuppyAbout,
} as const;
