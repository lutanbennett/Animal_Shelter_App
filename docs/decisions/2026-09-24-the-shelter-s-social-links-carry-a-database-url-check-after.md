# 2026-09-24 — The shelter's social links carry a database URL check after all (0080)

`site_content.facebook_url` and `instagram_url` are the schema half of "Link
to the LCA Facebook page". The brief said to add no URL check constraint
unless the schema already had one, because a database rule that disagrees
with the form's validator is a trap. The schema does have one: 0076 puts
`~* '^https?://'` on `shelter_friends.facebook_url` and `website_url`, and
`src/lib/links/validate.ts`, the validator this feature will reuse, names
that check as the last line against a `javascript:` link. So 0080 uses the
same check, word for word.

- **It cannot disagree with the form, because it is strictly looser.** The
  validator allows only https URLs on the right host, and it saves what
  `URL.toString()` gives back. That value always starts `https://`. The
  database refuses only what has no http(s) scheme. The host rule stays in
  one place, the validator.
- **No back-fill.** `site_content` is a singleton, so the columns appear on
  its one row as NULL, which means "no icon". The harness checks that every
  other value on the row is unchanged.
