# Contacts: list first, New contact on its own page, details as icons (2026-10-17)

Two backlog items, one PR, both on Management → Contacts.

- **Own page, not a drop-down.** New contact opens `/management/contacts/new`: works with the phone back button, can be linked, keeps the list page short. It reuses `CreateContactForm`; a `listHref` prop adds Cancel and the redirect. Guard is `contacts.directory`, the same as the `createContact` action (the brief said "same permission as adding today"; `contacts.add` only gates the inline carer picker). Everyone who can open the list can add, so the button needs no extra check. Registered in PINNED in `check-permission-catalogue.mjs`.
- **Save goes back to the list** with "Added: <name>" (`?added=`), because the list is where the new row shows. The action now also returns the name.
- **Icons: reused, not redrawn.** `ContactActions` (already on `/contacts`) has the five methods in the fixed order, built from the existing `telHref`/`lineHref`/`messengerHref`/`whatsappHref`/`mailtoHref` (a method with no safe link shows nothing), 44 px on a phone, label + value in `aria-label` and tooltip. The table uses it with `showMap={false}`. The three phone/email/messaging columns became one "Contact" column; Edit still shows every box, and the contact page still writes everything out.
- **Brand marks not drawn.** lucide has none and hand-drawing the LINE/Messenger/WhatsApp logos risked wrong glyphs; the icons stay the app's existing set (distinguished by aria-label/tooltip). Follow-up if Lutan wants real logos.
- **Staff `/contacts` directory:** already shows the same icon row (and a written line only from `md`), so no change; the two lists now match.
- **LINE caveat** (backlog: How carers share LINE and Messenger) is unchanged: the icon follows whatever `lineHref` does.
