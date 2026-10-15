# Public page photos: the no-photo state, blank alt text, and a 0201 after all

**Empty state.** A Donate, Foster or Volunteer page with no photo chosen shows its heading across the
full width, exactly as it did before — no grey box, no placeholder art. All three pages have no
photo today, so this is what the Director sees first, and it is the layout that shipped in #637.
A placeholder would look like something missing; nothing missing is the more deliberate look.
The admin picker says so in its subtitle.

**Blank alt text.** A chosen photo with no description renders `alt=""`, which screen readers skip.
Never a filename, never the page title repeated. The Thai reader gets the Thai description, else
the English (`pairedText`).

**A bad file id.** The photo is a plain `<img>` through the Drive proxy inside a tinted rounded box;
a refused id leaves that empty box with no broken-image icon (alt is empty) rather than an error.
The page, heading and text are unaffected.

**Migration 0201.** The brief said this stream carries no migration, but `0200` deliberately left the
columns out of the `public_site_content` view (anon reads only named columns) and out of
`is_public_drive_file` (the photo proxy refuses any file not on a public view). Without both, a
signed-out visitor sees no photo at all. Lutan chose to add `0201` in this PR rather than split it.
It is additive and appends the nine columns to the end of the view.
