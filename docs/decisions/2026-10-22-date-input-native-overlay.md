# The calendar button is the native date input, laid over it (2026-10-22)

**Bug.** On an iPhone the calendar button beside every date box did nothing. Since #603 the
button called `showPicker()` on a native `<input type="date">` that was `sr-only` (1 px,
clipped). iOS Safari is believed to ignore `showPicker()` on a visually hidden input without
throwing, so the `catch` fallback never ran. This is a hypothesis from the code and from how
iOS is known to behave; it has not been measured on a device.

**Fix.** `src/components/DateInput.tsx`: the native input is now absolutely positioned over the
button, full size, `opacity: 0` (not `sr-only`, not `display: none`), so a finger lands on the
real input and iOS opens its own wheel. The visible icon is a non-interactive span under it.
`click` still calls `showPicker()` for desktop browsers, which only open from a script, but
skips it when `(pointer: coarse)` matches so a touch tap is left to the native behaviour.
`min`, `max`, the ISO value and the typed DD/MM/YYYY box are unchanged; the typed box still
carries the range validity message, so a forbidden date is refused as before.

**Measured on dev at 375 px:** the input occupies exactly the button's box, is the top element
at its centre, has opacity 0, keeps `max`, and choosing a date fills the DD/MM/YYYY box; a
date past `max` still gets "Date must be … or earlier." Not measured: a real iPhone, Android.
