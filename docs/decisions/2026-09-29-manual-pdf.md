# 2026-09-29 — The manual as a PDF: signed-in only, role-scoped by default

Backlog: "Manual as a printable PDF". Route: `GET /manual/pdf`
(`src/app/manual/pdf/route.ts`), rendering by `src/lib/manual/manual-pdf.tsx`.

## Who can reach it

Signed-in users only, exactly like `/manual`. The backlog item names
"volunteers without a login" as the audience, but the manual describes the
staff app (screens, role powers, admin settings) and `/manual` is behind the
session gate today. Making the PDF public would publish the manual by the
back door, which is a scope change, not an implementation detail — so the
route stays inside the gate (`proxy.ts` sends a signed-out request to
`/login`) and the paper copy is printed *by* someone who can sign in and
handed on. Opening it up later is a one-line change to `public-paths.ts` and
a decision for Lutan.

## Role-aware or whole

Both, on one route: it opens on the reader's role, as `/manual` does, and
`?view=all` gives every topic (the office-wall copy). A user with no manual
role gets everything. The page's link keeps whichever view it is showing.

## Screenshots

`public/manual` is ~11.7 MB across 44 PNGs, so a full-manual PDF with
pictures is large. The default keeps them (a manual without pictures is a
weaker paper copy); `?images=0` leaves them out, and the page offers it as
"Without screenshots". Images are drawn at most 420pt tall, and only the
ones for the topics in the copy are fetched (from the `ASSETS` binding on
the Worker, from the origin in dev).

## Thai

There is no Thai manual yet. `renderManualPdf` takes a `Manual`, and the
embedded Noto Sans Thai already covers both scripts, so a `th.ts` edition is
a matter of passing it in.
