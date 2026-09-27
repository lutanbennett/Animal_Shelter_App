"use client";

import type { CSSProperties } from "react";
import { usePathname } from "next/navigation";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { isPublicPage } from "@/lib/public-paths";

/**
 * The shelter's loading animation: an apricot poodle-cross in orange
 * pyjamas working at a laptop (Lutan, 2026-09-26; drawn for us, not traced
 * from the reference video). Plain SVG with CSS keyframes in globals.css
 * ("Puppy loader") — a few hundred bytes, crisp at any size, and still
 * under prefers-reduced-motion.
 *
 * Three drawings: `PuppyAtLaptop`, the full-colour scene for the public
 * pages, `PuppyGlyph`, a one-colour version that takes the text colour for
 * the staff app's inline waits, and `PuppyOverGlobe`, the same puppy in a
 * cape — not a loader but the International adoption page's hero.
 *
 * Both appear only after a delay (300 ms by default) so a fast navigation
 * or save never flashes them. The delay is CSS rather than a timer, so it
 * works in the first server-rendered HTML before any JavaScript has run.
 */

type Delay = { delayMs?: number };

function delayStyle(delayMs: number): CSSProperties {
  return { "--puppy-delay": `${delayMs}ms` } as CSSProperties;
}

export function PuppyAtLaptop({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 240 160"
      aria-hidden="true"
      focusable="false"
      className={`puppy-art puppy-scene ${className ?? ""}`}
    >
      <defs>
        <pattern id="puppy-pj" width="12" height="12" patternUnits="userSpaceOnUse">
          <circle cx="3" cy="3" r="1.7" fill="var(--puppy-pj-dot)" />
          <circle cx="9" cy="9" r="1.3" fill="var(--puppy-pj-dot2)" />
        </pattern>
      </defs>
      <rect x="8" y="150" width="224" height="3" rx="1.5" fill="var(--site-line-strong)" opacity=".5" />
      <g className="puppy-tail" fill="var(--puppy-fur)">
        <circle cx="32" cy="136" r="9" />
        <circle cx="26" cy="129" r="6.5" />
      </g>
      <path d="M34 150 C30 120 50 100 76 100 C102 100 114 122 112 150 Z" fill="var(--puppy-pj)" />
      <path d="M34 150 C30 120 50 100 76 100 C102 100 114 122 112 150 Z" fill="url(#puppy-pj)" />
      <ellipse cx="56" cy="147" rx="12" ry="5" fill="var(--puppy-fur)" />

      <rect x="142" y="78" width="84" height="64" rx="6" fill="var(--site-ink-soft)" />
      <rect x="148" y="84" width="72" height="52" rx="2.5" fill="var(--site-paper)" />
      <g fill="var(--site-accent)" opacity=".8">
        <ellipse cx="184" cy="106" rx="6" ry="5" />
        <circle cx="176" cy="97" r="2.4" />
        <circle cx="181" cy="93.5" r="2.4" />
        <circle cx="187" cy="93.5" r="2.4" />
        <circle cx="192" cy="97" r="2.4" />
      </g>
      <rect x="161" y="120" width="46" height="6" rx="3" fill="var(--site-accent-soft)" />
      <rect className="puppy-bar" x="161" y="120" width="46" height="6" rx="3" fill="var(--site-accent)" />
      <path d="M128 142 H232 L238 150 H120 Z" fill="var(--site-ink)" />

      <g className="puppy-paw">
        <line x1="100" y1="120" x2="134" y2="143" stroke="var(--puppy-pj)" strokeWidth="13" strokeLinecap="round" />
        <ellipse cx="137" cy="144" rx="8" ry="5.5" fill="var(--puppy-fur)" />
      </g>

      <g className="puppy-head">
        <g fill="var(--puppy-fur)">
          <circle cx="92" cy="66" r="10" />
          <circle cx="103" cy="61" r="11" />
          <circle cx="115" cy="65" r="9" />
          <circle cx="104" cy="86" r="22" />
        </g>
        <ellipse cx="125" cy="95" rx="13" ry="10" fill="var(--puppy-fur-light)" />
        <ellipse cx="137.5" cy="91" rx="4.6" ry="3.6" fill="var(--site-ink)" />
        <path d="M128 101 q4 3 8 -1" fill="none" stroke="var(--site-ink)" strokeWidth="1.6" strokeLinecap="round" />
        <circle cx="113" cy="94" r="4" fill="#e98c7a" opacity=".35" />
        <g className="puppy-eye">
          <circle cx="115" cy="80" r="3.1" fill="var(--site-ink)" />
          <circle cx="116.2" cy="78.8" r="1" fill="#fff" />
        </g>
        <g fill="var(--puppy-fur-shade)">
          <circle cx="92" cy="83" r="10" />
          <circle cx="88" cy="95" r="10" />
          <circle cx="89" cy="107" r="8.5" />
        </g>
      </g>
    </svg>
  );
}

export function PuppyGlyph({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 32"
      aria-hidden="true"
      focusable="false"
      className={`puppy-art puppy-glyph ${className ?? ""}`}
    >
      <g className="puppy-head" fill="currentColor">
        <circle cx="10" cy="11" r="3" />
        <circle cx="14" cy="10" r="3" />
        <circle cx="12" cy="17" r="7" />
        <ellipse cx="18.5" cy="19" rx="4.5" ry="3.4" />
        <circle cx="22.5" cy="17.8" r="1.6" />
      </g>
      <rect x="26" y="7" width="19" height="16" rx="2" fill="none" stroke="currentColor" strokeWidth="2" />
      <rect x="29.5" y="16" width="12" height="3" rx="1.5" fill="currentColor" opacity=".25" />
      <rect className="puppy-bar" x="29.5" y="16" width="12" height="3" rx="1.5" fill="currentColor" />
      <path d="M22 24 H48 L46 27 H24 Z" fill="currentColor" />
    </svg>
  );
}

/**
 * The same puppy in its orange pyjamas and a cape, flying up and away over
 * the curve of the planet with a dotted route trailing back to a pin — the
 * hero of the International adoption page (sketch C, "Over the globe",
 * chosen by Lutan 2026-09-27 and drawn in the pyjamas). Our own character:
 * a cape and a flying pose are generic, so no emblem on the chest and none
 * of Superman's colours — the cape is the site's forest green, the collar
 * and route its terracotta, so the scene follows the dev recolour.
 *
 * Animated like the loader (globals.css, "Puppy loader"): the cape
 * ripples, the body bobs, ear and tail flap, and the route draws itself in
 * from the pin; still, with the route drawn, under reduced motion.
 * Decorative, so hidden from screen readers.
 */
export function PuppyOverGlobe({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 240 160"
      aria-hidden="true"
      focusable="false"
      className={`puppy-art puppy-globe ${className ?? ""}`}
    >
      <defs>
        <pattern id="puppy-pj-globe" width="12" height="12" patternUnits="userSpaceOnUse">
          <circle cx="3" cy="3" r="1.7" fill="var(--puppy-pj-dot)" />
          <circle cx="9" cy="9" r="1.3" fill="var(--puppy-pj-dot2)" />
        </pattern>
        <clipPath id="puppy-globe-planet">
          <circle cx="120" cy="330" r="190" />
        </clipPath>
        {/* The route draws in by growing this mask along it: a dashed line's
            own dash offset is already spent on the dashes. */}
        <mask id="puppy-globe-route" maskUnits="userSpaceOnUse" x="0" y="0" width="240" height="160">
          <path
            className="puppy-route-draw"
            d="M44 146 C40 120 52 96 70 84"
            fill="none"
            stroke="#fff"
            strokeWidth="6"
            strokeLinecap="round"
            pathLength={1}
            strokeDasharray="1"
            strokeDashoffset="0"
          />
        </mask>
      </defs>

      <g className="puppy-cloud" fill="var(--site-paper)" stroke="var(--site-line)" strokeWidth="1.5">
        <path d="M194 16 a9 9 0 0 1 14 -8 a12 12 0 0 1 22 2 a8 8 0 0 1 4 14 h-38 a6 6 0 0 1 -2 -8z" />
      </g>

      <circle cx="120" cy="330" r="190" fill="var(--site-accent-soft)" />
      <g clipPath="url(#puppy-globe-planet)" fill="var(--site-accent)" opacity=".35">
        <path d="M20 150 q20 -14 44 -6 q18 6 12 20 h-60z" />
        <path d="M130 142 q24 -8 40 2 q14 10 34 4 l10 20 h-90z" />
      </g>

      <path
        d="M44 146 C40 120 52 96 70 84"
        fill="none"
        stroke="var(--site-action)"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeDasharray="5 3"
        mask="url(#puppy-globe-route)"
      />
      <circle cx="44" cy="147" r="6" fill="var(--site-action)" opacity=".2" />
      <circle cx="44" cy="147" r="3.6" fill="var(--site-action)" />
      <circle cx="44" cy="147" r="1.4" fill="var(--site-paper)" />

      {/* Placed by the outer group, animated by the inner one: a CSS
          transform would replace a transform attribute on the same element. */}
      <g transform="translate(40 -8) scale(.82)">
        <g className="puppy-fly-body">
          {/* Far legs, behind the body. */}
          <line x1="84" y1="92" x2="54" y2="92" stroke="var(--puppy-fur-shade)" strokeWidth="10" strokeLinecap="round" />
          <line x1="140" y1="98" x2="158" y2="110" stroke="var(--puppy-fur-shade)" strokeWidth="10" strokeLinecap="round" />
          <g className="puppy-tail" fill="var(--puppy-fur)">
            <circle cx="64" cy="94" r="6.5" />
            <circle cx="58" cy="100" r="5" />
          </g>
          <ellipse cx="112" cy="90" rx="44" ry="15.5" fill="var(--puppy-pj)" />
          <ellipse cx="112" cy="90" rx="44" ry="15.5" fill="url(#puppy-pj-globe)" />
          <line x1="80" y1="96" x2="48" y2="102" stroke="var(--puppy-pj)" strokeWidth="11" strokeLinecap="round" />
          <ellipse cx="43" cy="103" rx="7.5" ry="5" fill="var(--puppy-fur)" />
          <line x1="146" y1="96" x2="170" y2="106" stroke="var(--puppy-pj)" strokeWidth="11" strokeLinecap="round" />
          <ellipse cx="175" cy="108" rx="7" ry="5.5" fill="var(--puppy-fur)" />

          <g className="puppy-cape">
            <path
              d="M156 76 C130 64 100 58 70 58 C58 58 48 52 34 51 C42 60 37 67 28 72 C40 78 48 75 57 82 C82 84 116 86 152 84 Z"
              fill="var(--site-accent)"
            />
            <path
              d="M154 80 C124 72 92 70 62 72 C52 72 44 69 36 67 C44 74 52 76 60 80 C90 82 122 83 154 83 Z"
              fill="var(--site-ink)"
              opacity=".18"
            />
          </g>

          {/* The loader's head, moved forward to lead. */}
          <g transform="translate(60 -20)">
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
            <g className="puppy-eye">
              <circle cx="115" cy="80" r="3.1" fill="var(--site-ink)" />
              <circle cx="116.2" cy="78.8" r="1" fill="#fff" />
            </g>
            <g className="puppy-ear" fill="var(--puppy-fur-shade)">
              <circle cx="90" cy="82" r="10" />
              <circle cx="82" cy="90" r="9.5" />
              <circle cx="74" cy="97" r="8" />
            </g>
            {/* A plain collar and tag — nothing on the chest. */}
            <path d="M92 100 Q100 110 112 108" fill="none" stroke="var(--site-action)" strokeWidth="5" strokeLinecap="round" />
            <circle cx="104" cy="113" r="3.4" fill="var(--site-action-hover)" />
          </g>
        </g>
      </g>
    </svg>
  );
}

/**
 * A small inline "puppy + label" for a wait inside a staff page: a slow
 * page, or an upload with no progress bar of its own. `role="status"`, so
 * a screen reader hears the label; the glyph itself is decorative.
 */
export function InlineLoader({
  label,
  delayMs = 300,
  className,
}: { label?: string; className?: string } & Delay) {
  const { t } = useI18n();
  return (
    <span
      role="status"
      style={delayStyle(delayMs)}
      className={`puppy-delay inline-flex items-center gap-2 text-sm text-muted ${className ?? ""}`}
    >
      <PuppyGlyph className="h-5 w-auto shrink-0 text-primary" />
      <span>{label ?? t.common.loading}</span>
    </span>
  );
}

/**
 * The glyph alone, for inside a button whose own text already says what is
 * happening ("Uploading..."): decorative, and only after a second, so a
 * quick save never shows it and a slow upload visibly hasn't stalled.
 */
export function PendingPuppy({ delayMs = 1000 }: Delay) {
  return (
    <span style={delayStyle(delayMs)} className="puppy-delay inline-flex">
      <PuppyGlyph className="h-4 w-auto" />
    </span>
  );
}

/**
 * The route-level loading UI (src/app/loading.tsx). A public page gets the
 * full scene centred on the site's cream — `data-public-site` switches the
 * page to the public palette while the real header is still on its way —
 * and a staff page gets the inline glyph where its content will be, with
 * the app's header and sidebar still in place: no full-screen overlay.
 */
export function PageLoader() {
  const pathname = usePathname();
  const { t } = useI18n();

  if (!isPublicPage(pathname)) {
    return (
      <main className="flex-1 p-4 sm:p-6">
        <InlineLoader />
      </main>
    );
  }

  return (
    <main
      data-public-site
      className="flex min-h-[70vh] flex-1 items-center justify-center bg-site-cream px-4 font-site text-site-ink-muted"
    >
      <div
        role="status"
        style={delayStyle(300)}
        className="puppy-delay flex flex-col items-center gap-3"
      >
        <PuppyAtLaptop className="w-48 sm:w-60" />
        <span className="text-base">{t.common.loading}</span>
      </div>
    </main>
  );
}
