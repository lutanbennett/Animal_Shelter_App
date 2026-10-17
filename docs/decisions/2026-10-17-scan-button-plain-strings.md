# The scan button gets plain strings, not the dictionary (2026-10-17)

`/medical/photos` and `/medical/weight` crashed with *"Functions cannot be passed directly to Client Components"* whenever they were opened with no resident chosen, which is the only way in from the nav.

## The real boundary

The backlog item blamed `<ResidentPicker t={t}>`. That call is harmless: `ResidentPicker.tsx` has no `"use client"`, so it is a server component and may take `t`. The boundary is the line inside it, `<ScanCardButton t={t} …>`: `ScanCardButton.tsx` **is** `"use client"`, and `t` (`Dictionary`, 775 arrow-function values in `en.ts`, likewise `th.ts`) can never cross into it. Changing only the call the item named would have left the crash where it was.

## It is a regression from #685, proved

`ScanCardButton.tsx` arrived in `55047db6` ("Scan card: Web NFC in the resident picker", 2026-10-16, `claude/name-card-scanning`). Before it the picker was server-only, so `t` was legal everywhere. The earlier handover said "may or may not be a regression"; it is one.

## What changed

- `src/app/medical/scan-card-strings.ts` (new, deliberately **not** `"use client"`): `ScanCardStrings`, the eight plain strings the button shows, and `scanCardStrings(t)`, which picks them from `t.medicalJobs.picker`.
- `ScanCardButton` takes `strings: ScanCardStrings` instead of `t`. `ResidentPicker` passes `scanCardStrings(t)`.
- The helper lives in its own file because a server component cannot call a function exported from a `"use client"` file.

**Why an explicit object rather than spreading `t.medicalJobs.picker`:** the picker group also holds functions (`photoAlt(name)`). A spread would have worked today and failed the day someone added another function to it, at runtime on a phone. With a named type, a function-valued key does not typecheck.

## The rest of the call chain

Both pages read. `weight/page.tsx` passes `t` at the `ResidentPicker` call and to `WeighFirstList`: both server components, both fine. The only client components reachable are `ScanCardButton` (fixed), `WeightKeypad` (props: `residentId`, `replacing`) and `MedicalPhotoUploader` (prop: `residentId`): plain values, nothing to change.

`ResidentPicker` is also imported by client forms (`ClinicVisitForm`, `ImmunizationForm`, `DonationForm`, `FeaturedResident`, `AddPhotosFlow`). Inside a client module it is just client code, so `t` is not serialised there; they did not crash and are untouched.

## Guard: not built

A rule that refuses a function-valued prop at *every* client boundary is not a cheap typecheck here: a `Dictionary` passes as an ordinary object type, and the check would need a lint rule that knows which files are client components. Half-building it would give false comfort, so it is filed on the `backlog` branch. What is in place is the narrow `ScanCardStrings` type, which guards this one boundary.

## Verified

As an admin on dev, from the nav with nothing chosen, both pages open in English and Thai with a clean console. With a stubbed Web NFC reader "reading" a card for R-0036, Scan card opened `?resident=…` for **Kame, R-0036**, the resident the card named, with name and code shown for checking before saving. A real card on a real phone is still for a person (test plan).
