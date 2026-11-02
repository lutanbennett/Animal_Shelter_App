# After "can't tell", the next Save press offers a reload instead of looping (2026-11-02)

**Fault.** `useWriteForm`/`useWriteCall` keep the write request id after a "couldn't tell" answer (correct:
a fresh id would re-run a write that may already have landed). So every further press re-sent the same id,
got `in_flight`, and showed "couldn't tell" again, for ever, until a reload nobody had been told to do.

**The id is still kept. Nothing here clears it.**

## Candidates for deliverable 3

1. **Disable the button + reload prompt at call sites.** Rejected: 126 files import `use-write-form`, there is
   no shared form-error component, and a hook cannot disable a button it does not render.
2. **Automatic reload.** Rejected: it discards what the person typed, with no warning, on a state that is
   already confusing.
3. **Chosen: the hook itself stops sending.** After a tagged "can't tell" result, the next press sends
   nothing (no request, so no third "can't tell" and no new write), asks `window.confirm` "Reload the page now
   to check? Anything you have typed since will be lost", reloads only on OK, and otherwise returns a
   tagged result with the message "Nothing was sent this time... Reload the page to check". Zero call-site edits:
   `useWriteForm`, `useWriteCall` and the Security screens' `useSecurityWrite` all share `guardWrite`.

## Tagged result

`cannotTell: true` on the result (`src/lib/write-unknown.ts`). `runWriteAction` sets it on its in-flight
answer and the browser's wait limit builds it with `cannotTellResult()`, so the string compare against
`t.common.saveUnknown` is gone from all three hooks. Server-action results are plain objects, so the tag
survives the trip. Callers that only read `.error` are unaffected.

## Found, not fixed

Pressing is only intercepted in the three hooks; a form using plain `useKeptForm` is not on the write wrapper
and is out of scope. The new Thai strings (`saveStillUnknown`, `saveReloadConfirm`) are my own and unreviewed.
