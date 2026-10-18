# Resident hub photo viewer is a small separate component

**Decided 2026-10-18** (`resident-photo-lightbox`). The backlog item said to reuse
`PhotoGallery`'s viewer. That one is a light card with delete, move and
set-as-profile, entangled with the gallery's state — not a dark full-screen view.
Lifting it out would have meant reworking the Photos section, which the brief ruled
out. So `src/components/PhotoViewer.tsx` is a read-only viewer (whole image,
arrows/swipe, X/Escape/backdrop/back-gesture, no actions), mounted from
`ResidentHub`. `PhotoGallery` is untouched; the two dialogs could be merged later.

**Medical photos.** `residents/[id]/page.tsx` drops the Medical folder with
`isMedicalFolder` before the list reaches the hub. The Photos tab has no such
filter (it shows every folder to those allowed to open it); the hub viewer does.
The profile photo is always first, even if it were filed Medical, because it is
already on screen in the header.
