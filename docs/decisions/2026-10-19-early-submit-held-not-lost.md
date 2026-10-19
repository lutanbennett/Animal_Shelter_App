# A form submitted before the page loads is held, then sent (2026-10-19)

**Problem.** Forms built on `useKeptForm` submit from `onSubmit`, which exists only after hydration. A tap before that fell back to the browser's own GET: fields in the address bar, nothing saved, no message (Return from hospital, Add zone, Move in the 2026-10-18 dry run).

**Choice: fail safe, once, for every form.** Two options were offered: `method="post"` or a Save that waits. Neither is per-form-safe here (a bare POST to a page route is an error page; a disabled button needs 38 forms edited and still loses a tap). Instead an inline script in the root layout (`src/lib/early-submit-guard.ts`) swallows a submit of any form with no `action` and a GET method until `HydrationMark` reports the page ready, then replays it with `requestSubmit` so the real handler runs. Typed text is never lost. Server-action (POST) forms and forms with a real action URL pass through untouched.

**Sweep.** 38 files use `useKeptForm`, all covered by the guard. Plain `<form>` elements with no action and no handler (filters on `residents/page.tsx`, `EnclosureFilters`) are GET by design; they are also held and replayed, harmless.

**Test.** `src/lib/early-submit-guard.test.mjs` runs the real script against a fake document. Not driven in a real browser with a throttled network.

**Assignee lists.** Archived logins were already excluded. "Test login" is defined as an email on the reserved `.test` domain (`src/lib/auth/test-login.ts`); a real person with only an email stays listed. Anyone already on a job stays visible on that job.
