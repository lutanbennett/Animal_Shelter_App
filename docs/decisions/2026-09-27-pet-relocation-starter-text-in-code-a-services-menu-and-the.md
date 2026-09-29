# 2026-09-27 — Pet relocation: starter text in code, a Services menu, and the caped puppy

- **The generic copy lives in the dictionaries, not in the database.** The
  item says to ship generic text now and let the Director rewrite it. The
  row (0099) was seeded with an empty body, and this stream had no
  migration slot, so the text could not be seeded; typing it into dev and
  production by hand would be two unrecorded writes and the Thai version
  would sit unapproved in the queue. Instead `sitePageStarter()`
  (`SitePageView.tsx`) returns `sitePages.relocationStarter` from the
  visitor's dictionary whenever the row's body is empty — so the page
  reads properly in English and Thai on day one, in every environment,
  with no data step. Settings → Website puts the English starter in the
  empty box with a note saying so, so the Director edits it rather than
  starting blank; nothing is written until she saves, and from then on her
  text (and its queued Thai) replaces the starter entirely. Only
  `relocation` has a starter: the other pages keep "coming soon", which is
  what their items asked for.
- **What the starter does not say.** No licence (number, issuing body,
  required wording), no timelines, no prices: those are claims about a real
  person's service that only she can make. It describes what a move
  involves, in our own words — not Boonma's, which the item cites only as an
  example of scope. Who it is for is phrased as an invitation ("if you are
  moving with a pet of your own, ask us too"), not as a promise.
- **Services is its own menu group** (Lutan, 2026-09-27), not an entry
  under Get involved or About & contact: relocation is something the
  shelter offers the public, not a way to help it, and desexing drives will
  join it. Five top-level entries left the full name "Lanna Care for
  Animals" wrapping onto three lines between 1024 and 1280 px (seen in
  Thai), so the header shows the short name there as it already does on a
  phone.
- **The caped puppy is sketch B, with its pyjamas** (Lutan picked it from
  three: straight flight, carrying a crate, over the globe). Cape and
  collar use `--site-action` / `--site-accent` rather than fixed colours,
  like the loader's laptop, so it is terracotta and forest green on
  production and follows the dev recolour (teal cape) on the test site. No
  emblem, no Superman colours — our character in a generic cape.
