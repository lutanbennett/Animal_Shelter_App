# 2026-09-26 — More contact channels: Messenger, WhatsApp, X

- **WhatsApp stores the number, renders the link.** `site_content.whatsapp_number`
  (0092) holds digits only, country code first (`66812345678`); the site builds
  `https://wa.me/<digits>`, the only form wa.me accepts. `checkWhatsAppNumber`
  (`src/lib/links/validate.ts`) strips `+`, spaces, dashes, dots and brackets
  before checking, so a pasted `+66 81 234 5678` saves as `66812345678`, and
  refuses a leading 0: no country code starts with 0, so that is a local number
  ("081 …") wa.me cannot open. The form shows the stored number back with its
  `+`. It is labelled plain "WhatsApp" on the site rather than showing the
  number: the digits without spacing read badly, and the phone line above it
  usually shows the same number properly spaced.
- **Messenger accepts m.me and messenger.com**, not facebook.com: a Facebook page
  link opens the page, not a chat. **X accepts x.com and twitter.com**, since
  both still resolve.
- **Where each landed.** Talking and following are split. Messenger and WhatsApp
  are ways to talk to the shelter, so they go under *Contact us* in the footer
  (after LINE) and are chat buttons in the phone menu's *Talk to us* panel, in the
  order LINE, Call, Messenger, WhatsApp (LINE stays the filled one; an odd last
  button takes the full row). X goes with Facebook and Instagram under *Follow
  us*: in the footer, and as a new icon row at the foot of the phone menu, which
  until now had no social links at all — so Facebook and Instagram reach phones
  there for the first time too. There is no separate About & contact page: that
  nav entry is `#contact`, the footer, so the footer is that page.
- The Facebook hint on /admin/website said it also showed "at the top of every
  public page"; that went with the redesign's header (#137), so the hint now
  names the footer and phone menu.
