# 2026-09-27 — Optional dates get a Clear button, in one shared component

Lutan found on a phone that a diet's end date, once touched, could not be
emptied again. There was no shared date input to fix — 30 bare
`<input type="date">`s — so `src/components/OptionalDateInput.tsx` is new,
and every date the server accepts as blank now uses it: diet and prescription
end dates, maintenance due date, recurring-job end date, shelter friend's
Friend since, project folder date.

- **A visible button, not reliance on the native picker.** Whether a phone's
  picker can return to empty depends on the OS and its version, and nothing
  on the page shows it; desktop Chrome lets you delete the segments, which is
  how it went unnoticed. The button appears only once the field has a value.
- **Required dates stay plain inputs.** A Clear button on a required field
  would offer a state the form then refuses. The remaining date inputs are all
  `required`, or required in practice (the photo uploader's date taken gates
  Upload; the recurring-jobs handover window is validated as two dates).
  Vet-visit appointment dates are `datetime-local` and required. Placement
  end dates are never edited in a date field — rehome and return set them.
- **Uncontrolled callers still work.** Given `defaultValue`, the component
  holds the value itself, so the maintenance and project forms still submit
  through `name`. Cleared, the field submits `""`, which every action's
  `str()` already turns into `null` — no server action changed.
- **Recurring-job Starts/Ends stack below `sm`.** Side by side at 375px the
  End field was 60px wide beside Clear and showed only "31/". The
  shelter-friend date column went from `w-56` to `w-72` for the same reason.
