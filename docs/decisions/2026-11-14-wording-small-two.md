# 2026-11-14: wording-small-two (#d6xhs, #n2bkc)

**#d6xhs.** `uploads.errors.cannotReadResidentsList` (en) now names the card, not the role: "You do not hold a card that lets you read the residents list." The Thai was left as is on purpose, so the next weekly list shows it as `disagree`. It already reads "your permission cannot…", so the two languages did not say the same thing before either.

**#n2bkc.** Real fault, not a misread sentinel. The `\u0001one\u0001` markers work. The leak was the NUMERIC stand-ins 7, 3 and 1 in `MARKS`: `show()` only swaps the string sentinels, so a second argument printed as a bare "7" (e.g. "Sending file {a} of 7", "Set on {a} by 7"). The numbers are now `Number` objects that still compare as numbers but print as a sentinel, so the list shows {a} {b} {c}. Checked on `--since 2026-11-12`: no bare 7 in the output.
