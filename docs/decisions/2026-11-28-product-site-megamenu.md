# Product site mega menu and sign-in links top right (#pmega, #thvet)

**What.** `src/app/platform/about/ProductNav.tsx` is now a mega menu: an Overview link plus a **Product** disclosure whose panel lists
every feature (name and the first two lines of its band text) and an **About CooperJaidee** column (Overview, and Cooper's page).
The three sign-in links moved from the home page footer to the shared header in `src/app/platform/layout.tsx`, drawn only when
signed out (the signed-in header already shows the email and Sign out). #thvet: the two Thai strings now say การพบสัตวแพทย์.

**Why a native `<details>`.** Every link is in the server HTML, so search engines read it and it opens with no script. The client
part (`ProductMenu.tsx`) only adds Escape (closes, focus back to the button), pressing outside to close, and up/down arrows between
links. It opens on a press, never on hover, so a phone behaves like a mouse.

**Phone: one panel, not a disclosure per group.** Two groups of six and two links fit one scrolling panel at 375 px (checked: no
horizontal scroll, the panel stacks to one column); a disclosure per group would add a second tap for no gain at this size.
Revisit if the feature list grows past about ten.

**Cooper's entry** is drawn only when `cooperHasContent()` is true, and its label is the page's own `heading` line, so the menu never
offers a link to a not-found and carries no invented words. `current="cooper"` now matches a menu key.

**Found, not fixed.** With JavaScript off, every page body (not only the menu) stays hidden in `next dev`: the root
`src/app/loading.tsx` makes the body a streamed Suspense boundary whose swap needs script. The links are in the HTML either way.
Whether a production build streams the product pages the same way was not measured. For the planner to file.
The header sign-in labels are the dictionary's; console edits to the home page's `signIn*` lines no longer reach them (the layout
does not read the home page's rows). Today no console override of those lines exists to lose; not measured on production.
