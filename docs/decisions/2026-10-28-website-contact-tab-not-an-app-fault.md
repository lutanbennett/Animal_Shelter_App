# The Contact tab "saves nothing" on a direct load: not an app fault (2026-10-28)

Backlog item: *Settings → Website, the Contact tab SAVES NOTHING when the page is opened directly*.
A diagnosis stream; **no code changed, no migration, no release note.**

## Answer

On dev, in **real Chrome**, every tab of `/admin/website` hydrates fully on a direct load, and the Contact tab's Save works as a
button. The fault seen by #1001 was the **built-in browser pane**, not the app.

## What I measured

Dev server on :3003, `dev-signin.mjs admin`, each tab loaded directly by its address, then counting buttons that carry React's
`__react…` property (a button without it was never hydrated):

| Tab | Built-in browser pane | Real Chrome |
|---|---|---|
| contact | no button hydrated, 15 forms all `method=get` | all 13 Save buttons hydrated |
| home | no tab button hydrated | 101 of 101 hydrated |
| pages, donate, gallery, projects | not loaded in the pane | 101 of 101 hydrated each |

The same pane also failed to hydrate `/admin/diets` on a direct load, a page nobody has reported, so it is not this page.

## Cause

In the pane, `requestAnimationFrame` **never fires** (measured: a callback waited 3 s and never ran; `document.visibilityState` was
`visible`). React streams a page's body inside a Suspense boundary and swaps it in with an inline `$RC(...)` call that waits on
`requestAnimationFrame`. The swap stayed pending (`<template id="B:0">` still in the document), the page's own client chunks were never
requested, and only the layout (header, sign-out) hydrated. Un-hydrated forms are plain HTML forms with no `action`, so Save submits as a
GET with every field in the address bar. Clicking the tab from another tab is a client-side navigation and never uses that swap, which is
why it worked.

The "hypothesis" in the item (a component throwing during hydration, or `tab` rendering a different tree) is **not** supported: the console
showed no hydration error, and the server HTML for every tab is complete. The only console errors were a `getComputedStyle` TypeError from
the browser extension, not the app.

## Not established

- **Production was not loaded.** I could not sign in there, so whether production behaves like dev is not established. The cause above
  needs no app code, so there is no reason to expect a difference, but that is reasoning, not a reading.
- The Contact Save was not pressed in Chrome, only that its button is wired.
- A real phone or Safari was not tried.

## Why nothing was changed

There is no app fault to fix. A plain GET fallback on an un-hydrated form is how server-rendered forms behave without JavaScript, and a
guard for a pane whose animation frames are broken would test the pane. Making the failure *loud* would mean changing every form in the
app, which the brief rules out as a redesign; I did not do it.

## For the planner

- The function-valued-props guard (Architecture) is **unrelated**: no prop error was seen.
- Any future "page does not hydrate on a direct load" report from the built-in browser pane: first run
  `requestAnimationFrame(()=>0)` and see whether it fires. If not, retest in Chrome before suspecting the app.
- `docs/card-access-faults.md`: #1001's row about this can be closed with a pointer here; I left it for the log's owner.
