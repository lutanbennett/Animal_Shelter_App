# Dev fixtures for driving controls in the pane

Dev data is disposable. This is how to get back to a state where per-row controls render, and what is still missing.
Measured 2026-11-11 on the shared dev database (stream `control-drive-fixtures`, port 3007).

## What exists

| Fixture | State | How it was made |
|---|---|---|
| Enclosures with residents | Already there (`Front Zone 2`, `Blue Enclosure 5 (Hallway)`; residents Test 1 `R-8473`, Test 2 `R-8472`, Flip Check Dog `R-FLIP1`) | pre-existing |
| A resident with a usable photo | Test 1 (`R-8473`), one approved private-only photo `fixture-dog-dev.jpg` | `/photos/add` as the Admin dev login, tagged Test 1, then `/photos/approve` > **Private only** |
| A bill waiting to be matched | One in the `/bills` inbox, `fixture-bill-dev.png` | `/bills` > Add bills (file input) |
| A Shelter Friend | **Not made** | still to do |
| A diet row / `/operations/*` rows | **Not made** | still to do |

## The upload trick (the pane cannot pick a file)

On a page with a `<input type=file>`, in `javascript_tool`: draw a canvas, `toBlob`, wrap it in a `File`, put it in a
`DataTransfer`, assign `input.files = dt.files`, dispatch a `change` event. Drive accepts it. A bill takes about 15 s to
finish uploading; `/photos/add` tags straight away and the photo then waits on `/photos/approve`.

## Pane gotchas met on the way

- `window.next.router.push('/path')` is a client-side navigation, so it avoids the direct-load hydration problem.
- After switching a cookie, `requestAnimationFrame` did not fire until a `screenshot` woke the pane.
- A new photo is invisible to the meme maker until it is approved (`approved_at` not null).
- Signing in as a second login means pasting that login's snippet again; the snippet is about 3 KB and is expensive each time.

## To get back here

1. `node scripts/dev-signin.mjs admin --port <yours>`, paste the snippet, then upload as above.
2. For the meme end-to-end use `node scripts/dev-signin.mjs --cards meme_add --port <yours>`.
