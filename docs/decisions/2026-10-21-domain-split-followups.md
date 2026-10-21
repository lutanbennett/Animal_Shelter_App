# Domain split follow-ups: Staff login, the manual, the auth sender

Follows `2026-10-20-two-addresses-from-settings.md`. Built on `claude/domain-split-followups`.

- **Staff login is an absolute link.** `staffLoginHref()` in `src/lib/site-hosts.ts`
  returns `https://<APP_HOST>/login` when the addresses differ and `/login` when they are
  equal or unset, so today nothing changes. Used by the public footer and the phone menu
  (both now plain `<a>`, since the target is another site). No address is written in `src/`.
- **The public header's signed-in states** ("Open the app", "Sign out") can no longer be
  reached on the public address once split: the session cookie belongs to the app address.
  They are **kept, not deleted**: they are reachable today (one address everywhere), and
  the app address still serves `/` and `/privacy`, where a signed-in visitor can land.
  A comment in `PublicHeader.tsx` records this.
- **`/r/` and `/e/` verified, not rebuilt.** Tag links print the public address through
  `getTagOrigin()` (#786). The signed-out staff hand-off between hosts still has to be
  tested on a real phone before the split is called done (backlog item, unchanged).
- **The manual names no address.** Searched `src/lib/manual/en.ts` for `lannacare` and
  fixed addresses: none. The only hits are `https://` instructions and examples.
- **Auth sender (part 2).** The password-reset sender lives only in Supabase
  (Authentication, SMTP settings); nothing in `src/`, `worker/` or a template writes it.
  The other sender, `RELEASE_MAIL_FROM`, is already a `wrangler.jsonc` var. So the
  Cooper move is: re-verify one domain in Resend, change the SMTP sender in Supabase,
  change `RELEASE_MAIL_FROM`. Listed in `docs/domain-checklist.md`.
- **Reset-mail wording: not checked, and I cannot.** The template is stored in the Supabase
  dashboard, not in this repo, so I could not read it. Lutan should send himself a reset and
  confirm it names the shelter and says it was asked for from the sign-in page.
- **Not done, and Lutan's:** dropping "UAT" from the sender name in Supabase. Added to the
  checklist (section D) and as a backlog note.
