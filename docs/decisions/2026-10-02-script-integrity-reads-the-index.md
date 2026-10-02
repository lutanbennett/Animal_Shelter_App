# The script-integrity guard reads modes from git's index, and says what it skips

2026-10-02. `scripts/check-script-integrity.mjs`, CI job `script-integrity`.

Two things reached `main` in one week because nothing checked `scripts/`: a
syntax error in `deploy.mjs` (#302, CI green: typecheck, lint and build never
load it) and `spare-clone.sh` committed `100644` while `spare-clone.service`
runs it directly (systemd needs the bit, and the timer would have failed
silently).

- **The mode comes from `git ls-files -s`, not the filesystem.** What went wrong
  is the committed mode. A Windows working tree reports every file the same
  way regardless, and a CI checkout only reflects what git recorded, so reading
  the index fails on exactly the state that reached `main` and cannot be fooled
  by the platform. The `.service` text is read from the index too (`git show :path`).
- **The syntax check uses `node --check` on every tracked `scripts/**/*.mjs`**
  (git `:(glob)` pathspec; the plain `scripts/**/*.mjs` silently matched only
  subfolders, which showed up when a deliberately broken `gates.mjs` passed).
- **Scope is what the repo contains, printed on every run:** `ExecStart=` only
  (not `ExecStartPre`, drop-ins), `.sh` first words only (an interpreter in front
  needs no bit), `__REPO__/` stripped to a repo path, absolute paths elsewhere
  noted and skipped, `.mjs` only for syntax. Widen it when the repo grows a case
  it misses, not before.
- **Failure names the file, the mode it has, and the remedy**
  (`git update-index --chmod=+x <file>`), noting that a clean `git status` proves
  nothing on Windows.
- Its own CI job, not a step in `check`, so it cannot collide with other edits
  to that job and a red one says which class failed.
