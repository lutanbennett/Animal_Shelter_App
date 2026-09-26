import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import {
  lineLink,
  loadSiteContent,
  socialLinks,
  visitingHoursLines,
  type SiteContent,
} from "@/lib/site/content";
import { hasPublicFriends } from "@/lib/shelter-friends/public";
import { FacebookIcon } from "@/components/FacebookIcon";
import { InstagramIcon } from "@/components/InstagramIcon";
import { MessengerIcon } from "@/components/MessengerIcon";
import { WhatsAppIcon } from "@/components/WhatsAppIcon";
import { XIcon } from "@/components/XIcon";

const heading = "text-base font-bold text-site-on-footer";
const footerLink =
  "flex min-h-11 items-center text-site-on-footer underline-offset-4 hover:text-site-footer-link hover:underline";
const smallLink =
  "flex min-h-11 items-center text-site-on-footer-soft underline-offset-4 hover:text-site-footer-link hover:underline";

/**
 * Footer for every public page (docs/design/, part 1 of the redesign):
 * four columns — the foundation and where to find it, how to reach it,
 * the ways to help, and where to follow it — with Privacy and Staff login
 * at the foot. Reads site_content itself unless the page already has it
 * (the home page does), so a page needs one line to get it. Each contact
 * line shows only when it's set; a column with nothing in it disappears.
 *
 * id="contact" is where the header's "About & contact" lands.
 */
export async function PublicFooter({ content }: { content?: SiteContent | null }) {
  const { t, locale } = await getT();
  const [site, showFriends] = await Promise.all([
    content === undefined ? createClient().then(loadSiteContent) : content,
    hasPublicFriends(),
  ]);
  const hours = visitingHoursLines(locale, site);
  const line = lineLink(site?.contact_line);
  const social = socialLinks(site);
  const phone = site?.contact_phone?.trim();
  const f = t.publicFooter;
  const hasContact = Boolean(
    phone ||
      line ||
      social.messenger ||
      social.whatsapp ||
      site?.contact_email ||
      hours.length > 0,
  );
  // Follow us: places to follow the shelter. Messenger and WhatsApp are
  // ways to talk to it, so they sit under Contact us beside LINE instead.
  const follow = [
    { key: "facebook", href: social.facebook, label: f.facebook, name: "Facebook", Icon: FacebookIcon },
    { key: "instagram", href: social.instagram, label: f.instagram, name: "Instagram", Icon: InstagramIcon },
    { key: "x", href: social.x, label: f.x, name: "X", Icon: XIcon },
  ].filter((link): link is typeof link & { href: string } => Boolean(link.href));

  return (
    <footer
      id="contact"
      className="mt-auto bg-site-footer px-4 py-12 font-site text-[15px] text-site-on-footer sm:px-8 lg:px-16 lg:py-14"
    >
      <div className="mx-auto grid w-full max-w-[1312px] gap-10 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col gap-2.5">
          <span className="font-display text-xl font-bold">{t.home.footerOrgName}</span>
          {site?.contact_address && (
            <span className="whitespace-pre-line leading-relaxed text-site-on-footer-soft">
              {site.contact_address}
            </span>
          )}
          {site?.contact_map_url && (
            <a
              href={site.contact_map_url}
              target="_blank"
              rel="noreferrer"
              className="flex min-h-11 items-center font-semibold text-site-footer-link underline-offset-4 hover:underline"
            >
              {f.openMap} →
            </a>
          )}
        </div>

        {hasContact && (
          <div className="flex flex-col">
            <span className={`${heading} pb-1`}>{f.contact}</span>
            {phone && (
              <a href={`tel:${phone.replace(/\s+/g, "")}`} className={footerLink}>
                {phone}
              </a>
            )}
            {line && (
              <a href={line.href} target="_blank" rel="noreferrer" className={footerLink}>
                LINE: {line.label}
              </a>
            )}
            {social.messenger && (
              <a
                href={social.messenger}
                target="_blank"
                rel="noreferrer"
                aria-label={f.messenger}
                className={`${footerLink} gap-2`}
              >
                <MessengerIcon aria-hidden="true" className="h-5 w-5" />
                Messenger
              </a>
            )}
            {social.whatsapp && (
              <a
                href={social.whatsapp}
                target="_blank"
                rel="noreferrer"
                aria-label={f.whatsapp}
                className={`${footerLink} gap-2`}
              >
                <WhatsAppIcon aria-hidden="true" className="h-5 w-5" />
                WhatsApp
              </a>
            )}
            {site?.contact_email && (
              <a href={`mailto:${site.contact_email}`} className={`${footerLink} break-all`}>
                {site.contact_email}
              </a>
            )}
            {hours.length > 0 && (
              <div className="flex flex-col pt-2 leading-relaxed text-site-on-footer-soft">
                <span className="sr-only">{f.visitingHours}</span>
                {hours.map((h) => (
                  <span key={h}>{h}</span>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col">
          <span className={`${heading} pb-1`}>{f.help}</span>
          <Link href="/adopt" className={footerLink}>{t.adopt.adoptNav}</Link>
          <Link href="/foster" className={footerLink}>{t.adopt.fosterNav}</Link>
          <Link href="/volunteer" className={footerLink}>{t.adopt.volunteerNav}</Link>
          {showFriends && (
            <Link href="/friends" className={footerLink}>{t.shelterFriends.navLabel}</Link>
          )}
          <Link href="/donate" className={footerLink}>{t.adopt.donateNav}</Link>
        </div>

        <div className="flex flex-col">
          {follow.length > 0 && (
            <>
              <span className={`${heading} pb-1`}>{f.followUs}</span>
              {follow.map(({ key, href, label, name, Icon }) => (
                <a
                  key={key}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={label}
                  className={`${footerLink} gap-2`}
                >
                  <Icon aria-hidden="true" className="h-5 w-5" />
                  {name}
                </a>
              ))}
            </>
          )}
          <div className="flex flex-wrap gap-x-4 pt-4 lg:mt-auto">
            <Link href="/privacy" className={smallLink}>{t.privacy.nav}</Link>
            <Link href="/login" className={smallLink}>{f.staffLogin}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
