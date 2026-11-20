/**
 * The product's own brand: the mark, and the mark beside the name.
 *
 * This is the PRODUCT's identity, not a shelter's. It belongs on the platform's
 * own front door and nowhere a visitor is looking for a shelter — a shelter's
 * public site carries that shelter's name and logo, and must keep doing so.
 *
 * The mark is one file for every background, which is why the heart is a real
 * hole (fill-rule="evenodd") rather than a pale shape: whatever is behind it
 * shows through, so on a light ground the heart reads cream and on a dark one it
 * reads dark, with no second variant to keep in step. The ring is currentColor
 * for the same reason — it follows the text it sits beside, in either theme.
 *
 * The flat files on the brand folder (full colour, on-dark, one colour, and the
 * outlined lockup for print) are the same geometry, kept for anything outside
 * the app: a printer, a sign-maker, Google's consent screen.
 */
export function CooperJaideeMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true" focusable="false" className={className}>
      {/* The tag's ring. A thin open circle, so below about 20px it closes up. */}
      <circle cx="50" cy="18" r="8.5" fill="none" stroke="currentColor" strokeWidth="6" />
      {/* The disc with the heart cut out of it, as one path so the hole is a hole. */}
      <path
        fillRule="evenodd"
        fill="#D97706"
        d="M50 30 A32 32 0 1 1 50 94 A32 32 0 1 1 50 30 Z M50 80 C36 70.5 32 64.5 32 59 A9.6 9.6 0 0 1 50 54.5 A9.6 9.6 0 0 1 68 59 C68 64.5 64 70.5 50 80 Z"
      />
    </svg>
  );
}

/**
 * The horizontal lockup: the mark, then the name. For a header bar, where the
 * stacked version ("Cooper" over "Jaidee") would not fit without growing the bar.
 *
 * The name is live text in the display face, not an image or an outline, so it
 * stays sharp at any size, can be selected, and costs no extra request. The gap
 * is about half the mark's width, which is the spacing the brand sheet sets.
 *
 * `label` is what a screen reader hears for the whole block, and it comes from
 * the dictionary — the name itself is artwork and is not translated, but the
 * sentence around it is.
 */
export function CooperJaideeLockup({ label }: { label: string }) {
  return (
    <span role="img" aria-label={label} className="flex items-center gap-2 text-foreground sm:gap-2.5">
      <CooperJaideeMark className="h-10 w-10 shrink-0" />
      <span aria-hidden="true" className="font-display text-xl font-bold leading-none tracking-tight">
        CooperJaidee
      </span>
    </span>
  );
}
