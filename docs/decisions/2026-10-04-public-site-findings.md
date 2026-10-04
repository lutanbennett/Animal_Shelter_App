# 2026-10-04 — Public site findings: F-16 Staff login in the phone menu, F-11 remainder

**F-16 — where the door goes.** "Staff login" was the last footer link, about
6.7 screens down on a phone. It is now also in the full-screen phone menu, in
the slot "Open the app" / "Sign out" already use for a signed-in visitor: below
the language toggle, above Talk to us, plain muted text rather than a button.
That keeps it off the four entries and clear of Donate, so a visitor never
mistakes it for something offered to them. Measured at 375 × 812: the menu
link sits at the very bottom edge (top 798 px) — one short scroll inside the
menu — against ~5,245 px for the footer link.

Not added on a laptop: the header there has the language switch, Donate and a
short page; the footer link is a brief scroll, and a staff link beside Donate
would compete with the one thing the header asks for. The signed-in cases are
unchanged. The finding's end-to-end journey, signing in and landing on the
device's home (#345), needs a real staff login and is left for a person.

**F-11 — what code can do about public text in Thai.** The Foster, Volunteer
and Donate bodies are data, edited on /admin/website and translated at
Management → Translations; the code already shows the approved Thai text when
there is one. What it did badly was show English with Thai chrome and no
explanation. `sitePageText` now reports `bodyIsOriginal` (reader not on
English, body still the original) and `SitePageView` shows one Thai note, in
the same spirit as the Release notes and Manual notice of
2026-10-04-staff-wording-and-thai: say it plainly, name LINE/phone for Thai
help. The note disappears by itself when a Thai body is approved. F-11 stays
open: someone still has to write those texts.
