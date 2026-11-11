# 2026-11-11 — Why the blank Folder dropdown on /photos/add stopped happening (`#40oz4` part B)

**Verdict: Not established — with part A's hardening as the leading candidate.**

**What he saw (2026-11-07):** a Folder dropdown that looked blank. On 2026-11-10 he reported Admin on production showing it with all choices, and a Volunteer on Test showing no dropdown (one folder: the code draws a sentence, not a control, by design, `AddPhotosFlow.tsx` `categories.length > 1`).

**Part A's diff (PR #1382, `7a2e0f0a`), read in full for this control.** It did touch it, in two hunks:
1. `<option>` now carries `className="bg-surface text-foreground"`. Before, options had no colours of their own. A browser whose native popup ignores `color-scheme` can draw light text on a light list: every option reads as blank, and the closed select can look empty. That is a mechanism that fits "blank dropdown", and it is why this is the leading candidate.
2. `value` is forced to a folder the login actually holds (`categories.includes(folder) ? folder : categories[0]`). That could only matter for a login whose folder list is empty, which no card set today produces.

**Why it is not "Part A fixed it".** Nobody ever saw the blank control with their own eyes before the change and then not after. Part A's author could not reproduce it either ("NOT REPRODUCED … cause not established"). So hunk 1 is a plausible cause, not a demonstrated one. **Why it is not "hydration false fault by elimination" either:** part A did touch the control, so elimination does not apply.

**Ruled out (not re-run):** a missing dictionary string (`enumLabel` falls back to the raw value); four card-shaped causes (measured 2026-11-08).

**What I did this time:** read the diff and the current code only. I did not re-drive the page: the control is unchanged since part A, and the item forbids changing it without a genuine blank reproduction. **No code changed.**

**What would settle it:** Lutan opening `/photos/add` as a multi-folder login on the phone that showed it on 2026-11-07, in both light and dark mode. If it is still blank there, it is a real fault: take the item's option (a), fix the rendering and keep the control, because hiding it would take Medical, Foster and Adoption from logins that legitimately have them.

**A sentence for the next stream, telling a real blank control from an un-hydrated one:** an un-hydrated page has *no working buttons anywhere* and `requestAnimationFrame(()=>0)` never fires; a genuinely blank select sits on a page where everything else responds, and `document.querySelector('select').options` still lists the labels (if the options have text, it is a colour/popup problem, not a data one).
