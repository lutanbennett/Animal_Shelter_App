// The class every free-text box on the resident forms shares.
//
// Three things, each for a phone at 375 px (backlog, Lutan 2026-10-07):
// - `text-base` below `md`: iPhone Safari zooms the page in when a field with
//   type under 16 px is tapped, which is "it resizes and then lets me scroll
//   left and right" — and a refresh clears it. 16 px stops the zoom.
// - `w-full min-w-0`: `field-sizing-content` sizes the WIDTH to the content as
//   well as the height, so a long placeholder can ask for more than the
//   column. Pinned to the column, the height still grows with what is typed.
// - `min-h-32` below `md`: starts the box tall enough to look like somewhere
//   to write a sentence. From `md` up `rows` sets the starting height as before.
// `resize-y` so a drag handle cannot widen it either.
export const textareaClass =
  "rounded border border-border bg-surface px-3 py-2 text-base md:text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/40 field-sizing-content w-full min-w-0 min-h-32 md:min-h-0 resize-y";
