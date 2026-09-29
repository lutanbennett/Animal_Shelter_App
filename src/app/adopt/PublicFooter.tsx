import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { preferredChannels, talkChannels } from "@/lib/site/channels";
import { loadSiteContent, socialLinks, visitingHoursLines, type SiteContent } from "@/lib/site/content";
import { hasPublicFriends } from "@/lib/shelter-friends/public";
import { FacebookIcon } from "@/components/FacebookIcon";
import { InstagramIcon } from "@/components/InstagramIcon";
import { MessengerIcon } from "@/components/MessengerIcon";
import { WhatsAppIcon } from "@/components/WhatsAppIcon";
import { XIcon } from "@/components/XIcon";

const heading = "text-base font-bold text-site-on-footer";
const CHANNEL_ICONS = {
  messenger: MessengerIcon,
  whatsapp: WhatsAppIcon,
  instagram: InstagramIcon,
} as const;

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
  const social = socialLinks(site);
  // Contact us in the shelter's order (LINE first unless they chose
  // otherwise); Instagram is a follow link below unless they chose it.
  const contact = talkChannels(preferredChannels(site), { email: true });
  const f = t.publicFooter;
  const hasContact = contact.length > 0 || hours.length > 0;
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
            {contact.map((c) => {
              const external = c.external ? { target: "_blank", rel: "noreferrer" } : {};
              switch (c.channel) {
                case "phone":
                  return (
                    <a key={c.channel} href={c.href} className={footerLink}>
                      {c.value}
                    </a>
                  );
                case "email":
                  return (
                    <a key={c.channel} href={c.href} className={`${footerLink} break-all`}>
                      {c.value}
                    </a>
                  );
                case "line":
                  return (
                    <a key={c.channel} href={c.href} {...external} className={footerLink}>
                      LINE: {c.value}
                    </a>
                  );
                default: {
                  const Icon = CHANNEL_ICONS[c.channel];
                  return (
                    <a
                      key={c.channel}
                      href={c.href}
                      {...external}
                      aria-label={f[c.channel]}
                      className={`${footerLink} gap-2`}
                    >
                      <Icon aria-hidden="true" className="h-5 w-5" />
                      {t.contactChannels.name[c.channel]}
                    </a>
                  );
                }
              }
            })}
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
          <Link href="/" className={footerLink}>{t.publicNav.home}</Link>
          <Link href="/adopt" className={footerLink}>{t.adopt.adoptNav}</Link>
          <Link href="/adopt/international" className={footerLink}>{t.adopt.internationalNav}</Link>
          <Link href="/foster" className={footerLink}>{t.adopt.fosterNav}</Link>
          <Link href="/volunteer" className={footerLink}>{t.adopt.volunteerNav}</Link>
          {showFriends && (
            <Link href="/friends" className={footerLink}>{t.shelterFriends.navLabel}</Link>
          )}
          <Link href="/friends/join" className={footerLink}>{t.publicNav.becomeFriend}</Link>
          <Link href="/donate" className={footerLink}>{t.adopt.donateNav}</Link>
          {/* Services (f.services) comes back with its first entry — desexing
              drives; it went empty when Pet relocation came off the site. */}
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
