# The Drive mirror skips what Drive cannot export, instead of failing the whole run

**2026-11-04.** Closes `#q4m8t` and `#16mg5`.

## What happened

The mirror's first real run on the Pi, 15:19:17–15:45:10, copied **1,104 of 1,107 files** and the
unit reported `Failed with result 'exit-code'`:

```
drive-mirror: Admin/Bulk Uploads/Upload Photos.pdf: HTTP 400
drive-mirror: Admin/Bulk Uploads/Project Photos.pdf: HTTP 400
drive-mirror: Projects/Rescues/Sanpakwan caged dogs/20260803_115342.jpg: terminated
drive-mirror FAILED: {"new":1104,"changed":0,"same":0,"gone":0,"failed":3,"skipped":0}
```

Three causes, read out of the script rather than guessed:

1. **`isNative()` sent every Google-native file to `/export?mimeType=application/pdf`.** Drive
   exports only the Docs-editors types — Document, Spreadsheet, Presentation, Drawing. A Form, a
   Site, a Jamboard or a Map has no file behind it, and Drive answers `HTTP 400`. The `.pdf` on
   those two names is the mirror's own suffix, which is how we know both were native.
2. **`get()` retried only `401`, `429` and `5xx`**, so a `400` was final on the first attempt — and
   a transport error thrown out of `fetch` or the body stream never reached that loop at all. The
   bare `terminated` is undici's when a connection drops mid-download.
3. **Any non-zero `counts.failed` makes `ok` false and the script exit 1**, so three files out of
   1,107 red the unit.

## The decision

**An un-exportable native type is `skipped`, not `failed`**, and the run's exit code is kept for
things that are actually wrong.

**The fault being fixed is not the two files — it is a light that is always red.** Those two would
have failed every night for ever, so the unit could never again report a real failure. That is worse
than the original problem, and it is the reason this was worth a change rather than a note.

**A dropped download is retried twice**, with the same backoff `get()` already uses for Drive's busy
codes. A `4xx` is still not retried: the file will not appear by asking again.

**A half-written `.part` is removed when a copy fails**, so a retry does not trip on it.

## What was deliberately NOT established

**The two files' actual `mimeType` is still unknown.** The names read like Google Forms, but nobody
has looked, and a name is not evidence.

**The fix is built so that it does not matter.** It allows the four types Drive documents as
exportable and skips everything else native, rather than denying a list of types somebody guessed at.
A new Google file type added next year is skipped and named in the log, not failed.

## The one wording choice, and why it went this way

`#q4m8t` asked whether a permanently un-exportable file should be logged **every** run or **once**.

**Every run**, naming the file and its `mimeType`:

```
drive-mirror: Admin/Bulk Uploads/Upload Photos: skipped, application/vnd.google-apps.form cannot be exported
```

Two lines a night is not noise, and **this is the only place anyone ever learns that something in
Drive is not in the mirror.** Suppressing it after the first run is how that fact gets forgotten —
and the whole point of this change is that the mirror should tell the truth about what it holds.

## Why the helper is its own file

`drive-mirror.mjs` runs its entire sync on import, so nothing inside it can be reached from a test.
`scripts/pi/drive-export.mjs` holds the classification and is covered by
`scripts/pi/drive-export.test.mjs` (8 tests, in `npm test`'s `scripts/pi/*.test.mjs` glob). The
mirror's read-only rule is untouched: every call it makes is still a GET.

## The runbook (`#16mg5`)

The same session was the first end-to-end run of *Drive mirror → One-time setup* on this Pi, and
three gaps each stopped the install dead. All three are now in `docs/pi-hosting.md`, with the reason
beside each, because in every case the obvious fix is the wrong one:

1. **`cryptsetup` is not installed** and step 2 opens with a `cryptsetup` command. Install
   **`cryptsetup-bin`**, not the full package, which would add initramfs hooks and boot-time
   unlocking — exactly what `noauto` exists to refuse — and regenerate the initramfs on a box serving
   production.
2. **The mount point is root-owned and the service runs as the login user.** `chown` plus `chmod 700`
   — `700` because the volume holds medical history and names carers and adopters, the production app
   service runs as that user, and the test service runs as root and must always read Drive.
3. **`cd` on the same line as the `sed` expands the wrong `$PWD`**, writing the wrong
   `WorkingDirectory=` into the unit. The `cd` is its own command, and the printed unit is read before
   continuing.

Plus one improvement that was not a gap: `systemctl start` **`--no-block`**, because the unit is a
`oneshot` with `TimeoutStartSec=6h` and the first sync pulls the whole tree.

## Not done here

Stage 2 of `#svs6c` — measuring the Pi copy against Drive and choosing which is primary — is
untouched and still Lutan's decision.
