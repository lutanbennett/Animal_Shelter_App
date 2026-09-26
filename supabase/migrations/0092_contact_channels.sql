-- More ways to contact the shelter: Facebook Messenger, WhatsApp and X
-- (backlog, "More ways to contact the shelter: Facebook Messenger, WhatsApp
-- and X (Twitter)", Lutan 2026-09-26). Schema half only; the app does not
-- read these columns yet. The feature half adds them to /admin/website and
-- to the public contact block and footer.
--
-- Three optional fields on the site_content singleton, next to phone / LINE
-- (0059) and Facebook / Instagram (0080). They appear on its one row as
-- NULL, "not set", and the site shows nothing for them. Nothing is
-- back-filled: the shelter's handles are theirs to type, not ours to guess.
--
--   messenger_url    An https://m.me/<page> link. Its own field rather than
--                    derived from facebook_url, because a page's name and its
--                    Messenger handle can differ.
--   whatsapp_number  The NUMBER, not a link: international format, digits
--                    only, no "+" or spaces (66812345678). The feature renders
--                    https://wa.me/<digits>, which is the only form wa.me
--                    accepts, and a stored number can also be shown as a
--                    number. The form strips "+", spaces and dashes before
--                    saving. 7–15 digits: E.164's maximum is 15.
--   x_url            A profile link on x.com or twitter.com.
--
-- The link checks are 0080's, for 0080's reason: the last line against a
-- `javascript:` link reaching a public href. They are deliberately looser
-- than the form (src/lib/links/validate.ts owns the host rule), so the two
-- can never disagree. The WhatsApp check is the equivalent for a number:
-- nothing but digits can reach the wa.me URL.
--
-- Additive and nullable; no RLS or grant change — site_content's
-- public-read / admin-update policies (0018) and its table-level grants
-- (0077) cover new columns. Re-runnable: every statement is guarded.

alter table site_content add column if not exists messenger_url text
  check (messenger_url ~* '^https?://');
alter table site_content add column if not exists whatsapp_number text
  check (whatsapp_number ~ '^[0-9]{7,15}$');
alter table site_content add column if not exists x_url text
  check (x_url ~* '^https?://');

comment on column site_content.messenger_url is
  'The shelter''s Facebook Messenger link (https://m.me/<page>). Null = not shown.';
comment on column site_content.whatsapp_number is
  'The shelter''s WhatsApp number, international format, digits only (66812345678); the site links https://wa.me/<number>. Null = not shown.';
comment on column site_content.x_url is
  'The shelter''s X (Twitter) profile, on x.com or twitter.com. Null = not shown.';

notify pgrst, 'reload schema';
