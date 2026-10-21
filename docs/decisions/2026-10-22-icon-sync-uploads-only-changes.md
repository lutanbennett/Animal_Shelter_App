# Icon sync uploads only what changed

Date: 2026-10-22. Backlog item: the release-time home-icon sync (found during `0.38.2`).

`scripts/sync-home-icons.mjs` used to look up and re-upload all 344 PNGs every release, about 688 Drive
requests, and died on `userRateLimitExceeded` (403) part-way. It now lists each Drive subfolder once
(name, id, `md5Checksum`) and uploads a file only when it is missing or its md5 differs from the PNG just
drawn. All eight files per card are kept (Lutan's answer on fix (b), 2026-10-21).

- **Resumable without a state file.** Drive itself is the manifest: a re-run skips everything already
  correct, so a crash mid-run is recovered by running it again. A mixed folder cannot go unnoticed.
- **Backoff:** rate-limit (403 rate-limit reasons, 429, 5xx) retried up to 6 times, 2 s doubling to 60 s.
- **The error says which fault it is.** A persistent rate limit prints "speed limit, NOT an auth fault";
  a 401/invalid_grant prints that it IS an auth fault.
- **Verified on dev:** second run with nothing changed: 344 unchanged, 0 uploaded. One card altered:
  343 unchanged, 1 updated.

Also finishes the scratch-file rule from #806: `.local/` is gitignored and `CLAUDE.md` now names the
Desktop and `.local/` destinations. The four loose files in `C:\Development` remain Lutan's to clear.
