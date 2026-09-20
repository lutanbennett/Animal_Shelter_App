-- =========================================================================
-- Contacts: Facebook Messenger and WhatsApp alongside LINE, so the contact
-- list can open a chat with whichever app the person actually uses.
-- messenger_id is the Facebook username (the part after m.me/ or
-- facebook.com/); whatsapp is the phone number the WhatsApp account is
-- registered to, kept separate from `phone` because for many people it's
-- a different number (or the same one written internationally). Both are
-- free text like the other contact fields; the link builders in
-- src/lib/contacts/contacts.ts do the normalising.
-- =========================================================================

alter table contacts add column if not exists messenger_id text;
alter table contacts add column if not exists whatsapp text;
