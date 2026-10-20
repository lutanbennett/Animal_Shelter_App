# Meme maker: resident search is its own small component (2026-10-20)

`ResidentPicker` is a modal that matches name and Thai name only and has no photo or R-code, so it did not fit an inline
search that must also match R-codes and show photo and location. The Residents tab uses `ResidentSearch`
(`src/app/memes/make/`) instead; `ResidentPicker` is untouched for its other users. With nothing typed, residents
whose approved photos were uploaded most recently come first (from the latest 400 approved resident attachments).
Zone and enclosure filters were left out: the search already matches the place by eye, and they were not cheap.
