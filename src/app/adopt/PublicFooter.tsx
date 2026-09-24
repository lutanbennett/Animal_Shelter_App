import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import {
  lineLink,
  loadSiteContent,
  visitingHoursLines,
  type SiteContent,
} from "@/lib/site/content";
import { hasPublicFriends } from "@/lib/shelter-friends/public";

/**
 * Footer for every public page: how to find and reach the shelter, and
 * the ways to help. Reads site_content itself unless the page already
 * has it (the home page does), so a page needs one line to get it.
 */
export async function PublicFooter({ content }: { content?: SiteContent | null }) {
  const { t, locale } = await getT();
  const [site, showFriends] = await Promise.all([
    content === undefined ? createClient().then(loadSiteContent) : content,
    hasPublicFriends(),
  ]);
  const hours = visitingHoursLines(locale, site);
  const line = lineLink(site?.contact_line);
  const f = t.publicFooter;

  return (
    <footer className="mt-auto border-t border-border bg-surface px-6 py-8 text-sm text-muted sm:px-12">
      <div className="mx-auto grid w-full max-w-5xl gap-8 sm:grid-cols-3">
        <div className="flex flex-col gap-2">
          <span className="font-semibold text-foreground">{t.home.footerOrgName}</span>
          {site?.contact_address && (
            <span>
              {site.contact_map_url ? (
                <a
                  href={site.contact_map_url}
                  target="_blank"
                  rel="noreferrer"
                  className="underline hover:text-foreground"
                >
                  {site.contact_address}
                </a>
              ) : (
                site.contact_address
              )}
            </span>
          )}
          {hours.length > 0 && (
            <div className="flex flex-col">
              <span className="text-xs font-medium uppercase tracking-wide">{f.visitingHours}</span>
              {hours.map((h) => (
                <span key={h}>{h}</span>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium uppercase tracking-wide">{f.contact}</span>
          {site?.contact_email && (
            <a href={`mailto:${site.contact_email}`} className="underline hover:text-foreground">
              {site.contact_email}
            </a>
          )}
          {site?.contact_phone && (
            <a
              href={`tel:${site.contact_phone.replace(/\s+/g, "")}`}
              className="underline hover:text-foreground"
            >
              {site.contact_phone}
            </a>
          )}
          {line && (
            <a href={line.href} target="_blank" rel="noreferrer" className="underline hover:text-foreground">
              LINE: {line.label}
            </a>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium uppercase tracking-wide">{f.help}</span>
          <Link href="/adopt" className="hover:text-foreground">{t.adopt.adoptNav}</Link>
          <Link href="/foster" className="hover:text-foreground">{t.adopt.fosterNav}</Link>
          <Link href="/volunteer" className="hover:text-foreground">{t.adopt.volunteerNav}</Link>
          <Link href="/donate" className="hover:text-foreground">{t.adopt.donateNav}</Link>
          <Link href="/our-work" className="hover:text-foreground">{t.adopt.ourWorkNav}</Link>
          {showFriends && (
            <Link href="/friends" className="hover:text-foreground">
              {t.shelterFriends.navLabel}
            </Link>
          )}
        </div>
      </div>
      <div className="mx-auto mt-8 w-full max-w-5xl text-xs">
        <Link href="/privacy" className="hover:text-foreground">{t.privacy.nav}</Link>
      </div>
    </footer>
  );
}
